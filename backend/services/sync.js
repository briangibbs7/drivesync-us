import { Client } from 'ssh2';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { query } from '../db.js';
import { logger } from '../logger.js';

const DATA_DIR = process.env.DATA_DIR || '/var/lib/drivesync';

// ─── SSH/SFTP Connection Helper ────────────────────────────────────────
export function createConnection(server) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    const config = {
      host: server.host,
      port: server.port || 22,
      username: server.username || 'root',
      readyTimeout: 15000,
      keepaliveInterval: 10000,
    };

    // Support key-based or password auth
    if (server.credential) {
      // Check if it looks like a private key
      if (server.credential.includes('BEGIN') && server.credential.includes('KEY')) {
        config.privateKey = server.credential;
      } else {
        config.password = server.credential;
      }
    }

    // Also check for agent auth (useful with Tailscale + ssh-agent)
    if (!server.credential) {
      config.agent = process.env.SSH_AUTH_SOCK;
    }

    conn.on('ready', () => resolve(conn));
    conn.on('error', (err) => reject(err));
    conn.connect(config);
  });
}

// ─── Get SFTP session from connection ──────────────────────────────────
export function getSFTP(conn) {
  return new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) reject(err);
      else resolve(sftp);
    });
  });
}

// ─── Test connection to a server ───────────────────────────────────────
export async function testConnection(server) {
  let conn;
  try {
    conn = await createConnection(server);
    const sftp = await getSFTP(conn);

    // Try to list the remote path
    const files = await new Promise((resolve, reject) => {
      sftp.readdir(server.remote_path || '/', (err, list) => {
        if (err) reject(err);
        else resolve(list);
      });
    });

    // Get disk info via exec
    let diskInfo = null;
    try {
      diskInfo = await new Promise((resolve, reject) => {
        conn.exec(`df -B1 ${server.remote_path || '/'} | tail -1`, (err, stream) => {
          if (err) { resolve(null); return; }
          let data = '';
          stream.on('data', (chunk) => { data += chunk; });
          stream.on('close', () => {
            const parts = data.trim().split(/\s+/);
            if (parts.length >= 4) {
              resolve({ total: parseInt(parts[1]), used: parseInt(parts[2]), available: parseInt(parts[3]) });
            } else { resolve(null); }
          });
        });
      });
    } catch (e) { /* non-critical */ }

    conn.end();
    return {
      success: true,
      fileCount: files.length,
      remotePath: server.remote_path || '/',
      disk: diskInfo,
    };
  } catch (err) {
    if (conn) conn.end();
    return { success: false, error: err.message };
  }
}

// ─── List remote directory ─────────────────────────────────────────────
export async function listRemoteDir(server, remotePath) {
  let conn;
  try {
    conn = await createConnection(server);
    const sftp = await getSFTP(conn);
    const dirPath = remotePath || server.remote_path || '/';

    const files = await new Promise((resolve, reject) => {
      sftp.readdir(dirPath, (err, list) => {
        if (err) reject(err);
        else resolve(list);
      });
    });

    conn.end();

    return files.map(f => ({
      name: f.filename,
      path: path.posix.join(dirPath, f.filename),
      isDir: f.attrs.isDirectory(),
      size: f.attrs.size,
      modified: new Date(f.attrs.mtime * 1000).toISOString(),
      permissions: f.attrs.mode,
    })).sort((a, b) => {
      // Folders first, then alphabetical
      if (a.isDir && !b.isDir) return -1;
      if (!a.isDir && b.isDir) return 1;
      return a.name.localeCompare(b.name);
    });
  } catch (err) {
    if (conn) conn.end();
    throw err;
  }
}

// ─── Download a single file from remote ────────────────────────────────
export async function downloadFile(server, remotePath, localDir, orgId, userId) {
  let conn;
  try {
    conn = await createConnection(server);
    const sftp = await getSFTP(conn);

    const fileName = path.basename(remotePath);
    const fileId = crypto.randomUUID();
    const ext = path.extname(fileName);
    const localPath = path.join(DATA_DIR, 'uploads', orgId, fileId.substring(0, 2), `${fileId}${ext}`);

    await fs.mkdir(path.dirname(localPath), { recursive: true });

    // Get file stats
    const stats = await new Promise((resolve, reject) => {
      sftp.stat(remotePath, (err, s) => err ? reject(err) : resolve(s));
    });

    // Download
    await new Promise((resolve, reject) => {
      sftp.fastGet(remotePath, localPath, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    conn.end();

    // Determine MIME type
    const mimeMap = {
      '.txt': 'text/plain', '.pdf': 'application/pdf', '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif',
      '.svg': 'image/svg+xml', '.webp': 'image/webp',
      '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime',
      '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.zip': 'application/zip',
      '.tar': 'application/x-tar', '.gz': 'application/gzip',
      '.json': 'application/json', '.xml': 'application/xml',
      '.csv': 'text/csv', '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
    };
    const mime = mimeMap[ext.toLowerCase()] || 'application/octet-stream';

    return {
      id: fileId,
      name: fileName,
      localPath: localPath,
      size: stats.size,
      mimeType: mime,
      modified: new Date(stats.mtime * 1000).toISOString(),
    };
  } catch (err) {
    if (conn) conn.end();
    throw err;
  }
}

// ─── Sync a remote directory to DriveSync ──────────────────────────────
export async function syncFromServer(serverId, orgId, userId) {
  const serverRes = await query('SELECT * FROM network_servers WHERE id=$1', [serverId]);
  if (!serverRes.rows.length) throw new Error('Server not found');
  const server = serverRes.rows[0];

  await query("UPDATE network_servers SET sync_status='syncing', status='connected' WHERE id=$1", [serverId]);

  let conn;
  let synced = 0, failed = 0, skipped = 0;

  try {
    conn = await createConnection(server);
    const sftp = await getSFTP(conn);
    const remotePath = server.remote_path || '/';

    // Get all files recursively (1 level for now)
    const files = await new Promise((resolve, reject) => {
      sftp.readdir(remotePath, (err, list) => {
        if (err) reject(err);
        else resolve(list);
      });
    });

    // Get existing synced files to avoid re-downloading
    const existingRes = await query(
      `SELECT name, size, metadata->>'remote_path' as remote_path FROM files
       WHERE org_id=$1 AND metadata->>'sync_server_id' = $2 AND is_trashed=false`,
      [orgId, serverId]
    );
    const existingMap = {};
    existingRes.rows.forEach(f => { existingMap[f.remote_path] = f; });

    // Find or create a folder for this server's synced files
    let parentId = null;
    const folderName = `[Sync] ${server.name}`;
    const folderRes = await query(
      `SELECT id FROM files WHERE org_id=$1 AND name=$2 AND is_folder=true AND parent_id IS NULL`,
      [orgId, folderName]
    );
    if (folderRes.rows.length) {
      parentId = folderRes.rows[0].id;
    } else {
      const newFolder = await query(
        `INSERT INTO files (org_id, name, is_folder, owner_id, metadata)
         VALUES ($1,$2,true,$3,$4) RETURNING id`,
        [orgId, folderName, userId, JSON.stringify({ sync_server_id: serverId })]
      );
      parentId = newFolder.rows[0].id;
    }

    // Sync each file
    for (const file of files) {
      if (file.attrs.isDirectory()) continue; // Skip subdirectories for now

      const rPath = path.posix.join(remotePath, file.filename);
      const existing = existingMap[rPath];

      // Skip if same size (basic dedup)
      if (existing && parseInt(existing.size) === file.attrs.size) {
        skipped++;
        continue;
      }

      try {
        const result = await downloadFile(server, rPath, null, orgId, userId);

        // Insert or update file record
        if (existing) {
          await query(
            `UPDATE files SET size=$1, storage_path=$2, updated_at=NOW() WHERE org_id=$3 AND metadata->>'remote_path'=$4 AND is_trashed=false`,
            [result.size, result.localPath, orgId, rPath]
          );
        } else {
          await query(
            `INSERT INTO files (id, org_id, parent_id, name, mime_type, size, storage_path, owner_id, metadata)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [result.id, orgId, parentId, result.name, result.mimeType, result.size, result.localPath, userId,
             JSON.stringify({ sync_server_id: serverId, remote_path: rPath, synced_at: new Date().toISOString() })]
          );
        }

        // Log sync
        await query(
          `INSERT INTO sync_log (server_id, action, file_path, file_size, status) VALUES ($1,'download',$2,$3,'success')`,
          [serverId, rPath, result.size]
        );

        synced++;
      } catch (err) {
        logger.error(`Sync failed for ${rPath}: ${err.message}`);
        await query(
          `INSERT INTO sync_log (server_id, action, file_path, status, error) VALUES ($1,'download',$2,'error',$3)`,
          [serverId, rPath, err.message]
        );
        failed++;
      }
    }

    conn.end();

    // Update server status
    const totalFiles = files.filter(f => !f.attrs.isDirectory()).length;
    const totalSize = files.filter(f => !f.attrs.isDirectory()).reduce((a, f) => a + f.attrs.size, 0);

    await query(
      `UPDATE network_servers SET sync_status='synced', status='connected', last_sync_at=NOW(),
       file_count=$1, total_size=$2 WHERE id=$3`,
      [totalFiles, totalSize, serverId]
    );

    return { synced, failed, skipped, total: totalFiles };
  } catch (err) {
    if (conn) conn.end();
    await query("UPDATE network_servers SET sync_status='error', status='connected' WHERE id=$1", [serverId]);
    throw err;
  }
}

export default { createConnection, getSFTP, testConnection, listRemoteDir, downloadFile, syncFromServer };
