import { Resend } from 'resend';
import { logger } from '../logger.js';

let resend = null;

function getClient() {
  if (!resend && process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_YOUR_API_KEY_HERE') {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

function isConfigured() {
  return !!(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_YOUR_API_KEY_HERE');
}

const APP_URL = () => process.env.APP_URL || 'http://localhost';
const FROM = () => process.env.EMAIL_FROM || 'DriveSync <noreply@example.com>';
const COMPANY = () => process.env.COMPANY_NAME || 'SyberJet';

// ─── Professional HTML Email Template ──────────────────────────────────
function emailTemplate(opts) {
  const accent = opts.accent || '#2563EB';
  const accentLight = opts.accentLight || '#DBEAFE';
  const title = opts.title || '';
  const preheader = opts.preheader || '';

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<!--[if mso]><style>table,td{font-family:Arial,sans-serif}</style><![endif]-->
</head><body style="margin:0;padding:0;background-color:#F1F5F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased">
<span style="display:none;font-size:1px;color:#F1F5F9;max-height:0;overflow:hidden">${preheader}</span>

<!-- Outer wrapper -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F1F5F9;padding:32px 16px">
<tr><td align="center">

<!-- Card -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">

<!-- Accent bar -->
<tr><td style="height:4px;background:${accent};font-size:0;line-height:0">&nbsp;</td></tr>

<!-- Logo + Company -->
<tr><td style="padding:28px 36px 0">
  <table role="presentation" cellpadding="0" cellspacing="0"><tr>
    <td style="width:40px;height:40px;background:${accent};border-radius:8px;text-align:center;vertical-align:middle">
      <span style="color:#FFFFFF;font-weight:700;font-size:15px;line-height:40px">DS</span>
    </td>
    <td style="padding-left:12px">
      <div style="font-size:16px;font-weight:700;color:#0F172A;line-height:1.2">${COMPANY()}</div>
      <div style="font-size:11px;color:#94A3B8;text-transform:uppercase;letter-spacing:0.5px">Secure File Sharing</div>
    </td>
  </tr></table>
</td></tr>

<!-- Body content -->
<tr><td style="padding:24px 36px 32px">
${opts.body}
</td></tr>

</table>
<!-- End card -->

<!-- Footer -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">
<tr><td style="padding:20px 36px;text-align:center">
  <div style="font-size:11px;color:#94A3B8;line-height:1.5">
    Sent by ${COMPANY()} via <a href="${APP_URL()}" style="color:#94A3B8;text-decoration:underline">DriveSync</a><br>
    You received this because someone shared content with you.
  </div>
</td></tr>
</table>

</td></tr>
</table>
</body></html>`;
}

// ─── Reusable components ───────────────────────────────────────────────
function btn(text, url, color) {
  color = color || '#2563EB';
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 8px"><tr>
    <td style="background:${color};border-radius:8px">
      <a href="${url}" target="_blank" style="display:inline-block;padding:13px 32px;color:#FFFFFF;font-size:14px;font-weight:600;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">${text}</a>
    </td>
  </tr></table>`;
}

function detailTable(rows) {
  let html = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;margin:16px 0">`;
  rows.forEach((r, i) => {
    const border = i < rows.length - 1 ? 'border-bottom:1px solid #E2E8F0;' : '';
    html += `<tr>
      <td style="padding:12px 16px;${border}font-size:13px;color:#64748B;width:120px;vertical-align:top">${r.label}</td>
      <td style="padding:12px 16px;${border}font-size:13px;color:#0F172A;font-weight:500">${r.value}</td>
    </tr>`;
  });
  html += `</table>`;
  return html;
}

function permBadge(perm) {
  const map = {
    view:     { bg: '#DCFCE7', color: '#16A34A', label: 'View Only' },
    download: { bg: '#DBEAFE', color: '#2563EB', label: 'View & Download' },
    edit:     { bg: '#FEF3C7', color: '#D97706', label: 'Full Edit Access' },
  };
  const p = map[perm] || map.view;
  return `<span style="display:inline-block;padding:3px 10px;background:${p.bg};color:${p.color};font-size:11px;font-weight:600;border-radius:12px">${p.label}</span>`;
}

function note(text, type) {
  const colors = {
    warning: { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E', icon: '⚠️' },
    info:    { bg: '#EFF6FF', border: '#BFDBFE', color: '#1E40AF', icon: 'ℹ️' },
    success: { bg: '#F0FDF4', border: '#BBF7D0', color: '#166534', icon: '✓' },
  };
  const c = colors[type] || colors.info;
  return `<div style="background:${c.bg};border:1px solid ${c.border};border-radius:8px;padding:12px 16px;margin:16px 0;font-size:12px;color:${c.color};line-height:1.5">${c.icon} ${text}</div>`;
}

// ─── Portal Invite Email ───────────────────────────────────────────────
export async function sendPortalInvite({ to, customerName, portalName, portalSlug, portalColor, permission, company, projects, password, expiresAt, invitedBy }) {
  if (!isConfigured()) { logger.warn('Email not configured — skipping portal invite'); return { sent: false, reason: 'not_configured' }; }

  const portalUrl = `${APP_URL()}/portal/${portalSlug}`;
  const projectList = projects && projects.length > 0
    ? projects.map(p => `<tr><td style="padding:6px 0;font-size:13px;color:#0F172A"><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${p.color || portalColor || '#2563EB'};margin-right:8px;vertical-align:middle"></span>${p.name}</td></tr>`).join('')
    : '<tr><td style="padding:6px 0;font-size:13px;color:#64748B">All available projects</td></tr>';

  const html = emailTemplate({
    accent: portalColor || '#2563EB',
    title: `You've been invited to ${portalName}`,
    preheader: `${invitedBy || 'An admin'} has invited you to access files and projects`,
    body: `
      <h1 style="font-size:22px;font-weight:700;color:#0F172A;margin:0 0 8px;line-height:1.3">You're Invited</h1>
      <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 4px"><strong style="color:#0F172A">${invitedBy || 'An administrator'}</strong> has invited you to <strong style="color:#0F172A">${portalName}</strong>${company ? ' for <strong style="color:#0F172A">' + company + '</strong>' : ''}.</p>
      <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 16px">You now have access to shared files and documents.</p>

      ${btn('Open Portal →', portalUrl, portalColor || '#2563EB')}

      ${detailTable([
        { label: 'Portal', value: portalName },
        { label: 'Access', value: permBadge(permission) },
        ...(expiresAt ? [{ label: 'Expires', value: new Date(expiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }] : []),
      ])}

      <div style="margin:20px 0 8px;font-size:13px;font-weight:600;color:#0F172A">Your Projects</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:8px 16px">
        ${projectList}
      </table>

      <div style="margin:20px 0 8px;font-size:13px;font-weight:600;color:#0F172A">How to Sign In</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px">
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #E2E8F0;font-size:13px;color:#64748B;width:40px;text-align:center;font-size:16px">1</td>
          <td style="padding:12px 16px;border-bottom:1px solid #E2E8F0;font-size:13px;color:#0F172A">Click <strong>Open Portal</strong> above to visit the login page</td>
        </tr>
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #E2E8F0;font-size:13px;color:#64748B;width:40px;text-align:center;font-size:16px">2</td>
          <td style="padding:12px 16px;border-bottom:1px solid #E2E8F0;font-size:13px;color:#0F172A">Enter your email: <strong style="font-family:'SFMono-Regular',Consolas,monospace">${to}</strong></td>
        </tr>
        <tr>
          <td style="padding:12px 16px;font-size:13px;color:#64748B;width:40px;text-align:center;font-size:16px">3</td>
          <td style="padding:12px 16px;font-size:13px;color:#0F172A">A <strong>verification code</strong> will be sent to your email — enter it to sign in</td>
        </tr>
      </table>

      ${note('Each time you log in, a new verification code will be emailed to you. No password is needed.', 'info')}

      <div style="margin-top:20px;padding-top:16px;border-top:1px solid #E2E8F0">
        <div style="font-size:11px;color:#94A3B8">Portal URL: <a href="${portalUrl}" style="color:#2563EB;text-decoration:none">${portalUrl}</a></div>
      </div>
    `
  });

  try {
    const result = await getClient().emails.send({ from: FROM(), to: [to], subject: `You've been invited to ${portalName}`, html });
    logger.info(`Portal invite sent to ${to}`);
    return { sent: true, id: result.data?.id };
  } catch (e) {
    logger.error(`Failed to send portal invite to ${to}:`, e.message);
    return { sent: false, error: e.message };
  }
}

// ─── Share Link Email ──────────────────────────────────────────────────
export async function sendShareNotification({ to, fileName, sharedBy, permission, expiresAt, shareUrl, hasPassword }) {
  if (!isConfigured()) { logger.warn('Email not configured — skipping share notification'); return { sent: false, reason: 'not_configured' }; }

  const html = emailTemplate({
    title: `${sharedBy} shared a file with you`,
    preheader: `"${fileName}" has been shared with you`,
    body: `
      <h1 style="font-size:22px;font-weight:700;color:#0F172A;margin:0 0 8px;line-height:1.3">File Shared With You</h1>
      <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 16px"><strong style="color:#0F172A">${sharedBy}</strong> has shared a file with you.</p>

      ${detailTable([
        { label: 'File', value: '<strong>' + fileName + '</strong>' },
        { label: 'Permission', value: permBadge(permission) },
        ...(expiresAt ? [{ label: 'Expires', value: new Date(expiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }] : []),
        ...(hasPassword ? [{ label: 'Password', value: '<span style="color:#D97706">Required — provided separately</span>' }] : []),
      ])}

      ${btn('View File →', shareUrl)}

      <div style="margin-top:20px;padding-top:16px;border-top:1px solid #E2E8F0">
        <div style="font-size:11px;color:#94A3B8">Direct link: <a href="${shareUrl}" style="color:#2563EB;text-decoration:none;word-break:break-all">${shareUrl}</a></div>
      </div>
    `
  });

  try {
    const result = await getClient().emails.send({ from: FROM(), to: [to], subject: `${sharedBy} shared "${fileName}" with you`, html });
    logger.info(`Share notification sent to ${to}`);
    return { sent: true, id: result.data?.id };
  } catch (e) {
    logger.error(`Failed to send share notification to ${to}:`, e.message);
    return { sent: false, error: e.message };
  }
}

// ─── Password Reset Email ──────────────────────────────────────────────
export async function sendPasswordReset({ to, name, resetUrl, expiresMinutes }) {
  if (!isConfigured()) { logger.warn('Email not configured — skipping password reset'); return { sent: false, reason: 'not_configured' }; }

  const html = emailTemplate({
    title: 'Reset your password',
    preheader: 'You requested a password reset',
    body: `
      <h1 style="font-size:22px;font-weight:700;color:#0F172A;margin:0 0 8px;line-height:1.3">Reset Your Password</h1>
      <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 4px">Hi ${name || 'there'},</p>
      <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 16px">We received a request to reset your password. Click the button below to choose a new one.</p>

      ${btn('Reset Password →', resetUrl)}

      ${note('This link expires in ' + (expiresMinutes || 60) + ' minutes. If you didn\'t request this, you can safely ignore this email — your password won\'t change.', 'info')}

      <div style="margin-top:20px;padding-top:16px;border-top:1px solid #E2E8F0">
        <div style="font-size:11px;color:#94A3B8">Reset link: <a href="${resetUrl}" style="color:#2563EB;text-decoration:none;word-break:break-all">${resetUrl}</a></div>
      </div>
    `
  });

  try {
    const result = await getClient().emails.send({ from: FROM(), to: [to], subject: 'Reset your password', html });
    logger.info(`Password reset sent to ${to}`);
    return { sent: true, id: result.data?.id };
  } catch (e) {
    logger.error(`Failed to send password reset to ${to}:`, e.message);
    return { sent: false, error: e.message };
  }
}

// ─── User Invite Email ─────────────────────────────────────────────────
export async function sendUserInvite({ to, name, invitedBy, role, orgName, loginUrl }) {
  if (!isConfigured()) { logger.warn('Email not configured — skipping user invite'); return { sent: false, reason: 'not_configured' }; }

  const html = emailTemplate({
    title: `Join ${orgName} on DriveSync`,
    preheader: `${invitedBy} invited you to join the team`,
    body: `
      <h1 style="font-size:22px;font-weight:700;color:#0F172A;margin:0 0 8px;line-height:1.3">You're Invited to Join</h1>
      <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 16px"><strong style="color:#0F172A">${invitedBy}</strong> has invited you to join <strong style="color:#0F172A">${orgName}</strong> as a <strong style="color:#0F172A">${role}</strong>.</p>

      ${btn('Accept Invitation →', loginUrl || APP_URL())}

      ${detailTable([
        { label: 'Organization', value: orgName },
        { label: 'Role', value: '<strong>' + role + '</strong>' },
        { label: 'Email', value: to },
      ])}
    `
  });

  try {
    const result = await getClient().emails.send({ from: FROM(), to: [to], subject: `Join ${orgName} on DriveSync`, html });
    logger.info(`User invite sent to ${to}`);
    return { sent: true, id: result.data?.id };
  } catch (e) {
    logger.error(`Failed to send user invite to ${to}:`, e.message);
    return { sent: false, error: e.message };
  }
}

// ─── Test Email ────────────────────────────────────────────────────────
export async function sendTestEmail(to) {
  if (!isConfigured()) return { sent: false, reason: 'not_configured' };

  const html = emailTemplate({
    title: 'Email Test',
    preheader: 'Your email configuration is working',
    body: `
      <h1 style="font-size:22px;font-weight:700;color:#0F172A;margin:0 0 8px;line-height:1.3">Email Working ✓</h1>
      <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 16px">Your Resend integration is configured correctly. DriveSync will now send notifications for portal invites, file shares, and password resets.</p>
      ${note('This is a test email. No action is required.', 'success')}
    `
  });

  try {
    const result = await getClient().emails.send({ from: FROM(), to: [to], subject: `${COMPANY()} DriveSync — Email Test`, html });
    return { sent: true, id: result.data?.id };
  } catch (e) {
    return { sent: false, error: e.message };
  }
}


// ─── OTP Code Email ────────────────────────────────────────────────────
export async function sendOTPCode({ to, name, code, portalName, expiresMinutes }) {
  if (!isConfigured()) { logger.warn('Email not configured — skipping OTP'); return { sent: false, reason: 'not_configured' }; }

  const html = emailTemplate({
    title: 'Your verification code',
    preheader: 'Your login code is ' + code,
    body: `
      <h1 style="font-size:22px;font-weight:700;color:#0F172A;margin:0 0 8px;line-height:1.3">Your Verification Code</h1>
      <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 20px">${name ? 'Hi ' + name + ', use' : 'Use'} the code below to sign in${portalName ? ' to <strong style="color:#0F172A">' + portalName + '</strong>' : ''}.</p>

      <div style="text-align:center;margin:24px 0">
        <div style="display:inline-block;background:#F8FAFC;border:2px solid #E2E8F0;border-radius:12px;padding:20px 40px">
          <div style="font-size:36px;font-weight:700;color:#0F172A;letter-spacing:8px;font-family:'SFMono-Regular',Consolas,monospace">${code}</div>
        </div>
      </div>

      <p style="font-size:13px;color:#64748B;text-align:center;margin:16px 0">This code expires in <strong>${expiresMinutes || 10} minutes</strong></p>

      <div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:8px;padding:12px 16px;margin:20px 0;font-size:12px;color:#9A3412;line-height:1.5">If you didn't request this code, someone may be trying to access your account. You can safely ignore this email.</div>
    `
  });

  try {
    const result = await getClient().emails.send({ from: FROM(), to: [to], subject: 'Your verification code: ' + code, html });
    logger.info('OTP code sent to ' + to);
    return { sent: true, id: result.data?.id };
  } catch (e) {
    logger.error('Failed to send OTP to ' + to + ':', e.message);
    return { sent: false, error: e.message };
  }
}

export default { sendOTPCode, sendPortalInvite, sendShareNotification, sendPasswordReset, sendUserInvite, sendTestEmail, isConfigured };
