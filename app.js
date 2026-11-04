
(function(){
"use strict";
/* ---------- helpers ---------- */
const $ = (s,el=document)=>el.querySelector(s);
const esc = s => String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const pad = n => String(n).padStart(2,"0");
const ymd = d => d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const parse = s => { const [y,m,d]=String(s).split("-").map(Number); return new Date(y,(m||1)-1,d||1); };
const todayStr = () => ymd(new Date());
const MES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
const MESL = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const DIA = ["dom","lun","mar","mié","jue","vie","sáb"];
const DIAL = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
const longDate = s => { const d=parse(s); return DIAL[d.getDay()]+" "+d.getDate()+" de "+MESL[d.getMonth()]+" de "+d.getFullYear(); };
const shortDate = s => { const d=parse(s); return d.getDate()+" "+MES[d.getMonth()]+" "+d.getFullYear(); };
const ago = t => { const m=Math.round((Date.now()-t)/60000); if(m<1)return "recién"; if(m<60)return "hace "+m+" min"; const h=Math.round(m/60); if(h<24)return "hace "+h+" h"; const d=Math.round(h/24); if(d<30)return "hace "+d+" d"; return new Date(t).toLocaleDateString("es-CL"); };
const daysUntil = s => Math.round((parse(s)-parse(todayStr()))/86400000);
const safeUrl = u => { try{ const x=new URL(String(u).trim()); return (x.protocol==="https:"||x.protocol==="http:")?x.href:""; }catch(e){ return ""; } };
const PIX="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
const blob = id => id&&String(id).startsWith("fsm:")?PIX+"#fsm-t-"+String(id).slice(4):(id||"");
const blobFull = id => id&&String(id).startsWith("fsm:")?PIX+"#fsm-f-"+String(id).slice(4):(id||"");
const COLORS = {cumple:"var(--cumple)",paseo:"var(--paseo)",oficial:"var(--oficial)",casual:"var(--casual)",reunion:"var(--oficial)",otro:"var(--otro)",cena:"var(--otro)",capacitacion:"var(--otro)"};
const EV_TYPES = [["oficial","Reunión oficial"],["casual","Reunión casual"],["paseo","Jeepeo / paseo"],["cena","Cena anual"],["capacitacion","Capacitación"]];
const kindOf = t => t==="paseo"?"paseo":(t==="oficial"||t==="reunion")?"oficial":t==="casual"?"casual":"otro";
const typeLabel = t => ({paseo:"Jeepeo / paseo",oficial:"Reunión oficial",reunion:"Reunión oficial",casual:"Reunión casual",cena:"Cena anual",capacitacion:"Capacitación"})[t]||"Evento";
const DIFF = ["Familiar","Intermedio","Exigente","Extremo"];
function ask(msg,okLabel){
  return new Promise(res=>{
    const w=document.createElement("div"); w.className="ask"; w.setAttribute("role","alertdialog"); w.setAttribute("aria-modal","true");
    w.innerHTML=`<div class="ask-b"><p></p><div class="actions" style="justify-content:flex-end"><button class="btn ghost" data-a="0">Cancelar</button><button class="btn" data-a="1"></button></div></div>`;
    w.querySelector("p").textContent=msg; w.querySelector('[data-a="1"]').textContent=okLabel||"Sí, eliminar";
    const done=v=>{ w.remove(); document.removeEventListener("keydown",k,true); res(v); };
    const k=e=>{ if(e.key==="Escape"){ e.stopPropagation(); done(false); } };
    w.addEventListener("click",e=>{ e.stopPropagation(); const b=e.target.closest("[data-a]"); if(b) done(b.dataset.a==="1"); else if(e.target===w) done(false); });
    document.addEventListener("keydown",k,true); document.body.appendChild(w); w.querySelector('[data-a="1"]').focus();
  });
}
function getSize(){ try{ return +(localStorage.getItem("cj-size")||0)||0; }catch(_){ return 0; } }
function applySize(n){ document.documentElement.dataset.size=String(n||0); try{ localStorage.setItem("cj-size",String(n||0)); }catch(_){} }
applySize(getSize());
function openSize(){
  const cur=getSize(); const opts=[["Normal",0,16],["Grande",1,18.5],["Muy grande",2,21]];
  openSheet("Tamaño de letra",()=>`<p class="muted" style="margin-top:0">Elige cómo quieres ver la app. Queda guardado en este teléfono.</p>${opts.map(([l,n,px])=>`<button class="sizeopt ${cur===n?"on":""}" data-size="${n}"><span style="font-size:${px+8}px;font-weight:700;width:56px;text-align:center">Aa</span><span><b style="font-size:${px}px">${l}</b><br><span class="muted" style="font-size:${px-2}px">Paseo a Los Hitos · Asistiré</span></span>${cur===n?'<span style="margin-left:auto;font-size:22px">✅</span>':""}</button>`).join("")}`);
}
function toastAction(msg,label,fn){ const t=document.createElement("div"); t.className="toast"; t.append(document.createTextNode(msg)); const b=document.createElement("button"); b.className="undo"; b.textContent=label; t.append(b);
  let done=false; b.addEventListener("click",()=>{ if(done) return; done=true; t.remove(); fn(); }); document.body.appendChild(t); setTimeout(()=>t.remove(),7000); }
function welcomeSeen(){ try{ return localStorage.getItem("cj-welcome1")==="1"; }catch(_){ return true; } }
function showWelcome(after){
  const steps=[["📅","Bienvenido a la app del club","Aquí ves los paseos, las reuniones y los cumpleaños del Club de Jeeperos."],["✅","Avisa si vas","Abre un paseo o la próxima reunión y toca <b>Asistiré</b>. Si te equivocas, toca <b>Deshacer</b>."],["📸","Mira y comparte fotos","Dentro de cada paseo puedes ver y subir fotos. ¿Letra chica? Toca <b>Aa</b> arriba para agrandarla."]];
  let i=0; const w=document.createElement("div"); w.className="welcome"; w.setAttribute("role","dialog"); w.setAttribute("aria-modal","true");
  const paint=()=>{ const [ic,ti,tx]=steps[i]; w.innerHTML=`<div class="card"><div class="big">${ic}</div><h2 style="font-size:28px;margin:0 0 8px">${ti}</h2><p style="font-size:18px;line-height:1.45;margin:0">${tx}</p><div class="dots">${steps.map((_,k)=>`<i class="${k===i?"on":""}"></i>`).join("")}</div><button class="btn" data-w="next" style="width:100%;justify-content:center;padding:15px;font-size:19px">${i<steps.length-1?"Siguiente":"¡Listo!"}</button>${i<steps.length-1?`<button class="link" data-w="skip" style="margin-top:12px">Saltar</button>`:""}</div>`; w.querySelector("[data-w=next]").focus(); };
  const end=()=>{ try{ localStorage.setItem("cj-welcome1","1"); }catch(_){} w.remove(); if(after) after(); };
  w.addEventListener("click",e=>{ const b=e.target.closest("[data-w]"); if(!b) return; if(b.dataset.w==="skip") end(); else if(i<steps.length-1){ i++; paint(); } else end(); });
  document.body.appendChild(w); paint();
}
function toast(msg){ const t=document.createElement("div"); t.className="toast"; t.textContent=msg; document.body.appendChild(t); setTimeout(()=>t.remove(),Math.max(2600,String(msg).length*65)); }

const I = {
  home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
  cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  jeep:'<svg class="jeepi" viewBox="0 0 100 49.1" fill="currentColor" fill-rule="evenodd"><path d="M80.4 36.9 78.4 38.2 77.8 40.4 78.9 42.6 81.2 43.3 82.8 42.7 83.5 42.0 84.1 40.7 84.1 39.4 83.7 38.4 82.7 37.4ZM23.7 36.9 22.5 37.4 21.6 38.2 21.1 39.5 21.1 40.5 22.2 42.6 23.2 43.1 24.5 43.3 26.1 42.7 26.8 42.0 27.4 40.7 27.4 39.5 27.0 38.4 26.0 37.4ZM70.6 34.2 71.0 35.1 70.7 36.1 69.6 36.5 69.1 38.8 70.0 39.4 70.0 40.3 69.1 41.0 69.6 43.4 70.4 43.6 70.9 44.7 70.4 45.6 71.7 47.6 72.6 47.3 73.4 48.2 73.3 48.6 88.3 48.6 88.9 47.8 89.9 47.9 91.3 46.0 90.9 45.0 91.2 44.2 92.4 43.7 92.8 41.3 92.1 40.8 92.1 39.7 92.8 39.2 92.8 38.1 92.4 36.7 91.6 36.7 91.1 35.5 91.6 34.6 90.2 32.6 89.3 32.8 88.6 32.0 88.7 31.0 86.9 29.7 85.7 30.2 84.8 29.6 84.6 28.7 82.1 28.3 81.7 29.0 80.7 29.0 80.2 28.3 77.8 28.6 77.5 29.4 76.3 30.0 75.6 29.4 73.4 30.9 73.7 31.6 73.0 32.5 72.0 32.3ZM79.9 34.2 82.7 34.3 84.4 35.2 86.3 37.4 86.9 39.0 86.9 41.1 86.0 43.3 84.1 45.2 81.7 46.0 79.5 45.9 77.6 45.0 76.0 43.4 75.0 40.7 75.2 38.7 76.3 36.4 77.8 35.1ZM15.0 32.5 13.9 34.2 14.3 35.1 13.9 36.2 12.8 36.5 12.4 38.8 13.3 39.5 13.3 40.3 12.4 41.0 12.7 43.1 14.0 44.0 14.1 44.7 13.6 45.5 15.0 47.6 15.9 47.3 16.7 48.2 16.6 48.6 31.6 48.6 32.2 47.8 33.2 47.9 34.6 46.0 34.2 44.7 34.8 43.9 35.6 43.7 36.1 41.3 35.2 40.5 35.4 39.7 36.1 39.2 36.1 38.2 35.6 36.7 34.9 36.7 34.3 35.4 34.9 34.8 33.5 32.6 32.6 32.8 31.7 31.9 31.9 30.9 30.2 29.7 29.0 30.2 28.0 29.4 27.8 28.7 25.4 28.3 25.0 29.0 24.0 29.0 23.5 28.3 21.1 28.6 20.8 29.4 19.6 30.0 18.9 29.4 16.7 30.9 16.9 31.9 16.6 32.2ZM23.2 34.2 25.3 34.2 27.8 35.4 29.3 36.9 30.2 39.1 29.9 42.1 28.9 43.9 27.1 45.3 25.0 46.0 22.8 45.9 20.3 44.6 19.0 43.0 18.3 41.0 18.6 38.1 19.5 36.5 21.1 35.1ZM1.7 11.4 0.3 12.8 0.3 27.3 1.6 28.7 5.5 28.7 5.5 11.4ZM9.4 1.9 7.9 11.0 7.1 11.3 7.1 30.3 5.8 30.6 5.8 32.8 7.1 32.9 7.1 34.5 7.9 35.5 12.0 35.5 13.4 32.6 16.5 29.4 19.9 27.6 23.1 26.8 27.8 27.3 30.9 28.6 32.9 30.0 34.8 32.0 36.2 34.3 37.2 37.4 37.4 40.0 42.9 37.1 62.0 37.1 67.8 40.0 68.0 37.7 68.7 35.2 70.7 31.7 73.9 28.9 76.5 27.6 78.6 27.0 83.3 27.0 87.3 28.4 91.2 31.7 92.6 34.1 98.1 32.0 99.4 30.9 99.4 21.5 98.8 20.6 95.7 20.2 95.4 18.8 91.5 17.3 68.1 17.3 67.5 16.5 67.7 16.2 84.4 16.2 83.4 15.2 81.7 14.7 66.8 14.7 60.5 2.2 58.6 0.4 11.5 0.3 10.4 0.7ZM69.8 29.3 72.6 25.7 75.2 24.4 86.1 24.2 89.2 25.5 90.6 27.0 92.2 29.4 91.9 29.6 88.2 26.4 85.3 25.4 75.9 25.5 73.3 26.7 70.0 29.6ZM13.0 29.4 15.9 25.7 18.5 24.4 29.4 24.2 32.6 25.7 34.2 27.4 35.5 29.6 31.5 26.4 28.4 25.4 20.1 25.4 18.6 25.7 16.6 26.7 13.1 29.7ZM91.9 22.5 93.8 22.4 93.9 24.1 92.1 24.2ZM96.8 21.9 97.8 22.1 97.8 29.7 95.7 29.9 95.5 27.0 96.7 26.8ZM46.8 18.9 51.5 18.8 51.7 19.9 46.9 20.1ZM29.3 18.9 33.9 18.8 34.2 19.8 33.9 20.1 29.4 20.1ZM45.9 3.8 58.4 3.6 62.9 12.4 61.8 13.3 61.8 14.4 61.5 14.7 59.9 14.6 59.9 11.1 59.6 10.7 58.6 10.7 58.3 11.1 58.2 14.7 46.0 14.7ZM30.3 3.8 42.3 3.6 42.4 14.6 28.7 14.7ZM14.7 3.8 27.4 3.6 25.7 14.4 13.0 14.6Z"/></svg>',
  meet:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M15 14.5c3 0 6 2 6 5"/></svg>',
  route:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h7a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h7"/></svg>',
  chat:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4z"/></svg>',
  plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  cam:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  ext:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/></svg>'
};
const TABS = [["inicio","Inicio",I.home],["calendario","Calendario",I.cal],["reuniones","Reuniones",I.chat],["paseos","Paseos",I.jeep],["rutas","Rutas",I.route],["socios","Socios",I.meet]];

/* ---------- state ---------- */
const S = { dist:{}, usage:null, openYears:null, rsvp:[], allUp:false, allPast:false, socios:[], birthdays:[], live:[], pending:[], events:[], photos:[], routes:[], threads:[], meetings:{}, members:{}, config:{},
  ready:false, db:null, user:null, assets:null, uid:null, isOwner:false, canAdmin:false, canPost:false, canWrite:true, names:{},
  tab:"inicio", calY:new Date().getFullYear(), calM:new Date().getMonth(), calSel:todayStr(), q:"" };
let sheet = null; // {kind,id,render}

/* ---------- meetings (auto: 1st Thursday oficial, 3rd Thursday casual) ---------- */
function nthThursday(y,m,n){ const d=new Date(y,m,1); const off=(4-d.getDay()+7)%7; return new Date(y,m,1+off+7*(n-1)); }
function meetingsBetween(from,to){
  const out=[]; let y=from.getFullYear(), m=from.getMonth();
  while(new Date(y,m,1)<=to){
    for(const [kind,n] of [["oficial",1],["casual",3]]){
      const key=y+"-"+pad(m+1)+"-"+kind; const ov=S.meetings[key]||{};
      const date=ov.date||ymd(nthThursday(y,m,n));
      out.push({key,kind,title:ov.title||"",date,time:ov.time||S.config.meetingTime||"",place:ov.place||S.config.meetingPlace||"",summary:ov.summary||"",cancelled:!!ov.cancelled,edited:!!S.meetings[key]});
    }
    m++; if(m>11){m=0;y++;}
  }
  return out;
}
function allMeetings(){
  const now=new Date(); const keys=Object.keys(S.meetings).sort();
  let from=new Date(now.getFullYear(),now.getMonth()-12,1);
  if(keys.length){ const [ky,km]=keys[0].split("-").map(Number); const f=new Date(ky,km-1,1); if(f<from) from=f; }
  return meetingsBetween(from,new Date(now.getFullYear(),now.getMonth()+6,1));
}
const kindName = k => k==="oficial"?(S.config.oficialName||"Reunión oficial"):(S.config.casualName||"Reunión casual");
const mtgTitle = m => m.title||kindName(m.kind);
const kindTag = k => k==="oficial"?"Primer jueves":"Tercer jueves";

/* ---------- people ---------- */
function nameOf(id){ if(!id) return "Socio"; const mem=S.members[id]; return (mem&&mem.nick)||S.names[id]||"Socio"; }
let nameReq=null;
function resolveNames(){
  if(!S.user||nameReq) return;
  const ids=new Set(); [S.events,S.photos,S.routes,S.threads,S.live].forEach(a=>a.forEach(x=>x.by&&ids.add(x.by))); S.rsvp.forEach(r=>r.pending&&ids.add(r.id));
  const need=[...ids].filter(i=>!(i in S.names)); if(!need.length) return;
  nameReq=S.user.profiles(need).then(ps=>{ need.forEach(i=>{ S.names[i]=(ps&&ps[i]&&ps[i].name)||""; }); nameReq=null; rerender(); }).catch(()=>{nameReq=null;});
}
const mine = x => S.uid && x.by===S.uid;
const canManage = x => S.isOwner || S.canAdmin || mine(x);

/* ---------- writes ---------- */
async function write(fn,okMsg){
  if(!S.db){ toast("Sin conexión a la base del club."); return false; }
  try{ const r=await Promise.race([Promise.resolve(fn(S.db)).then(()=>"ok"),new Promise(res=>setTimeout(()=>res("offline"),8000))]);
    if(r==="offline") toast("Sin señal: quedó guardado y se enviará solo cuando vuelva."); else if(okMsg) toast(okMsg); return true; }
  catch(e){
    if(e&&e.code==="permission-denied") toast("No tienes permiso para hacer esto. Habla con un administrador.");
    else if(e&&e.code==="resource-exhausted") toast("Demasiadas acciones seguidas. Espera unos segundos.");
    else toast("No se pudo guardar. Intenta de nuevo.");
    return false;
  }
}

/* ---------- photos upload ---------- */
function compress(file){
  return new Promise((res,rej)=>{
    const img=new Image(); const url=URL.createObjectURL(file);
    img.onload=()=>{ const max=1800; let w=img.naturalWidth,h=img.naturalHeight; const k=Math.min(1,max/Math.max(w,h)); w=Math.round(w*k); h=Math.round(h*k);
      const c=document.createElement("canvas"); c.width=w; c.height=h; c.getContext("2d").drawImage(img,0,0,w,h);
      c.toBlob(b=>{ URL.revokeObjectURL(url); b?res({b,w,h}):rej(new Error("toBlob")); },"image/jpeg",.82); };
    img.onerror=()=>{ URL.revokeObjectURL(url); rej(new Error("img")); };
    img.src=url;
  });
}
const thumbOf = p => p.kind==="video"?(p.poster||p.asset):p.asset;
const fmtDur = s => { s=Math.round(s||0); return Math.floor(s/60)+":"+String(s%60).padStart(2,"0"); };
function mediaCell(p,label){ return p.kind==="video"
  ?`<span class="vthumb">${p.poster?`<img loading="lazy" src="${blob(p.poster)}" alt="" style="width:100%;height:100%;object-fit:cover">`:""}<span class="play">▶</span><span class="dur">${fmtDur(p.dur)}</span></span>`
  :`<img loading="lazy" src="${blob(p.asset)}" alt="">`; }
function countMedia(list){ const v=list.filter(p=>p.kind==="video").length, f=list.length-v; const a=[]; if(f) a.push(f+(f===1?" foto":" fotos")); if(v) a.push(v+(v===1?" video":" videos")); return a.join(" · "); }
function refreshUsage(){ if(!S.assets||!S.canAdmin||!S.assets.list) return; S.assets.list().then(r=>{ if(r&&r.usage){ S.usage=r.usage; rerender(); } }).catch(()=>{}); }
function meterHtml(){ const u=S.usage; if(!u||!S.canAdmin) return "";
  const mb=b=>(b/1048576).toLocaleString("es-CL",{maximumFractionDigits:b<1048576*10?1:0});
  const pb=u.maxBytes?u.bytes/u.maxBytes:0, pf=u.maxFiles?u.files/u.maxFiles:0, p=Math.max(pb,pf);
  return `<div class="meter ${p>.8?"warn":""}"><b>Espacio usado:</b> ${mb(u.bytes)} MB de ${mb(u.maxBytes)} MB (${Math.round(pb*100)}%) · ${u.files.toLocaleString("es-CL")} de ${u.maxFiles.toLocaleString("es-CL")} archivos<div class="bar"><i style="width:${Math.min(100,Math.round(p*100))}%"></i></div><div class="small muted" style="margin-top:4px">Solo lo ve la directiva.</div></div>`; }
const isIOSdev = /iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
function waitEv(el,ev,ms){ return new Promise((res,rej)=>{ let t; const ok=()=>{ clearTimeout(t); el.removeEventListener(ev,ok); res(); }; el.addEventListener(ev,ok); t=setTimeout(()=>{ el.removeEventListener(ev,ok); rej({code:"timeout_"+ev}); },ms); }); }
function hiddenVideo(url){ const v=document.createElement("video"); v.muted=true; v.defaultMuted=true; v.playsInline=true; v.setAttribute("playsinline",""); v.setAttribute("webkit-playsinline",""); v.setAttribute("muted",""); v.preload="auto";
  v.style.cssText="position:fixed;left:-10px;top:-10px;width:4px;height:4px;opacity:0.01;pointer-events:none;"; document.body.appendChild(v); v.src=url; try{ v.load(); }catch(_){} return v; }
function pickMime(){ if(!window.MediaRecorder||!HTMLCanvasElement.prototype.captureStream) return null; for(const m of ["video/mp4;codecs=avc1.42E01E,mp4a.40.2","video/mp4;codecs=avc1","video/mp4","video/webm;codecs=vp8,opus","video/webm"]) { try{ if(MediaRecorder.isTypeSupported(m)) return m; }catch(_){} } return null; }
async function rawVideo(file,meta,poster){
  const t=/^video\/(mp4|webm)$/.test(file.type)?file.type:(/quicktime|\.mov$/i.test(file.type+file.name)?"video/mp4":(/\.m4v$/i.test(file.name)?"video/mp4":null));
  if(!t) throw {code:"no_encoder"};
  if(file.size>20*1048576) throw {code:"too_large_raw",mb:Math.round(file.size/1048576)};
  return {blob:file,type:t,poster,dur:meta?meta.dur:0,w:meta?meta.w:0,h:meta?meta.h:0,raw:true};
}
async function processVideo(file,onProg){
  const url=URL.createObjectURL(file); const v=hiddenVideo(url);
  const cleanup=()=>{ try{ v.pause(); }catch(_){} v.remove(); URL.revokeObjectURL(url); };
  let meta=null, poster=null;
  try{
    if(v.readyState<1) await waitEv(v,"loadedmetadata",15000);
    let dur=v.duration;
    if(!isFinite(dur)){ v.currentTime=1e6; await waitEv(v,"timeupdate",5000).catch(()=>{}); dur=v.duration; }
    meta={dur:isFinite(dur)?dur:0,w:v.videoWidth||1280,h:v.videoHeight||720};
  }catch(e){ cleanup(); return rawVideo(file,null,null); }
  if(meta.dur>30.9){ cleanup(); throw {code:"too_long",dur:meta.dur}; }
  const sc=Math.min(1,1280/Math.max(meta.w,meta.h)); const W=Math.max(2,Math.round(meta.w*sc/2)*2), H=Math.max(2,Math.round(meta.h*sc/2)*2);
  const cv=document.createElement("canvas"); cv.width=W; cv.height=H; const cx=cv.getContext("2d");
  try{ if(v.readyState<2){ v.currentTime=Math.min(0.5,meta.dur/2||0); await waitEv(v,"seeked",6000); }
    else { v.currentTime=Math.min(1,meta.dur/2||0); await waitEv(v,"seeked",6000); }
    cx.drawImage(v,0,0,W,H); poster=await new Promise(r=>cv.toBlob(r,"image/jpeg",.8)); }catch(_){ poster=null; }
  const mime=pickMime();
  if(!mime){ cleanup(); return rawVideo(file,meta,poster); }
  try{
    v.currentTime=0; await waitEv(v,"seeked",6000).catch(()=>{});
    const stream=cv.captureStream(30);
    let actx=null;
    if(!isIOSdev){ try{ actx=new (window.AudioContext||window.webkitAudioContext)(); const src=actx.createMediaElementSource(v); const dest=actx.createMediaStreamDestination(); src.connect(dest); dest.stream.getAudioTracks().forEach(t=>stream.addTrack(t)); v.muted=false; }catch(_){ v.muted=true; actx=null; } }
    let rec; try{ rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:2000000,audioBitsPerSecond:96000}); }catch(_){ rec=new MediaRecorder(stream); }
    const chunks=[]; rec.ondataavailable=e=>{ if(e.data&&e.data.size) chunks.push(e.data); };
    const stopped=new Promise(r=>{ rec.onstop=r; });
    let raf=0, last=-1, stall=Date.now();
    const draw=()=>{ if(v.currentTime!==last){ last=v.currentTime; stall=Date.now(); } cx.drawImage(v,0,0,W,H); if(onProg) onProg(v.currentTime,meta.dur); if(!v.ended) raf=requestAnimationFrame(draw); };
    rec.start(500);
    try{ await v.play(); }catch(_){ v.muted=true; await v.play(); }
    draw();
    await new Promise((res,rej)=>{ v.onended=res; const iv=setInterval(()=>{ if(v.ended){ clearInterval(iv); res(); } else if(Date.now()-stall>8000){ clearInterval(iv); rej({code:"stalled"}); } else if(v.paused) v.play().catch(()=>{}); },1000); setTimeout(()=>{ clearInterval(iv); res(); },(meta.dur+25)*1000); });
    cancelAnimationFrame(raf); if(rec.state!=="inactive") rec.stop(); await stopped; if(actx) actx.close().catch(()=>{});
    const type=(rec.mimeType||mime).split(";")[0]; const out=new Blob(chunks,{type});
    cleanup();
    if(!out.size) return rawVideo(file,meta,poster);
    if(out.size>20*1048576) throw {code:"too_large"};
    return {blob:out,type:/mp4/.test(type)?"video/mp4":"video/webm",poster,dur:meta.dur,w:W,h:H};
  }catch(e){ cleanup(); if(e&&e.code==="too_large") throw e; return rawVideo(file,meta,poster); }
}
async function uploadPhotos(files,eventId,btn){
  if(!S.assets){ toast("Tu acceso no permite subir fotos."); return; }
  const all=[...files]; const list=all.filter(f=>/^image\//.test(f.type)); if(list.length<all.length) toast("Por ahora solo se pueden subir fotos; los videos vienen más adelante."); if(!list.length) return;
  let done=0, vids=0; const label=btn?btn.textContent:"";
  for(let k=0;k<list.length;k++){ const f=list[k]; const isV=/^video\//.test(f.type)||/\.(mov|mp4|m4v|webm)$/i.test(f.name);
    try{
      if(isV){
        const res=await processVideo(f,(t,d)=>{ if(btn) btn.textContent="Preparando video "+(k+1)+" de "+list.length+": "+Math.round(t)+" de "+Math.round(d)+" s…"; });
        if(btn) btn.textContent="Subiendo video "+(k+1)+" de "+list.length+"…";
        const pr=res.poster?await S.assets.upload(res.poster,{type:"image/jpeg"}).catch(()=>null):null;
        const vr=await S.assets.upload(res.blob,{type:res.type});
        await S.db.collection("photos").add({eventId,kind:"video",asset:vr.id,poster:pr?pr.id:null,dur:Math.round(res.dur*10)/10,caption:"",by:S.uid||null,at:Date.now(),w:res.w,h:res.h});
        vids++; done++;
      } else {
        if(btn) btn.textContent="Subiendo "+(k+1)+" de "+list.length+"…";
        const {b,w,h}=await compress(f);
        const r=await S.assets.upload(b,{type:"image/jpeg"});
        await S.db.collection("photos").add({eventId,asset:r.id,caption:"",by:S.uid||null,at:Date.now(),w,h});
        done++;
      }
    }catch(e){ const c=e&&e.code;
      toast(c==="too_long"?"El video dura "+Math.round(e.dur)+" s. El máximo es 30 segundos; recórtalo en el teléfono y vuelve a subirlo."
        :c==="quota_or_state"?"Se llenó el espacio del club. Avísale a la directiva."
        :c==="too_large"?"El video quedó muy pesado (más de 20 MB). Prueba con uno más corto."
        :c==="no_encoder"?"Este teléfono no pudo preparar el video. Prueba grabándolo de nuevo o desde otro teléfono."
        :c==="too_large_raw"?"Tu teléfono no pudo comprimir el video y pesa "+e.mb+" MB (máximo 20 MB). En iPhone: Ajustes → Cámara → Grabar video → 720p HD, y vuelve a grabarlo."
        :c==="rate_limited"?"Demasiadas subidas seguidas; espera un momento."
        :isV?"El video no se pudo subir"+(c?" (código: "+c+")":e&&e.message?" ("+String(e.message).slice(0,60)+")":"")+". Mándale este mensaje a la directiva.":"Una foto no se pudo subir."); console.error("video",e); }
  }
  if(btn) btn.textContent=label;
  if(done) toast(done===1?(vids?"Video subido":"Foto subida"):done+" archivos subidos");
  refreshUsage();
}

const CHILE={"paths":{"15":"M53.5,1.0 55.0,5.7 56.9,6.6 56.1,7.6 56.8,8.3 57.0,12.2 58.1,14.9 56.0,17.0 54.7,17.4 53.9,16.2 50.1,16.3 46.8,18.3 46.2,13.9 46.7,10.5 46.0,9.5 49.3,8.7 50.3,7.7 51.2,5.9 50.8,2.5 51.9,2.6 53.5,1.0Z","1":"M47.7,22.5 47.2,22.0 47.5,21.0 46.8,18.3 49.5,16.5 53.9,16.2 54.7,17.4 56.1,17.0 57.7,15.4 62.2,20.2 59.8,23.4 61.2,24.5 61.0,26.2 59.2,27.3 59.8,27.3 60.1,29.2 59.5,30.6 61.9,32.4 61.0,33.3 61.6,35.5 61.1,36.6 58.5,38.8 54.8,40.0 52.8,42.3 51.1,40.2 48.7,40.3 47.5,34.1 48.1,29.0 47.8,28.1 47.7,22.5Z","2":"M62.2,35.3 64.1,39.0 64.9,45.8 66.0,47.1 66.0,49.8 66.9,51.8 66.5,54.3 69.1,55.0 72.2,54.1 73.8,56.0 71.1,66.3 62.3,70.9 60.9,74.0 62.7,77.1 61.7,77.3 61.2,78.9 59.6,79.9 57.4,79.8 56.5,84.0 53.7,84.6 53.1,85.5 49.9,84.9 48.5,85.7 46.7,85.0 43.8,86.6 43.2,83.8 43.9,81.3 44.8,80.8 45.6,78.6 44.4,71.5 44.8,64.6 45.9,62.1 45.3,60.7 44.0,61.2 44.2,58.5 44.4,56.8 44.9,56.2 45.2,57.0 45.8,56.8 46.8,55.1 48.5,40.8 48.8,40.3 51.1,40.2 52.8,42.3 54.8,40.0 58.5,38.8 62.2,35.3Z","12":"M10.8,348.8 11.5,348.1 10.7,349.4 10.0,349.2 9.7,348.9 10.0,348.6 8.9,348.3 9.5,348.0 10.8,348.8ZM10.5,346.0 11.2,345.7 10.3,347.2 9.1,347.4 10.3,346.4 9.6,346.6 10.5,344.3 10.9,344.9 11.6,344.4 10.5,346.0ZM10.0,344.6 8.9,346.1 9.3,346.9 8.6,347.3 8.9,346.4 8.6,347.3 8.2,347.4 8.7,346.5 8.1,346.9 8.6,346.4 7.7,346.2 8.7,345.5 8.1,345.5 8.8,344.1 8.7,345.3 10.0,344.6ZM8.3,343.2 8.2,345.0 7.4,345.3 7.7,344.6 7.2,344.2 7.7,343.3 8.3,343.2ZM9.2,343.7 9.8,343.8 8.9,342.4 10.1,342.6 10.0,344.6 9.2,343.7ZM8.4,339.2 7.5,340.8 7.0,340.1 6.8,342.0 6.3,341.6 6.7,342.1 5.6,342.4 5.4,341.3 6.6,340.9 6.4,340.0 6.6,339.8 7.0,339.9 6.4,339.3 7.2,338.5 7.0,339.9 7.5,338.9 8.0,339.3 8.4,339.2ZM12.1,339.6 10.4,338.9 10.2,340.2 8.4,340.8 7.9,340.4 8.2,340.5 10.0,339.3 8.3,339.4 10.5,337.9 11.0,338.1 11.4,337.9 12.2,338.5 12.1,339.2 11.6,338.7 10.9,338.4 12.1,339.6ZM10.5,334.9 11.2,334.2 10.8,335.0 8.7,334.5 9.5,334.1 8.6,333.9 9.2,333.9 8.7,333.2 9.8,333.3 8.8,332.9 8.8,332.7 8.8,332.9 9.1,332.7 9.7,332.9 9.7,333.1 10.0,333.0 9.5,332.6 10.5,332.9 9.9,333.4 10.7,334.0 9.9,334.1 10.7,334.3 10.5,334.9ZM7.9,333.3 7.6,332.8 7.8,332.5 8.2,332.5 8.2,332.8 8.4,332.4 8.4,334.2 7.3,333.1 7.9,333.3ZM4.9,332.4 4.4,332.1 5.6,332.0 4.8,331.6 4.5,331.3 4.7,331.3 4.4,331.2 4.7,330.7 7.7,331.0 6.2,331.5 6.5,332.2 5.6,331.5 6.3,332.4 5.6,332.4 6.2,332.7 5.6,333.1 6.3,333.4 6.0,334.0 4.5,333.4 4.6,333.0 5.2,333.0 5.4,332.9 4.0,332.7 4.9,332.4ZM7.1,329.9 7.4,329.5 8.8,328.7 9.2,329.1 8.8,329.6 7.6,329.6 8.4,329.7 8.6,329.8 8.4,330.1 7.1,329.9ZM7.1,327.0 8.7,327.0 8.3,327.6 8.1,327.4 7.7,327.8 8.0,327.9 8.7,327.1 8.6,327.8 9.7,327.5 9.1,327.2 9.2,327.0 10.1,327.5 10.0,327.9 9.6,327.7 9.7,328.0 9.2,327.9 9.6,328.4 8.8,328.1 8.0,328.2 7.7,328.7 8.4,328.2 8.8,328.5 7.3,329.6 6.9,329.4 6.5,330.5 6.9,329.9 7.6,330.0 7.3,330.1 7.4,330.3 6.9,330.8 5.4,330.4 6.7,328.9 4.3,329.6 4.8,327.7 5.2,327.4 6.2,327.8 5.2,328.1 6.5,328.7 7.4,327.6 5.4,327.2 4.8,326.3 6.0,326.0 6.1,326.7 7.0,326.2 7.1,327.0ZM5.3,322.2 6.9,324.4 6.9,325.0 5.9,324.1 6.2,324.8 5.8,324.8 5.3,324.5 5.1,324.1 5.3,322.9 3.2,324.5 3.0,323.6 3.2,323.6 3.4,323.4 3.5,323.4 3.9,323.4 4.2,323.2 4.3,323.0 4.0,323.2 3.4,323.0 3.2,322.4 3.3,322.2 3.9,321.8 4.5,322.1 4.6,321.7 5.3,322.2ZM6.7,320.4 5.4,320.6 5.9,320.2 5.2,320.5 5.6,320.4 5.3,320.7 5.0,320.8 4.9,320.5 5.7,319.8 4.9,320.4 4.5,318.7 5.5,318.5 4.8,319.3 5.6,318.8 6.4,320.3 6.5,320.2 7.4,320.8 6.6,320.1 6.7,320.2 8.1,320.1 8.6,319.9 6.5,320.1 7.0,319.9 6.2,319.8 5.9,319.2 6.6,319.3 5.7,318.5 6.5,318.3 7.3,319.7 8.0,319.5 6.8,318.5 7.4,318.6 8.2,319.3 7.5,318.5 8.4,318.4 7.9,318.2 7.7,317.7 9.3,319.0 9.4,319.7 9.4,318.1 10.1,318.4 9.5,317.8 10.3,317.9 9.8,317.0 10.5,316.9 9.0,315.9 9.9,315.4 10.3,316.1 10.6,316.2 10.1,315.1 8.7,315.8 9.6,314.8 8.5,315.1 8.3,314.8 9.9,314.3 9.6,314.2 9.9,314.0 9.1,314.4 8.4,314.7 8.1,314.2 8.2,313.7 9.4,314.2 8.4,313.6 9.3,313.3 9.7,312.9 10.0,313.0 10.1,312.7 10.3,313.1 9.8,313.5 10.3,313.9 10.0,313.5 10.4,313.4 10.4,313.0 10.2,312.8 10.8,312.5 11.6,313.0 11.2,313.3 11.7,313.3 11.3,314.7 12.5,313.0 12.6,314.7 11.7,315.5 12.6,314.8 13.1,315.5 12.2,316.2 13.1,316.9 13.2,319.0 12.7,320.8 11.9,321.1 12.2,321.1 12.1,321.3 12.5,321.1 12.7,322.1 12.3,322.0 11.8,322.4 13.2,322.8 13.1,323.7 12.6,323.4 11.9,323.4 13.1,323.8 13.1,325.0 12.5,324.4 12.8,325.2 12.3,325.8 11.2,324.8 12.2,325.8 11.2,326.6 10.7,326.4 11.2,325.9 10.2,326.5 9.9,325.9 9.9,326.5 9.3,326.3 9.2,325.9 10.5,325.1 11.3,325.5 11.0,325.0 10.6,325.0 9.3,325.7 8.9,325.4 9.3,324.5 10.1,324.7 11.4,323.9 9.7,324.5 10.6,323.2 9.5,324.2 9.1,323.4 9.6,323.2 8.9,322.7 9.8,322.8 9.2,322.0 10.2,322.4 10.8,322.3 10.1,322.2 10.5,321.8 10.5,321.5 9.9,322.1 9.3,321.8 9.2,321.3 10.2,320.6 10.6,321.2 10.3,320.6 11.4,320.3 10.6,320.1 11.6,319.1 10.6,320.0 9.8,319.3 10.5,320.1 9.3,321.0 9.4,319.9 9.3,321.0 8.7,321.4 8.7,320.3 8.5,321.4 8.0,321.1 8.5,321.5 8.4,321.9 7.5,321.3 8.4,322.1 8.1,323.0 8.5,322.1 8.8,322.2 8.1,323.2 8.2,323.9 8.5,323.1 8.9,323.5 8.8,324.0 8.6,324.0 8.7,324.1 8.6,324.0 8.6,324.1 8.6,324.2 8.4,324.3 8.5,324.4 8.1,324.6 8.2,325.0 7.1,324.5 6.7,323.7 7.2,323.5 6.3,322.9 7.0,322.7 6.1,322.6 7.0,322.5 6.3,322.4 7.0,321.7 6.3,322.3 6.2,322.4 6.1,322.3 6.2,322.2 6.3,322.2 6.1,322.2 5.9,322.3 6.9,321.5 5.7,321.3 6.7,320.4ZM6.7,317.4 7.4,316.8 6.5,317.3 7.4,316.0 8.0,316.4 7.4,316.0 7.6,315.8 8.7,317.0 8.7,316.0 9.6,316.8 9.3,318.9 7.9,317.4 6.7,317.4ZM5.1,317.5 5.4,316.7 4.5,317.4 4.5,318.4 3.0,317.9 5.9,315.3 5.4,316.2 6.3,316.7 5.1,317.5ZM4.5,316.4 3.9,316.7 2.5,316.2 3.1,315.7 4.5,316.4ZM6.3,316.6 6.1,315.0 4.5,316.4 3.7,315.7 4.5,315.6 4.6,315.1 3.0,315.3 3.0,314.5 4.1,313.8 5.0,314.0 4.3,314.8 5.4,313.9 5.0,314.7 5.4,314.3 5.9,315.1 5.4,314.3 5.5,314.0 6.4,314.4 6.5,315.0 6.3,313.7 7.9,314.5 7.2,315.1 8.2,315.3 7.1,316.0 6.6,315.1 7.0,316.0 6.3,316.6ZM8.2,312.0 7.8,314.3 6.4,313.5 7.3,313.2 8.2,312.0ZM8.6,312.0 10.1,312.6 9.7,312.8 9.2,313.2 8.3,313.4 8.5,312.6 9.4,312.9 8.5,312.6 8.6,312.0ZM16.7,357.2 17.7,357.3 18.4,358.2 18.2,358.5 16.7,357.2ZM13.7,355.8 13.7,355.3 15.6,356.1 15.4,355.4 17.1,356.7 17.3,356.2 18.6,356.7 19.4,357.8 19.2,356.9 19.7,356.8 20.2,358.8 21.0,358.5 20.4,358.2 20.7,357.4 22.0,358.4 21.5,358.8 23.8,359.7 19.6,359.4 20.8,359.1 19.6,358.8 19.9,358.4 18.7,357.5 18.8,357.9 18.4,358.0 18.1,357.0 18.1,357.7 17.3,356.7 15.5,356.6 16.5,357.1 15.8,357.4 14.4,356.4 14.5,357.4 13.8,357.3 13.7,356.2 13.4,356.8 12.1,355.7 12.5,355.1 11.9,355.6 11.3,355.1 11.2,354.4 11.4,354.7 11.9,354.7 10.4,353.3 12.9,354.3 12.2,354.5 13.4,354.8 13.0,355.3 13.7,355.8ZM18.1,353.1 16.9,353.1 17.9,352.0 16.7,352.7 17.7,351.7 15.8,352.4 16.4,351.3 17.7,351.3 17.7,350.5 18.6,350.2 19.3,350.9 18.6,351.1 18.9,351.8 18.0,351.5 18.8,351.9 18.1,353.1ZM15.4,349.3 14.9,349.4 14.7,349.7 14.4,349.7 15.3,349.1 14.7,348.9 15.0,348.3 15.8,348.9 16.7,349.4 16.7,349.9 14.9,350.1 15.4,349.3ZM18.4,348.7 18.3,349.2 18.5,349.3 18.7,350.2 17.4,349.9 18.4,349.6 16.6,348.7 15.5,347.3 14.4,347.0 15.8,347.0 15.8,347.7 18.4,348.7ZM13.9,347.5 14.8,347.9 12.9,347.5 14.9,347.3 17.2,349.4 17.2,349.6 15.2,348.1 14.6,348.0 14.9,347.9 16.0,348.4 14.5,347.5 13.9,347.5ZM17.2,346.2 17.8,346.7 17.4,347.1 15.6,346.3 17.2,346.7 15.6,345.3 16.0,345.0 16.6,345.4 16.4,346.0 16.7,345.4 18.0,346.3 18.9,347.4 18.8,347.8 19.3,348.2 18.9,348.2 18.4,347.7 17.8,347.5 17.4,347.1 17.9,347.0 17.8,346.3 17.2,346.2ZM11.8,345.5 12.7,345.9 10.6,347.2 10.9,346.3 11.8,346.2 11.8,345.5ZM14.9,344.9 15.9,344.8 15.5,345.3 15.5,345.8 13.5,345.0 12.3,343.1 15.2,344.5 14.9,344.9ZM17.9,344.4 17.9,345.2 16.8,345.0 16.8,344.1 14.8,343.5 14.4,342.9 15.7,342.8 15.3,342.7 15.2,341.9 15.9,342.1 15.4,341.5 15.9,341.3 16.6,343.0 16.2,343.0 15.9,343.3 16.7,343.2 16.7,344.0 17.9,344.4ZM14.9,340.4 14.2,339.5 14.6,338.9 15.5,339.6 14.9,339.4 14.8,339.7 15.8,340.4 14.9,340.4ZM16.1,339.9 15.6,338.3 16.8,338.3 17.0,339.3 16.1,339.9ZM13.2,338.3 11.6,336.6 12.6,336.0 12.9,336.6 12.2,336.8 13.3,337.1 13.4,337.9 12.8,337.8 13.2,338.0 13.2,338.2 13.2,338.3ZM14.4,338.6 13.6,335.1 13.9,335.1 15.0,338.1 14.4,338.6ZM12.5,334.5 13.1,334.2 13.3,334.9 12.8,335.4 13.3,335.1 13.2,336.9 12.6,335.9 11.5,336.2 11.1,337.0 10.2,337.0 11.5,335.6 10.1,335.9 9.9,336.8 9.1,336.5 10.1,335.8 8.7,335.9 8.7,335.2 9.4,335.2 8.7,334.8 12.0,335.2 11.2,335.0 12.1,334.1 10.8,333.4 11.1,333.3 11.0,333.2 11.2,333.1 12.9,333.7 12.5,334.5ZM12.6,333.1 11.9,333.0 11.5,332.2 13.5,331.3 10.8,330.9 11.9,330.1 13.5,330.6 13.9,332.3 14.7,332.8 13.1,332.5 14.7,333.1 15.2,334.5 14.9,334.2 14.8,334.4 14.6,334.5 14.5,334.5 14.5,334.5 14.4,333.5 14.0,334.1 13.6,333.6 14.0,334.5 13.6,334.5 12.6,333.1ZM10.2,330.0 10.7,329.5 12.0,330.1 10.2,331.2 10.2,330.0ZM13.3,320.1 13.8,320.6 14.5,321.5 13.3,322.4 12.8,321.0 13.3,320.1ZM41.7,375.2 38.5,374.5 38.2,375.5 37.9,374.7 37.3,375.4 37.0,374.7 39.3,374.2 41.7,375.2ZM38.5,367.1 39.2,367.2 39.3,368.1 39.4,367.1 40.0,367.6 40.3,366.6 41.0,366.9 40.3,368.0 41.2,367.6 40.7,368.4 41.2,368.8 40.7,369.4 39.8,369.0 40.2,369.9 38.0,369.2 39.6,368.4 37.9,368.6 37.2,368.1 37.7,367.2 36.6,367.3 37.2,367.6 36.7,367.9 37.7,368.6 37.6,369.4 36.7,369.2 36.9,368.2 36.2,368.6 36.7,367.9 35.5,368.3 35.2,367.5 36.3,366.9 35.6,366.1 35.6,365.8 36.1,365.4 36.8,366.1 37.4,365.5 37.0,366.0 37.6,366.0 37.7,366.9 37.8,365.7 38.7,366.0 39.0,366.9 38.5,367.1ZM35.4,365.3 34.7,365.8 35.3,366.0 35.3,366.6 34.7,366.5 35.9,366.9 34.8,367.7 33.2,366.4 35.0,368.4 33.6,368.9 34.5,369.4 33.0,369.3 33.7,368.2 31.6,368.0 32.8,367.4 31.4,367.2 32.4,367.0 31.7,366.4 30.6,366.9 31.0,367.4 30.0,368.1 30.2,368.7 29.3,368.5 30.0,368.8 29.6,369.3 30.4,369.4 29.2,369.6 29.0,370.4 28.3,369.5 29.4,369.5 29.6,368.7 29.4,368.9 29.3,368.6 28.8,368.8 29.1,369.0 28.9,369.3 27.8,368.7 28.6,367.8 29.7,367.7 29.3,367.3 30.3,367.2 30.3,367.0 29.5,367.1 29.3,367.0 29.3,366.9 31.0,366.7 31.3,365.8 30.7,366.1 30.4,365.2 32.8,366.2 31.8,365.4 33.0,365.8 32.2,365.5 33.2,365.1 32.9,364.6 33.9,364.6 34.0,365.8 34.5,364.9 35.4,365.3ZM21.4,366.1 23.0,367.1 22.4,367.5 20.5,366.8 21.4,366.1ZM22.0,364.6 23.1,364.3 22.1,364.2 22.6,364.0 24.0,364.3 24.0,364.5 23.9,365.1 22.0,364.6ZM25.2,361.5 25.8,361.3 25.2,362.5 25.8,362.7 26.2,361.6 25.7,360.5 26.8,361.1 27.2,362.5 27.3,361.2 29.6,362.4 27.7,362.7 27.6,362.9 27.7,363.2 29.0,362.8 29.0,363.5 29.6,362.8 30.8,363.3 29.9,363.6 31.5,363.9 30.4,364.0 30.9,364.6 28.9,364.3 29.9,364.5 30.1,365.2 28.9,364.9 29.8,365.6 28.9,365.6 29.8,365.8 29.7,366.6 28.9,366.7 28.2,366.0 28.3,367.1 27.6,367.0 27.8,366.3 27.3,366.9 27.6,366.2 26.0,367.4 24.3,367.1 25.9,366.8 24.8,366.5 24.8,366.2 26.6,366.6 25.6,365.8 27.1,365.8 26.2,365.4 27.4,364.7 25.8,364.8 26.8,363.6 25.9,363.6 25.3,365.0 24.2,365.1 25.3,364.4 24.1,364.2 26.2,363.5 25.9,363.4 26.1,363.1 23.4,362.8 23.5,363.1 22.8,363.3 23.1,362.7 24.2,362.6 25.0,362.7 25.2,362.2 23.8,362.5 24.5,361.7 22.6,362.3 22.8,361.6 21.0,360.7 24.3,361.4 23.2,360.0 24.2,359.8 24.5,360.9 24.7,360.0 25.4,360.4 25.1,361.4 25.8,361.1 25.2,361.5ZM17.7,360.7 19.2,361.6 17.6,362.1 17.9,361.7 17.2,361.5 18.0,361.5 17.7,360.7ZM21.9,361.8 19.5,361.7 17.9,360.4 20.8,361.6 19.1,360.6 20.6,360.5 19.5,360.3 19.9,359.9 21.5,360.2 20.4,361.0 21.9,361.8ZM30.8,357.0 30.4,356.9 30.8,357.3 30.4,357.0 30.3,356.7 29.8,356.7 29.5,356.4 27.8,356.7 29.6,356.9 31.1,357.9 27.7,358.0 29.3,358.6 28.2,358.7 28.6,359.5 28.3,359.8 27.2,359.5 27.8,360.3 28.5,360.0 29.6,361.3 28.2,361.4 22.0,357.7 25.1,357.7 26.9,359.0 27.2,358.6 25.8,357.9 26.9,358.1 26.2,357.6 26.3,357.5 26.8,357.6 27.0,357.7 26.9,357.6 27.3,357.5 24.8,357.1 25.8,356.4 25.2,356.5 24.9,355.4 25.4,355.2 24.5,354.6 25.4,354.5 26.3,353.8 26.2,354.3 27.2,353.2 27.4,353.6 27.6,353.5 27.8,353.7 26.9,355.1 28.0,354.0 28.5,354.1 28.2,354.2 27.5,354.8 28.8,354.3 29.3,354.8 29.2,354.2 31.4,352.5 34.6,353.0 36.6,352.5 37.7,353.2 37.6,354.3 33.5,356.0 32.6,357.3 29.9,356.4 30.8,356.9 30.8,357.0ZM18.0,355.2 18.5,354.7 19.9,354.9 19.7,354.4 21.8,355.4 18.0,355.2ZM25.0,345.0 25.4,344.7 25.5,345.0 23.7,346.9 23.9,345.5 25.0,345.0ZM21.3,352.0 21.8,352.8 21.4,353.1 21.9,352.9 21.5,353.3 21.0,353.2 21.6,352.6 21.0,352.5 19.3,353.3 19.7,353.8 18.7,353.6 20.1,352.6 19.1,352.4 20.0,351.9 19.5,351.5 20.3,351.9 19.8,351.2 20.9,351.1 20.1,350.8 20.5,350.3 19.2,350.3 20.1,349.9 19.7,349.0 20.1,348.1 18.6,346.4 21.6,348.2 24.5,346.6 24.5,347.5 23.6,347.3 23.4,347.5 24.1,347.6 23.5,348.3 24.6,347.8 25.1,348.3 24.6,349.0 25.4,349.0 25.3,348.7 26.1,346.9 26.7,346.8 25.9,346.9 25.3,348.2 24.9,346.5 26.5,345.5 26.9,346.9 28.5,348.2 28.1,348.3 27.9,349.6 27.7,349.7 27.5,349.6 27.7,349.8 26.9,349.5 26.3,350.3 24.6,350.9 26.8,350.3 28.2,350.9 28.5,350.5 27.1,350.2 28.3,349.8 28.9,348.2 27.3,345.8 27.7,345.1 28.1,345.7 29.0,345.2 28.6,344.4 29.1,343.8 28.5,343.0 27.5,342.6 27.5,342.3 27.1,341.6 27.4,342.2 27.3,342.5 27.0,341.7 24.0,340.7 24.0,339.6 23.7,339.3 23.9,340.1 22.4,340.8 24.1,340.9 23.6,342.0 24.6,341.1 28.5,343.4 26.8,344.4 26.1,343.6 24.8,343.7 24.0,342.8 23.0,342.8 22.9,342.0 22.2,341.7 22.8,342.5 22.2,342.9 23.8,343.0 24.6,343.8 24.0,343.5 23.2,343.7 24.3,344.2 22.9,344.9 23.8,344.9 24.7,344.0 25.3,344.5 23.6,345.4 23.5,346.8 22.7,347.0 22.5,344.8 21.3,342.4 22.3,347.6 20.3,346.6 19.3,344.7 19.7,344.0 21.1,346.0 20.6,345.0 21.2,345.1 19.7,343.5 20.9,342.8 19.6,343.2 19.5,342.4 18.8,343.9 17.8,342.7 18.5,342.5 17.0,342.2 17.1,341.7 17.9,341.9 17.5,341.8 17.5,341.5 18.3,341.4 16.6,341.1 17.3,340.7 16.7,340.2 17.3,339.7 18.5,340.4 19.2,341.4 19.2,342.0 19.8,342.2 19.5,341.9 19.0,340.8 19.2,341.2 19.7,341.2 19.8,341.4 19.4,340.6 20.0,340.5 19.0,340.3 19.1,339.0 18.2,338.3 18.7,337.9 19.1,338.8 19.1,337.4 17.8,336.6 18.3,337.9 17.2,338.6 16.4,337.0 16.4,338.1 15.8,338.1 15.3,337.1 15.5,337.0 15.8,336.6 15.2,336.7 16.1,335.5 14.8,336.6 14.4,335.5 15.0,334.8 17.2,334.7 17.4,335.4 18.8,335.6 17.4,334.4 18.7,334.3 18.0,332.8 19.3,332.3 20.8,332.7 18.5,331.4 19.9,330.7 20.0,329.8 19.4,330.9 18.3,331.2 17.8,333.7 16.9,334.5 16.1,334.5 15.3,333.7 16.0,332.9 15.4,332.9 15.5,333.1 15.5,333.4 15.3,333.6 15.2,333.4 15.4,333.4 14.5,331.9 15.7,331.8 13.9,330.7 16.4,331.3 16.5,332.0 16.6,331.3 17.5,331.5 15.1,330.3 15.3,330.2 15.7,330.2 16.0,329.8 16.7,329.7 15.9,329.6 14.4,330.5 13.9,330.3 14.3,330.2 13.9,330.2 13.7,330.0 14.4,329.2 14.1,329.1 14.0,328.4 13.5,330.1 11.9,329.1 12.6,328.7 11.2,328.3 11.7,327.7 10.6,328.0 10.8,327.6 11.1,327.4 11.7,327.0 12.3,327.4 12.1,326.8 12.6,326.8 12.6,327.0 12.6,327.1 12.8,326.9 13.0,326.8 13.1,327.1 13.2,326.8 13.0,326.8 12.6,326.9 12.5,326.7 11.8,326.7 11.4,327.0 11.4,326.9 11.8,326.6 12.8,326.2 13.4,326.6 13.5,327.3 14.3,327.3 14.2,327.5 13.6,327.9 14.4,327.5 15.0,328.8 15.0,328.5 15.6,328.2 16.0,328.3 15.9,328.6 16.6,328.8 16.2,328.1 15.0,328.1 15.1,327.3 14.7,327.5 13.5,325.7 14.6,325.4 16.5,326.3 16.6,326.7 17.5,326.4 16.3,326.0 18.0,325.2 17.2,325.1 17.9,324.3 16.2,325.8 14.1,325.1 13.8,323.8 15.0,323.5 15.9,323.4 16.1,323.7 16.2,323.2 14.3,323.4 14.1,323.7 13.9,322.5 15.8,321.4 16.6,321.8 16.1,322.5 17.2,321.5 18.1,323.1 18.6,322.6 17.2,321.1 15.8,321.1 16.0,318.9 16.3,318.6 17.0,319.3 18.1,319.5 18.4,320.1 18.1,319.5 16.2,318.1 15.8,318.5 15.5,317.9 15.4,318.1 15.1,318.0 15.5,318.3 15.6,318.7 15.1,321.4 13.2,319.9 13.7,317.7 13.6,316.5 13.1,316.9 13.0,316.6 12.9,315.9 13.5,315.8 13.3,315.2 14.0,315.4 13.1,314.0 13.7,313.1 14.1,313.3 14.0,313.4 14.0,313.5 14.2,313.7 16.6,313.2 24.2,318.7 24.1,320.7 20.1,325.1 21.0,326.1 20.3,327.5 21.6,329.0 21.0,329.6 21.5,329.7 21.9,331.7 23.4,332.5 22.9,334.2 26.8,332.1 27.9,332.8 28.7,332.0 30.4,332.6 29.9,333.5 30.7,334.8 30.6,336.3 29.7,336.2 29.4,337.1 30.6,338.5 29.7,339.4 30.1,340.7 29.2,341.9 30.1,341.9 30.3,343.0 33.2,344.7 32.7,345.8 49.2,346.0 62.1,349.3 62.0,350.0 55.6,348.0 53.6,348.6 53.4,349.9 51.8,351.4 50.3,350.9 44.8,353.3 45.0,352.6 43.3,353.6 41.8,353.3 43.1,353.8 41.8,355.2 42.7,355.4 41.1,359.9 41.7,362.3 41.2,363.9 38.5,365.0 34.0,363.5 33.4,363.0 33.8,362.8 31.9,362.8 30.3,361.7 30.6,361.3 30.2,361.6 29.9,361.5 29.7,361.0 29.4,360.9 28.9,360.0 30.2,358.5 31.8,358.5 32.0,359.6 31.8,359.9 31.1,360.3 30.4,360.3 31.0,360.5 32.6,359.8 32.6,358.3 33.8,358.3 34.7,360.4 33.5,361.2 32.0,361.4 31.8,361.6 34.3,361.2 34.8,360.5 34.5,359.1 34.9,358.1 38.0,357.2 40.0,355.1 39.6,354.1 37.9,354.0 37.8,353.2 36.4,351.6 30.1,351.3 29.2,352.8 28.2,352.0 29.6,351.6 29.5,351.1 28.1,351.9 27.4,351.6 27.8,351.2 25.7,351.4 26.0,352.0 25.2,351.9 25.6,352.1 24.6,353.6 25.8,352.2 27.3,352.8 24.0,354.5 25.0,355.0 24.8,355.4 25.1,356.0 23.5,357.2 23.4,356.2 22.9,356.2 22.8,357.1 20.9,356.2 22.2,356.1 21.4,355.8 22.6,355.8 23.2,355.0 22.4,355.4 19.9,354.2 22.7,354.1 22.1,353.9 22.6,353.0 21.3,352.0ZM66.8,384.8 66.4,384.2 68.8,384.0 69.6,384.3 69.2,384.9 68.7,384.8 68.7,385.1 68.4,385.0 68.5,384.4 66.8,384.8ZM70.9,384.0 69.0,383.3 69.6,383.1 69.1,382.8 69.3,382.4 69.6,382.5 70.3,383.2 69.6,382.2 69.9,381.9 70.1,381.8 70.7,381.7 71.1,382.4 70.6,383.1 71.7,383.6 71.6,383.9 70.9,384.0ZM51.3,380.2 51.9,380.4 51.7,380.7 50.9,380.6 50.9,379.8 52.2,380.0 52.1,380.4 51.3,380.2ZM57.1,376.3 56.8,376.8 59.0,377.7 63.5,378.3 62.8,378.3 64.1,378.9 61.2,379.2 60.2,378.6 59.6,378.8 61.2,379.4 60.8,379.8 61.5,379.4 62.4,379.4 63.4,379.7 63.0,380.1 63.6,379.8 64.4,379.9 64.1,380.8 65.2,380.7 64.6,381.3 64.9,381.3 65.2,381.5 65.2,381.8 65.7,381.9 65.7,382.8 65.0,383.2 64.5,382.7 64.5,381.9 63.3,382.2 63.8,381.3 61.2,380.6 61.2,380.1 60.7,380.0 60.9,380.7 59.4,380.3 59.2,381.1 58.0,380.6 59.9,379.9 57.9,380.0 59.2,377.9 57.7,378.8 56.9,378.8 56.6,377.6 56.6,378.6 55.0,377.9 55.5,378.5 54.2,378.8 54.2,378.6 53.4,378.7 54.1,378.6 53.6,379.1 54.6,379.1 55.0,379.2 55.0,379.4 54.7,379.4 54.7,379.5 54.8,379.5 54.8,379.4 55.0,379.4 55.3,379.5 55.9,380.3 55.2,380.7 56.1,380.6 56.7,380.8 56.7,380.8 56.1,380.8 56.8,381.1 56.6,381.4 55.0,381.2 54.6,380.2 54.5,381.6 54.1,381.2 54.3,380.9 53.9,380.5 54.1,380.3 53.9,380.5 53.4,380.4 54.5,380.0 53.0,380.2 52.4,380.0 52.3,379.9 53.2,379.6 52.3,379.8 50.9,379.5 53.0,379.0 51.9,378.8 53.5,378.0 50.4,379.1 49.4,378.6 50.4,378.4 49.4,378.0 50.0,378.2 50.8,378.0 48.9,377.9 49.9,376.9 51.6,376.7 52.3,377.2 51.8,376.9 52.7,376.5 52.9,377.9 52.9,376.5 54.7,376.7 54.3,376.3 61.3,375.3 62.2,375.5 63.0,376.3 60.3,377.0 61.0,377.1 60.7,377.6 59.4,377.4 57.1,376.3ZM74.5,378.2 74.9,379.4 73.4,379.3 73.3,378.7 74.5,378.2ZM76.6,378.1 77.6,377.7 78.5,378.2 76.6,378.9 76.6,378.1ZM73.4,377.6 71.9,379.2 71.4,379.3 70.2,379.2 69.9,378.7 70.4,378.0 69.6,377.8 68.7,378.8 66.8,378.8 66.5,378.2 67.7,378.3 66.5,377.8 64.6,378.2 65.1,377.8 64.3,377.4 64.1,375.9 62.4,375.5 63.7,375.0 65.7,374.9 72.2,375.6 73.3,376.8 73.4,377.6ZM43.0,376.1 46.6,376.3 45.9,376.8 46.9,377.0 45.4,376.9 46.1,377.7 44.4,377.6 44.7,378.1 44.3,377.8 44.7,377.0 44.3,376.6 43.3,377.3 42.9,376.5 41.5,376.9 40.7,376.2 42.1,375.2 42.0,375.8 42.7,375.3 43.8,375.9 44.9,375.0 46.6,375.0 44.0,376.0 44.4,376.0 45.0,376.0 45.0,376.2 43.3,375.9 43.0,376.1ZM56.3,375.7 49.7,376.7 50.1,376.3 49.5,375.9 50.0,375.6 50.7,375.7 49.7,375.2 50.8,374.8 51.2,375.9 51.8,375.8 51.1,374.9 51.9,374.8 53.4,375.1 52.9,375.7 53.6,375.1 56.3,375.7ZM45.2,368.3 45.0,367.4 46.8,367.9 46.7,368.4 47.4,368.4 45.1,368.5 42.3,367.2 42.3,367.1 42.7,367.0 41.9,366.6 41.8,365.3 42.2,365.4 41.7,364.8 42.1,364.3 42.7,364.2 44.1,364.7 43.3,363.8 43.3,363.0 44.8,361.7 45.2,361.7 45.8,364.1 45.4,364.8 46.4,366.2 45.5,366.6 43.6,365.3 44.6,366.4 44.3,367.1 45.2,368.3ZM44.6,370.0 47.2,371.9 46.7,371.0 48.3,371.6 45.0,369.9 44.8,369.0 42.0,368.6 41.7,367.7 42.1,367.7 41.5,367.2 48.1,370.4 47.9,369.9 48.9,369.8 47.5,369.2 49.3,368.7 49.4,369.8 50.7,370.5 49.9,371.2 50.8,370.7 51.2,371.2 50.3,371.8 51.0,371.4 51.1,372.0 51.5,371.0 50.4,368.9 52.3,369.7 52.1,370.5 52.5,371.0 52.4,370.0 52.8,370.4 53.3,370.4 52.8,369.4 53.6,369.5 55.7,370.5 53.1,372.8 54.2,372.5 54.5,373.2 54.3,372.4 55.6,371.2 56.3,371.7 56.3,370.5 57.7,370.8 48.5,366.7 48.8,366.6 48.0,365.4 47.7,364.3 47.8,363.7 54.4,361.2 54.7,360.4 54.3,359.6 52.6,359.5 47.4,360.8 45.5,359.7 46.2,359.0 45.3,359.0 45.7,356.1 46.5,355.7 46.4,356.7 47.1,356.6 48.4,355.3 46.7,355.1 46.9,354.0 45.6,353.8 48.0,353.3 49.8,354.4 51.6,353.5 52.5,352.5 52.4,351.4 53.8,350.5 56.3,353.0 59.3,351.5 60.6,352.6 60.5,374.9 60.1,375.0 58.7,374.3 59.8,375.0 56.7,375.7 52.0,374.5 52.6,373.7 52.3,373.3 51.9,374.0 51.8,373.4 51.6,373.0 51.7,374.4 51.1,374.3 51.4,373.7 50.9,373.3 51.0,374.3 49.8,374.5 49.7,372.8 49.6,374.5 48.4,374.6 48.6,373.9 47.9,373.9 48.3,374.4 46.5,374.6 47.8,373.0 47.3,372.9 46.3,374.4 44.4,373.8 43.9,374.3 46.1,374.7 43.7,375.1 42.2,374.3 43.2,373.7 43.2,373.3 41.4,373.5 42.9,372.9 41.6,372.7 41.0,374.0 40.7,373.7 41.6,372.2 39.2,373.0 38.5,372.4 39.2,372.5 39.8,372.2 38.2,371.2 38.3,371.8 37.5,371.7 38.2,371.9 38.2,372.2 36.9,372.9 37.1,371.8 36.6,372.6 35.8,371.7 35.5,372.6 35.7,371.8 33.5,372.5 33.0,372.0 33.2,371.9 33.9,372.1 33.6,371.5 32.6,371.2 33.2,371.3 32.8,370.5 33.6,370.4 35.5,371.7 34.8,370.9 36.7,371.5 33.8,370.2 35.0,370.0 36.7,371.2 37.5,370.9 36.2,370.6 35.9,370.0 38.0,370.6 38.5,370.4 37.5,370.0 38.1,369.7 41.0,370.6 41.9,369.4 43.1,369.3 44.4,369.6 43.4,370.3 42.9,372.2 43.3,371.5 44.1,372.1 43.4,371.4 44.6,370.0Z","11":"M6.1,312.2 3.4,313.5 3.3,312.5 4.5,313.0 6.1,311.9 6.1,312.2ZM3.6,312.4 4.8,312.3 4.6,312.2 5.5,311.6 4.2,312.1 5.6,311.2 4.2,312.1 3.5,312.0 3.2,311.4 3.3,310.5 5.8,310.1 5.8,311.0 5.8,310.2 6.1,310.2 6.1,311.0 5.6,311.2 6.2,311.2 6.3,311.9 6.0,311.6 4.4,312.8 3.6,312.4ZM11.8,310.6 12.5,312.3 12.4,311.7 12.8,311.9 12.7,312.7 11.9,312.9 8.5,311.7 8.4,310.8 9.5,309.9 10.1,309.8 10.6,311.5 10.6,310.9 11.0,310.6 10.1,309.0 10.7,307.2 11.2,307.7 10.9,308.6 11.2,308.2 11.9,309.4 11.9,310.1 11.1,310.1 11.8,310.6ZM6.5,307.3 6.5,307.6 6.5,307.8 6.2,308.4 6.5,308.0 6.9,308.8 6.5,309.0 7.5,309.7 6.9,310.3 7.6,309.8 8.0,310.7 7.7,310.5 7.4,311.2 7.8,310.7 8.1,311.3 8.1,311.9 6.8,312.9 6.5,312.3 7.3,311.9 6.4,312.2 6.9,311.6 6.3,311.8 6.7,310.9 6.1,310.7 6.8,310.0 5.9,309.9 6.5,309.1 5.8,309.8 4.3,310.1 4.1,309.8 5.6,309.3 5.3,309.3 5.7,308.6 5.2,309.2 5.6,308.1 5.2,309.2 4.6,309.3 5.4,307.8 4.5,308.4 3.8,306.9 4.8,306.3 5.0,306.5 4.9,306.8 5.1,306.4 4.8,307.2 5.6,306.0 6.0,306.4 5.5,307.5 6.1,306.7 5.7,307.7 6.5,307.3ZM8.8,308.0 10.4,307.7 9.5,308.9 9.9,308.4 10.1,308.4 10.0,309.7 9.7,309.4 8.4,310.4 7.8,309.3 7.8,309.2 8.1,309.2 7.3,308.6 7.9,308.0 7.0,308.0 7.6,307.5 7.0,307.8 7.3,307.4 6.4,306.7 8.4,306.8 9.5,307.6 8.8,308.0ZM12.6,309.4 12.2,308.8 13.0,307.8 12.0,308.7 11.9,307.7 12.4,307.7 11.9,307.4 12.5,307.4 11.9,307.0 12.5,307.2 13.9,308.6 12.6,309.4ZM10.0,307.3 9.6,307.6 8.2,306.6 7.4,306.7 7.7,306.0 8.4,306.1 7.9,305.9 8.0,305.8 8.8,306.1 8.4,305.8 8.1,305.7 7.8,305.9 7.6,305.8 6.4,306.3 7.5,305.8 6.5,305.8 6.8,305.5 8.1,305.0 8.3,305.2 8.3,304.7 8.7,305.1 8.4,305.4 8.9,305.7 8.8,305.8 10.2,306.4 9.6,306.8 8.6,306.4 7.9,306.3 10.0,307.3ZM8.8,305.1 9.0,304.4 9.7,304.5 9.3,304.2 9.3,304.0 9.5,304.1 9.5,303.9 10.1,304.1 10.1,305.0 9.6,304.8 10.0,305.1 9.8,305.3 9.5,305.4 10.1,305.9 8.6,305.5 8.8,305.2 9.4,305.3 9.1,305.2 8.8,305.1ZM6.8,304.4 5.4,303.9 5.3,303.8 5.5,303.6 5.3,303.3 6.7,303.4 7.1,302.8 7.5,302.6 7.9,303.5 7.1,303.8 8.3,303.8 7.8,304.1 6.8,304.4ZM11.2,294.8 10.6,294.2 10.9,294.1 11.2,294.4 13.2,294.5 13.2,294.9 11.2,294.8ZM10.8,283.2 11.4,282.0 12.1,281.8 11.6,283.6 10.8,283.2ZM14.2,280.1 13.6,280.3 12.2,279.0 13.7,279.1 14.2,280.1ZM7.4,275.3 6.5,274.1 7.1,273.6 8.0,274.5 7.4,275.3ZM12.7,273.1 12.9,273.1 13.9,274.4 12.7,274.4 12.0,273.4 12.7,273.1ZM9.6,271.7 10.0,271.4 10.4,271.5 10.5,272.6 10.0,272.8 9.6,271.7ZM14.6,270.9 12.7,270.8 13.2,271.5 11.8,270.8 12.1,270.3 13.0,270.7 13.9,269.9 14.6,270.9ZM14.5,310.7 13.5,311.4 13.0,311.1 12.6,309.7 14.5,310.7ZM16.3,309.9 16.4,311.0 14.7,309.9 15.4,309.5 15.9,310.0 16.3,309.9ZM14.0,310.3 14.4,310.5 12.7,309.5 14.6,310.2 13.4,309.3 14.1,308.7 14.6,309.9 15.2,310.3 14.5,310.7 14.0,310.3ZM18.2,305.3 14.3,305.6 12.5,304.9 13.5,304.9 12.9,304.5 13.7,304.1 15.1,304.9 13.8,304.0 14.4,303.8 14.9,303.8 15.7,304.2 16.5,304.3 16.5,304.4 16.5,304.4 16.2,304.4 16.1,304.6 15.7,304.6 15.2,304.8 15.8,304.6 16.0,305.3 16.0,304.6 16.2,304.5 16.5,304.4 16.5,304.4 16.6,304.3 16.3,304.1 18.5,304.6 18.2,305.3ZM16.7,283.9 16.9,284.7 16.7,285.2 16.4,285.3 16.6,284.4 16.1,284.6 16.1,284.1 15.6,283.9 16.2,283.4 17.4,283.5 16.7,283.9ZM17.4,283.1 16.1,283.2 15.6,282.0 16.5,281.3 17.3,281.7 17.4,283.1ZM14.7,282.9 12.9,282.9 14.0,283.2 13.4,283.7 12.4,283.3 13.2,280.5 14.7,281.6 14.0,281.5 13.5,281.7 14.7,281.7 14.9,282.3 14.7,282.9ZM15.5,279.3 15.2,278.2 16.2,278.0 16.5,278.6 18.0,278.5 18.4,279.3 18.4,279.5 18.3,279.6 17.7,279.7 16.5,279.7 15.7,279.4 15.6,279.1 15.7,279.5 15.7,279.7 15.5,279.3ZM13.5,277.6 14.3,278.0 14.4,278.2 14.8,278.3 14.5,278.8 14.8,278.8 14.9,279.2 14.6,279.6 14.3,278.1 14.2,278.9 13.8,278.5 14.0,279.3 13.1,278.5 13.5,277.6ZM18.4,278.8 17.9,278.4 16.6,278.6 16.5,277.9 17.8,278.1 15.3,277.6 15.2,276.5 15.2,277.6 14.6,277.7 14.5,276.8 14.9,276.3 18.0,275.9 19.1,277.6 18.9,278.9 18.4,278.8ZM14.7,274.8 16.8,274.9 17.3,275.7 13.3,276.2 13.2,275.9 14.7,274.8ZM12.7,274.9 14.2,274.7 14.3,275.0 13.8,275.4 13.4,275.6 12.7,275.2 12.7,274.9ZM15.3,273.4 13.2,273.0 13.1,272.2 16.4,272.0 17.7,273.0 16.6,273.1 16.8,272.6 16.5,273.2 14.5,274.1 13.6,273.8 13.4,273.5 15.3,273.4ZM13.8,271.8 13.4,271.1 14.6,271.0 14.9,270.7 15.5,271.6 13.8,271.8ZM15.3,270.7 15.8,270.7 14.9,270.2 16.6,270.5 17.0,271.4 15.6,271.5 15.4,271.1 15.4,270.9 16.8,271.0 15.3,270.7ZM15.7,269.0 16.3,269.6 17.3,269.5 17.1,270.5 16.0,270.0 15.7,269.0ZM16.5,268.3 16.2,267.4 16.6,268.0 17.6,268.4 16.5,268.6 16.4,269.4 15.5,268.0 16.5,268.3ZM17.5,263.9 18.1,264.4 16.9,264.5 17.5,265.1 16.9,265.5 15.1,264.6 17.5,263.9ZM24.0,266.3 23.8,265.5 23.7,265.6 24.7,263.7 25.2,264.6 25.6,263.9 26.0,264.2 27.0,264.4 26.1,264.1 26.1,262.5 25.9,263.7 24.4,263.2 25.8,263.4 26.0,262.4 26.2,262.4 26.5,263.7 28.7,264.0 30.0,262.7 30.5,264.3 32.1,265.6 34.3,265.5 34.9,266.7 34.0,267.1 34.6,268.2 34.3,270.2 37.8,269.9 40.2,271.3 39.3,271.9 39.3,273.5 38.6,274.1 37.1,273.4 33.9,274.0 32.2,273.6 32.4,275.0 36.4,275.8 38.3,278.9 36.6,279.9 37.1,281.0 34.7,281.6 34.7,284.5 35.6,284.8 35.9,285.5 35.9,285.8 35.1,286.9 33.5,287.4 34.6,288.0 35.0,288.7 35.7,292.8 33.1,294.2 33.1,295.7 33.7,296.1 33.1,296.8 33.9,297.3 33.9,298.3 32.6,298.0 32.8,298.9 30.0,300.6 30.2,302.0 29.1,303.5 28.5,303.4 28.9,304.1 28.4,305.4 29.3,305.7 29.1,306.6 30.3,307.4 30.9,309.2 29.7,309.5 29.1,311.1 27.9,310.9 28.4,314.0 26.2,315.7 25.0,315.5 23.4,318.1 16.5,313.0 14.4,313.2 14.9,312.4 14.3,312.2 13.7,312.7 13.4,311.9 15.2,310.7 17.2,312.1 16.4,311.1 16.6,310.9 16.5,310.3 18.2,310.0 16.6,310.1 16.3,309.9 15.9,309.9 15.5,309.5 14.7,309.5 15.2,309.2 17.1,309.1 15.6,309.0 14.5,309.3 14.9,308.8 14.2,308.3 14.3,307.9 12.5,306.9 13.4,306.0 12.5,306.8 12.8,306.5 12.0,306.9 11.5,306.6 11.4,306.0 12.4,305.3 14.0,306.0 14.6,308.6 14.8,307.8 15.3,308.3 15.9,307.9 15.2,308.2 14.3,306.0 15.2,305.8 15.4,306.8 15.2,305.8 16.6,305.8 17.8,306.2 17.7,307.1 18.7,306.2 18.8,306.4 18.8,306.7 18.4,307.1 18.5,307.5 19.0,306.8 20.1,307.4 20.2,307.8 19.7,308.5 20.2,307.9 20.9,308.5 21.0,307.7 21.4,307.8 21.8,308.3 22.4,308.4 23.2,308.3 23.5,307.6 23.9,307.7 23.5,306.8 23.1,308.3 21.9,308.2 22.7,307.5 22.7,306.1 22.0,307.8 20.9,307.2 20.0,306.3 20.7,305.8 19.7,306.0 19.5,305.5 19.6,304.6 21.2,305.7 24.6,306.4 20.6,305.2 20.9,304.4 19.0,303.6 19.0,302.6 19.7,302.1 19.0,302.2 19.4,301.5 19.3,301.4 18.7,301.3 19.4,301.5 18.6,302.9 18.7,303.7 17.4,304.3 16.3,303.5 12.5,303.8 12.2,303.7 13.1,303.0 12.1,303.7 11.2,303.4 11.8,302.8 11.1,303.3 10.8,303.1 11.3,302.2 11.5,302.3 11.5,302.1 11.8,302.2 11.3,302.5 11.8,302.3 12.1,302.3 12.1,302.1 11.8,302.2 11.4,301.9 12.3,301.1 12.7,302.1 12.8,301.2 13.5,302.0 12.5,302.8 12.1,302.6 12.3,302.2 12.1,302.3 11.7,302.4 11.9,302.8 12.2,302.6 12.5,302.9 13.0,302.8 14.0,302.3 14.2,303.1 15.1,303.5 15.1,303.4 15.2,303.3 15.9,303.2 15.2,303.2 15.0,303.4 14.6,303.2 14.3,302.4 16.2,302.3 14.4,302.1 16.7,302.1 16.9,301.8 15.6,301.9 17.2,300.9 17.0,300.7 15.5,301.8 14.3,301.9 14.1,301.1 15.3,300.9 15.9,300.3 15.2,300.9 13.3,301.0 13.7,301.3 12.9,300.8 13.0,300.5 13.9,300.5 14.7,299.9 13.8,300.4 12.9,299.9 12.6,300.6 12.4,300.1 14.2,297.9 14.9,298.1 14.8,299.5 15.2,299.6 14.9,298.8 15.5,298.8 15.1,298.5 15.1,298.2 14.9,298.1 14.8,297.9 15.5,298.0 15.7,298.9 15.4,299.0 16.1,299.8 15.6,297.9 16.2,297.6 16.3,298.2 16.6,297.4 17.0,298.4 17.5,297.9 17.0,298.2 16.7,297.5 16.6,297.4 16.6,297.4 16.4,297.6 16.3,297.5 17.1,296.3 15.6,297.7 15.2,297.6 14.8,297.0 15.3,296.0 16.0,296.5 16.3,295.8 16.4,296.0 17.0,296.1 17.6,295.4 15.9,295.8 14.9,294.6 15.9,294.2 14.9,294.6 13.4,293.8 14.6,293.9 16.1,293.3 15.6,293.1 16.0,292.9 16.1,292.8 14.5,293.6 14.1,293.2 14.5,293.6 14.1,293.7 13.9,293.4 13.9,293.7 11.8,293.2 12.9,293.7 11.2,294.4 10.9,294.1 10.0,293.9 10.0,293.7 10.5,293.4 10.1,293.7 10.1,293.7 10.0,293.8 10.0,294.0 9.9,294.1 7.8,292.3 9.1,290.3 6.9,292.4 6.9,291.9 6.7,291.7 6.6,292.4 3.4,293.0 4.0,293.4 3.5,294.1 4.3,293.1 4.6,293.3 4.8,293.2 5.6,293.3 4.8,294.0 5.3,293.6 5.7,294.4 5.0,294.8 6.0,294.7 5.9,294.2 6.1,294.5 6.1,295.0 4.0,295.4 2.8,293.2 3.4,291.8 4.5,292.2 4.2,291.7 4.7,291.8 4.1,291.2 4.9,291.5 5.0,291.0 5.6,291.0 5.2,290.6 5.3,290.4 5.9,290.8 5.7,290.0 6.8,289.8 6.7,290.2 7.0,290.5 6.8,289.0 8.1,289.7 9.2,289.7 7.4,289.3 8.2,288.9 7.6,288.8 7.9,288.2 9.4,289.0 8.9,288.3 9.2,287.6 10.3,288.2 11.2,287.7 10.0,287.3 10.3,286.5 11.2,286.4 11.6,286.6 11.6,286.5 11.9,286.5 11.7,286.3 10.6,286.3 10.9,285.0 9.2,287.1 7.7,286.6 7.7,286.4 9.4,286.3 9.8,286.0 8.2,286.1 7.9,285.9 8.3,285.9 8.5,285.6 8.9,285.7 8.4,285.5 7.7,285.7 7.6,284.8 10.0,285.5 8.7,284.7 9.5,285.0 10.5,284.2 10.6,285.0 12.2,284.5 12.9,286.5 13.2,285.5 13.7,285.8 12.7,284.6 13.3,284.7 12.9,284.4 12.8,284.0 14.1,284.1 14.2,284.8 14.6,284.2 15.5,284.1 15.9,284.5 15.8,284.1 16.0,284.5 15.9,284.6 14.3,285.0 15.2,284.9 15.6,285.0 15.8,285.1 15.0,285.5 16.1,285.1 16.3,285.7 13.9,286.1 15.9,286.2 15.9,287.1 13.7,287.2 16.0,287.2 16.3,285.9 16.8,286.3 16.5,287.5 16.2,287.8 15.1,288.2 14.0,288.5 12.7,287.9 14.0,288.6 16.4,287.8 16.0,288.4 16.9,288.3 16.6,288.8 17.8,289.5 16.9,288.2 16.5,288.3 16.8,287.4 18.6,288.3 17.7,291.3 17.4,290.9 17.1,291.1 16.7,292.1 17.1,291.4 18.0,291.8 18.3,290.9 18.7,290.9 18.7,291.2 18.9,291.3 19.0,291.3 19.0,291.4 19.2,291.4 19.7,291.0 18.9,291.3 18.4,290.0 19.9,289.0 21.4,289.7 21.9,289.5 22.0,289.6 22.2,289.6 22.2,289.8 22.4,289.8 22.3,290.0 22.6,290.3 22.4,289.8 22.3,289.8 22.2,289.6 22.1,289.6 22.0,289.6 21.9,289.5 21.9,289.5 21.4,289.7 21.1,289.0 20.0,288.7 21.4,286.5 23.0,286.0 21.4,286.1 22.0,285.0 22.7,284.9 23.3,284.3 23.9,284.8 24.5,284.8 23.9,284.6 23.3,284.2 22.6,284.8 20.3,284.5 21.5,283.0 23.5,282.5 22.3,282.5 22.2,282.3 22.3,282.0 22.6,281.9 22.3,281.9 20.0,283.8 20.5,280.7 21.4,280.1 21.4,280.9 21.4,279.9 21.9,279.5 22.1,280.1 21.9,279.5 23.0,278.9 24.6,280.5 25.9,280.8 26.4,280.1 25.2,280.2 22.9,278.4 21.9,278.9 21.1,278.7 20.8,278.4 20.5,278.4 20.4,278.0 20.8,278.1 21.0,278.6 21.1,277.9 22.1,277.9 22.4,276.7 21.6,276.7 21.7,275.5 23.8,275.5 26.7,273.5 27.2,273.9 27.2,273.8 27.2,273.7 27.5,273.8 27.9,273.6 27.9,273.4 28.2,273.3 28.2,273.2 28.2,273.2 28.3,273.0 28.4,273.0 28.6,272.8 28.9,272.8 29.0,272.8 29.2,272.7 29.2,272.6 29.3,272.6 29.3,272.6 29.5,272.6 29.3,272.6 29.3,272.6 29.2,272.6 29.0,272.7 29.0,272.8 28.9,272.8 28.7,272.8 28.6,272.8 28.4,273.0 28.3,272.9 27.5,273.8 27.2,273.6 27.2,273.7 27.2,273.7 27.2,273.8 26.9,273.6 27.4,271.4 29.0,271.6 27.8,270.7 28.2,269.3 27.3,271.1 26.1,270.0 26.6,269.8 25.3,269.7 25.9,268.9 23.1,268.5 23.2,268.1 24.3,267.8 23.7,267.8 23.8,267.2 22.4,267.9 22.5,267.1 22.9,267.5 23.1,267.5 22.9,266.7 23.9,266.9 23.4,266.2 23.7,265.7 24.0,266.3ZM17.2,286.0 19.3,286.7 18.6,288.1 17.0,286.9 17.2,286.0ZM19.4,285.8 21.9,285.0 19.9,288.6 19.1,289.3 19.6,288.2 19.4,285.8ZM17.8,285.9 17.0,285.4 17.5,284.6 18.2,284.6 18.0,284.3 18.7,284.0 18.9,284.1 19.3,284.9 19.2,286.3 18.0,286.0 18.8,284.8 17.9,284.8 18.4,284.9 17.8,285.9ZM18.1,282.0 19.1,280.4 20.1,280.8 20.0,282.5 19.1,282.1 19.8,282.8 19.5,283.7 18.0,282.6 17.9,282.5 18.1,282.0ZM16.1,281.4 15.5,281.9 15.4,281.4 15.9,280.6 16.7,280.6 16.1,280.3 17.5,280.6 17.5,280.9 17.8,280.5 18.2,280.6 17.7,281.7 17.4,281.1 16.1,281.4ZM18.1,279.7 17.4,280.5 16.1,280.2 16.6,279.8 18.1,279.7ZM17.5,273.7 18.6,275.1 18.3,275.6 17.1,274.6 17.7,275.0 18.1,274.9 17.1,274.2 17.5,273.7ZM18.6,273.5 19.8,273.5 19.7,274.3 19.0,274.4 18.6,273.5ZM24.2,274.8 22.4,275.3 21.4,274.2 22.3,273.9 23.3,274.1 22.4,273.4 21.6,274.0 20.9,272.4 21.4,271.7 21.7,271.9 21.7,272.4 22.9,272.3 22.3,271.4 23.6,271.7 22.6,270.4 23.8,270.6 23.6,270.2 23.8,270.3 24.0,270.1 24.5,271.0 24.3,270.2 24.0,270.1 23.9,270.2 23.8,269.9 24.8,269.6 25.4,270.5 24.7,271.8 25.7,270.3 27.1,271.4 26.2,272.5 24.8,271.8 26.3,272.7 24.2,274.8ZM18.5,273.5 17.4,271.9 18.1,272.6 18.0,271.6 18.5,271.3 19.6,271.6 19.0,271.5 19.8,271.9 19.7,272.2 18.7,273.3 19.5,272.7 20.0,273.1 19.8,273.3 19.6,273.1 18.5,273.5ZM18.0,269.6 16.8,269.3 16.6,268.8 18.2,268.7 18.0,269.6ZM18.9,265.3 19.9,266.7 19.3,267.4 18.5,265.9 18.9,265.3Z","3":"M61.0,79.0 60.7,80.5 62.4,87.8 61.0,88.9 60.7,90.9 63.4,95.2 63.1,96.4 61.6,96.6 60.8,97.8 60.0,97.0 58.6,97.6 58.9,99.0 57.5,100.3 57.8,101.2 56.9,102.2 56.3,105.0 54.1,108.3 53.6,107.8 52.0,110.0 50.9,117.3 49.5,117.9 49.0,119.3 49.5,121.0 47.7,121.3 46.7,119.8 45.4,119.8 44.6,116.4 41.7,117.3 40.5,119.6 39.3,117.9 36.9,117.8 36.7,115.2 38.5,112.8 38.4,111.7 39.6,109.6 39.5,107.0 40.5,102.9 41.8,102.2 41.2,97.7 42.7,96.0 42.3,94.8 43.6,91.7 43.4,89.9 44.0,89.5 43.8,86.6 46.7,85.0 48.5,85.7 49.9,84.9 53.1,85.5 53.7,84.6 55.3,84.6 56.6,84.0 57.4,79.8 59.1,80.0 61.0,79.0Z","4":"M36.0,129.0 37.7,127.8 37.5,126.0 38.7,125.1 38.1,123.6 38.6,122.2 38.3,119.5 36.9,117.8 39.3,117.9 40.5,119.6 41.7,117.3 44.6,116.4 45.4,119.8 46.7,119.8 47.7,121.3 49.5,121.0 50.2,124.6 49.4,126.9 50.7,127.5 50.0,129.5 47.9,129.5 48.2,130.3 46.5,135.3 46.9,136.4 45.9,137.7 45.4,136.8 44.9,137.9 44.5,142.0 45.3,143.0 45.4,144.4 47.4,145.6 46.0,146.4 46.7,147.4 46.5,148.7 45.6,148.7 45.4,147.7 43.9,147.4 43.1,146.2 41.5,146.8 40.6,146.3 39.9,147.5 38.2,148.0 36.5,147.8 36.8,143.7 35.1,133.2 35.8,128.4 36.0,129.0Z","5":"M37.4,152.4 37.1,151.2 37.6,150.0 37.1,149.4 37.1,148.7 36.7,148.4 36.5,147.8 38.2,148.0 39.1,147.3 39.6,147.7 40.6,146.3 41.5,146.8 43.1,146.2 43.9,147.4 45.4,147.7 45.6,148.7 47.3,149.2 47.2,150.3 48.1,151.4 47.9,153.3 49.2,155.0 47.1,157.9 45.7,156.2 45.0,156.9 44.2,155.4 40.8,155.8 41.0,158.0 39.2,158.3 39.1,159.7 38.1,160.2 38.2,162.1 37.4,162.8 38.0,163.6 36.5,163.7 36.4,164.7 35.0,165.6 34.1,165.2 34.2,164.6 35.5,163.1 35.8,161.5 36.0,161.4 35.1,160.3 35.6,159.0 34.8,157.0 36.5,155.9 36.5,153.7 37.4,152.4Z","13":"M40.8,155.8 44.3,155.5 45.0,156.9 45.9,156.3 47.0,157.8 48.4,156.5 49.1,159.2 49.8,158.4 50.8,158.9 49.9,165.6 50.6,166.1 50.2,167.3 50.7,168.5 48.7,168.8 47.8,166.4 46.4,166.6 45.6,164.5 42.6,165.3 41.7,167.4 40.4,167.8 38.5,166.3 37.8,166.8 35.1,165.7 36.4,164.7 36.5,163.7 38.0,163.6 37.4,162.8 38.2,162.1 38.1,160.2 39.1,159.7 39.2,158.3 41.0,158.0 40.8,155.8Z","10":"M9.5,261.6 10.3,261.2 11.9,262.3 10.1,262.8 9.5,261.6ZM19.7,251.7 20.3,252.8 19.9,253.1 19.7,252.5 18.5,252.3 19.7,251.7ZM18.1,244.8 19.1,244.0 20.7,244.3 20.0,245.5 21.2,246.7 20.6,247.6 21.8,248.7 21.7,249.4 19.1,249.9 19.0,250.8 19.9,251.3 18.2,251.3 18.7,250.6 18.4,250.3 18.0,251.4 18.4,251.5 18.1,252.1 20.6,253.9 20.8,254.8 19.9,254.9 19.6,254.0 19.2,254.5 19.8,254.9 18.4,254.5 20.1,255.7 20.4,256.7 19.5,256.5 20.7,257.3 18.8,257.5 18.6,256.9 18.4,258.1 19.2,259.2 17.4,258.8 18.1,259.5 17.6,260.3 16.3,259.9 16.2,259.5 15.5,259.9 15.2,259.5 13.9,259.3 13.0,258.6 15.1,254.5 15.4,252.5 14.7,251.1 15.0,248.7 15.9,247.5 15.9,245.4 16.4,245.0 15.9,244.0 17.2,243.7 17.4,244.6 16.4,244.5 18.1,244.8ZM21.4,251.8 19.2,249.9 20.4,250.0 20.4,250.6 21.3,251.4 21.4,251.8ZM24.3,243.0 23.5,243.6 22.7,244.0 21.2,243.6 21.7,244.1 18.3,243.4 19.2,242.0 20.1,242.4 20.6,241.3 21.7,241.2 21.9,241.0 20.7,241.1 19.6,242.1 18.8,240.9 19.0,242.0 18.1,241.9 17.6,240.6 16.8,235.8 17.6,235.2 17.7,232.7 18.7,231.5 18.2,230.6 18.4,228.9 18.9,228.4 23.9,229.5 27.8,232.8 34.2,231.8 33.1,233.5 34.3,236.6 33.5,239.6 34.1,240.3 34.3,241.8 33.7,242.1 34.8,243.9 34.5,245.6 35.0,247.1 33.5,247.9 31.3,247.4 31.7,249.8 32.7,250.9 31.3,253.0 31.8,255.4 35.0,258.0 34.9,259.1 33.6,259.2 33.3,259.9 33.8,261.5 36.2,262.5 34.8,263.9 35.6,265.5 34.9,266.7 33.9,265.3 32.1,265.6 30.5,264.4 30.0,262.7 28.7,264.0 26.5,263.7 26.2,262.4 25.8,263.4 24.2,263.4 25.6,262.1 24.2,261.3 24.1,259.2 25.6,258.3 25.7,256.3 27.1,257.1 26.1,255.5 26.8,255.7 26.9,255.1 25.8,253.7 26.1,251.1 28.8,251.8 25.9,248.9 28.0,247.9 29.1,251.0 29.6,250.9 28.9,249.0 29.7,248.5 29.0,248.0 29.9,247.7 29.0,247.4 29.3,245.7 27.7,246.4 25.6,245.1 27.5,243.3 29.0,243.3 30.2,242.6 30.5,239.9 30.0,239.9 29.6,242.6 28.1,243.2 27.5,243.0 26.7,241.3 25.1,240.7 23.8,241.9 24.3,243.0Z","14":"M25.4,220.3 31.0,220.7 30.6,221.1 31.0,221.3 33.4,220.2 35.2,221.0 35.3,224.4 36.1,225.1 35.4,227.0 34.2,226.9 34.2,228.2 35.6,229.6 34.2,230.2 33.0,232.3 27.8,232.8 23.9,229.5 18.7,228.4 18.6,228.0 19.2,227.3 18.8,226.1 20.7,224.5 21.2,225.4 21.5,224.9 21.9,225.5 22.1,225.5 22.1,225.5 22.1,225.7 22.2,225.8 22.8,225.4 22.5,224.7 23.5,225.3 23.5,224.9 23.0,224.6 22.4,224.7 22.4,224.4 22.6,224.1 22.7,224.2 22.8,224.2 23.0,223.9 23.2,224.0 23.0,223.8 22.5,224.0 22.7,223.3 23.9,223.1 23.1,222.9 23.5,221.9 22.1,223.5 22.4,223.6 22.2,224.6 21.7,224.1 21.3,224.7 21.3,222.9 22.5,221.4 22.6,219.9 25.7,218.9 25.4,220.3Z","9":"M24.0,202.2 28.7,202.5 29.5,204.4 31.9,206.0 33.0,205.9 33.8,206.8 34.9,206.4 35.6,209.1 37.9,206.9 40.3,206.9 41.0,207.7 41.1,210.3 42.4,212.0 41.6,213.6 40.2,213.5 37.4,215.3 37.9,218.8 36.6,221.3 37.1,221.6 36.8,222.4 33.4,220.2 31.0,221.3 30.6,221.1 31.0,220.7 25.4,220.3 25.7,218.9 22.6,219.9 22.7,218.5 20.3,210.8 21.4,210.0 22.3,210.9 21.9,209.4 23.9,207.8 23.9,207.0 22.9,206.4 24.4,204.1 24.4,203.2 23.6,202.9 24.0,202.2Z","8":"M22.3,210.4 21.9,210.8 21.4,210.0 20.3,210.8 20.9,206.8 19.1,203.2 19.7,200.6 19.0,199.4 19.8,197.5 21.3,198.4 23.0,197.7 23.3,194.5 22.8,193.7 23.5,193.5 23.2,193.1 23.6,192.1 23.7,193.2 24.6,193.3 24.6,191.8 25.4,190.5 26.1,190.6 26.2,192.1 27.9,193.3 28.4,194.5 27.4,195.2 29.6,195.1 31.2,196.3 30.5,197.9 36.3,197.3 36.8,196.0 37.6,196.9 40.2,197.1 39.1,198.7 40.0,200.9 39.2,202.9 39.9,204.2 39.5,204.6 41.0,207.1 37.9,206.9 35.6,209.1 34.9,206.4 33.8,206.8 33.0,205.9 31.9,206.0 29.5,204.4 28.7,202.5 27.4,202.7 26.4,201.8 24.0,202.2 23.6,202.9 24.4,203.2 24.4,204.1 22.9,206.5 23.9,207.0 23.9,207.8 21.8,209.7 22.3,210.4Z","16":"M29.9,195.5 27.4,195.2 28.4,194.5 27.9,193.3 26.2,192.1 26.1,190.6 25.5,190.4 26.5,186.1 29.8,187.6 29.7,188.6 31.6,188.5 32.1,187.3 33.0,188.6 34.3,188.5 38.2,191.4 38.7,190.4 40.5,189.9 40.9,192.9 40.0,192.8 39.5,194.4 40.1,195.7 39.1,195.8 40.2,197.1 37.6,196.9 36.8,196.0 36.3,197.3 30.5,198.0 31.3,196.5 29.9,195.5Z","7":"M32.5,172.9 35.1,175.4 35.5,174.6 38.0,175.1 37.9,174.3 39.9,173.9 42.8,174.6 44.1,175.9 44.7,175.3 46.2,176.1 46.1,177.7 44.4,178.7 45.6,179.2 45.5,180.6 46.1,181.2 45.7,182.4 46.6,184.1 45.7,184.8 46.2,185.2 45.7,187.6 44.4,187.4 43.4,188.7 43.3,190.3 41.9,190.0 41.2,191.0 40.0,189.6 38.2,191.4 34.3,188.5 33.0,188.6 32.1,187.3 31.6,188.5 29.7,188.6 29.4,188.1 30.0,187.7 28.7,187.4 28.7,186.7 26.4,186.1 28.1,183.9 27.7,181.6 28.8,180.6 29.6,178.2 31.1,177.1 31.3,174.9 32.5,172.9Z","6":"M32.9,169.6 32.7,167.3 34.1,165.0 36.1,166.3 38.5,166.3 40.4,167.8 41.7,167.4 42.6,165.3 45.5,164.5 46.4,166.6 47.8,166.4 49.1,169.9 46.6,173.5 47.1,174.0 46.2,176.1 44.7,175.3 44.1,175.9 42.8,174.6 39.9,173.9 37.9,174.3 38.0,175.1 35.5,174.6 35.1,175.4 32.3,172.9 32.4,170.3 32.9,169.6Z","0":"M19.3,317.7 25.6,317.7 25.6,324.1 19.3,323.9 19.3,317.7Z"},"names":{"15":"Arica y Parinacota","1":"Tarapacá","2":"Antofagasta","3":"Atacama","4":"Coquimbo","5":"Valparaíso","13":"Metropolitana","6":"O'Higgins","7":"Maule","16":"Ñuble","8":"Biobío","9":"La Araucanía","14":"Los Ríos","10":"Los Lagos","11":"Aysén","12":"Magallanes"},"box":[2.5,1.0,76.0,384.1]};
const REG_ORDER=['15','1','2','3','4','5','13','6','7','16','8','9','14','10','11','12'];
const COMUNAS=[["Santiago",-33.45,-70.667,"13"],["Cerro Navia",-33.417,-70.717,"13"],["El Bosque",-33.567,-70.7,"13"],["Huechuraba",-33.35,-70.667,"13"],["La Cisterna",-33.55,-70.683,"13"],["La Granja",-33.583,-70.583,"13"],["La Reina",-33.45,-70.55,"13"],["Lo Barnechea",-33.35,-70.517,"13"],["Lo Prado",-33.433,-70.717,"13"],["Maipú",-33.517,-70.767,"13"],["Pedro Aguirre Cerda",-33.492,-70.678,"13"],["Providencia",-33.433,-70.617,"13"],["Quilicura",-33.367,-70.75,"13"],["San Joaquín",-33.5,-70.617,"13"],["San Ramón",-33.45,-70.5,"13"],["Puente Alto",-33.617,-70.583,"13"],["Padre Hurtado",-33.567,-70.833,"13"],["El Monte",-33.683,-71.017,"13"],["San Pedro",-33.9,-71.467,"13"],["Curacaví",-33.4,-71.15,"13"],["Melipilla",-33.7,-71.217,"13"],["Calera de Tango",-33.65,-70.817,"13"],["San Bernardo",-33.6,-70.717,"13"],["Lampa",-33.283,-70.9,"13"],["San José de Maipo",-33.633,-70.367,"13"],["Peñaflor",-33.617,-70.917,"13"],["Isla de Maipo",-33.75,-70.9,"13"],["Talagante",-33.667,-70.933,"13"],["María Pinto",-33.533,-71.133,"13"],["Paine",-33.817,-70.75,"13"],["Buin",-33.733,-70.75,"13"],["Tiltil",-33.083,-70.933,"13"],["Colina",-33.2,-70.683,"13"],["Pirque",-33.633,-70.55,"13"],["Vitacura",-33.4,-70.6,"13"],["San Miguel",-33.5,-70.667,"13"],["Renca",-33.4,-70.733,"13"],["Quinta Normal",-33.45,-70.7,"13"],["Pudahuel",-33.433,-70.717,"13"],["Peñalolén",-33.483,-70.533,"13"],["Ñuñoa",-33.467,-70.6,"13"],["Macul",-33.5,-70.567,"13"],["Lo Espejo",-33.533,-70.717,"13"],["Las Condes",-33.417,-70.583,"13"],["La Pintana",-33.583,-70.617,"13"],["La Florida",-33.55,-70.567,"13"],["Independencia",-33.422,-70.655,"13"],["Estación Central",-33.463,-70.703,"13"],["Conchalí",-33.35,-70.617,"13"],["Cerrillos",-33.483,-70.7,"13"],["Arica",-18.475,-70.314,"15"],["Camarones",-19.017,-69.867,"15"],["Putre",-18.192,-69.598,"15"],["General Lagos",-17.567,-69.5,"15"],["Iquique",-20.217,-70.167,"1"],["Alto Hospicio",-20.25,-70.117,"1"],["Pozo Almonte",-20.267,-69.783,"1"],["Camiña",-19.3,-69.417,"1"],["Colchane",-19.267,-68.617,"1"],["Huara",-19.967,-69.767,"1"],["Pica",-20.5,-69.333,"1"],["Antofagasta",-23.633,-70.4,"2"],["Mejillones",-23.1,-70.45,"2"],["Sierra Gorda",-22.883,-69.317,"2"],["Taltal",-25.283,-69.767,"2"],["Calama",-22.467,-68.917,"2"],["Ollague",-21.217,-68.267,"2"],["San Pedro de Atacama",-22.917,-68.217,"2"],["María Elena",-22.35,-69.667,"2"],["Tocopilla",-22.067,-70.2,"2"],["Copiapó",-27.367,-70.317,"3"],["Caldera",-27.067,-70.817,"3"],["Tierra Amarilla",-27.467,-70.267,"3"],["Chañaral",-26.333,-70.6,"3"],["Diego de Almagro",-26.367,-70.05,"3"],["Vallenar",-28.567,-70.75,"3"],["Alto del Carmen",-28.934,-70.462,"3"],["Freirina",-28.5,-71.067,"3"],["Huasco",-28.45,-71.217,"3"],["Río Hurtado",-30.267,-70.7,"4"],["Monte Patria",-30.683,-70.933,"4"],["Ovalle",-30.583,-71.2,"4"],["Los Vilos",-31.9,-71.517,"4"],["Illapel",-31.617,-71.15,"4"],["Paiguano",-30.017,-70.517,"4"],["Andacollo",-30.217,-71.083,"4"],["La Serena",-29.9,-71.25,"4"],["Punitaqui",-30.9,-71.267,"4"],["Combarbalá",-31.167,-71.05,"4"],["Salamanca",-31.767,-70.967,"4"],["Canela",-31.4,-71.45,"4"],["Vicuña",-30.017,-70.7,"4"],["La Higuera",-29.5,-71.267,"4"],["Coquimbo",-29.95,-71.333,"4"],["Valparaíso",-33.046,-71.616,"5"],["Concón",-32.917,-71.517,"5"],["Puchuncaví",-32.733,-71.417,"5"],["Los Andes",-32.817,-70.617,"5"],["Viña del Mar",-33.033,-71.533,"5"],["Rinconada",-32.833,-70.7,"5"],["La Ligua",-32.45,-71.217,"5"],["Papudo",-32.517,-71.45,"5"],["Zapallar",-32.533,-71.467,"5"],["Calera",-32.783,-71.217,"5"],["San Antonio",-33.6,-71.617,"5"],["Cartagena",-33.55,-71.6,"5"],["El Tabo",-33.45,-71.667,"5"],["San Felipe",-32.75,-70.733,"5"],["Llaillay",-32.85,-70.967,"5"],["La Cruz",-32.817,-71.233,"5"],["Villa Alemana",-33.05,-71.367,"5"],["Limache",-32.983,-71.283,"5"],["Putaendo",-32.633,-70.733,"5"],["Olmué",-33.0,-71.2,"5"],["Quilpué",-33.05,-71.45,"5"],["Santa María",-32.75,-70.667,"5"],["Panquehue",-32.8,-70.833,"5"],["Catemu",-32.633,-71.033,"5"],["Santo Domingo",-33.633,-71.65,"5"],["El Quisco",-33.4,-71.7,"5"],["Algarrobo",-33.391,-71.693,"5"],["Nogales",-32.717,-71.233,"5"],["Hijuelas",-32.8,-71.167,"5"],["Quillota",-32.883,-71.267,"5"],["Petorca",-32.25,-70.933,"5"],["Cabildo",-32.417,-71.133,"5"],["San Esteban",-32.8,-70.583,"5"],["Calle Larga",-32.85,-70.633,"5"],["Isla de Pascua",-27.083,-109.375,"5"],["Quintero",-32.783,-71.533,"5"],["Juan Fernández",-33.617,-78.867,"5"],["Casablanca",-33.317,-71.417,"5"],["Rancagua",-34.165,-70.74,"6"],["Coinco",-34.267,-70.967,"6"],["Doñihue",-34.233,-70.967,"6"],["Las Cabras",-34.3,-71.317,"6"],["Malloa",-34.45,-70.95,"6"],["Olivar",-34.21,-70.817,"6"],["San Vicente",-34.5,-71.133,"6"],["Marchihue",-34.4,-71.633,"6"],["Paredones",-34.783,-71.167,"6"],["Chépica",-34.733,-71.283,"6"],["Lolol",-34.729,-71.645,"6"],["Palmilla",-34.6,-71.367,"6"],["Santa Cruz",-34.633,-71.367,"6"],["Placilla",-34.633,-71.117,"6"],["La Estrella",-34.2,-71.667,"6"],["Rengo",-34.417,-70.867,"6"],["Pichidegua",-34.35,-71.3,"6"],["Pumanque",-34.6,-71.667,"6"],["Peralillo",-34.483,-71.483,"6"],["Nancagua",-34.667,-71.217,"6"],["Chimbarongo",-34.7,-71.05,"6"],["San Fernando",-34.583,-70.967,"6"],["Navidad",-33.933,-71.833,"6"],["Litueche",-34.117,-71.733,"6"],["Pichilemu",-34.383,-72.0,"6"],["Requínoa",-34.283,-70.833,"6"],["Quinta de Tilcoco",-34.35,-70.983,"6"],["Peumo",-34.4,-71.167,"6"],["Mostazal",-33.983,-70.7,"6"],["Machalí",-34.182,-70.651,"6"],["Graneros",-34.065,-70.727,"6"],["Codegua",-34.033,-70.667,"6"],["Talca",-35.433,-71.667,"7"],["Curepto",-35.083,-72.017,"7"],["Maule",-35.533,-71.7,"7"],["Pencahue",-35.4,-71.817,"7"],["San Clemente",-35.55,-71.483,"7"],["Cauquenes",-35.967,-72.35,"7"],["Pelluhue",-35.833,-72.633,"7"],["Hualañé",-34.977,-71.805,"7"],["Molina",-34.117,-71.283,"6"],["Romeral",-34.967,-71.133,"7"],["Teno",-34.867,-71.183,"7"],["Linares",-35.85,-71.6,"7"],["Longaví",-35.967,-71.683,"7"],["Retiro",-36.05,-71.767,"7"],["Villa Alegre",-35.667,-71.75,"7"],["Constitución",-35.333,-72.417,"7"],["Empedrado",-35.6,-72.283,"7"],["Pelarco",-35.383,-71.45,"7"],["Río Claro",-35.283,-71.267,"7"],["San Rafael",-35.317,-71.533,"7"],["Curicó",-34.983,-71.233,"7"],["Chanco",-35.733,-72.533,"7"],["Licantén",-34.983,-72.0,"7"],["Rauco",-34.933,-71.317,"7"],["Sagrada Familia",-35.0,-71.383,"7"],["Vichuquén",-34.883,-72.0,"7"],["Colbún",-35.7,-71.417,"7"],["Parral",-36.15,-71.833,"7"],["San Javier",-35.6,-71.75,"7"],["Yerbas Buenas",-35.75,-71.583,"7"],["Concepción",-36.833,-73.05,"8"],["Chiguayante",-36.917,-73.017,"8"],["Hualqui",-36.967,-72.933,"8"],["Penco",-36.733,-72.983,"8"],["Santa Juana",-37.167,-72.933,"8"],["Tomé",-36.617,-72.95,"8"],["Lebu",-37.617,-73.65,"8"],["Cañete",-37.8,-73.383,"8"],["Curanilahue",-37.467,-73.35,"8"],["Tirúa",-38.333,-73.5,"8"],["Antuco",-37.333,-71.683,"8"],["Laja",-37.267,-72.7,"8"],["Nacimiento",-37.5,-72.667,"8"],["Quilaco",-37.667,-71.983,"8"],["San Rosendo",-37.267,-72.717,"8"],["Tucapel",-37.283,-71.95,"8"],["Alto Biobío",-38.05,-71.317,"8"],["Bulnes",-36.742,-72.301,"16"],["Coelemu",-36.483,-72.7,"16"],["Chillán Viejo",-36.617,-72.133,"16"],["Ninhue",-36.4,-72.4,"16"],["Pemuco",-36.967,-72.1,"16"],["Portezuelo",-36.533,-72.433,"16"],["Quirihue",-36.283,-72.533,"16"],["Treguaco",-36.433,-72.667,"16"],["San Ignacio",-36.8,-72.033,"16"],["San Carlos",-36.425,-71.958,"16"],["Yungay",-37.117,-72.017,"16"],["San Nicolás",-36.5,-72.217,"16"],["San Fabián",-36.55,-71.55,"16"],["Ránquil",-36.65,-72.55,"16"],["Quillón",-36.733,-72.467,"16"],["Pinto",-36.7,-71.9,"16"],["Ñiquén",-36.3,-71.9,"16"],["El Carmen",-36.899,-72.032,"16"],["Coihueco",-36.617,-71.833,"16"],["Cobquecura",-36.133,-72.783,"16"],["Chillán",-36.6,-72.117,"16"],["Yumbel",-37.133,-72.533,"8"],["Santa Bárbara",-37.667,-72.017,"8"],["Quilleco",-37.467,-71.967,"8"],["Negrete",-37.583,-72.517,"8"],["Mulchén",-37.717,-72.233,"8"],["Cabrero",-37.033,-72.4,"8"],["Los Angeles",-37.467,-72.35,"8"],["Los Alamos",-37.617,-73.467,"8"],["Contulmo",-38.0,-73.233,"8"],["Arauco",-37.25,-73.317,"8"],["Hualpén",-36.783,-73.083,"8"],["Talcahuano",-36.717,-73.117,"8"],["San Pedro de la Paz",-36.833,-73.117,"8"],["Lota",-37.087,-73.156,"8"],["Florida",-36.817,-72.667,"8"],["Coronel",-37.017,-73.133,"8"],["Temuco",-38.75,-72.667,"9"],["Cunco",-38.917,-72.033,"9"],["Freire",-38.95,-72.633,"9"],["Gorbea",-39.1,-72.683,"9"],["Loncoche",-39.367,-72.633,"9"],["Nueva Imperial",-38.733,-72.95,"9"],["Perquenco",-38.417,-72.383,"9"],["Pucón",-39.267,-71.967,"9"],["Teodoro Schmidt",-38.967,-73.05,"9"],["Vilcún",-39.118,-72.379,"9"],["Cholchol",-38.6,-72.85,"9"],["Collipulli",-37.95,-72.433,"9"],["Ercilla",-38.05,-72.383,"9"],["Los Sauces",-37.967,-72.833,"9"],["Purén",-38.017,-73.083,"9"],["Traiguén",-38.25,-72.683,"9"],["Carahue",-38.7,-73.167,"9"],["Curarrehue",-39.35,-71.583,"9"],["Galvarino",-38.4,-72.783,"9"],["Lautaro",-38.529,-72.435,"9"],["Padre Las Casas",-38.767,-72.6,"9"],["Pitrufquén",-38.983,-72.65,"9"],["Toltén",-39.217,-73.233,"9"],["Villarrica",-39.267,-72.217,"9"],["Angol",-37.8,-72.717,"9"],["Curacautín",-38.433,-71.883,"9"],["Lonquimay",-38.433,-71.233,"9"],["Lumaco",-38.15,-72.917,"9"],["Renaico",-37.667,-72.583,"9"],["Victoria",-38.217,-72.333,"9"],["Saavedra",-38.783,-73.4,"9"],["Melipeuco",-38.85,-71.7,"9"],["Valdivia",-39.8,-73.233,"14"],["Corral",-39.867,-73.433,"14"],["Lanco",-39.433,-72.767,"14"],["Los Lagos",-39.85,-72.833,"14"],["Máfil",-39.65,-72.95,"14"],["Mariquina",-39.517,-72.967,"14"],["Paillaco",-40.067,-72.883,"14"],["Panguipulli",-39.633,-72.333,"14"],["La Unión",-40.283,-73.083,"14"],["Futrono",-40.133,-72.4,"14"],["Lago Ranco",-40.317,-72.5,"14"],["Río Bueno",-40.317,-72.967,"14"],["Puerto Montt",-41.467,-72.933,"10"],["Cochamó",-41.5,-72.317,"10"],["Frutillar",-41.117,-73.1,"10"],["Puerto Varas",-41.317,-72.983,"10"],["Ancud",-41.867,-73.833,"10"],["Curaco de Vélez",-42.433,-73.583,"10"],["Puqueldón",-42.583,-73.633,"10"],["Quellón",-43.1,-73.6,"10"],["Quinchao",-42.533,-73.417,"10"],["Puerto Octay",-40.967,-72.9,"10"],["Puyehue",-40.667,-72.617,"14"],["Hualaihué",-42.017,-72.683,"10"],["Chaitén",-42.919,-72.709,"10"],["San Juan de la Costa",-40.517,-73.4,"10"],["Llanquihue",-41.25,-73.017,"10"],["Calbuco",-41.767,-73.133,"10"],["Fresia",-41.15,-73.45,"10"],["Los Muermos",-41.4,-73.483,"10"],["Maullín",-41.617,-73.6,"10"],["Castro",-42.467,-73.8,"10"],["Queilén",-42.867,-73.467,"10"],["Quemchi",-42.133,-73.517,"10"],["Osorno",-40.567,-73.15,"10"],["Purranque",-40.917,-73.167,"10"],["Río Negro",-40.783,-73.233,"10"],["San Pablo",-40.4,-73.017,"10"],["Futaleufú",-43.167,-71.85,"10"],["Palena",-43.617,-71.8,"10"],["Dalcahue",-42.367,-73.7,"10"],["Chonchi",-42.617,-73.817,"10"],["Coyhaique",-45.567,-72.067,"11"],["Aisén",-45.4,-72.7,"11"],["Guaitecas",-43.883,-73.733,"11"],["O'Higgins",-48.467,-72.567,"11"],["Chile Chico",-46.55,-71.733,"11"],["Verde",-44.233,-71.833,"11"],["Cisnes",-44.75,-72.7,"11"],["Cochrane",-47.267,-72.55,"11"],["Tortel",-47.833,-73.567,"11"],["Río Ibáñez",-46.3,-71.933,"11"],["Punta Arenas",-53.167,-70.934,"12"],["Río Verde",-52.65,-71.483,"12"],["Cabo de Hornos (Ex-Navarino)",-54.933,-67.617,"12"],["Porvenir",-53.3,-70.367,"12"],["Timaukel",-53.667,-69.9,"12"],["Torres del Paine",-51.267,-72.35,"12"],["Natales",-51.733,-72.517,"12"],["Primavera",-52.717,-69.25,"12"],["San Gregorio",-52.317,-69.683,"12"],["Laguna Blanca",-52.25,-71.917,"12"],["Recoleta",-33.4,-70.64,"13"],["Coltauco",-34.25,-71.083,"6"]];
const SCL={lat:-33.45,lon:-70.667};
const normTxt = s => String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
function findComuna(name){ const n=normTxt(name); return n?COMUNAS.find(c=>normTxt(c[0])===n)||null:null; }
function hav(a,b,c,d){ const R=6371,r=Math.PI/180,dl=(c-a)*r,dn=(d-b)*r; const x=Math.sin(dl/2)**2+Math.cos(a*r)*Math.cos(c*r)*Math.sin(dn/2)**2; return 2*R*Math.asin(Math.sqrt(x)); }
const distKey = s => normTxt(s).replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
function estIVx(name){ const m=S.dist[distKey(name)]; if(m&&m.km) return {km:Number(m.km),src:"memoria"}; const c=findComuna(name); if(!c) return null;
  const d=hav(SCL.lat,SCL.lon,c[1],c[2]); const f=1.17+0.45*Math.exp(-d/80); return {km:Math.max(20,Math.round(d*f*2/10)*10),src:"auto"}; }
function estIV(name){ const r=estIVx(name); return r?r.km:null; }
function regLat(code){ const cs=COMUNAS.filter(c=>c[3]===code); return cs.length?cs.reduce((s,c)=>s+c[1],0)/cs.length:-90; }
function gpxKm(text){ const doc=new DOMParser().parseFromString(text,"application/xml"); let pts=[...doc.getElementsByTagName("trkpt")]; if(!pts.length) pts=[...doc.getElementsByTagName("rtept")];
  let km=0, prev=null; for(const p of pts){ const a=+p.getAttribute("lat"), b=+p.getAttribute("lon"); if(isNaN(a)||isNaN(b)) continue; if(prev) km+=hav(prev[0],prev[1],a,b); prev=[a,b]; }
  return pts.length>1?Math.round(km*10)/10:null; }
function whoName(uid){ const r=S.rsvp.find(x=>x.id===uid); const so=r&&!r.pending&&S.socios.find(x=>x.id===r.socioId); return so?fullName(so):nameOf(uid); }
const fmtKm = n => Number(n).toLocaleString("es-CL",{maximumFractionDigits:1});
function chileMap(code){
  const b=CHILE.box; const name=CHILE.names[code];
  return `<div class="chmap"><svg viewBox="${b[0]-2} ${b[1]-2} ${b[2]+4} ${b[3]+4}" role="img" aria-label="${esc(name?"Mapa de Chile: región de "+name:"Mapa de Chile")}">${Object.entries(CHILE.paths).map(([k,d])=>`<path d="${d}" style="fill:${k===code?"var(--red)":"var(--soft)"};stroke:${k===code?"var(--red)":"var(--muted)"}" stroke-width=".5" stroke-linejoin="round" ${k===code?'opacity="1"':'opacity=".9"'}/>`).join("")}</svg>${name?`<span>${esc(name)}</span>`:""}</div>`;
}
/* ---------- socios ---------- */
const fullName = s => ((s.nombre||"")+" "+(s.apellido||"")).trim()||"Socio";
const AVC=["#2E62B4","#E2452B","#1D3C78","#B07D00","#3E7D5A","#7A4FA0","#C2573A","#4A6B8A"];
function avatar(s,big){ const ini=((s.nombre||"?")[0]+(s.apellido||"")[0]||"").toUpperCase(); let n=0; for(const c of (s.apellido||s.nombre||"")) n=(n*31+c.charCodeAt(0))>>>0;
  return `<span class="av ${big?"big":""}" style="--c:${AVC[n%AVC.length]}">${s.foto?`<img src="${blob(s.foto)}" alt="" loading="lazy">`:esc(ini)}</span>`; }
function ageOf(birth){ if(!/^\d{4}-\d{2}-\d{2}$/.test(birth||"")) return null; const b=parse(birth), t=new Date(); let a=t.getFullYear()-b.getFullYear(); if(t.getMonth()<b.getMonth()||(t.getMonth()===b.getMonth()&&t.getDate()<b.getDate())) a--; return a; }
const vehOf = s => [s.marca,s.modelo,s.anio].filter(Boolean).join(" ");
const surnameKey = s => (s.apellido||s.nombre||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
function vSocios(){
  const q=S.q.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  const all=[...S.socios].sort((a,b)=>surnameKey(a).localeCompare(surnameKey(b),"es")||(a.nombre||"").localeCompare(b.nombre||"","es"));
  const list=all.filter(s=>!q||(fullName(s)+" "+vehOf(s)).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").includes(q));
  const nDir=all.filter(s=>s.directiva).length;
  const pend=[];
  let h=reqCard()+`<div class="h2row"><h2>Socios</h2>${addBtn("Agregar socio","new-socio")}</div>
  ${pend.length?`<div class="note" style="border-left:4px solid var(--cumple)"><b>Solicitudes para usar nombres de la directiva (${pend.length})</b>${pend.map(r=>{ const so=S.socios.find(x=>x.id===r.socioId); return `<div class="srow" style="cursor:default;flex-wrap:wrap">${so?avatar(so):""}<div style="flex:1;min-width:160px"><div class="sn">Dice ser <b>${esc(so?fullName(so):r.name||"")}</b></div><div class="ss">Cuenta de Claude: ${esc(S.names[r.id]||"(sin nombre)")}${r.reqAt?" · "+ago(r.reqAt):""}</div></div><div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;margin-left:auto"><button class="btn" data-act="okwho" data-id="${r.id}">Aprobar</button><button class="btn line" data-act="nowho" data-id="${r.id}">Rechazar</button></div></div>`; }).join("")}</div>`:""}
  <div class="total"><b>${all.length}</b><span class="muted">socios en total${nDir?` · ${nDir} en la directiva`:""}</span></div>
  <input class="search" type="search" placeholder="Buscar por nombre o vehículo" value="${esc(S.q)}" data-q aria-label="Buscar socio">`;
  if(!list.length) return h+`<div class="empty">${q?"Nadie coincide con la búsqueda.":"Aún no hay socios cargados."}</div>`;
  let letter=null; h+=`<div class="panel" style="padding:2px 14px 8px">`;
  list.forEach(s=>{ const L=(surnameKey(s)[0]||"#").toUpperCase(); if(L!==letter){ letter=L; h+=`<div class="letter">${esc(L)}</div>`; }
    h+=`<button class="srow" data-open="socio:${s.id}">${avatar(s)}<div style="min-width:0;flex:1"><div class="sn">${esc(s.nombre||"")} <b>${esc(s.apellido||"")}</b></div><div class="ss">${s.directiva?'<span class="tag dir">Directiva</span>':""}${esc(vehOf(s))}${s.estado&&s.estado!=="Activo"?(vehOf(s)?" · ":"")+esc(s.estado):""}</div></div></button>`; });
  return h+`</div>`;
}
function openSocio(id){
  openSheet("Socio",()=>{ const s=S.socios.find(x=>x.id===id); if(!s) return `<p class="muted">Este socio ya no está en el listado.</p>`;
    const age=ageOf(s.birth); const b=S.birthdays.find(x=>x.id===id); let cum="";
    if(b){ const n=daysUntil(nextBday(b)); cum=n===0?"¡Hoy! 🎂":n===1?"Mañana":"En "+n+" días"; }
    return `<div style="display:flex;gap:16px;align-items:center;margin-bottom:6px">${avatar(s,true)}<div><h2 style="font-size:28px">${esc(fullName(s))}</h2>${s.directiva?'<span class="tag dir" style="margin-top:6px">Directiva</span>':'<span class="tag" style="margin-top:6px">Socio</span>'}${s.estado&&s.estado!=="Activo"?`<span class="tag">${esc(s.estado)}</span>`:""}</div></div>
    <dl class="kv">
      <dt>Fecha de nacimiento</dt><dd>${s.birth?esc(parse(s.birth).getDate()+" de "+MESL[parse(s.birth).getMonth()]+" de "+parse(s.birth).getFullYear()):"Sin dato"}</dd>
      <dt>Edad</dt><dd>${age!=null?age+" años":"Sin dato"}</dd>
      ${cum?`<dt>Cumpleaños</dt><dd>${cum}</dd>`:""}
      <dt>Vehículo</dt><dd>${esc(vehOf(s))||'<span class="muted">Sin dato</span>'}</dd>
      <dt>Teléfono</dt><dd>${s.telefono?telLinks(s.telefono):'<span class="muted">Sin dato</span>'}</dd>
      <dt>Emergencia</dt><dd>${s.emergTel?`${s.emergNombre?esc(s.emergNombre)+"<br>":""}${telLinks(s.emergTel)}`:'<span class="muted">Sin dato</span>'}</dd>
    </dl>
    ${s.fotoAuto?`<div class="h2row" style="margin-top:8px"><h3>Su vehículo</h3></div><img src="${blobFull(s.fotoAuto)}" alt="Foto del vehículo de ${esc(fullName(s))}" style="width:100%;border-radius:12px;margin-bottom:12px">`:""}
    ${S.canAdmin&&S.db?`<div class="actions"><button class="btn" data-act="edit-socio:${id}">Editar</button><button class="btn line" data-act="del-socio:${id}">Eliminar</button></div>`:""}`;
  },{live:true});
}
function telLinks(num){ const raw=String(num||"").trim(); if(!raw) return ""; let d=raw.replace(/[^\d+]/g,""); let w=d.replace(/^\+/,""); if(/^9\d{8}$/.test(w)) w="56"+w; else if(/^0?2\d{8}$/.test(w)) w="56"+w.replace(/^0/,"");
  return `${esc(raw)} <a class="link small" href="tel:${esc(d)}" style="margin-left:6px">Llamar</a>${w.length>=10?` <a class="link small" href="https://wa.me/${esc(w)}" target="_blank" rel="noopener" style="margin-left:6px">WhatsApp</a>`:""}`; }
async function photoForCar(file){ const {b}=await compress(file); return b; }
async function squarePhoto(file){
  return new Promise((res,rej)=>{ const img=new Image(); const url=URL.createObjectURL(file);
    img.onload=()=>{ const s=Math.min(img.naturalWidth,img.naturalHeight); const c=document.createElement("canvas"); c.width=c.height=400;
      c.getContext("2d").drawImage(img,(img.naturalWidth-s)/2,(img.naturalHeight-s)/2,s,s,0,0,400,400);
      c.toBlob(b=>{ URL.revokeObjectURL(url); b?res(b):rej(new Error("blob")); },"image/jpeg",.85); };
    img.onerror=()=>{ URL.revokeObjectURL(url); rej(new Error("img")); }; img.src=url; });
}
function socioForm(id){
  if(!S.canAdmin||!S.db) return;
  const s=id?S.socios.find(x=>x.id===id):{estado:"Activo"};
  let newPhoto=null, removePhoto=false;
  openSheet(id?"Editar socio":"Agregar socio",()=>`<form id="sf">
    <div style="display:flex;gap:14px;align-items:center;margin-bottom:12px"><span id="sfav">${avatar(s,true)}</span>
      <div><label class="btn ghost" style="cursor:pointer">${I.cam}<span>${s.foto?"Cambiar foto":"Agregar foto"}</span><input type="file" accept="image/*" hidden id="sfp"></label>
      ${s.foto?`<div style="margin-top:6px"><button type="button" class="link small" id="sfrm">Quitar foto</button></div>`:""}<div class="small muted" style="margin-top:4px">Opcional</div></div></div>
    <div class="row2"><label class="f">Nombre<input name="nombre" required maxlength="60" value="${esc(s.nombre||"")}"></label><label class="f">Apellido<input name="apellido" required maxlength="60" value="${esc(s.apellido||"")}"></label></div>
    <label class="f">Fecha de nacimiento<input type="date" name="birth" value="${esc(s.birth||"")}"></label>
    <div class="row2"><label class="f">Marca<input name="marca" maxlength="40" value="${esc(s.marca||"")}" placeholder="Ej: Jeep"></label><label class="f">Modelo<input name="modelo" maxlength="60" value="${esc(s.modelo||"")}" placeholder="Ej: Grand Cherokee"></label></div>
    <div class="row2"><label class="f">Año<input name="anio" inputmode="numeric" maxlength="4" value="${esc(s.anio||"")}" placeholder="Ej: 2004"></label>
      <label class="f">Estado<select name="estado">${["Activo","Receso","Estudiante","Vitalicio"].map(o=>`<option ${(s.estado||"Activo")===o?"selected":""}>${o}</option>`).join("")}</select></label></div>
    <label class="f">Teléfono de contacto<input name="telefono" type="tel" maxlength="20" value="${esc(s.telefono||"")}" placeholder="+56 9 1234 5678"></label>
    <div class="row2"><label class="f">Contacto de emergencia (nombre)<input name="emergNombre" maxlength="60" value="${esc(s.emergNombre||"")}" placeholder="Ej: María (esposa)"></label><label class="f">Teléfono de emergencia<input name="emergTel" type="tel" maxlength="20" value="${esc(s.emergTel||"")}" placeholder="+56 9 …"></label></div>
    <label style="display:flex;gap:8px;align-items:center;margin:2px 0 6px"><input type="checkbox" name="directiva" ${s.directiva?"checked":""}> Es parte de la directiva</label>
    <p class="small muted" style="margin:0 0 12px">Marcarlo lo muestra como directiva en la app. El permiso para editar se da aparte, en el botón Compartir (como Editor).</p>
    <div class="f" style="font-size:14px;font-weight:600;color:var(--muted)">Foto de su auto o Jeep (opcional)
      <div id="sfcar" style="margin-top:6px">${s.fotoAuto?`<img src="${blob(s.fotoAuto)}" alt="" style="width:100%;max-height:220px;object-fit:cover;border-radius:10px">`:""}</div>
      <div class="actions" style="margin-top:6px"><label class="btn ghost" style="cursor:pointer">${I.cam}<span>${s.fotoAuto?"Cambiar foto del vehículo":"Subir foto del vehículo"}</span><input type="file" accept="image/*" hidden id="sfcarf"></label>${s.fotoAuto?`<button type="button" class="link small" id="sfcarrm">Quitar</button>`:""}</div></div>
    <div class="actions"><button class="btn" type="submit">${id?"Guardar cambios":"Agregar socio"}</button><button class="btn ghost" type="button" data-close>Cancelar</button></div></form>`);
  let newCar=null, removeCar=false;
  $("#sfcarf").addEventListener("change",async e=>{ const f=e.target.files[0]; if(!f) return; try{ newCar=await photoForCar(f); removeCar=false; $("#sfcar").innerHTML=`<img src="${URL.createObjectURL(newCar)}" alt="" style="width:100%;max-height:220px;object-fit:cover;border-radius:10px">`; }catch(_){ toast("No se pudo leer la foto."); } });
  const crm=$("#sfcarrm"); if(crm) crm.addEventListener("click",()=>{ removeCar=true; newCar=null; $("#sfcar").innerHTML=""; });
  $("#sfp").addEventListener("change",async e=>{ const f=e.target.files[0]; if(!f) return; try{ newPhoto=await squarePhoto(f); removePhoto=false; $("#sfav").innerHTML=`<span class="av big"><img src="${URL.createObjectURL(newPhoto)}" alt=""></span>`; }catch(_){ toast("No se pudo leer la foto."); } });
  const rm=$("#sfrm"); if(rm) rm.addEventListener("click",()=>{ removePhoto=true; newPhoto=null; $("#sfav").innerHTML=avatar(Object.assign({},s,{foto:null}),true); });
  $("#sf").addEventListener("submit",async ev=>{ ev.preventDefault(); const d=formData(ev.target); d.directiva=ev.target.directiva.checked;
    if(d.anio&&!/^\d{4}$/.test(d.anio)){ toast("El año del vehículo debe tener 4 dígitos."); return; }
    const btn=ev.target.querySelector("[type=submit]"); btn.disabled=true; btn.textContent="Guardando…";
    try{ if(newPhoto){ const r=await S.assets.upload(newPhoto,{type:"image/jpeg"}); if(s.foto) S.assets.delete(s.foto).catch(()=>{}); d.foto=r.id; } else if(removePhoto){ if(s.foto) S.assets.delete(s.foto).catch(()=>{}); d.foto=null; }
      if(newCar){ const r=await S.assets.upload(newCar,{type:"image/jpeg"}); if(s.fotoAuto) S.assets.delete(s.fotoAuto).catch(()=>{}); d.fotoAuto=r.id; } else if(removeCar){ if(s.fotoAuto) S.assets.delete(s.fotoAuto).catch(()=>{}); d.fotoAuto=null; } }
    catch(e){ toast("No se pudo subir la foto."); btn.disabled=false; btn.textContent=id?"Guardar cambios":"Agregar socio"; return; }
    let nid=id; const ok=await write(async db=>{ if(id) await db.doc("socios/"+id).update(d); else { const ref=await db.collection("socios").add(Object.assign(d,{at:Date.now()})); nid=ref.id; } },id?"Cambios guardados":"Socio agregado");
    if(ok) openSocio(nid); else { btn.disabled=false; btn.textContent=id?"Guardar cambios":"Agregar socio"; } });
}
/* ---------- cumpleaños ---------- */
function nextBday(b){ const t=parse(todayStr()); let y=t.getFullYear(); const mk=yy=>{ let d=new Date(yy,b.month-1,b.day); if(d.getMonth()!==b.month-1) d=new Date(yy,1,28); return d; };
  let d=mk(y); if(d<t) d=mk(y+1); return ymd(d); }
function bdaysOn(ds){ const d=parse(ds); return S.birthdays.filter(b=>Number(b.month)===d.getMonth()+1&&(Number(b.day)===d.getDate()||(Number(b.day)===29&&Number(b.month)===2&&d.getDate()===28&&new Date(d.getFullYear(),1,29).getMonth()!==1))); }
function bdayForm(id){
  const b=id?S.birthdays.find(x=>x.id===id):{};
  if(!S.canWrite||!S.db){ return; }
  openSheet(id?"Editar cumpleaños":"Agregar cumpleaños",()=>`<form id="bf">
    <label class="f">Nombre del socio<input name="name" required maxlength="80" value="${esc(b.name||"")}" placeholder="Ej: Juan Pérez"></label>
    <div class="row2"><label class="f">Día<select name="day" required>${Array.from({length:31},(_,i)=>`<option value="${i+1}" ${Number(b.day)===i+1?"selected":""}>${i+1}</option>`).join("")}</select></label>
    <label class="f">Mes<select name="month" required>${MESL.map((m,i)=>`<option value="${i+1}" ${Number(b.month)===i+1?"selected":""}>${m}</option>`).join("")}</select></label></div>
    <p class="small muted" style="margin-top:-4px">Solo día y mes; no hace falta el año.</p>
    <div class="actions"><button class="btn" type="submit">${id?"Guardar cambios":"Agregar"}</button>${id?`<button class="btn line" type="button" data-act="del-bday:${id}">Eliminar</button>`:""}<button class="btn ghost" type="button" data-close>Cancelar</button></div></form>`);
  $("#bf").addEventListener("submit",async ev=>{ ev.preventDefault(); const d=formData(ev.target); d.day=Number(d.day); d.month=Number(d.month);
    if(new Date(2024,d.month-1,d.day).getMonth()!==d.month-1){ toast("Esa fecha no existe."); return; }
    const ok=await write(db=>id?db.doc("birthdays/"+id).update(d):db.collection("birthdays").add(Object.assign(d,{by:S.uid||null,at:Date.now()})),id?"Cambios guardados":"Cumpleaños agregado");
    if(ok) closeSheet(); });
}
function bdayLine(b,withDays){ const n=daysUntil(b.next); const click=S.canWrite&&S.db;
  return `<${click?"button":"div"} class="bl ${n===0?"today":""}" ${click?`data-open="bday:${b.id}"`:""}><span class="bd">${Number(b.day)} ${MES[Number(b.month)-1]}</span><span class="bn">${esc(b.name)}</span>${withDays?`<span class="bw">${n===0?"Hoy 🎂":n===1?"Mañana":"en "+n+" días"}</span>`:(n===0?`<span class="bw">Hoy 🎂</span>`:"")}</${click?"button":"div"}>`; }
function sortedBdays(){ return S.birthdays.map(b=>Object.assign({next:nextBday(b)},b)).sort((a,b)=>a.next<b.next?-1:a.next>b.next?1:(a.name||"").localeCompare(b.name||"","es")); }
function vCumples(){
  const m=S.calM, y=S.calY, now=new Date(), isCur=(m===now.getMonth()&&y===now.getFullYear()), td=now.getDate();
  const list=S.birthdays.filter(b=>Number(b.month)===m+1).sort((a,b)=>Number(a.day)-Number(b.day)||(a.name||"").localeCompare(b.name||"","es"));
  const click=S.canWrite&&S.db;
  let h=`<div class="h2row" id="cumples"><h2>Cumpleaños de ${MESL[m]}</h2>${addBtn("Agregar","new-bday","btn ghost")}</div>`;
  const rows=list.map(b=>{ const d=Number(b.day); const past=isCur&&d<td, today=isCur&&d===td; const n=d-td;
    const lab=today?"Hoy 🎂":(isCur&&n===1)?"Mañana":(isCur&&n>1)?"en "+n+" días":"";
    return `<${click?"button":"div"} class="bl ${today?"today":""}" ${click?`data-open="bday:${b.id}"`:""} ${past?'style="opacity:.55"':""}><span class="bd">${d} ${MES[m]}</span><span class="bn">${esc(b.name)}</span>${lab?`<span class="bw">${lab}</span>`:""}</${click?"button":"div"}>`; }).join("");
  return h+`<div class="panel" style="padding:6px 14px 10px">${list.length?rows:`<p class="muted small" style="margin:8px 0">Nadie está de cumpleaños en ${MESL[m]}.</p>`}
    ${S.birthdays.length?`<button class="link" data-act="all-bdays" style="margin-top:8px">Ver los ${S.birthdays.length} cumpleaños del año</button>`:""}</div>`;
}
function openBdays(){
  let q="";
  openSheet("Cumpleaños del club",()=>"",{});
  const sb=$("#sb");
  sb.innerHTML=`<div style="display:flex;gap:8px;align-items:center"><input class="search" id="bq" type="search" placeholder="Buscar socio" aria-label="Buscar socio" style="margin:0">${addBtn("Agregar","new-bday","btn ghost")}</div><div id="bdl" style="margin-top:6px"></div>`;
  const paint=()=>{ const el=$("#bdl"); if(!el) return; const m0=new Date().getMonth();
    const list=S.birthdays.filter(b=>!q||(b.name||"").toLowerCase().includes(q)).map(b=>Object.assign({next:nextBday(b)},b));
    if(!list.length){ el.innerHTML=`<p class="muted small" style="margin-top:12px">${q?"Nadie coincide con la búsqueda.":"Aún no hay cumpleaños anotados."}</p>`; return; }
    let out=""; for(let k=0;k<12;k++){ const m=(m0+k)%12; const inM=list.filter(b=>Number(b.month)===m+1).sort((a,b)=>Number(a.day)-Number(b.day)||(a.name||"").localeCompare(b.name||"","es"));
      if(inM.length) out+=`<div class="bmonth">${MESL[m]} <span class="small">(${inM.length})</span></div>`+inM.map(b=>bdayLine(b,false)).join(""); }
    el.innerHTML=out; };
  sheet.render=paint; sheet.live=true; paint();
  $("#bq").addEventListener("input",e=>{ q=e.target.value.trim().toLowerCase(); paint(); });
}

/* ---------- en vivo ---------- */
const STATUS = ["Salimos 🚙","Todo bien 👍","Parada para almorzar 🍖","Llegamos al destino 🏔️","Campamento armado ⛺","Sin señal un rato 📵","Vamos de vuelta ↩️","Llegamos a casa 🏠"];
function inRange(e){ const t=todayStr(); return t>=e.date&&t<=(e.dateEnd||e.date); }
function isLive(e){ return e&&e.type==="paseo"&&(e.live===true||(e.live!==false&&inRange(e))); }
const liveEvents = () => S.events.filter(isLive).sort((a,b)=>a.date<b.date?-1:1);
function liveOf(eid){ return S.live.filter(p=>p.eventId===eid).sort((a,b)=>b.at-a.at); }
function withTimeout(p,ms){ return Promise.race([p,new Promise((_,rej)=>setTimeout(()=>rej({code:"timeout"}),ms))]); }
const Q={ d:null,
  open(){ return new Promise(r=>{ try{ const rq=indexedDB.open("jeeperos-cola",1); rq.onupgradeneeded=()=>rq.result.createObjectStore("q",{keyPath:"id"}); rq.onsuccess=()=>r(Q.d=rq.result); rq.onerror=()=>r(null); }catch(e){ r(null); } }); },
  async tx(mode,fn){ const d=Q.d||await Q.open(); if(!d) return null; return new Promise(r=>{ try{ const st=d.transaction("q",mode).objectStore("q"); const rq=fn(st); rq.onsuccess=()=>r(rq.result); rq.onerror=()=>r(null); }catch(e){ r(null); } }); },
  all(){ return Q.tx("readonly",s=>s.getAll()).then(x=>x||[]); }, put(o){ return Q.tx("readwrite",s=>s.put(o)); }, del(id){ return Q.tx("readwrite",s=>s.delete(id)); }
};
async function refreshPending(){ S.pending=(await Q.all()).sort((a,b)=>b.at-a.at); if(sheet&&sheet.live) sheet.render(); }
const PERMANENT = c => c==="permission-denied"||c==="no_assets"||c==="no_video";
async function pushLive(item,queued){
  if(!S.db) throw {code:"timeout"};
  if(item.blob&&!item.asset){ if(!S.assets) throw {code:"no_assets"};
    const r=await withTimeout(S.assets.upload(item.blob,{type:"image/jpeg"}),60000); item.asset=r.id; item.blob=null; if(queued) await Q.put(item); }
  const warn=e=>{ if(e&&e.code==="permission-denied") toast("No tienes permiso para publicar."); };
  let photoId=null;
  if(item.asset){ const pref=S.db.collection("photos").doc(); photoId=pref.id; pref.set({eventId:item.eventId,asset:item.asset,caption:item.text||"",by:S.uid||null,at:item.at,w:item.w||0,h:item.h||0,live:true}).catch(warn); }
  S.db.collection("live").doc().set({eventId:item.eventId,text:item.text||"",kind:item.kind||"post",asset:item.asset||null,photoId,lat:item.lat==null?null:item.lat,lon:item.lon==null?null:item.lon,by:S.uid||null,at:item.at}).catch(warn);
}
async function sendLive(item){
  item.id=item.id||("q"+Date.now()+Math.random().toString(36).slice(2,6)); item.at=item.at||Date.now();
  try{ await pushLive(item,false); return "sent"; }
  catch(e){
    if(e&&PERMANENT(e.code)){ toast(e.code==="quota_exceeded"?"Se llenó el espacio del club.":e.code==="no_assets"?"Tu acceso no permite subir fotos.":"No tienes permiso para publicar."); return "fail"; }
    await Q.put(item); await refreshPending(); toast("Sin señal: quedó guardado y se enviará solo cuando vuelva."); return "queued";
  }
}
let flushing=false;
async function flushQueue(){
  if(flushing||!S.db) return; flushing=true;
  try{ const items=(await Q.all()).sort((a,b)=>a.at-b.at); let sent=0;
    for(const it of items){ try{ await pushLive(it,true); await Q.del(it.id); sent++; } catch(e){ if(e&&PERMANENT(e.code)){ await Q.del(it.id); } else break; } }
    if(sent) toast(sent===1?"Se envió 1 publicación pendiente":"Se enviaron "+sent+" publicaciones pendientes");
  } finally { flushing=false; await refreshPending(); }
}
function getLoc(){ return new Promise(r=>{ if(!navigator.geolocation) return r(null); try{ navigator.geolocation.getCurrentPosition(p=>r({lat:+p.coords.latitude.toFixed(5),lon:+p.coords.longitude.toFixed(5)}),()=>r(null),{enableHighAccuracy:true,timeout:12000,maximumAge:60000}); }catch(e){ r(null); } }); }
function liveBanner(e){ const posts=liveOf(e.id); const last=posts[0];
  return `<button class="live-banner" data-live="${e.id}"><span class="live-dot"></span><span style="min-width:0"><span class="lt">En vivo: ${esc(e.title)}</span><br><span class="ls">${last?esc(nameOf(last.by))+", "+ago(last.at)+": "+esc(last.text|| (last.asset?"subió una foto":"")):"Toca para seguir el paseo o publicar desde la ruta"}</span></span></button>`; }

function openLive(eid){
  const pre=new Map(); // previews
  let files=[];
  openSheet("En vivo",()=>"",{});
  const sb=$("#sb");
  const e0=S.events.find(x=>x.id===eid)||{};
  sb.innerHTML=`<div id="lvh"></div>
  ${S.canPost&&S.db?`<div class="composer"><textarea id="lvt" maxlength="2000" placeholder="¿Cómo va el paseo?" aria-label="Mensaje"></textarea>
    <div class="prev" id="lvp"></div>
    <div class="crow"><label class="btn ghost" style="cursor:pointer">${I.cam}<span>Foto</span><input type="file" accept="image/*" multiple hidden id="lvf"></label>
    <label class="small" style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="lvl"> Agregar mi ubicación</label>
    <button class="btn" id="lvs" style="margin-left:auto">Publicar</button></div>
    <div class="chips" aria-label="Avisos rápidos">${STATUS.map(s=>`<button class="chip" data-st="${esc(s)}">${esc(s)}</button>`).join("")}</div></div>`:""}
  <div id="lvfeed"></div>`;
  const paint=()=>{
    const e=S.events.find(x=>x.id===eid); const hd=$("#lvh"), fd=$("#lvfeed"); if(!hd||!fd) return;
    if(!e){ hd.innerHTML=`<p class="muted">Este paseo fue eliminado.</p>`; fd.innerHTML=""; return; }
    const live=isLive(e);
    hd.innerHTML=`<div style="display:flex;gap:12px;align-items:center;margin-bottom:12px">${live?'<span class="live-dot red"></span>':""}<div style="flex:1"><h2 style="font-size:24px">${esc(e.title)}</h2><div class="muted small">${live?"Transmitiendo ahora · se actualiza solo":"Relato del paseo · "+shortDate(e.date)}</div></div>
      ${S.canWrite&&S.db?`<button class="btn line" data-act="${live?"live-off":"live-on"}:${eid}">${live?"Terminar":"Iniciar en vivo"}</button>`:""}</div>`;
    const pend=S.pending.filter(p=>p.eventId===eid).map(p=>Object.assign({pending:true},p));
    const posts=[...pend,...liveOf(eid)];
    fd.innerHTML=posts.length?`<div class="feed">${posts.map(p=>`<div class="fp ${p.kind==="status"?"status":""} ${p.pending?"pending":""}">
      <div class="meta"><span class="who">${esc(p.pending?"Tú":nameOf(p.by))}</span> · ${p.pending?"esperando señal…":ago(p.at)+" · "+new Date(p.at).toLocaleTimeString("es-CL",{hour:"2-digit",minute:"2-digit"})}
      ${!p.pending&&canManage(p)?` · <button class="link small" data-act="del-live:${p.id}">Borrar</button>`:""}</div>
      ${p.text?`<div class="txt">${esc(p.text)}</div>`:""}
      ${p.asset?`<img loading="lazy" src="${blobFull(p.asset)}" alt="" ${p.photoId?`data-photo="${p.photoId}"`:""}>`:(p.pending&&p.blob?`<div class="small muted">📷 Foto en espera</div>`:"")}
      ${p.lat!=null&&p.lon!=null?`<div style="margin-top:4px"><a class="small" style="color:var(--blue);font-weight:600" href="https://www.google.com/maps?q=${p.lat},${p.lon}" target="_blank" rel="noopener">📍 Ver ubicación en el mapa</a></div>`:""}
    </div>`).join("")}</div>`:`<div class="empty" style="margin-top:14px">${live?"Todavía no hay publicaciones. Cuando el grupo publique, aparecerá aquí al tiro.":"Este paseo no tuvo transmisión en vivo."}</div>`;
  };
  sheet.render=paint; sheet.live=true; paint();
  const fin=$("#lvf"), prev=$("#lvp"), ta=$("#lvt"), sendB=$("#lvs"), locB=$("#lvl");
  if(fin) fin.addEventListener("change",()=>{ files=[...fin.files].filter(f=>/^image\//.test(f.type)).slice(0,6); fin.value=""; prev.innerHTML=files.map(f=>`<img src="${URL.createObjectURL(f)}" alt="">`).join(""); });
  async function publish(text,kind){
    if(!text&&!files.length) { ta&&ta.focus(); return; }
    sendB.disabled=true; const old=sendB.textContent; sendB.textContent="Publicando…";
    let loc=null; if(locB&&locB.checked){ loc=await getLoc(); if(!loc) toast("No se pudo obtener la ubicación; se publica sin ella."); }
    const base={eventId:eid,kind,lat:loc?loc.lat:null,lon:loc?loc.lon:null};
    const list=files.length?files:[null]; let okAll=true;
    for(let i=0;i<list.length;i++){ const item=Object.assign({},base,{text:i===0?text:"",at:Date.now()+i});
      if(list[i]){ try{ const c=await compress(list[i]); item.blob=c.b; item.w=c.w; item.h=c.h; }catch(err){ toast("Una foto no se pudo leer."); continue; } }
      const r=await sendLive(item); if(r==="fail") okAll=false; }
    if(okAll){ files=[]; if(prev) prev.innerHTML=""; if(kind==="post"&&ta) ta.value=""; }
    sendB.disabled=false; sendB.textContent=old;
  }
  if(sendB) sendB.addEventListener("click",()=>publish(ta.value.trim(),"post"));
  sb.addEventListener("click",ev=>{ const c=ev.target.closest("[data-st]"); if(c&&!sendB.disabled) publish(c.dataset.st,"status"); });
}

/* ---------- rendering ---------- */
function renderTabs(){
  $("#tabs").innerHTML=TABS.map(([k,l,ic])=>`<button data-tab="${k}" ${S.tab===k?'aria-current="page"':""}>${ic}<span>${l}</span></button>`).join("");
}
function mark(dateStr,color,endStr){ const d=parse(dateStr); const yr=d.getFullYear()!==new Date().getFullYear()?" \u2019"+String(d.getFullYear()).slice(2):"";
  if(endStr&&endStr>dateStr){ const e=parse(endStr); const nd=Math.round((e-d)/86400000)+1; const mo=e.getMonth()!==d.getMonth()?MES[d.getMonth()]+"–"+MES[e.getMonth()]:MES[d.getMonth()]+yr;
    return `<div class="mark" style="--c:${color}"><span class="m">${mo}</span><span class="d" style="font-size:19px;line-height:1.75;white-space:nowrap;letter-spacing:-.02em">${d.getDate()}–${e.getDate()}</span><span class="w">${nd} días</span></div>`; }
  return `<div class="mark" style="--c:${color}"><span class="m">${MES[d.getMonth()]}${yr}</span><span class="d">${d.getDate()}</span><span class="w">${DIA[d.getDay()]}</span></div>`; }
function photosOf(eid){ const ev=S.events.find(e=>e.id===eid); const cv=ev&&ev.cover; return S.photos.filter(p=>p.eventId===eid).sort((a,b)=>(b.id===cv)-(a.id===cv)||a.at-b.at); }
function coverOf(eid){ const p=photosOf(eid); return p.length?p[0]:null; }
const paseos = () => S.events.filter(e=>e.type==="paseo");
function upcomingEvents(){ const t=todayStr(); return S.events.filter(e=>(e.dateEnd||e.date)>=t).sort((a,b)=>a.date<b.date?-1:1); }
function countdown(s){ const n=daysUntil(s); return n===0?"Hoy":n===1?"Mañana":n>1?"En "+n+" días":""; }
function addBtnP(label,act,cls="btn"){ return S.canPost&&S.db?`<button class="${cls}" data-act="${act}">${I.plus}${esc(label)}</button>`:""; }
function addBtn(label,act,cls="btn"){ return S.canWrite&&S.db?`<button class="${cls}" data-act="${act}">${I.plus}${esc(label)}</button>`:""; }

function recentActivity(){
  const A=[];
  // fotos/videos agrupados por persona + paseo en ventanas de 30 min
  const ph=[...S.photos].filter(p=>p.at>1e12).sort((a,b)=>b.at-a.at); const used=new Set();
  ph.forEach(p=>{ if(used.has(p.id)) return; const grp=ph.filter(q=>!used.has(q.id)&&q.by===p.by&&q.eventId===p.eventId&&Math.abs(q.at-p.at)<30*60000); grp.forEach(q=>used.add(q.id));
    const ev=S.events.find(e=>e.id===p.eventId); const v=grp.filter(q=>q.kind==="video").length, f=grp.length-v; const parts=[]; if(f) parts.push(f===1?"1 foto":f+" fotos"); if(v) parts.push(v===1?"1 video":v+" videos");
    A.push({at:p.at,who:whoName(p.by),text:"subió "+parts.join(" y ")+(ev?" a "+ev.title:""),open:ev?"event:"+ev.id:"",thumb:thumbOf(p),icon:I.cam,color:"var(--paseo)"}); });
  S.routes.filter(r=>r.at>1e12).forEach(r=>A.push({at:r.at,who:whoName(r.by),text:"compartió la ruta "+(r.name&&r.place&&r.name!==r.place?r.name+" ("+r.place+")":(r.place||r.name)),open:"",tab:"rutas",icon:I.route,color:"var(--blue)"}));
  S.events.filter(e=>e.at&&e.at>1e12).forEach(e=>A.push({at:e.at,who:whoName(e.by),text:(e.type==="paseo"?"creó el paseo ":"agregó "+typeLabel(e.type).toLowerCase()+": ")+e.title,open:"event:"+e.id,icon:e.type==="paseo"?I.jeep:I.cal,color:COLORS[kindOf(e.type)]}));
  return A.filter(a=>a.open||a.tab).map(a=>a.tab&&!a.open?Object.assign(a,{open:"tab:"+a.tab}):a).sort((a,b)=>b.at-a.at);
}
function helpLink(){ const n=String(S.config.helpWa||"").replace(/[^\d]/g,""); if(!n) return ""; return "https://wa.me/"+(n.length===9&&n[0]==="9"?"56"+n:n)+"?text="+encodeURIComponent("Hola, necesito ayuda con la app del Club de Jeeperos"); }
function helpCard(){ const u=helpLink(); return u?`<a class="aviso" href="${esc(u)}" target="_blank" rel="noopener" style="--c:var(--oficial);margin-top:26px;text-decoration:none"><span style="font-size:28px">💬</span><span><b>¿Necesitas ayuda con la app?</b><br><span class="muted small">Escríbele a la directiva por WhatsApp</span></span></a>`:""; }
function maybeAskWho(){ updateMeBtn(); if(!S.ready) return; if(!welcomeSeen()&&!S.welcomeOpen&&!sheet){ S.welcomeOpen=true; showWelcome(()=>{ S.welcomeOpen=false; maybeAskWho(); }); return; } if(S.welcomeOpen) return; if(S.askedWho||!S.canPost||!S.db||!S.rsvpLoaded||!S.sociosLoaded||!S.socios.length) return; if(meSocio()||iAmPending()) return; if(sheet) return; S.askedWho=true; setTimeout(()=>{ if(!meSocio()&&!sheet) pickSocio(()=>{}); },600); }
function vInicio(){
  const t=todayStr();
  const nextPaseo=upcomingEvents().find(e=>e.type==="paseo");
  const nextMtg=allMeetings().filter(m=>m.date>=t&&!m.cancelled).sort((a,b)=>a.date<b.date?-1:1)[0];
  const recent=[...S.photos].sort((a,b)=>b.at-a.at).slice(0,12);
  const bt=bdaysOn(todayStr());
  const whoBanner=iAmPending()?`<div class="note" style="border-left:4px solid var(--cumple)"><b>Esperando aprobación.</b> El administrador debe confirmar que eres quien dices ser (nombre de la directiva).</div>`:(S.canPost&&S.rsvpLoaded&&S.socios.length&&!meSocio())?`<div class="note" style="display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;border-left:4px solid var(--red)"><span><b>¿Quién eres?</b> Elige tu nombre para que la app te reconozca.</span><button class="btn" data-act="whoami">Elegir mi nombre</button></div>`:"";
  let h=adminPendBanner()+whoBanner+(bt.length?`<div class="bday-today"><span class="big">🎂</span><div><b>Hoy está de cumpleaños ${esc(bt.map(b=>b.name).join(", "))}</b><div class="small muted">¡No olvides saludar en el grupo!</div></div></div>`:"");
  h+=liveEvents().map(liveBanner).join("");
  { const tom=ymd(new Date(new Date().getFullYear(),new Date().getMonth(),new Date().getDate()+1)); const av=[];
    S.events.forEach(e=>{ const end=e.dateEnd||e.date; if(e.date===t||e.date===tom||(e.date<t&&end>=t)) av.push({d:e.date<=t?"Hoy":"Mañana",title:typeLabel(e.type)+": "+e.title,sub:[e.time&&"salida "+e.time,e.meet||e.place].filter(Boolean).join(" · "),open:"event:"+e.id,c:COLORS[kindOf(e.type)]}); });
    allMeetings().forEach(m=>{ if(!m.cancelled&&(m.date===t||m.date===tom)) av.push({d:m.date===t?"Hoy":"Mañana",title:mtgTitle(m),sub:[m.time,m.place].filter(Boolean).join(" · "),open:"mtg:"+m.key,c:COLORS[m.kind]}); });
    h+=av.map(a=>`<button class="aviso" data-open="${a.open}" style="--c:${a.c}"><span style="font-size:26px">🔔</span><span style="min-width:0"><span class="when">${a.d}</span><br><b>${esc(a.title)}</b>${a.sub?`<br><span class="muted small">${esc(a.sub)}</span>`:""}</span></button>`).join(""); }
  h+=`<div class="h2row"><h2>Próximo paseo</h2>${nextPaseo?`<button class="link" data-tab="calendario">Ver calendario</button>`:""}</div>`;
  if(nextPaseo){ const c=coverOf(nextPaseo.id);
    h+=`<button class="next" data-open="event:${nextPaseo.id}" style="all:unset;display:block;cursor:pointer;background:var(--surface);border:1px solid var(--line);border-radius:16px;overflow:hidden;width:100%">
      ${c?`<div class="cover"><img src="${blobFull(thumbOf(c))}" alt=""></div>`:""}
      <div class="body">${mark(nextPaseo.date,COLORS.paseo,nextPaseo.dateEnd)}<div><div class="count">${countdown(nextPaseo.date)}</div><h3>${esc(nextPaseo.title)}</h3>
      <div class="muted small">${esc([nextPaseo.place,nextPaseo.time&&"salida "+nextPaseo.time].filter(Boolean).join(" · "))}</div>
      ${nextPaseo.difficulty!=null&&nextPaseo.difficulty!==""?`<div style="margin-top:6px">${diffHtml(nextPaseo.difficulty)}</div>`:""}</div></div></button>`;
  } else h+=`<div class="empty">No hay paseos programados todavía.<br>${addBtn("Programar paseo","new-event:paseo")}</div>`;

  h+=`<div class="grid2"><section><div class="h2row"><h2>Próxima reunión</h2></div>`;
  h+= nextMtg?`<div class="panel"><button class="item" data-open="mtg:${nextMtg.key}">${mark(nextMtg.date,COLORS[nextMtg.kind])}<div><span class="tag ${nextMtg.kind}">${kindTag(nextMtg.kind)}</span><div class="t" style="margin-top:4px">${mtgTitle(nextMtg)}</div><div class="s">${esc([countdown(nextMtg.date),nextMtg.time,nextMtg.place].filter(Boolean).join(" · ")||"Lugar y hora por confirmar")}</div></div></button></div>`:`<div class="empty">Sin reuniones próximas.</div>`;
  h+=`</section><section><div class="h2row"><h2>Actividad reciente</h2></div>`;
  { const acts=recentActivity().slice(0,6);
    h+= acts.length?`<div class="panel">${acts.map(a=>`<button class="item" data-open="${a.open}" style="align-items:center">${a.thumb?`<span style="flex:none;width:52px;height:52px;border-radius:10px;overflow:hidden;background:var(--soft)"><img src="${blob(a.thumb)}" alt="" style="width:100%;height:100%;object-fit:cover"></span>`:`<span style="flex:none;width:52px;height:52px;border-radius:10px;background:var(--soft);display:grid;place-items:center;color:${a.color}">${a.icon}</span>`}<div style="min-width:0"><div style="font-size:15.5px;line-height:1.3"><b>${esc(a.who)}</b> ${esc(a.text)}</div><div class="s">${ago(a.at)}</div></div></button>`).join("")}</div>`:`<div class="empty">Cuando alguien suba fotos, comparta una ruta o se cree un paseo, aparecerá aquí.</div>`; }
  h+=`</section></div>`;
  h+=`<div class="h2row"><h2>Fotos recientes</h2>${recent.length?`<button class="link" data-tab="paseos">Ver paseos</button>`:""}</div>`;
  h+= recent.length?`<div class="strip">${recent.map(p=>`<button data-photo="${p.id}" aria-label="${p.kind==="video"?"Ver video":"Ver foto"}">${mediaCell(p)}</button>`).join("")}</div>`:`<div class="empty">Las fotos se suben dentro de cada paseo. Agrega un paseo y comparte las tuyas.</div>`;
  h+=helpCard();
  return h;
}

function diffHtml(n){ n=Number(n); if(isNaN(n)) return ""; return `<span class="diff">${[0,1,2,3].map(i=>`<i class="${i<=n?"on":""}"></i>`).join("")} ${DIFF[n]||""}</span>`; }

function dayItems(ds){
  const items=S.events.filter(e=>ds>=e.date&&ds<=(e.dateEnd||e.date)).map(e=>({kind:kindOf(e.type),type:e.type,label:e.title,open:"event:"+e.id,date:e.date,end:e.dateEnd||"",sub:[e.time,e.place].filter(Boolean).join(" · ")}));
  bdaysOn(ds).forEach(b=>items.push({kind:"cumple",label:"Cumpleaños de "+b.name,open:"bday:"+b.id,date:ds,sub:""}));
  return items;
}
function vCalendario(){
  const y=S.calY,m=S.calM; const first=new Date(y,m,1); const start=new Date(y,m,1-((first.getDay()+6)%7));
  const mtgs=meetingsBetween(new Date(y,m-1,1),new Date(y,m+1,1)).filter(x=>!x.cancelled);
  const byDay={}; const push=(d,o)=>{(byDay[d]=byDay[d]||[]).push(o);};
  for(let i=0;i<42;i++){ const d=ymd(new Date(start.getFullYear(),start.getMonth(),start.getDate()+i)); dayItems(d).filter(o=>o.kind!=="cumple").forEach(o=>push(d,o)); }
  mtgs.forEach(x=>push(x.date,{kind:x.kind,label:mtgTitle(x),open:"mtg:"+x.key,date:x.date,sub:[x.time,x.place].filter(Boolean).join(" · ")}));
  const t=todayStr();
  let g=["lun","mar","mié","jue","vie","sáb","dom"].map(w=>`<div class="wd">${w}</div>`).join("");
  for(let i=0;i<42;i++){ const dd=new Date(start.getFullYear(),start.getMonth(),start.getDate()+i); const d=ymd(dd); const it=byDay[d]||[];
    g+=`<button class="day ${dd.getMonth()!==m?"out":""} ${d===t?"today":""} ${d===S.calSel?"sel":""}" data-day="${d}" aria-label="${longDate(d)}${it.length?", "+it.length+" actividades":""}"><span class="n">${dd.getDate()}</span><span class="dots">${it.slice(0,3).map(o=>`<i class="dot" style="--c:${COLORS[o.kind]}"></i>`).join("")}</span></button>`; }
  const sel=(byDay[S.calSel]||[]);
  const monthList=Object.keys(byDay).filter(d=>parse(d).getMonth()===m&&parse(d).getFullYear()===y).sort().flatMap(d=>byDay[d]).filter(o=>o.kind!=="cumple").filter((o,i,a)=>a.findIndex(x=>x.open===o.open)===i);
  const row=o=>`<button class="item" data-open="${o.open}">${mark(o.date,COLORS[o.kind],o.end)}<div><span class="tag ${o.kind==="otro"?"":o.kind}">${o.kind==="cumple"?"Cumpleaños 🎂":o.type?typeLabel(o.type):kindName(o.kind)}</span><div class="t" style="margin-top:4px">${esc(o.label)}</div>${o.sub?`<div class="s">${esc(o.sub)}</div>`:""}</div></button>`;
  return `<div class="h2row"><h2>Calendario</h2><div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end">${S.dls?`<button class="btn ghost" data-act="ics">⤓ Al teléfono</button>`:""}${addBtn("Agregar","new-event:paseo")}</div></div>
  <div class="cal"><div class="cal-h"><button data-act="cal:-1" aria-label="Mes anterior">‹</button><h3>${MESL[m]} ${y}</h3><button data-act="cal:1" aria-label="Mes siguiente">›</button></div>
  <div class="cal-g">${g}</div>
  <div class="legend"><span><i class="dot" style="--c:var(--paseo)"></i>Jeepeo / paseo</span><span><i class="dot" style="--c:var(--oficial)"></i>${esc(kindName("oficial"))}</span><span><i class="dot" style="--c:var(--casual)"></i>${esc(kindName("casual"))}</span><span><i class="dot" style="--c:var(--otro)"></i>Otros eventos</span></div></div>
  <div class="h2row"><h3>${longDate(S.calSel)}</h3>${S.canWrite&&S.db?`<button class="link" data-act="new-event-on:${S.calSel}">+ Agregar</button>`:""}</div>
  ${sel.length?`<div class="panel">${sel.map(row).join("")}</div>`:`<p class="muted small">Nada anotado este día.</p>`}
  <div class="h2row"><h3>${MESL[m].charAt(0).toUpperCase()+MESL[m].slice(1)}</h3></div>
  ${monthList.length?`<div class="panel">${monthList.map(row).join("")}</div>`:`<p class="muted small">Sin actividades este mes.</p>`}
  ${vCumples()}`;
}

function vPaseos(){
  const t=todayStr(); const q=S.q.toLowerCase();
  const list=paseos().filter(e=>!q||(e.title+" "+(e.place||"")+" "+(e.description||"")).toLowerCase().includes(q)).sort((a,b)=>a.date<b.date?1:-1);
  let h=`<div class="h2row"><h2>Paseos</h2>${addBtn("Agregar paseo","new-event:paseo")}</div>
  <p class="muted small" style="margin-top:-6px">La bitácora del club: paseos próximos y pasados con sus fotos e información.</p>
  ${meterHtml()}
  <input class="search" type="search" placeholder="Buscar paseo o lugar" value="${esc(S.q)}" data-q aria-label="Buscar paseo">`;
  if(!list.length) return h+`<div class="empty">${q?"Ningún paseo coincide con la búsqueda.":"Aún no hay paseos en la bitácora."}<br>${q?"":addBtn("Agregar el primero","new-event:paseo")}</div>`;
  const years=[...new Set(list.map(e=>e.date.slice(0,4)))];
  if(!S.openYears){ const cy=String(new Date().getFullYear()); const up=list.filter(e=>(e.dateEnd||e.date)>=t).map(e=>e.date.slice(0,4)); S.openYears=new Set(up.length?up:(years.includes(cy)?[cy]:years.slice(0,1))); }
  const byY={}; list.forEach(e=>{ (byY[e.date.slice(0,4)]=byY[e.date.slice(0,4)]||[]).push(e); });
  years.forEach(y=>{ const n=byY[y].length;
    h+=`<details class="yr" data-year="${y}" ${q||S.openYears.has(y)?"open":""}><summary><span class="yt">${y}</span><span class="yc">${n} ${n===1?"paseo":"paseos"}</span><span class="chev" aria-hidden="true">›</span></summary>`;
    byY[y].forEach(e=>{
    const ph=photosOf(e.id); const c=ph[0];
    h+=`<button class="trip" data-open="event:${e.id}"><div class="ph">${c?`<img loading="lazy" src="${blob(thumbOf(c))}" alt="">`:I.jeep.replace('<svg','<svg width="34" height="34"')}</div>
    <div><div class="muted small">${isLive(e)?'<span class="tag live">En vivo</span>':""}${shortDate(e.date)}${e.date>=t?` · <b style="color:var(--red)">${countdown(e.date)||"Próximo"}</b>`:""}</div><div class="t cond" style="font-size:21px;font-weight:600">${esc(e.title)}</div>
    <div class="muted small">${esc([e.place,e.region&&CHILE.names[e.region]].filter(Boolean).join(" · "))}</div><div class="small muted" style="margin-top:4px">${(()=>{ const n=rsvpList("event:"+e.id,"si").length, k=rsvpList("event:"+e.id,"int").length; return (n?n+(n===1?" va · ":" van · "):"")+(k?k+(k===1?" interesado · ":" interesados · "):""); })()}${ph.length?countMedia(ph):"Sin fotos"}${(()=>{ const n=evRoutes(e).length; return n?" · "+n+(n===1?" track":" tracks"):""; })()}</div></div></button>`; });
    h+=`</details>`; });
  return h;
}

/* ---------- descargar calendario ---------- */
const CRC=(()=>{ const t=new Uint32Array(256); for(let n=0;n<256;n++){ let c=n; for(let k=0;k<8;k++) c=c&1?0xEDB88320^(c>>>1):c>>>1; t[n]=c>>>0; } return t; })();
function crc32(u){ let c=0xFFFFFFFF; for(let i=0;i<u.length;i++) c=CRC[(c^u[i])&255]^(c>>>8); return (c^0xFFFFFFFF)>>>0; }
function zip1(name,text){ const enc=new TextEncoder(), nm=enc.encode(name), data=enc.encode(text), crc=crc32(data);
  const lh=new DataView(new ArrayBuffer(30)); lh.setUint32(0,0x04034b50,true); lh.setUint16(4,20,true); lh.setUint16(6,0x0800,true); lh.setUint16(8,0,true); lh.setUint32(14,crc,true); lh.setUint32(18,data.length,true); lh.setUint32(22,data.length,true); lh.setUint16(26,nm.length,true);
  const ch=new DataView(new ArrayBuffer(46)); ch.setUint32(0,0x02014b50,true); ch.setUint16(4,20,true); ch.setUint16(6,20,true); ch.setUint16(8,0x0800,true); ch.setUint32(16,crc,true); ch.setUint32(20,data.length,true); ch.setUint32(24,data.length,true); ch.setUint16(28,nm.length,true);
  const off=30+nm.length+data.length; const ed=new DataView(new ArrayBuffer(22)); ed.setUint32(0,0x06054b50,true); ed.setUint16(8,1,true); ed.setUint16(10,1,true); ed.setUint32(12,46+nm.length,true); ed.setUint32(16,off,true);
  return new Blob([lh,nm,data,ch,nm,ed],{type:"application/zip"}); }
const icsEsc = s => String(s||"").replace(/\\/g,"\\\\").replace(/;/g,"\\;").replace(/,/g,"\\,").replace(/\r?\n/g,"\\n");
function icsFold(line){ const out=[]; let cur=""; for(const ch of line){ if(new TextEncoder().encode(cur+ch).length>73){ out.push(cur); cur=" "+ch; } else cur+=ch; } out.push(cur); return out.join("\r\n"); }
const ymdc = s => s.replace(/-/g,"");
function addDays(s,n){ const d=parse(s); d.setDate(d.getDate()+n); return ymd(d); }
function icsEvent({uid,title,date,end,time,durH=2,place,desc,yearly}){
  const L=["BEGIN:VEVENT","UID:"+uid+"@clubjeeperos","DTSTAMP:"+new Date().toISOString().replace(/[-:]/g,"").slice(0,15)+"Z","SUMMARY:"+icsEsc(title)];
  if(time&&(!end||end===date)&&/^\d{2}:\d{2}$/.test(time)){ const [hh,mm]=time.split(":").map(Number); const e=new Date(2000,0,1,hh+durH,mm);
    L.push("DTSTART:"+ymdc(date)+"T"+pad(hh)+pad(mm)+"00","DTEND:"+ymdc(date)+"T"+pad(e.getHours())+pad(e.getMinutes())+"00"); }
  else L.push("DTSTART;VALUE=DATE:"+ymdc(date),"DTEND;VALUE=DATE:"+ymdc(addDays(end&&end>date?end:date,1)));
  if(yearly) L.push("RRULE:FREQ=YEARLY");
  if(place) L.push("LOCATION:"+icsEsc(place)); if(desc) L.push("DESCRIPTION:"+icsEsc(desc));
  L.push("END:VEVENT"); return L.map(icsFold).join("\r\n"); }
function icsCal(name,evs){ return ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Club de Jeeperos de Chile//App//ES","CALSCALE:GREGORIAN","METHOD:PUBLISH","X-WR-CALNAME:"+icsEsc(name)].concat(evs).concat(["END:VCALENDAR"]).join("\r\n")+"\r\n"; }
function icsSets(){ const t=todayStr();
  const evDesc=e=>[e.meet&&"Punto de encuentro: "+e.meet,e.requisitos&&"Equipamiento mínimo: "+e.requisitos,e.description].filter(Boolean).join("\n");
  const paseosL=S.events.filter(e=>e.type==="paseo"&&(e.dateEnd||e.date)>=t).map(e=>icsEvent({uid:"ev-"+e.id,title:"🚙 "+e.title,date:e.date,end:e.dateEnd,time:e.time,durH:8,place:e.place,desc:evDesc(e)}));
  const mt=meetingItems().filter(m=>m.date>=t&&!m.cancelled).map(m=>{ const mm=allMeetings().find(x=>"mtg:"+x.key===m.target); const ev=m.extra?S.events.find(x=>"event:"+x.id===m.target):null;
    return icsEvent({uid:m.target.replace(/[^a-z0-9-]/gi,"-"),title:m.title,date:m.date,end:m.end,time:mm?mm.time:(ev&&ev.time),durH:2,place:mm?mm.place:(ev&&ev.place),desc:ev?evDesc(ev):(mm&&mm.summary)||""}); });
  const bd=S.socios.filter(s=>/^\d{4}-\d{2}-\d{2}$/.test(s.birth||"")).map(s=>{ const b=S.birthdays.find(x=>x.id===s.id); return icsEvent({uid:"cumple-"+s.id,title:"🎂 Cumpleaños de "+fullName(s),date:nextBday(b),yearly:true}); });
  const otros=S.events.filter(e=>!["paseo","oficial","casual","reunion"].includes(e.type)&&(e.dateEnd||e.date)>=t).map(e=>icsEvent({uid:"ev-"+e.id,title:e.title,date:e.date,end:e.dateEnd,time:e.time,durH:3,place:e.place,desc:evDesc(e)}));
  return [["paseos","Paseos",paseosL,"próximos paseos"],["reuniones","Reuniones",mt,"reuniones de los próximos meses"],["cumpleanos","Cumpleaños",bd,"cumpleaños, se repiten cada año"],["otros","Otros eventos",otros,"cenas, capacitaciones y otros"]]; }
function openIcs(){
  openSheet("Descargar al calendario del teléfono",()=>{ const sets=icsSets();
    return `<p class="small muted" style="margin-top:0">Elige qué quieres agregar. Cada opción descarga un archivo aparte.</p>
    <div style="display:grid;gap:10px">${sets.map(([k,l,evs,sub])=>`<button class="btn ${evs.length?"":"ghost"}" data-ics="${k}" ${evs.length?"":"disabled"} style="flex-direction:column;align-items:flex-start;gap:2px;padding:12px 16px;font-size:18px;text-align:left"><span>⤓ ${l} (${evs.length})</span><span style="font-weight:500;font-size:14px;opacity:.9">${sub.charAt(0).toUpperCase()+sub.slice(1)}</span></button>`).join("")}</div>
    <div class="note" style="margin-top:16px"><b>iPhone:</b> al tocar la opción se abre el calendario; toca <b>Agregar todo</b>.<br><br><b>Android:</b> abre el archivo descargado (aviso de descarga o carpeta Descargas) y elige Google Calendar.<br><br>Es una copia del momento: si después cambia una fecha, hay que volver a descargar.</div>`; },{live:true});
}
async function saveIcs(k){
  const set=icsSets().find(s=>s[0]===k); if(!set||!set[2].length) return;
  const cal=icsCal("Club Jeeperos · "+set[1],set[2]); const base="jeeperos-"+k;
  try{ await S.dls.save({filename:base+".ics",data:new Blob([cal],{type:"text/calendar"})}); }
  catch(e){ if(e&&e.code==="declined") return; toast(e&&e.code==="rate_limited"?"Espera un momento e intenta de nuevo.":"No se pudo descargar desde aquí."); }
}

/* ---------- asistencia ---------- */
const myRsvp = () => S.rsvp.find(r=>r.id===S.uid)||null;
function rsvpList(target,st){ return S.rsvp.filter(r=>!r.pending&&r.t&&r.t[target]&&r.t[target].s===st).map(r=>{ const so=S.socios.find(x=>x.id===r.socioId); return so?fullName(so):(r.name||nameOf(r.id)); }).sort((a,b)=>a.localeCompare(b,"es")); }
function meetingItems(){
  const auto=allMeetings().map(m=>({kind:m.kind,date:m.date,end:"",title:mtgTitle(m),open:"mtg:"+m.key,target:"mtg:"+m.key,cancelled:m.cancelled,summary:m.summary,sub:[m.time,m.place].filter(Boolean).join(" · ")}));
  const extra=S.events.filter(e=>e.type==="reunion"||e.type==="oficial"||e.type==="casual").map(e=>({kind:kindOf(e.type),date:e.date,end:e.dateEnd||"",title:e.title,open:"event:"+e.id,target:"event:"+e.id,cancelled:false,summary:"",sub:[e.time,e.place].filter(Boolean).join(" · "),extra:true}));
  return auto.concat(extra).sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0);
}
function nextMeeting(){ const t=todayStr(); return meetingItems().find(m=>m.date>=t&&!m.cancelled)||null; }
function rsvpBlock(target,{allowNo=false,open=true}={}){
  const mine=(myRsvp()&&myRsvp().t&&myRsvp().t[target]&&myRsvp().t[target].s)||"";
  const yes=rsvpList(target,"si"), no=allowNo?rsvpList(target,"no"):[], intr=allowNo?rsvpList(target,"int"):[];
  const can=open&&S.canPost&&S.db;
  const me=myRsvp()&&S.socios.find(x=>x.id===myRsvp().socioId);
  return `<div class="rsvp">${can?`<div class="rsvp-btns">
      <button class="btn ${mine==="si"?"yes":"ghost"}" data-rsvp="${esc(target)}" data-st="si" aria-pressed="${mine==="si"}">${mine==="si"?"✓ Asistiré":"Asistiré"}</button>
      ${allowNo?`<button class="btn ${mine==="int"?"int":"ghost"}" data-rsvp="${esc(target)}" data-st="int" aria-pressed="${mine==="int"}">Estoy interesado</button>`:""}
      ${allowNo?`<button class="btn ${mine==="no"?"no":"ghost"}" data-rsvp="${esc(target)}" data-st="no" aria-pressed="${mine==="no"}">${mine==="no"?"✗ No asistiré":"No asistiré"}</button>`:""}</div>
      ${mine?`<div class="who-me">Toca de nuevo para quitar tu respuesta.${me?" Respondes como "+esc(fullName(me))+".":""}</div>`:""}`:""}
    <details ${!can?"open":""}><summary>${yes.length} ${yes.length===1?"asistente":"asistentes"}</summary>${yes.length?`<ul>${yes.map(n=>`<li>${esc(n)}</li>`).join("")}</ul>`:`<p class="muted small" style="margin:4px 0">Nadie ha confirmado todavía.</p>`}</details>
    ${allowNo?`<details><summary>${intr.length} ${intr.length===1?"interesado":"interesados"}</summary>${intr.length?`<ul>${intr.map(n=>`<li>${esc(n)}</li>`).join("")}</ul>`:`<p class="muted small" style="margin:4px 0">Nadie todavía.</p>`}</details>`:""}
    ${allowNo?`<details><summary>${no.length} no ${no.length===1?"asistirá":"asistirán"}</summary>${no.length?`<ul>${no.map(n=>`<li>${esc(n)}</li>`).join("")}</ul>`:`<p class="muted small" style="margin:4px 0">Nadie todavía.</p>`}</details>`:""}
  </div>`;
}
async function doRsvp(target,st){
  const cur=myRsvp();
  if(cur&&cur.pending){ toast("Tu identidad está esperando la aprobación del administrador. Cuando te apruebe podrás confirmar asistencia."); return; }
  if(!cur||!cur.socioId){ pickSocio(()=>doRsvp(target,st)); return; }
  const prev=Object.assign({},cur.t||{}); const t=Object.assign({},prev); const removing=!!(t[target]&&t[target].s===st); if(removing) delete t[target]; else t[target]={s:st,at:Date.now()};
  const base={socioId:cur.socioId,name:cur.name||""}; if(cur.pending!=null) base.pending=cur.pending;
  const ok=await write(db=>db.doc("rsvp/"+S.uid).set(Object.assign({},base,{t})));
  if(ok){ const lab={si:"Asistiré",int:"Estoy interesado",no:"No asistiré"}[st]||"";
    toastAction(removing?"Quitaste tu respuesta.":"Marcaste: "+lab+".","Deshacer",()=>{ write(db=>db.doc("rsvp/"+S.uid).set(Object.assign({},base,{t:prev})),"Listo, quedó como antes."); }); }
}
function pickSocioOrig(after){
  let q="";
  openSheet("¿Quién eres?",()=>"",{});
  $("#sb").innerHTML=`<p class="muted small" style="margin-top:0">Elige tu nombre una sola vez. Desde ahí la app sabe que eres tú: tu asistencia quede registrada a tu nombre.</p><input class="search" id="psq" type="search" placeholder="Busca tu apellido" aria-label="Busca tu apellido"><div id="psl"></div>`;
  const paint=()=>{ const n=q.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
    const list=[...S.socios].sort((a,b)=>surnameKey(a).localeCompare(surnameKey(b),"es")).filter(s=>!n||fullName(s).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().includes(n));
    $("#psl").innerHTML=list.map(s=>`<button class="srow" data-pick="${s.id}">${avatar(s)}<div class="sn">${esc(s.nombre||"")} <b>${esc(s.apellido||"")}</b></div></button>`).join("")||`<p class="muted small">No aparece. Pídele a la directiva que te agregue en Socios.</p>`; };
  paint(); $("#psq").addEventListener("input",e=>{ q=e.target.value.trim(); paint(); });
  $("#psl").addEventListener("click",async e=>{ const b=e.target.closest("[data-pick]"); if(!b) return; const so=S.socios.find(x=>x.id===b.dataset.pick);
    if(!await ask("¿Eres "+fullName(so)+"?","Sí, soy yo")) return;
    const cur=myRsvp()||{t:{}};
    const needOk=!!so.directiva&&!S.canAdmin&&!S.isOwner;
    if(needOk&&!await ask(fullName(so)+" es parte de la directiva. Para usar ese nombre, el administrador del club tiene que aprobarlo. ¿Enviar la solicitud?","Enviar solicitud")) return;
    const ok=await write(db=>db.doc("rsvp/"+S.uid).set({socioId:so.id,name:fullName(so),t:cur.t||{},pending:needOk,reqAt:Date.now()}));
    if(ok){ closeSheet(); toast(needOk?"Solicitud enviada. Te avisaremos aquí cuando el administrador la apruebe.":"¡Hola, "+(so.nombre||"").split(" ")[0]+"! La app ya te reconoce."); if(!needOk) setTimeout(after,300); } });
}

function vReuniones(){
  const t=todayStr(); const items=meetingItems(); const nx=nextMeeting();
  const upAll=items.filter(m=>m.date>=t), pastAll=items.filter(m=>m.date<t).reverse();
  const up=S.allUp?upAll:upAll.slice(0,3), past=S.allPast?pastAll:pastAll.slice(0,5);
  const row=m=>{ const n=rsvpList(m.target,"si").length;
    return `<button class="item" data-open="${m.open}">${mark(m.date,COLORS[m.kind],m.end)}<div><span class="tag ${m.kind}">${m.extra?typeLabel(m.kind):kindTag(m.kind)}</span>${m.cancelled?'<span class="tag">Suspendida</span>':""}${m.summary?'<span class="tag">Con resumen</span>':""}${nx&&m.target===nx.target?'<span class="tag" style="background:var(--oficial);color:#fff">Próxima</span>':""}<div class="t" style="margin-top:4px">${esc(m.title)}</div><div class="s">${esc(m.summary?m.summary.split("\n")[0].slice(0,90):m.sub||"Lugar y hora por confirmar")}${n?` · ${n} ${n===1?"asistente":"asistentes"}`:""}</div></div></button>`; };
  let h=`<div class="h2row"><h2>Reuniones</h2>${addBtn("Agregar reunión","new-event:oficial","btn ghost")}</div>
    ${S.config.meetingPlace||S.config.meetingTime?`<p class="small">Lugar habitual: <b>${esc(S.config.meetingPlace||"por definir")}</b>${S.config.meetingTime?", "+esc(S.config.meetingTime)+" h":""}</p>`:""}
  ${S.canAdmin?`<button class="link" data-act="config">Configurar reuniones y botón de ayuda</button>`:""}
  ${nx?`<p class="small" style="margin:10px 0 0">Para confirmar asistencia, abre la reunión marcada como <span class="tag" style="background:var(--oficial);color:#fff">Próxima</span></p>`:""}
  <div class="h2row"><h3>Próximas</h3></div><div class="panel">${up.map(row).join("")||'<p class="muted small">Sin reuniones próximas.</p>'}</div>
  ${upAll.length>3?`<button class="more" data-act="tog-up">${S.allUp?"Ver menos":"Ver más ("+(upAll.length-3)+")"}</button>`:""}`;
  h+=`<div class="h2row"><h3>Anteriores</h3></div><div class="panel">${past.map(row).join("")||'<p class="muted small">Sin reuniones anteriores.</p>'}</div>
  ${pastAll.length>5?`<button class="more" data-act="tog-past">${S.allPast?"Ver menos":"Ver más ("+(pastAll.length-5)+")"}</button>`:""}`;
  return h;
}

const evRouteIds = e => Array.isArray(e.routeIds)&&e.routeIds.length?e.routeIds:(e.routeId?[e.routeId]:[]);
const evRoutes = e => evRouteIds(e).map(id=>S.routes.find(r=>r.id===id)).filter(Boolean);
function gaiaBlock(list){
  if(!list.length) return "";
  const line=r=>`${esc(r.name||r.place)}${r.place&&r.name&&r.name!==r.place?" · "+esc(r.place):""}`;
  if(list.length===1){ const r=list[0], u=safeUrl(r.url); return `<div class="note" style="display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap"><span>Track: <b>${line(r)}</b></span>${u?`<a class="btn blue" href="${esc(u)}" target="_blank" rel="noopener">${I.ext}Abrir en Gaia GPS</a>`:""}</div>`; }
  return `<details class="gaia"><summary class="btn blue">${I.ext}Abrir track en Gaia GPS (${list.length}) ▾</summary><div class="gl">${list.map(r=>{ const u=safeUrl(r.url); return u?`<a href="${esc(u)}" target="_blank" rel="noopener"><span style="flex:1;min-width:0"><b>${line(r)}</b><br><span class="small muted">Subido por ${esc(whoName(r.by))}${r.km?" · "+fmtKm(r.km)+" km":""}</span></span>${I.ext.replace("<svg",'<svg width="18" height="18"')}</a>`:`<div style="padding:11px 14px" class="small muted">${line(r)} (sin enlace de Gaia)</div>`; }).join("")}</div></details>`;
}
function routeGroups(){
  const g={};
  S.routes.forEach(r=>{ const place=(r.place||r.name||"Sin lugar").trim(); const k=normTxt(place); (g[k]=g[k]||{place,items:[]}).items.push(r); });
  return Object.values(g).map(G=>{ const c=findComuna(G.place); const txt=(G.items.find(r=>r.region)||{}).region; const byTxt=txt?(Object.entries(CHILE.names).find(([k,v])=>normTxt(v)===normTxt(txt))||[])[0]:""; const code=(G.items.find(r=>r.regionCode)||{}).regionCode||(c&&c[3])||byTxt||"";
    const lat=c?c[1]:(code?regLat(code):-90); G.items.sort((a,b)=>(a.at||0)-(b.at||0)); return Object.assign(G,{code,lat}); })
   .sort((a,b)=>b.lat-a.lat||a.place.localeCompare(b.place,"es"));
}
function vRutas(){
  const q=normTxt(S.q);
  const groups=routeGroups().map(G=>q?Object.assign({},G,{items:G.items.filter(r=>normTxt([G.place,r.name,r.notes,CHILE.names[G.code]].join(" ")).includes(q))}):G).filter(G=>G.items.length);
  let h=`<div class="h2row"><h2>Rutas</h2>${addBtnP("Compartir ruta","new-route")}</div>
    <input class="search" type="search" placeholder="Buscar lugar, ruta o región" value="${esc(S.q)}" data-q aria-label="Buscar ruta">`;
  if(!groups.length) return h+`<div class="empty">${q?"Ninguna ruta coincide.":"Todavía no hay rutas compartidas."}<br>${q?"":addBtnP("Compartir la primera","new-route")}</div>`;
  let lastReg=null;
  groups.forEach(G=>{ if(G.code!==lastReg){ lastReg=G.code; h+=`<div class="letter" style="font-size:18px">${esc(CHILE.names[G.code]||"Sin región")}</div>`; }
    h+=`<details class="yr" ${q?"open":""}><summary><span style="flex:1;min-width:0"><span class="yt" style="font-size:24px">${esc(G.place)}</span><span class="yc" style="display:block">${G.items.length} ${G.items.length===1?"ruta":"rutas"} · ${esc([...new Set(G.items.map(r=>whoName(r.by)))].join(", "))}</span></span><span class="chev" aria-hidden="true">›</span></summary>`;
    G.items.forEach(r=>{ const url=safeUrl(r.url); const used=paseos().filter(e=>evRouteIds(e).includes(r.id));
      h+=`<div class="route" style="padding-left:6px"><div class="route-top"><div><div class="t" style="font-weight:600">${esc(r.name||G.place)}</div><div class="muted small">Subida por <b>${esc(whoName(r.by))}</b>${r.km?" · "+fmtKm(r.km)+" km"+(r.kmSrc==="gpx"?" (GPX)":""):""}${r.days?" · "+esc(r.days):""}</div></div>${r.difficulty!==""&&r.difficulty!=null?diffHtml(r.difficulty):""}</div>
      ${r.notes?`<p class="small prose" style="margin:6px 0">${esc(r.notes)}</p>`:""}
      <div class="actions" style="margin-top:8px">${url?`<a class="btn blue" href="${esc(url)}" target="_blank" rel="noopener">${I.ext}Abrir en Gaia GPS</a>`:""}${canManage(r)?`<button class="btn ghost" data-act="edit-route:${r.id}">Editar</button>`:""}</div>
      ${used.length?`<div class="small muted" style="margin-top:6px">Usada en ${used.length} ${used.length===1?"paseo":"paseos"}</div>`:""}</div>`; });
    h+=`</details>`; });
  return h;
}

function threadRow(th){ return `<button class="item" data-open="thread:${th.id}"><div style="flex:1;min-width:0"><div class="t">${esc(th.title)}</div><div class="s">${esc(nameOf(th.by))} · ${ago(th.lastAt||th.at)}${th.replies?" · "+th.replies+(th.replies===1?" respuesta":" respuestas"):""}</div></div></button>`; }
function vForo(){
  const list=[...S.threads].sort((a,b)=>(b.lastAt||b.at)-(a.lastAt||a.at));
  return `<div class="h2row"><h2>Foro</h2>${addBtn("Nueva conversación","new-thread")}</div>
  <p class="muted small" style="margin-top:-6px">Dudas mecánicas, compraventa entre socios, ideas de paseos, lo que sea del club.</p>
  ${list.length?`<div class="panel">${list.map(threadRow).join("")}</div>`:`<div class="empty">Sé el primero en escribir.<br>${addBtn("Nueva conversación","new-thread")}</div>`}`;
}

function rerender(){
  if(S.gate) return;
  try{ updateMeBtn(); }catch(_){}
  if(!S.ready){ $("#view").innerHTML=`<p class="muted">Cargando el club…</p>`; return; }
  const active=document.activeElement; const wasQ=active&&active.hasAttribute&&active.hasAttribute("data-q"); const pos=wasQ?active.selectionStart:0;
  let h="";
  if(!S.db) h+=`<div class="note">Conectando con el club…</div>`;
  else if(S.canWrite===false) h+=`<div class="note">${S.canPost?"Perfil de socio: puedes ver todo, subir fotos de los paseos y participar en el paseo en vivo. Para lo demás, habla con la directiva.":"Perfil de socio: puedes ver toda la información del club. Para subir fotos o participar en el paseo en vivo, pide acceso de Colaborador a la directiva."}</div>`;
  h+=({inicio:vInicio,calendario:vCalendario,paseos:vPaseos,reuniones:vReuniones,rutas:vRutas,socios:vSocios,foro:vForo})[S.tab]();
  const sy=window.scrollY; $("#view").innerHTML=h; if(window.scrollY!==sy) window.scrollTo(0,sy);
  if(wasQ){ const q=$("[data-q]"); if(q){ try{ q.focus({preventScroll:true}); }catch(_){ q.focus(); } q.setSelectionRange(pos,pos);} }
  if(sheet&&sheet.live) sheet.render();
  resolveNames();
}
/* ---------- sheets ---------- */
function openSheet(title,bodyFn,{live=false,onClose}={}){
  closeSheet();
  const layer=$("#layer"); layer.innerHTML=`<div class="scrim" data-scrim><div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="sheet-h"><h2>${esc(title)}</h2><button class="x" data-close aria-label="Cerrar">✕</button></div><div class="sheet-b" id="sb"></div></div></div>`;
  sheet={live,onClose,render:()=>{ const sb=$("#sb"); if(sb) sb.innerHTML=bodyFn(); }};
  sheet.render();
  setTimeout(()=>{ const f=$("#sb input,#sb textarea,#sb select"); (live||!f?$("[data-close]"):f).focus(); },30);
}
function closeSheet(){ if(sheet&&sheet.onClose) sheet.onClose(); sheet=null; $("#layer").innerHTML=""; }
function formData(form){ const o={}; new FormData(form).forEach((v,k)=>o[k]=typeof v==="string"?v.trim():v); return o; }

/* event detail */
function openEvent(id){
  const title0=typeLabel((S.events.find(e=>e.id===id)||{}).type);
  openSheet(title0,()=>{
    const e=S.events.find(x=>x.id===id); if(!e) return `<p class="muted">Este evento fue eliminado.</p>`;
    const ph=photosOf(id); const rts=evRoutes(e);
    const past=(e.dateEnd||e.date)<todayStr();
    return `<div class="ev-grid"><div style="min-width:0"><div style="display:flex;gap:14px;align-items:flex-start">${mark(e.date,COLORS[kindOf(e.type)],e.dateEnd)}<div><h2 style="font-size:28px">${esc(e.title)}</h2><div class="muted small">${longDate(e.date)}${e.dateEnd&&e.dateEnd!==e.date?" al "+longDate(e.dateEnd):""}</div>${!past?`<div class="count">${countdown(e.date)}</div>`:""}</div></div>
    <dl class="kv">${e.place?`<dt>Destino</dt><dd>${esc(e.place)}</dd>`:""}${e.meet?`<dt>Punto de encuentro</dt><dd>${esc(e.meet)}</dd>`:""}${e.time?`<dt>Hora</dt><dd>${esc(e.time)}</dd>`:""}${e.difficulty!==""&&e.difficulty!=null?`<dt>Dificultad</dt><dd>${diffHtml(e.difficulty)}</dd>`:""}${e.leader?`<dt>Guía</dt><dd>${esc(e.leader)}</dd>`:""}</dl>
    ${e.kmIV||e.kmJeep?`<div class="note" style="margin:12px 0"><b style="display:block;color:var(--ink);margin-bottom:4px">Distancias</b>
      ${e.kmIV?`<div>Santiago ⇄ ${esc(e.destComuna||e.place||"destino")}: <b>${fmtKm(e.kmIV)} km</b> ida y vuelta${e.kmIVSrc==="auto"?" (estimado)":e.kmIVSrc==="memoria"?" (distancia registrada)":""}</div>`:""}
      ${e.kmJeep?`<div>Δ Jeepeo: <b>${fmtKm(e.kmJeep)} km</b>${e.kmJeepSrc==="gpx"?" (según GPX de Gaia)":e.kmJeepSrc==="ruta"?" (según la ruta)":""}</div>`:""}
      ${e.kmIV&&e.kmJeep?`<div style="margin-top:4px;color:var(--ink)">Total del paseo: <b>${fmtKm(Number(e.kmIV)+Number(e.kmJeep))} km</b></div>`:""}</div>`:""}
    ${e.requisitos?`<div class="note" style="border-left:4px solid var(--red);margin:12px 0"><b style="display:block;margin-bottom:2px;color:var(--ink)">Equipamiento mínimo</b><span class="prose">${esc(e.requisitos)}</span></div>`:""}${e.description?`<p class="prose">${esc(e.description)}</p>`:""}
    </div>${e.type==="paseo"||e.region?chileMap(String(e.region||"")):""}</div>
    ${gaiaBlock(rts)}
    ${(()=>{ const n=liveOf(id).length; const lv=isLive(e);
      if(lv) return `<button class="live-banner" data-live="${id}"><span class="live-dot"></span><span><span class="lt">Paseo en vivo</span><br><span class="ls">${n?n+(n===1?" publicación":" publicaciones")+". Toca para seguirlo o publicar.":"Toca para publicar fotos y avisos desde la ruta."}</span></span></button>`;
      if(n) return `<button class="btn ghost" data-live="${id}" style="margin-bottom:6px">Ver relato en vivo (${n})</button>`;
      if(e.type==="paseo"&&!past&&S.canWrite&&S.db) return `<p class="small muted">El día del paseo se activa solo la transmisión en vivo. <button class="link small" data-act="live-on:${id}">Iniciarla ahora</button></p>`;
      return ""; })()}
    ${e.type==="paseo"?`<div class="h2row" style="margin-top:6px"><h3>¿Vas al paseo?</h3></div>${rsvpBlock("event:"+id,{allowNo:true})}`:(["oficial","casual","reunion"].includes(e.type)?(()=>{ const nx=nextMeeting(); const isNext=nx&&nx.target==="event:"+id; return `<div class="h2row" style="margin-top:6px"><h3>Asistencia</h3></div>${rsvpBlock("event:"+id,{open:!!isNext})}`; })():"")}
    <div class="h2row"><h3>Fotos ${ph.length?`<span class="muted small">(${ph.length})</span>`:""}</h3></div>
    ${ph.length?`<div class="gal">${ph.map((p,k)=>`<button data-photo="${p.id}" aria-label="${p.kind==="video"?"Ver video":"Ver foto"}" style="position:relative">${mediaCell(p)}${k===0?'<span style="position:absolute;left:5px;top:5px;background:rgba(0,0,0,.6);color:#fff;font-size:11px;padding:1px 7px;border-radius:6px">Portada</span>':""}</button>`).join("")}</div>${S.canAdmin&&ph.length>1?`<p class="small muted" style="margin:6px 0 0">Para cambiar la portada, abre una foto y toca ★.</p>`:""}`:`<p class="muted small">${past?"Nadie ha subido fotos de este paseo todavía.":"Después del paseo, suban aquí sus fotos."}</p>`}
    ${S.assets&&S.canPost?`<div class="upl"><label class="btn">${I.cam}<span>Subir fotos</span><input type="file" accept="image/*" multiple hidden data-upload="${id}"></label><span class="muted small">Se pueden elegir varias a la vez.</span></div>`:(S.db&&!S.canPost?`<p class="small muted">Para subir fotos necesitas acceso de editor en esta app.</p>`:"")}
    <p class="small muted" style="margin-top:18px">Agregado por ${esc(nameOf(e.by))}</p>
    ${canManage(e)?`<div class="actions"><button class="btn ghost" data-act="edit-event:${id}">Editar</button><button class="btn line" data-act="del-event:${id}">Eliminar</button></div>`:""}`;
  },{live:true});
}

/* event form */
function eventForm(id,preset={}){
  const e=id?S.events.find(x=>x.id===id):Object.assign({type:"paseo",date:todayStr()},preset);
  const routes=[...S.routes].sort((a,b)=>(a.name||"").localeCompare(b.name||"","es"));
  openSheet(id?"Editar":"Nuevo evento",()=>`<form id="evf">
    <label class="f">Tipo<select name="type">${EV_TYPES.concat(EV_TYPES.some(t=>t[0]===e.type)||!e.type?[]:[[e.type,typeLabel(e.type)]]).map(([v,l])=>`<option value="${v}" ${(e.type==="reunion"?"oficial":e.type)===v?"selected":""}>${l}</option>`).join("")}</select></label>
    <label class="f">Nombre<input name="title" required maxlength="120" value="${esc(e.title||"")}" placeholder="Ej: Cajón del Maipo – Baños Morales"></label>
    <div class="row2"><label class="f">Fecha<input type="date" name="date" required value="${esc(e.date||"")}"></label><label class="f">Hasta (si dura varios días)<input type="date" name="dateEnd" value="${esc(e.dateEnd||"")}"></label></div>
    <div class="row2"><label class="f">Hora de salida<input type="time" name="time" value="${esc(e.time||"")}"></label><label class="f">Dificultad<select name="difficulty"><option value="">—</option>${DIFF.map((d,i)=>`<option value="${i}" ${String(e.difficulty)===String(i)?"selected":""}>${d}</option>`).join("")}</select></label></div>
    <p class="small muted" style="margin:-4px 0 10px">Los campos con * son obligatorios para los paseos.</p>
    <label class="f">Región *<select name="region"><option value="">— Elige la región —</option>${REG_ORDER.map(c=>`<option value="${c}" ${String(e.region||"")===c?"selected":""}>${esc(CHILE.names[c])}</option>`).join("")}</select></label>
    <label class="f">Destino<input name="place" maxlength="140" value="${esc(e.place||"")}" placeholder="Ej: Laguna del Inca, Portillo"></label>
    <label class="f">Comuna o localidad de destino<input name="destComuna" list="dl-comunas" maxlength="60" value="${esc(e.destComuna||"")}" placeholder="Ej: Quintero"></label>
    <div class="row2"><label class="f">Ida y vuelta desde Santiago (km) *<input name="kmIV" inputmode="decimal" maxlength="6" placeholder="Ej: 310" value="${esc(e.kmIV||"")}"></label>
      <label class="f">Δ Jeepeo (km) *<input name="kmJeep" inputmode="decimal" maxlength="6" value="${esc(e.kmJeep||"")}"></label></div>
    <p class="small muted" id="kmhint" style="margin:-6px 0 12px"></p>
    <label class="btn ghost" style="cursor:pointer;margin:-4px 0 14px">Calcular jeepeo con GPX de Gaia<input type="file" accept=".gpx,application/gpx+xml,text/xml" hidden id="egpx"></label>
    <input type="hidden" name="kmIVSrc" value="${esc(e.kmIVSrc||"")}"><input type="hidden" name="kmJeepSrc" value="${esc(e.kmJeepSrc||"")}">
    <label class="f">Punto de encuentro<input name="meet" maxlength="140" value="${esc(e.meet||"")}" placeholder="Ej: Copec de Los Andes"></label>
    <label class="f">Guía o encargado<input name="leader" maxlength="80" value="${esc(e.leader||"")}"></label>
    <div class="f" style="font-size:14px;font-weight:600;color:var(--muted)">Tracks de Gaia (puedes elegir varios)<div class="panel" style="margin-top:4px;padding:2px 12px;max-height:220px;overflow:auto">${routes.length?routes.map(r=>`<label class="chk" style="font-weight:400;color:var(--ink)"><input type="checkbox" name="rt" value="${esc(r.id)}" ${evRouteIds(e).includes(r.id)?"checked":""}><span>${esc(r.name||r.place)}${r.place&&r.name!==r.place?` <span class="muted">· ${esc(r.place)}</span>`:""}${r.km?` <span class="muted">· ${fmtKm(r.km)} km</span>`:""}</span></label>`).join(""):`<p class="small muted" style="margin:8px 0">Aún no hay tracks. Compártelos primero en la sección Rutas.</p>`}</div></div>
    <label class="f">Equipamiento mínimo *<textarea name="requisitos" maxlength="2000" style="min-height:80px" placeholder="Ej: neumáticos M/T 31&quot; o más, winche, radio VHF, bloqueo trasero. Si no se necesita nada especial, escribe &quot;Ninguno&quot;.">${esc(e.requisitos||"")}</textarea></label>
    <label class="f">Descripción general *<textarea name="description" maxlength="4000" placeholder="Cuántos días dura, si es con cabaña o camping, itinerario, qué llevar, si van familias, etc.">${esc(e.description||"")}</textarea></label>
    <div class="actions"><button class="btn" type="submit">${id?"Guardar cambios":"Agregar al calendario"}</button><button class="btn ghost" type="button" data-close>Cancelar</button></div></form>`);
  fillDatalists();
  { const F=$("#evf"); const hint=()=>{ const ex=estIVx(F.destComuna.value); const est=ex&&ex.km; const rt=[...F.querySelectorAll("[name=rt]:checked")].map(c=>S.routes.find(x=>x.id===c.value)).find(r=>r&&r.km);
      $("#kmhint").textContent="Escribe los km ida y vuelta desde Santiago según Google Maps, sin contar el jeepeo. "+(ex&&ex.src==="memoria"?"La última vez se registraron "+fmtKm(est)+" km para este destino. ":"")+(rt&&rt.km&&!F.kmJeep.value?"La ruta elegida tiene "+fmtKm(rt.km)+" km.":""); };
    F.destComuna.addEventListener("change",()=>{  const c=findComuna(F.destComuna.value); if(c&&!F.region.value) F.region.value=c[3]; hint(); });
    F.kmIV.addEventListener("input",()=>{ F.kmIVSrc.value=F.kmIV.value?"manual":""; });
    F.kmJeep.addEventListener("input",()=>{ F.kmJeepSrc.value=F.kmJeep.value?"manual":""; });
    F.querySelectorAll("[name=rt]").forEach(cb=>cb.addEventListener("change",()=>{ const rt=[...F.querySelectorAll("[name=rt]:checked")].map(c=>S.routes.find(x=>x.id===c.value)).find(r=>r&&r.km); if(rt&&rt.km&&(!F.kmJeep.value||F.kmJeepSrc.value==="ruta")){ F.kmJeep.value=rt.km; F.kmJeepSrc.value="ruta"; } hint(); }));
    $("#egpx").addEventListener("change",async e=>{ const fl=e.target.files[0]; if(!fl) return; try{ const km=gpxKm(await fl.text()); if(km){ F.kmJeep.value=km; F.kmJeepSrc.value="gpx"; toast("Jeepeo de "+fmtKm(km)+" km según el GPX"); } else toast("El archivo no trae puntos de ruta."); }catch(_){ toast("No se pudo leer el GPX."); } });
    hint(); }
  $("#evf").addEventListener("submit",async ev=>{ ev.preventDefault(); const d=formData(ev.target);
    if(d.dateEnd&&d.dateEnd<d.date) d.dateEnd=""; d.difficulty=d.difficulty===""?"":Number(d.difficulty);
    delete d.rt; d.routeIds=[...ev.target.querySelectorAll("[name=rt]:checked")].map(c=>c.value); d.routeId=d.routeIds[0]||"";
    for(const k of ["kmIV","kmJeep"]){ d[k]=d[k]?Number(String(d[k]).replace(",",".")):""; if(d[k]!==""&&isNaN(d[k])){ toast("Los kilómetros deben ser un número."); return; } }
    if(d.kmIV!=="") d.kmIVSrc="manual";
    if(d.type==="paseo"){ const F2=ev.target; F2.querySelectorAll(".f.bad").forEach(x=>x.classList.remove("bad")); const miss=[];
      const need=(name,label,ok)=>{ if(!ok){ miss.push(label); const el=F2.querySelector(`[name=${name}]`); if(el&&el.closest(".f")) el.closest(".f").classList.add("bad"); } };
      need("region","región",!!d.region);
      need("kmIV","km ida y vuelta",d.kmIV!==""&&d.kmIV>0);
      need("kmJeep","km del jeepeo",d.kmJeep!==""&&d.kmJeep>0);
      need("requisitos","equipamiento mínimo",!!(d.requisitos||"").trim()); need("description","descripción general",!!(d.description||"").trim());
      if(miss.length){ toast("Faltan datos obligatorios: "+miss.join(", ")+". Están marcados en rojo."); const b1=F2.querySelector(".f.bad input,.f.bad select,.f.bad textarea"); if(b1){ b1.focus(); b1.scrollIntoView({block:"center",behavior:"smooth"}); } return; } }
    if(d.destComuna&&d.kmIV!==""&&d.kmIVSrc==="manual"&&S.canAdmin&&S.db){ S.db.doc("distancias/"+distKey(d.destComuna)).set({name:d.destComuna,km:d.kmIV,at:Date.now()}).catch(()=>{}); }
    const btn=ev.target.querySelector("[type=submit]"); btn.disabled=true;
    let newId=id;
    const ok=await write(async db=>{ if(id){ await db.doc("events/"+id).update(d); } else { const ref=await db.collection("events").add(Object.assign(d,{by:S.uid||null,at:Date.now()})); newId=ref.id; } }, id?"Cambios guardados":"Agregado al calendario");
    if(ok){ openEvent(newId); } else btn.disabled=false; });
}

/* meeting */
function openMeeting(key){
  openSheet("Reunión",()=>{
    const m=allMeetings().find(x=>x.key===key); if(!m) return `<p class="muted">Reunión no encontrada.</p>`;
    const past=m.date<todayStr();
    return `<div style="display:flex;gap:14px;align-items:flex-start">${mark(m.date,COLORS[m.kind])}<div><span class="tag ${m.kind}">${kindTag(m.kind)}</span>${m.cancelled?'<span class="tag">Suspendida</span>':""}<h2 style="font-size:28px;margin-top:4px">${mtgTitle(m)}</h2><div class="muted small">${longDate(m.date)}</div>${!past&&!m.cancelled?`<div class="count">${countdown(m.date)}</div>`:""}</div></div>
    <dl class="kv"><dt>Hora</dt><dd>${esc(m.time||"Por confirmar")}</dd><dt>Lugar</dt><dd>${esc(m.place||"Por confirmar")}</dd></dl>
    ${(()=>{ const nx=nextMeeting(); const isNext=nx&&nx.target==="mtg:"+key; const n=rsvpList("mtg:"+key,"si").length;
      return isNext?`<div class="h2row" style="margin-top:6px"><h3>Asistencia</h3></div>${rsvpBlock("mtg:"+key)}`:(n||past?`<div class="h2row" style="margin-top:6px"><h3>Asistencia</h3></div>${rsvpBlock("mtg:"+key,{open:false})}`:`<p class="small muted">La confirmación de asistencia se abre cuando esta sea la próxima reunión.</p>`); })()}
    <div class="h2row"><h3>Resumen de la reunión</h3></div>
    ${m.summary?`<p class="prose">${esc(m.summary)}</p>`:`<p class="muted small">${past?"Nadie ha escrito el resumen todavía. Temas tratados, acuerdos y próximos pasos.":"Después de la reunión, aquí se anotan los temas tratados y acuerdos."}</p>`}
    ${S.canAdmin&&S.db?`<div class="actions"><button class="btn" data-act="edit-mtg:${key}">${m.summary?"Editar resumen o datos":"Escribir resumen / cambiar fecha"}</button></div>`:""}`;
  },{live:true});
}
function meetingForm(key){
  const m=allMeetings().find(x=>x.key===key);
  openSheet(mtgTitle(m),()=>`<form id="mf">
    <label class="f">Nombre de esta reunión (opcional)<input name="title" maxlength="80" value="${esc(m.title||"")}" placeholder="${esc(kindName(m.kind))}"></label>
    <div class="row2"><label class="f">Fecha<input type="date" name="date" required value="${esc(m.date)}"></label><label class="f">Hora<input type="time" name="time" value="${esc(m.time)}"></label></div>
    <label class="f">Lugar<input name="place" maxlength="140" value="${esc(m.place)}"></label>
    <label class="f">Resumen (temas, acuerdos, próximos pasos)<textarea name="summary" maxlength="8000" style="min-height:180px">${esc(m.summary)}</textarea></label>
    <label style="display:flex;gap:8px;align-items:center;margin-bottom:12px"><input type="checkbox" name="cancelled" ${m.cancelled?"checked":""}> Reunión suspendida</label>
    <div class="actions"><button class="btn" type="submit">Guardar</button><button class="btn ghost" type="button" data-close>Cancelar</button></div></form>`);
  $("#mf").addEventListener("submit",async ev=>{ ev.preventDefault(); const d=formData(ev.target); d.cancelled=ev.target.cancelled.checked;
    const ok=await write(db=>db.doc("meetings/"+key).set(Object.assign(d,{by:S.uid||null,at:Date.now()})),"Reunión guardada"); if(ok) openMeeting(key); });
}
function configForm(){
  openSheet("Configurar reuniones",()=>`<form id="cf"><p class="muted small">Se usan para todas las reuniones, salvo las que se editen una a una. Solo los administradores pueden cambiar esto.</p>
    <label class="f">Nombre de la reunión del primer jueves<input name="oficialName" maxlength="60" value="${esc(S.config.oficialName||"")}" placeholder="Reunión oficial"></label>
    <label class="f">Nombre de la reunión del tercer jueves<input name="casualName" maxlength="60" value="${esc(S.config.casualName||"")}" placeholder="Reunión casual"></label>
    <label class="f">WhatsApp para el botón "¿Necesitas ayuda?"<input name="helpWa" type="tel" maxlength="20" value="${esc(S.config.helpWa||"")}" placeholder="+56 9 …"></label>
    <label class="f">Lugar habitual<input name="meetingPlace" maxlength="140" value="${esc(S.config.meetingPlace||"")}"></label>
    <label class="f">Hora habitual<input type="time" name="meetingTime" value="${esc(S.config.meetingTime||"")}"></label>
    <div class="actions"><button class="btn" type="submit">Guardar</button></div></form>`);
  $("#cf").addEventListener("submit",async ev=>{ ev.preventDefault(); const ok=await write(db=>db.doc("config/club").set(Object.assign({},S.config,formData(ev.target))),"Guardado"); if(ok) closeSheet(); });
}

/* routes */
function fillDatalists(){ const dc=$("#dl-comunas"); if(dc){ const mem=Object.values(S.dist).map(x=>x.name).filter(n=>n&&!findComuna(n)); dc.innerHTML=mem.concat(COMUNAS.map(c=>c[0])).map(n=>`<option value="${esc(n)}">`).join(""); }
  const dl=$("#dl-lugares"); if(dl){ const ps=[...new Set(S.routes.map(r=>(r.place||r.name||"").trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"es")); dl.innerHTML=ps.concat(COMUNAS.map(c=>c[0]).filter(n=>!ps.includes(n))).map(p=>`<option value="${esc(p)}">`).join(""); } }
function routeForm(id){
  const r=id?S.routes.find(x=>x.id===id):{}; fillDatalists();
  openSheet(id?"Editar ruta":"Compartir ruta",()=>`<form id="rf">
    <label class="f">Lugar<input name="place" required maxlength="80" list="dl-lugares" value="${esc(r.place||(id?r.name:"")||"")}" placeholder="Ej: Ritoque"></label>
    <p class="small muted" style="margin:-6px 0 12px">Si el lugar ya existe, elígelo de la lista para que tu ruta quede agrupada con las demás.</p>
    <label class="f">Nombre o variante de la ruta<input name="name" maxlength="120" value="${esc(id&&r.place?r.name:"")}" placeholder="Ej: Por las dunas, saliendo de Quintero"></label>
    <label class="f">Región<select name="regionCode"><option value="">—</option>${REG_ORDER.map(c=>`<option value="${c}" ${(r.regionCode||"")===c?"selected":""}>${esc(CHILE.names[c])}</option>`).join("")}</select></label>
    <label class="f">Enlace de Gaia GPS<input name="url" type="url" inputmode="url" value="${esc(r.url||"")}" placeholder="https://www.gaiagps.com/..."></label>
    <div class="row2"><label class="f">Kilómetros del jeepeo<input name="km" inputmode="decimal" maxlength="8" value="${esc(r.km||"")}"></label>
      <div class="f" style="font-size:14px;font-weight:600;color:var(--muted)">o desde Gaia<label class="btn ghost" style="cursor:pointer;margin-top:4px;width:100%;justify-content:center">Subir GPX<input type="file" accept=".gpx,application/gpx+xml,text/xml" hidden id="rgpx"></label></div></div>
    <input type="hidden" name="kmSrc" value="${esc(r.kmSrc||"")}">
    <div class="row2"><label class="f">Dificultad<select name="difficulty"><option value="">—</option>${DIFF.map((d,i)=>`<option value="${i}" ${String(r.difficulty)===String(i)?"selected":""}>${d}</option>`).join("")}</select></label><label class="f">Duración<input name="days" maxlength="30" value="${esc(r.days||"")}" placeholder="Ej: 2 días"></label></div>
    <label class="f">Notas<textarea name="notes" maxlength="3000" placeholder="Pasos de agua, época recomendada, combustible, señal, permisos…">${esc(r.notes||"")}</textarea></label>
    <div class="actions"><button class="btn" type="submit">${id?"Guardar cambios":"Compartir ruta"}</button>${id?`<button class="btn line" type="button" data-act="del-route:${id}">Eliminar</button>`:""}<button class="btn ghost" type="button" data-close>Cancelar</button></div></form>`);
  const F=$("#rf");
  F.place.addEventListener("change",()=>{ const c=findComuna(F.place.value); const ex=S.routes.find(x=>normTxt(x.place||x.name)===normTxt(F.place.value)&&x.regionCode); if(!F.regionCode.value) F.regionCode.value=(ex&&ex.regionCode)||(c&&c[3])||""; });
  F.km.addEventListener("input",()=>{ F.kmSrc.value="manual"; });
  $("#rgpx").addEventListener("change",async e=>{ const fl=e.target.files[0]; if(!fl) return; try{ const km=gpxKm(await fl.text()); if(km){ F.km.value=km; F.kmSrc.value="gpx"; toast("Ruta de "+fmtKm(km)+" km según el GPX"); } else toast("El archivo no trae puntos de ruta."); }catch(_){ toast("No se pudo leer el GPX."); } });
  F.addEventListener("submit",async ev=>{ ev.preventDefault(); const d=formData(F);
    if(d.url&&!safeUrl(d.url)){ toast("El enlace debe empezar con https://"); return; }
    if(!d.name) d.name=d.place;
    d.difficulty=d.difficulty===""?"":Number(d.difficulty); d.km=d.km?Number(String(d.km).replace(",",".")):""; if(d.km!==""&&isNaN(d.km)){ toast("Los kilómetros deben ser un número."); return; }
    if(!d.regionCode){ const c=findComuna(d.place); if(c) d.regionCode=c[3]; }
    const ok=await write(db=>id?db.doc("routes/"+id).update(d):db.collection("routes").add(Object.assign(d,{by:S.uid||null,at:Date.now()})),id?"Cambios guardados":"Ruta compartida");
    if(ok) closeSheet(); });
}

/* forum */
let repliesUnsub=null;
function openThread(id){
  let replies=[];
  const render=()=>{ const th=S.threads.find(x=>x.id===id); if(!th) return `<p class="muted">Conversación eliminada.</p>`;
    return `<div class="post"><div class="by"><span class="who">${esc(nameOf(th.by))}</span> · ${ago(th.at)}</div><h3 style="margin-bottom:6px">${esc(th.title)}</h3><div class="prose">${esc(th.body)}</div>${canManage(th)?`<div style="margin-top:8px"><button class="link" data-act="del-thread:${id}">Eliminar conversación</button></div>`:""}</div>
    ${replies.map(r=>`<div class="post"><div class="by"><span class="who">${esc(nameOf(r.by))}</span> · ${ago(r.at)}${canManage(r)?` · <button class="link small" data-act="del-reply:${id}:${r.id}">Borrar</button>`:""}</div><div class="prose">${esc(r.body)}</div></div>`).join("")}
    ${S.canWrite&&S.db?`<form id="rpf" style="margin-top:12px"><label class="f">Tu respuesta<textarea name="body" required maxlength="4000" style="min-height:80px"></textarea></label><button class="btn" type="submit">Responder</button></form>`:""}`; };
  openSheet("Conversación",()=>"",{live:false,onClose:()=>{ if(repliesUnsub){ repliesUnsub(); repliesUnsub=null; } }});
  let draft="";
  const paint=()=>{ const ta=$("#rpf textarea"); if(ta) draft=ta.value; const sb=$("#sb"); if(!sb) return; sb.innerHTML=render(); const t2=$("#rpf textarea"); if(t2){ t2.value=draft; }
    const f=$("#rpf"); if(f) f.addEventListener("submit",async ev=>{ ev.preventDefault(); const body=formData(f).body; if(!body) return;
      const ok=await write(async db=>{ await db.collection("threads/"+id+"/replies").add({body,by:S.uid||null,at:Date.now()}); const th=S.threads.find(x=>x.id===id); await db.doc("threads/"+id).update({lastAt:Date.now(),replies:(th&&th.replies||0)+1}); });
      if(ok){ draft=""; const t3=$("#rpf textarea"); if(t3) t3.value=""; } }); };
  sheet.render=paint; sheet.live=true; paint();
  if(S.db){ repliesUnsub=S.db.collection("threads/"+id+"/replies").orderBy("at","asc").limit(500).onSnapshot(snap=>{ replies=snap.docs.map(d=>Object.assign({id:d.id},d.data())); replies.forEach(r=>{ if(r.by&&!(r.by in S.names)&&S.user){ S.user.profiles([r.by]).then(ps=>{ S.names[r.by]=(ps&&ps[r.by]&&ps[r.by].name)||""; if(sheet) paint(); }); } }); if(sheet) paint(); },()=>{}); }
}
function threadForm(){
  openSheet("Nueva conversación",()=>`<form id="tf"><label class="f">Tema<input name="title" required maxlength="140" placeholder="Ej: ¿Alguien recomienda taller para winch?"></label><label class="f">Mensaje<textarea name="body" required maxlength="6000"></textarea></label><div class="actions"><button class="btn" type="submit">Publicar</button><button class="btn ghost" type="button" data-close>Cancelar</button></div></form>`);
  $("#tf").addEventListener("submit",async ev=>{ ev.preventDefault(); const d=formData(ev.target); let nid=null;
    const ok=await write(async db=>{ const now=Date.now(); const ref=await db.collection("threads").add(Object.assign(d,{by:S.uid||null,at:now,lastAt:now,replies:0})); nid=ref.id; },"Publicado"); if(ok&&nid) openThread(nid); });
}

/* profile */
function meSocio(){ const r=myRsvp(); return r&&!r.pending&&S.socios.find(x=>x.id===r.socioId)||null; }
const iAmPending = () => { const r=myRsvp(); return !!(r&&r.pending&&r.socioId); };
function updateMeBtn(){ const b=$("#meBtn"); if(!b) return; const so=meSocio(); b.textContent=so?"Hola, "+(so.nombre||"").split(" ")[0]:iAmPending()?"En revisión":"¿Quién eres?"; }
function profileForm(){
  if(iAmPending()){ const r=myRsvp(); const so=S.socios.find(x=>x.id===r.socioId);
    openSheet("Mi perfil",()=>`<p>Pediste usar el nombre <b>${esc(so?fullName(so):r.name||"")}</b>, que es de la directiva.</p><p class="muted">Tu solicitud está <b>esperando la aprobación del administrador</b>. Mientras tanto puedes ver todo, pero no confirmar asistencia a su nombre.</p><div class="actions"><button class="btn line" data-act="whoami">Elegí mal / cambiar</button></div>`); return; }
  if(!meSocio()){ pickSocio(()=>{}); return; }
  openSheet("Mi perfil",()=>{ const so=meSocio(); if(!so) return `<p class="muted">Aún no eliges quién eres.</p><button class="btn" data-act="whoami">Elegir mi nombre</button>`;
    const n=Object.values(S.rsvp.find(r=>r.id===S.uid)||{t:{}}).length; const mine=(myRsvp()&&myRsvp().t)||{}; const yes=Object.values(mine).filter(x=>x.s==="si").length;
    return `<div style="display:flex;gap:14px;align-items:center">${avatar(so,true)}<div><h2 style="font-size:26px">${esc(fullName(so))}</h2><div class="small muted">${so.directiva?'<span class="tag dir">Directiva</span>':'<span class="tag">Socio</span>'}${vehOf(so)?" "+esc(vehOf(so)):""}</div></div></div>
      <p class="small muted" style="margin-top:14px">La app te reconoce por tu cuenta, en cualquier teléfono o computador donde entres: tus confirmaciones de asistencia, fotos y rutas quedan a tu nombre.${yes?" Has confirmado asistencia a "+yes+(yes===1?" actividad.":" actividades."):""}</p>
      <div class="actions"><button class="btn ghost" data-open="socio:${so.id}">Ver mi ficha</button><button class="btn line" data-act="whoami">No soy yo / cambiar</button></div>`; },{live:true});
}

/* lightbox */
const VBLOB=new Map();
async function loadVideoBlob(v,label){
  const src=v.getAttribute("data-vsrc"); if(!src) return;
  try{
    let url=VBLOB.get(src);
    if(!url){ const r=await fetch(src); if(!r.ok) throw new Error("HTTP "+r.status); const b=await r.blob();
      const t=/webm/.test(b.type)?"video/webm":"video/mp4"; url=URL.createObjectURL(new Blob([b],{type:t})); VBLOB.set(src,url); }
    if(!v.isConnected) return; v.src=url; if(label) label.remove(); v.play().catch(()=>{});
  }catch(e){ if(label) label.textContent="No se pudo cargar el video ("+(e&&e.message||"error")+")."; }
}
function openPhoto(pid){
  const p0=S.photos.find(x=>x.id===pid); if(!p0) return;
  const set=photosOf(p0.eventId); let i=set.findIndex(x=>x.id===pid);
  const ev=S.events.find(e=>e.id===p0.eventId);
  const lb=document.createElement("div"); lb.className="lb"; lb.setAttribute("role","dialog"); lb.setAttribute("aria-label","Foto");
  const paint0=()=>{ const p=set[i]; lb.innerHTML=`${p.kind==="video"?`<video data-vsrc="${esc(blob(p.asset))}" ${p.poster?`poster="${blob(p.poster)}"`:""} controls playsinline webkit-playsinline preload="none"></video><div class="vload" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);color:#fff;font-size:15px;background:rgba(0,0,0,.55);padding:8px 14px;border-radius:12px">Cargando video…</div>`:`<img src="${blobFull(p.asset)}" alt="">`}
    <div class="tb">${S.canAdmin&&S.db&&ev?`<button data-lb="cover" aria-label="${ev.cover===p.id?"Es la portada":"Usar como portada del paseo"}" title="${ev.cover===p.id?"Es la portada":"Usar como portada"}" style="${ev.cover===p.id?"background:#E8B93A;color:#17202E":""}">★</button>`:""}${canManage(p)?`<button data-lb="del" aria-label="Eliminar foto" title="Eliminar">🗑</button>`:""}<button data-lb="x" aria-label="Cerrar">✕</button></div>
    ${set.length>1?`<button class="nav p" data-lb="p" aria-label="Anterior">‹</button><button class="nav n" data-lb="n" aria-label="Siguiente">›</button>`:""}
    <div class="bar"><span class="cap">${esc(ev?ev.title:"")} · ${esc(nameOf(p.by))}</span><span>${i+1} / ${set.length}</span>${ev?`<button class="link" style="color:#fff" data-lb="go">Ver paseo</button>`:""}</div>`; };
  const paint=()=>{ paint0(); const v=lb.querySelector("video[data-vsrc]"); if(v) loadVideoBlob(v,lb.querySelector(".vload")); };
  paint(); document.body.appendChild(lb); lb.querySelector("[data-lb=x]").focus();
  const close=()=>{ lb.querySelectorAll("video").forEach(v=>{ try{ v.pause(); }catch(_){} }); lb.remove(); document.removeEventListener("keydown",key); };
  const key=e=>{ if(e.key==="Escape") close(); if(e.key==="ArrowRight"&&set.length>1){ i=(i+1)%set.length; paint(); } if(e.key==="ArrowLeft"&&set.length>1){ i=(i-1+set.length)%set.length; paint(); } };
  document.addEventListener("keydown",key);
  let sx=null; lb.addEventListener("touchstart",e=>{sx=e.touches[0].clientX;},{passive:true}); lb.addEventListener("touchend",e=>{ if(sx==null||set.length<2) return; const dx=e.changedTouches[0].clientX-sx; if(Math.abs(dx)>50){ i=dx<0?(i+1)%set.length:(i-1+set.length)%set.length; paint(); } sx=null; });
  lb.addEventListener("click",async e=>{ const b=e.target.closest("[data-lb]"); if(!b) return; const a=b.dataset.lb;
    if(a==="x") close(); else if(a==="n"){ i=(i+1)%set.length; paint(); } else if(a==="p"){ i=(i-1+set.length)%set.length; paint(); }
    else if(a==="go"){ close(); openEvent(p0.eventId); }
    else if(a==="cover"){ const p=set[i]; const evn=S.events.find(e=>e.id===p0.eventId); if(!evn) return; if(evn.cover===p.id){ toast("Esta ya es la portada del paseo."); return; }
      const ok=await write(db=>db.doc("events/"+evn.id).update({cover:p.id}),"Listo: es la nueva portada del paseo"); if(ok){ evn.cover=p.id; paint(); } }
    else if(a==="del"){ if(!await ask("¿Eliminar esta foto?")) return; const p=set[i]; const ok=await write(db=>db.doc("photos/"+p.id).delete(),"Foto eliminada"); if(ok){ if(S.assets){ S.assets.delete(p.asset).catch(()=>{}); if(p.poster) S.assets.delete(p.poster).catch(()=>{}); } set.splice(i,1); if(!set.length) close(); else { i=i%set.length; paint(); } } } });
}

/* ---------- events ---------- */
document.addEventListener("click",async e=>{
  const t=e.target;
  if(t.matches("[data-scrim]")){ closeSheet(); return; }
  const c=t.closest("[data-close]"); if(c){ closeSheet(); return; }
  const tab=t.closest("[data-tab]"); if(tab){ S.tab=tab.dataset.tab; S.q=""; closeSheet(); renderTabs(); rerender(); window.scrollTo(0,0); return; }
  const day=t.closest("[data-day]"); if(day){ S.calSel=day.dataset.day; const d=parse(S.calSel); S.calY=d.getFullYear(); S.calM=d.getMonth(); rerender(); return; }
  const ic=t.closest("[data-ics]"); if(ic){ saveIcs(ic.dataset.ics); return; }
  const rv=t.closest("[data-rsvp]"); if(rv){ doRsvp(rv.dataset.rsvp,rv.dataset.st); return; }
  const lv=t.closest("[data-live]"); if(lv){ openLive(lv.dataset.live); return; }
  const ph=t.closest("[data-photo]"); if(ph){ openPhoto(ph.dataset.photo); return; }
  const op=t.closest("[data-open]"); if(op){ const [k,...r]=op.dataset.open.split(":"); const id=r.join(":");
    if(k==="tab"){ S.tab=id; S.q=""; renderTabs(); rerender(); window.scrollTo(0,0); return; }
    if(k==="bday"||k==="socio"){ openSocio(id); return; } if(k==="event") openEvent(id); else if(k==="mtg") openMeeting(id); else if(k==="thread") openThread(id); return; }
  const a=t.closest("[data-act]"); if(!a) return; const [act,...rest]=a.dataset.act.split(":"); const arg=rest.join(":");
  if(act==="cal"){ S.calM+=Number(arg); if(S.calM<0){S.calM=11;S.calY--;} if(S.calM>11){S.calM=0;S.calY++;} rerender(); }
  else if(act==="new-event") eventForm(null,{type:arg});
  else if(act==="new-event-on") eventForm(null,{type:"paseo",date:arg});
  else if(act==="edit-event") eventForm(arg);
  else if(act==="del-event"){ const n=photosOf(arg).length; if(!await ask(n?"Este paseo tiene "+n+" fotos. ¿Eliminarlo igual? Las fotos también se borrarán.":"¿Eliminar este evento?")) return;
    const ok=await write(async db=>{ for(const p of photosOf(arg)){ await db.doc("photos/"+p.id).delete(); if(S.assets) S.assets.delete(p.asset).catch(()=>{}); } await db.doc("events/"+arg).delete(); },"Eliminado"); if(ok) closeSheet(); }
  else if(act==="live-on"){ const ok=await write(db=>db.doc("events/"+arg).update({live:true}),"Transmisión en vivo iniciada"); if(ok&&!(sheet&&$("#lvfeed"))) openLive(arg); }
  else if(act==="live-off"){ if(!await ask("¿Terminar la transmisión en vivo? Las publicaciones quedan como relato del paseo.","Terminar")) return; await write(db=>db.doc("events/"+arg).update({live:false}),"Transmisión terminada"); }
  else if(act==="del-live"){ const p=S.live.find(x=>x.id===arg); if(!p||!await ask("¿Borrar esta publicación?")) return;
    await write(async db=>{ await db.doc("live/"+p.id).delete(); if(p.photoId) await db.doc("photos/"+p.photoId).delete(); if(p.asset&&S.assets) S.assets.delete(p.asset).catch(()=>{}); },"Publicación borrada"); }
  else if(act==="ics") openIcs();
  else if(act==="okwho"){ const id=a.dataset.id; await write(db=>db.doc("rsvp/"+id).update({pending:false}),"Aprobado"); }
  else if(act==="nowho"){ const id=a.dataset.id; if(!await ask("¿Rechazar? Esa persona tendrá que elegir su nombre de nuevo.","Rechazar")) return; await write(db=>db.doc("rsvp/"+id).update({pending:false,socioId:"",name:""}),"Solicitud rechazada"); }
  else if(act==="whoami"){ closeSheet(); setTimeout(()=>pickSocio(()=>{}),250); }
  else if(act==="tog-up"){ S.allUp=!S.allUp; rerender(); }
  else if(act==="tog-past"){ S.allPast=!S.allPast; rerender(); }
  else if(act==="new-bday"||act==="new-socio") socioForm(null);
  else if(act==="edit-socio") socioForm(arg);
  else if(act==="del-socio"){ const s=S.socios.find(x=>x.id===arg); if(!s||!await ask("¿Eliminar a "+fullName(s)+" del listado de socios?")) return; const ok=await write(async db=>{ await db.doc("socios/"+arg).delete(); if(s.foto&&S.assets) S.assets.delete(s.foto).catch(()=>{}); },"Socio eliminado"); if(ok) closeSheet(); }
  else if(act==="go-cumples"){ S.tab="calendario"; S.calY=new Date().getFullYear(); S.calM=new Date().getMonth(); renderTabs(); rerender(); setTimeout(()=>{ const c=document.getElementById("cumples"); if(c) c.scrollIntoView({behavior:"smooth"}); },50); }
  else if(act==="all-bdays") openBdays();
  else if(act==="del-bday"){ if(!await ask("¿Eliminar este cumpleaños?")) return; const ok=await write(db=>db.doc("birthdays/"+arg).delete(),"Eliminado"); if(ok) closeSheet(); }
  else if(act==="edit-mtg") meetingForm(arg);
  else if(act==="config") configForm();
  else if(act==="new-route") routeForm(null);
  else if(act==="edit-route") routeForm(arg);
  else if(act==="del-route"){ if(!await ask("¿Eliminar esta ruta?")) return; const ok=await write(db=>db.doc("routes/"+arg).delete(),"Ruta eliminada"); if(ok) closeSheet(); }
  else if(act==="new-thread") threadForm();
  else if(act==="del-thread"){ if(!await ask("¿Eliminar la conversación completa?")) return; const ok=await write(db=>db.doc("threads/"+arg).delete(),"Conversación eliminada"); if(ok) closeSheet(); }
  else if(act==="del-reply"){ const [tid,rid]=arg.split(":"); if(!await ask("¿Borrar esta respuesta?")) return; await write(async db=>{ await db.doc("threads/"+tid+"/replies/"+rid).delete(); const th=S.threads.find(x=>x.id===tid); if(th) await db.doc("threads/"+tid).update({replies:Math.max(0,(th.replies||1)-1)}); }); }
});
document.addEventListener("toggle",e=>{ const d=e.target; if(!(d instanceof HTMLElement)||!d.matches||!d.matches("details.yr")||S.q) return; if(!S.openYears) S.openYears=new Set(); if(d.open) S.openYears.add(d.dataset.year); else S.openYears.delete(d.dataset.year); },true);
document.addEventListener("change",e=>{ const u=e.target.closest("[data-upload]"); if(u){ const lbl=u.closest("label"); uploadPhotos(u.files,u.dataset.upload,lbl&&lbl.querySelector("span")); u.value=""; } });
document.addEventListener("focusin",e=>{ if(e.target.matches&&e.target.matches('input[type="search"],.search')){ document.body.classList.add("kb"); e.target.setAttribute("enterkeyhint","search"); } });
document.addEventListener("focusout",()=>{ setTimeout(()=>{ const a=document.activeElement; if(!(a&&a.matches&&a.matches('input[type="search"],.search'))) document.body.classList.remove("kb"); },250); });
document.addEventListener("keydown",e=>{ if(e.key==="Enter"&&e.target.matches&&e.target.matches('input[type="search"],.search')){ e.preventDefault(); e.target.blur(); } });
document.addEventListener("input",e=>{ if(e.target.hasAttribute("data-q")){ S.q=e.target.value; rerender(); } });
document.addEventListener("keydown",e=>{ if(e.key==="Escape"&&sheet&&!document.querySelector(".lb")) closeSheet(); });
$("#meBtn").addEventListener("click",()=>profileForm());
$("#aaBtn").addEventListener("click",openSize);
document.addEventListener("click",e=>{ const b=e.target.closest("[data-size]"); if(!b||!b.classList.contains("sizeopt")) return; applySize(+b.dataset.size); closeSheet(); toast("Listo, tamaño de letra cambiado."); });

/* ======================================================================
   Versión web independiente (GitHub Pages + Firebase)
   Acceso: código del club + nombre + correo → aprobación de un administrador
   ====================================================================== */
const BOOT_ADMINS = ["rene.cazenave@gmail.com","rene@blindamax.cl"];
firebase.initializeApp(window.FIREBASE_CONFIG);
const auth = firebase.auth(), fs = firebase.firestore();
fs.enablePersistence({synchronizeTabs:true}).catch(()=>{});

/* ---- fotos guardadas en la base de datos (plan gratuito de Firebase) ---- */
function reencode(b,max,q){ return new Promise((res,rej)=>{ const img=new Image(); const u=URL.createObjectURL(b);
  img.onload=()=>{ const k=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight)); const c=document.createElement("canvas"); c.width=Math.round(img.naturalWidth*k); c.height=Math.round(img.naturalHeight*k);
    c.getContext("2d").drawImage(img,0,0,c.width,c.height); URL.revokeObjectURL(u); let qq=q, d=c.toDataURL("image/jpeg",qq); while(d.length>850000&&qq>.35){ qq-=.1; d=c.toDataURL("image/jpeg",qq); } res(d); };
  img.onerror=()=>{ URL.revokeObjectURL(u); rej(new Error("img")); }; img.src=u; }); }
const storageAdapter = {
  async upload(b){ if(!/^image\//.test(b.type||"image/jpeg")) throw {code:"no_video"};
    const full=await reencode(b,1400,.72), th=await reencode(b,600,.6);
    const ref=fs.collection("media").doc(); const meta={by:S.uid,at:Date.now()};
    await Promise.all([ref.set(Object.assign({data:full},meta)), fs.doc("mediaThumb/"+ref.id).set(Object.assign({data:th},meta))]);
    return {id:"fsm:"+ref.id}; },
  async delete(id){ if(!String(id).startsWith("fsm:")) return; const k=String(id).slice(4); fs.doc("media/"+k).delete().catch(()=>{}); fs.doc("mediaThumb/"+k).delete().catch(()=>{}); }
};
const FSM=new Map();
function fsmFill(img){ const a=img.getAttribute("src")||""; const m=a.match(/#fsm-(t|f)-([A-Za-z0-9]+)$/); if(!m) return;
  const key=m[1]+m[2]; const set=d=>{ if(d&&(img.getAttribute("src")||"").endsWith(m[0])) img.setAttribute("src",d); };
  if(FSM.has(key)){ const v=FSM.get(key); if(typeof v==="string") set(v); else v.then(set).catch(()=>{}); return; }
  const p=fs.doc((m[1]==="t"?"mediaThumb/":"media/")+m[2]).get().then(d=>{ const v=d.exists?d.data().data:""; FSM.set(key,v); return v; });
  FSM.set(key,p); p.then(set).catch(()=>FSM.delete(key)); }
new MutationObserver(ms=>{ for(const m of ms){ if(m.type==="attributes"){ if(m.target.tagName==="IMG") fsmFill(m.target); continue; }
  m.addedNodes.forEach(n=>{ if(n.nodeType!==1) return; if(n.tagName==="IMG") fsmFill(n); n.querySelectorAll&&n.querySelectorAll('img[src*="#fsm-"]').forEach(fsmFill); }); } })
  .observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:["src"]});
const dlAdapter = { async save({filename,data}){ const blob=data instanceof Blob?data:new Blob([data],{type:"text/calendar"});
  const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),60000); return {status:"saved"}; } };

/* ---- pantallas de acceso ---- */
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
const standalone = window.matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;
let installEvt=null;
window.addEventListener("beforeinstallprompt",e=>{ e.preventDefault(); installEvt=e; if(S.gate) showGate(); else rerender(); });
function installHint(){
  if(standalone) return ""; try{ if(localStorage.getItem("cj-hint-off")==="1") return ""; }catch(_){}
  if(installEvt) return `<div class="note" style="display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap"><span>Instala la app en tu teléfono para abrirla con un toque.</span><button class="btn" data-act="install">Instalar app</button></div>`;
  if(isIOS) return `<div class="note"><b>Para dejarla en tu iPhone:</b> toca Compartir (cuadrado con flecha hacia arriba) y elige <b>"Agregar a inicio"</b>. <button class="link small" data-act="hint-off">Ya lo hice</button></div>`;
  return "";
}
function setChrome(on){ document.querySelector("nav.tabs").style.display=on?"":"none"; $("#meBtn").hidden=!on; }
function authErr(e){ const c=e&&e.code||""; return ({"auth/invalid-email":"El correo no es válido.","auth/invalid-credential":"Correo o contraseña incorrectos.","auth/wrong-password":"Contraseña incorrecta.","auth/user-not-found":"No hay cuenta con ese correo.","auth/email-already-in-use":"Ese correo ya tiene cuenta: usa \"Ya tengo cuenta\".","auth/weak-password":"La contraseña debe tener al menos 6 caracteres.","auth/too-many-requests":"Demasiados intentos. Espera unos minutos.","auth/network-request-failed":"Sin conexión a internet.","auth/operation-not-allowed":"Este tipo de ingreso no está activado en Firebase.","auth/unauthorized-domain":"Este sitio no está autorizado en Firebase (Authentication → Configuración → Dominios autorizados)."})[c]||"No se pudo entrar. Intenta de nuevo.";
}
const LOGO = () => `<img src="logo.webp" alt="Logo Club de Jeeperos de Chile" style="width:110px;height:110px;border-radius:50%;margin:10px auto 14px;display:block">`;
function showGate(){
  setChrome(false); closeSheet(); const v=$("#view"); const g=S.gate; const u=auth.currentUser;
  if(g==="loading"){ v.innerHTML=`<p class="muted" style="text-align:center;margin-top:40px">Cargando…</p>`; return; }
  if(g==="join"){
    v.innerHTML=`<div style="max-width:440px;margin:0 auto">${LOGO()}<h2 style="font-size:30px;text-align:center">Bienvenido</h2>
      <p class="muted" style="text-align:center;margin-top:4px">App del Club de Jeeperos de Chile. Solo para socios.</p>
      <form id="jf" autocomplete="on">
        <label class="f">Código del club<input name="code" required autocomplete="off" autocapitalize="none" spellcheck="false" style="font-size:20px;text-align:center"></label>
        <label class="f">Tu nombre y apellido<input name="name" required maxlength="80" autocomplete="name" placeholder="Ej: Juan Pérez"></label>
        <label class="f">Tu correo<input name="email" type="email" required maxlength="120" autocomplete="email" inputmode="email" placeholder="Ej: juan@gmail.com"></label>
        <p id="jerr" class="small" style="color:var(--red);min-height:1.2em;margin:0 0 10px"></p>
        <button class="btn" type="submit" style="width:100%;justify-content:center;padding:15px;font-size:18px">Enviar solicitud</button></form>
      <p class="small muted" style="text-align:center;margin-top:10px">Un administrador del club aprobará tu acceso. Se hace una sola vez.</p>
      ${installHint()}
      <p style="text-align:center;margin-top:22px"><button class="link small" data-act="go-admin">Entrar con correo y contraseña (administradores)</button></p></div>`;
    $("#jf").addEventListener("submit",async ev=>{ ev.preventDefault(); const F=ev.target; const code=F.code.value.trim().toLowerCase(), name=F.name.value.trim(), email=F.email.value.trim().toLowerCase();
      const b=F.querySelector("button"); b.disabled=true; b.textContent="Enviando…"; $("#jerr").textContent="";
      try{ if(!auth.currentUser) await auth.signInAnonymously(); const cu=auth.currentUser;
        await fs.doc("members/"+cu.uid).set({status:"pending",role:"socio",code,name,email,anon:cu.isAnonymous,at:Date.now()});
      }catch(e){ $("#jerr").textContent=e&&e.code==="permission-denied"?"El código del club no es correcto. Revísalo y vuelve a intentar.":authErr(e); b.disabled=false; b.textContent="Enviar solicitud"; } });
    return;
  }
  if(g==="pending"){
    const m=S.meDoc||{};
    v.innerHTML=`<div style="max-width:440px;margin:0 auto;text-align:center;padding-top:10px">${LOGO()}<h2 style="font-size:28px">¡Solicitud enviada!</h2>
      <p style="font-size:18px">Gracias, <b>${esc((m.name||"").split(" ")[0])}</b>. Un administrador del club te aprobará pronto.</p>
      <p class="muted">Cuando te aprueben, esta pantalla se abrirá sola. Si es urgente, avísale a la directiva por WhatsApp.</p>${installHint()}
      <button class="link small" data-act="logout-now">Salir</button></div>`; return;
  }
  if(g==="admin"){
    if(u&&!u.isAnonymous&&!u.emailVerified){
      v.innerHTML=`<div style="max-width:420px;margin:0 auto;text-align:center">${LOGO()}<h2>Confirma tu correo</h2><p>Te enviamos un correo a <b>${esc(u.email)}</b>. Abre el enlace que trae y vuelve aquí.</p>
        <button class="btn" data-act="verified" style="width:100%;justify-content:center;padding:14px">Ya lo confirmé</button>
        <p><button class="link small" data-act="resend">Reenviar correo</button> · <button class="link small" data-act="logout-now">Salir</button></p></div>`; return; }
    const up=S.adminMode==="signup";
    v.innerHTML=`<div style="max-width:420px;margin:0 auto">${LOGO()}<h2 style="text-align:center">${up?"Crear cuenta":"Entrar con correo"}</h2>
      <p class="muted small" style="text-align:center">Para administradores que quieran entrar con contraseña. Los socios entran con el código del club.</p>
      <form id="af"><label class="f">Correo<input name="email" type="email" required autocomplete="email"></label>
      <label class="f">Contraseña${up?" (mínimo 6 caracteres)":""}<input name="pass" type="password" required minlength="6" autocomplete="${up?"new-password":"current-password"}"></label>
      <p id="aerr" class="small" style="color:var(--red);min-height:1.2em;margin:0 0 8px"></p>
      <button class="btn" type="submit" style="width:100%;justify-content:center;padding:14px">${up?"Crear cuenta":"Entrar"}</button></form>
      <p style="text-align:center;margin-top:16px">${up?`<button class="link" data-act="adm-login">Ya tengo cuenta</button>`:`<button class="link" data-act="adm-signup">Crear cuenta</button> · <button class="link small" data-act="reset">Olvidé mi contraseña</button>`}</p>
      <p style="text-align:center"><button class="link small" data-act="go-join">Volver</button></p></div>`;
    $("#af").addEventListener("submit",async ev=>{ ev.preventDefault(); const d=formData(ev.target); const b=ev.target.querySelector("button"); b.disabled=true; $("#aerr").textContent="";
      try{ if(auth.currentUser&&auth.currentUser.isAnonymous) await auth.signOut();
        if(up){ const c=await auth.createUserWithEmailAndPassword(d.email,d.pass); await c.user.sendEmailVerification(); }
        else await auth.signInWithEmailAndPassword(d.email,d.pass);
      }catch(e){ $("#aerr").textContent=authErr(e); b.disabled=false; } });
  }
}
document.addEventListener("click",async e=>{
  const a=e.target.closest("[data-act]"); if(!a) return; const act=a.dataset.act;
  if(act==="go-admin"){ S.gate="admin"; S.adminMode="login"; showGate(); }
  else if(act==="go-join"){ S.gate="join"; showGate(); }
  else if(act==="adm-signup"){ S.adminMode="signup"; showGate(); }
  else if(act==="adm-login"){ S.adminMode="login"; showGate(); }
  else if(act==="reset"){ const em=($("#af [name=email]")||{}).value; if(!em){ toast("Escribe tu correo arriba y vuelve a tocar."); return; } try{ await auth.sendPasswordResetEmail(em); toast("Te enviamos un correo para cambiar la contraseña."); }catch(err){ toast(authErr(err)); } }
  else if(act==="verified"){ await auth.currentUser.reload(); await auth.currentUser.getIdToken(true); onUser(auth.currentUser); }
  else if(act==="resend"){ try{ await auth.currentUser.sendEmailVerification(); toast("Correo reenviado."); }catch(err){ toast(authErr(err)); } }
  else if(act==="logout-now"){ await auth.signOut(); location.reload(); }
  else if(act==="logout"){ if(!await ask("¿Cerrar sesión? Para volver a entrar tendrás que pedir acceso de nuevo.","Cerrar sesión")) return; await auth.signOut(); location.reload(); }
  else if(act==="install"&&installEvt){ installEvt.prompt(); installEvt=null; S.gate?showGate():rerender(); }
  else if(act==="hint-off"){ try{ localStorage.setItem("cj-hint-off","1"); }catch(_){} S.gate?showGate():rerender(); }
  else if(act==="req-ok"||act==="req-adm"){ approveReq(a.dataset.id,act==="req-adm"); }
  else if(act==="req-no"){ if(!await ask("¿Rechazar esta solicitud? La persona no podrá entrar.","Rechazar")) return; write(db=>db.doc("members/"+a.dataset.id).delete(),"Solicitud rechazada"); }
  else if(act==="accesos") openAccesos();
  else if(act==="import") openImport();
  else if(act==="set-code") setCode();
  else if(act==="mk-admin"||act==="rm-admin"){ const id=a.dataset.id; if(!await ask(act==="mk-admin"?"¿Dar permisos de administrador (crear y editar todo, aprobar socios)?":"¿Quitar permisos de administrador?",act==="mk-admin"?"Dar permisos":"Quitar")) return; write(db=>db.doc("members/"+id).update({role:act==="mk-admin"?"admin":"socio"}),"Listo"); }
  else if(act==="rm-member"){ const id=a.dataset.id; if(!await ask("¿Quitar el acceso de esta persona? Tendrá que pedir acceso de nuevo.","Quitar")) return; write(db=>db.doc("members/"+id).delete(),"Acceso quitado"); }
});

/* ---- solicitudes y accesos (administradores) ---- */
const pendingReqs = () => Object.entries(S.members).map(([id,m])=>Object.assign({id},m)).filter(m=>m.status==="pending").sort((a,b)=>(a.at||0)-(b.at||0));
function bestMatch(name){ const n=normTxt(name); if(!n) return ""; const words=n.split(/\s+/).filter(w=>w.length>2); let best="",score=0;
  S.socios.forEach(s=>{ const f=normTxt(fullName(s)); let sc=words.filter(w=>f.includes(w)).length; if(normTxt(s.apellido||"")&&n.includes(normTxt(s.apellido||"").split(" ")[0])) sc+=1; if(sc>score){ score=sc; best=s.id; } }); return score>=2?best:""; }
function reqCard(){ if(!S.canAdmin) return ""; const reqs=pendingReqs(); if(!reqs.length) return "";
  const opts=[...S.socios].sort((a,b)=>surnameKey(a).localeCompare(surnameKey(b),"es"));
  return `<div class="note" style="border-left:5px solid var(--red);margin-bottom:14px"><b style="font-size:18px">🔔 Solicitudes de acceso (${reqs.length})</b>
    ${reqs.map(r=>{ const bm=bestMatch(r.name); return `<div style="border-top:1px solid var(--line);margin-top:10px;padding-top:10px">
      <div style="font-size:17px"><b>${esc(r.name||"(sin nombre)")}</b></div><div class="small muted">${esc(r.email||"")}${r.at?" · "+ago(r.at):""}</div>
      <label class="f" style="margin:8px 0">¿Qué socio es?<select data-reqsel="${r.id}"><option value="">— Elegir de la lista de socios —</option>${opts.map(s=>`<option value="${s.id}" ${s.id===bm?"selected":""}>${esc((s.apellido||"")+", "+(s.nombre||""))}</option>`).join("")}</select></label>
      <div class="actions"><button class="btn" data-act="req-ok" data-id="${r.id}">Aprobar como socio</button><button class="btn blue" data-act="req-adm" data-id="${r.id}">Aprobar como administrador</button><button class="btn line" data-act="req-no" data-id="${r.id}">Rechazar</button></div></div>`; }).join("")}</div>`; }
function adminPendBanner(){ if(!S.canAdmin) return ""; const n=pendingReqs().length; let h="";
  if(n) h+=`<button class="aviso" data-open="tab:socios" style="--c:var(--red)"><span style="font-size:26px">🔔</span><span><b>${n} ${n===1?"persona espera":"personas esperan"} aprobación</b><br><span class="muted small">Toca para revisar las solicitudes</span></span></button>`;
  if(!S.config.codeSet) h+=`<button class="aviso" data-act="set-code" style="--c:var(--cumple)"><span style="font-size:26px">🔑</span><span><b>Falta crear el código del club</b><br><span class="muted small">Sin código, los socios no pueden pedir acceso. Toca para crearlo.</span></span></button>`;
  return h; }
async function approveReq(id,asAdmin){
  const r=S.members[id]; if(!r) return; const sel=document.querySelector(`[data-reqsel="${id}"]`); const sid=sel?sel.value:"";
  if(!sid){ toast("Primero elige en la lista qué socio es."); if(sel) sel.focus(); return; }
  const so=S.socios.find(x=>x.id===sid);
  if(!await ask("¿Aprobar a "+(r.name||"esta persona")+" como "+fullName(so)+(asAdmin?" con permisos de administrador":"")+"?",asAdmin?"Aprobar como administrador":"Aprobar")) return;
  const ok=await write(async db=>{ await db.doc("members/"+id).update({status:"approved",role:asAdmin?"admin":"socio",socioId:sid,approvedBy:S.uid,approvedAt:Date.now()});
    await db.doc("rsvp/"+id).set({socioId:sid,name:fullName(so),t:{}});
    if(r.email&&!so.email) await db.doc("socios/"+sid).update({email:r.email}); },"Aprobado: "+fullName(so));
  if(ok) rerender();
}
function openAccesos(){
  openSheet("Accesos",()=>{ const all=Object.entries(S.members).map(([id,m])=>Object.assign({id},m)).filter(m=>m.status==="approved").sort((a,b)=>(a.role==="admin"?0:1)-(b.role==="admin"?0:1)||(a.name||"").localeCompare(b.name||"","es"));
    return `<div class="note"><b>Código del club</b><br>Lo usan los socios para pedir acceso. Si se filtra, cámbialo: quienes ya entraron siguen dentro, y nadie nuevo entra sin aprobación.<div class="actions" style="margin-top:8px"><button class="btn" data-act="set-code">${S.config.codeSet?"Cambiar código":"Crear código"}</button></div></div>
    <div class="h2row"><h3>Personas con acceso (${all.length})</h3></div>
    <div class="panel" style="padding:2px 14px 8px">${all.map(m=>{ const so=S.socios.find(x=>x.id===m.socioId); return `<div class="srow" style="cursor:default;flex-wrap:wrap">${so?avatar(so):""}<div style="flex:1;min-width:150px"><div class="sn">${esc(so?fullName(so):m.name||"")}</div><div class="ss">${m.role==="admin"?'<span class="tag dir">Administrador</span>':'<span class="tag">Socio</span>'} ${esc(m.email||"")}</div></div>
      ${m.id===S.uid?'<span class="small muted">Tú</span>':`<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;margin-left:auto">${m.role==="admin"?`<button class="btn ghost" data-act="rm-admin" data-id="${m.id}">Quitar admin</button>`:`<button class="btn ghost" data-act="mk-admin" data-id="${m.id}">Hacer admin</button>`}<button class="btn line" data-act="rm-member" data-id="${m.id}">Quitar acceso</button></div>`}</div>`; }).join("")}</div>`; },{live:true});
}
async function setCode(){
  const c=prompt("Escribe el código del club (mínimo 6 letras o números, sin espacios). Compártelo solo con socios:","");
  if(c==null) return; const code=c.trim().toLowerCase();
  if(!/^[a-z0-9ñ-]{6,}$/.test(code)){ toast("El código debe tener al menos 6 letras o números, sin espacios."); return; }
  const ok=await write(async db=>{ await db.doc("config/access").set({code}); await db.doc("config/club").set(Object.assign({},S.config,{codeSet:true})); },"Listo. Código del club: "+code);
}
/* ---- perfil ---- */
function profileForm(){
  const so=meSocio(); const me=S.meDoc||{}; const u=auth.currentUser;
  openSheet("Mi perfil",()=>`<div style="display:flex;gap:14px;align-items:center">${so?avatar(so,true):""}<div><h2 style="font-size:26px">${esc(so?fullName(so):me.name||"")}</h2><div class="small muted">${S.canAdmin?'<span class="tag dir">Administrador</span>':'<span class="tag">Socio</span>'} ${esc(me.email||(u&&u.email)||"")}</div></div></div>
    <div class="actions" style="margin-top:14px">${so?`<button class="btn ghost" data-open="socio:${so.id}">Ver mi ficha</button>`:""}</div>
    ${S.canAdmin?`<div class="h2row"><h3>Administración</h3></div><div class="actions"><button class="btn" data-act="accesos">Accesos y código del club</button><button class="btn ghost" data-act="config">Configurar reuniones y ayuda</button><button class="btn ghost" data-act="import">Importar datos</button></div>`:""}
    ${helpCard()}
    <div class="actions" style="margin-top:22px"><button class="btn line" data-act="logout">Cerrar sesión</button></div>`);
}
function pickSocio(after){ if(S.canAdmin) return pickSocioOrig(after); toast("Tu nombre lo vincula un administrador al aprobarte. Si ves un error, avísale a la directiva."); }

/* ---- importar datos (una vez, al lanzar) ---- */
function openImport(){
  openSheet("Importar datos",()=>`<p class="small">Sube el archivo <b>datos-club.json</b> que te entregó Claude. Carga socios, paseos, reuniones, rutas, distancias y fotos. Se puede repetir sin duplicar.</p>
    <label class="btn" style="cursor:pointer">Elegir archivo<input type="file" accept=".json,application/json" hidden id="impf"></label><pre id="implog" class="small" style="white-space:pre-wrap;margin-top:12px"></pre>`);
  $("#impf").addEventListener("change",async e=>{ const f=e.target.files[0]; if(!f) return; const log=t=>{ $("#implog").textContent+=t+"\n"; };
    try{ const D=JSON.parse(await f.text()); const media={};
      const up=async id=>{ if(!id) return null; if(media[id]) return media[id]; const du=D.media&&D.media[id]; if(!du) return null; const b=await (await fetch(du)).blob(); const x=await storageAdapter.upload(b); media[id]=x.id; return x.id; };
      let n=0;
      for(const [id,s] of Object.entries(D.socios||{})){ const d=Object.assign({},s); if(d.foto) d.foto=await up(d.foto); if(d.fotoAuto) d.fotoAuto=await up(d.fotoAuto); await fs.doc("socios/"+id).set(d); n++; } log("Socios: "+n);
      n=0; for(const [id,ev] of Object.entries(D.events||{})){ await fs.doc("events/"+id).set(Object.assign({},ev,{by:S.uid})); n++; } log("Paseos y eventos: "+n);
      n=0; for(const [id,m] of Object.entries(D.meetings||{})){ await fs.doc("meetings/"+id).set(m); n++; } log("Reuniones editadas: "+n);
      n=0; for(const [id,r] of Object.entries(D.routes||{})){ await fs.doc("routes/"+id).set(Object.assign({},r,{by:S.uid})); n++; } log("Rutas: "+n);
      n=0; for(const [id,x] of Object.entries(D.distancias||{})){ await fs.doc("distancias/"+id).set(x); n++; } log("Distancias: "+n);
      if(D.config) { await fs.doc("config/club").set(Object.assign({},D.config,{codeSet:!!S.config.codeSet})); log("Configuración: ok"); }
      n=0; for(const [id,p] of Object.entries(D.photos||{})){ if(p.kind==="video") continue; const d=Object.assign({},p,{by:S.uid}); d.asset=await up(p.asset); if(!d.asset) continue; delete d.poster; await fs.doc("photos/"+id).set(d); n++; log("  foto "+n+" lista"); } log("Fotos: "+n+" (los videos no se traspasan en esta versión)");
      log("✓ Importación terminada."); toast("Datos importados");
    }catch(err){ log("Error: "+(err&&err.message||err)); toast("Hubo un error al importar."); } });
}

/* ---- arranque ---- */
let started=false, meUnsub=null;
function subscribeAll(){
  if(started) return; started=true;
  S.db=fs; S.assets=storageAdapter; S.dls=dlAdapter; S.ready=true;
  const sub=(path,fn)=>fs.collection(path).limit(1000).onSnapshot(fn,()=>{});
  const arr=snap=>snap.docs.map(d=>Object.assign({id:d.id},d.data()));
  sub("events",s=>{S.events=arr(s);rerender();});
  sub("photos",s=>{S.photos=arr(s);rerender();});
  sub("routes",s=>{S.routes=arr(s);rerender();});
  sub("socios",s=>{S.socios=arr(s); S.sociosLoaded=true; S.birthdays=S.socios.filter(x=>/^\d{4}-\d{2}-\d{2}$/.test(x.birth||"")).map(x=>({id:x.id,name:fullName(x),day:+x.birth.slice(8,10),month:+x.birth.slice(5,7)})); rerender(); maybeAskWho();});
  sub("rsvp",s=>{S.rsvp=arr(s); S.rsvpLoaded=true; rerender(); maybeAskWho();});
  sub("distancias",s=>{const o={}; s.docs.forEach(d=>o[d.id]=d.data()); S.dist=o; rerender();});
  sub("meetings",s=>{const o={}; s.docs.forEach(d=>o[d.id]=d.data()); S.meetings=o; rerender();});
  sub("members",s=>{const o={}; s.docs.forEach(d=>o[d.id]=d.data()); S.members=o; rerender(); if(sheet&&sheet.live) sheet.render();});
  fs.collection("live").orderBy("at","desc").limit(800).onSnapshot(s=>{S.live=arr(s);rerender();},()=>{});
  fs.doc("config/club").onSnapshot(d=>{ S.config=d.exists?d.data():{}; rerender(); },()=>{});
  refreshPending().then(flushQueue);
  window.addEventListener("online",flushQueue);
  setInterval(()=>{ if(S.pending.length) flushQueue(); },25000);
}
function enterApp(m){
  S.uid=auth.currentUser.uid; S.meDoc=m; S.canAdmin=m.role==="admin"; S.canWrite=S.canAdmin; S.canPost=true; S.isOwner=false;
  S.gate=null; setChrome(true); renderTabs(); subscribeAll(); rerender();
}
function onUser(u){
  if(meUnsub){ meUnsub(); meUnsub=null; }
  if(!u){ if(started){ location.reload(); return; } S.gate="join"; showGate(); return; }
  S.uid=u.uid;
  meUnsub=fs.doc("members/"+u.uid).onSnapshot(async d=>{
    if(d.exists){ const m=d.data(); S.meDoc=m;
      if(m.status==="approved"){ enterApp(m); return; }
      if(started){ location.reload(); return; } S.gate="pending"; showGate(); return; }
    if(started){ location.reload(); return; }
    if(!u.isAnonymous){
      if(!u.emailVerified){ S.gate="admin"; showGate(); return; }
      if(BOOT_ADMINS.includes((u.email||"").toLowerCase())){ try{ await fs.doc("members/"+u.uid).set({status:"approved",role:"admin",name:"René Cazenave",email:u.email,anon:false,at:Date.now()}); return; }catch(e){} }
    }
    if(S.gate!=="join"){ S.gate="join"; showGate(); }
  },()=>{ if(S.gate!=="join"){ S.gate="join"; showGate(); } });
}
S.gate="loading"; showGate();
auth.onAuthStateChanged(onUser);
if("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));

})();
