import React, { useState, useEffect, useRef, useCallback, useContext } from "react";

/* ═══════════════ CSS ═══════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --bg:#0D1117;--bg2:#161B22;--bg3:#1C2128;--bg4:#21262D;--bgh:#292E36;
  --border:#30363D;--border2:#21262D;
  --t1:#E6EDF3;--t2:#8B949E;--t3:#6E7681;
  --accent:#4F8EF7;--accent2:#6BA0FF;--accentA:rgba(79,142,247,0.12);
  --green:#3FB950;--greenA:rgba(63,185,80,0.1);
  --yellow:#D29922;--yellowA:rgba(210,153,34,0.1);
  --red:#F85149;--redA:rgba(248,81,73,0.1);
  --purple:#A371F7;
  --r:8px;--r2:12px;--r3:16px;
  --font:'DM Sans',sans-serif;--mono:'JetBrains Mono',monospace;
}
body{font-family:var(--font);background:var(--bg);color:var(--t1);min-height:100vh}
a{color:var(--accent);text-decoration:none}
.portal-login{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
.portal-login-card{background:var(--bg2);border:1px solid var(--border);border-radius:var(--r3);padding:40px;width:420px;max-width:100%}
.portal-header{padding:20px 24px;border-bottom:1px solid var(--border2);display:flex;align-items:center;justify-content:space-between;background:var(--bg2)}
.portal-content{padding:24px}
.portal-sidebar{width:260px;background:var(--bg2);border-right:1px solid var(--border2);display:flex;flex-direction:column;flex-shrink:0;height:100vh;overflow-y:auto}
.portal-main{flex:1;display:flex;flex-direction:column;height:100vh;overflow:hidden}
.portal-body{flex:1;overflow-y:auto;padding:24px}
.p-nav{padding:8px 12px;display:flex;align-items:center;gap:10px;border-radius:var(--r);cursor:pointer;color:var(--t2);font-size:13px;font-weight:500;transition:all .15s}
.p-nav:hover{background:var(--bgh);color:var(--t1)}
.p-nav.active{background:var(--accentA);color:var(--accent)}
.p-card{background:var(--bg2);border:1px solid var(--border2);border-radius:var(--r2);padding:20px;cursor:pointer;transition:all .15s}
.p-card:hover{border-color:var(--accent);transform:translateY(-1px)}
.p-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:var(--r);font-size:13px;font-weight:500;font-family:var(--font);cursor:pointer;border:1px solid transparent;transition:all .15s}
.p-btn-primary{background:var(--accent);color:white}.p-btn-primary:hover{background:var(--accent2)}
.p-btn-secondary{background:var(--bg3);color:var(--t1);border-color:var(--border)}.p-btn-secondary:hover{background:var(--bgh)}
.p-btn-ghost{background:none;color:var(--t2);border:none}.p-btn-ghost:hover{background:var(--bgh);color:var(--t1)}
.p-btn-sm{padding:5px 10px;font-size:12px}
.p-input{width:100%;padding:10px 14px;border:1px solid var(--border);border-radius:var(--r);background:var(--bg3);color:var(--t1);font-size:13px;font-family:var(--font);outline:none;transition:border-color .15s}
.p-input:focus{border-color:var(--accent)}
.p-label{display:block;font-size:12px;font-weight:600;color:var(--t2);margin-bottom:6px}
.p-group{margin-bottom:14px}
.p-badge{display:inline-flex;padding:3px 8px;border-radius:20px;font-size:11px;font-weight:600}
.p-badge-green{background:var(--greenA);color:var(--green)}
.p-badge-blue{background:var(--accentA);color:var(--accent)}
.p-badge-yellow{background:var(--yellowA);color:var(--yellow)}
.p-table{width:100%;border-collapse:collapse}
.p-table th{text-align:left;padding:10px 16px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:var(--t3);border-bottom:1px solid var(--border2)}
.p-table td{padding:12px 16px;font-size:13px;border-bottom:1px solid var(--border2)}
.p-table tr:hover td{background:var(--bgh)}
.p-table tr:last-child td{border-bottom:none}
.file-row{display:flex;align-items:center;gap:10px;font-weight:500}
.file-icon{width:34px;height:34px;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.file-icon.folder{background:rgba(210,153,34,0.12);color:#D29922}
.file-icon.document{background:rgba(79,142,247,0.12);color:#4F8EF7}
.file-icon.image{background:rgba(163,113,247,0.12);color:#A371F7}
.p-empty{text-align:center;padding:60px 20px;color:var(--t3)}
.p-empty h3{font-size:16px;color:var(--t2);margin-bottom:6px}
.p-toast{position:fixed;bottom:20px;right:20px;padding:12px 20px;border-radius:var(--r);font-size:13px;font-weight:500;z-index:999;animation:pSlideUp .2s}
.p-toast-ok{background:#0D2818;color:var(--green);border:1px solid rgba(63,185,80,0.3)}
.p-toast-err{background:#2D1215;color:var(--red);border:1px solid rgba(248,81,73,0.3)}
@keyframes pSlideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.perm-view{color:var(--green)}.perm-download{color:var(--accent)}.perm-edit{color:var(--yellow)}
::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:var(--bg4);border-radius:3px}
@media(max-width:768px){.portal-sidebar{display:none}.portal-body{padding:16px}}
`;

/* ═══════════════ HELPERS ═══════════════ */
const PAPI = "/api/portal";
function getPortalSlug() { return window.location.pathname.split("/")[2] || ""; }
function getPToken() { return sessionStorage.getItem("portal_token"); }

async function pFetch(path, opts) {
  var o = opts || {};
  var token = getPToken();
  var hdrs = {};
  if (token) hdrs["Authorization"] = "Bearer " + token;
  if (!(o.body instanceof FormData)) hdrs["Content-Type"] = "application/json";
  var res = await fetch(PAPI + "/" + getPortalSlug() + path, { method: o.method || "GET", headers: hdrs, body: o.body instanceof FormData ? o.body : o.body ? JSON.stringify(o.body) : undefined });
  if (res.status === 401) { sessionStorage.removeItem("portal_token"); window.location.reload(); return; }
  var data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

function fmtSize(b) { if(!b) return "—"; var u=["B","KB","MB","GB","TB"]; var i=Math.floor(Math.log(b)/Math.log(1024)); return (b/Math.pow(1024,i)).toFixed(i>0?1:0)+" "+u[i]; }
function fmtTime(d) { if(!d) return "—"; var diff=Date.now()-new Date(d).getTime(); if(diff<60000) return "just now"; if(diff<3600000) return Math.floor(diff/60000)+"m ago"; if(diff<86400000) return Math.floor(diff/3600000)+"h ago"; return new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}); }
function fileType(mime, isFolder) { if(isFolder) return "folder"; if(!mime) return "document"; if(mime.startsWith("image/")) return "image"; return "document"; }

/* ═══════════════ ICONS ═══════════════ */
function PIconFolder(){return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;}
function PIconFile(){return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;}
function PIconDownload(){return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;}
function PIconBack(){return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;}
function PIconProject(){return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>;}
function PIconChev(){return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;}
function PIconLogout(){return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;}
function PIconEye(){return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;}

function PIconLock(){return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;}
function PIconUnlock(){return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>;}
function PIconHistory(){return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;}
function PIconUpload(){return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;}


function PFileIcon(props) {
  var t = props.type || "document";
  return <div className={"file-icon "+t}>{t==="folder"?<PIconFolder />:<PIconFile />}</div>;
}

/* ═══════════════ TOAST ═══════════════ */
var NotifyCtx = React.createContext(function(){});
function PNotifyProvider(props) {
  var [notes, setNotes] = useState([]);
  var add = useCallback(function(msg,type){
    var id = Date.now()+Math.random();
    setNotes(function(p){return p.concat({id:id,msg:msg,type:type||"ok"});});
    setTimeout(function(){setNotes(function(p){return p.filter(function(n){return n.id!==id;});});},4000);
  },[]);
  return React.createElement(NotifyCtx.Provider,{value:add},
    props.children,
    notes.map(function(n){return React.createElement("div",{key:n.id,className:"p-toast p-toast-"+(n.type==="error"?"err":"ok")},n.msg);})
  );
}
function useNotify(){return useContext(NotifyCtx);}

/* ═══════════════ LOGIN PAGE ═══════════════ */
function PortalLogin(props) {
  var [info, setInfo] = useState(null);
  var [email, setEmail] = useState("");
  var [password, setPassword] = useState("");
  var [otpCode, setOtpCode] = useState("");
  var [error, setError] = useState("");
  var [success, setSuccess] = useState("");
  var [busy, setBusy] = useState(false);
  var [mode, setMode] = useState("otp-send"); // choose, password, otp-send, otp-verify, forgot, reset
  var [resetToken, setResetToken] = useState("");
  var [newPassword, setNewPassword] = useState("");
  var [confirmPassword, setConfirmPassword] = useState("");
  var [resetEmail, setResetEmail] = useState("");
  var slug = getPortalSlug();
  var [region, setRegion] = useState(null);

  useEffect(function(){
    fetch(PAPI+"/"+slug).then(function(r){return r.json();}).then(setInfo).catch(function(){setError("Portal not found");});
    fetch("/api/region").then(function(r){return r.json();}).then(setRegion).catch(function(){});
    var params = new URLSearchParams(window.location.search);
    var token = params.get("reset");
    if (token) {
      setResetToken(token); setMode("reset");
      fetch("/api/password/validate/"+token).then(function(r){return r.json();}).then(function(d){
        if (d.valid) { setResetEmail(d.email); } else { setError(d.error||"Invalid reset link"); setMode("choose"); }
      }).catch(function(){setError("Could not validate reset link"); setMode("choose");});
    }
  },[]);

  function handlePasswordLogin(e) {
    e.preventDefault(); setError(""); setBusy(true);
    fetch(PAPI+"/"+slug+"/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:email,password:password})})
      .then(function(r){return r.json().then(function(d){return {ok:r.ok,data:d};});})
      .then(function(r){
        if(!r.ok) throw new Error(r.data.error);
        sessionStorage.setItem("portal_token",r.data.token);
        sessionStorage.setItem("portal_user",JSON.stringify(r.data.user));
        sessionStorage.setItem("portal_access",JSON.stringify(r.data.access));
        sessionStorage.setItem("portal_info",JSON.stringify(r.data.portal));
        props.onLogin(r.data);
      })
      .catch(function(err){setError(err.message);})
      .finally(function(){setBusy(false);});
  }

  function requestOTP(e) {
    e.preventDefault(); setError(""); setSuccess(""); setBusy(true);
    fetch(PAPI+"/"+slug+"/otp/request",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:email})})
      .then(function(r){return r.json();})
      .then(function(d){
        if(d.error) throw new Error(d.error);
        setSuccess("A 6-digit code has been sent to your email.");
        setMode("otp-verify");
      })
      .catch(function(err){setError(err.message);})
      .finally(function(){setBusy(false);});
  }

  function verifyOTP(e) {
    e.preventDefault(); setError(""); setBusy(true);
    fetch(PAPI+"/"+slug+"/otp/verify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:email,code:otpCode})})
      .then(function(r){return r.json().then(function(d){return {ok:r.ok,data:d};});})
      .then(function(r){
        if(!r.ok) throw new Error(r.data.error);
        sessionStorage.setItem("portal_token",r.data.token);
        sessionStorage.setItem("portal_user",JSON.stringify(r.data.user));
        sessionStorage.setItem("portal_access",JSON.stringify(r.data.access));
        sessionStorage.setItem("portal_info",JSON.stringify(r.data.portal));
        props.onLogin(r.data);
      })
      .catch(function(err){setError(err.message);})
      .finally(function(){setBusy(false);});
  }

  function handleForgot(e) {
    e.preventDefault(); setError(""); setSuccess(""); setBusy(true);
    fetch("/api/password/forgot",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:email,portal_slug:slug})})
      .then(function(r){return r.json();})
      .then(function(d){ setSuccess("If an account exists, a reset link has been sent."); })
      .catch(function(err){setError(err.message);})
      .finally(function(){setBusy(false);});
  }

  function handleReset(e) {
    e.preventDefault(); setError(""); setSuccess(""); setBusy(true);
    if (newPassword !== confirmPassword) { setError("Passwords don't match"); setBusy(false); return; }
    if (newPassword.length < 6) { setError("Password must be at least 6 characters"); setBusy(false); return; }
    fetch("/api/password/reset",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:resetToken,password:newPassword})})
      .then(function(r){return r.json().then(function(d){return {ok:r.ok,data:d};});})
      .then(function(r){
        if(!r.ok) throw new Error(r.data.error);
        setSuccess("Password reset! You can now sign in.");
        setMode("choose"); setNewPassword(""); setConfirmPassword("");
        window.history.replaceState({},"",window.location.pathname);
      })
      .catch(function(err){setError(err.message);})
      .finally(function(){setBusy(false);});
  }

  var brandColor = (info && info.brand_color) || "#4F8EF7";

  return (
    <div className="portal-login">
      <div className="portal-login-card">
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{width:52,height:52,background:brandColor,borderRadius:14,display:"inline-flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:20,color:"white",marginBottom:12}}>
            {info ? info.name.substring(0,2).toUpperCase() : ".."}
          </div>
          <h1 style={{fontSize:20,fontWeight:700,marginBottom:4}}>{info ? info.name : "Loading..."}</h1>
          {region&&<div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"3px 10px",borderRadius:16,fontSize:11,fontWeight:600,background:region.color+"18",color:region.color,border:"1px solid "+region.color+"33",marginBottom:8}}><span>{region.flag}</span><span>{region.name} Region</span></div>}
          <p style={{color:"var(--t3)",fontSize:13}}>
            {mode==="choose" && "Choose how to sign in"}
            {mode==="password" && "Sign in with your password"}
            {mode==="otp-send" && "We'll email you a verification code"}
            {mode==="otp-verify" && "Enter the code sent to your email"}
            {mode==="forgot" && "Enter your email to reset your password"}
            {mode==="reset" && "Choose a new password"}
          </p>
        </div>

        {error && <div style={{background:"var(--redA)",color:"var(--red)",padding:"10px 14px",borderRadius:"var(--r)",fontSize:13,marginBottom:14,border:"1px solid rgba(248,81,73,0.2)"}}>{error}</div>}
        {success && <div style={{background:"var(--greenA)",color:"var(--green)",padding:"10px 14px",borderRadius:"var(--r)",fontSize:13,marginBottom:14,border:"1px solid rgba(63,185,80,0.2)"}}>{success}</div>}

        {/* ── Choose Method ── */}
        {mode==="choose" && <div>
          <button className="p-btn p-btn-primary" style={{width:"100%",padding:"14px",marginBottom:10,background:brandColor,justifyContent:"center"}} onClick={function(){setMode("otp-send");setError("");setSuccess("");}}>
            <span style={{marginRight:8}}>✉️</span> Sign in with Email Code
          </button>
          <button className="p-btn p-btn-secondary" style={{width:"100%",padding:"14px",justifyContent:"center"}} onClick={function(){setMode("password");setError("");setSuccess("");}}>
            <span style={{marginRight:8}}>🔒</span> Sign in with Password
          </button>
        </div>}

        {/* ── Password Login ── */}
        {mode==="password" && <form onSubmit={handlePasswordLogin}>
          <div className="p-group"><label className="p-label">Email</label><input className="p-input" type="email" value={email} onChange={function(e){setEmail(e.target.value);}} required /></div>
          <div className="p-group"><label className="p-label">Password</label><input className="p-input" type="password" value={password} onChange={function(e){setPassword(e.target.value);}} required /></div>
          <button className="p-btn p-btn-primary" style={{width:"100%",padding:"12px",marginTop:4,background:brandColor}} type="submit" disabled={busy}>{busy?"Signing in...":"Sign In"}</button>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:14}}>
            <span style={{color:brandColor,cursor:"pointer",fontSize:13}} onClick={function(){setMode("choose");setError("");setSuccess("");}}>← Other options</span>
            <span style={{color:"var(--t3)",cursor:"pointer",fontSize:13}} onClick={function(){setMode("forgot");setError("");setSuccess("");}}>Forgot password?</span>
          </div>
        </form>}

        {/* ── OTP: Enter Email ── */}
        {mode==="otp-send" && <form onSubmit={requestOTP}>
          <div className="p-group"><label className="p-label">Email Address</label><input className="p-input" type="email" value={email} onChange={function(e){setEmail(e.target.value);}} required placeholder="Enter your email" autoFocus /></div>
          <button className="p-btn p-btn-primary" style={{width:"100%",padding:"12px",marginTop:4,background:brandColor}} type="submit" disabled={busy}>{busy?"Sending code...":"Send Verification Code"}</button>
          <div style={{textAlign:"center",marginTop:14}}>
            <span style={{color:brandColor,cursor:"pointer",fontSize:13}} onClick={function(){setMode("choose");setError("");setSuccess("");}}>← Other options</span>
          </div>
        </form>}

        {/* ── OTP: Enter Code ── */}
        {mode==="otp-verify" && <form onSubmit={verifyOTP}>
          <div style={{textAlign:"center",marginBottom:16}}>
            <div style={{fontSize:13,color:"var(--t2)"}}>Code sent to <strong style={{color:"var(--t1)"}}>{email}</strong></div>
          </div>
          <div className="p-group">
            <input className="p-input" value={otpCode} onChange={function(e){setOtpCode(e.target.value.replace(/\D/g,"").substring(0,6));}} required placeholder="000000" maxLength={6}
              style={{textAlign:"center",fontSize:28,fontWeight:700,letterSpacing:8,fontFamily:"'SFMono-Regular',Consolas,monospace",padding:"16px"}} autoFocus />
          </div>
          <button className="p-btn p-btn-primary" style={{width:"100%",padding:"12px",marginTop:4,background:brandColor}} type="submit" disabled={busy||otpCode.length<6}>{busy?"Verifying...":"Verify & Sign In"}</button>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:14}}>
            <span style={{color:brandColor,cursor:"pointer",fontSize:13}} onClick={function(){setMode("otp-send");setError("");setSuccess("");}}>← Resend code</span>
            <span style={{color:"var(--t3)",cursor:"pointer",fontSize:13}} onClick={function(){setMode("choose");setError("");setSuccess("");}}>Other sign-in options</span>
          </div>
        </form>}

        {/* ── Forgot Password ── */}
        {mode==="forgot" && <form onSubmit={handleForgot}>
          <div className="p-group"><label className="p-label">Email Address</label><input className="p-input" type="email" value={email} onChange={function(e){setEmail(e.target.value);}} required /></div>
          <button className="p-btn p-btn-primary" style={{width:"100%",padding:"12px",marginTop:4,background:brandColor}} type="submit" disabled={busy}>{busy?"Sending...":"Send Reset Link"}</button>
          <div style={{textAlign:"center",marginTop:14}}><span style={{color:brandColor,cursor:"pointer",fontSize:13}} onClick={function(){setMode("choose");setError("");setSuccess("");}}>← Back</span></div>
        </form>}

        {/* ── Reset Password ── */}
        {mode==="reset" && <form onSubmit={handleReset}>
          {resetEmail&&<div style={{background:"var(--bg3)",borderRadius:"var(--r)",padding:"10px 14px",marginBottom:14,fontSize:13,color:"var(--t2)"}}>Resetting for <strong style={{color:"var(--t1)"}}>{resetEmail}</strong></div>}
          <div className="p-group"><label className="p-label">New Password</label><input className="p-input" type="password" value={newPassword} onChange={function(e){setNewPassword(e.target.value);}} required minLength={6} placeholder="At least 6 characters" /></div>
          <div className="p-group"><label className="p-label">Confirm Password</label><input className="p-input" type="password" value={confirmPassword} onChange={function(e){setConfirmPassword(e.target.value);}} required minLength={6} /></div>
          <button className="p-btn p-btn-primary" style={{width:"100%",padding:"12px",marginTop:4,background:brandColor}} type="submit" disabled={busy}>{busy?"Resetting...":"Reset Password"}</button>
          <div style={{textAlign:"center",marginTop:14}}><span style={{color:brandColor,cursor:"pointer",fontSize:13}} onClick={function(){setMode("choose");setError("");setSuccess("");window.history.replaceState({},"",window.location.pathname);}}>← Back</span></div>
        </form>}

        <div style={{textAlign:"center",marginTop:20,fontSize:12,color:"var(--t3)"}}>Powered by DriveSync</div>
      </div>
    </div>
  );
}

/* ═══════════════ PORTAL DASHBOARD ═══════════════ */
function PortalApp(props) {
  var [view, setView] = useState("projects");
  var [projects, setProjects] = useState([]);
  var [permission, setPermission] = useState((props.access && props.access.permission) || "view");
  var [activeProject, setActiveProject] = useState(null);
  var [files, setFiles] = useState([]);
  var [fileLoading, setFileLoading] = useState(false);
  var [parentId, setParentId] = useState(null);
  var [breadcrumb, setBreadcrumb] = useState([]);
  var [viewingFile, setViewingFile] = useState(null);
  var [previewFile, setPreviewFile] = useState(null);
  var [versionFile, setVersionFile] = useState(null);
  var [shareFile, setShareFile] = useState(null);
  var portalFileInput = useRef(null);
  var notify = useNotify();

  var user = props.user;
  var portalInfo = props.portal;
  var access = props.access;
  var brandColor = (portalInfo && portalInfo.brand_color) || "#4F8EF7";

  function loadProjects() {
    pFetch("/projects").then(function(d){setProjects(d.projects||[]);setPermission(d.permission||"view");}).catch(function(e){notify(e.message,"error");});
  }
  useEffect(loadProjects,[]);

  function openProject(p) {
    setActiveProject(p); setParentId(null);
    setBreadcrumb([{id:null,name:p.name}]);
    loadProjectFiles(p.id, null);
  }

  function loadProjectFiles(projId, pid) {
    setFileLoading(true);
    var url = "/projects/"+projId+"/files";
    if (pid) url += "?parent_id="+pid;
    pFetch(url).then(function(d){setFiles(d.files||[]);if(d.permission)setPermission(d.permission);}).catch(function(e){notify(e.message,"error");}).finally(function(){setFileLoading(false);});
  }

  function openFolder(f) {
    if (f.is_folder) {
      setParentId(f.id);
      setBreadcrumb(function(b){return b.concat({id:f.id,name:f.name});});
      loadProjectFiles(activeProject.id, f.id);
    } else if (f.mime_type === "text/html" || (f.name && f.name.endsWith(".html"))) {
      pFetch("/files/"+f.id).then(function(d){setViewingFile(d);}).catch(function(e){notify(e.message,"error");});
    } else if (canPortalPreview(f.mime_type, f.name)) {
      setPreviewFile(f);
    }
  }

  function navTo(idx) {
    var bc = breadcrumb.slice(0,idx+1);
    setBreadcrumb(bc);
    var pid = bc[bc.length-1].id;
    setParentId(pid);
    loadProjectFiles(activeProject.id, pid);
  }

  function handlePortalUpload(e) {
    var fl = e.target.files; if (!fl || !fl.length) return;
    var fd = new FormData();
    for (var i = 0; i < fl.length; i++) fd.append("files", fl[i]);
    if (parentId) fd.append("parent_id", parentId);
    pFetch("/projects/" + activeProject.id + "/files/upload", {method: "POST", body: fd})
      .then(function() { notify("Uploaded!", "ok"); loadProjectFiles(activeProject.id, parentId); })
      .catch(function(err) { notify(err.message, "error"); });
    e.target.value = "";
  }

  function createPortalFolder() {
    var name = prompt("Enter folder name:");
    if (!name || !name.trim()) return;
    pFetch("/projects/" + activeProject.id + "/files/folder", {method: "POST", body: {name: name.trim(), parent_id: parentId}})
      .then(function() { notify("Folder created!", "ok"); loadProjectFiles(activeProject.id, parentId); })
      .catch(function(err) { notify(err.message, "error"); });
  }

  function downloadFile(f) {
    if (permission === "view") { notify("Download not permitted — view only access","error"); return; }
    var token = getPToken();
    window.open(PAPI+"/"+getPortalSlug()+"/files/"+f.id+"/download?token="+token, "_blank");
  }

  function logout() { sessionStorage.clear(); window.location.reload(); }

  /* File viewer */
  if (viewingFile) {
    var canEdit = permission === "edit";
    return React.createElement(PortalFileViewer, {
      file: viewingFile,
      canEdit: canEdit,
      onBack: function(){setViewingFile(null);},
      onSave: function(content){
        pFetch("/files/"+viewingFile.id,{method:"PATCH",body:{metadata:{content:content}}}).then(function(){notify("Saved!","ok");}).catch(function(e){notify(e.message,"error");});
      },
      brandColor: brandColor,
    });
  }

  return (
    <div style={{display:"flex",height:"100vh"}}>
      {/* Sidebar */}
      <div className="portal-sidebar">
        <div style={{padding:"20px 20px 16px",borderBottom:"1px solid var(--border2)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:32,height:32,background:brandColor,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,color:"white"}}>{portalInfo.name.substring(0,2).toUpperCase()}</div>
            <div><div style={{fontSize:14,fontWeight:700}}>{portalInfo.name}</div><div style={{fontSize:10,color:"var(--t3)",textTransform:"uppercase",letterSpacing:1}}>Customer Portal</div></div>
          </div>
        </div>
        <div style={{padding:"12px"}}>
          <div className={"p-nav "+(view==="projects"&&!activeProject?"active":"")} onClick={function(){setView("projects");setActiveProject(null);setViewingFile(null);}}><PIconProject /><span>Projects</span></div>
        </div>
        {activeProject && <div style={{padding:"0 12px"}}>
          <div style={{fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:1,color:"var(--t3)",padding:"12px 8px 6px"}}>Current Project</div>
          <div className="p-nav active"><PIconFolder /><span>{activeProject.name}</span></div>
        </div>}
        <div style={{marginTop:"auto",padding:"12px 16px",borderTop:"1px solid var(--border2)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:"hsl("+(user.email||"").charCodeAt(0)*7+",55%,50%)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:600,color:"white"}}>{(user.name||"").substring(0,2).toUpperCase()}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.name}</div>
              <div style={{fontSize:11,color:"var(--t3)"}}>
                <span className={"perm-"+permission}>{permission}</span>
                {access.company && <span> · {access.company}</span>}
              </div>
            </div>
            <button className="p-btn p-btn-ghost" onClick={logout} title="Sign out" style={{padding:4}}><PIconLogout /></button>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="portal-main">
        <div className="portal-header">
          <div style={{fontSize:14,fontWeight:600}}>
            {activeProject ? activeProject.name : "Your Projects"}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span className={"p-badge "+(permission==="edit"?"p-badge-yellow":permission==="download"?"p-badge-blue":"p-badge-green")}>{permission} access</span>
          </div>
        </div>
        <div className="portal-body">

          {/* Projects List */}
          {!activeProject && <div>
            <h2 style={{fontSize:20,fontWeight:700,marginBottom:6}}>Welcome, {user.name}</h2>
            <p style={{color:"var(--t2)",fontSize:13,marginBottom:24}}>Select a project to view and {permission==="view"?"review":permission==="download"?"download":"edit"} files.</p>
            {projects.length===0?<div className="p-empty"><h3>No projects available</h3><p style={{fontSize:13,color:"var(--t3)"}}>Contact your administrator for access</p></div>:
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16}}>
              {projects.map(function(p){return(
                <div className="p-card" key={p.id} onClick={function(){openProject(p);}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                    <h3 style={{fontSize:15,fontWeight:600}}>{p.name}</h3>
                    <span className={"p-badge "+(p.status==="active"?"p-badge-green":"p-badge-blue")}>{p.status}</span>
                  </div>
                  {p.description&&<p style={{fontSize:12,color:"var(--t3)",marginBottom:10}}>{p.description}</p>}
                  <div style={{display:"flex",gap:16,fontSize:12,color:"var(--t2)"}}>
                    <span><strong style={{color:"var(--t1)"}}>{p.file_count}</strong> files</span>
                    <span><strong style={{color:"var(--t1)"}}>{fmtSize(parseInt(p.storage_used))}</strong></span>
                    <span>{p.space_name}</span>
                  </div>
                </div>
              );})}
            </div>}
          </div>}

          {/* Project Files */}
          {activeProject && <div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <button className="p-btn p-btn-ghost p-btn-sm" onClick={function(){setActiveProject(null);}}><PIconBack /> All Projects</button>
                <span style={{color:"var(--t3)"}}>|</span>
                {breadcrumb.map(function(b,i){return(
                  <span key={i} style={{display:"flex",alignItems:"center",gap:6}}>
                    {i>0&&<PIconChev />}
                    <span onClick={function(){navTo(i);}} style={{cursor:"pointer",fontSize:13,fontWeight:i===breadcrumb.length-1?600:400,color:i===breadcrumb.length-1?"var(--t1)":"var(--t2)"}}>{b.name}</span>
                  </span>
                );})}
              </div>
              {permission==="edit"&&activeProject&&<div style={{display:"flex",gap:8}}>
                <button className="p-btn p-btn-secondary p-btn-sm" onClick={createPortalFolder}><PIconFolder /> New Folder</button>
                <button className="p-btn p-btn-primary p-btn-sm" onClick={function(){portalFileInput.current&&portalFileInput.current.click();}}>↑ Upload</button>
                <input ref={portalFileInput} type="file" multiple style={{display:"none"}} onChange={handlePortalUpload} />
              </div>}
            </div>

            {fileLoading?<div style={{textAlign:"center",padding:40,color:"var(--t3)"}}>Loading files...</div>:
              files.length===0?<div className="p-empty"><h3>No files here</h3><p style={{fontSize:13,color:"var(--t3)"}}>This folder is empty</p></div>:
              <div style={{background:"var(--bg2)",border:"1px solid var(--border2)",borderRadius:"var(--r2)",overflow:"hidden"}}>
                <table className="p-table">
                  <thead><tr><th>Name</th><th>Modified</th><th>Size</th><th>Owner</th><th style={{width:120}}>Actions</th></tr></thead>
                  <tbody>{files.map(function(f){return(
                    <tr key={f.id}>
                      <td><div className="file-row" style={{cursor:f.is_folder||canPortalPreview(f.mime_type,f.name)?"pointer":"default"}} onClick={function(){openFolder(f);}}>
                        <PFileIcon type={fileType(f.mime_type,f.is_folder)} />
                        <span>{f.name}</span>
                        {f.locked_by&&<span style={{display:"inline-flex",alignItems:"center",gap:3,padding:"1px 6px",borderRadius:8,fontSize:9,fontWeight:600,background:"rgba(251,191,36,0.1)",color:"#FBBF24",marginLeft:6}}><PIconLock /> {f.locked_by_name||"Locked"}</span>}
                        {!f.is_folder&&f.version>1&&<span style={{fontSize:9,padding:"1px 5px",borderRadius:6,background:"rgba(79,142,247,0.1)",color:"var(--accent)",fontWeight:600,marginLeft:4}}>v{f.version}</span>}
                      </div></td>
                      <td style={{color:"var(--t2)"}}>{fmtTime(f.updated_at)}</td>
                      <td style={{color:"var(--t3)"}}>{f.is_folder?"—":fmtSize(f.size)}</td>
                      <td style={{color:"var(--t2)",fontSize:12}}>{f.owner_name||"—"}</td>
                      <td><div style={{display:"flex",gap:4}}>
                        {!f.is_folder && canPortalPreview(f.mime_type,f.name) && <button className="p-btn p-btn-ghost p-btn-sm" onClick={function(){if(f.mime_type==="text/html"||f.name.endsWith(".html")){openFolder(f);}else{setPreviewFile(f);}}} title="Preview"><PIconEye /></button>}
                        {!f.is_folder && permission!=="view" && <button className="p-btn p-btn-ghost p-btn-sm" onClick={function(){downloadFile(f);}} title="Download"><PIconDownload /></button>}
                        {!f.is_folder && <button className="p-btn p-btn-ghost p-btn-sm" onClick={function(){setVersionFile(f);}} title="Versions"><PIconHistory /></button>}
                      </div></td>
                    </tr>
                  );})}</tbody>
                </table>
              </div>
            }
          </div>}
        </div>
      {shareFile && React.createElement(PortalShareModal, {file:shareFile, onClose:function(){setShareFile(null);}})}
      {versionFile && React.createElement(VersionPanel, {file:versionFile, onClose:function(){setVersionFile(null);}, permission:permission, onRefresh:function(){loadProjectFiles(activeProject.id, parentId);}})}
      {previewFile && React.createElement(PortalPreviewModal, {file:previewFile, onClose:function(){setPreviewFile(null);}, permission:permission})}
      </div>
    </div>
  );
}

/* ═══════════════ FILE VIEWER/EDITOR ═══════════════ */
function PortalFileViewer(props) {
  var file = props.file;
  var canEdit = props.canEdit;
  var editorRef = useRef(null);
  var [saving, setSaving] = useState(false);

  useEffect(function(){
    if (editorRef.current && file.metadata && file.metadata.content) {
      editorRef.current.innerHTML = file.metadata.content;
    } else if (editorRef.current) {
      editorRef.current.innerHTML = "<p style='color:var(--t3)'>No content available</p>";
    }
  },[]);

  function save() {
    if (!canEdit) return;
    setSaving(true);
    props.onSave(editorRef.current.innerHTML);
    setTimeout(function(){setSaving(false);},1000);
  }

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:"var(--bg)"}}>
      <div style={{padding:"12px 24px",borderBottom:"1px solid var(--border2)",display:"flex",alignItems:"center",justifyContent:"space-between",background:"var(--bg2)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <button className="p-btn p-btn-ghost p-btn-sm" onClick={props.onBack}><PIconBack /> Back</button>
          <h3 style={{fontSize:15,fontWeight:600}}>{file.name}</h3>
          <span className={"p-badge "+(canEdit?"p-badge-yellow":"p-badge-green")}>{canEdit?"Editing":"View only"}</span>
        </div>
        {canEdit && <button className="p-btn p-btn-primary p-btn-sm" onClick={save} disabled={saving} style={{background:props.brandColor}}>{saving?"Saving...":"Save Changes"}</button>}
      </div>
      {canEdit && <div style={{padding:"8px 24px",borderBottom:"1px solid var(--border2)",display:"flex",gap:4,background:"var(--bg2)"}}>
        <button className="p-btn p-btn-ghost p-btn-sm" onClick={function(){document.execCommand("bold");}}>B</button>
        <button className="p-btn p-btn-ghost p-btn-sm" onClick={function(){document.execCommand("italic");}} style={{fontStyle:"italic"}}>I</button>
        <button className="p-btn p-btn-ghost p-btn-sm" onClick={function(){document.execCommand("underline");}} style={{textDecoration:"underline"}}>U</button>
        <span style={{width:1,background:"var(--border)",margin:"0 4px"}} />
        <button className="p-btn p-btn-ghost p-btn-sm" onClick={function(){document.execCommand("formatBlock",false,"h2");}}>H2</button>
        <button className="p-btn p-btn-ghost p-btn-sm" onClick={function(){document.execCommand("formatBlock",false,"p");}}>P</button>
        <button className="p-btn p-btn-ghost p-btn-sm" onClick={function(){document.execCommand("insertUnorderedList");}}>• List</button>
      </div>}
      <div ref={editorRef} contentEditable={canEdit} suppressContentEditableWarning={true}
        onKeyDown={function(e){if(canEdit&&(e.ctrlKey||e.metaKey)&&e.key==="s"){e.preventDefault();save();}}}
        style={{flex:1,overflow:"auto",padding:"32px 40px",fontSize:15,lineHeight:1.8,outline:"none",color:"var(--t1)",background:"var(--bg)"}}
      />
      <style>{`
        [contenteditable] h1{font-size:26px;font-weight:700;margin:14px 0 8px;color:var(--t1)}
        [contenteditable] h2{font-size:20px;font-weight:600;margin:12px 0 6px;color:var(--t1)}
        [contenteditable] p{margin:0 0 8px;color:var(--t2)}
        [contenteditable] ul,[contenteditable] ol{margin:0 0 12px;padding-left:24px;color:var(--t2)}
        [contenteditable] blockquote{border-left:3px solid var(--accent);padding:8px 16px;margin:12px 0;background:var(--accentA);border-radius:0 6px 6px 0;color:var(--t2)}
        [contenteditable] pre{background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:14px;font-family:var(--mono);font-size:13px;color:var(--t2)}
        [contenteditable] a{color:var(--accent)}
      `}</style>
    </div>
  );
}


/* ═══════════════ FILE PREVIEW ═══════════════ */
function canPortalPreview(mime, name) {
  if (!mime && !name) return false;
  var m = (mime || "").toLowerCase();
  var n = (name || "").toLowerCase();
  if (m.startsWith("image/")) return "image";
  if (m === "application/pdf") return "pdf";
  if (m.startsWith("video/")) return "video";
  if (m.startsWith("audio/")) return "audio";
  if (m.startsWith("text/") || m === "application/json") return "text";
  if (m === "text/html" || n.endsWith(".html")) return "html";
  var textExts = [".txt",".md",".csv",".json",".xml",".js",".py",".css",".sql",".sh",".log"];
  for (var i = 0; i < textExts.length; i++) { if (n.endsWith(textExts[i])) return "text"; }
  return false;
}



function PortalShareModal(props) {
  var file = props.file;
  var onClose = props.onClose;
  var [form, setForm] = useState({recipient_email:"",permission:"download",expires_days:"30",password:""});
  var [creating, setCreating] = useState(false);
  var [created, setCreated] = useState(null);
  var notify = useNotify();

  function create() {
    setCreating(true);
    var body = {file_id:file.id, permission:form.permission, expires_days:form.expires_days?parseInt(form.expires_days):null};
    if (form.recipient_email) body.recipient_email = form.recipient_email;
    if (form.password) body.password = form.password;
    // Use main API with portal token
    var token = getPToken();
    fetch("/api/shares", {method:"POST", headers:{"Authorization":"Bearer "+token,"Content-Type":"application/json"}, body:JSON.stringify(body)})
      .then(function(r){return r.json().then(function(d){return {ok:r.ok,data:d};});})
      .then(function(r){
        if(!r.ok) throw new Error(r.data.error);
        setCreated(r.data);
        notify("Share link created!","ok");
      })
      .catch(function(e){notify(e.message,"error");})
      .finally(function(){setCreating(false);});
  }

  function copyLink() {
    if (!created) return;
    var url = window.location.origin + "/share/" + created.token;
    navigator.clipboard.writeText(url).then(function(){notify("Link copied!","ok");}).catch(function(){notify("Copy the link manually","error");});
  }

  var shareUrl = created ? window.location.origin + "/share/" + created.token : "";

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:250,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"var(--bg2)",border:"1px solid var(--border2)",borderRadius:16,padding:28,width:460,maxWidth:"100%",maxHeight:"90vh",overflow:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <h3 style={{fontSize:16,fontWeight:700}}>Share File</h3>
          <button className="p-btn p-btn-ghost p-btn-sm" onClick={onClose}>✕</button>
        </div>

        {/* File info */}
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"var(--bg3)",borderRadius:8,marginBottom:16}}>
          <PFileIcon type={fileType(file.mime_type,file.is_folder)} />
          <div>
            <div style={{fontSize:13,fontWeight:600}}>{file.name}</div>
            <div style={{fontSize:11,color:"var(--t3)"}}>{fmtSize(file.size)}</div>
          </div>
        </div>

        {created ? (
          <div>
            <div style={{background:"rgba(63,185,80,0.08)",border:"1px solid rgba(63,185,80,0.2)",borderRadius:8,padding:"14px 18px",marginBottom:16}}>
              <div style={{fontSize:14,fontWeight:600,color:"var(--green)",marginBottom:8}}>Link Created!</div>
              <div style={{display:"flex",gap:8}}>
                <input className="p-input" readOnly={true} value={shareUrl} style={{fontFamily:"var(--mono)",fontSize:11}} />
                <button className="p-btn p-btn-primary p-btn-sm" onClick={copyLink}>Copy</button>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,fontSize:12,color:"var(--t2)"}}>
              <div>Permission: <strong style={{color:"var(--t1)"}}>{created.permission}</strong></div>
              <div>Expires: <strong style={{color:"var(--t1)"}}>{created.expires_at?new Date(created.expires_at).toLocaleDateString():"Never"}</strong></div>
            </div>
            <button className="p-btn p-btn-secondary" style={{width:"100%",marginTop:16}} onClick={onClose}>Done</button>
          </div>
        ) : (
          <div>
            <div className="p-group">
              <label className="p-label">Recipient Email (optional)</label>
              <input className="p-input" value={form.recipient_email} onChange={function(e){setForm({...form,recipient_email:e.target.value});}} placeholder="Leave blank for public link" />
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div className="p-group">
                <label className="p-label">Permission</label>
                <select className="p-input" value={form.permission} onChange={function(e){setForm({...form,permission:e.target.value});}}>
                  <option value="view">View only</option>
                  <option value="download">Download</option>
                </select>
              </div>
              <div className="p-group">
                <label className="p-label">Expires</label>
                <select className="p-input" value={form.expires_days} onChange={function(e){setForm({...form,expires_days:e.target.value});}}>
                  <option value="7">7 days</option>
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                  <option value="">Never</option>
                </select>
              </div>
            </div>
            <div className="p-group">
              <label className="p-label">Password (optional)</label>
              <input className="p-input" type="password" value={form.password} onChange={function(e){setForm({...form,password:e.target.value});}} placeholder="No password" />
            </div>
            <button className="p-btn p-btn-primary" style={{width:"100%",marginTop:8}} onClick={create} disabled={creating}>{creating?"Creating...":"Create Share Link"}</button>
          </div>
        )}
      </div>
    </div>
  );
}

function VersionPanel(props) {
  var file = props.file;
  var onClose = props.onClose;
  var permission = props.permission;
  var onRefresh = props.onRefresh;
  var [versions, setVersions] = useState([]);
  var [current, setCurrent] = useState(null);
  var [loading, setLoading] = useState(true);
  var versionInput = useRef(null);
  var notify = useNotify();
  var slug = getPortalSlug();

  function loadVersions() {
    setLoading(true);
    pFetch("/files/" + file.id + "/versions")
      .then(function(d) { setVersions(d.versions || []); setCurrent(d.current || null); })
      .catch(function(e) { notify(e.message, "error"); })
      .finally(function() { setLoading(false); });
  }
  useEffect(loadVersions, [file.id]);

  function checkout() {
    pFetch("/files/" + file.id + "/checkout", { method: "POST", body: {} })
      .then(function() { notify("File checked out — you now have exclusive edit access", "ok"); loadVersions(); if(onRefresh) onRefresh(); })
      .catch(function(e) { notify(e.message, "error"); });
  }

  function checkin() {
    pFetch("/files/" + file.id + "/checkin", { method: "POST" })
      .then(function() { notify("File checked in", "ok"); loadVersions(); if(onRefresh) onRefresh(); })
      .catch(function(e) { notify(e.message, "error"); });
  }

  function uploadNewVersion(e) {
    var fl = e.target.files; if (!fl || !fl.length) return;
    var fd = new FormData();
    fd.append("file", fl[0]);
    pFetch("/files/" + file.id + "/new-version", { method: "POST", body: fd })
      .then(function() { notify("New version uploaded and checked in!", "ok"); loadVersions(); if(onRefresh) onRefresh(); })
      .catch(function(e) { notify(e.message, "error"); });
    e.target.value = "";
  }

  function downloadVersion(vId) {
    var token = getPToken();
    window.open(PAPI + "/" + slug + "/files/" + file.id + "/versions/" + vId + "/download?token=" + token, "_blank");
  }

  var isLockedByMe = current && current.locked_by === (JSON.parse(sessionStorage.getItem("portal_user") || "{}")).id;
  var isLockedByOther = current && current.locked_by && !isLockedByMe;

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:200,display:"flex",justifyContent:"flex-end"}}>
      <div style={{width:480,maxWidth:"100%",background:"var(--bg2)",borderLeft:"1px solid var(--border2)",display:"flex",flexDirection:"column",height:"100%"}}>
        <div style={{padding:"16px 20px",borderBottom:"1px solid var(--border2)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:15,fontWeight:700}}>Version History</div>
            <div style={{fontSize:12,color:"var(--t3)"}}>{file.name}</div>
          </div>
          <button className="p-btn p-btn-ghost p-btn-sm" onClick={onClose}><PIconBack /> Close</button>
        </div>

        {/* Lock Status */}
        <div style={{padding:"14px 20px",borderBottom:"1px solid var(--border2)",background:current&&current.locked_by?"rgba(251,191,36,0.05)":"transparent"}}>
          {current && current.locked_by ? (
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <PIconLock />
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:"var(--yellow)"}}>Checked Out</div>
                  <div style={{fontSize:11,color:"var(--t3)"}}>{current.locked_by_name} · {current.locked_at ? fmtTime(current.locked_at) : ""}</div>
                  {current.lock_note && <div style={{fontSize:11,color:"var(--t3)",fontStyle:"italic"}}>{current.lock_note}</div>}
                </div>
              </div>
              {isLockedByMe && <div style={{display:"flex",gap:6}}>
                <button className="p-btn p-btn-secondary p-btn-sm" onClick={function(){versionInput.current&&versionInput.current.click();}}><PIconUpload /> Upload New Version</button>
                <button className="p-btn p-btn-primary p-btn-sm" onClick={checkin}><PIconUnlock /> Check In</button>
                <input ref={versionInput} type="file" style={{display:"none"}} onChange={uploadNewVersion} />
              </div>}
            </div>
          ) : (
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <PIconUnlock />
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:"var(--green)"}}>Available</div>
                  <div style={{fontSize:11,color:"var(--t3)"}}>Not checked out by anyone</div>
                </div>
              </div>
              {permission === "edit" && <button className="p-btn p-btn-primary p-btn-sm" onClick={checkout}><PIconLock /> Check Out</button>}
            </div>
          )}
        </div>

        {/* Current Version */}
        <div style={{padding:"14px 20px",borderBottom:"1px solid var(--border2)"}}>
          <div style={{fontSize:11,fontWeight:700,color:"var(--t3)",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Current Version</div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <span style={{fontSize:20,fontWeight:700,color:"var(--accent)"}}>v{current ? current.version : "?"}</span>
              <span style={{fontSize:12,color:"var(--t3)",marginLeft:8}}>{current ? fmtSize(parseInt(current.size)) : ""} · {current ? fmtTime(current.updated_at) : ""}</span>
            </div>
          </div>
        </div>

        {/* Version List */}
        <div style={{flex:1,overflow:"auto",padding:"14px 20px"}}>
          <div style={{fontSize:11,fontWeight:700,color:"var(--t3)",textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>Previous Versions ({versions.length})</div>
          {loading ? <div style={{textAlign:"center",padding:20,color:"var(--t3)"}}>Loading...</div> :
            versions.length === 0 ? <div style={{textAlign:"center",padding:30,color:"var(--t3)",fontSize:13}}>No previous versions</div> :
            versions.map(function(v) { return (
              <div key={v.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:"var(--bg3)",borderRadius:8,marginBottom:8,border:"1px solid var(--border2)"}}>
                <div>
                  <div style={{fontSize:13,fontWeight:600}}>Version {v.version}</div>
                  <div style={{fontSize:11,color:"var(--t3)"}}>{fmtSize(v.size)} · {fmtTime(v.created_at)} · {v.uploaded_by_name || "Unknown"}</div>
                </div>
                {permission !== "view" && <button className="p-btn p-btn-ghost p-btn-sm" onClick={function(){downloadVersion(v.id);}}><PIconDownload /> Download</button>}
              </div>
            );})
          }
        </div>
      </div>
    </div>
  );
}


function PortalPDFViewer(props) {
  var containerRef = useRef(null);
  var [numPages, setNumPages] = useState(0);
  var [currentPage, setCurrentPage] = useState(1);
  var [scale, setScale] = useState(1.2);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState(null);
  var pdfDoc = useRef(null);

  useEffect(function() {
    // Load PDF.js from CDN
    var script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = function() {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      loadPDF();
    };
    script.onerror = function() { setError("Failed to load PDF viewer"); setLoading(false); };
    document.head.appendChild(script);

    return function() {
      if (pdfDoc.current) { pdfDoc.current.destroy(); pdfDoc.current = null; }
    };
  }, []);

  function loadPDF() {
    setLoading(true);
    window.pdfjsLib.getDocument(props.url).promise.then(function(pdf) {
      pdfDoc.current = pdf;
      setNumPages(pdf.numPages);
      setLoading(false);
      renderPage(1, pdf);
    }).catch(function(e) {
      setError("Failed to load PDF: " + e.message);
      setLoading(false);
    });
  }

  function renderPage(num, pdf) {
    var doc = pdf || pdfDoc.current;
    if (!doc || !containerRef.current) return;
    doc.getPage(num).then(function(page) {
      // Clear previous pages if re-rendering single page
      containerRef.current.innerHTML = "";
      var viewport = page.getViewport({ scale: scale });
      var canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.display = "block";
      canvas.style.margin = "0 auto 16px";
      canvas.style.borderRadius = "4px";
      canvas.style.boxShadow = "0 2px 12px rgba(0,0,0,0.4)";
      containerRef.current.appendChild(canvas);
      var ctx = canvas.getContext("2d");
      page.render({ canvasContext: ctx, viewport: viewport }).promise.then(function() {
        setCurrentPage(num);
      });
    });
  }

  function renderAllPages() {
    if (!pdfDoc.current || !containerRef.current) return;
    containerRef.current.innerHTML = "";
    var doc = pdfDoc.current;
    for (var i = 1; i <= doc.numPages; i++) {
      (function(pageNum) {
        doc.getPage(pageNum).then(function(page) {
          var viewport = page.getViewport({ scale: scale });
          var canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.display = "block";
          canvas.style.margin = "0 auto 16px";
          canvas.style.borderRadius = "4px";
          canvas.style.boxShadow = "0 2px 12px rgba(0,0,0,0.3)";
          containerRef.current.appendChild(canvas);
          page.render({ canvasContext: canvas.getContext("2d"), viewport: viewport });
        });
      })(i);
    }
  }

  useEffect(function() {
    if (pdfDoc.current && !loading) renderAllPages();
  }, [scale, loading]);

  function zoomIn() { setScale(function(s) { return Math.min(s + 0.2, 3); }); }
  function zoomOut() { setScale(function(s) { return Math.max(s - 0.2, 0.4); }); }

  if (error) return (
    React.createElement("div", {style:{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:16}},
      React.createElement("div", {style:{fontSize:48}}, "📄"),
      React.createElement("div", {style:{fontSize:16,fontWeight:600,color:"var(--t1)"}}, "Cannot display PDF"),
      React.createElement("div", {style:{fontSize:13,color:"var(--t3)"}}, error),
      React.createElement("a", {href:props.url,target:"_blank",rel:"noopener",className:"p-btn p-btn-primary",style:{textDecoration:"none"}}, "Open in new tab")
    )
  );

  return React.createElement("div", {style:{display:"flex",flexDirection:"column",width:"100%",height:"100%"}},
    React.createElement("div", {style:{display:"flex",alignItems:"center",justifyContent:"center",gap:12,padding:"8px 16px",background:"var(--bg2)",borderRadius:"8px 8px 0 0",borderBottom:"1px solid var(--border2)",flexShrink:0}},
      React.createElement("button", {className:"p-btn p-btn-ghost p-btn-sm",onClick:zoomOut}, "−"),
      React.createElement("span", {style:{fontSize:12,color:"var(--t2)",minWidth:50,textAlign:"center"}}, Math.round(scale*100)+"%"),
      React.createElement("button", {className:"p-btn p-btn-ghost p-btn-sm",onClick:zoomIn}, "+"),
      React.createElement("span", {style:{width:1,height:16,background:"var(--border2)",margin:"0 4px"}}),
      React.createElement("span", {style:{fontSize:12,color:"var(--t3)"}}, numPages+" pages"),
      React.createElement("span", {style:{width:1,height:16,background:"var(--border2)",margin:"0 4px"}}),
      React.createElement("a", {href:props.url,target:"_blank",rel:"noopener",style:{fontSize:12,color:"var(--accent)",textDecoration:"none"}}, "Open in tab ↗")
    ),
    loading ?
      React.createElement("div", {style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:"var(--t3)"}}, "Loading PDF...") :
      React.createElement("div", {ref:containerRef,style:{flex:1,overflow:"auto",padding:"20px",background:"#3a3a3a"}})
  );
}

function PortalPreviewModal(props) {
  var file = props.file;
  var onClose = props.onClose;
  var permission = props.permission;
  var previewType = canPortalPreview(file.mime_type, file.name);
  var slug = getPortalSlug();
  var token = getPToken();
  var previewUrl = PAPI + "/" + slug + "/files/" + file.id + "/preview?token=" + token;
  var [textContent, setTextContent] = useState(null);
  var notify = useNotify();

  useEffect(function() {
    if (previewType === "text") {
      fetch(previewUrl).then(function(r){return r.text();}).then(setTextContent).catch(function(){setTextContent("Error loading");});
    }
  }, [file.id]);

  function download() {
    if (permission === "view") { notify("Download not permitted","error"); return; }
    window.open(PAPI + "/" + slug + "/files/" + file.id + "/download?token=" + token, "_blank");
  }

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:200,display:"flex",flexDirection:"column",animation:"pSlideUp .15s ease"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 20px",background:"var(--bg2)",borderBottom:"1px solid var(--border2)",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <button className="p-btn p-btn-ghost p-btn-sm" onClick={onClose}><PIconBack /> Close</button>
          <span style={{fontSize:14,fontWeight:600}}>{file.name}</span>
          <span style={{fontSize:11,color:"var(--t3)"}}>{fmtSize(file.size)}</span>
        </div>
        {permission !== "view" && <button className="p-btn p-btn-secondary p-btn-sm" onClick={download}><PIconDownload /> Download</button>}
      </div>
      <div style={{flex:1,overflow:"auto",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
        {previewType === "image" && <img src={previewUrl} alt={file.name} style={{maxWidth:"100%",maxHeight:"100%",objectFit:"contain",borderRadius:8}} />}
        {previewType === "pdf" && React.createElement(PortalPDFViewer, {url: previewUrl})}
        {previewType === "video" && <video controls autoPlay style={{maxWidth:"100%",maxHeight:"100%",borderRadius:8}}><source src={previewUrl} type={file.mime_type} /></video>}
        {previewType === "audio" && <div style={{background:"var(--bg2)",borderRadius:16,padding:40,textAlign:"center"}}><div style={{fontSize:48,marginBottom:16}}>🎵</div><div style={{fontSize:16,fontWeight:600,marginBottom:20}}>{file.name}</div><audio controls autoPlay style={{width:"100%"}}><source src={previewUrl} type={file.mime_type} /></audio></div>}
        {previewType === "text" && <pre style={{width:"100%",maxWidth:900,height:"100%",overflow:"auto",padding:20,background:"var(--bg2)",borderRadius:8,fontSize:13,lineHeight:1.6,fontFamily:"var(--mono)",color:"var(--t2)",whiteSpace:"pre-wrap"}}>{textContent || "Loading..."}</pre>}
        {previewType === "html" && file.metadata && file.metadata.content && <div style={{width:"100%",maxWidth:900,height:"100%",overflow:"auto",padding:"32px 40px",background:"var(--bg)",borderRadius:8}} dangerouslySetInnerHTML={{__html:file.metadata.content}} />}
        {previewType === "html" && !(file.metadata && file.metadata.content) && <iframe src={previewUrl} style={{width:"100%",height:"100%",border:"none",borderRadius:8}} title={file.name} />}
        {!previewType && <div style={{textAlign:"center",color:"var(--t3)"}}><div style={{fontSize:64,marginBottom:16,opacity:0.3}}>📄</div><div style={{fontSize:16,fontWeight:600,color:"var(--t2)",marginBottom:8}}>Preview not available</div><div style={{fontSize:13,marginBottom:20}}>This file type cannot be previewed.</div>{permission !== "view" && <button className="p-btn p-btn-primary" onClick={download}><PIconDownload /> Download</button>}</div>}
      </div>
    </div>
  );
}

/* ═══════════════ ROOT ═══════════════ */
export default function Portal() {
  var [loggedIn, setLoggedIn] = useState(!!getPToken());
  var [user, setUser] = useState(function(){try{return JSON.parse(sessionStorage.getItem("portal_user"));}catch(e){return null;}});
  var [portal, setPortal] = useState(function(){try{return JSON.parse(sessionStorage.getItem("portal_info"));}catch(e){return null;}});
  var [access, setAccess] = useState(function(){try{return JSON.parse(sessionStorage.getItem("portal_access"));}catch(e){return null;}});

  function onLogin(data) {
    setUser(data.user); setPortal(data.portal); setAccess(data.access); setLoggedIn(true);
  }

  return (
    <React.Fragment>
      <style>{CSS}</style>
      <PNotifyProvider>
        {loggedIn && user && portal && access ?
          React.createElement(PortalApp, {user:user, portal:portal, access:access}) :
          React.createElement(PortalLogin, {onLogin:onLogin})
        }
      </PNotifyProvider>
    </React.Fragment>
  );
}
