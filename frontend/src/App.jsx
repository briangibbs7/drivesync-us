import React, { useState, useEffect, useCallback, useContext, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   CSS STYLES (defined first to avoid any bundling order issues)
   ═══════════════════════════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --bg-primary:#0B0E14;--bg-secondary:#111620;--bg-tertiary:#171D2A;--bg-elevated:#1C2333;
  --bg-hover:#232B3D;--bg-active:#2A3450;--border:#2A3450;--border-subtle:#1E2740;
  --text-primary:#E8ECF4;--text-secondary:#8B95AB;--text-tertiary:#5C6680;
  --accent:#4F8EF7;--accent-hover:#6BA0FF;--accent-muted:rgba(79,142,247,0.12);
  --success:#34D399;--success-bg:rgba(52,211,153,0.1);--warning:#FBBF24;--warning-bg:rgba(251,191,36,0.1);
  --danger:#F87171;--danger-bg:rgba(248,113,113,0.1);--purple:#A78BFA;
  --radius-sm:6px;--radius:10px;--radius-lg:14px;--radius-xl:20px;
  --shadow:0 4px 16px rgba(0,0,0,0.3);--shadow-lg:0 12px 40px rgba(0,0,0,0.4);
  --transition:180ms ease;--font:'DM Sans',sans-serif;--mono:'JetBrains Mono',monospace;--sidebar-w:260px;
}
body,#root{font-family:var(--font);background:var(--bg-primary);color:var(--text-primary);min-height:100vh}
.app{display:flex;height:100vh;overflow:hidden}
.sidebar{width:var(--sidebar-w);background:var(--bg-secondary);border-right:1px solid var(--border-subtle);display:flex;flex-direction:column;flex-shrink:0;overflow-y:auto}
.sidebar-logo{padding:20px 20px 16px;display:flex;align-items:center;gap:10px;border-bottom:1px solid var(--border-subtle)}
.sidebar-logo-icon{width:34px;height:34px;background:linear-gradient(135deg,var(--accent),var(--purple));border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:white}
.sidebar-logo h1{font-size:16px;font-weight:700;letter-spacing:-0.3px}
.sidebar-logo span{font-size:10px;color:var(--text-tertiary);font-weight:500;text-transform:uppercase;letter-spacing:1px}
.sidebar-section{padding:12px 12px 4px}
.sidebar-label{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1.2px;color:var(--text-tertiary);padding:0 8px;margin-bottom:6px}
.sidebar-user{margin-top:auto;padding:12px 16px;border-top:1px solid var(--border-subtle);display:flex;align-items:center;gap:10px}
.nav-item{display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:var(--radius-sm);cursor:pointer;transition:all var(--transition);color:var(--text-secondary);font-size:13px;font-weight:500;position:relative}
.nav-item:hover{background:var(--bg-hover);color:var(--text-primary)}
.nav-item.active{background:var(--accent-muted);color:var(--accent)}
.nav-item.active::before{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);width:3px;height:20px;background:var(--accent);border-radius:0 3px 3px 0}
.main{flex:1;display:flex;flex-direction:column;overflow:hidden}
.topbar{padding:14px 28px;border-bottom:1px solid var(--border-subtle);display:flex;align-items:center;gap:16px;background:var(--bg-secondary);flex-shrink:0}
.search-box{flex:1;max-width:480px;display:flex;align-items:center;gap:8px;background:var(--bg-tertiary);border:1px solid var(--border-subtle);border-radius:var(--radius);padding:8px 14px;transition:all var(--transition)}
.search-box:focus-within{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-muted)}
.search-box input{border:none;background:none;color:var(--text-primary);font-size:13px;font-family:var(--font);outline:none;width:100%}
.search-box input::placeholder{color:var(--text-tertiary)}
.topbar-actions{display:flex;align-items:center;gap:8px;margin-left:auto}
.topbar-btn{width:36px;height:36px;border-radius:var(--radius-sm);border:1px solid var(--border-subtle);background:var(--bg-tertiary);color:var(--text-secondary);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all var(--transition)}
.topbar-btn:hover{background:var(--bg-hover);color:var(--text-primary)}
.content{flex:1;overflow-y:auto;padding:28px}
.avatar-sm{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:white;flex-shrink:0}
.page-header{margin-bottom:28px;display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px}
.page-title{font-size:22px;font-weight:700;letter-spacing:-0.5px}
.page-subtitle{font-size:13px;color:var(--text-secondary);margin-top:4px}
.btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:var(--radius-sm);font-size:13px;font-weight:500;font-family:var(--font);cursor:pointer;transition:all var(--transition);border:1px solid transparent;white-space:nowrap}
.btn:disabled{opacity:0.5;cursor:not-allowed}
.btn-primary{background:var(--accent);color:white;border-color:var(--accent)}.btn-primary:hover:not(:disabled){background:var(--accent-hover)}
.btn-secondary{background:var(--bg-tertiary);color:var(--text-primary);border-color:var(--border)}.btn-secondary:hover{background:var(--bg-hover)}
.btn-ghost{background:none;color:var(--text-secondary);border:none}.btn-ghost:hover{background:var(--bg-hover);color:var(--text-primary)}
.btn-danger{background:var(--danger-bg);color:var(--danger);border-color:rgba(248,113,113,0.2)}.btn-danger:hover{background:rgba(248,113,113,0.15)}
.btn-sm{padding:5px 10px;font-size:12px}
.btn-icon{padding:6px}
.card{background:var(--bg-secondary);border:1px solid var(--border-subtle);border-radius:var(--radius-lg);overflow:hidden}
.card-header{padding:16px 20px;border-bottom:1px solid var(--border-subtle);display:flex;align-items:center;justify-content:space-between}
.card-title{font-size:14px;font-weight:600}
.card-body{padding:20px}
.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:28px}
.stat-card{background:var(--bg-secondary);border:1px solid var(--border-subtle);border-radius:var(--radius-lg);padding:20px;position:relative;overflow:hidden}
.stat-label{font-size:12px;color:var(--text-tertiary);font-weight:500;text-transform:uppercase;letter-spacing:0.5px}
.stat-value{font-size:28px;font-weight:700;margin:6px 0 2px;letter-spacing:-1px}
.table-wrap{overflow-x:auto}
table{width:100%;border-collapse:collapse}
th{text-align:left;padding:10px 16px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:var(--text-tertiary);border-bottom:1px solid var(--border-subtle)}
td{padding:12px 16px;font-size:13px;border-bottom:1px solid var(--border-subtle)}
tr:hover td{background:var(--bg-hover)}
tr:last-child td{border-bottom:none}
.file-name{display:flex;align-items:center;gap:10px;font-weight:500}
.file-icon{width:34px;height:34px;border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.file-icon.folder{background:rgba(251,191,36,0.12);color:#FBBF24}
.file-icon.document{background:rgba(59,130,246,0.12);color:#3B82F6}
.file-icon.spreadsheet{background:rgba(16,185,129,0.12);color:#10B981}
.file-icon.image{background:rgba(244,114,182,0.12);color:#F472B6}
.file-icon.video{background:rgba(167,139,250,0.12);color:#A78BFA}
.badge{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:20px;font-size:11px;font-weight:600}
.badge-success{background:var(--success-bg);color:var(--success)}
.badge-warning{background:var(--warning-bg);color:var(--warning)}
.badge-danger{background:var(--danger-bg);color:var(--danger)}
.badge-info{background:var(--accent-muted);color:var(--accent)}
.badge-neutral{background:var(--bg-active);color:var(--text-secondary)}
.files-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px}
.file-card{background:var(--bg-tertiary);border:1px solid var(--border-subtle);border-radius:var(--radius);padding:16px;cursor:pointer;transition:all var(--transition)}
.file-card:hover{border-color:var(--accent);transform:translateY(-1px);box-shadow:var(--shadow)}
.file-card-name{font-size:13px;font-weight:500;margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.file-card-meta{font-size:11px;color:var(--text-tertiary)}
.project-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}
.project-card{background:var(--bg-secondary);border:1px solid var(--border-subtle);border-radius:var(--radius-lg);padding:24px;cursor:pointer;transition:all var(--transition);position:relative;overflow:hidden}
.project-card:hover{border-color:var(--border);transform:translateY(-2px);box-shadow:var(--shadow)}
.project-card h3{font-size:15px;font-weight:600}
.project-card-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px}
.project-card-stats{display:flex;gap:16px;margin-top:16px}
.project-stat{font-size:12px;color:var(--text-secondary)}.project-stat strong{color:var(--text-primary);font-weight:600}
.server-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px}
.server-card{background:var(--bg-secondary);border:1px solid var(--border-subtle);border-radius:var(--radius-lg);padding:20px;position:relative}
.server-card.connected{border-left:3px solid var(--success)}.server-card.disconnected{border-left:3px solid var(--danger)}
.server-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px}
.server-name{font-size:14px;font-weight:600}.server-ip{font-size:12px;color:var(--text-tertiary);font-family:var(--mono)}
.server-stats{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}
.server-stat-label{font-size:10px;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.5px}
.server-stat-value{font-size:13px;font-weight:600;margin-top:2px}
.sync-bar{margin-top:14px;height:3px;background:var(--bg-active);border-radius:2px;overflow:hidden}
.sync-bar-fill{height:100%;border-radius:2px;transition:width 2s ease}
.sync-bar-fill.synced{background:var(--success);width:100%}
.sync-bar-fill.syncing{background:var(--accent);width:67%;animation:pulseW 2s infinite}
.sync-bar-fill.error{background:var(--danger);width:35%}
.sync-bar-fill.pending{background:var(--text-tertiary);width:10%}
@keyframes pulseW{0%,100%{opacity:1}50%{opacity:0.5}}
.portal-banner{background:linear-gradient(135deg,var(--bg-tertiary),var(--bg-elevated));border:1px solid var(--border-subtle);border-radius:var(--radius-xl);padding:32px;margin-bottom:24px;position:relative;overflow:hidden}
.portal-banner::before{content:'';position:absolute;top:-50%;right:-20%;width:300px;height:300px;background:radial-gradient(circle,var(--accent-muted),transparent 70%);border-radius:50%}
.portal-banner h2{font-size:20px;font-weight:700;margin-bottom:6px;position:relative}
.portal-banner p{font-size:13px;color:var(--text-secondary);position:relative}
.activity-list{display:flex;flex-direction:column}
.activity-item{display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-bottom:1px solid var(--border-subtle)}
.activity-item:last-child{border-bottom:none}
.activity-icon{width:32px;height:32px;border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;flex-shrink:0;background:var(--bg-tertiary);color:var(--text-secondary)}
.activity-text{font-size:13px;color:var(--text-secondary)}.activity-text strong{color:var(--text-primary);font-weight:500}
.activity-time{font-size:11px;color:var(--text-tertiary);margin-top:2px}
.tabs{display:flex;gap:0;border-bottom:1px solid var(--border-subtle);margin-bottom:24px}
.tab{padding:10px 16px;font-size:13px;font-weight:500;color:var(--text-tertiary);cursor:pointer;border-bottom:2px solid transparent;transition:all var(--transition)}
.tab:hover{color:var(--text-secondary)}.tab.active{color:var(--accent);border-bottom-color:var(--accent)}
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:100;animation:fadeIn .15s ease}
.modal{background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius-xl);width:90%;max-width:520px;max-height:85vh;overflow-y:auto;box-shadow:var(--shadow-lg);animation:slideUp .2s ease}
.modal-wide{max-width:700px}
.modal-header{padding:20px 24px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border-subtle)}
.modal-title{font-size:16px;font-weight:700}
.modal-body{padding:20px 24px}
.modal-footer{padding:16px 24px;border-top:1px solid var(--border-subtle);display:flex;justify-content:flex-end;gap:8px}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.form-group{margin-bottom:14px}
.form-label{display:block;font-size:12px;font-weight:600;color:var(--text-secondary);margin-bottom:6px}
.form-input,.form-select{width:100%;padding:9px 14px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--bg-tertiary);color:var(--text-primary);font-size:13px;font-family:var(--font);outline:none;transition:all var(--transition)}
.form-input:focus,.form-select:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-muted)}
.form-select{cursor:pointer;appearance:none;background-image:url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");background-position:right 10px center;background-repeat:no-repeat;background-size:16px}
.empty-state{text-align:center;padding:60px 20px;color:var(--text-tertiary)}
.empty-state h3{font-size:16px;font-weight:600;color:var(--text-secondary);margin-bottom:8px}
.toast{padding:12px 20px;border-radius:var(--radius);font-size:13px;font-weight:500;box-shadow:var(--shadow-lg);max-width:360px}
.toast-success{background:#065F46;color:#34D399;border:1px solid #10B981}
.toast-error{background:#7F1D1D;color:#FCA5A5;border:1px solid #EF4444}
.toast-info{background:var(--bg-elevated);color:var(--text-primary);border:1px solid var(--border)}
.login-page{min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg-primary)}
.login-card{background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius-xl);padding:40px;width:400px;box-shadow:var(--shadow-lg)}
.login-logo{width:48px;height:48px;background:linear-gradient(135deg,var(--accent),var(--purple));border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:18px;color:white;margin-bottom:12px}
.login-error{background:var(--danger-bg);color:var(--danger);padding:10px 14px;border-radius:var(--radius-sm);font-size:13px;margin-bottom:14px;border:1px solid rgba(248,113,113,0.2)}
::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:var(--bg-active);border-radius:3px}
@media(max-width:900px){
  .sidebar{width:56px}.sidebar-logo h1,.sidebar-logo span,.sidebar-label,.nav-item span,.sidebar-user>div{display:none}
  .sidebar-logo{padding:16px 10px;justify-content:center}.nav-item{justify-content:center;padding:10px}
  .content{padding:16px}.stats-grid{grid-template-columns:1fr 1fr}
}
@media(max-width:600px){.stats-grid{grid-template-columns:1fr}}
`;

/* ═══════════════════════════════════════════════════════════════════════════
   API LAYER
   ═══════════════════════════════════════════════════════════════════════════ */
const API = "/api";
function getToken() { return localStorage.getItem("ds_token"); }

async function apiFetch(path, opts) {
  const o = opts || {};
  const token = getToken();
  const hdrs = {};
  if (token) hdrs["Authorization"] = "Bearer " + token;
  const isForm = o.body instanceof FormData;
  if (!isForm) hdrs["Content-Type"] = "application/json";

  const res = await fetch(API + path, {
    method: o.method || "GET",
    headers: hdrs,
    body: isForm ? o.body : o.body ? JSON.stringify(o.body) : undefined,
  });
  if (res.status === 401) {
    localStorage.removeItem("ds_token");
    window.location.reload();
    return;
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

/* ═══════════════════════════════════════════════════════════════════════════
   CONTEXTS
   ═══════════════════════════════════════════════════════════════════════════ */
const AuthCtx = React.createContext({ user: null, loading: true, login: null, register: null, logout: null });
const NotifyCtx = React.createContext(function noop() {});

function AuthProvider(props) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(function () {
    if (getToken()) {
      apiFetch("/auth/me")
        .then(function (d) { if (d) setUser(d); })
        .catch(function () { localStorage.removeItem("ds_token"); })
        .finally(function () { setLoading(false); });
    } else {
      setLoading(false);
    }
  }, []);

  const login = function (email, password) {
    return apiFetch("/auth/login", { method: "POST", body: { email: email, password: password } })
      .then(function (data) {
        localStorage.setItem("ds_token", data.token);
        return apiFetch("/auth/me");
      })
      .then(function (me) { setUser(me); return me; });
  };

  const register = function (email, password, name, orgName) {
    return apiFetch("/auth/register", { method: "POST", body: { email: email, password: password, name: name, orgName: orgName } })
      .then(function (data) {
        localStorage.setItem("ds_token", data.token);
        return apiFetch("/auth/me");
      })
      .then(function (me) { setUser(me); return me; });
  };

  const logout = function () { localStorage.removeItem("ds_token"); setUser(null); };

  const value = { user: user, loading: loading, login: login, register: register, logout: logout };
  return React.createElement(AuthCtx.Provider, { value: value }, props.children);
}

function NotifyProvider(props) {
  const [notes, setNotes] = useState([]);

  const addNote = useCallback(function (msg, type) {
    var t = type || "info";
    var id = Date.now() + Math.random();
    setNotes(function (prev) { return prev.concat({ id: id, msg: msg, type: t }); });
    setTimeout(function () {
      setNotes(function (prev) { return prev.filter(function (x) { return x.id !== id; }); });
    }, 4000);
  }, []);

  return React.createElement(NotifyCtx.Provider, { value: addNote },
    props.children,
    React.createElement("div", { style: { position: "fixed", bottom: 20, right: 20, zIndex: 999, display: "flex", flexDirection: "column", gap: 8 } },
      notes.map(function (n) {
        return React.createElement("div", { key: n.id, className: "toast toast-" + n.type, style: { animation: "slideUp .2s ease" } },
          n.type === "success" ? "✓ " : n.type === "error" ? "✕ " : "", n.msg);
      })
    )
  );
}

function useAuth() { return useContext(AuthCtx); }
function useNotify() { return useContext(NotifyCtx); }

/* ═══════════════════════════════════════════════════════════════════════════
   ICONS (each is a named function, not an arrow in an object)
   ═══════════════════════════════════════════════════════════════════════════ */
function IconHome() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>; }
function IconFolder() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>; }
function IconFile() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>; }
function IconUsers() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function IconProject() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>; }
function IconShare() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>; }
function IconServer() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>; }
function IconPortal() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>; }
function IconSettings() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>; }
function IconSearch() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>; }
function IconPlus() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function IconUpload() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>; }
function IconDownload() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>; }
function IconStar(props) { return <svg width="16" height="16" viewBox="0 0 24 24" fill={props.filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>; }
function IconTrash() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>; }
function IconGrid() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>; }
function IconList() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>; }
function IconX() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function IconChevRight() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>; }
function IconBell() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>; }
function IconLink() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>; }
function IconSync() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>; }
function IconActivity() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>; }
function IconCheck() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>; }
function IconUndo() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>; }
function IconDatabase() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>; }
function IconLogout() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>; }
function IconDrive() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12H2"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" y1="16" x2="6.01" y2="16"/><line x1="10" y1="16" x2="10.01" y2="16"/></svg>; }
function IconImport() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12"/><polyline points="8 11 12 15 16 11"/><path d="M20 21H4"/></svg>; }
function IconPlug() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a6 6 0 0 1-12 0V8z"/></svg>; }
function IconUnplug() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }

/* ═══════════════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */
function fmtSize(b) { if (!b) return "—"; var u=["B","KB","MB","GB","TB"]; var i=Math.floor(Math.log(b)/Math.log(1024)); return (b/Math.pow(1024,i)).toFixed(i>0?1:0)+" "+u[i]; }
function fmtDate(d) { if (!d) return "—"; return new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}); }
function fmtTime(d) { if (!d) return "—"; var diff=Date.now()-new Date(d).getTime(); if(diff<60000) return "just now"; if(diff<3600000) return Math.floor(diff/60000)+"m ago"; if(diff<86400000) return Math.floor(diff/3600000)+"h ago"; return fmtDate(d); }
function fileType(mime, isFolder) { if (isFolder) return "folder"; if (!mime) return "document"; if (mime.startsWith("image/")) return "image"; if (mime.startsWith("video/")) return "video"; if (mime.includes("sheet")||mime.includes("csv")||mime.includes("excel")) return "spreadsheet"; return "document"; }

var roleColors = { admin:"#EF4444", project_manager:"#F59E0B", file_manager:"#8B5CF6", member:"#4F8EF7", viewer:"#10B981", external:"#6B7280" };

/* ═══════════════════════════════════════════════════════════════════════════
   SHARED UI COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════ */
function Modal(props) {
  if (!props.open) return null;
  return (
    <div className="modal-overlay" onClick={props.onClose}>
      <div className="modal" onClick={function(e){e.stopPropagation();}}>
        <div className="modal-header">
          <div className="modal-title">{props.title}</div>
          <button className="btn btn-ghost btn-icon" onClick={props.onClose}><IconX /></button>
        </div>
        <div className="modal-body">{props.children}</div>
        {props.footer && <div className="modal-footer">{props.footer}</div>}
      </div>
    </div>
  );
}

function FileIcon(props) {
  var t = props.type || "document";
  return <div className={"file-icon "+t}>{t==="folder"?<IconFolder />:<IconFile />}</div>;
}

/* Role definitions with permissions */
var roleDefinitions = {
  admin: {
    label: "Admin",
    color: "#EF4444",
    icon: "👑",
    desc: "Full control of the entire system",
    permissions: ["Create, edit, delete spaces & projects","Full user management","Portal creation & management","System settings & monitoring","All file operations","Drive & server management","Share link management","Activity audit access"]
  },
  project_manager: {
    label: "Project Manager",
    color: "#F59E0B",
    icon: "📋",
    desc: "Create and manage projects, add files to assigned projects",
    permissions: ["Create new projects","Edit own projects","Delete own projects","Upload files & create folders in own projects","Add files to projects assigned as editor","View all spaces & projects","Cannot create spaces","Cannot manage users or portals"]
  },
  file_manager: {
    label: "File Manager",
    color: "#8B5CF6",
    icon: "📁",
    desc: "Full control of files, spaces, sharing, drives, servers and portal access",
    permissions: ["Create, edit, delete spaces","Full file management across all spaces","Share link creation & management","SMB/CIFS drive mounting & browsing","Server sync management","Portal access management","Invite users","Cannot access system settings"]
  },
  member: {
    label: "Member",
    color: "#4F8EF7",
    icon: "👤",
    desc: "Standard team member with upload access",
    permissions: ["Upload files & create folders","Create documents in editor","Star & trash own files","Preview & download files","View spaces & projects","Cannot create spaces or projects","Cannot manage users or portals"]
  },
  viewer: {
    label: "Viewer",
    color: "#10B981",
    icon: "👁️",
    desc: "Read-only access to files and projects",
    permissions: ["View & preview files (PDF, images, video, text)","Browse spaces & projects","View activity feed","Cannot upload, edit, or download","Cannot create or modify anything"]
  },
  external: {
    label: "External",
    color: "#6B7280",
    icon: "🌐",
    desc: "Portal users — customers and contractors with scoped access",
    permissions: ["Access via branded portal URL only","Scoped to assigned projects","View permission: preview files only","Download permission: preview + download","Edit permission: preview + download + upload","Cannot see main admin interface","Access can be time-limited"]
  }
};

function RoleCards() {
  var [expanded, setExpanded] = useState(null);
  var entries = Object.entries(roleDefinitions);
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))",gap:12}}>
        {entries.map(function(entry) {
          var key = entry[0], def = entry[1];
          var isOpen = expanded === key;
          return React.createElement("div", {key:key},
            React.createElement("div", {
              onClick: function(){setExpanded(isOpen?null:key);},
              style:{
                background:isOpen?def.color+"12":"var(--bg-secondary)",
                border:"1px solid "+(isOpen?def.color:"var(--border-subtle)"),
                borderRadius:12,padding:"16px 18px",cursor:"pointer",
                transition:"all .2s",position:"relative",overflow:"hidden",
              }
            },
              React.createElement("div",{style:{position:"absolute",top:0,left:0,right:0,height:3,background:def.color}}),
              React.createElement("div",{style:{display:"flex",alignItems:"center",gap:10,marginBottom:6}},
                React.createElement("span",{style:{fontSize:22}},def.icon),
                React.createElement("div",{style:{flex:1}},
                  React.createElement("div",{style:{fontSize:15,fontWeight:700}},def.label),
                  React.createElement("div",{style:{fontSize:11,color:"var(--text-tertiary)",lineHeight:1.4,marginTop:2}},def.desc)
                ),
                React.createElement("span",{style:{fontSize:10,color:"var(--text-tertiary)",transform:isOpen?"rotate(180deg)":"none",transition:"transform .2s"}},"▼")
              ),
              isOpen && React.createElement("div",{style:{marginTop:14,paddingTop:14,borderTop:"1px solid "+def.color+"33"}},
                React.createElement("div",{style:{fontSize:10,fontWeight:700,color:def.color,marginBottom:10,textTransform:"uppercase",letterSpacing:1.5}},"Permissions"),
                def.permissions.map(function(p,i){
                  var isNeg = p.indexOf("Cannot")===0;
                  return React.createElement("div",{key:i,style:{display:"flex",alignItems:"flex-start",gap:8,padding:"5px 0",fontSize:12,color:isNeg?"var(--text-tertiary)":"var(--text-secondary)"}},
                    React.createElement("span",{style:{color:isNeg?"var(--danger)":"var(--success)",fontSize:11,marginTop:1,flexShrink:0}},isNeg?"✕":"✓"),
                    React.createElement("span",null,p)
                  );
                })
              )
            )
          );
        })}
      </div>
    </div>
  );
}

function RoleBadge(props) {
  var c = roleColors[props.role]||"#6B7280";
  var label = roleDefinitions[props.role] ? roleDefinitions[props.role].label : props.role;
  return <span className="badge" style={{background:c+"18",color:c}}>{props.role}</span>;
}

function StatusDot(props) {
  var s = props.status;
  var c = (s==="active"||s==="connected"||s==="synced")?"var(--success)":(s==="syncing")?"var(--accent)":(s==="error"||s==="disconnected"||s==="suspended")?"var(--danger)":"var(--text-tertiary)";
  return <span style={{width:7,height:7,borderRadius:"50%",background:c,display:"inline-block",flexShrink:0}} />;
}

function Empty(props) {
  return <div className="empty-state"><div style={{fontSize:40,opacity:0.2,marginBottom:12}}>{props.icon||"📂"}</div><h3>{props.title}</h3><p style={{fontSize:13,color:"var(--text-tertiary)",marginTop:4}}>{props.sub}</p></div>;
}

function Tabs(props) {
  return <div className="tabs">{props.items.map(function(t){return <div key={t} className={"tab "+(props.active===t?"active":"")} onClick={function(){props.onChange(t);}}>{t}</div>;})}</div>;
}

/* ═══════════════════════════════════════════════════════════════════════════
   FILE PREVIEW COMPONENT (used across all pages)
   ═══════════════════════════════════════════════════════════════════════════ */
function canPreview(mime, name) {
  if (!mime && !name) return false;
  var m = (mime || "").toLowerCase();
  var n = (name || "").toLowerCase();
  if (m.startsWith("image/")) return "image";
  if (m === "application/pdf") return "pdf";
  if (m.startsWith("video/")) return "video";
  if (m.startsWith("audio/")) return "audio";
  if (m.startsWith("text/") || m === "application/json" || m === "application/xml" || m === "application/javascript") return "text";
  if (m === "text/html" || n.endsWith(".html") || n.endsWith(".htm")) return "html";
  var textExts = [".txt",".md",".csv",".json",".xml",".yaml",".yml",".js",".ts",".jsx",".tsx",".py",".rb",".go",".rs",".java",".c",".cpp",".h",".css",".scss",".sql",".sh",".bash",".env",".conf",".cfg",".ini",".log",".toml"];
  for (var i = 0; i < textExts.length; i++) { if (n.endsWith(textExts[i])) return "text"; }
  return false;
}

function getPreviewUrl(fileId) {
  return API + "/files/" + fileId + "/preview?token=" + getToken();
}

function FilePreviewModal(props) {
  var file = props.file;
  var onClose = props.onClose;
  var previewType = props.previewType || canPreview(file.mime_type, file.name);
  var [textContent, setTextContent] = useState(null);
  var [textLoading, setTextLoading] = useState(false);
  var notify = useNotify();

  var previewUrl = getPreviewUrl(file.id);

  useEffect(function() {
    if (previewType === "text") {
      setTextLoading(true);
      apiFetch("/files/" + file.id + "/content")
        .then(function(d) { setTextContent(d.content); })
        .catch(function(e) { setTextContent("Error loading file: " + e.message); })
        .finally(function() { setTextLoading(false); });
    }
    if (previewType === "html" && file.metadata && file.metadata.content) {
      setTextContent(file.metadata.content);
    }
  }, [file.id]);

  function downloadFile() {
    window.open(API + "/files/" + file.id + "/download?token=" + getToken(), "_blank");
  }

  function langFromName(name) {
    var n = (name || "").toLowerCase();
    if (n.endsWith(".js") || n.endsWith(".jsx")) return "javascript";
    if (n.endsWith(".ts") || n.endsWith(".tsx")) return "typescript";
    if (n.endsWith(".py")) return "python";
    if (n.endsWith(".json")) return "json";
    if (n.endsWith(".css") || n.endsWith(".scss")) return "css";
    if (n.endsWith(".html") || n.endsWith(".htm")) return "html";
    if (n.endsWith(".sql")) return "sql";
    if (n.endsWith(".sh") || n.endsWith(".bash")) return "bash";
    if (n.endsWith(".md")) return "markdown";
    if (n.endsWith(".xml") || n.endsWith(".yaml") || n.endsWith(".yml")) return "yaml";
    if (n.endsWith(".go")) return "go";
    if (n.endsWith(".rs")) return "rust";
    if (n.endsWith(".java")) return "java";
    if (n.endsWith(".c") || n.endsWith(".cpp") || n.endsWith(".h")) return "c";
    if (n.endsWith(".rb")) return "ruby";
    return "plaintext";
  }

  if (!file) return null;

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:200,display:"flex",flexDirection:"column",animation:"fadeIn .15s ease"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 20px",background:"var(--bg-secondary)",borderBottom:"1px solid var(--border-subtle)",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><IconX /> Close</button>
          <div style={{width:1,height:20,background:"var(--border-subtle)"}} />
          <FileIcon type={fileType(file.mime_type, file.is_folder)} />
          <div>
            <div style={{fontSize:14,fontWeight:600}}>{file.name}</div>
            <div style={{fontSize:11,color:"var(--text-tertiary)"}}>{fmtSize(file.size)} · {file.mime_type || "unknown"} · {fmtTime(file.updated_at)}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button className="btn btn-secondary btn-sm" onClick={downloadFile}><IconDownload /> Download</button>
        </div>
      </div>

      {/* Preview Area */}
      <div style={{flex:1,overflow:"auto",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>

        {/* Image */}
        {previewType === "image" && (
          <img src={previewUrl} alt={file.name} style={{maxWidth:"100%",maxHeight:"100%",objectFit:"contain",borderRadius:"var(--radius)",boxShadow:"0 8px 32px rgba(0,0,0,0.5)"}} />
        )}

        {/* PDF */}
        {previewType === "pdf" && (
          <iframe src={previewUrl + "#toolbar=1&navpanes=0"} style={{width:"100%",height:"100%",border:"none",borderRadius:"var(--radius)",background:"white"}} title={file.name} />
        )}

        {/* Video */}
        {previewType === "video" && (
          <video controls autoPlay style={{maxWidth:"100%",maxHeight:"100%",borderRadius:"var(--radius)",boxShadow:"0 8px 32px rgba(0,0,0,0.5)"}}>
            <source src={previewUrl} type={file.mime_type} />
            Your browser does not support video playback.
          </video>
        )}

        {/* Audio */}
        {previewType === "audio" && (
          <div style={{background:"var(--bg-secondary)",borderRadius:"var(--radius-xl)",padding:40,textAlign:"center",minWidth:400}}>
            <div style={{fontSize:48,marginBottom:16}}>🎵</div>
            <div style={{fontSize:16,fontWeight:600,marginBottom:4}}>{file.name}</div>
            <div style={{fontSize:13,color:"var(--text-tertiary)",marginBottom:20}}>{fmtSize(file.size)}</div>
            <audio controls autoPlay style={{width:"100%"}}>
              <source src={previewUrl} type={file.mime_type} />
            </audio>
          </div>
        )}

        {/* Text / Code */}
        {previewType === "text" && (
          <div style={{width:"100%",maxWidth:900,height:"100%",background:"var(--bg-secondary)",borderRadius:"var(--radius-lg)",border:"1px solid var(--border-subtle)",overflow:"hidden",display:"flex",flexDirection:"column"}}>
            <div style={{padding:"10px 16px",borderBottom:"1px solid var(--border-subtle)",fontSize:12,color:"var(--text-tertiary)",display:"flex",justifyContent:"space-between"}}>
              <span>{langFromName(file.name)}</span>
              <span>{textContent ? textContent.split("\n").length + " lines" : ""}</span>
            </div>
            <pre style={{flex:1,overflow:"auto",padding:20,margin:0,fontSize:13,lineHeight:1.6,fontFamily:"var(--mono)",color:"var(--text-secondary)",whiteSpace:"pre-wrap",wordWrap:"break-word"}}>
              {textLoading ? "Loading..." : textContent || "Empty file"}
            </pre>
          </div>
        )}

        {/* HTML Document */}
        {previewType === "html" && (
          <div style={{width:"100%",maxWidth:900,height:"100%",background:"var(--bg-primary)",borderRadius:"var(--radius-lg)",border:"1px solid var(--border-subtle)",overflow:"auto",padding:"32px 40px"}}>
            {file.metadata && file.metadata.content ? (
              <div dangerouslySetInnerHTML={{__html: file.metadata.content}} style={{fontSize:15,lineHeight:1.8,color:"var(--text-secondary)"}} />
            ) : (
              <iframe src={previewUrl} style={{width:"100%",height:"100%",border:"none"}} title={file.name} />
            )}
          </div>
        )}

        {/* Unsupported */}
        {!previewType && (
          <div style={{textAlign:"center",color:"var(--text-tertiary)"}}>
            <div style={{fontSize:64,marginBottom:16,opacity:0.3}}>📄</div>
            <div style={{fontSize:16,fontWeight:600,color:"var(--text-secondary)",marginBottom:8}}>Preview not available</div>
            <div style={{fontSize:13,marginBottom:20}}>This file type ({file.mime_type || "unknown"}) cannot be previewed inline.</div>
            <button className="btn btn-primary" onClick={downloadFile}><IconDownload /> Download File</button>
          </div>
        )}
      </div>

      {/* Keyboard shortcut */}
      <style>{`
        [data-preview] img{transition:transform .2s}
        [data-preview] img:hover{cursor:zoom-in}
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE: DASHBOARD
   ═══════════════════════════════════════════════════════════════════════════ */
function DashboardPage() {
  var [stats, setStats] = useState(null);
  var [activity, setActivity] = useState([]);
  var [files, setFiles] = useState([]);

  useEffect(function() {
    apiFetch("/admin/stats").then(setStats).catch(function(){});
    apiFetch("/activity?limit=10").then(function(d){setActivity(d.activity||[]);}).catch(function(){});
    apiFetch("/files?limit=6").then(function(d){setFiles(d.files||[]);}).catch(function(){});
  }, []);

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Dashboard</div><div className="page-subtitle">Overview of your workspace</div></div>
      </div>
      <div className="stats-grid">
        {[
          {label:"Total Files",value:stats?stats.files.total:"—",color:"#4F8EF7"},
          {label:"Active Users",value:stats?stats.users.active:"—",color:"#10B981"},
          {label:"Storage Used",value:stats?fmtSize(stats.storage.used):"—",color:"#A78BFA"},
          {label:"Active Shares",value:stats?stats.shares.active:"—",color:"#F59E0B"},
        ].map(function(s,i){return (
          <div className="stat-card" key={i}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:s.color}} />
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{color:s.color}}>{s.value}</div>
          </div>
        );})}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:20}}>
        <div className="card">
          <div className="card-header"><span className="card-title">Recent Files</span></div>
          {files.length===0?<div className="card-body"><Empty title="No files yet" sub="Upload your first file" /></div>:
          <div className="table-wrap"><table><thead><tr><th>Name</th><th>Modified</th><th>Size</th></tr></thead><tbody>{files.map(function(f){return(
            <tr key={f.id}><td><div className="file-name"><FileIcon type={fileType(f.mime_type,f.is_folder)} /><span>{f.name}</span></div></td><td style={{color:"var(--text-secondary)"}}>{fmtTime(f.updated_at)}</td><td style={{color:"var(--text-tertiary)"}}>{f.is_folder?"—":fmtSize(f.size)}</td></tr>
          );})}</tbody></table></div>}
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Activity</span></div>
          <div className="card-body" style={{padding:"8px 20px"}}>
            {activity.length===0?<Empty title="No activity" sub="Actions will appear here" />:
            <div className="activity-list">{activity.map(function(a){return(
              <div className="activity-item" key={a.id}><div className="activity-icon"><IconActivity /></div><div><div className="activity-text"><strong>{a.user_name||"System"}</strong> {a.action} <strong>{a.entity_name||""}</strong></div><div className="activity-time">{fmtTime(a.created_at)}</div></div></div>
            );})}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE: FILES
   ═══════════════════════════════════════════════════════════════════════════ */
function FilesPage() {
  var [files, setFiles] = useState([]);
  var [loading, setLoading] = useState(true);
  var [viewMode, setViewMode] = useState("list");
  var [parentId, setParentId] = useState(null);
  var [breadcrumb, setBreadcrumb] = useState([{id:null,name:"My Drive"}]);
  var [search, setSearch] = useState("");
  var [showNewFolder, setShowNewFolder] = useState(false);
  var [folderName, setFolderName] = useState("");
  var [showTrash, setShowTrash] = useState(false);
  var [previewFile, setPreviewFile] = useState(null);
  var fileInput = useRef(null);
  var notify = useNotify();

  function loadFiles() {
    setLoading(true);
    var p = new URLSearchParams();
    if (parentId) p.set("parent_id", parentId);
    if (search) p.set("search", search);
    if (showTrash) p.set("trashed", "true");
    apiFetch("/files?" + p.toString())
      .then(function(d) { setFiles(d.files || []); })
      .catch(function(e) { notify(e.message, "error"); })
      .finally(function() { setLoading(false); });
  }

  useEffect(loadFiles, [parentId, search, showTrash]);

  function openFolder(f) {
    if (f.is_folder) { setParentId(f.id); setBreadcrumb(function(b){return b.concat({id:f.id,name:f.name});}); }
    else if (canPreview(f.mime_type, f.name)) { setPreviewFile(f); }
  }
  function navTo(idx) { var bc=breadcrumb.slice(0,idx+1); setBreadcrumb(bc); setParentId(bc[bc.length-1].id); }

  function handleUpload(e) {
    var fl = e.target.files; if (!fl || !fl.length) return;
    var fd = new FormData();
    for (var i=0;i<fl.length;i++) fd.append("files", fl[i]);
    if (parentId) fd.append("parent_id", parentId);
    apiFetch("/files/upload", {method:"POST",body:fd}).then(function(){notify("Uploaded!","success");loadFiles();}).catch(function(err){notify(err.message,"error");});
    e.target.value = "";
  }

  function createFolder() {
    if (!folderName.trim()) return;
    apiFetch("/files/folder",{method:"POST",body:{name:folderName,parent_id:parentId}}).then(function(){notify("Folder created!","success");setShowNewFolder(false);setFolderName("");loadFiles();}).catch(function(err){notify(err.message,"error");});
  }

  function toggleStar(f) { apiFetch("/files/"+f.id+"/star",{method:"PATCH"}).then(loadFiles).catch(function(e){notify(e.message,"error");}); }
  function trashFile(f) { apiFetch("/files/"+f.id+"/trash",{method:"PATCH"}).then(function(){notify("Trashed","success");loadFiles();}).catch(function(e){notify(e.message,"error");}); }
  function restoreFile(f) { apiFetch("/files/"+f.id+"/restore",{method:"PATCH"}).then(function(){notify("Restored","success");loadFiles();}).catch(function(e){notify(e.message,"error");}); }
  function downloadFile(f) { if(f.is_folder) return; window.open(API+"/files/"+f.id+"/download?token="+getToken(),"_blank"); }

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
            {breadcrumb.map(function(b,i){return(
              <span key={i} style={{display:"flex",alignItems:"center",gap:6}}>
                {i>0&&<IconChevRight />}
                <span onClick={function(){navTo(i);}} style={{cursor:"pointer",fontSize:13,fontWeight:i===breadcrumb.length-1?600:400,color:i===breadcrumb.length-1?"var(--text-primary)":"var(--text-secondary)"}}>{b.name}</span>
              </span>
            );})}
          </div>
          <div className="page-title">{showTrash?"Trash":"Files"}</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button className="btn btn-ghost btn-icon" onClick={function(){setViewMode("grid");}} style={{color:viewMode==="grid"?"var(--accent)":undefined}}><IconGrid /></button>
          <button className="btn btn-ghost btn-icon" onClick={function(){setViewMode("list");}} style={{color:viewMode==="list"?"var(--accent)":undefined}}><IconList /></button>
          <button className={"btn "+(showTrash?"btn-secondary":"btn-ghost")} onClick={function(){setShowTrash(!showTrash);setParentId(null);setBreadcrumb([{id:null,name:"My Drive"}]);}}><IconTrash /> {showTrash?"Back":"Trash"}</button>
          {!showTrash&&<React.Fragment>
            <button className="btn btn-secondary" onClick={function(){setShowNewFolder(true);}}><IconPlus /> Folder</button>
            <button className="btn btn-primary" onClick={function(){fileInput.current.click();}}><IconUpload /> Upload</button>
            <input ref={fileInput} type="file" multiple style={{display:"none"}} onChange={handleUpload} />
          </React.Fragment>}
        </div>
      </div>
      {!showTrash&&<div className="search-box" style={{marginBottom:20,maxWidth:400}}><IconSearch /><input placeholder="Search files..." value={search} onChange={function(e){setSearch(e.target.value);}} /></div>}

      {loading?<div style={{textAlign:"center",padding:60,color:"var(--text-tertiary)"}}>Loading...</div>:
        files.length===0?<Empty title={showTrash?"Trash is empty":"No files here"} sub={showTrash?"Deleted files appear here":"Upload files or create a folder"} />:
        viewMode==="grid"?
          <div className="files-grid">{files.map(function(f){return(
            <div className="file-card" key={f.id} onClick={function(){openFolder(f);}}>
              <div style={{marginBottom:10}}><FileIcon type={fileType(f.mime_type,f.is_folder)} /></div>
              <div className="file-card-name">{f.name}</div>
              <div className="file-card-meta">{f.is_folder?"Folder":fmtSize(f.size)} · {fmtTime(f.updated_at)}</div>
            </div>
          );})}</div>:
          <div className="card"><div className="table-wrap"><table>
            <thead><tr><th>Name</th><th>Modified</th><th>Size</th><th>Owner</th><th style={{width:120}}>Actions</th></tr></thead>
            <tbody>{files.map(function(f){return(
              <tr key={f.id}>
                <td><div className="file-name" style={{cursor:f.is_folder?"pointer":"default"}} onClick={function(){openFolder(f);}}>
                  <FileIcon type={fileType(f.mime_type,f.is_folder)} /><span>{f.name}</span>
                  {f.is_starred&&<span style={{color:"#FBBF24"}}><IconStar filled={true} /></span>}
                </div></td>
                <td style={{color:"var(--text-secondary)"}}>{fmtTime(f.updated_at)}</td>
                <td style={{color:"var(--text-tertiary)"}}>{f.is_folder?"—":fmtSize(f.size)}</td>
                <td style={{color:"var(--text-secondary)",fontSize:12}}>{f.owner_name||"—"}</td>
                <td><div style={{display:"flex",gap:4}}>
                  {showTrash?<button className="btn btn-ghost btn-icon btn-sm" onClick={function(){restoreFile(f);}}><IconUndo /></button>:
                  <React.Fragment>
                    {!f.is_folder&&<button className="btn btn-ghost btn-icon btn-sm" onClick={function(){downloadFile(f);}}><IconDownload /></button>}
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={function(){toggleStar(f);}} style={{color:f.is_starred?"#FBBF24":undefined}}><IconStar filled={f.is_starred} /></button>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={function(){trashFile(f);}}><IconTrash /></button>
                  </React.Fragment>}
                </div></td>
              </tr>
            );})}</tbody>
          </table></div></div>
      }

{previewFile && React.createElement(FilePreviewModal, {file: previewFile, onClose: function(){setPreviewFile(null);}})}

      <Modal open={showNewFolder} onClose={function(){setShowNewFolder(false);}} title="New Folder" footer={
        <React.Fragment><button className="btn btn-secondary" onClick={function(){setShowNewFolder(false);}}>Cancel</button><button className="btn btn-primary" onClick={createFolder}>Create</button></React.Fragment>
      }>
        <div className="form-group"><label className="form-label">Folder Name</label><input className="form-input" placeholder="Enter name" value={folderName} onChange={function(e){setFolderName(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")createFolder();}} autoFocus /></div>
      </Modal>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE: PROJECTS
   ═══════════════════════════════════════════════════════════════════════════ */
function ProjectsPage() {
  var [projects, setProjects] = useState([]);
  var [spaces, setSpaces] = useState([]);
  var [show, setShow] = useState(false);
  var [form, setForm] = useState({name:"",space_id:"",description:"",color:"#4F8EF7",portal_ids:[]});
  var [portals, setPortals] = useState([]);
  var [activeProject, setActiveProject] = useState(null);
  var auth = useAuth();
  var notify = useNotify();

  function loadProjects() {
    apiFetch("/projects").then(function(d){setProjects(d.projects||[]);});
    apiFetch("/spaces").then(function(d){setSpaces(d.spaces||[]);});
  }
  useEffect(loadProjects, []);

  function create() {
    if(!form.name||!form.space_id){notify("Name and space required","error");return;}
    apiFetch("/projects",{method:"POST",body:form}).then(function(proj){
      // Auto-assign to selected portals
      if(form.portal_ids&&form.portal_ids.length>0){
        form.portal_ids.forEach(function(pid){
          apiFetch("/portals/"+pid+"/access",{method:"GET"}).then(function(d){
            // For each user in the portal, add this project to their access
            (d.access||[]).forEach(function(a){
              if(a.is_active){
                var pids=(a.project_ids||[]).slice();
                if(proj.id&&pids.indexOf(proj.id)<0) pids.push(proj.id);
                apiFetch("/portals/"+pid+"/access/"+a.user_id,{method:"PATCH",body:{project_ids:pids}}).catch(function(){});
              }
            });
          }).catch(function(){});
        });
      }notify("Created!","success");setShow(false);setForm({name:"",space_id:"",description:"",color:"#4F8EF7",portal_ids:[]});loadProjects();}).catch(function(e){notify(e.message,"error");});
  }

  function openProject(p) { setActiveProject(p); }
  function goBack() { setActiveProject(null); loadProjects(); }

  if (activeProject) {
    return React.createElement(ProjectWorkspace, { project: activeProject, onBack: goBack });
  }

  return (
    <div>
      <div className="page-header"><div><div className="page-title">Projects</div><div className="page-subtitle">Organize work into focused containers</div></div>{auth.user&&(auth.user.role==="admin"||auth.user.role==="project_manager")&&<button className="btn btn-primary" onClick={function(){setShow(true);}}><IconPlus /> New Project</button>}</div>
      {projects.length===0?<Empty icon="📋" title="No projects yet" sub="Create your first project" />:
      <div className="project-grid">{projects.map(function(p){return(
        <div className="project-card" key={p.id} onClick={function(){openProject(p);}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:p.color||"var(--accent)"}} />
          <div className="project-card-header"><div><h3>{p.name}</h3><span className="badge badge-neutral" style={{marginTop:6}}>{p.space_name}</span></div><span className={"badge "+(p.status==="active"?"badge-success":"badge-neutral")}>{p.status}</span></div>
          {p.description&&<p style={{fontSize:12,color:"var(--text-tertiary)",margin:"8px 0"}}>{p.description}</p>}
          <div className="project-card-stats"><div className="project-stat"><strong>{p.member_count}</strong> members</div><div className="project-stat"><strong>{p.file_count}</strong> files</div><div className="project-stat"><strong>{fmtSize(parseInt(p.storage_used))}</strong></div></div>
          {auth.user&&auth.user.role==="admin"&&<div style={{display:"flex",gap:6,marginTop:12,borderTop:"1px solid var(--border-subtle)",paddingTop:12}}>
            {p.status==="active"&&<button className="btn btn-ghost btn-sm" onClick={function(e){e.stopPropagation();apiFetch("/projects/"+p.id,{method:"PATCH",body:{status:"archived"}}).then(function(){notify("Project archived","success");loadProjects();}).catch(function(err){notify(err.message,"error");});}}>Archive</button>}
            {p.status==="archived"&&<button className="btn btn-ghost btn-sm" onClick={function(e){e.stopPropagation();apiFetch("/projects/"+p.id,{method:"PATCH",body:{status:"active"}}).then(function(){notify("Project reactivated","success");loadProjects();}).catch(function(err){notify(err.message,"error");});}}>Reactivate</button>}
            <button className="btn btn-danger btn-sm" onClick={function(e){e.stopPropagation();if(confirm("Delete project \""+p.name+"\"? All files in this project will be orphaned.")){apiFetch("/projects/"+p.id,{method:"DELETE"}).then(function(){notify("Project deleted","success");loadProjects();}).catch(function(err){notify(err.message,"error");});}}}>Delete</button>
          </div>}
        </div>
      );})}</div>}
      <Modal open={show} onClose={function(){setShow(false);}} title="Create Project" footer={<React.Fragment><button className="btn btn-secondary" onClick={function(){setShow(false);}}>Cancel</button><button className="btn btn-primary" onClick={create}>Create</button></React.Fragment>}>
        <div className="form-group"><label className="form-label">Project Name</label><input className="form-input" value={form.name} onChange={function(e){setForm({...form,name:e.target.value});}} placeholder="e.g. Website Redesign" /></div>
        <div className="form-group"><label className="form-label">Space</label><select className="form-select" value={form.space_id} onChange={function(e){setForm({...form,space_id:e.target.value});}}><option value="">Select...</option>{spaces.map(function(s){return <option key={s.id} value={s.id}>{s.name}</option>;})}</select></div>
        <div className="form-group"><label className="form-label">Description</label><input className="form-input" value={form.description} onChange={function(e){setForm({...form,description:e.target.value});}} /></div>
        <div className="form-group"><label className="form-label">Color</label><input type="color" className="form-input" style={{height:40,padding:4}} value={form.color} onChange={function(e){setForm({...form,color:e.target.value});}} /></div>
        {portals.length>0&&<div className="form-group"><label className="form-label">Assign to Portals (optional)</label>
          <div style={{border:"1px solid var(--border-subtle)",borderRadius:"var(--radius-sm)",padding:8,maxHeight:160,overflowY:"auto"}}>
            {portals.map(function(p){var checked=form.portal_ids.indexOf(p.id)>=0; return(
              <label key={p.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px",borderRadius:4,cursor:"pointer",background:checked?"var(--accent-muted)":"transparent",transition:"all .15s"}}>
                <input type="checkbox" checked={checked} onChange={function(){setForm(function(f){var ids=f.portal_ids.slice();var i=ids.indexOf(p.id);if(i>=0)ids.splice(i,1);else ids.push(p.id);return{...f,portal_ids:ids};});}} />
                <div style={{width:8,height:8,borderRadius:2,background:p.brand_color||"var(--accent)"}} />
                <div><div style={{fontSize:13,fontWeight:500}}>{p.name}</div><div style={{fontSize:11,color:"var(--text-tertiary)"}}>{p.type} · /portal/{p.slug}</div></div>
              </label>
            );})}
          </div>
          <div style={{fontSize:11,color:"var(--text-tertiary)",marginTop:4}}>Selected portals will auto-include this project for all their users</div>
        </div>}
      </Modal>
    </div>
  );
}

/* ── Icons for document editor ── */
function IconBold() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>; }
function IconItalic() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>; }
function IconUnderline() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>; }
function IconAlignLeft() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>; }
function IconListOl() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>; }
function IconListUl() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>; }
function IconHeading() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4v16"/><path d="M18 4v16"/><path d="M6 12h12"/></svg>; }
function IconCode() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>; }
function IconSave() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>; }
function IconFileText() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>; }
function IconArrowLeft() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>; }

/* ── Document Editor Component ── */
function DocumentEditor(props) {
  var file = props.file;
  var onBack = props.onBack;
  var onSaved = props.onSaved;
  var projectId = props.projectId;
  var parentId = props.parentId;
  var notify = useNotify();
  var editorRef = useRef(null);
  var [title, setTitle] = useState(file ? file.name.replace(/\.(html|doc|txt)$/i,"") : "Untitled Document");
  var [saving, setSaving] = useState(false);
  var [lastSaved, setLastSaved] = useState(null);
  var [isNew] = useState(!file);

  useEffect(function() {
    if (editorRef.current) {
      if (file && file.metadata && file.metadata.content) {
        editorRef.current.innerHTML = file.metadata.content;
      } else {
        editorRef.current.innerHTML = "<h1>Start writing...</h1><p>Click here and start typing your document. Use the toolbar above to format text.</p>";
      }
    }
  }, []);

  function execCmd(cmd, val) {
    document.execCommand(cmd, false, val || null);
    editorRef.current.focus();
  }

  function insertHeading() {
    document.execCommand("formatBlock", false, "h2");
    editorRef.current.focus();
  }

  function insertCodeBlock() {
    document.execCommand("formatBlock", false, "pre");
    editorRef.current.focus();
  }

  function saveDocument() {
    setSaving(true);
    var content = editorRef.current.innerHTML;
    var text = editorRef.current.innerText;
    var docTitle = title.trim() || "Untitled Document";

    if (file && file.id) {
      /* Update existing document */
      apiFetch("/files/" + file.id, {
        method: "PATCH",
        body: { name: docTitle + ".html", metadata: { content: content, plaintext: text.substring(0, 500), wordCount: text.split(/\s+/).filter(Boolean).length } }
      }).then(function() {
        setLastSaved(new Date());
        notify("Document saved!", "success");
        if (onSaved) onSaved();
      }).catch(function(e) { notify(e.message, "error"); }).finally(function() { setSaving(false); });
    } else {
      /* Create new document as file via upload blob */
      var blob = new Blob([content], { type: "text/html" });
      var fd = new FormData();
      fd.append("files", blob, docTitle + ".html");
      fd.append("project_id", projectId);
      if (parentId) fd.append("parent_id", parentId);
      apiFetch("/files/upload", { method: "POST", body: fd }).then(function(data) {
        var newFile = data.files && data.files[0];
        if (newFile) {
          /* Save content metadata */
          apiFetch("/files/" + newFile.id, {
            method: "PATCH",
            body: { metadata: { content: content, plaintext: text.substring(0, 500), wordCount: text.split(/\s+/).filter(Boolean).length } }
          });
        }
        setLastSaved(new Date());
        notify("Document created!", "success");
        if (onSaved) onSaved();
      }).catch(function(e) { notify(e.message, "error"); }).finally(function() { setSaving(false); });
    }
  }

  /* Auto-save every 30s */
  useEffect(function() {
    var timer = setInterval(function() {
      if (editorRef.current && editorRef.current.innerText.trim().length > 10) {
        saveDocument();
      }
    }, 30000);
    return function() { clearInterval(timer); };
  }, [file, title]);

  var wordCount = 0;
  try { wordCount = editorRef.current ? editorRef.current.innerText.split(/\s+/).filter(Boolean).length : 0; } catch(e) {}

  return (
    <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 120px)"}}>
      {/* ── Editor Topbar ── */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16,flexWrap:"wrap"}}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}><IconArrowLeft /> Back to files</button>
        <input
          value={title}
          onChange={function(e){setTitle(e.target.value);}}
          style={{flex:1,minWidth:200,border:"none",background:"none",color:"var(--text-primary)",fontSize:18,fontWeight:700,fontFamily:"var(--font)",outline:"none",padding:"4px 0"}}
          placeholder="Document title..."
        />
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {lastSaved && <span style={{fontSize:11,color:"var(--text-tertiary)"}}>Saved {fmtTime(lastSaved.toISOString())}</span>}
          <button className="btn btn-primary btn-sm" onClick={saveDocument} disabled={saving}><IconSave /> {saving ? "Saving..." : "Save"}</button>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div style={{display:"flex",alignItems:"center",gap:2,padding:"8px 12px",background:"var(--bg-secondary)",border:"1px solid var(--border-subtle)",borderRadius:"var(--radius) var(--radius) 0 0",flexWrap:"wrap"}}>
        <select onChange={function(e){document.execCommand("formatBlock",false,e.target.value);editorRef.current.focus();e.target.value="";}} defaultValue="" style={{padding:"4px 8px",border:"1px solid var(--border)",borderRadius:4,background:"var(--bg-tertiary)",color:"var(--text-primary)",fontSize:12,fontFamily:"var(--font)",cursor:"pointer",marginRight:8}}>
          <option value="" disabled>Style...</option>
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="blockquote">Quote</option>
          <option value="pre">Code Block</option>
        </select>
        <select onChange={function(e){document.execCommand("fontSize",false,e.target.value);editorRef.current.focus();e.target.value="";}} defaultValue="" style={{padding:"4px 8px",border:"1px solid var(--border)",borderRadius:4,background:"var(--bg-tertiary)",color:"var(--text-primary)",fontSize:12,fontFamily:"var(--font)",cursor:"pointer",marginRight:8}}>
          <option value="" disabled>Size...</option>
          <option value="1">Small</option>
          <option value="3">Normal</option>
          <option value="5">Large</option>
          <option value="7">Huge</option>
        </select>
        <div style={{width:1,height:20,background:"var(--border)",margin:"0 6px"}} />
        <button className="btn btn-ghost btn-icon btn-sm" onClick={function(){execCmd("bold");}} title="Bold"><IconBold /></button>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={function(){execCmd("italic");}} title="Italic"><IconItalic /></button>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={function(){execCmd("underline");}} title="Underline"><IconUnderline /></button>
        <div style={{width:1,height:20,background:"var(--border)",margin:"0 6px"}} />
        <button className="btn btn-ghost btn-icon btn-sm" onClick={function(){execCmd("justifyLeft");}} title="Align Left"><IconAlignLeft /></button>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={function(){execCmd("insertUnorderedList");}} title="Bullet List"><IconListUl /></button>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={function(){execCmd("insertOrderedList");}} title="Numbered List"><IconListOl /></button>
        <div style={{width:1,height:20,background:"var(--border)",margin:"0 6px"}} />
        <button className="btn btn-ghost btn-icon btn-sm" onClick={function(){execCmd("foreColor","#4F8EF7");}} title="Blue Text" style={{color:"#4F8EF7"}}>A</button>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={function(){execCmd("foreColor","#EF4444");}} title="Red Text" style={{color:"#EF4444"}}>A</button>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={function(){execCmd("foreColor","#10B981");}} title="Green Text" style={{color:"#10B981"}}>A</button>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={function(){execCmd("foreColor","#E8ECF4");}} title="White Text" style={{color:"var(--text-primary)"}}>A</button>
        <div style={{width:1,height:20,background:"var(--border)",margin:"0 6px"}} />
        <button className="btn btn-ghost btn-icon btn-sm" onClick={function(){var url=prompt("Enter link URL:");if(url)execCmd("createLink",url);}} title="Insert Link"><IconLink /></button>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={function(){execCmd("removeFormat");}} title="Clear Formatting"><IconX /></button>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={function(){execCmd("undo");}} title="Undo"><IconUndo /></button>
      </div>

      {/* ── Editor Canvas ── */}
      <div
        ref={editorRef}
        contentEditable={true}
        suppressContentEditableWarning={true}
        onKeyDown={function(e){if((e.ctrlKey||e.metaKey)&&e.key==="s"){e.preventDefault();saveDocument();}}}
        style={{
          flex:1,overflow:"auto",padding:"32px 40px",background:"var(--bg-primary)",
          border:"1px solid var(--border-subtle)",borderTop:"none",borderRadius:"0 0 var(--radius) var(--radius)",
          color:"var(--text-primary)",fontSize:15,lineHeight:1.8,fontFamily:"var(--font)",
          outline:"none",minHeight:400,whiteSpace:"pre-wrap",wordWrap:"break-word",
        }}
      />

      {/* ── Status bar ── */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 16px",fontSize:11,color:"var(--text-tertiary)"}}>
        <span>{isNew ? "New document" : "Editing: " + (file ? file.name : "")}</span>
        <span>Ctrl+S to save · Auto-saves every 30s</span>
      </div>

      <style>{`
        [contenteditable] h1{font-size:28px;font-weight:700;margin:16px 0 8px;letter-spacing:-0.5px;color:var(--text-primary)}
        [contenteditable] h2{font-size:22px;font-weight:600;margin:14px 0 6px;color:var(--text-primary)}
        [contenteditable] h3{font-size:17px;font-weight:600;margin:12px 0 4px;color:var(--text-primary)}
        [contenteditable] p{margin:0 0 8px;color:var(--text-secondary)}
        [contenteditable] ul,[contenteditable] ol{margin:0 0 12px;padding-left:24px;color:var(--text-secondary)}
        [contenteditable] li{margin:2px 0}
        [contenteditable] blockquote{border-left:3px solid var(--accent);padding:8px 16px;margin:12px 0;color:var(--text-secondary);background:var(--accent-muted);border-radius:0 var(--radius-sm) var(--radius-sm) 0}
        [contenteditable] pre{background:var(--bg-tertiary);border:1px solid var(--border-subtle);border-radius:var(--radius-sm);padding:16px;margin:12px 0;font-family:var(--mono);font-size:13px;overflow-x:auto;color:var(--text-secondary)}
        [contenteditable] a{color:var(--accent);text-decoration:underline}
        [contenteditable]:empty::before{content:"Start typing your document...";color:var(--text-tertiary);font-style:italic}
      `}</style>
    </div>
  );
}

/* ── Project Workspace (opened when clicking a project) ── */
function ProjectWorkspace(props) {
  var project = props.project;
  var onBack = props.onBack;
  var [tab, setTab] = useState("Overview");
  var [files, setFiles] = useState([]);
  var [allFiles, setAllFiles] = useState([]);
  var [loading, setLoading] = useState(true);
  var [parentId, setParentId] = useState(null);
  var [breadcrumb, setBreadcrumb] = useState([{id:null,name:"Files"}]);
  var [viewMode, setViewMode] = useState("list");
  var [showNewFolder, setShowNewFolder] = useState(false);
  var [folderName, setFolderName] = useState("");
  var [activity, setActivity] = useState([]);
  var [members, setMembers] = useState([]);
  var [showSettings, setShowSettings] = useState(false);
  var [editForm, setEditForm] = useState({name:project.name,description:project.description||"",status:project.status,color:project.color||"#4F8EF7"});
  var [editingDoc, setEditingDoc] = useState(null);
  var [creatingDoc, setCreatingDoc] = useState(false);
  var [showNewDoc, setShowNewDoc] = useState(false);
  var [newDocName, setNewDocName] = useState("");
  var [newDocType, setNewDocType] = useState("blank");
  var fileInput = useRef(null);
  var notify = useNotify();

  function loadFiles() {
    setLoading(true);
    var p = new URLSearchParams();
    p.set("project_id", project.id);
    if (parentId) p.set("parent_id", parentId);
    apiFetch("/files?" + p.toString())
      .then(function(d) { setFiles(d.files || []); })
      .catch(function(e) { notify(e.message, "error"); })
      .finally(function() { setLoading(false); });
  }

  function loadAllFiles() {
    apiFetch("/files?project_id=" + project.id + "&limit=200")
      .then(function(d) { setAllFiles(d.files || []); })
      .catch(function(){});
  }

  function loadActivity() {
    apiFetch("/activity?limit=20")
      .then(function(d) { setActivity(d.activity || []); })
      .catch(function(){});
  }

  function loadMembers() {
    apiFetch("/users")
      .then(function(d) { setMembers(d.users || []); })
      .catch(function(){});
  }

  useEffect(function() { loadFiles(); loadAllFiles(); loadActivity(); loadMembers(); }, [parentId]);

  function openFolder(f) {
    if (f.is_folder) {
      setParentId(f.id);
      setBreadcrumb(function(b) { return b.concat({id:f.id,name:f.name}); });
    } else if (f.mime_type === "text/html" || (f.name && f.name.endsWith(".html"))) {
      setEditingDoc(f);
    }
  }

  function navTo(idx) { var bc=breadcrumb.slice(0,idx+1); setBreadcrumb(bc); setParentId(bc[bc.length-1].id); }

  function handleUpload(e) {
    var fl=e.target.files; if(!fl||!fl.length) return;
    var fd=new FormData();
    for(var i=0;i<fl.length;i++) fd.append("files",fl[i]);
    fd.append("project_id",project.id);
    if(parentId) fd.append("parent_id",parentId);
    apiFetch("/files/upload",{method:"POST",body:fd}).then(function(){notify("Uploaded!","success");loadFiles();loadAllFiles();}).catch(function(err){notify(err.message,"error");});
    e.target.value="";
  }

  function createFolder() {
    if(!folderName.trim()) return;
    apiFetch("/files/folder",{method:"POST",body:{name:folderName,parent_id:parentId,project_id:project.id}}).then(function(){notify("Folder created!","success");setShowNewFolder(false);setFolderName("");loadFiles();}).catch(function(err){notify(err.message,"error");});
  }

  function toggleStar(f) { apiFetch("/files/"+f.id+"/star",{method:"PATCH"}).then(loadFiles); }
  function trashFile(f) { apiFetch("/files/"+f.id+"/trash",{method:"PATCH"}).then(function(){notify("Trashed","success");loadFiles();loadAllFiles();}); }
  function downloadFile(f) { if(f.is_folder) return; window.open(API+"/files/"+f.id+"/download?token="+getToken(),"_blank"); }

  function saveSettings() {
    apiFetch("/projects/"+project.id,{method:"PATCH",body:editForm}).then(function(){notify("Updated!","success");setShowSettings(false);}).catch(function(e){notify(e.message,"error");});
  }

  function startNewDoc() {
    setShowNewDoc(false);
    setCreatingDoc(true);
  }

  function onDocSaved() { setEditingDoc(null); setCreatingDoc(false); loadFiles(); loadAllFiles(); }

  /* If editing/creating a document, show the editor */
  if (editingDoc) {
    return React.createElement(DocumentEditor, { file: editingDoc, onBack: function(){setEditingDoc(null);loadFiles();}, onSaved: onDocSaved, projectId: project.id, parentId: parentId });
  }
  if (creatingDoc) {
    return React.createElement(DocumentEditor, { file: null, onBack: function(){setCreatingDoc(false);}, onSaved: onDocSaved, projectId: project.id, parentId: parentId });
  }

  var accentColor = project.color || "var(--accent)";
  var docCount = allFiles.filter(function(f){return !f.is_folder && f.mime_type;}).length;
  var folderCount = allFiles.filter(function(f){return f.is_folder;}).length;
  var totalSize = allFiles.reduce(function(a,f){return a+parseInt(f.size||0);},0);
  var recentFiles = allFiles.slice(0,5);

  return (
    <div>
      {/* ── Project Header ── */}
      <div style={{marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
          <button className="btn btn-ghost btn-sm" onClick={onBack}><IconArrowLeft /> All Projects</button>
        </div>
        <div style={{background:"var(--bg-secondary)",border:"1px solid var(--border-subtle)",borderRadius:"var(--radius-xl)",padding:24,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:accentColor}} />
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:16}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:4}}>
                <h1 style={{fontSize:22,fontWeight:700}}>{project.name}</h1>
                <span className={"badge "+(project.status==="active"?"badge-success":"badge-neutral")}>{project.status}</span>
              </div>
              {project.description&&<p style={{fontSize:13,color:"var(--text-secondary)",marginBottom:4}}>{project.description}</p>}
              <span style={{fontSize:12,color:"var(--text-tertiary)"}}>Space: <strong style={{color:"var(--text-primary)"}}>{project.space_name}</strong></span>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={function(){setShowSettings(true);}}><IconSettings /> Settings</button>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs items={["Overview","Files","Members","Activity"]} active={tab} onChange={setTab} />

      {/* ════════════════════════ OVERVIEW TAB ════════════════════════ */}
      {tab==="Overview"&&<div>
        {/* Stats row */}
        <div className="stats-grid">
          <div className="stat-card"><div style={{position:"absolute",top:0,left:0,right:0,height:2,background:accentColor}} /><div className="stat-label">Files</div><div className="stat-value" style={{color:accentColor}}>{docCount}</div></div>
          <div className="stat-card"><div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"var(--purple)"}} /><div className="stat-label">Folders</div><div className="stat-value" style={{color:"var(--purple)"}}>{folderCount}</div></div>
          <div className="stat-card"><div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"var(--success)"}} /><div className="stat-label">Members</div><div className="stat-value" style={{color:"var(--success)"}}>{project.member_count}</div></div>
          <div className="stat-card"><div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"var(--warning)"}} /><div className="stat-label">Storage</div><div className="stat-value" style={{color:"var(--warning)"}}>{fmtSize(totalSize)}</div></div>
        </div>

        {/* Quick Actions */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,marginBottom:24}}>
          <button className="btn btn-secondary" style={{padding:16,flexDirection:"column",height:"auto",gap:8}} onClick={function(){setShowNewDoc(true);}}>
            <IconFileText /><span>New Document</span>
          </button>
          <button className="btn btn-secondary" style={{padding:16,flexDirection:"column",height:"auto",gap:8}} onClick={function(){setTab("Files");setShowNewFolder(true);}}>
            <IconFolder /><span>New Folder</span>
          </button>
          <button className="btn btn-secondary" style={{padding:16,flexDirection:"column",height:"auto",gap:8}} onClick={function(){setTab("Files");setTimeout(function(){fileInput.current&&fileInput.current.click();},100);}}>
            <IconUpload /><span>Upload Files</span>
          </button>
          <button className="btn btn-secondary" style={{padding:16,flexDirection:"column",height:"auto",gap:8}} onClick={function(){setTab("Members");}}>
            <IconUsers /><span>View Members</span>
          </button>
        </div>

        {/* Two column: recent files + activity */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
          <div className="card">
            <div className="card-header"><span className="card-title">Recent Files</span><button className="btn btn-ghost btn-sm" onClick={function(){setTab("Files");}}>View All</button></div>
            {recentFiles.length===0?<div className="card-body"><Empty title="No files yet" sub="Create or upload files" /></div>:
            <div className="table-wrap"><table><thead><tr><th>Name</th><th>Modified</th></tr></thead><tbody>{recentFiles.map(function(f){return(
              <tr key={f.id} style={{cursor:"pointer"}} onClick={function(){openFolder(f);}}>
                <td><div className="file-name"><FileIcon type={fileType(f.mime_type,f.is_folder)} /><span>{f.name}</span>{f.is_starred&&<span style={{color:"#FBBF24"}}><IconStar filled={true} /></span>}</div></td>
                <td style={{color:"var(--text-tertiary)",fontSize:12}}>{fmtTime(f.updated_at)}</td>
              </tr>
            );})}</tbody></table></div>}
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">Recent Activity</span></div>
            <div className="card-body" style={{padding:"8px 20px"}}>
              {activity.length===0?<Empty title="No activity" sub="Actions appear here" />:
              <div className="activity-list">{activity.slice(0,6).map(function(a){return(
                <div className="activity-item" key={a.id}><div className="activity-icon"><IconActivity /></div><div><div className="activity-text"><strong>{a.user_name||"System"}</strong> {a.action} <strong>{a.entity_name||""}</strong></div><div className="activity-time">{fmtTime(a.created_at)}</div></div></div>
              );})}</div>}
            </div>
          </div>
        </div>
      </div>}

      {/* ════════════════════════ FILES TAB ════════════════════════ */}
      {tab==="Files"&&<div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            {breadcrumb.map(function(b,i){return(
              <span key={i} style={{display:"flex",alignItems:"center",gap:6}}>
                {i>0&&<IconChevRight />}
                <span onClick={function(){navTo(i);}} style={{cursor:"pointer",fontSize:13,fontWeight:i===breadcrumb.length-1?600:400,color:i===breadcrumb.length-1?"var(--text-primary)":"var(--text-secondary)"}}>{b.name}</span>
              </span>
            );})}
          </div>
          <div style={{display:"flex",gap:8}}>
            <button className="btn btn-ghost btn-icon" onClick={function(){setViewMode("grid");}} style={{color:viewMode==="grid"?"var(--accent)":undefined}}><IconGrid /></button>
            <button className="btn btn-ghost btn-icon" onClick={function(){setViewMode("list");}} style={{color:viewMode==="list"?"var(--accent)":undefined}}><IconList /></button>
            <button className="btn btn-secondary btn-sm" onClick={function(){setShowNewDoc(true);}}><IconFileText /> New Doc</button>
            <button className="btn btn-secondary btn-sm" onClick={function(){setShowNewFolder(true);}}><IconPlus /> Folder</button>
            <button className="btn btn-primary btn-sm" onClick={function(){fileInput.current.click();}}><IconUpload /> Upload</button>
            <input ref={fileInput} type="file" multiple style={{display:"none"}} onChange={handleUpload} />
          </div>
        </div>

        {loading?<div style={{textAlign:"center",padding:40,color:"var(--text-tertiary)"}}>Loading...</div>:
          files.length===0?<Empty icon="📁" title="No files here" sub="Create a document, upload files, or add a folder" />:
          viewMode==="grid"?
            <div className="files-grid">{files.map(function(f){return(
              <div className="file-card" key={f.id} onClick={function(){openFolder(f);}}>
                <div style={{marginBottom:10}}><FileIcon type={fileType(f.mime_type,f.is_folder)} /></div>
                <div className="file-card-name">{f.name}</div>
                <div className="file-card-meta">{f.is_folder?"Folder":fmtSize(f.size)} · {fmtTime(f.updated_at)}</div>
              </div>
            );})}</div>:
            <div className="card"><div className="table-wrap"><table>
              <thead><tr><th>Name</th><th>Modified</th><th>Size</th><th>Owner</th><th style={{width:120}}>Actions</th></tr></thead>
              <tbody>{files.map(function(f){return(
                <tr key={f.id}>
                  <td><div className="file-name" style={{cursor:"pointer"}} onClick={function(){openFolder(f);}}>
                    <FileIcon type={fileType(f.mime_type,f.is_folder)} /><span>{f.name}</span>
                    {f.is_starred&&<span style={{color:"#FBBF24"}}><IconStar filled={true} /></span>}
                  </div></td>
                  <td style={{color:"var(--text-secondary)"}}>{fmtTime(f.updated_at)}</td>
                  <td style={{color:"var(--text-tertiary)"}}>{f.is_folder?"—":fmtSize(f.size)}</td>
                  <td style={{color:"var(--text-secondary)",fontSize:12}}>{f.owner_name||"—"}</td>
                  <td><div style={{display:"flex",gap:4}}>
                    {!f.is_folder&&<button className="btn btn-ghost btn-icon btn-sm" onClick={function(){downloadFile(f);}}><IconDownload /></button>}
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={function(){toggleStar(f);}} style={{color:f.is_starred?"#FBBF24":undefined}}><IconStar filled={f.is_starred} /></button>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={function(){trashFile(f);}}><IconTrash /></button>
                  </div></td>
                </tr>
              );})}</tbody>
            </table></div></div>
        }
      </div>}

      {/* ════════════════════════ MEMBERS TAB ════════════════════════ */}
      {tab==="Members"&&<div className="card">
        <div className="card-header"><span className="card-title">Project Members</span></div>
        {members.length===0?<div className="card-body"><Empty title="No members" sub="Organization members" /></div>:
        <div className="table-wrap"><table>
          <thead><tr><th>User</th><th>Role</th><th>Department</th><th>Status</th><th>Last Active</th></tr></thead>
          <tbody>{members.map(function(u){return(
            <tr key={u.id}>
              <td><div style={{display:"flex",alignItems:"center",gap:10}}><div className="avatar-sm" style={{background:"hsl("+(u.email.charCodeAt(0)*7)+",55%,50%)"}}>{(u.name||"").substring(0,2).toUpperCase()}</div><div><div style={{fontWeight:500,fontSize:13}}>{u.name}</div><div style={{fontSize:11,color:"var(--text-tertiary)"}}>{u.email}</div></div></div></td>
              <td><RoleBadge role={u.role} /></td>
              <td style={{color:"var(--text-secondary)",fontSize:13}}>{u.department||"—"}</td>
              <td><div style={{display:"flex",alignItems:"center",gap:6}}><StatusDot status={u.status} /><span style={{fontSize:12,color:"var(--text-secondary)"}}>{u.status}</span></div></td>
              <td style={{color:"var(--text-tertiary)",fontSize:12}}>{fmtTime(u.last_active_at)}</td>
            </tr>
          );})}</tbody>
        </table></div>}
      </div>}

      {/* ════════════════════════ ACTIVITY TAB ════════════════════════ */}
      {tab==="Activity"&&<div className="card">
        <div className="card-header"><span className="card-title">Activity Feed</span></div>
        <div className="card-body" style={{padding:"8px 20px"}}>
          {activity.length===0?<Empty title="No activity" sub="Actions appear here" />:
          <div className="activity-list">{activity.map(function(a){return(
            <div className="activity-item" key={a.id}><div className="activity-icon"><IconActivity /></div><div><div className="activity-text"><strong>{a.user_name||"System"}</strong> {a.action} <strong>{a.entity_name||""}</strong></div><div className="activity-time">{fmtTime(a.created_at)}</div></div></div>
          );})}</div>}
        </div>
      </div>}

      {/* ── Modals ── */}
      <Modal open={showNewFolder} onClose={function(){setShowNewFolder(false);}} title="New Folder" footer={
        <React.Fragment><button className="btn btn-secondary" onClick={function(){setShowNewFolder(false);}}>Cancel</button><button className="btn btn-primary" onClick={createFolder}>Create</button></React.Fragment>
      }>
        <div className="form-group"><label className="form-label">Folder Name</label><input className="form-input" placeholder="e.g. Design Assets" value={folderName} onChange={function(e){setFolderName(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")createFolder();}} autoFocus /></div>
      </Modal>

      <Modal open={showNewDoc} onClose={function(){setShowNewDoc(false);}} title="Create New Document" footer={
        <React.Fragment><button className="btn btn-secondary" onClick={function(){setShowNewDoc(false);}}>Cancel</button><button className="btn btn-primary" onClick={startNewDoc}><IconFileText /> Create Document</button></React.Fragment>
      }>
        <p style={{fontSize:13,color:"var(--text-secondary)",marginBottom:16}}>Create a rich text document directly in your project. You can format text, add headings, lists, links, and more.</p>
        <div className="form-group"><label className="form-label">Document Name</label><input className="form-input" placeholder="e.g. Meeting Notes, Project Brief..." value={newDocName} onChange={function(e){setNewDocName(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")startNewDoc();}} autoFocus /></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
          {[
            {id:"blank",icon:"📄",label:"Blank Document",desc:"Start from scratch"},
            {id:"notes",icon:"📝",label:"Meeting Notes",desc:"Agenda & notes template"},
            {id:"brief",icon:"📋",label:"Project Brief",desc:"Overview template"},
          ].map(function(t){return(
            <div key={t.id} onClick={function(){setNewDocType(t.id);}} style={{
              padding:16,borderRadius:"var(--radius)",border:"1px solid "+(newDocType===t.id?"var(--accent)":"var(--border-subtle)"),
              background:newDocType===t.id?"var(--accent-muted)":"var(--bg-tertiary)",cursor:"pointer",textAlign:"center",transition:"all var(--transition)"
            }}>
              <div style={{fontSize:24,marginBottom:6}}>{t.icon}</div>
              <div style={{fontSize:12,fontWeight:600}}>{t.label}</div>
              <div style={{fontSize:10,color:"var(--text-tertiary)",marginTop:2}}>{t.desc}</div>
            </div>
          );})}
        </div>
      </Modal>

      <Modal open={showSettings} onClose={function(){setShowSettings(false);}} title="Project Settings" footer={
        <React.Fragment>
          <button className="btn btn-danger btn-sm" onClick={function(){if(confirm("Delete this project? This cannot be undone.")){apiFetch("/projects/"+project.id,{method:"DELETE"}).then(function(){notify("Project deleted","success");onBack();}).catch(function(e){notify(e.message,"error");});}}}>Delete Project</button>
          <div style={{flex:1}} />
          <button className="btn btn-secondary" onClick={function(){setShowSettings(false);}}>Cancel</button>
          <button className="btn btn-primary" onClick={saveSettings}>Save Changes</button>
        </React.Fragment>
      }>
        <div className="form-group"><label className="form-label">Project Name</label><input className="form-input" value={editForm.name} onChange={function(e){setEditForm({...editForm,name:e.target.value});}} /></div>
        <div className="form-group"><label className="form-label">Description</label><input className="form-input" value={editForm.description} onChange={function(e){setEditForm({...editForm,description:e.target.value});}} /></div>
        <div className="form-group"><label className="form-label">Color</label><input type="color" className="form-input" style={{height:40,padding:4}} value={editForm.color} onChange={function(e){setEditForm({...editForm,color:e.target.value});}} /></div>
        <div className="form-group"><label className="form-label">Status</label><select className="form-select" value={editForm.status} onChange={function(e){setEditForm({...editForm,status:e.target.value});}}><option value="active">Active</option><option value="completed">Completed</option><option value="archived">Archived</option></select></div>
      </Modal>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE: SPACES
   ═══════════════════════════════════════════════════════════════════════════ */
function SpacesPage() {
  var [spaces, setSpaces] = useState([]);
  var [show, setShow] = useState(false);
  var [form, setForm] = useState({name:"",icon:"📁",color:"#4F8EF7",description:"",portal_ids:[]});
  var [portals, setPortals] = useState([]);
  var [activeSpace, setActiveSpace] = useState(null);
  var auth = useAuth();
  var notify = useNotify();
  function loadSpaces() { apiFetch("/spaces").then(function(d){setSpaces(d.spaces||[]);}); }
  useEffect(loadSpaces, []);
  function create() {
    if(!form.name){notify("Name required","error");return;}
    apiFetch("/spaces",{method:"POST",body:form}).then(function(space){
      // Auto-assign space to selected portals' users
      if(form.portal_ids&&form.portal_ids.length>0){
        form.portal_ids.forEach(function(pid){
          apiFetch("/portals/"+pid+"/access",{method:"GET"}).then(function(d){
            (d.access||[]).forEach(function(a){
              if(a.is_active){
                var sids=(a.space_ids||[]).slice();
                if(space.id&&sids.indexOf(space.id)<0) sids.push(space.id);
                apiFetch("/portals/"+pid+"/access/"+a.user_id,{method:"PATCH",body:{space_ids:sids}}).catch(function(){});
              }
            });
          }).catch(function(){});
        });
      }notify("Created!","success");setShow(false);setForm({name:"",icon:"📁",color:"#4F8EF7",description:"",portal_ids:[]});loadSpaces();}).catch(function(e){notify(e.message,"error");});
  }

  if (activeSpace) {
    return React.createElement(SpaceWorkspace, { space: activeSpace, onBack: function(){ setActiveSpace(null); loadSpaces(); } });
  }

  return (
    <div>
      <div className="page-header"><div><div className="page-title">Spaces</div><div className="page-subtitle">Team workspaces</div></div>{auth.user&&(auth.user.role==="admin"||auth.user.role==="file_manager")&&<button className="btn btn-primary" onClick={function(){setShow(true);}}><IconPlus /> New Space</button>}</div>
      {spaces.length===0?<Empty icon="🗂️" title="No spaces yet" sub="Create spaces to organize your team" />:
      <div className="project-grid">{spaces.map(function(s){return(
        <div className="project-card" key={s.id} onClick={function(){setActiveSpace(s);}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:s.color||"var(--accent)"}} />
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}><span style={{fontSize:28}}>{s.icon||"📁"}</span><h3 style={{fontSize:16,fontWeight:700}}>{s.name}</h3></div>
          {s.description&&<p style={{fontSize:12,color:"var(--text-tertiary)",marginBottom:8}}>{s.description}</p>}
          <div className="project-card-stats"><div className="project-stat"><strong>{s.member_count}</strong> members</div><div className="project-stat"><strong>{fmtSize(parseInt(s.storage_used))}</strong> used</div></div>
          {auth.user&&auth.user.role==="admin"&&<div style={{display:"flex",gap:6,marginTop:12,borderTop:"1px solid var(--border-subtle)",paddingTop:12}}>
            <button className="btn btn-danger btn-sm" onClick={function(e){e.stopPropagation();if(confirm("Delete space \""+s.name+"\"? All files and projects in this space will be affected.")){apiFetch("/spaces/"+s.id,{method:"DELETE"}).then(function(){notify("Space deleted","success");loadSpaces();}).catch(function(err){notify(err.message,"error");});}}}>Delete Space</button>
          </div>}
        </div>
      );})}</div>}
      <Modal open={show} onClose={function(){setShow(false);}} title="Create Space" footer={<React.Fragment><button className="btn btn-secondary" onClick={function(){setShow(false);}}>Cancel</button><button className="btn btn-primary" onClick={create}>Create</button></React.Fragment>}>
        <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={function(e){setForm({...form,name:e.target.value});}} placeholder="e.g. Engineering" /></div>
        <div className="form-group"><label className="form-label">Icon (emoji)</label><input className="form-input" value={form.icon} onChange={function(e){setForm({...form,icon:e.target.value});}} /></div>
        <div className="form-group"><label className="form-label">Color</label><input type="color" className="form-input" style={{height:40,padding:4}} value={form.color} onChange={function(e){setForm({...form,color:e.target.value});}} /></div>
        <div className="form-group"><label className="form-label">Description</label><input className="form-input" value={form.description} onChange={function(e){setForm({...form,description:e.target.value});}} placeholder="What is this space for?" /></div>
      </Modal>
    </div>
  );
}

/* ── Space Workspace ── */
function SpaceWorkspace(props) {
  var space = props.space;
  var onBack = props.onBack;
  var [tab, setTab] = useState("Overview");
  var [files, setFiles] = useState([]);
  var [allFiles, setAllFiles] = useState([]);
  var [loading, setLoading] = useState(true);
  var [parentId, setParentId] = useState(null);
  var [breadcrumb, setBreadcrumb] = useState([{id:null,name:"Files"}]);
  var [viewMode, setViewMode] = useState("list");
  var [showNewFolder, setShowNewFolder] = useState(false);
  var [folderName, setFolderName] = useState("");
  var [activity, setActivity] = useState([]);
  var [members, setMembers] = useState([]);
  var [projects, setProjects] = useState([]);
  var [showNewDoc, setShowNewDoc] = useState(false);
  var [creatingDoc, setCreatingDoc] = useState(false);
  var [editingDoc, setEditingDoc] = useState(null);
  var [showSettings, setShowSettings] = useState(false);
  var [showAddMember, setShowAddMember] = useState(false);
  var [allUsers, setAllUsers] = useState([]);
  var [addMemberForm, setAddMemberForm] = useState({user_id:"",role:"member"});
  var fileInput = useRef(null);
  var notify = useNotify();

  function loadFiles() {
    setLoading(true);
    var p = new URLSearchParams();
    p.set("space_id", space.id);
    if (parentId) p.set("parent_id", parentId);
    apiFetch("/files?" + p.toString())
      .then(function(d) { setFiles(d.files || []); })
      .catch(function(e) { notify(e.message, "error"); })
      .finally(function() { setLoading(false); });
  }
  function loadAllFiles() {
    apiFetch("/files?space_id=" + space.id + "&limit=200")
      .then(function(d) { setAllFiles(d.files || []); }).catch(function(){});
  }
  function loadActivity() { apiFetch("/activity?limit=20").then(function(d) { setActivity(d.activity || []); }).catch(function(){}); }
  function loadMembers() { apiFetch("/users").then(function(d) { setMembers(d.users || []); setAllUsers(d.users || []); }).catch(function(){}); }
  function loadProjects() { apiFetch("/projects?space_id=" + space.id).then(function(d) { setProjects(d.projects || []); }).catch(function(){}); }

  useEffect(function() { loadFiles(); loadAllFiles(); loadActivity(); loadMembers(); loadProjects(); }, [parentId]);

  function openFolder(f) {
    if (f.is_folder) { setParentId(f.id); setBreadcrumb(function(b){return b.concat({id:f.id,name:f.name});}); }
    else if (f.mime_type === "text/html" || (f.name && f.name.endsWith(".html"))) { setEditingDoc(f); }
  }
  function navTo(idx) { var bc=breadcrumb.slice(0,idx+1); setBreadcrumb(bc); setParentId(bc[bc.length-1].id); }
  function handleUpload(e) {
    var fl=e.target.files; if(!fl||!fl.length) return;
    var fd=new FormData();
    for(var i=0;i<fl.length;i++) fd.append("files",fl[i]);
    fd.append("space_id",space.id);
    if(parentId) fd.append("parent_id",parentId);
    apiFetch("/files/upload",{method:"POST",body:fd}).then(function(){notify("Uploaded!","success");loadFiles();loadAllFiles();}).catch(function(err){notify(err.message,"error");});
    e.target.value="";
  }
  function createFolder() {
    if(!folderName.trim()) return;
    apiFetch("/files/folder",{method:"POST",body:{name:folderName,parent_id:parentId,space_id:space.id}}).then(function(){notify("Folder created!","success");setShowNewFolder(false);setFolderName("");loadFiles();loadAllFiles();}).catch(function(err){notify(err.message,"error");});
  }
  function toggleStar(f) { apiFetch("/files/"+f.id+"/star",{method:"PATCH"}).then(loadFiles); }
  function trashFile(f) { apiFetch("/files/"+f.id+"/trash",{method:"PATCH"}).then(function(){notify("Trashed","success");loadFiles();loadAllFiles();}); }
  function downloadFile(f) { if(f.is_folder) return; window.open(API+"/files/"+f.id+"/download?token="+getToken(),"_blank"); }
  function onDocSaved() { setEditingDoc(null); setCreatingDoc(false); loadFiles(); loadAllFiles(); }
  function addMember() {
    if(!addMemberForm.user_id){notify("Select a user","error");return;}
    apiFetch("/spaces/"+space.id+"/members",{method:"POST",body:addMemberForm}).then(function(){notify("Member added!","success");setShowAddMember(false);setAddMemberForm({user_id:"",role:"member"});loadMembers();}).catch(function(e){notify(e.message,"error");});
  }
  function removeMember(uid) {
    apiFetch("/spaces/"+space.id+"/members/"+uid,{method:"DELETE"}).then(function(){notify("Member removed","success");loadMembers();}).catch(function(e){notify(e.message,"error");});
  }

  /* Document editor view */
  if (editingDoc) return React.createElement(DocumentEditor, {file:editingDoc,onBack:function(){setEditingDoc(null);loadFiles();},onSaved:onDocSaved,projectId:null,parentId:parentId});
  if (creatingDoc) return React.createElement(DocumentEditor, {file:null,onBack:function(){setCreatingDoc(false);},onSaved:onDocSaved,projectId:null,parentId:parentId});

  var accentColor = space.color || "var(--accent)";
  var docCount = allFiles.filter(function(f){return !f.is_folder && f.mime_type;}).length;
  var folderCount = allFiles.filter(function(f){return f.is_folder;}).length;
  var totalSize = allFiles.reduce(function(a,f){return a+parseInt(f.size||0);},0);
  var recentFiles = allFiles.slice(0,5);

  return (
    <div>
      {/* ── Space Header ── */}
      <div style={{marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
          <button className="btn btn-ghost btn-sm" onClick={onBack}><IconArrowLeft /> All Spaces</button>
        </div>
        <div style={{background:"var(--bg-secondary)",border:"1px solid var(--border-subtle)",borderRadius:"var(--radius-xl)",padding:24,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:accentColor}} />
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:16}}>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <span style={{fontSize:36}}>{space.icon||"📁"}</span>
              <div>
                <h1 style={{fontSize:22,fontWeight:700}}>{space.name}</h1>
                {space.description&&<p style={{fontSize:13,color:"var(--text-secondary)",marginTop:2}}>{space.description}</p>}
              </div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={function(){setShowSettings(true);}}><IconSettings /> Settings</button>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs items={["Overview","Files","Projects","Members","Activity"]} active={tab} onChange={setTab} />

      {/* ════════════════════════ OVERVIEW ════════════════════════ */}
      {tab==="Overview"&&<div>
        <div className="stats-grid">
          <div className="stat-card"><div style={{position:"absolute",top:0,left:0,right:0,height:2,background:accentColor}} /><div className="stat-label">Files</div><div className="stat-value" style={{color:accentColor}}>{docCount}</div></div>
          <div className="stat-card"><div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"var(--purple)"}} /><div className="stat-label">Folders</div><div className="stat-value" style={{color:"var(--purple)"}}>{folderCount}</div></div>
          <div className="stat-card"><div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"var(--success)"}} /><div className="stat-label">Projects</div><div className="stat-value" style={{color:"var(--success)"}}>{projects.length}</div></div>
          <div className="stat-card"><div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"var(--warning)"}} /><div className="stat-label">Storage</div><div className="stat-value" style={{color:"var(--warning)"}}>{fmtSize(totalSize)}</div></div>
        </div>

        {/* Quick Actions */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,marginBottom:24}}>
          <button className="btn btn-secondary" style={{padding:16,flexDirection:"column",height:"auto",gap:8}} onClick={function(){setShowNewDoc(true);}}><IconFileText /><span>New Document</span></button>
          <button className="btn btn-secondary" style={{padding:16,flexDirection:"column",height:"auto",gap:8}} onClick={function(){setTab("Files");setShowNewFolder(true);}}><IconFolder /><span>New Folder</span></button>
          <button className="btn btn-secondary" style={{padding:16,flexDirection:"column",height:"auto",gap:8}} onClick={function(){setTab("Files");setTimeout(function(){fileInput.current&&fileInput.current.click();},100);}}><IconUpload /><span>Upload Files</span></button>
          <button className="btn btn-secondary" style={{padding:16,flexDirection:"column",height:"auto",gap:8}} onClick={function(){setTab("Members");}}><IconUsers /><span>Manage Members</span></button>
        </div>

        {/* Two col: recent + activity */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
          <div className="card">
            <div className="card-header"><span className="card-title">Recent Files</span><button className="btn btn-ghost btn-sm" onClick={function(){setTab("Files");}}>View All</button></div>
            {recentFiles.length===0?<div className="card-body"><Empty title="No files yet" sub="Create or upload files" /></div>:
            <div className="table-wrap"><table><thead><tr><th>Name</th><th>Modified</th></tr></thead><tbody>{recentFiles.map(function(f){return(
              <tr key={f.id} style={{cursor:"pointer"}} onClick={function(){openFolder(f);}}>
                <td><div className="file-name"><FileIcon type={fileType(f.mime_type,f.is_folder)} /><span>{f.name}</span></div></td>
                <td style={{color:"var(--text-tertiary)",fontSize:12}}>{fmtTime(f.updated_at)}</td>
              </tr>
            );})}</tbody></table></div>}
          </div>
          <div>
            {/* Projects in this space */}
            <div className="card" style={{marginBottom:20}}>
              <div className="card-header"><span className="card-title">Projects</span><button className="btn btn-ghost btn-sm" onClick={function(){setTab("Projects");}}>View All</button></div>
              <div className="card-body" style={{padding:"8px 20px"}}>
                {projects.length===0?<div style={{padding:"20px 0",textAlign:"center",color:"var(--text-tertiary)",fontSize:13}}>No projects in this space</div>:
                <div>{projects.slice(0,4).map(function(p){return(
                  <div key={p.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid var(--border-subtle)"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:8,height:8,borderRadius:2,background:p.color||"var(--accent)"}} />
                      <span style={{fontSize:13,fontWeight:500}}>{p.name}</span>
                    </div>
                    <div style={{display:"flex",gap:12,fontSize:11,color:"var(--text-tertiary)"}}>
                      <span>{p.file_count} files</span>
                      <span className={"badge badge-"+(p.status==="active"?"success":"neutral")} style={{fontSize:10}}>{p.status}</span>
                    </div>
                  </div>
                );})}</div>}
              </div>
            </div>
            {/* Recent activity */}
            <div className="card">
              <div className="card-header"><span className="card-title">Activity</span></div>
              <div className="card-body" style={{padding:"8px 20px"}}>
                {activity.length===0?<Empty title="No activity" sub="Actions appear here" />:
                <div className="activity-list">{activity.slice(0,5).map(function(a){return(
                  <div className="activity-item" key={a.id}><div className="activity-icon"><IconActivity /></div><div><div className="activity-text"><strong>{a.user_name||"System"}</strong> {a.action} <strong>{a.entity_name||""}</strong></div><div className="activity-time">{fmtTime(a.created_at)}</div></div></div>
                );})}</div>}
              </div>
            </div>
          </div>
        </div>
      </div>}

      {/* ════════════════════════ FILES ════════════════════════ */}
      {tab==="Files"&&<div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            {breadcrumb.map(function(b,i){return(
              <span key={i} style={{display:"flex",alignItems:"center",gap:6}}>
                {i>0&&<IconChevRight />}
                <span onClick={function(){navTo(i);}} style={{cursor:"pointer",fontSize:13,fontWeight:i===breadcrumb.length-1?600:400,color:i===breadcrumb.length-1?"var(--text-primary)":"var(--text-secondary)"}}>{b.name}</span>
              </span>
            );})}
          </div>
          <div style={{display:"flex",gap:8}}>
            <button className="btn btn-ghost btn-icon" onClick={function(){setViewMode("grid");}} style={{color:viewMode==="grid"?"var(--accent)":undefined}}><IconGrid /></button>
            <button className="btn btn-ghost btn-icon" onClick={function(){setViewMode("list");}} style={{color:viewMode==="list"?"var(--accent)":undefined}}><IconList /></button>
            <button className="btn btn-secondary btn-sm" onClick={function(){setShowNewDoc(true);}}><IconFileText /> New Doc</button>
            <button className="btn btn-secondary btn-sm" onClick={function(){setShowNewFolder(true);}}><IconPlus /> Folder</button>
            <button className="btn btn-primary btn-sm" onClick={function(){fileInput.current.click();}}><IconUpload /> Upload</button>
            <input ref={fileInput} type="file" multiple style={{display:"none"}} onChange={handleUpload} />
          </div>
        </div>
        {loading?<div style={{textAlign:"center",padding:40,color:"var(--text-tertiary)"}}>Loading...</div>:
          files.length===0?<Empty icon="📁" title="No files here" sub="Create a document, upload files, or add a folder" />:
          viewMode==="grid"?
            <div className="files-grid">{files.map(function(f){return(
              <div className="file-card" key={f.id} onClick={function(){openFolder(f);}}>
                <div style={{marginBottom:10}}><FileIcon type={fileType(f.mime_type,f.is_folder)} /></div>
                <div className="file-card-name">{f.name}</div>
                <div className="file-card-meta">{f.is_folder?"Folder":fmtSize(f.size)} · {fmtTime(f.updated_at)}</div>
              </div>
            );})}</div>:
            <div className="card"><div className="table-wrap"><table>
              <thead><tr><th>Name</th><th>Modified</th><th>Size</th><th>Owner</th><th style={{width:120}}>Actions</th></tr></thead>
              <tbody>{files.map(function(f){return(
                <tr key={f.id}>
                  <td><div className="file-name" style={{cursor:"pointer"}} onClick={function(){openFolder(f);}}>
                    <FileIcon type={fileType(f.mime_type,f.is_folder)} /><span>{f.name}</span>
                    {f.is_starred&&<span style={{color:"#FBBF24"}}><IconStar filled={true} /></span>}
                  </div></td>
                  <td style={{color:"var(--text-secondary)"}}>{fmtTime(f.updated_at)}</td>
                  <td style={{color:"var(--text-tertiary)"}}>{f.is_folder?"—":fmtSize(f.size)}</td>
                  <td style={{color:"var(--text-secondary)",fontSize:12}}>{f.owner_name||"—"}</td>
                  <td><div style={{display:"flex",gap:4}}>
                    {!f.is_folder&&<button className="btn btn-ghost btn-icon btn-sm" onClick={function(){downloadFile(f);}}><IconDownload /></button>}
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={function(){toggleStar(f);}} style={{color:f.is_starred?"#FBBF24":undefined}}><IconStar filled={f.is_starred} /></button>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={function(){trashFile(f);}}><IconTrash /></button>
                  </div></td>
                </tr>
              );})}</tbody>
            </table></div></div>
        }
      </div>}

      {/* ════════════════════════ PROJECTS ════════════════════════ */}
      {tab==="Projects"&&<div>
        {projects.length===0?<Empty icon="📋" title="No projects in this space" sub="Create a project from the Projects page" />:
        <div className="project-grid">{projects.map(function(p){return(
          <div className="project-card" key={p.id}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:p.color||"var(--accent)"}} />
            <div className="project-card-header"><div><h3>{p.name}</h3></div><span className={"badge "+(p.status==="active"?"badge-success":"badge-neutral")}>{p.status}</span></div>
            {p.description&&<p style={{fontSize:12,color:"var(--text-tertiary)",margin:"8px 0"}}>{p.description}</p>}
            <div className="project-card-stats"><div className="project-stat"><strong>{p.member_count}</strong> members</div><div className="project-stat"><strong>{p.file_count}</strong> files</div><div className="project-stat"><strong>{fmtSize(parseInt(p.storage_used))}</strong></div></div>
          </div>
        );})}</div>}
      </div>}

      {/* ════════════════════════ MEMBERS ════════════════════════ */}
      {tab==="Members"&&<div>
        <div style={{marginBottom:16,display:"flex",justifyContent:"flex-end"}}>
          <button className="btn btn-primary btn-sm" onClick={function(){setShowAddMember(true);}}><IconPlus /> Add Member</button>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Space Members</span><span style={{fontSize:12,color:"var(--text-tertiary)"}}>{members.length} members</span></div>
          {members.length===0?<div className="card-body"><Empty title="No members" sub="Add members to this space" /></div>:
          <div className="table-wrap"><table>
            <thead><tr><th>User</th><th>Role</th><th>Department</th><th>Status</th><th>Last Active</th><th style={{width:80}}>Actions</th></tr></thead>
            <tbody>{members.map(function(u){return(
              <tr key={u.id}>
                <td><div style={{display:"flex",alignItems:"center",gap:10}}><div className="avatar-sm" style={{background:"hsl("+(u.email.charCodeAt(0)*7)+",55%,50%)"}}>{(u.name||"").substring(0,2).toUpperCase()}</div><div><div style={{fontWeight:500,fontSize:13}}>{u.name}</div><div style={{fontSize:11,color:"var(--text-tertiary)"}}>{u.email}</div></div></div></td>
                <td><RoleBadge role={u.role} /></td>
                <td style={{color:"var(--text-secondary)",fontSize:13}}>{u.department||"—"}</td>
                <td><div style={{display:"flex",alignItems:"center",gap:6}}><StatusDot status={u.status} /><span style={{fontSize:12,color:"var(--text-secondary)"}}>{u.status}</span></div></td>
                <td style={{color:"var(--text-tertiary)",fontSize:12}}>{fmtTime(u.last_active_at)}</td>
                <td><button className="btn btn-ghost btn-sm btn-icon" onClick={function(){removeMember(u.id);}} title="Remove"><IconX /></button></td>
              </tr>
            );})}</tbody>
          </table></div>}
        </div>
      </div>}

      {/* ════════════════════════ ACTIVITY ════════════════════════ */}
      {tab==="Activity"&&<div className="card">
        <div className="card-header"><span className="card-title">Activity Feed</span></div>
        <div className="card-body" style={{padding:"8px 20px"}}>
          {activity.length===0?<Empty title="No activity" sub="Actions appear here" />:
          <div className="activity-list">{activity.map(function(a){return(
            <div className="activity-item" key={a.id}><div className="activity-icon"><IconActivity /></div><div><div className="activity-text"><strong>{a.user_name||"System"}</strong> {a.action} <strong>{a.entity_name||""}</strong></div><div className="activity-time">{fmtTime(a.created_at)}</div></div></div>
          );})}</div>}
        </div>
      </div>}

      {/* ── Modals ── */}
      <Modal open={showNewFolder} onClose={function(){setShowNewFolder(false);}} title="New Folder" footer={
        <React.Fragment><button className="btn btn-secondary" onClick={function(){setShowNewFolder(false);}}>Cancel</button><button className="btn btn-primary" onClick={createFolder}>Create</button></React.Fragment>
      }>
        <div className="form-group"><label className="form-label">Folder Name</label><input className="form-input" placeholder="e.g. Design Assets" value={folderName} onChange={function(e){setFolderName(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")createFolder();}} autoFocus /></div>
      </Modal>

      <Modal open={showNewDoc} onClose={function(){setShowNewDoc(false);}} title="Create New Document" footer={
        <React.Fragment><button className="btn btn-secondary" onClick={function(){setShowNewDoc(false);}}>Cancel</button><button className="btn btn-primary" onClick={function(){setShowNewDoc(false);setCreatingDoc(true);}}><IconFileText /> Create Document</button></React.Fragment>
      }>
        <p style={{fontSize:13,color:"var(--text-secondary)",marginBottom:16}}>Create a rich text document in this space.</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
          {[{icon:"📄",label:"Blank Document",desc:"Start from scratch"},{icon:"📝",label:"Meeting Notes",desc:"Agenda template"},{icon:"📋",label:"Project Brief",desc:"Overview template"}].map(function(t,i){return(
            <div key={i} style={{padding:16,borderRadius:"var(--radius)",border:"1px solid var(--border-subtle)",background:"var(--bg-tertiary)",cursor:"pointer",textAlign:"center",transition:"all var(--transition)"}}>
              <div style={{fontSize:24,marginBottom:6}}>{t.icon}</div>
              <div style={{fontSize:12,fontWeight:600}}>{t.label}</div>
              <div style={{fontSize:10,color:"var(--text-tertiary)",marginTop:2}}>{t.desc}</div>
            </div>
          );})}
        </div>
      </Modal>

      <Modal open={showAddMember} onClose={function(){setShowAddMember(false);}} title="Add Member to Space" footer={
        <React.Fragment><button className="btn btn-secondary" onClick={function(){setShowAddMember(false);}}>Cancel</button><button className="btn btn-primary" onClick={addMember}>Add Member</button></React.Fragment>
      }>
        <div className="form-group"><label className="form-label">User</label><select className="form-select" value={addMemberForm.user_id} onChange={function(e){setAddMemberForm({...addMemberForm,user_id:e.target.value});}}><option value="">Select user...</option>{allUsers.map(function(u){return <option key={u.id} value={u.id}>{u.name} ({u.email})</option>;})}</select></div>
        <div className="form-group"><label className="form-label">Role in Space</label><select className="form-select" value={addMemberForm.role} onChange={function(e){setAddMemberForm({...addMemberForm,role:e.target.value});}}>{Object.keys(roleColors).map(function(r){return <option key={r} value={r}>{r}</option>;})}</select></div>
      </Modal>

      <Modal open={showSettings} onClose={function(){setShowSettings(false);}} title="Space Settings" footer={
        <React.Fragment><button className="btn btn-secondary" onClick={function(){setShowSettings(false);}}>Close</button></React.Fragment>
      }>
        <div className="form-group"><label className="form-label">Space Name</label><div style={{fontSize:14,fontWeight:600}}>{space.name}</div></div>
        <div className="form-group"><label className="form-label">Description</label><div style={{fontSize:13,color:"var(--text-secondary)"}}>{space.description||"No description"}</div></div>
        <div className="form-group"><label className="form-label">Storage Quota</label><div style={{fontSize:13}}>{space.storage_quota && parseInt(space.storage_quota)>0 ? fmtSize(space.storage_quota) : "Unlimited"}</div></div>
        <div className="form-group"><label className="form-label">Created</label><div style={{fontSize:13,color:"var(--text-secondary)"}}>{fmtDate(space.created_at)}</div></div>
      </Modal>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE: USERS
   ═══════════════════════════════════════════════════════════════════════════ */
function UsersPage() {
  var [users, setUsers] = useState([]);
  var [total, setTotal] = useState(0);
  var [show, setShow] = useState(false);
  var [form, setForm] = useState({email:"",name:"",role:"member",department:""});
  var [tab, setTab] = useState("Users");
  var auth = useAuth();
  var notify = useNotify();
  function load() { apiFetch("/users").then(function(d){setUsers(d.users||[]);setTotal(d.total||0);}); }
  useEffect(load, []);
  function invite() {
    if(!form.email||!form.name){notify("Email and name required","error");return;}
    apiFetch("/users/invite",{method:"POST",body:form}).then(function(){notify("Invited!","success");setShow(false);setForm({email:"",name:"",role:"member",department:""});load();}).catch(function(e){notify(e.message,"error");});
  }
  function updateRole(uid,role) { apiFetch("/users/"+uid,{method:"PATCH",body:{role:role}}).then(function(){notify("Updated","success");load();}).catch(function(e){notify(e.message,"error");}); }
  function toggleStatus(u) { var ns=u.status==="active"?"inactive":"active"; apiFetch("/users/"+u.id,{method:"PATCH",body:{status:ns}}).then(function(){notify("Updated","success");load();}).catch(function(e){notify(e.message,"error");}); }
  var isAdmin = auth.user && auth.user.role==="admin";
  return (
    <div>
      <div className="page-header"><div><div className="page-title">User Management</div><div className="page-subtitle">{total} users</div></div>{isAdmin&&<button className="btn btn-primary" onClick={function(){setShow(true);}}><IconPlus /> Invite User</button>}</div>
      <Tabs items={["Users","Roles"]} active={tab} onChange={setTab} />
      {tab==="Users"&&<div className="card">
        {users.length===0?<div className="card-body"><Empty title="No users" sub="Invite your first team member" /></div>:
        <div className="table-wrap"><table>
          <thead><tr><th>User</th><th>Role</th><th>Department</th><th>Status</th><th>Last Active</th>{isAdmin&&<th>Actions</th>}</tr></thead>
          <tbody>{users.map(function(u){return(
            <tr key={u.id}>
              <td><div style={{display:"flex",alignItems:"center",gap:10}}><div className="avatar-sm" style={{background:"hsl("+(u.email.charCodeAt(0)*7)+",55%,50%)"}}>{(u.name||"").substring(0,2).toUpperCase()}</div><div><div style={{fontWeight:500,fontSize:13}}>{u.name}</div><div style={{fontSize:11,color:"var(--text-tertiary)"}}>{u.email}</div></div></div></td>
              <td>{isAdmin&&u.id!==auth.user.id?<select className="form-select" style={{width:"auto",padding:"4px 28px 4px 8px",fontSize:11}} value={u.role} onChange={function(e){updateRole(u.id,e.target.value);}}>{Object.keys(roleColors).map(function(r){return <option key={r} value={r}>{r}</option>;})}</select>:<RoleBadge role={u.role} />}</td>
              <td style={{color:"var(--text-secondary)",fontSize:13}}>{u.department||"—"}</td>
              <td><div style={{display:"flex",alignItems:"center",gap:6}}><StatusDot status={u.status} /><span style={{fontSize:12,color:"var(--text-secondary)"}}>{u.status}</span></div></td>
              <td style={{color:"var(--text-tertiary)",fontSize:12}}>{fmtTime(u.last_active_at)}</td>
              {isAdmin&&<td>{u.id!==auth.user.id&&<div style={{display:"flex",gap:4}}>
                    <button className="btn btn-ghost btn-sm" onClick={function(){toggleStatus(u);}}>{u.status==="active"?"Deactivate":"Activate"}</button>
                    {u.status!=="active"&&<button className="btn btn-danger btn-sm" onClick={function(){if(confirm("Suspend user "+u.name+"? They will not be able to log in.")){apiFetch("/users/"+u.id,{method:"DELETE"}).then(function(){notify("User suspended","success");load();}).catch(function(e){notify(e.message,"error");});}}}>Remove</button>}
                  </div>}</td>}
            </tr>
          );})}</tbody>
        </table></div>}
      </div>}
      {tab==="Roles"&&React.createElement(RoleCards)}
      <Modal open={show} onClose={function(){setShow(false);}} title="Invite User" footer={<React.Fragment><button className="btn btn-secondary" onClick={function(){setShow(false);}}>Cancel</button><button className="btn btn-primary" onClick={invite}>Send Invite</button></React.Fragment>}>
        <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={form.name} onChange={function(e){setForm({...form,name:e.target.value});}} placeholder="John Doe" /></div>
        <div className="form-group"><label className="form-label">Email</label><input className="form-input" value={form.email} onChange={function(e){setForm({...form,email:e.target.value});}} placeholder="user@company.com" /></div>
        <div className="form-group"><label className="form-label">Role</label><select className="form-select" value={form.role} onChange={function(e){setForm({...form,role:e.target.value});}}>{Object.keys(roleColors).map(function(r){return <option key={r} value={r}>{r}</option>;})}</select></div>
        <div className="form-group"><label className="form-label">Department</label><input className="form-input" value={form.department} onChange={function(e){setForm({...form,department:e.target.value});}} /></div>
      </Modal>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE: SHARING
   ═══════════════════════════════════════════════════════════════════════════ */
function SharingPage() {
  var [shares, setShares] = useState([]);
  var [files, setFiles] = useState([]);
  var [show, setShow] = useState(false);
  var [form, setForm] = useState({file_id:"",recipient_email:"",permission:"view",expires_days:"30",password:""});
  var notify = useNotify();
  function load() { apiFetch("/shares").then(function(d){setShares(d.shares||[]);}); apiFetch("/files?limit=100").then(function(d){setFiles((d.files||[]).filter(function(f){return !f.is_folder;}));}); }
  useEffect(load, []);
  function create() {
    if(!form.file_id){notify("Select a file","error");return;}
    var body={file_id:form.file_id,recipient_email:form.recipient_email,permission:form.permission,expires_days:form.expires_days?parseInt(form.expires_days):null};
    if(form.password) body.password=form.password;
    apiFetch("/shares",{method:"POST",body:body}).then(function(){notify("Link created!","success");setShow(false);load();}).catch(function(e){notify(e.message,"error");});
  }
  function deactivate(id) { apiFetch("/shares/"+id,{method:"DELETE"}).then(function(){notify("Revoked","success");load();}).catch(function(e){notify(e.message,"error");}); }
  var activeCount = shares.filter(function(s){return s.is_active;}).length;
  return (
    <div>
      <div className="page-header"><div><div className="page-title">External Sharing</div><div className="page-subtitle">Manage shared links</div></div><button className="btn btn-primary" onClick={function(){setShow(true);}}><IconPlus /> Create Share Link</button></div>
      <div className="stats-grid">
        <div className="stat-card"><div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"var(--accent)"}} /><div className="stat-label">Active Links</div><div className="stat-value" style={{color:"var(--accent)"}}>{activeCount}</div></div>
        <div className="stat-card"><div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"var(--success)"}} /><div className="stat-label">Total Views</div><div className="stat-value" style={{color:"var(--success)"}}>{shares.reduce(function(a,s){return a+(s.access_count||0);},0)}</div></div>
        <div className="stat-card"><div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"var(--warning)"}} /><div className="stat-label">Total Links</div><div className="stat-value" style={{color:"var(--warning)"}}>{shares.length}</div></div>
      </div>
      {shares.length===0?<Empty icon="🔗" title="No share links" sub="Create a link to share externally" />:
      <div className="card"><div className="table-wrap"><table>
        <thead><tr><th>File</th><th>Shared With</th><th>Permission</th><th>Expires</th><th>Views</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>{shares.map(function(s){return(
          <tr key={s.id}><td><div className="file-name"><IconLink /><span>{s.file_name}</span></div></td><td style={{color:"var(--text-secondary)",fontSize:12}}>{s.recipient_email||"Anyone"}</td><td><span className={"badge "+(s.permission==="edit"?"badge-warning":s.permission==="download"?"badge-info":"badge-success")}>{s.permission}</span></td><td style={{color:"var(--text-tertiary)",fontSize:12}}>{s.expires_at?fmtDate(s.expires_at):"Never"}</td><td style={{color:"var(--text-secondary)",fontSize:12}}>{s.access_count}</td><td><span className={"badge "+(s.is_active?"badge-success":"badge-neutral")}>{s.is_active?"Active":"Disabled"}</span></td><td>{s.is_active&&<button className="btn btn-danger btn-sm" onClick={function(){deactivate(s.id);}}>Revoke</button>}</td></tr>
        );})}</tbody>
      </table></div></div>}
      <Modal open={show} onClose={function(){setShow(false);}} title="Create Share Link" footer={<React.Fragment><button className="btn btn-secondary" onClick={function(){setShow(false);}}>Cancel</button><button className="btn btn-primary" onClick={create}>Create Link</button></React.Fragment>}>
        <div className="form-group"><label className="form-label">File</label><select className="form-select" value={form.file_id} onChange={function(e){setForm({...form,file_id:e.target.value});}}><option value="">Select...</option>{files.map(function(f){return <option key={f.id} value={f.id}>{f.name}</option>;})}</select></div>
        <div className="form-group"><label className="form-label">Recipient Email</label><input className="form-input" value={form.recipient_email} onChange={function(e){setForm({...form,recipient_email:e.target.value});}} placeholder="external@email.com" /></div>
        <div className="form-group"><label className="form-label">Permission</label><select className="form-select" value={form.permission} onChange={function(e){setForm({...form,permission:e.target.value});}}><option value="view">View</option><option value="download">Download</option><option value="edit">Edit</option></select></div>
        <div className="form-group"><label className="form-label">Expires in (days)</label><select className="form-select" value={form.expires_days} onChange={function(e){setForm({...form,expires_days:e.target.value});}}><option value="7">7 days</option><option value="30">30 days</option><option value="90">90 days</option><option value="">Never</option></select></div>
        <div className="form-group"><label className="form-label">Password</label><input className="form-input" type="password" value={form.password} onChange={function(e){setForm({...form,password:e.target.value});}} placeholder="Optional" /></div>
      </Modal>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE: DRIVES (SMB/Network Drives)
   ═══════════════════════════════════════════════════════════════════════════ */
function DrivesPage() {
  var [drives, setDrives] = useState([]);
  var [showAdd, setShowAdd] = useState(false);
  var [form, setForm] = useState({name:"",server_host:"",share_name:"",username:"",password:"",domain:"",auto_mount:true,read_only:false});
  var [browsing, setBrowsing] = useState(null);
  var [browseFiles, setBrowseFiles] = useState([]);
  var [browsePath, setBrowsePath] = useState("");
  var [browseLoading, setBrowseLoading] = useState(false);
  var [testing, setTesting] = useState(false);
  var [testResult, setTestResult] = useState(null);
  var [showDiscover, setShowDiscover] = useState(false);
  var [discoverHost, setDiscoverHost] = useState("");
  var [discoverCreds, setDiscoverCreds] = useState({username:"",password:"",domain:""});
  var [discoveredShares, setDiscoveredShares] = useState([]);
  var [discovering, setDiscovering] = useState(false);
  var notify = useNotify();

  function load() { apiFetch("/drives").then(function(d){setDrives(d.drives||[]);}).catch(function(e){notify(e.message,"error");}); }
  useEffect(load, []);

  function addDrive() {
    if(!form.name||!form.server_host||!form.share_name){notify("Name, host, and share required","error");return;}
    apiFetch("/drives",{method:"POST",body:form}).then(function(d){
      notify("Drive added!","success");setShowAdd(false);
      setForm({name:"",server_host:"",share_name:"",username:"",password:"",domain:"",auto_mount:true,read_only:false});
      load();
    }).catch(function(e){notify(e.message,"error");});
  }

  function testConnection() {
    setTesting(true); setTestResult(null);
    apiFetch("/drives/test",{method:"POST",body:{host:form.server_host,share_name:form.share_name,username:form.username,password:form.password,domain:form.domain}})
      .then(function(r){setTestResult(r);}).catch(function(e){setTestResult({success:false,error:e.message});}).finally(function(){setTesting(false);});
  }

  function connectDrive(id) {
    var pw = prompt("Enter password for this drive (or leave empty for stored credentials):");
    apiFetch("/drives/"+id+"/connect",{method:"POST",body:{password:pw||""}}).then(function(){notify("Connected!","success");load();}).catch(function(e){notify(e.message,"error");});
  }

  function disconnectDrive(id) {
    apiFetch("/drives/"+id+"/disconnect",{method:"POST"}).then(function(){notify("Disconnected","success");load();}).catch(function(e){notify(e.message,"error");});
  }

  function removeDrive(id) {
    if(!confirm("Remove this drive? Files imported from it will remain.")) return;
    apiFetch("/drives/"+id,{method:"DELETE"}).then(function(){notify("Removed","success");load();}).catch(function(e){notify(e.message,"error");});
  }

  function scanDrive(id) {
    apiFetch("/drives/"+id+"/scan",{method:"POST"}).then(function(){notify("Scan complete","success");load();}).catch(function(e){notify(e.message,"error");});
  }

  function openBrowse(drive) {
    setBrowsing(drive); setBrowsePath(""); setBrowseFiles([]); setBrowseLoading(true);
    apiFetch("/drives/"+drive.id+"/browse?path=").then(function(d){setBrowseFiles(d.files||[]);}).catch(function(e){notify(e.message,"error");}).finally(function(){setBrowseLoading(false);});
  }

  function browseTo(subPath) {
    var newPath = browsePath ? browsePath+"/"+subPath : subPath;
    setBrowsePath(newPath); setBrowseLoading(true);
    apiFetch("/drives/"+browsing.id+"/browse?path="+encodeURIComponent(newPath)).then(function(d){setBrowseFiles(d.files||[]);}).catch(function(e){notify(e.message,"error");}).finally(function(){setBrowseLoading(false);});
  }

  function browseUp() {
    var parts = browsePath.split("/"); parts.pop();
    var newPath = parts.join("/");
    setBrowsePath(newPath); setBrowseLoading(true);
    apiFetch("/drives/"+browsing.id+"/browse?path="+encodeURIComponent(newPath)).then(function(d){setBrowseFiles(d.files||[]);}).catch(function(e){notify(e.message,"error");}).finally(function(){setBrowseLoading(false);});
  }

  function importFileFromDrive(filePath) {
    apiFetch("/drives/"+browsing.id+"/import",{method:"POST",body:{file_path:filePath}}).then(function(f){notify("Imported: "+f.name,"success");}).catch(function(e){notify(e.message,"error");});
  }

  function discoverShares() {
    if(!discoverHost){notify("Enter a hostname or IP","error");return;}
    setDiscovering(true); setDiscoveredShares([]);
    apiFetch("/drives/list-shares",{method:"POST",body:{host:discoverHost,username:discoverCreds.username,password:discoverCreds.password,domain:discoverCreds.domain}})
      .then(function(d){setDiscoveredShares(d.shares||[]);if(!(d.shares||[]).length)notify("No shares found","info");})
      .catch(function(e){notify(e.message,"error");}).finally(function(){setDiscovering(false);});
  }

  function addDiscoveredShare(share) {
    setShowDiscover(false);
    setForm({...form, name:share.name||share, server_host:discoverHost, share_name:share.name||share, username:discoverCreds.username, password:discoverCreds.password, domain:discoverCreds.domain});
    setShowAdd(true);
  }

  /* Browse mode */
  if (browsing) {
    var pathParts = browsePath ? browsePath.split("/") : [];
    return (
      <div>
        <div className="page-header">
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <button className="btn btn-ghost btn-sm" onClick={function(){setBrowsing(null);}}><IconArrowLeft /> All Drives</button>
            </div>
            <div className="page-title" style={{display:"flex",alignItems:"center",gap:10}}>
              <IconDrive /> {browsing.name}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:6,marginTop:6,fontSize:13,color:"var(--text-secondary)"}}>
              <span style={{cursor:"pointer"}} onClick={function(){setBrowsePath("");setBrowseLoading(true);apiFetch("/drives/"+browsing.id+"/browse?path=").then(function(d){setBrowseFiles(d.files||[]);}).finally(function(){setBrowseLoading(false);});}}>Root</span>
              {pathParts.map(function(p,i){return(
                <React.Fragment key={i}><IconChevRight /><span>{p}</span></React.Fragment>
              );})}
            </div>
          </div>
          {browsePath&&<button className="btn btn-secondary btn-sm" onClick={browseUp}><IconArrowLeft /> Up</button>}
        </div>

        {browseLoading?<div style={{textAlign:"center",padding:60,color:"var(--text-tertiary)"}}>Loading...</div>:
          browseFiles.length===0?<Empty icon="📂" title="Empty directory" sub="No files in this location" />:
          <div className="card"><div className="table-wrap"><table>
            <thead><tr><th>Name</th><th>Size</th><th>Modified</th><th style={{width:100}}>Actions</th></tr></thead>
            <tbody>{browseFiles.map(function(f,i){return(
              <tr key={i}>
                <td><div className="file-name" style={{cursor:f.isDirectory?"pointer":"default"}} onClick={function(){if(f.isDirectory)browseTo(f.name);}}>
                  <FileIcon type={f.isDirectory?"folder":"document"} />
                  <span>{f.name}</span>
                </div></td>
                <td style={{color:"var(--text-tertiary)"}}>{f.isDirectory?"—":fmtSize(f.size)}</td>
                <td style={{color:"var(--text-tertiary)",fontSize:12}}>{f.modified?fmtTime(f.modified):"—"}</td>
                <td>{!f.isDirectory&&<button className="btn btn-primary btn-sm" onClick={function(){importFileFromDrive(browsePath?browsePath+"/"+f.name:f.name);}}><IconImport /> Import</button>}</td>
              </tr>
            );})}</tbody>
          </table></div></div>
        }
      </div>
    );
  }

  /* Main drives list */
  var connected = drives.filter(function(d){return d.status==="connected";}).length;

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Network Drives</div><div className="page-subtitle">Connect to SMB/CIFS network shares</div></div>
        <div style={{display:"flex",gap:8}}>
          <button className="btn btn-secondary" onClick={function(){setShowDiscover(true);}}><IconSearch /> Discover Shares</button>
          <button className="btn btn-primary" onClick={function(){setShowAdd(true);}}><IconPlus /> Add Drive</button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"var(--accent)"}} /><div className="stat-label">Total Drives</div><div className="stat-value" style={{color:"var(--accent)"}}>{drives.length}</div></div>
        <div className="stat-card"><div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"var(--success)"}} /><div className="stat-label">Connected</div><div className="stat-value" style={{color:"var(--success)"}}>{connected}</div></div>
        <div className="stat-card"><div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"var(--warning)"}} /><div className="stat-label">Disconnected</div><div className="stat-value" style={{color:"var(--warning)"}}>{drives.length - connected}</div></div>
      </div>

      {drives.length===0?<Empty icon="💿" title="No network drives" sub="Add an SMB/CIFS network share to browse and import files" />:
      <div className="server-grid">{drives.map(function(d){return(
        <div className={"server-card "+(d.status==="connected"?"connected":"disconnected")} key={d.id}>
          <div className="server-header">
            <div>
              <div className="server-name" style={{display:"flex",alignItems:"center",gap:8}}><IconDrive /> {d.name}</div>
              <div className="server-ip">\\\\{d.server_host}\\{d.share_name}</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:6}}><StatusDot status={d.status} /><span style={{fontSize:11,color:"var(--text-secondary)"}}>{d.status||"unknown"}</span></div>
          </div>
          <div className="server-stats">
            <div><div className="server-stat-label">User</div><div className="server-stat-value">{d.username||"guest"}</div></div>
            <div><div className="server-stat-label">Domain</div><div className="server-stat-value">{d.domain||"—"}</div></div>
            <div><div className="server-stat-label">Files</div><div className="server-stat-value">{(d.file_count||0).toLocaleString()}</div></div>
            <div><div className="server-stat-label">Size</div><div className="server-stat-value">{fmtSize(d.total_size)}</div></div>
          </div>
          {d.mount_error&&<div style={{marginTop:10,padding:"8px 12px",background:"var(--danger-bg)",borderRadius:"var(--radius-sm)",fontSize:12,color:"var(--danger)"}}>{d.mount_error}</div>}
          <div style={{display:"flex",gap:6,marginTop:14}}>
            {d.status==="connected"?
              <React.Fragment>
                <button className="btn btn-primary btn-sm" style={{flex:1}} onClick={function(){openBrowse(d);}}><IconFolder /> Browse</button>
                <button className="btn btn-secondary btn-sm" onClick={function(){scanDrive(d.id);}}><IconSync /> Scan</button>
                <button className="btn btn-ghost btn-sm" onClick={function(){disconnectDrive(d.id);}}><IconUnplug /></button>
              </React.Fragment>:
              <React.Fragment>
                <button className="btn btn-primary btn-sm" style={{flex:1}} onClick={function(){connectDrive(d.id);}}><IconPlug /> Connect</button>
              </React.Fragment>
            }
            <button className="btn btn-danger btn-sm" onClick={function(){removeDrive(d.id);}}><IconTrash /></button>
          </div>
        </div>
      );})}</div>}

      {/* Add Drive Modal */}
      <Modal open={showAdd} onClose={function(){setShowAdd(false);setTestResult(null);}} title="Add Network Drive" footer={
        <React.Fragment>
          <button className="btn btn-secondary" onClick={function(){setShowAdd(false);}}>Cancel</button>
          <button className="btn btn-secondary" onClick={testConnection} disabled={testing}>{testing?"Testing...":"Test Connection"}</button>
          <button className="btn btn-primary" onClick={addDrive}>Add Drive</button>
        </React.Fragment>
      }>
        {testResult&&<div style={{marginBottom:14,padding:"10px 14px",borderRadius:"var(--radius-sm)",fontSize:13,background:testResult.success?"var(--success-bg)":"var(--danger-bg)",color:testResult.success?"var(--success)":"var(--danger)",border:"1px solid "+(testResult.success?"var(--success)":"var(--danger)")+"33"}}>
          {testResult.success?"Connection successful!":("Connection failed: "+(testResult.error||"Unknown error"))}
        </div>}
        <div className="form-group"><label className="form-label">Drive Name</label><input className="form-input" value={form.name} onChange={function(e){setForm({...form,name:e.target.value});}} placeholder="e.g. Shared Files" /></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div className="form-group"><label className="form-label">Server Host / IP</label><input className="form-input" value={form.server_host} onChange={function(e){setForm({...form,server_host:e.target.value});}} placeholder="192.168.1.10" style={{fontFamily:"var(--mono)"}} /></div>
          <div className="form-group"><label className="form-label">Share Name</label><input className="form-input" value={form.share_name} onChange={function(e){setForm({...form,share_name:e.target.value});}} placeholder="SharedDocs" style={{fontFamily:"var(--mono)"}} /></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
          <div className="form-group"><label className="form-label">Username</label><input className="form-input" value={form.username} onChange={function(e){setForm({...form,username:e.target.value});}} placeholder="guest" /></div>
          <div className="form-group"><label className="form-label">Password</label><input className="form-input" type="password" value={form.password} onChange={function(e){setForm({...form,password:e.target.value});}} /></div>
          <div className="form-group"><label className="form-label">Domain</label><input className="form-input" value={form.domain} onChange={function(e){setForm({...form,domain:e.target.value});}} placeholder="WORKGROUP" /></div>
        </div>
        <div style={{display:"flex",gap:20,marginTop:4}}>
          <label style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:"var(--text-secondary)",cursor:"pointer"}}>
            <input type="checkbox" checked={form.auto_mount} onChange={function(e){setForm({...form,auto_mount:e.target.checked});}} /> Auto-mount on startup
          </label>
          <label style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:"var(--text-secondary)",cursor:"pointer"}}>
            <input type="checkbox" checked={form.read_only} onChange={function(e){setForm({...form,read_only:e.target.checked});}} /> Read only
          </label>
        </div>
      </Modal>

      {/* Discover Shares Modal */}
      <Modal open={showDiscover} onClose={function(){setShowDiscover(false);setDiscoveredShares([]);}} title="Discover Network Shares" footer={
        <React.Fragment><button className="btn btn-secondary" onClick={function(){setShowDiscover(false);}}>Close</button><button className="btn btn-primary" onClick={discoverShares} disabled={discovering}>{discovering?"Scanning...":"Scan for Shares"}</button></React.Fragment>
      }>
        <div className="form-group"><label className="form-label">Server Host / IP</label><input className="form-input" value={discoverHost} onChange={function(e){setDiscoverHost(e.target.value);}} placeholder="192.168.1.10" style={{fontFamily:"var(--mono)"}} /></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
          <div className="form-group"><label className="form-label">Username</label><input className="form-input" value={discoverCreds.username} onChange={function(e){setDiscoverCreds({...discoverCreds,username:e.target.value});}} placeholder="optional" /></div>
          <div className="form-group"><label className="form-label">Password</label><input className="form-input" type="password" value={discoverCreds.password} onChange={function(e){setDiscoverCreds({...discoverCreds,password:e.target.value});}} /></div>
          <div className="form-group"><label className="form-label">Domain</label><input className="form-input" value={discoverCreds.domain} onChange={function(e){setDiscoverCreds({...discoverCreds,domain:e.target.value});}} /></div>
        </div>
        {discoveredShares.length>0&&<div style={{marginTop:8}}>
          <div style={{fontSize:12,fontWeight:600,color:"var(--text-secondary)",marginBottom:8}}>Found {discoveredShares.length} share(s):</div>
          {discoveredShares.map(function(s,i){var shareName=typeof s==="string"?s:s.name; return(
            <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:"var(--bg-tertiary)",borderRadius:"var(--radius-sm)",marginBottom:6,border:"1px solid var(--border-subtle)"}}>
              <div><div style={{fontWeight:500,fontSize:13}}>\\\\{discoverHost}\\{shareName}</div>{s.comment&&<div style={{fontSize:11,color:"var(--text-tertiary)"}}>{s.comment}</div>}</div>
              <button className="btn btn-primary btn-sm" onClick={function(){addDiscoveredShare(s);}}>Add</button>
            </div>
          );})}
        </div>}
      </Modal>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE: SERVERS
   ═══════════════════════════════════════════════════════════════════════════ */
function ServersPage() {
  var [servers, setServers] = useState([]);
  var [show, setShow] = useState(false);
  var [form, setForm] = useState({name:"",host:"",port:"22",protocol:"sftp",username:"",remote_path:"/",sync_direction:"bidirectional"});
  var notify = useNotify();
  function load() { apiFetch("/servers").then(function(d){setServers(d.servers||[]);}); }
  useEffect(load, []);
  function add() {
    if(!form.name||!form.host){notify("Name and host required","error");return;}
    apiFetch("/servers",{method:"POST",body:{...form,port:parseInt(form.port)}}).then(function(){notify("Added!","success");setShow(false);setForm({name:"",host:"",port:"22",protocol:"sftp",username:"",remote_path:"/",sync_direction:"bidirectional"});load();}).catch(function(e){notify(e.message,"error");});
  }
  function sync(id) { apiFetch("/servers/"+id+"/sync",{method:"POST"}).then(function(){notify("Sync initiated","success");load();}).catch(function(e){notify(e.message,"error");}); }
  function remove(id) { apiFetch("/servers/"+id,{method:"DELETE"}).then(function(){notify("Removed","success");load();}).catch(function(e){notify(e.message,"error");}); }
  return (
    <div>
      <div className="page-header"><div><div className="page-title">Network Servers</div><div className="page-subtitle">Connect local file servers</div></div><button className="btn btn-primary" onClick={function(){setShow(true);}}><IconPlus /> Add Server</button></div>
      {servers.length===0?<Empty icon="🖥️" title="No servers" sub="Add a local server to sync files" />:
      <div className="server-grid">{servers.map(function(s){return(
        <div className={"server-card "+(s.status==="connected"?"connected":"disconnected")} key={s.id}>
          <div className="server-header"><div><div className="server-name">{s.name}</div><div className="server-ip">{s.host}:{s.port}</div></div><div style={{display:"flex",alignItems:"center",gap:6}}><StatusDot status={s.status} /><span style={{fontSize:11,color:"var(--text-secondary)"}}>{s.status}</span></div></div>
          <div className="server-stats">
            <div><div className="server-stat-label">Protocol</div><div className="server-stat-value">{(s.protocol||"").toUpperCase()}</div></div>
            <div><div className="server-stat-label">Direction</div><div className="server-stat-value">{s.sync_direction}</div></div>
            <div><div className="server-stat-label">Files</div><div className="server-stat-value">{(s.file_count||0).toLocaleString()}</div></div>
            <div><div className="server-stat-label">Last Sync</div><div className="server-stat-value">{fmtTime(s.last_sync_at)}</div></div>
          </div>
          <div className="sync-bar"><div className={"sync-bar-fill "+(s.sync_status||"pending")} /></div>
          <div style={{display:"flex",gap:6,marginTop:14}}><button className="btn btn-secondary btn-sm" style={{flex:1}} onClick={function(){sync(s.id);}}><IconSync /> Sync</button><button className="btn btn-danger btn-sm" onClick={function(){remove(s.id);}}><IconTrash /></button></div>
        </div>
      );})}</div>}
      <Modal open={show} onClose={function(){setShow(false);}} title="Add Server" footer={<React.Fragment><button className="btn btn-secondary" onClick={function(){setShow(false);}}>Cancel</button><button className="btn btn-primary" onClick={add}>Connect</button></React.Fragment>}>
        <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={function(e){setForm({...form,name:e.target.value});}} placeholder="NYC Office NAS" /></div>
        <div className="form-group"><label className="form-label">Host</label><input className="form-input" value={form.host} onChange={function(e){setForm({...form,host:e.target.value});}} placeholder="192.168.1.100" style={{fontFamily:"var(--mono)"}} /></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div className="form-group"><label className="form-label">Port</label><input className="form-input" value={form.port} onChange={function(e){setForm({...form,port:e.target.value});}} style={{fontFamily:"var(--mono)"}} /></div>
          <div className="form-group"><label className="form-label">Protocol</label><select className="form-select" value={form.protocol} onChange={function(e){setForm({...form,protocol:e.target.value});}}><option value="sftp">SFTP</option><option value="smb">SMB</option><option value="webdav">WebDAV</option><option value="nfs">NFS</option></select></div>
        </div>
        <div className="form-group"><label className="form-label">Username</label><input className="form-input" value={form.username} onChange={function(e){setForm({...form,username:e.target.value});}} /></div>
        <div className="form-group"><label className="form-label">Remote Path</label><input className="form-input" value={form.remote_path} onChange={function(e){setForm({...form,remote_path:e.target.value});}} style={{fontFamily:"var(--mono)"}} /></div>
        <div className="form-group"><label className="form-label">Sync Direction</label><select className="form-select" value={form.sync_direction} onChange={function(e){setForm({...form,sync_direction:e.target.value});}}><option value="bidirectional">Bidirectional</option><option value="pull">Server → Cloud</option><option value="push">Cloud → Server</option></select></div>
      </Modal>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE: PORTALS (Full Admin Management)
   ═══════════════════════════════════════════════════════════════════════════ */
function PortalPage() {
  var [portals, setPortals] = useState([]);
  var [tab, setTab] = useState("Contractor");
  var [showCreate, setShowCreate] = useState(false);
  var [createForm, setCreateForm] = useState({type:"contractor",name:"",custom_domain:"",brand_color:"#4F8EF7",welcome_message:"",require_sso:false,allow_signup:false,watermark_files:true});
  var [activePortal, setActivePortal] = useState(null);
  var notify = useNotify();

  function load() { apiFetch("/portals").then(function(d){setPortals(d.portals||[]);}); }
  useEffect(load, []);

  function createPortal() {
    if(!createForm.name){notify("Name required","error");return;}
    apiFetch("/portals",{method:"POST",body:createForm}).then(function(){notify("Portal created!","success");setShowCreate(false);setCreateForm({type:"contractor",name:"",custom_domain:"",brand_color:"#4F8EF7",welcome_message:"",require_sso:false,allow_signup:false,watermark_files:true});load();}).catch(function(e){notify(e.message,"error");});
  }

  function deletePortal(id,name) {
    if(!confirm("Delete portal \""+name+"\"? This will revoke all customer access.")) return;
    apiFetch("/portals/"+id,{method:"DELETE"}).then(function(){notify("Portal deleted","success");load();}).catch(function(e){notify(e.message,"error");});
  }

  if (activePortal) {
    return React.createElement(PortalAdmin, {portal:activePortal, onBack:function(){setActivePortal(null);load();}});
  }

  var filtered = portals.filter(function(p){return p.type===tab.toLowerCase();});

  return (
    <div>
      <div className="page-header"><div><div className="page-title">External Portals</div><div className="page-subtitle">Manage contractor and customer portals</div></div>
        <button className="btn btn-primary" onClick={function(){setCreateForm({...createForm,type:tab.toLowerCase()});setShowCreate(true);}}><IconPlus /> Create Portal</button>
      </div>
      <Tabs items={["Contractor","Customer"]} active={tab} onChange={setTab} />
      <div className="portal-banner"><h2>{tab} Portals</h2><p>{tab==="Contractor"?"Secure workspaces for external contractors":"Branded file delivery and collaboration for clients"}</p></div>

      {filtered.length===0?<Empty icon="🛡️" title={"No "+tab.toLowerCase()+" portals"} sub="Create a portal to share with external users" />:
      <div className="project-grid">{filtered.map(function(p){return(
        <div className="project-card" key={p.id} style={{cursor:"pointer"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:p.brand_color||"var(--accent)"}} />
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div onClick={function(){setActivePortal(p);}} style={{flex:1}}>
              <h3>{p.name}</h3>
              <div style={{fontSize:12,color:"var(--accent)",fontFamily:"var(--mono)",marginTop:4}}>/portal/{p.slug}</div>
              {p.custom_domain&&<div style={{fontSize:11,color:"var(--text-tertiary)",marginTop:2}}>{p.custom_domain}</div>}
            </div>
            <button className="btn btn-danger btn-sm btn-icon" onClick={function(e){e.stopPropagation();deletePortal(p.id,p.name);}} title="Delete"><IconTrash /></button>
          </div>
          <div className="project-card-stats" style={{marginTop:14}} onClick={function(){setActivePortal(p);}}>
            <div className="project-stat"><strong>{p.member_count}</strong> users</div>
            <div className="project-stat">{p.require_sso?"SSO":"Password"}</div>
            <div className="project-stat">{p.watermark_files?"Watermarked":"No watermark"}</div>
          </div>
        </div>
      );})}</div>}

      {/* Create Portal Modal */}
      <Modal open={showCreate} onClose={function(){setShowCreate(false);}} title={"Create "+tab+" Portal"} footer={
        <React.Fragment><button className="btn btn-secondary" onClick={function(){setShowCreate(false);}}>Cancel</button><button className="btn btn-primary" onClick={createPortal}>Create Portal</button></React.Fragment>
      }>
        <div className="form-group"><label className="form-label">Portal Name</label><input className="form-input" value={createForm.name} onChange={function(e){setCreateForm({...createForm,name:e.target.value});}} placeholder="e.g. Client Portal" /></div>
        <div className="form-group"><label className="form-label">Custom Domain (optional)</label><input className="form-input" value={createForm.custom_domain} onChange={function(e){setCreateForm({...createForm,custom_domain:e.target.value});}} placeholder="portal.company.com" style={{fontFamily:"var(--mono)"}} /></div>
        <div className="form-group"><label className="form-label">Welcome Message</label><input className="form-input" value={createForm.welcome_message} onChange={function(e){setCreateForm({...createForm,welcome_message:e.target.value});}} placeholder="Sign in to access your files" /></div>
        <div className="form-group"><label className="form-label">Brand Color</label><input type="color" className="form-input" style={{height:40,padding:4}} value={createForm.brand_color} onChange={function(e){setCreateForm({...createForm,brand_color:e.target.value});}} /></div>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:8}}>
          <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:"var(--text-secondary)",cursor:"pointer"}}><input type="checkbox" checked={createForm.watermark_files} onChange={function(e){setCreateForm({...createForm,watermark_files:e.target.checked});}} /> Watermark downloaded files</label>
          <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:"var(--text-secondary)",cursor:"pointer"}}><input type="checkbox" checked={createForm.require_sso} onChange={function(e){setCreateForm({...createForm,require_sso:e.target.checked});}} /> Require SSO login</label>
          <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:"var(--text-secondary)",cursor:"pointer"}}><input type="checkbox" checked={createForm.allow_signup} onChange={function(e){setCreateForm({...createForm,allow_signup:e.target.checked});}} /> Allow self-registration</label>
        </div>
      </Modal>
    </div>
  );
}

/* ── Portal Admin (manage a single portal) ── */
function PortalAdmin(props) {
  var portal = props.portal;
  var onBack = props.onBack;
  var [tab, setTab] = useState("Users");
  var [access, setAccess] = useState([]);
  var [projects, setProjects] = useState([]);
  var [showInvite, setShowInvite] = useState(false);
  var [showAddInternal, setShowAddInternal] = useState(false);
  var [internalUsers, setInternalUsers] = useState([]);
  var [selectedUser, setSelectedUser] = useState("");
  var [internalPerm, setInternalPerm] = useState("edit");
  var [internalProjects, setInternalProjects] = useState([]);
  var [inviteForm, setInviteForm] = useState({email:"",name:"",password:"",company:"",permission:"download",project_ids:[],expires_days:""});
  var [showEdit, setShowEdit] = useState(false);
  var [editForm, setEditForm] = useState({name:portal.name,custom_domain:portal.custom_domain||"",brand_color:portal.brand_color||"#4F8EF7",welcome_message:portal.welcome_message||"",require_sso:portal.require_sso,allow_signup:portal.allow_signup,watermark_files:portal.watermark_files});
  var notify = useNotify();

  function loadAccess() { apiFetch("/portals/"+portal.id+"/access").then(function(d){setAccess(d.access||[]);}); }
  function loadInternalUsers() { apiFetch("/users").then(function(d){setInternalUsers((d.users||[]).filter(function(u){return u.role!=="external";}));}); }
  function loadProjects() { apiFetch("/projects").then(function(d){setProjects(d.projects||[]);}); }
  function loadAllSpaces() { apiFetch("/spaces").then(function(d){setAllSpaces(d.spaces||[]);}); }

  function loadPortalAssignments() {
    apiFetch("/portals/"+portal.id+"/access").then(function(d){
      var acc = d.access || [];
      // Collect unique project_ids and space_ids across all users
      var pids = []; var sids = [];
      acc.forEach(function(a){
        if(a.project_ids) a.project_ids.forEach(function(p){if(pids.indexOf(p)<0)pids.push(p);});
        if(a.space_ids) a.space_ids.forEach(function(s){if(sids.indexOf(s)<0)sids.push(s);});
      });
      setAssignedProjectIds(pids);
      setAssignedSpaceIds(sids);
    });
  }

  useEffect(function(){loadAccess();loadProjects();loadAllSpaces();loadPortalAssignments();loadInternalUsers();},[]);

  function inviteCustomer() {
    if(!inviteForm.email||!inviteForm.name||!inviteForm.password){notify("Email, name, and password required","error");return;}
    var body = {...inviteForm};
    if(!body.expires_days) delete body.expires_days; else body.expires_days=parseInt(body.expires_days);
    apiFetch("/portals/"+portal.id+"/invite",{method:"POST",body:body}).then(function(){
      notify("Customer invited!","success"); setShowInvite(false);
      setInviteForm({email:"",name:"",password:"",company:"",permission:"download",project_ids:[],expires_days:""});
      loadAccess();
    }).catch(function(e){notify(e.message,"error");});
  }

  function addInternalUser() {
    if(!selectedUser){notify("Select a user","error");return;}
    apiFetch("/portals/"+portal.id+"/add-member",{method:"POST",body:{user_id:selectedUser,permission:internalPerm,project_ids:internalProjects}})
      .then(function(){notify("Internal user added!","success");setShowAddInternal(false);setSelectedUser("");setInternalPerm("edit");setInternalProjects([]);loadAccess();})
      .catch(function(e){notify(e.message,"error");});
  }

  function toggleInternalProject(pid) {
    setInternalProjects(function(prev){
      var idx=prev.indexOf(pid);
      if(idx>=0){var n=prev.slice();n.splice(idx,1);return n;}
      return prev.concat(pid);
    });
  }

  var [editingAccess, setEditingAccess] = useState(null);
  var [allSpaces, setAllSpaces] = useState([]);
  var [portalProjects, setPortalProjects] = useState([]);
  var [portalSpaces, setPortalSpaces] = useState([]);
  var [assignedProjectIds, setAssignedProjectIds] = useState([]);
  var [assignedSpaceIds, setAssignedSpaceIds] = useState([]);
  var [savingAccess, setSavingAccess] = useState(false);
  var [editAccessForm, setEditAccessForm] = useState({permission:"view",project_ids:[],company:"",expires_days:""});

  function revokeAccess(userId,name) {
    if(!confirm("Revoke access for "+name+"?")) return;
    apiFetch("/portals/"+portal.id+"/access/"+userId,{method:"DELETE"}).then(function(){notify("Access revoked","success");loadAccess();}).catch(function(e){notify(e.message,"error");});
  }

  function reinstateAccess(userId,name) {
    if(!confirm("Reinstate access for "+name+"?")) return;
    apiFetch("/portals/"+portal.id+"/access/"+userId+"/reinstate",{method:"POST"}).then(function(){notify("Access reinstated!","success");loadAccess();}).catch(function(e){notify(e.message,"error");});
  }

  function openEditAccess(a) {
    setEditingAccess(a);
    setEditAccessForm({
      permission: a.permission || "view",
      project_ids: a.project_ids || [],
      company: a.company || "",
      expires_days: ""
    });
  }

  function assignProjectToPortal(projectId) {
    setSavingAccess(true);
    // Add this project to ALL active portal users
    apiFetch("/portals/"+portal.id+"/access").then(function(d){
      var promises = (d.access||[]).filter(function(a){return a.is_active;}).map(function(a){
        var pids = (a.project_ids||[]).slice();
        if(pids.indexOf(projectId)<0) pids.push(projectId);
        return apiFetch("/portals/"+portal.id+"/access/"+a.user_id,{method:"PATCH",body:{project_ids:pids}});
      });
      return Promise.all(promises);
    }).then(function(){notify("Project assigned to portal","success");loadPortalAssignments();}).catch(function(e){notify(e.message,"error");}).finally(function(){setSavingAccess(false);});
  }

  function unassignProjectFromPortal(projectId) {
    setSavingAccess(true);
    apiFetch("/portals/"+portal.id+"/access").then(function(d){
      var promises = (d.access||[]).filter(function(a){return a.is_active;}).map(function(a){
        var pids = (a.project_ids||[]).filter(function(p){return p!==projectId;});
        return apiFetch("/portals/"+portal.id+"/access/"+a.user_id,{method:"PATCH",body:{project_ids:pids}});
      });
      return Promise.all(promises);
    }).then(function(){notify("Project removed from portal","success");loadPortalAssignments();}).catch(function(e){notify(e.message,"error");}).finally(function(){setSavingAccess(false);});
  }

  function assignSpaceToPortal(spaceId) {
    setSavingAccess(true);
    // Add space + all its projects to all active portal users
    apiFetch("/portals/"+portal.id+"/access").then(function(d){
      // Get projects in this space
      return apiFetch("/projects?space_id="+spaceId).then(function(pd){
        var spaceProjectIds = (pd.projects||[]).map(function(p){return p.id;});
        var promises = (d.access||[]).filter(function(a){return a.is_active;}).map(function(a){
          var sids = (a.space_ids||[]).slice();
          if(sids.indexOf(spaceId)<0) sids.push(spaceId);
          var pids = (a.project_ids||[]).slice();
          spaceProjectIds.forEach(function(pid){if(pids.indexOf(pid)<0) pids.push(pid);});
          return apiFetch("/portals/"+portal.id+"/access/"+a.user_id,{method:"PATCH",body:{space_ids:sids,project_ids:pids}});
        });
        return Promise.all(promises);
      });
    }).then(function(){notify("Space assigned — all projects in this space are now accessible","success");loadPortalAssignments();}).catch(function(e){notify(e.message,"error");}).finally(function(){setSavingAccess(false);});
  }

  function unassignSpaceFromPortal(spaceId) {
    setSavingAccess(true);
    // Remove space + its projects from all active portal users
    apiFetch("/portals/"+portal.id+"/access").then(function(d){
      return apiFetch("/projects?space_id="+spaceId).then(function(pd){
        var spaceProjectIds = (pd.projects||[]).map(function(p){return p.id;});
        var promises = (d.access||[]).filter(function(a){return a.is_active;}).map(function(a){
          var sids = (a.space_ids||[]).filter(function(s){return s!==spaceId;});
          var pids = (a.project_ids||[]).filter(function(p){return spaceProjectIds.indexOf(p)<0;});
          return apiFetch("/portals/"+portal.id+"/access/"+a.user_id,{method:"PATCH",body:{space_ids:sids,project_ids:pids}});
        });
        return Promise.all(promises);
      });
    }).then(function(){notify("Space removed from portal","success");loadPortalAssignments();}).catch(function(e){notify(e.message,"error");}).finally(function(){setSavingAccess(false);});
  }

  function saveEditAccess() {
    if(!editingAccess) return;
    var body = {permission:editAccessForm.permission, project_ids:editAccessForm.project_ids, company:editAccessForm.company};
    if(editAccessForm.expires_days) body.expires_days = parseInt(editAccessForm.expires_days);
    apiFetch("/portals/"+portal.id+"/access/"+editingAccess.user_id,{method:"PATCH",body:body})
      .then(function(){notify("Access updated!","success");setEditingAccess(null);loadAccess();})
      .catch(function(e){notify(e.message,"error");});
  }

  function toggleEditProject(pid) {
    setEditAccessForm(function(f){
      var ids=f.project_ids.slice();
      var i=ids.indexOf(pid);
      if(i>=0) ids.splice(i,1); else ids.push(pid);
      return {...f,project_ids:ids};
    });
  }

  function saveSettings() {
    apiFetch("/portals/"+portal.id,{method:"PATCH",body:editForm}).then(function(){notify("Portal updated!","success");setShowEdit(false);}).catch(function(e){notify(e.message,"error");});
  }

  function toggleProject(pid) {
    setInviteForm(function(f){
      var ids = f.project_ids.slice();
      var idx = ids.indexOf(pid);
      if(idx>=0) ids.splice(idx,1); else ids.push(pid);
      return {...f, project_ids:ids};
    });
  }

  var portalUrl = window.location.origin+"/portal/"+portal.slug;
  var brandColor = portal.brand_color || "var(--accent)";

  return (
    <div>
      <div style={{marginBottom:20}}>
        <button className="btn btn-ghost btn-sm" onClick={onBack} style={{marginBottom:12}}><IconArrowLeft /> All Portals</button>
        <div style={{background:"var(--bg-secondary)",border:"1px solid var(--border-subtle)",borderRadius:"var(--radius-xl)",padding:24,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:brandColor}} />
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:16}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                <div style={{width:36,height:36,background:brandColor,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:14,color:"white"}}>{portal.name.substring(0,2).toUpperCase()}</div>
                <div>
                  <h1 style={{fontSize:20,fontWeight:700}}>{portal.name}</h1>
                  <div style={{fontSize:12,color:"var(--text-tertiary)"}}>{portal.type} portal · {portal.member_count} users</div>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginTop:8}}>
                <span style={{fontSize:12,color:"var(--text-tertiary)"}}>URL:</span>
                <code style={{fontSize:12,fontFamily:"var(--mono)",background:"var(--bg-active)",padding:"3px 8px",borderRadius:4,color:"var(--accent)"}}>{portalUrl}</code>
                <button className="btn btn-ghost btn-sm" style={{fontSize:11}} onClick={function(){navigator.clipboard.writeText(portalUrl);notify("URL copied!","success");}}>Copy</button>
                <button className="btn btn-ghost btn-sm" style={{fontSize:11}} onClick={function(){window.open(portalUrl,"_blank");}}>Open</button>
              </div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button className="btn btn-secondary btn-sm" onClick={function(){setShowEdit(true);}}><IconSettings /> Settings</button>
              <button className="btn btn-secondary btn-sm" onClick={function(){setShowAddInternal(true);}}><IconUsers /> Add Internal User</button>
              <button className="btn btn-primary btn-sm" onClick={function(){setShowInvite(true);}}><IconPlus /> Invite Customer</button>
            </div>
          </div>
        </div>
      </div>

      <Tabs items={["Users","Projects & Spaces","Settings"]} active={tab} onChange={setTab} />

      {/* ── Users Tab ── */}
      {tab==="Users"&&<div>
        {access.length===0?<Empty icon="👤" title="No customers yet" sub="Invite customers to give them portal access" />:
        <div className="card"><div className="table-wrap"><table>
          <thead><tr><th>Customer</th><th>Company</th><th>Permission</th><th>Projects</th><th>Expires</th><th>Status</th><th style={{width:100}}>Actions</th></tr></thead>
          <tbody>{access.map(function(a){return(
            <tr key={a.id}>
              <td><div style={{display:"flex",alignItems:"center",gap:10}}>
                <div className="avatar-sm" style={{background:"hsl("+(a.email||"").charCodeAt(0)*7+",55%,50%)"}}>{(a.name||"").substring(0,2).toUpperCase()}</div>
                <div><div style={{fontWeight:500,fontSize:13}}>{a.name}</div><div style={{fontSize:11,color:"var(--text-tertiary)"}}>{a.email}</div></div>
              </div></td>
              <td style={{color:"var(--text-secondary)",fontSize:13}}>{a.company||"—"}</td>
              <td><span className={"badge "+(a.permission==="edit"?"badge-warning":a.permission==="download"?"badge-info":"badge-success")}>{a.permission}</span></td>
              <td style={{fontSize:12,color:"var(--text-tertiary)"}}>{a.project_ids&&a.project_ids.length?a.project_ids.length+" project(s)":"All spaces"}</td>
              <td style={{fontSize:12,color:a.expires_at&&new Date(a.expires_at)<new Date()?"var(--danger)":"var(--text-tertiary)"}}>{a.expires_at?new Date(a.expires_at).toLocaleDateString():"Never"}</td>
              <td><div style={{display:"flex",alignItems:"center",gap:6}}><StatusDot status={a.is_active?"active":"inactive"} /><span style={{fontSize:12,color:"var(--text-secondary)"}}>{a.is_active?"Active":"Revoked"}</span></div></td>
              <td><div style={{display:"flex",gap:4}}>
                {a.is_active&&<React.Fragment>
                  <button className="btn btn-secondary btn-sm" onClick={function(){openEditAccess(a);}}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={function(){revokeAccess(a.user_id,a.name);}}>Revoke</button>
                </React.Fragment>}
                {!a.is_active&&<button className="btn btn-primary btn-sm" onClick={function(){reinstateAccess(a.user_id,a.name);}}>Reinstate</button>}
              </div></td>
            </tr>
          );})}</tbody>
        </table></div></div>}
      </div>}

      {/* ── Projects & Spaces Tab ── */}
      {tab==="Projects & Spaces"&&<div>
        <p style={{fontSize:13,color:"var(--text-secondary)",marginBottom:20}}>Assign projects and spaces to this portal. All portal users will be able to access assigned items based on their permission level.</p>

        {/* Spaces */}
        <h4 style={{fontSize:14,fontWeight:700,marginBottom:12}}>Spaces</h4>
        {allSpaces.length===0?<div style={{padding:20,textAlign:"center",color:"var(--text-tertiary)",fontSize:13}}>No spaces available</div>:
        <div className="card" style={{marginBottom:24}}><div className="table-wrap"><table>
          <thead><tr><th>Space</th><th>Projects</th><th>Members</th><th>Storage</th><th style={{width:120}}>Status</th></tr></thead>
          <tbody>{allSpaces.map(function(s){var assigned=assignedSpaceIds.indexOf(s.id)>=0; return(
            <tr key={s.id}>
              <td><div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:20}}>{s.icon||"📁"}</span><div><div style={{fontWeight:600,fontSize:13}}>{s.name}</div>{s.description&&<div style={{fontSize:11,color:"var(--text-tertiary)"}}>{s.description}</div>}</div></div></td>
              <td style={{fontSize:12,color:"var(--text-tertiary)"}}>{projects.filter(function(p){return p.space_id===s.id;}).length} projects</td>
              <td style={{fontSize:12,color:"var(--text-tertiary)"}}>{s.member_count} members</td>
              <td style={{fontSize:12,color:"var(--text-tertiary)"}}>{fmtSize(parseInt(s.storage_used))}</td>
              <td>{assigned?
                <button className="btn btn-danger btn-sm" onClick={function(){unassignSpaceFromPortal(s.id);}} disabled={savingAccess}>Remove</button>:
                <button className="btn btn-primary btn-sm" onClick={function(){assignSpaceToPortal(s.id);}} disabled={savingAccess}>Assign</button>
              }</td>
            </tr>
          );})}</tbody>
        </table></div></div>}

        {/* Projects */}
        <h4 style={{fontSize:14,fontWeight:700,marginBottom:12}}>Projects</h4>
        {projects.length===0?<div style={{padding:20,textAlign:"center",color:"var(--text-tertiary)",fontSize:13}}>No projects available</div>:
        <div className="card"><div className="table-wrap"><table>
          <thead><tr><th>Project</th><th>Space</th><th>Files</th><th>Storage</th><th style={{width:160}}>Status</th></tr></thead>
          <tbody>{projects.map(function(p){var assigned=assignedProjectIds.indexOf(p.id)>=0; var viaSpace=assignedSpaceIds.indexOf(p.space_id)>=0; return(
            <tr key={p.id}>
              <td><div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:8,height:8,borderRadius:2,background:p.color||"var(--accent)"}}></div><div><div style={{fontWeight:600,fontSize:13}}>{p.name}</div>{p.description&&<div style={{fontSize:11,color:"var(--text-tertiary)"}}>{p.description}</div>}</div></div></td>
              <td style={{fontSize:12,color:"var(--text-tertiary)"}}>{p.space_name}</td>
              <td style={{fontSize:12,color:"var(--text-tertiary)"}}>{p.file_count} files</td>
              <td style={{fontSize:12,color:"var(--text-tertiary)"}}>{fmtSize(parseInt(p.storage_used))}</td>
              <td>{viaSpace?
                <span className="badge badge-info" style={{fontSize:10}}>Included via Space</span>:
                assigned?
                  <button className="btn btn-danger btn-sm" onClick={function(){unassignProjectFromPortal(p.id);}} disabled={savingAccess}>Remove</button>:
                  <button className="btn btn-primary btn-sm" onClick={function(){assignProjectToPortal(p.id);}} disabled={savingAccess}>Assign</button>
              }</td>
            </tr>
          );})}</tbody>
        </table></div></div>}
      </div>}

      {/* ── Settings Tab ── */}
      {tab==="Settings"&&<div className="card"><div className="card-body">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <div className="form-group"><label className="form-label">Portal Name</label><div style={{fontSize:14,fontWeight:500}}>{portal.name}</div></div>
          <div className="form-group"><label className="form-label">Slug</label><code style={{fontSize:13,fontFamily:"var(--mono)",color:"var(--accent)"}}>{portal.slug}</code></div>
          <div className="form-group"><label className="form-label">Type</label><span className="badge badge-info" style={{textTransform:"capitalize"}}>{portal.type}</span></div>
          <div className="form-group"><label className="form-label">Brand Color</label><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:20,height:20,borderRadius:4,background:portal.brand_color}} /><span style={{fontSize:13}}>{portal.brand_color}</span></div></div>
          <div className="form-group"><label className="form-label">Custom Domain</label><span style={{fontSize:13,color:"var(--text-secondary)"}}>{portal.custom_domain||"None"}</span></div>
          <div className="form-group"><label className="form-label">Created</label><span style={{fontSize:13,color:"var(--text-secondary)"}}>{new Date(portal.created_at).toLocaleDateString()}</span></div>
        </div>
        <div style={{display:"flex",gap:16,marginTop:12,paddingTop:12,borderTop:"1px solid var(--border-subtle)"}}>
          <span style={{fontSize:13,color:portal.watermark_files?"var(--success)":"var(--text-tertiary)"}}>{portal.watermark_files?"✓":"✕"} Watermarking</span>
          <span style={{fontSize:13,color:portal.require_sso?"var(--success)":"var(--text-tertiary)"}}>{portal.require_sso?"✓":"✕"} SSO Required</span>
          <span style={{fontSize:13,color:portal.allow_signup?"var(--success)":"var(--text-tertiary)"}}>{portal.allow_signup?"✓":"✕"} Self-registration</span>
        </div>
        <button className="btn btn-secondary" style={{marginTop:16}} onClick={function(){setShowEdit(true);}}>Edit Settings</button>
      </div></div>}

      {/* ── Invite Modal ── */}
      <Modal open={showInvite} onClose={function(){setShowInvite(false);}} title="Invite Customer" footer={
        <React.Fragment><button className="btn btn-secondary" onClick={function(){setShowInvite(false);}}>Cancel</button><button className="btn btn-primary" onClick={inviteCustomer}>Send Invite</button></React.Fragment>
      }>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={inviteForm.name} onChange={function(e){setInviteForm({...inviteForm,name:e.target.value});}} placeholder="John Smith" /></div>
          <div className="form-group"><label className="form-label">Email</label><input className="form-input" value={inviteForm.email} onChange={function(e){setInviteForm({...inviteForm,email:e.target.value});}} placeholder="john@company.com" /></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div className="form-group"><label className="form-label">Password</label><input className="form-input" type="password" value={inviteForm.password} onChange={function(e){setInviteForm({...inviteForm,password:e.target.value});}} placeholder="Initial password" /></div>
          <div className="form-group"><label className="form-label">Company</label><input className="form-input" value={inviteForm.company} onChange={function(e){setInviteForm({...inviteForm,company:e.target.value});}} placeholder="Acme Corp" /></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div className="form-group"><label className="form-label">Permission Level</label><select className="form-select" value={inviteForm.permission} onChange={function(e){setInviteForm({...inviteForm,permission:e.target.value});}}>
            <option value="view">View — can see files only</option>
            <option value="download">Download — view + download</option>
            <option value="edit">Edit — view, download + edit documents</option>
          </select></div>
          <div className="form-group"><label className="form-label">Expires (days)</label><select className="form-select" value={inviteForm.expires_days} onChange={function(e){setInviteForm({...inviteForm,expires_days:e.target.value});}}>
            <option value="">Never</option><option value="30">30 days</option><option value="90">90 days</option><option value="180">6 months</option><option value="365">1 year</option>
          </select></div>
        </div>
        <div className="form-group"><label className="form-label">Grant Access to Projects</label>
          <div style={{maxHeight:180,overflowY:"auto",border:"1px solid var(--border-subtle)",borderRadius:"var(--radius-sm)",padding:8}}>
            {projects.length===0?<div style={{padding:12,textAlign:"center",color:"var(--text-tertiary)",fontSize:12}}>No projects available</div>:
            projects.map(function(p){var checked=inviteForm.project_ids.indexOf(p.id)>=0; return(
              <label key={p.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 8px",borderRadius:4,cursor:"pointer",background:checked?"var(--accent-muted)":"transparent",transition:"all .15s"}}>
                <input type="checkbox" checked={checked} onChange={function(){toggleProject(p.id);}} />
                <div style={{width:8,height:8,borderRadius:2,background:p.color||"var(--accent)"}} />
                <div><div style={{fontSize:13,fontWeight:500}}>{p.name}</div><div style={{fontSize:11,color:"var(--text-tertiary)"}}>{p.space_name} · {p.file_count} files</div></div>
              </label>
            );})}
          </div>
        </div>
      </Modal>

      {/* ── Edit Settings Modal ── */}
      <Modal open={showEdit} onClose={function(){setShowEdit(false);}} title="Edit Portal Settings" footer={
        <React.Fragment><button className="btn btn-secondary" onClick={function(){setShowEdit(false);}}>Cancel</button><button className="btn btn-primary" onClick={saveSettings}>Save Changes</button></React.Fragment>
      }>
        <div className="form-group"><label className="form-label">Portal Name</label><input className="form-input" value={editForm.name} onChange={function(e){setEditForm({...editForm,name:e.target.value});}} /></div>
        <div className="form-group"><label className="form-label">Custom Domain</label><input className="form-input" value={editForm.custom_domain} onChange={function(e){setEditForm({...editForm,custom_domain:e.target.value});}} placeholder="portal.company.com" style={{fontFamily:"var(--mono)"}} /></div>
        <div className="form-group"><label className="form-label">Welcome Message</label><input className="form-input" value={editForm.welcome_message} onChange={function(e){setEditForm({...editForm,welcome_message:e.target.value});}} placeholder="Sign in to access your files" /></div>
        <div className="form-group"><label className="form-label">Brand Color</label><input type="color" className="form-input" style={{height:40,padding:4}} value={editForm.brand_color} onChange={function(e){setEditForm({...editForm,brand_color:e.target.value});}} /></div>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:8}}>
          <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:"var(--text-secondary)",cursor:"pointer"}}><input type="checkbox" checked={editForm.watermark_files} onChange={function(e){setEditForm({...editForm,watermark_files:e.target.checked});}} /> Watermark downloaded files</label>
          <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:"var(--text-secondary)",cursor:"pointer"}}><input type="checkbox" checked={editForm.require_sso} onChange={function(e){setEditForm({...editForm,require_sso:e.target.checked});}} /> Require SSO login</label>
          <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:"var(--text-secondary)",cursor:"pointer"}}><input type="checkbox" checked={editForm.allow_signup} onChange={function(e){setEditForm({...editForm,allow_signup:e.target.checked});}} /> Allow self-registration</label>
        </div>
      </Modal>

      {/* ── Edit Access Modal ── */}
      <Modal open={!!editingAccess} onClose={function(){setEditingAccess(null);}} title={"Edit Access — "+(editingAccess?editingAccess.name:"")} footer={
        <React.Fragment><button className="btn btn-secondary" onClick={function(){setEditingAccess(null);}}>Cancel</button><button className="btn btn-primary" onClick={saveEditAccess}>Save Changes</button></React.Fragment>
      }>
        {editingAccess&&<React.Fragment>
          <div style={{background:"var(--bg-tertiary)",borderRadius:"var(--radius-sm)",padding:"12px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:10}}>
            <div className="avatar-sm" style={{background:"hsl("+((editingAccess.email||"").charCodeAt(0)*7)+",55%,50%)"}}>{(editingAccess.name||"").substring(0,2).toUpperCase()}</div>
            <div><div style={{fontSize:13,fontWeight:500}}>{editingAccess.name}</div><div style={{fontSize:11,color:"var(--text-tertiary)"}}>{editingAccess.email}</div></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div className="form-group"><label className="form-label">Permission Level</label>
              <select className="form-select" value={editAccessForm.permission} onChange={function(e){setEditAccessForm({...editAccessForm,permission:e.target.value});}}>
                <option value="view">View — see files only</option>
                <option value="download">Download — view + download</option>
                <option value="edit">Edit — full access + upload</option>
              </select>
            </div>
            <div className="form-group"><label className="form-label">Company</label>
              <input className="form-input" value={editAccessForm.company} onChange={function(e){setEditAccessForm({...editAccessForm,company:e.target.value});}} placeholder="Company name" />
            </div>
          </div>
          <div className="form-group"><label className="form-label">New Expiry (leave empty to keep current)</label>
            <select className="form-select" value={editAccessForm.expires_days} onChange={function(e){setEditAccessForm({...editAccessForm,expires_days:e.target.value});}}>
              <option value="">Keep current</option>
              <option value="30">30 days from now</option>
              <option value="90">90 days from now</option>
              <option value="180">6 months from now</option>
              <option value="365">1 year from now</option>
              <option value="0">No expiry</option>
            </select>
          </div>
          <div className="form-group"><label className="form-label">Project Access</label>
            <div style={{maxHeight:200,overflowY:"auto",border:"1px solid var(--border-subtle)",borderRadius:"var(--radius-sm)",padding:8}}>
              {projects.length===0?<div style={{padding:12,textAlign:"center",color:"var(--text-tertiary)",fontSize:12}}>No projects</div>:
              projects.map(function(p){var checked=editAccessForm.project_ids.indexOf(p.id)>=0; return(
                <label key={p.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px",borderRadius:4,cursor:"pointer",background:checked?"var(--accent-muted)":"transparent",transition:"all .15s"}}>
                  <input type="checkbox" checked={checked} onChange={function(){toggleEditProject(p.id);}} />
                  <div style={{width:8,height:8,borderRadius:2,background:p.color||"var(--accent)"}} />
                  <div><div style={{fontSize:13,fontWeight:500}}>{p.name}</div><div style={{fontSize:11,color:"var(--text-tertiary)"}}>{p.space_name}</div></div>
                </label>
              );})}
            </div>
          </div>
          {editingAccess.expires_at&&<div style={{fontSize:12,color:"var(--text-tertiary)",marginTop:4}}>Current expiry: {new Date(editingAccess.expires_at).toLocaleDateString()}</div>}
        </React.Fragment>}
      </Modal>

      {/* ── Add Internal User Modal ── */}
      <Modal open={showAddInternal} onClose={function(){setShowAddInternal(false);}} title="Add Internal User to Portal" footer={
        <React.Fragment><button className="btn btn-secondary" onClick={function(){setShowAddInternal(false);}}>Cancel</button><button className="btn btn-primary" onClick={addInternalUser}>Add User</button></React.Fragment>
      }>
        <p style={{fontSize:13,color:"var(--text-secondary)",marginBottom:16}}>Add an existing team member to this portal. They'll be able to log in via the portal URL and manage files.</p>
        <div className="form-group"><label className="form-label">Select User</label>
          <select className="form-select" value={selectedUser} onChange={function(e){setSelectedUser(e.target.value);}}>
            <option value="">Choose a team member...</option>
            {internalUsers.filter(function(u){return !access.some(function(a){return a.user_id===u.id && a.is_active;});}).map(function(u){return(
              <option key={u.id} value={u.id}>{u.name} ({u.email}) — {u.role}</option>
            );})}
          </select>
        </div>
        <div className="form-group"><label className="form-label">Permission Level</label>
          <select className="form-select" value={internalPerm} onChange={function(e){setInternalPerm(e.target.value);}}>
            <option value="view">View — can see files only</option>
            <option value="download">Download — view + download</option>
            <option value="edit">Edit — view, download, upload + edit</option>
          </select>
        </div>
        <div className="form-group"><label className="form-label">Grant Access to Projects</label>
          <div style={{maxHeight:180,overflowY:"auto",border:"1px solid var(--border-subtle)",borderRadius:"var(--radius-sm)",padding:8}}>
            {projects.length===0?<div style={{padding:12,textAlign:"center",color:"var(--text-tertiary)",fontSize:12}}>No projects available</div>:
            projects.map(function(p){var checked=internalProjects.indexOf(p.id)>=0; return(
              <label key={p.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 8px",borderRadius:4,cursor:"pointer",background:checked?"var(--accent-muted)":"transparent"}}>
                <input type="checkbox" checked={checked} onChange={function(){toggleInternalProject(p.id);}} />
                <div style={{width:8,height:8,borderRadius:2,background:p.color||"var(--accent)"}} />
                <div><div style={{fontSize:13,fontWeight:500}}>{p.name}</div><div style={{fontSize:11,color:"var(--text-tertiary)"}}>{p.space_name} · {p.file_count} files</div></div>
              </label>
            );})}
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE: SETTINGS
   ═══════════════════════════════════════════════════════════════════════════ */
function EmailSettings() {
  var [status, setStatus] = useState(null);
  var [testEmail, setTestEmail] = useState("");
  var [sending, setSending] = useState(false);
  var notify = useNotify();

  useEffect(function(){
    apiFetch("/admin/email-status").then(setStatus).catch(function(){});
  },[]);

  function sendTest() {
    if(!testEmail){notify("Enter an email address","error");return;}
    setSending(true);
    apiFetch("/admin/email-test",{method:"POST",body:{to:testEmail}})
      .then(function(r){
        if(r.sent) notify("Test email sent!","success");
        else notify("Failed: "+(r.error||r.reason||"Unknown error"),"error");
      })
      .catch(function(e){notify(e.message,"error");})
      .finally(function(){setSending(false);});
  }

  return (
    <div className="card"><div className="card-body">
      <h4 style={{fontSize:14,fontWeight:600,marginBottom:16}}>Email Notifications (Resend)</h4>

      <div style={{background:status&&status.configured?"var(--success-bg)":"var(--danger-bg)",border:"1px solid "+(status&&status.configured?"rgba(52,211,153,0.2)":"rgba(248,113,113,0.2)"),borderRadius:"var(--radius)",padding:"14px 18px",marginBottom:20,display:"flex",alignItems:"center",gap:12}}>
        <StatusDot status={status&&status.configured?"active":"error"} />
        <div>
          <div style={{fontSize:14,fontWeight:600,color:status&&status.configured?"var(--success)":"var(--danger)"}}>{status&&status.configured?"Email Configured":"Email Not Configured"}</div>
          <div style={{fontSize:12,color:"var(--text-tertiary)",marginTop:2}}>Provider: Resend · From: {status?status.from:"loading..."}</div>
        </div>
      </div>

      {!(status&&status.configured)&&<div style={{background:"var(--bg-tertiary)",borderRadius:"var(--radius)",padding:20,marginBottom:20}}>
        <p style={{fontSize:13,color:"var(--text-secondary)",lineHeight:1.6,marginBottom:12}}>To enable email notifications:</p>
        <ol style={{fontSize:13,color:"var(--text-secondary)",lineHeight:2,paddingLeft:20}}>
          <li>Create an account at <strong style={{color:"var(--text-primary)"}}>resend.com</strong></li>
          <li>Get your API key from the dashboard</li>
          <li>Add your sending domain (or use the free onboarding domain)</li>
          <li>SSH into the server and edit the config:</li>
        </ol>
        <pre style={{background:"var(--bg-primary)",border:"1px solid var(--border-subtle)",borderRadius:"var(--radius-sm)",padding:14,fontSize:12,fontFamily:"var(--mono)",color:"var(--text-secondary)",marginTop:8,overflow:"auto"}}>{"sudo nano /opt/drivesync/.env\n\n# Set these values:\nRESEND_API_KEY=re_xxxxxxxxxxxx\nEMAIL_FROM=DriveSync <noreply@yourdomain.com>\nAPP_URL=https://yourdomain.com\n\n# Then restart:\nsudo systemctl restart drivesync"}</pre>
      </div>}

      <div style={{marginTop:16}}>
        <h4 style={{fontSize:14,fontWeight:600,marginBottom:12}}>Send Test Email</h4>
        <div style={{display:"flex",gap:8}}>
          <input className="form-input" placeholder="test@example.com" value={testEmail} onChange={function(e){setTestEmail(e.target.value);}} style={{maxWidth:320}} onKeyDown={function(e){if(e.key==="Enter")sendTest();}} />
          <button className="btn btn-primary" onClick={sendTest} disabled={sending}>{sending?"Sending...":"Send Test"}</button>
        </div>
      </div>

      <div style={{marginTop:24,paddingTop:16,borderTop:"1px solid var(--border-subtle)"}}>
        <h4 style={{fontSize:14,fontWeight:600,marginBottom:10}}>Automatic Emails</h4>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {[
            {name:"Portal Invites",desc:"Sent when you invite a customer to a portal",active:true},
            {name:"Share Link Notifications",desc:"Sent when sharing a file with an email address",active:true},
            {name:"Password Reset",desc:"Sent when a user requests a password reset",active:true},
            {name:"Team Invites",desc:"Sent when inviting internal team members",active:true},
          ].map(function(e,i){return(
            <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid var(--border-subtle)"}}>
              <div><div style={{fontSize:13,fontWeight:500}}>{e.name}</div><div style={{fontSize:11,color:"var(--text-tertiary)"}}>{e.desc}</div></div>
              <span className={"badge "+(e.active?"badge-success":"badge-neutral")}>{e.active?"Active":"Disabled"}</span>
            </div>
          );})}
        </div>
      </div>
    </div></div>
  );
}

function SystemStatus() {
  var [status, setStatus] = useState(null);
  var [loading, setLoading] = useState(true);
  var notify = useNotify();

  function loadStatus() {
    setLoading(true);
    apiFetch("/admin/region-status")
      .then(setStatus)
      .catch(function(e){notify(e.message,"error");})
      .finally(function(){setLoading(false);});
  }

  useEffect(loadStatus, []);

  function fmtUptime(s) {
    var d=Math.floor(s/86400); var h=Math.floor((s%86400)/3600); var m=Math.floor((s%3600)/60);
    return (d>0?d+"d ":"")+(h>0?h+"h ":"")+m+"m";
  }

  if (loading) return <div style={{textAlign:"center",padding:40,color:"var(--text-tertiary)"}}>Loading system status...</div>;
  if (!status) return <div style={{textAlign:"center",padding:40,color:"var(--text-tertiary)"}}>Could not load status</div>;

  var currentRegion = status.regions.find(function(r){return r.id===status.currentRegion;});
  var otherRegion = status.otherRegion;
  var db = status.database;
  var srv = status.server;

  return (
    <div>
      {/* Region Cards */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:24}}>
        {status.regions.map(function(r){
          var isCurrent = r.id===status.currentRegion;
          var isOther = otherRegion && r.id===otherRegion.id;
          var reachable = isCurrent ? true : (otherRegion ? otherRegion.reachable : false);
          var latency = isOther && otherRegion ? otherRegion.latency : (isCurrent ? db.latency : null);
          return (
            <div key={r.id} className="card" style={{position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:r.role==="primary"?"var(--accent)":"var(--purple)"}} />
              <div className="card-body">
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:28}}>{r.flag}</span>
                    <div>
                      <div style={{fontSize:16,fontWeight:700}}>{r.name}</div>
                      <div style={{fontSize:12,color:"var(--text-tertiary)"}}>{r.domain}</div>
                    </div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                    {isCurrent&&<span className="badge badge-success" style={{fontSize:10}}>YOU ARE HERE</span>}
                    <span className={"badge "+(r.role==="primary"?"badge-info":"badge-neutral")} style={{fontSize:10,textTransform:"uppercase"}}>{r.role}</span>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderRadius:"var(--radius-sm)",background:reachable?"var(--success-bg)":"var(--danger-bg)",marginBottom:10}}>
                  <StatusDot status={reachable?"active":"error"} />
                  <span style={{fontSize:13,fontWeight:500,color:reachable?"var(--success)":"var(--danger)"}}>{reachable?"Online":"Offline"}</span>
                  {latency!==null&&<span style={{fontSize:11,color:"var(--text-tertiary)",marginLeft:"auto"}}>{latency}ms</span>}
                </div>
                <div style={{fontSize:12,color:"var(--text-tertiary)"}}>
                  {isCurrent&&<div>Uptime: {fmtUptime(srv.uptime)} · Node {srv.nodeVersion} · {srv.hostname}</div>}
                  {isOther&&!reachable&&<div style={{color:"var(--danger)"}}>Cannot reach this server</div>}
                  {isOther&&reachable&&<div>Latency: {otherRegion.latency}ms via Tailscale</div>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Connection Map */}
      <div className="card" style={{marginBottom:24}}>
        <div className="card-header"><span className="card-title">Multi-Region Architecture</span><button className="btn btn-ghost btn-sm" onClick={loadStatus}><IconSync /> Refresh</button></div>
        <div className="card-body" style={{padding:"24px 32px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:0}}>
            {/* US Server */}
            <div style={{textAlign:"center",minWidth:160}}>
              <div style={{fontSize:32,marginBottom:4}}>🇺🇸</div>
              <div style={{fontSize:14,fontWeight:700}}>US Server</div>
              <div style={{fontSize:11,color:"var(--text-tertiary)"}}>drive-us.syberjet.com</div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:4,marginTop:6}}>
                <StatusDot status={status.currentRegion==="us"||otherRegion&&otherRegion.reachable?"active":"error"} />
                <span style={{fontSize:11,color:"var(--success)"}}>Primary · DB Host</span>
              </div>
            </div>

            {/* Connection Line */}
            <div style={{flex:1,maxWidth:200,position:"relative",margin:"0 16px"}}>
              <div style={{height:2,background:otherRegion&&otherRegion.reachable?"var(--success)":"var(--danger)",position:"relative"}}>
                <div style={{position:"absolute",top:-10,left:"50%",transform:"translateX(-50%)",background:"var(--bg-secondary)",padding:"2px 10px",borderRadius:10,border:"1px solid var(--border-subtle)",fontSize:10,fontWeight:600,color:otherRegion&&otherRegion.reachable?"var(--success)":"var(--danger)",whiteSpace:"nowrap"}}>
                  {otherRegion&&otherRegion.reachable?"Tailscale · "+otherRegion.latency+"ms":"Disconnected"}
                </div>
              </div>
              <div style={{textAlign:"center",marginTop:12,fontSize:10,color:"var(--text-tertiary)"}}>
                DB Replication · File Sync (5min)
              </div>
            </div>

            {/* Asia Server */}
            <div style={{textAlign:"center",minWidth:160}}>
              <div style={{fontSize:32,marginBottom:4}}>🇯🇵</div>
              <div style={{fontSize:14,fontWeight:700}}>Asia Server</div>
              <div style={{fontSize:11,color:"var(--text-tertiary)"}}>drive-asia.syberjet.com</div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:4,marginTop:6}}>
                <StatusDot status={status.currentRegion==="asia"||otherRegion&&otherRegion.reachable?"active":"error"} />
                <span style={{fontSize:11,color:"var(--text-tertiary)"}}>Secondary · Remote DB</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Database Status */}
      <div className="card" style={{marginBottom:24}}>
        <div className="card-header"><span className="card-title">Database</span></div>
        <div className="card-body">
          <div className="stats-grid">
            <div className="stat-card"><div className="stat-label">Status</div><div style={{display:"flex",alignItems:"center",gap:6}}><StatusDot status={db.connected?"active":"error"} /><span style={{fontSize:14,fontWeight:600,color:db.connected?"var(--success)":"var(--danger)"}}>{db.connected?"Connected":"Disconnected"}</span></div></div>
            <div className="stat-card"><div className="stat-label">Host</div><div className="stat-value" style={{fontSize:14}}>{db.host}</div><div style={{fontSize:11,color:"var(--text-tertiary)"}}>{db.isRemote?"Remote (Tailscale)":"Local"}</div></div>
            <div className="stat-card"><div className="stat-label">Latency</div><div className="stat-value" style={{fontSize:14}}>{db.latency}ms</div></div>
            <div className="stat-card"><div className="stat-label">Users</div><div className="stat-value">{db.users}</div></div>
            <div className="stat-card"><div className="stat-label">Files</div><div className="stat-value">{db.files}</div></div>
            <div className="stat-card"><div className="stat-label">Storage</div><div className="stat-value">{fmtSize(db.totalSize)}</div></div>
          </div>
        </div>
      </div>

      {/* Server Info */}
      <div className="card">
        <div className="card-header"><span className="card-title">This Server</span></div>
        <div className="card-body">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
            <div><div style={{fontSize:11,color:"var(--text-tertiary)",marginBottom:4}}>Hostname</div><div style={{fontSize:13,fontWeight:500}}>{srv.hostname}</div></div>
            <div><div style={{fontSize:11,color:"var(--text-tertiary)",marginBottom:4}}>Uptime</div><div style={{fontSize:13,fontWeight:500}}>{fmtUptime(srv.uptime)}</div></div>
            <div><div style={{fontSize:11,color:"var(--text-tertiary)",marginBottom:4}}>Node.js</div><div style={{fontSize:13,fontWeight:500}}>{srv.nodeVersion}</div></div>
            <div><div style={{fontSize:11,color:"var(--text-tertiary)",marginBottom:4}}>Region</div><div style={{fontSize:13,fontWeight:500}}>{currentRegion?currentRegion.flag+" "+currentRegion.name:"Unknown"}</div></div>
            <div><div style={{fontSize:11,color:"var(--text-tertiary)",marginBottom:4}}>Role</div><div style={{fontSize:13,fontWeight:500}}>{currentRegion?currentRegion.role:"Unknown"}</div></div>
            <div><div style={{fontSize:11,color:"var(--text-tertiary)",marginBottom:4}}>Memory</div><div style={{fontSize:13,fontWeight:500}}>{Math.round(srv.memory.rss/1048576)}MB RSS</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsPage() {
  var [org, setOrg] = useState(null);
  var [tab, setTab] = useState("General");
  var notify = useNotify();
  useEffect(function(){apiFetch("/admin/org").then(setOrg).catch(function(){});}, []);
  function save() { apiFetch("/admin/org",{method:"PATCH",body:{name:org.name,domain:org.domain}}).then(function(){notify("Saved!","success");}).catch(function(e){notify(e.message,"error");}); }
  return (
    <div>
      <div className="page-header"><div><div className="page-title">Settings</div><div className="page-subtitle">Configure your workspace</div></div></div>
      <Tabs items={["General","Authentication","Email","Security","System"]} active={tab} onChange={setTab} />
      {tab==="General"&&org&&<div className="card"><div className="card-body">
        <div className="form-group"><label className="form-label">Organization Name</label><input className="form-input" value={org.name||""} onChange={function(e){setOrg({...org,name:e.target.value});}} /></div>
        <div className="form-group"><label className="form-label">Domain</label><input className="form-input" value={org.domain||""} onChange={function(e){setOrg({...org,domain:e.target.value});}} style={{fontFamily:"var(--mono)"}} /></div>
        <div className="form-group"><label className="form-label">Storage Quota</label><div style={{fontSize:14,fontWeight:600}}>{fmtSize(org.storage_quota)}</div></div>
        <button className="btn btn-primary" onClick={save} style={{marginTop:8}}>Save Changes</button>
      </div></div>}
      {tab==="Authentication"&&<div className="card"><div className="card-body">
        <h4 style={{fontSize:14,fontWeight:600,marginBottom:16}}>Google OAuth</h4>
        <p style={{fontSize:13,color:"var(--text-secondary)",lineHeight:1.6}}>Set <code style={{fontFamily:"var(--mono)",background:"var(--bg-active)",padding:"2px 6px",borderRadius:4,fontSize:12}}>GOOGLE_CLIENT_ID</code> and <code style={{fontFamily:"var(--mono)",background:"var(--bg-active)",padding:"2px 6px",borderRadius:4,fontSize:12}}>GOOGLE_CLIENT_SECRET</code> in /opt/drivesync/.env then restart the service.</p>
      </div></div>}
      {tab==="Email"&&React.createElement(EmailSettings)}

      {tab==="System"&&React.createElement(SystemStatus)}

      {tab==="Security"&&<div className="card"><div className="card-body">
        {["JWT auth (24h expiry)","bcrypt hashing (12 rounds)","Rate limiting (500 req/15min)","File upload filtering","CORS restriction","Helmet security headers","Audit logging"].map(function(s,i){return(
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid var(--border-subtle)"}}><span style={{color:"var(--success)"}}><IconCheck /></span><span style={{fontSize:13}}>{s}</span></div>
        );})}
      </div></div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   NAV ITEMS
   ═══════════════════════════════════════════════════════════════════════════ */
var navSections = [
  { label: "Main", items: [
    { id:"dashboard", text:"Dashboard", Icon:IconHome },
    { id:"files", text:"Files", Icon:IconFolder },
    { id:"projects", text:"Projects", Icon:IconProject },
    { id:"spaces", text:"Spaces", Icon:IconDatabase },
  ]},
  { label: "Management", items: [
    { id:"users", text:"Users", Icon:IconUsers },
    { id:"sharing", text:"Sharing", Icon:IconShare },
    { id:"drives", text:"Drives", Icon:IconDrive },
    { id:"servers", text:"Servers", Icon:IconServer },
  ]},
  { label: "External", items: [
    { id:"portal", text:"Portal", Icon:IconPortal },
  ]},
  { label: "System", items: [
    { id:"settings", text:"Settings", Icon:IconSettings },
  ]},
];

/* ═══════════════════════════════════════════════════════════════════════════
   LOGIN PAGE
   ═══════════════════════════════════════════════════════════════════════════ */
function LoginPage() {
  var auth = useAuth();
  var [mode, setMode] = useState("login");
  var [region, setRegion] = useState(null);

  useEffect(function() {
    fetch("/api/region").then(function(r){return r.json();}).then(setRegion).catch(function(){});
  }, []);
  var [form, setForm] = useState({email:"",password:""});
  var [error, setError] = useState("");
  var [success, setSuccess] = useState("");
  var [busy, setBusy] = useState(false);
  var [showPass, setShowPass] = useState(false);
  var [resetToken, setResetToken] = useState("");
  var [newPassword, setNewPassword] = useState("");
  var [confirmPassword, setConfirmPassword] = useState("");
  var [resetEmail, setResetEmail] = useState("");

  useEffect(function() {
    var params = new URLSearchParams(window.location.search);
    var token = params.get("reset");
    if (token) {
      setResetToken(token); setMode("reset");
      fetch("/api/password/validate/"+token).then(function(r){return r.json();}).then(function(d){
        if (d.valid) { setResetEmail(d.email); } else { setError(d.error||"Invalid reset link"); setMode("login"); }
      }).catch(function(){setError("Could not validate"); setMode("login");});
    }
  }, []);

  function handleSubmit(e) {
    e.preventDefault(); setError(""); setBusy(true);
    auth.login(form.email, form.password).catch(function(err){setError(err.message);}).finally(function(){setBusy(false);});
  }

  function handleForgot(e) {
    e.preventDefault(); setError(""); setSuccess(""); setBusy(true);
    apiFetch("/password/forgot",{method:"POST",body:{email:form.email}}).then(function(){setSuccess("If an account exists, a reset link has been sent.");}).catch(function(err){setError(err.message);}).finally(function(){setBusy(false);});
  }

  function handleReset(e) {
    e.preventDefault(); setError(""); setSuccess(""); setBusy(true);
    if(newPassword!==confirmPassword){setError("Passwords don't match");setBusy(false);return;}
    fetch("/api/password/reset",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:resetToken,password:newPassword})}).then(function(r){return r.json().then(function(d){return{ok:r.ok,data:d};});}).then(function(r){if(!r.ok)throw new Error(r.data.error);setSuccess("Password reset!");setMode("login");window.history.replaceState({},"",window.location.pathname);}).catch(function(err){setError(err.message);}).finally(function(){setBusy(false);});
  }

  function handleGoogleLogin(){
    if(!window.google){var s=document.createElement("script");s.src="https://accounts.google.com/gsi/client";s.onload=function(){doGoogle();};document.head.appendChild(s);}else{doGoogle();}
  }
  function doGoogle(){
    window.google.accounts.id.initialize({client_id:"721068823761-uuittron5op99ohocbjfpsh6283sc5o6.apps.googleusercontent.com",callback:function(r){setError("");setBusy(true);apiFetch("/auth/google",{method:"POST",body:{credential:r.credential}}).then(function(d){localStorage.setItem("ds_token",d.token);window.location.reload();}).catch(function(e){setError(e.message);setBusy(false);});}});
    window.google.accounts.id.renderButton(document.getElementById("sd-google-btn"),{theme:"filled_black",size:"large",width:"340",text:"signin_with",shape:"rectangular"});
  }
  useEffect(function(){if(mode==="login"){var t=setTimeout(handleGoogleLogin,200);return function(){clearTimeout(t);};};},[mode]);

  var CSS = "<style>"
    +".sd-page{min-height:100vh;background:#0A0E14;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}"
    +".sd-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(0,229,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,.03) 1px,transparent 1px);background-size:60px 60px}"
    +".sd-wrap{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;padding:20px;width:100%;max-width:440px}"
    +".sd-logo{text-align:center;margin-bottom:32px}"
    +".sd-icon{display:flex;flex-direction:column;align-items:center;gap:4px;margin-bottom:16px}"
    +".sd-bar{height:6px;border-radius:2px}"
    +".sd-dots{display:flex;align-items:center;gap:4px}"
    +".sd-dot{width:8px;height:8px;border-radius:50%}"
    +".sd-h1{font-size:32px;font-weight:700;color:#00E5FF;letter-spacing:1px;margin:0;font-family:DM Sans,sans-serif}"
    +".sd-sub{font-size:11px;letter-spacing:4px;color:#4DD0E1;font-weight:500;margin-top:4px}"
    +".sd-card{width:100%;background:rgba(15,20,30,.7);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(0,229,255,.1);border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.4),inset 0 1px 0 rgba(0,229,255,.05)}"
    +".sd-inner{padding:32px 36px}"
    +".sd-title{font-size:20px;font-weight:700;color:#E0E6ED;margin:0 0 6px}"
    +".sd-desc{font-size:13px;color:#5C6B7A;margin:0 0 24px}"
    +".sd-field{margin-bottom:18px}"
    +".sd-lbl{display:block;font-size:11px;font-weight:600;letter-spacing:1.5px;color:#5C6B7A;margin-bottom:8px}"
    +".sd-iw{display:flex;align-items:center;background:rgba(12,16,24,.8);border:1px solid rgba(0,229,255,.12);border-radius:10px;padding:0 14px;transition:all .2s}"
    +".sd-iw:focus-within{border-color:rgba(0,229,255,.4);box-shadow:0 0 0 3px rgba(0,229,255,.08)}"
    +".sd-ii{color:#3A4A5C;flex-shrink:0;margin-right:10px}"
    +".sd-inp{flex:1;border:none;background:none;color:#E0E6ED;font-size:14px;padding:13px 0;outline:none;width:100%;font-family:DM Sans,sans-serif}"
    +".sd-inp::placeholder{color:#3A4A5C}"
    +".sd-eye{background:none;border:none;color:#3A4A5C;cursor:pointer;padding:4px;display:flex}"
    +".sd-eye:hover{color:#5C6B7A}"
    +".sd-btn{width:100%;padding:14px;border:none;border-radius:10px;background:linear-gradient(135deg,#00E5FF,#00BCD4);color:#0A0E14;font-size:15px;font-weight:700;cursor:pointer;transition:all .2s;margin-top:6px;letter-spacing:.5px;font-family:DM Sans,sans-serif}"
    +".sd-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 4px 20px rgba(0,229,255,.3)}"
    +".sd-btn:disabled{opacity:.5;cursor:not-allowed}"
    +".sd-div{display:flex;align-items:center;gap:12px;margin:20px 0}"
    +".sd-div::before,.sd-div::after{content:'';flex:1;height:1px;background:rgba(0,229,255,.08)}"
    +".sd-div span{font-size:12px;color:#3A4A5C}"
    +".sd-fg{text-align:center;margin-top:16px}"
    +".sd-fg span{font-size:13px;color:#4DD0E1;cursor:pointer}"
    +".sd-fg span:hover{color:#00E5FF}"
    +".sd-err{background:rgba(248,81,73,.08);border:1px solid rgba(248,81,73,.2);border-radius:8px;padding:10px 14px;font-size:13px;color:#F85149;margin-bottom:16px}"
    +".sd-ok{background:rgba(0,229,255,.06);border:1px solid rgba(0,229,255,.15);border-radius:8px;padding:10px 14px;font-size:13px;color:#4DD0E1;margin-bottom:16px}"
    +".sd-ssl{display:flex;align-items:center;gap:6px;margin-top:24px;font-size:12px;color:#2A5C4E;font-weight:500}"
    +"</style>";

  return React.createElement("div",{dangerouslySetInnerHTML:{__html:CSS},key:"css"},null) === null ? null : (
    <React.Fragment>
      <div dangerouslySetInnerHTML={{__html:CSS}} />
      <div className="sd-page">
        <div className="sd-grid"></div>
        <div className="sd-wrap">
          <div className="sd-logo">
            <div className="sd-icon">
              <div className="sd-bar" style={{width:28,background:"#00E5FF"}}></div>
              <div className="sd-bar" style={{width:28,background:"#00BCD4"}}></div>
              <div className="sd-dots">
                <div className="sd-bar" style={{width:20,background:"#4DD0E1"}}></div>
                <div className="sd-dot" style={{background:"#00E5FF"}}></div>
                <div className="sd-dot" style={{background:"#FFD600"}}></div>
              </div>
            </div>
            <h1 className="sd-h1">DriveSync</h1>
            <div className="sd-sub">SYBERJET CLOUD PORTAL</div>
          </div>

          <div className="sd-card"><div className="sd-inner">

            {mode==="login"&&<React.Fragment>
              <h2 className="sd-title">Sign in</h2>
              <p className="sd-desc">Access your network file shares</p>
              {error&&<div className="sd-err">{error}</div>}
              {success&&<div className="sd-ok">{success}</div>}
              <form onSubmit={handleSubmit}>
                <div className="sd-field"><div className="sd-lbl">USERNAME</div><div className="sd-iw"><svg className="sd-ii" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><input className="sd-inp" type="email" value={form.email} onChange={function(e){setForm({...form,email:e.target.value});}} placeholder="Enter username" required /></div></div>
                <div className="sd-field"><div className="sd-lbl">PASSWORD</div><div className="sd-iw"><svg className="sd-ii" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg><input className="sd-inp" type={showPass?"text":"password"} value={form.password} onChange={function(e){setForm({...form,password:e.target.value});}} placeholder="Enter password" required /><button type="button" className="sd-eye" onClick={function(){setShowPass(!showPass);}}>{showPass?<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>}</button></div></div>
                <button className="sd-btn" type="submit" disabled={busy}>{busy?"Signing in...":"Sign In"}</button>
              </form>
              <div className="sd-div"><span>or</span></div>
              <div id="sd-google-btn" style={{display:"flex",justifyContent:"center",marginBottom:8}}></div>
              <div className="sd-fg"><span onClick={function(){setMode("forgot");setError("");setSuccess("");}}>Forgot password?</span></div>
            </React.Fragment>}

            {mode==="forgot"&&<React.Fragment>
              <h2 className="sd-title">Reset Password</h2>
              <p className="sd-desc">Enter your email to receive a reset link</p>
              {error&&<div className="sd-err">{error}</div>}
              {success&&<div className="sd-ok">{success}</div>}
              <form onSubmit={handleForgot}>
                <div className="sd-field"><div className="sd-lbl">EMAIL</div><div className="sd-iw"><svg className="sd-ii" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><input className="sd-inp" type="email" value={form.email} onChange={function(e){setForm({...form,email:e.target.value});}} placeholder="Enter email" required /></div></div>
                <button className="sd-btn" type="submit" disabled={busy}>{busy?"Sending...":"Send Reset Link"}</button>
              </form>
              <div className="sd-fg"><span onClick={function(){setMode("login");setError("");setSuccess("");}}>Back to sign in</span></div>
            </React.Fragment>}

            {mode==="reset"&&<React.Fragment>
              <h2 className="sd-title">New Password</h2>
              <p className="sd-desc">{resetEmail?"For "+resetEmail:"Choose a new password"}</p>
              {error&&<div className="sd-err">{error}</div>}
              {success&&<div className="sd-ok">{success}</div>}
              <form onSubmit={handleReset}>
                <div className="sd-field"><div className="sd-lbl">NEW PASSWORD</div><div className="sd-iw"><svg className="sd-ii" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg><input className="sd-inp" type="password" value={newPassword} onChange={function(e){setNewPassword(e.target.value);}} placeholder="At least 6 characters" required minLength={6} /></div></div>
                <div className="sd-field"><div className="sd-lbl">CONFIRM</div><div className="sd-iw"><svg className="sd-ii" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg><input className="sd-inp" type="password" value={confirmPassword} onChange={function(e){setConfirmPassword(e.target.value);}} placeholder="Re-enter password" required minLength={6} /></div></div>
                <button className="sd-btn" type="submit" disabled={busy}>{busy?"Resetting...":"Reset Password"}</button>
              </form>
              <div className="sd-fg"><span onClick={function(){setMode("login");setError("");setSuccess("");window.history.replaceState({},"",window.location.pathname);}}>Back to sign in</span></div>
            </React.Fragment>}

          </div></div>

          <div className="sd-ssl"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Secure Connection (SSL)</div>
        </div>
      </div>
    </React.Fragment>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════
   APP SHELL
   ═══════════════════════════════════════════════════════════════════════════ */
function AppShell() {
  var auth = useAuth();
  var [appRegion, setAppRegion] = useState(null);
  useEffect(function(){fetch("/api/region").then(function(r){return r.json();}).then(setAppRegion).catch(function(){});},[]);
  var [page, setPage] = useState("dashboard");

  var pageMap = {
    dashboard: React.createElement(DashboardPage),
    files: React.createElement(FilesPage),
    projects: React.createElement(ProjectsPage),
    spaces: React.createElement(SpacesPage),
    users: React.createElement(UsersPage),
    sharing: React.createElement(SharingPage),
    drives: React.createElement(DrivesPage),
    servers: React.createElement(ServersPage),
    portal: React.createElement(PortalPage),
    settings: React.createElement(SettingsPage),
  };

  return (
    <div className="app">
      <div className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">DS</div>
          <div><h1>DriveSync</h1><span>Enterprise</span></div>{appRegion&&<div style={{marginLeft:6,padding:"2px 8px",borderRadius:12,fontSize:10,fontWeight:700,background:appRegion.color+"22",color:appRegion.color,letterSpacing:1}}>{appRegion.flag} {appRegion.short}</div>}
        </div>
        {navSections.map(function(sec) {
          return (
            <div className="sidebar-section" key={sec.label}>
              <div className="sidebar-label">{sec.label}</div>
              {sec.items.map(function(item) {
                var Ic = item.Icon;
                return (
                  <div key={item.id} className={"nav-item "+(page===item.id?"active":"")} onClick={function(){setPage(item.id);}}>
                    <Ic />
                    <span>{item.text}</span>
                  </div>
                );
              })}
            </div>
          );
        })}
        <div className="sidebar-user">
          <div className="avatar-sm" style={{background:"hsl("+(auth.user.email||"").charCodeAt(0)*7+",55%,50%)"}}>{(auth.user.name||"").substring(0,2).toUpperCase()}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{auth.user.name}</div>
            <div style={{fontSize:11,color:"var(--text-tertiary)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{auth.user.email}</div>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={auth.logout} title="Sign out" style={{flexShrink:0}}><IconLogout /></button>
        </div>
      </div>
      <div className="main">
        <div className="topbar">
          <div className="search-box"><IconSearch /><input placeholder="Search files, projects, users..." /></div>
          <div className="topbar-actions"><button className="topbar-btn"><IconBell /></button></div>
        </div>
        <div className="content">{pageMap[page] || React.createElement(DashboardPage)}</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ROOT APP (default export)
   ═══════════════════════════════════════════════════════════════════════════ */
function Inner() {
  var auth = useAuth();
  if (auth.loading) {
    return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--bg-primary)",color:"var(--text-tertiary)",fontFamily:"var(--font)"}}>Loading...</div>;
  }
  if (auth.user) {
    return React.createElement(AppShell);
  }
  return React.createElement(LoginPage);
}

export default function App() {
  return (
    <React.Fragment>
      <style>{CSS}</style>
      <AuthProvider>
        <NotifyProvider>
          <Inner />
        </NotifyProvider>
      </AuthProvider>
    </React.Fragment>
  );
}
