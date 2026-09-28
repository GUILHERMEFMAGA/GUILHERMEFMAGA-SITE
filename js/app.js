import { pages } from "./pages.js";

const CHAPTERS = [
  {id:"01", label:"Origens", title:"Cap. 1 — Origens e História", pages:["01","02","03"]},
  {id:"02", label:"Regiões", title:"Cap. 2 — Regiões Produtoras", pages:["04","05","06"]},
  {id:"03", label:"Variedades", title:"Cap. 3 — Variedades", pages:["07","08"]},
  {id:"04", label:"Cultivo", title:"Cap. 4 — O Cultivo", pages:["09","10","11"]},
  {id:"05", label:"Florada", title:"Cap. 5 — Florada e Fruto", pages:["12","13"]},
  {id:"06", label:"Colheita", title:"Cap. 6 — A Colheita", pages:["14","15"]},
  {id:"07", label:"Processamento", title:"Cap. 7 — Processamento", pages:["16","17","18"]},
  {id:"08", label:"Secagem", title:"Cap. 8 — Secagem", pages:["19","20"]},
  {id:"09", label:"Qualidade", title:"Cap. 9 — Specialty", pages:["21","22"]},
  {id:"10", label:"Torra", title:"Cap. 10 — A Torra", pages:["23","24"]},
  {id:"11", label:"Preparo", title:"Cap. 11 — Preparo", pages:["25","26"]},
  {id:"12", label:"Futuro", title:"Cap. 12 — Futuro", pages:["27","28","29","30"]},
];

const app = document.getElementById("app");
const navChapters = document.getElementById("nav-chapters");
const menuGrid = document.getElementById("menuGrid");
const menuOverlay = document.getElementById("menuOverlay");
const menuToggle = document.getElementById("menuToggle");
const footerChapters = document.getElementById("footerChapters");
const progressFill = document.querySelector(".progress-fill");
const loader = document.getElementById("loader");
const loaderProgress = document.querySelector(".loader-progress");
const loaderPercent = document.querySelector(".loader-percent");
const curtain = document.getElementById("pageCurtain");

// BUILD NAV CHIPS
function buildNav(){
  navChapters.innerHTML = CHAPTERS.map(c=>`<button class="nav-chip" data-chapter="${c.id}">${c.label}</button>`).join('');
  footerChapters.innerHTML = CHAPTERS.map(c=>`<li><a href="#/${c.pages[0]}">${c.title}</a></li>`).join('');
  // menu grid
  menuGrid.innerHTML = Object.entries(pages).map(([id,p])=>{
    const img = p.hero;
    return `<div class="menu-card" data-page="${id}">
      <div class="menu-card-thumb"><span class="menu-card-num">${id}</span><img src="${img}" alt=""></div>
      <div class="menu-card-body"><h4>${p.title}</h4><p>${p.subtitle}</p></div>
    </div>`;
  }).join('');
}
buildNav();

// MENU TOGGLE
menuToggle.addEventListener("click", ()=>{
  menuToggle.classList.toggle("open");
  menuOverlay.classList.toggle("open");
});
navChapters.addEventListener("click", e=>{
  const btn = e.target.closest(".nav-chip");
  if(!btn) return;
  const ch = CHAPTERS.find(c=>c.id===btn.dataset.chapter);
  if(ch) navigate(ch.pages[0]);
});
menuGrid.addEventListener("click", e=>{
  const card = e.target.closest(".menu-card");
  if(card) { navigate(card.dataset.page); menuToggle.classList.remove("open"); menuOverlay.classList.remove("open");}
});
document.addEventListener("click", e=>{
  if(e.target.closest("[data-nav]")){ /* handled via hash */ }
});

// CURSOR
const cursor = document.getElementById("cursor");
const trailLayer = document.getElementById("cursor-trail");
let mouseX= innerWidth/2, mouseY= innerHeight/2, cursorX=mouseX, cursorY=mouseY;
let trailDots=[];

if(window.matchMedia("(hover: hover)").matches){
  document.addEventListener("mousemove", e=>{
    mouseX=e.clientX; mouseY=e.clientY;
    // trail dot occasional
    if(Math.random()>0.6){
      const d=document.createElement("div");
      d.className="trail-dot";
      d.style.left=mouseX+"px"; d.style.top=mouseY+"px";
      trailLayer.appendChild(d);
      setTimeout(()=>d.remove(), 700);
      // animate
      d.animate([{opacity:0.55, transform:"translate(-50%,-50%) scale(1)"},{opacity:0, transform:"translate(-50%,-50%) scale(2.5)"}],{duration:700, easing:"ease-out"});
    }
  });
  // magnetic buttons
  document.addEventListener("mousemove", e=>{
    document.querySelectorAll("[data-magnetic]").forEach(btn=>{
      const r=btn.getBoundingClientRect();
      const dx=e.clientX-(r.left+r.width/2);
      const dy=e.clientY-(r.top+r.height/2);
      const dist=Math.hypot(dx,dy);
      if(dist<120){
        btn.style.transform=`translate(${dx*0.18}px, ${dy*0.22}px)`;
      } else btn.style.transform="";
    });
  });
  document.addEventListener("mouseenter", ()=> cursor.style.opacity=1);
  // hover steam
  document.addEventListener("mouseover", e=>{
    if(e.target.closest("a, button, .menu-card, .glass-card")) cursor.classList.add("steam");
    else cursor.classList.remove("steam");
  });
  document.addEventListener("mousedown", ()=> cursor.classList.add("active"));
  document.addEventListener("mouseup", ()=> cursor.classList.remove("active"));
  function loopCursor(){
    cursorX += (mouseX - cursorX)*0.18;
    cursorY += (mouseY - cursorY)*0.18;
    cursor.style.transform=`translate(${cursorX}px, ${cursorY}px) translate(-50%,-50%)`;
    requestAnimationFrame(loopCursor);
  }
  loopCursor();
  // hide native trail on leaves
  document.addEventListener("mouseleave", ()=> cursor.style.opacity=0);
}

// PARTICLE CANVAS — grains falling
const canvas = document.getElementById("particle-canvas");
const ctx = canvas.getContext("2d");
let W,H, particles=[];
function resize(){ W=canvas.width=innerWidth; H=canvas.height=innerHeight; }
resize(); addEventListener("resize", resize);
for(let i=0;i<34;i++){
  particles.push({
    x: Math.random()*W,
    y: Math.random()*H,
    r: 3+Math.random()*4,
    vx: -0.3+Math.random()*0.6,
    vy: 0.4+Math.random()*1.1,
    rot: Math.random()*Math.PI,
    vr: (-0.02+Math.random()*0.04),
    opacity: 0.12+Math.random()*0.18
  });
}
function drawParticles(){
  ctx.clearRect(0,0,W,H);
  particles.forEach(p=>{
    p.x+=p.vx; p.y+=p.vy; p.rot+=p.vr;
    if(p.y>H+20){ p.y=-20; p.x=Math.random()*W; }
    if(p.x< -20) p.x=W+20; if(p.x>W+20) p.x=-20;
    ctx.save();
    ctx.globalAlpha=p.opacity;
    ctx.translate(p.x,p.y);
    ctx.rotate(p.rot);
    // grain shape ellipses
    ctx.fillStyle="#C68642";
    ctx.beginPath();
    ctx.ellipse(0,0,p.r*1.4,p.r,0,0,Math.PI*2);
    ctx.fill();
    ctx.strokeStyle="rgba(44,26,14,0.22)";
    ctx.lineWidth=0.9;
    ctx.beginPath();
    ctx.moveTo(0,-p.r*0.9); ctx.lineTo(0,p.r*0.9);
    ctx.stroke();
    ctx.restore();
  });
  requestAnimationFrame(drawParticles);
}
drawParticles();

// LOADER
let loaderDone=false;
let progress=0;
const loaderInterval=setInterval(()=>{
  progress+= Math.random()*14+6;
  if(progress>100) progress=100;
  loaderProgress.style.width=progress+"%";
  loaderPercent.textContent=Math.round(progress)+"%";
  if(progress>=100){
    clearInterval(loaderInterval);
    setTimeout(()=>{
      loader.classList.add("hide");
      loaderDone=true;
      // trigger initial animations
      if(!location.hash) location.hash="#/01";
      else handleRoute();
    }, 450);
  }
}, 120);
// safety 3.5s
setTimeout(()=>{ if(!loaderDone){ progress=100; loaderProgress.style.width="100%"; loaderPercent.textContent="100%"; loader.classList.add("hide"); handleRoute(); } }, 3400);

// ROUTER
function getPageId(){
  const h=location.hash.replace("#/","").trim();
  if(pages[h]) return h;
  if(h==="" || h==="#") return "01";
  // support #/01 etc without slash?
  const alt=h.replace("#","").padStart(2,"0");
  if(pages[alt]) return alt;
  return "01";
}
function navigate(id){
  if(location.hash===`#/${id}`) handleRoute();
  else location.hash=`#/${id}`;
}
window.addEventListener("hashchange", handleRoute);

function handleRoute(){
  const id=getPageId();
  renderPage(id);
  // close menu
  menuToggle.classList.remove("open");
  menuOverlay.classList.remove("open");
}

function renderPage(id){
  const page = pages[id];
  if(!page) return;
  // curtain transition
  curtain.classList.add("active");
  setTimeout(()=>{
    const prevId = app.dataset.page;
    app.dataset.page=id;
    // build page html with nav between
    const idx = Object.keys(pages).indexOf(id);
    const ids = Object.keys(pages);
    const prev = idx>0 ? ids[idx-1] : null;
    const next = idx < ids.length-1 ? ids[idx+1] : null;
    app.innerHTML = `
      <article class="page" data-page="${id}">
        ${page.content}
        <nav class="page-nav">
          ${prev ? `<a href="#/${prev}" class="prev"><span>←</span><div><small>${pages[prev].chapter}</small><strong>${pages[prev].title}</strong></div></a>` : `<span></span>`}
          ${next ? `<a href="#/${next}" class="next"><div><small>${pages[next].chapter}</small><strong>${pages[next].title}</strong></div><span>→</span></a>` : `<span></span>`}
        </nav>
      </article>
    `;
    // update nav active
    document.querySelectorAll(".nav-chip").forEach(ch=>{
      const chapter = CHAPTERS.find(c=>c.pages.includes(id));
      ch.classList.toggle("active", chapter && ch.dataset.chapter===chapter.id);
    });
    // scroll top
    window.scrollTo({top:0, behavior:"auto"});
    // re-init page interactions
    initPage(id);
    // reveal animations
    requestAnimationFrame(()=> {
      initReveals();
      initGSAP(id);
    });
    // progress
    updateProgress();
    setTimeout(()=> curtain.classList.remove("active"), 260);
  }, 420);
}

// GSAP ANIMATIONS
gsap.registerPlugin(ScrollTrigger);
function initGSAP(id){
  // kill previous triggers
  ScrollTrigger.getAll().forEach(t=>t.kill());
  // parallax hero
  const heroImg = document.querySelector(".hero-bg img");
  if(heroImg){
    gsap.to(heroImg, {yPercent: 12, ease:"none", scrollTrigger:{trigger:".hero", start:"top top", end:"bottom top", scrub:0.6}});
  }
  // reveal stagger
  gsap.utils.toArray(".reveal").forEach(el=>{
    gsap.fromTo(el, {y:18, opacity:0}, {y:0, opacity:1, duration:0.7, ease:"power2.out", scrollTrigger:{trigger:el, start:"top 88%", once:true}});
  });
  // tilt 3D on mousemove for glass cards
  document.querySelectorAll(".glass-card").forEach(card=>{
    card.addEventListener("mousemove", e=>{
      const r=card.getBoundingClientRect();
      const x=(e.clientX - r.left)/r.width -0.5;
      const y=(e.clientY - r.top)/r.height -0.5;
      card.style.transform=`perspective(900px) rotateX(${ -y*6}deg) rotateY(${x*8}deg) translateY(-2px)`;
    });
    card.addEventListener("mouseleave", ()=> card.style.transform="");
  });
  // letter reveal for page headers
  const h2=document.querySelector(".page-header h2");
  if(h2 && !h2.dataset.split){
    h2.dataset.split="1";
    const text=h2.innerHTML;
    // simple fade words
    gsap.fromTo(h2, {opacity:0, y:16}, {opacity:1, y:0, duration:0.7, ease:"power2.out"});
  }
  // timeline draw
  const tlLine=document.querySelector(".timeline::before");
  // counter animation
  document.querySelectorAll("[data-count]").forEach(el=>{
    const target=parseInt(el.dataset.count,10);
    const obj={v:0};
    gsap.to(obj, {v:target, duration:1.6, ease:"power2.out", onUpdate:()=>{
      if(target>1000) el.textContent=Math.round(obj.v).toLocaleString("pt-BR");
      else el.textContent=Math.round(obj.v);
    }, scrollTrigger:{trigger:el, start:"top 92%", once:true}});
  });
  // roast slider init for page 24
  const roastRange=document.getElementById("roastRange");
  if(roastRange){
    roastRange.addEventListener("input", updateRoast);
    updateRoast();
  }
  // globe canvas for page 03
  const globe=document.getElementById("globeCanvas");
  if(globe) drawGlobe(globe);
  // map interactivity page 04
  const map=document.getElementById("brazilMap");
  if(map) initMap();
  // typewriter page 01
  const tw=document.getElementById("typewriter");
  if(tw) typewriter(tw, "Do cerrado à xícara. Uma história de paixão, ciência e terroir — contada em 30 capítulos imersivos.");
  // footer clock will run globally
  ScrollTrigger.refresh();
}

function typewriter(el, text){
  el.textContent="";
  let i=0;
  const iv=setInterval(()=>{
    el.textContent=text.slice(0,i++);
    if(i>text.length) clearInterval(iv);
  }, 18);
}

function updateRoast(){
  const r=document.getElementById("roastRange");
  const label=document.getElementById("roastLabel");
  const badge=document.getElementById("roastBadge");
  const text=document.getElementById("roastText");
  const beans=document.querySelectorAll("#beanDemo .bean");
  if(!r) return;
  const v=parseInt(r.value,10);
  let bg, t, b, d;
  if(v<33){ bg="#e8d84a"; t="Torra Clara • 198°C"; b="Floral"; d="Ácida, floral, frutada, terrosa. Preserva a origem. Ideal para pour over e Aeropress."; }
  else if(v<66){ bg="#8b3a1a"; t="Torra Média • 215°C"; b="Equilibrada"; d="Equilibrada: caramelo, nozes, chocolate. Ideal para espresso e coado. Acidez moderada, corpo aveludado."; }
  else { bg="#0D0A08"; t="Torra Escura • 228°C"; b="Intensa"; d="Intensa, amarga, defumada, corpo pleno. Notas de chocolate amargo. Ideal para moka e espresso intenso."; }
  label.textContent=t; badge.textContent=b; text.textContent=d;
  beans.forEach(bn=> bn.style.background=bg);
}

function drawGlobe(canvas){
  const dpr= Math.min(2, devicePixelRatio||1);
  const rect=canvas.getBoundingClientRect();
  canvas.width=rect.width*dpr; canvas.height=rect.width*dpr;
  const c=canvas.getContext("2d");
  const W=canvas.width, H=canvas.height, R=W*0.38;
  let rot=0;
  function frame(){
    c.clearRect(0,0,W,H);
    c.save();
    c.translate(W/2,H/2);
    // shadow
    c.fillStyle="#0D0A08";
    c.beginPath(); c.arc(6*dpr,8*dpr,R,0,Math.PI*2); c.fill();
    // base
    const grad=c.createRadialGradient(-R*0.3,-R*0.3,R*0.2,0,0,R);
    grad.addColorStop(0,"#2D5A27"); grad.addColorStop(0.55,"#1a3a18"); grad.addColorStop(1,"#0e1a0e");
    c.fillStyle=grad;
    c.beginPath(); c.arc(0,0,R,0,Math.PI*2); c.fill();
    // Brazil highlight - approximate lat/lon projection
    c.fillStyle="#C68642";
    c.globalAlpha=0.96;
    // simple brazil shape animated
    c.beginPath();
    const brLat=-14, brLon=-52;
    // project sphere
    for(let k=0;k<80;k++){
      const lat = -34 + k*0.6;
      const lon = -60 + Math.sin(k*0.12)*8;
      const phi=(lon+rot)*Math.PI/180, lambda=lat*Math.PI/180;
      const x=R*Math.cos(lambda)*Math.sin(phi);
      const y=-R*Math.sin(lambda);
      const z=R*Math.cos(lambda)*Math.cos(phi);
      if(z>0){
        if(k===0) c.moveTo(x,y);
        else c.lineTo(x,y);
      }
    }
    // simpler: draw blob for Brazil
    c.globalAlpha=1;
    c.fillStyle="#D4AF37";
    // draw brazil blob at correct position splat
    const bx = R* Math.cos((-14)*Math.PI/180)*Math.sin((-52+rot)*Math.PI/180);
    const by = -R*Math.sin((-14)*Math.PI/180);
    c.beginPath();
    c.ellipse(bx, by, R*0.18, R*0.26, 0.18, 0, Math.PI*2);
    c.fill();
    c.fillStyle="rgba(255,255,255,0.16)";
    c.beginPath(); c.arc(bx-8, by-14, 6*dpr,0,Math.PI*2); c.fill();
    // grid
    c.strokeStyle="rgba(255,255,255,0.08)"; c.lineWidth=1;
    for(let lon=-180; lon<180; lon+=30){
      c.beginPath();
      for(let lat=-80; lat<=80; lat+=4){
        const phi=(lon+rot)*Math.PI/180, la=lat*Math.PI/180;
        const x=R*Math.cos(la)*Math.sin(phi), y=-R*Math.sin(la), z=R*Math.cos(la)*Math.cos(phi);
        if(z> -R*0.1){
          if(lat==-80) c.moveTo(x,y); else c.lineTo(x,y);
        }
      }
      c.stroke();
    }
    c.restore();
    rot+=0.22;
    requestAnimationFrame(frame);
  }
  frame();
}

// MAP 04
function initMap(){
  const panel=document.getElementById("regionPanel");
  if(!panel) return;
  const data={
    mg:{title:"Minas Gerais", alt:"900-1.400m", temp:"19°C", solo:"Latossolo vermelho", nota:"Doce, caramelo, nozes, chocolate", img:"https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80&auto=format&fit=crop"},
    sp:{title:"Mogiana Paulista", alt:"700-1.000m", temp:"21°C", solo:"Terra roxa", nota:"Encorpado, adocicado, baixa acidez", img:"https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=600&q=80&auto=format&fit=crop"},
    es:{title:"Espírito Santo — Conilon", alt:"0-600m", temp:"24°C", solo:"Argiloso", nota:"Intenso, amendoado, crema espessa", img:"https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb?w=600&q=80&auto=format&fit=crop"},
    ba:{title:"Chapada Diamantina", alt:"1.100-1.400m", temp:"18°C", solo:"Arenoso + orgânico", nota:"Floral, frutado, acidez brilhante", img:"https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&q=80&auto=format&fit=crop"},
    pr:{title:"Paraná — Norte Pioneiro", alt:"600-800m", temp:"20°C", solo:"Terra roxa", nota:"Suave, doce, corpo médio", img:"https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&q=80&auto=format&fit=crop"},
    cerrado:{title:"Cerrado Mineiro", alt:"800-1.100m", temp:"22°C", solo:"Latossolo", nota:"Chocolate, aveludado, mecanizado", img:"https://images.unsplash.com/photo-1511920170033-f8396924c348?w=600&q=80&auto=format&fit=crop"},
  };
  document.querySelectorAll(".region").forEach(el=>{
    el.addEventListener("click", ()=>{
      const id=el.dataset.region;
      const d=data[id];
      if(!d) return;
      panel.innerHTML=`
        <div class="badge">${d.alt} • ${d.temp}</div>
        <h3 style="font-family:var(--font-display);margin:10px 0 6px">${d.title}</h3>
        <p style="opacity:0.68;line-height:1.6;font-size:13px">Solo: <strong>${d.solo}</strong><br>Perfil: ${d.nota}</p>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"><span class="pill">Denominação de Origem</span><span class="pill">Specialty</span></div>
        <img src="${d.img}" style="width:100%;height:140px;object-fit:cover;border-radius:12px;margin-top:12px">
      `;
      document.querySelectorAll(".region").forEach(r=>r.style.opacity=0.55);
      el.style.opacity=1;
    });
  });
}

// REVEALS via observer fallback
function initReveals(){
  const obs=new IntersectionObserver(ents=>{
    ents.forEach(e=>{ if(e.isIntersecting) e.target.classList.add("in"); });
  },{threshold:0.14});
  document.querySelectorAll(".reveal").forEach(el=>obs.observe(el));
}
function initPage(id){
  // typewriter handled in gsap
}

// PROGRESS BAR
function updateProgress(){
  // will update on scroll
}
addEventListener("scroll", ()=>{
  const h=document.documentElement;
  const max=h.scrollHeight - innerHeight;
  const p=max>0 ? (scrollY / max)*100 : 0;
  progressFill.style.height=p+"%";
}, {passive:true});

// SOUND
const audio=document.getElementById("ambientAudio");
const soundBtn=document.getElementById("soundToggle");
let soundOn=false;
soundBtn.addEventListener("click", async ()=>{
  try{
    if(!soundOn){ await audio.play(); soundOn=true; soundBtn.style.background="var(--brown-deep)"; soundBtn.style.color="white"; }
    else { audio.pause(); soundOn=false; soundBtn.style.background=""; soundBtn.style.color=""; }
  }catch(e){ /* autoplay blocked */ }
});

// CLOCK
function tickClock(){
  const now=new Date();
  const h=now.getHours()%12, m=now.getMinutes(), s=now.getSeconds();
  const hourEl=document.getElementById("hourHand"), minuteEl=document.getElementById("minuteHand"), secondEl=document.getElementById("secondHand"), clockTime=document.getElementById("clockTime");
  if(hourEl) hourEl.style.transform=`translateX(-50%) rotate(${h*30 + m*0.5}deg)`;
  if(minuteEl) minuteEl.style.transform=`translateX(-50%) rotate(${m*6}deg)`;
  if(secondEl) secondEl.style.transform=`translateX(-50%) rotate(${s*6}deg)`;
  if(clockTime) clockTime.textContent=now.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
}
setInterval(tickClock,1000); tickClock();

// INITIAL ROUTE (if loader already hidden)
if(loader.classList.contains("hide")) handleRoute();
// keyboard nav
addEventListener("keydown", e=>{
  if(e.key==="ArrowRight"){ const ids=Object.keys(pages); const cur=getPageId(); const i=ids.indexOf(cur); if(i<ids.length-1) navigate(ids[i+1]); }
  if(e.key==="ArrowLeft"){ const ids=Object.keys(pages); const cur=getPageId(); const i=ids.indexOf(cur); if(i>0) navigate(ids[i-1]); }
});

// Preload hero images slightly
Object.values(pages).slice(0,3).forEach(p=>{ const img=new Image(); img.src=p.hero; });
