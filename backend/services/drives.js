import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { query } from '../db.js';
import { logger } from '../logger.js';

const execAsync = promisify(exec);
const MOUNT_BASE = '/mnt/drivesync-shares';
const CRED_DIR = '/var/lib/drivesync/smb-credentials';
const DATA_DIR = process.env.DATA_DIR || '/var/lib/drivesync';

// ─── Write SMB credentials file (secure) ───────────────────────────────
async function writeCredentials(driveId, username, password, domain) {
  const credFile = path.join(CRED_DIR, driveId);
  const content = `username=${username}\npassword=${password}\n${domain ? 'domain=' + domain + '\n' : ''}`;
  await fs.writeFile(credFile, content, { mode: 0o600 });
  return credFile;
}

async function removeCredentials(driveId) {
  try { await fs.unlink(path.join(CRED_DIR, driveId)); } catch (e) { /* ok */ }
}

// ─── Mount an SMB share ────────────────────────────────────────────────
export async function mountDrive(drive, password) {
  const mountPoint = path.join(MOUNT_BASE, drive.id);
  await fs.mkdir(mountPoint, { recursive: true });

  // Write credentials
  const credFile = await writeCredentials(drive.id, drive.username || 'guest', password || '', drive.domain || '');

  // Build mount command
  const sharePath = `//${drive.server_host}/${drive.share_name}`;
  const opts = [
    `credentials=${credFile}`,
    'iocharset=utf8',
    'file_mode=0775',
    'dir_mode=0775',
    'uid=drivesync',
    'gid=drivesync',
    'noperm',
    'vers=3.0',
  ];
  if (drive.read_only) opts.push('ro');

  
  // Try SMB versions in order: 3.0, 2.1, 2.0, 1.0
  const versions = ['3.0', '2.1', '2.0', '1.0'];
  let lastErr = null;

  for (const ver of versions) {
    const vopts = opts.map(o => o.startsWith('vers=') ? 'vers=' + ver : o);
    const cmd = `sudo mount -t cifs "${sharePath}" "${mountPoint}" -o ${vopts.join(',')}`;
    try {
      await execAsync(cmd, { timeout: 30000 });
      logger.info(`Mounted ${sharePath} at ${mountPoint} (SMB ${ver})`);
      await query("UPDATE drives SET status='connected', mount_point=$1, settings=jsonb_set(COALESCE(settings,'{}')::jsonb, '{smb_version}', to_jsonb($2::text)) WHERE id=$3", [mountPoint, ver, drive.id]);
      return { success: true, mountPoint, smbVersion: ver };
    } catch (err) {
      lastErr = err;
      logger.warn(`Mount failed with SMB ${ver} for ${sharePath}: ${(err.stderr||err.message).split('\n')[0]}`);
      continue;
    }
  }

  // All versions failed
  await removeCredentials(drive.id);
  await query("UPDATE drives SET status='error' WHERE id=$1", [drive.id]);
  throw new Error(cleanMountError(lastErr.stderr || lastErr.message));

}

function cleanMountError(msg) {
  if (msg.includes('Permission denied') || msg.includes('LOGON_FAILURE')) return 'Authentication failed — check username/password';
  if (msg.includes('No such file') || msg.includes('BAD_NETWORK_NAME')) return 'Share not found — check share name';
  if (msg.includes('Connection timed out') || msg.includes('Host is down')) return 'Server unreachable — check host IP and network';
  if (msg.includes('Connection refused')) return 'Connection refused — is SMB enabled on the server?';
  if (msg.includes('already mounted')) return 'Drive is already mounted';
  return msg.split('\n')[0].substring(0, 200);
}

// ─── Unmount a drive ───────────────────────────────────────────────────
export async function unmountDrive(driveId) {
  const mountPoint = path.join(MOUNT_BASE, driveId);
  try {
    await execAsync(`sudo umount "${mountPoint}"`, { timeout: 15000 });
  } catch (e) {
    // Force unmount if busy
    try { await execAsync(`sudo umount -l "${mountPoint}"`); } catch (e2) { /* ok */ }
  }
  await removeCredentials(driveId);
  try { await fs.rmdir(mountPoint); } catch (e) { /* ok */ }
  await query("UPDATE drives SET status='disconnected', mount_point=NULL WHERE id=$1", [driveId]);
  logger.info(`Unmounted drive ${driveId}`);
}

// ─── Check if a drive is currently mounted ─────────────────────────────
export async function isDriveMounted(driveId) {
  const mountPoint = path.join(MOUNT_BASE, driveId);
  try {
    const { stdout } = await execAsync('mount');
    return stdout.includes(mountPoint);
  } catch (e) {
    return false;
  }
}

// ─── List directory on mounted drive ───────────────────────────────────
export async function browseDrive(driveId, subPath) {
  const mountPoint = path.join(MOUNT_BASE, driveId);
  const fullPath = subPath ? path.join(mountPoint, subPath) : mountPoint;

  // Security: prevent path traversal
  const resolved = path.resolve(fullPath);
  if (!resolved.startsWith(mountPoint)) throw new Error('Invalid path');

  const entries = await fs.readdir(fullPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    // Skip hidden/system files
    if (entry.name.startsWith('.') || entry.name === 'System Volume Information' || entry.name === '$RECYCLE.BIN' || entry.name === 'Thumbs.db' || entry.name === 'desktop.ini') continue;

    try {
      const stat = await fs.stat(path.join(fullPath, entry.name));
      files.push({
        name: entry.name,
        path: subPath ? path.posix.join(subPath, entry.name) : entry.name,
        isDir: entry.isDirectory(),
        size: stat.size,
        modified: stat.mtime.toISOString(),
      });
    } catch (e) {
      // Skip files we can't stat
    }
  }

  return files.sort((a, b) => {
    if (a.isDir && !b.isDir) return -1;
    if (!a.isDir && b.isDir) return 1;
    return a.name.localeCompare(b.name);
  });
}

// ─── Copy a file from mounted drive into DriveSync ─────────────────────
export async function importFile(driveId, filePath, orgId, userId, parentId) {
  const mountPoint = path.join(MOUNT_BASE, driveId);
  const sourcePath = path.join(mountPoint, filePath);

  // Security check
  const resolved = path.resolve(sourcePath);
  if (!resolved.startsWith(mountPoint)) throw new Error('Invalid path');

  const stat = await fs.stat(sourcePath);
  if (stat.isDirectory()) throw new Error('Cannot import a directory — use sync instead');

  const fileName = path.basename(filePath);
  const fileId = crypto.randomUUID();
  const ext = path.extname(fileName);
  const destPath = path.join(DATA_DIR, 'uploads', orgId, fileId.substring(0, 2), `${fileId}${ext}`);

  await fs.mkdir(path.dirname(destPath), { recursive: true });
  await fs.copyFile(sourcePath, destPath);

  const mimeMap = {
    '.txt':'text/plain','.pdf':'application/pdf','.doc':'application/msword',
    '.docx':'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls':'application/vnd.ms-excel','.xlsx':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt':'application/vnd.ms-powerpoint','.pptx':'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.gif':'image/gif','.svg':'image/svg+xml','.webp':'image/webp',
    '.mp4':'video/mp4','.webm':'video/webm','.mov':'video/quicktime',
    '.mp3':'audio/mpeg','.wav':'audio/wav','.zip':'application/zip',
    '.json':'application/json','.xml':'application/xml','.csv':'text/csv','.html':'text/html',
  };
  const mime = mimeMap[ext.toLowerCase()] || 'application/octet-stream';

  return { id: fileId, name: fileName, localPath: destPath, size: stat.size, mimeType: mime };
}

// ─── Scan drive for stats ──────────────────────────────────────────────
export async function scanDrive(driveId) {
  const mountPoint = path.join(MOUNT_BASE, driveId);
  let fileCount = 0;
  let totalSize = 0;

  async function walk(dir) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name === '$RECYCLE.BIN' || entry.name === 'System Volume Information') continue;
        const full = path.join(dir, entry.name);
        try {
          if (entry.isDirectory()) {
            await walk(full);
          } else {
            const stat = await fs.stat(full);
            fileCount++;
            totalSize += stat.size;
          }
        } catch (e) { /* skip */ }
      }
    } catch (e) { /* skip */ }
  }

  await walk(mountPoint);

  await query(
    "UPDATE drives SET file_count=$1, total_size=$2, last_scanned=NOW() WHERE id=$3",
    [fileCount, totalSize, driveId]
  );

  return { fileCount, totalSize };
}

// ─── Test SMB connectivity (without mounting) ──────────────────────────
export async function testSMB(host, shareName, username, password, domain) {
  try {
    // Write temp credentials file to avoid shell escaping issues
    const tmpCred = '/tmp/smb-test-' + Date.now();
    const credContent = 'username=' + username + '\npassword=' + (password || '') + '\n' + (domain ? 'domain=' + domain + '\n' : '');
    await (await import('fs')).promises.writeFile(tmpCred, credContent, { mode: 0o600 });

    const target = shareName ? '//' + host + '/' + shareName : '//' + host;
    const cmd = shareName
      ? 'sudo smbclient "' + target + '" -A ' + tmpCred + ' -c "ls" 2>&1 | head -20'
      : 'sudo smbclient -L "' + target + '" -A ' + tmpCred + ' 2>&1 | head -40';

    let result;
    try {
      const { stdout, stderr } = await execAsync(cmd, { timeout: 15000 });
      const output = stdout + (stderr || '');
      if (output.includes('NT_STATUS_LOGON_FAILURE')) result = { success: false, error: 'Authentication failed' };
      else if (output.includes('NT_STATUS_BAD_NETWORK_NAME')) result = { success: false, error: 'Share not found' };
      else if (output.includes('Connection to') && output.includes('failed')) result = { success: false, error: 'Server unreachable' };
      else if (output.includes('NT_STATUS_')) {
        const match = output.match(/NT_STATUS_\w+/);
        result = { success: false, error: match ? match[0] : 'Connection failed' };
      } else {
        const lines = output.split('\n').filter(l => l.trim() && !l.includes('blocks'));
        result = { success: true, message: 'Connected — ' + lines.length + ' items found' };
      }
    } catch (err) {
      result = { success: false, error: cleanMountError(err.stderr || err.message) };
    }

    // Cleanup temp cred file
    try { await (await import('fs')).promises.unlink(tmpCred); } catch(e) {}
    return result;
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ─── List available shares on a server ─────────────────────────────────
export async function listShares(host, username, password, domain) {
  try {
    const tmpCred = '/tmp/smb-list-' + Date.now();
    const credContent = 'username=' + username + '\npassword=' + (password || '') + '\n' + (domain ? 'domain=' + domain + '\n' : '');
    await (await import('fs')).promises.writeFile(tmpCred, credContent, { mode: 0o600 });

    const cmd = 'sudo smbclient -L "//' + host + '" -A ' + tmpCred + ' 2>&1';
    let shares = [];
    try {
      const { stdout } = await execAsync(cmd, { timeout: 15000 });
      const lines = stdout.split('\n');
      let inShareSection = false;
      for (const line of lines) {
        if (line.includes('Sharename') && line.includes('Type')) { inShareSection = true; continue; }
        if (inShareSection && line.includes('---')) continue;
        if (inShareSection && line.trim() === '') break;
        if (inShareSection) {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 2 && parts[1] === 'Disk') {
            shares.push({ name: parts[0], type: 'Disk' });
          }
        }
      }
    } catch (err) {
      try { await (await import('fs')).promises.unlink(tmpCred); } catch(e) {}
      return { success: false, error: err.message, shares: [] };
    }

    try { await (await import('fs')).promises.unlink(tmpCred); } catch(e) {}
    return { success: true, shares };
  } catch (err) {
    return { success: false, error: err.message, shares: [] };
  }
}


export default { mountDrive, unmountDrive, isDriveMounted, browseDrive, importFile, scanDrive, testSMB, listShares };
