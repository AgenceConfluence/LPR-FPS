
// ============================================================
//  JEU 1v1 — blasters en mousse
// ============================================================
const STEP=0.45, HEIGHT=1.72, RAD=0.3, EYE=1.62;
const ROUND_TIME=105, FREEZE=12, END_TIME=4, WIN=5, BUY_LIVE=20;
const SPAWN={ A:{x:118*S,z:27*S,yaw:Math.PI/2,name:'Parvis'}, B:{x:38*S,z:31*S,yaw:-Math.PI/2,name:'Devant le self'} };
const COL={A:'#e8742c',B:'#2a7fd4'};
const WEAPONS={
  pistol:{name:'Piston',cs:'USP-S',price:0,slot:2,mag:12,res:36,auto:false,rate:0.17,reload:2.1,dmg:{head:100,body:34,leg:26},spread:0.003,move:0.02,air:0.06,kick:0.014,pellets:1,reward:300,speed:32,snd:'pistol',fall:[40,120,0.75]},
  mp5:{name:'Vortex',cs:'MP5-SD',price:1500,slot:1,mag:30,res:120,auto:true,rate:0.08,reload:2.6,dmg:{head:72,body:25,leg:19},spread:0.005,move:0.012,air:0.06,kick:0.006,pellets:1,reward:600,speed:35,snd:'mp5',fall:[25,70,0.7]},
  spas:{name:'Tempête',cs:'SPAS-12',price:1800,slot:1,mag:7,res:28,auto:false,rate:0.9,reload:3.2,dmg:{head:40,body:22,leg:16},spread:0.0,pelletSpread:0.045,move:0.0,air:0.03,kick:0.05,pellets:8,reward:900,speed:28,snd:'spas',fall:[8,24,0.15]},
  m4:{name:'Rafale',cs:'M4A1-S',price:2900,slot:1,mag:25,res:75,auto:true,rate:0.1,reload:3.0,dmg:{head:92,body:31,leg:24},spread:0.0025,move:0.05,air:0.1,kick:0.009,spray:true,pellets:1,reward:300,speed:42,snd:'m4',fall:[50,150,0.8]},
  awp:{name:'Longue-Vue',cs:'AWP',price:4750,slot:1,mag:5,res:30,auto:false,rate:1.45,reload:3.6,dmg:{head:200,body:115,leg:85},spread:0.09,scoped:0.0006,move:0.12,air:0.2,kick:0.06,pellets:1,reward:100,speed:60,snd:'awp',zoom:[40,15],fall:[200,300,1]},
};
const SHOP=['pistol','mp5','spas','m4','awp'];

scene.add(camera);
const P={x:0,z:0,feet:0,vy:0,yaw:0,pitch:0,grounded:true,hp:100,alive:true,side:'A',money:800,streak:0,
  inv:{1:null,2:{w:'pistol',ammo:12,res:36}},cur:2,reloadT:0,cool:0,deployT:0,spray:0,zoom:0,lastHitW:'pistol'};
let mode='lobby';
let G={phase:'wait',n:0,sA:0,sB:0,deadline:0,win:''};
let isHost=false, liveStart=0;
const W=()=>WEAPONS[P.inv[P.cur].w], SLOT=()=>P.inv[P.cur];

const params0=new URLSearchParams(location.search);
// ---------- environnement HDRI (CC0, Poly Haven via @pmndrs/assets) ----------
if(!params0.has('noenv')) import('three/addons/loaders/EXRLoader.js').then(({EXRLoader})=>{
  new EXRLoader().load('assets/park.exr',tex=>{ tex.mapping=THREE.EquirectangularReflectionMapping; const pm=new THREE.PMREMGenerator(renderer);
    const env=pm.fromEquirectangular(tex).texture; tex.dispose(); pm.dispose();
    for(const k of ['glass','steel','kitchen']){ MAT[k].envMap=env; MAT[k].envMapIntensity=k==='glass'?1.0:0.6; MAT[k].needsUpdate=true; } });
}).catch(()=>{});

// ---------- collisions ----------
function near(x,z,r){ const out=new Set(); for(let cx=Math.floor((x-r)/CELL);cx<=Math.floor((x+r)/CELL);cx++) for(let cz=Math.floor((z-r)/CELL);cz<=Math.floor((z+r)/CELL);cz++){ const a=grid.get(cx*100003+cz); if(a) for(const b of a) out.add(b);} return out; }
function floorAt(x,z,feet){ let h=0; for(const b of near(x,z,0)) if(x>=b.x0&&x<=b.x1&&z>=b.z0&&z<=b.z1&&b.y1<=feet+STEP&&b.y1>h) h=b.y1; return h; }
function ceilAt(x,z,feet){ let h=1e9; for(const b of near(x,z,RAD)) if(x>=b.x0-RAD&&x<=b.x1+RAD&&z>=b.z0-RAD&&z<=b.z1+RAD&&b.y0>=feet+HEIGHT-0.05&&b.y0<h) h=b.y0; return h; }
function collide(){
  for(let it=0;it<3;it++) for(const b of near(P.x,P.z,RAD+0.1)){
    if(b.y1<=P.feet+STEP||b.y0>=P.feet+HEIGHT) continue;
    const cx=Math.max(b.x0,Math.min(P.x,b.x1)), cz=Math.max(b.z0,Math.min(P.z,b.z1));
    const dx=P.x-cx, dz=P.z-cz, d=Math.hypot(dx,dz);
    if(d<RAD){ if(d<1e-6){ const pen=[P.x-b.x0,b.x1-P.x,P.z-b.z0,b.z1-P.z]; const i=pen.indexOf(Math.min(...pen));
        if(i===0)P.x=b.x0-RAD; else if(i===1)P.x=b.x1+RAD; else if(i===2)P.z=b.z0-RAD; else P.z=b.z1+RAD; }
      else { P.x=cx+dx/d*RAD; P.z=cz+dz/d*RAD; } }
  }
}
function rayWorld(o,d,maxT){
  let best=maxT, nrm=null; const seen=new Set(), cells=new Set();
  for(let t=0;t<=maxT&&t<best+CELL;t+=0.5){
    const x=o.x+d.x*t, z=o.z+d.z*t; const k=Math.floor(x/CELL)*100003+Math.floor(z/CELL); if(cells.has(k)) continue; cells.add(k);
    const a=grid.get(k); if(!a) continue;
    for(const b of a){ if(seen.has(b)) continue; seen.add(b);
      let t0=0,t1=best,ax=-1;
      const A=[[o.x,d.x,b.x0,b.x1],[o.y,d.y,b.y0,b.y1],[o.z,d.z,b.z0,b.z1]];
      for(let i=0;i<3;i++){ const [oo,dd,lo,hi]=A[i];
        if(Math.abs(dd)<1e-9){ if(oo<lo||oo>hi){t0=1e9;break;} continue; }
        let ta=(lo-oo)/dd, tb=(hi-oo)/dd; if(ta>tb)[ta,tb]=[tb,ta]; if(ta>t0){t0=ta;ax=i;} t1=Math.min(t1,tb); if(t0>t1) break; }
      if(t0<=t1&&t0<best&&t0>0.02){ best=t0; nrm=ax; } }
  }
  return best;
}
function rayPlayer(o,d,E){
  let res=null;
  const hc={x:E.x,y:E.feet+1.56,z:E.z}, r=0.19;
  const ox=o.x-hc.x, oy=o.y-hc.y, oz=o.z-hc.z, bq=ox*d.x+oy*d.y+oz*d.z, c=ox*ox+oy*oy+oz*oz-r*r, disc=bq*bq-c;
  if(disc>=0){ const t=-bq-Math.sqrt(disc); if(t>0) res={t,zone:'head'}; }
  const R2=0.3, a=d.x*d.x+d.z*d.z;
  if(a>1e-9){ const px=o.x-E.x, pz=o.z-E.z, b2=px*d.x+pz*d.z, c2=px*px+pz*pz-R2*R2, ds=b2*b2-a*c2;
    if(ds>=0){ const t=(-b2-Math.sqrt(ds))/a; if(t>0){ const y=o.y+d.y*t-E.feet; if(y>=0&&y<=1.38&&(!res||t<res.t)) res={t,zone:y<0.8?'leg':'body'}; } } }
  return res;
}

// ---------- modèles d'armes ----------
const GM={o:new THREE.MeshStandardMaterial({color:'#f28c28',roughness:.45}),y:new THREE.MeshStandardMaterial({color:'#ffd23f',roughness:.4}),g:new THREE.MeshStandardMaterial({color:'#3a3f44',roughness:.6}),
  b:new THREE.MeshStandardMaterial({color:'#2a7fd4',roughness:.5}),t:new THREE.MeshStandardMaterial({color:'#2fb39a',roughness:.5}),k:new THREE.MeshStandardMaterial({color:'#15181a',roughness:.4}),
  v:new THREE.MeshStandardMaterial({color:'#6b8f3a',roughness:.55}),w:new THREE.MeshStandardMaterial({color:'#eceae4',roughness:.5}),lens:new THREE.MeshStandardMaterial({color:'#7fd3ff',roughness:.05,metalness:.6})};
function gunModel(id){
  const g=new THREE.Group();
  const bx=(w,h,d,m,x,y,z,rx=0)=>{ const me=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),GM[m]); me.position.set(x,y,z); me.rotation.x=rx; g.add(me); return me; };
  const cy=(r,l,m,x,y,z)=>{ const me=new THREE.Mesh(new THREE.CylinderGeometry(r,r,l,14),GM[m]); me.rotation.x=Math.PI/2; me.position.set(x,y,z); g.add(me); return me; };
  if(id==='pistol'){ bx(.075,.1,.34,'o',0,0,0); bx(.06,.06,.14,'y',0,.01,-.22); cy(.018,.02,'g',0,.01,-.3); bx(.06,.15,.08,'g',0,-.11,.09,-.25); bx(.08,.03,.2,'b',0,.065,-.02); bx(.02,.05,.06,'g',0,-.07,-.02); }
  if(id==='mp5'){ bx(.07,.11,.36,'w',0,0,0); cy(.04,.26,'g',0,.01,-.3); bx(.05,.2,.07,'o',0,-.15,-.06,0.25); bx(.055,.13,.07,'g',0,-.11,.12,-.2); bx(.02,.02,.2,'g',.03,.0,.27); bx(.02,.02,.2,'g',-.03,.0,.27); bx(.07,.06,.03,'g',0,0,.37); bx(.07,.04,.08,'t',0,.075,-.02); }
  if(id==='m4'){ bx(.08,.12,.48,'b',0,0,0); cy(.028,.34,'g',0,.01,-.4); bx(.065,.1,.24,'o',0,-.01,.34); bx(.05,.19,.09,'y',0,-.15,-.07,0.2); bx(.055,.13,.07,'g',0,-.11,.13,-.2); bx(.03,.05,.16,'g',0,.09,-.02); bx(.07,.07,.18,'g',0,-.06,-.22); }
  if(id==='spas'){ bx(.08,.11,.38,'t',0,0,0); cy(.026,.5,'g',0,.025,-.38); cy(.022,.42,'g',0,-.035,-.34); const pump=bx(.085,.075,.18,'o',0,-.035,-.36); pump.name='pump'; bx(.06,.1,.26,'g',0,-.02,.3); bx(.055,.13,.07,'g',0,-.11,.11,-.2); }
  if(id==='awp'){ bx(.075,.11,.62,'v',0,0,0); cy(.022,.62,'g',0,.02,-.6); cy(.034,.32,'k',0,.11,-.03); cy(.036,.02,'lens',0,.11,-.2); bx(.07,.13,.3,'v',0,-.02,.42); bx(.055,.14,.07,'g',0,-.12,.12,-.2); bx(.05,.09,.06,'y',0,-.1,-.08); const bolt=new THREE.Mesh(new THREE.SphereGeometry(.02,8,6),GM.y); bolt.position.set(.07,.03,.1); g.add(bolt); }
  g.userData.len={pistol:.32,mp5:.43,spas:.63,m4:.57,awp:.91}[id];
  return g;
}
const vm=new THREE.Group(); camera.add(vm);
const vmModels={}; for(const id of SHOP){ const m=gunModel(id); m.visible=false; m.traverse(o=>{ if(o.isMesh){ o.renderOrder=10; } }); vm.add(m); vmModels[id]=m; }
const VMPOS={pistol:[.17,-.17,-.36,.6],mp5:[.19,-.19,-.33,.52],spas:[.2,-.2,-.31,.5],m4:[.2,-.2,-.31,.5],awp:[.2,-.21,-.28,.46]};
const flash=new THREE.PointLight('#fff1cc',0,4); camera.add(flash);
function showVM(){ for(const id in vmModels) vmModels[id].visible=(id===SLOT().w); const p=VMPOS[SLOT().w]; vm.scale.setScalar(p[3]); flash.position.set(p[0],p[1]+0.03,p[2]-0.4); }
function muzzleWorld(){ const id=SLOT().w; return vmModels[id].localToWorld(new THREE.Vector3(0,0.01,-vmModels[id].userData.len)); }

// ---------- avatars ----------
function makeAvatar(col){
  const g=new THREE.Group();
  const cm=new THREE.MeshStandardMaterial({color:col,roughness:.6}), dark=new THREE.MeshStandardMaterial({color:'#2b2f33',roughness:.7}), skin=new THREE.MeshStandardMaterial({color:'#e0b48f',roughness:.8}), jean=new THREE.MeshStandardMaterial({color:'#3d5a80',roughness:.8});
  const add=(geo,m,x,y,z)=>{ const me=new THREE.Mesh(geo,m); me.position.set(x,y,z); me.castShadow=true; g.add(me); return me; };
  add(new THREE.CapsuleGeometry(0.25,0.5,4,10),cm,0,1.1,0);
  add(new THREE.BoxGeometry(0.42,0.1,0.3),dark,0,0.86,0);
  const legL=add(new THREE.BoxGeometry(0.18,0.8,0.2),jean,-0.11,0.4,0), legR=add(new THREE.BoxGeometry(0.18,0.8,0.2),jean,0.11,0.4,0);
  add(new THREE.BoxGeometry(0.2,0.08,0.28),dark,-0.11,0.04,-0.03); add(new THREE.BoxGeometry(0.2,0.08,0.28),dark,0.11,0.04,-0.03);
  add(new THREE.SphereGeometry(0.17,14,10),skin,0,1.56,0);
  add(new THREE.BoxGeometry(0.3,0.09,0.07),new THREE.MeshStandardMaterial({color:'#ffd23f',roughness:.2,metalness:.3}),0,1.6,-0.15);
  add(new THREE.SphereGeometry(0.18,14,8,0,Math.PI*2,0,Math.PI/2),cm,0,1.6,0);
  add(new THREE.BoxGeometry(0.3,0.36,0.14),dark,0,1.15,0.24);
  const armR=add(new THREE.BoxGeometry(0.1,0.1,0.42),cm,0.2,1.28,-0.15), armL=add(new THREE.BoxGeometry(0.1,0.1,0.42),cm,-0.12,1.26,-0.22);
  const gunHolder=new THREE.Group(); gunHolder.position.set(0.12,1.3,-0.35); g.add(gunHolder);
  g.userData={gunHolder,legL,legR,cur:''}; return g;
}
const enemy={mesh:null,buf:[],E:{x:0,feet:-100,z:0,yaw:0,pitch:0,alive:false,w:'pistol'},side:'B',stepT:0,lastPos:null};

// ---------- fléchettes ----------
const dartGeo=new THREE.CylinderGeometry(0.016,0.016,0.085,8); dartGeo.rotateX(Math.PI/2); dartGeo.translate(0,0,0.02);
const tipGeo=new THREE.CylinderGeometry(0.024,0.016,0.022,10); tipGeo.rotateX(Math.PI/2); tipGeo.translate(0,0,-0.033);
const trailGeo=new THREE.CylinderGeometry(0.007,0.0,1,6,1,true); trailGeo.rotateX(Math.PI/2); trailGeo.translate(0,0,0.5);
const dartMat={A:new THREE.MeshStandardMaterial({color:'#ff8a1f',roughness:.7}),B:new THREE.MeshStandardMaterial({color:'#3ba0ff',roughness:.7})};
const tipMat=new THREE.MeshStandardMaterial({color:'#e4572e',roughness:.35});
const trailMat={A:new THREE.MeshBasicMaterial({color:'#ffd9b0',transparent:true,opacity:.6,depthWrite:false}),B:new THREE.MeshBasicMaterial({color:'#cfe6ff',transparent:true,opacity:.6,depthWrite:false})};
const puffMat=new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.35,depthWrite:false});
const puffGeo=new THREE.SphereGeometry(0.05,8,6);
const flying=[], stuck=[], puffs=[], falling=[];
function makeDart(side){ const g=new THREE.Group(); g.add(new THREE.Mesh(dartGeo,dartMat[side])); g.add(new THREE.Mesh(tipGeo,tipMat)); g.scale.setScalar(2.1); return g; }
function spawnDart(o,e,side,speed,hitPlayer){
  const m=makeDart(side); m.position.copy(o); m.lookAt(e); m.rotateY(Math.PI); scene.add(m);
  const tr=new THREE.Mesh(trailGeo,trailMat[side]); tr.scale.set(1,1,0.01); m.add(tr);
  const dir=e.clone().sub(o); const len=dir.length(); dir.normalize();
  flying.push({m,tr,o:o.clone(),e:e.clone(),dir,t:0,len,speed,hitPlayer,side});
}
function spawnPuff(p){ const m=new THREE.Mesh(puffGeo,puffMat.clone()); m.position.copy(p); scene.add(m); puffs.push({m,t:0}); }
function updDarts(dt){
  for(let i=flying.length-1;i>=0;i--){ const f=flying[i]; f.t+=dt*f.speed; const k=Math.min(1,f.t/f.len); f.m.position.lerpVectors(f.o,f.e,k);
    f.tr.scale.z=Math.min(2.4,f.t)/2.1;
    if(k>=1){ flying.splice(i,1); f.m.remove(f.tr);
      if(f.hitPlayer){ sfxAt('thwap',f.e); const v=f.dir.clone().multiplyScalar(-2.5); v.y=2; falling.push({m:f.m,v,spin:new THREE.Vector3(Math.random()*12,Math.random()*12,0)}); }
      else { f.m.position.copy(f.e).addScaledVector(f.dir,0.03); f.m.userData.wob={t:0,base:f.m.quaternion.clone()}; stuck.push(f.m); sfxAt('plop',f.e); if(stuck.length>160) scene.remove(stuck.shift()); } } }
  for(const m of stuck){ const w=m.userData.wob; if(w&&w.t<0.45){ w.t+=dt; const a=Math.sin(w.t*45)*0.12*Math.exp(-w.t*9); m.quaternion.copy(w.base); m.rotateX(a); } }
  for(let i=falling.length-1;i>=0;i--){ const f=falling[i]; f.v.y-=9.8*dt; f.m.position.addScaledVector(f.v,dt); f.m.rotation.x+=f.spin.x*dt; f.m.rotation.y+=f.spin.y*dt;
    const fl=floorAt(f.m.position.x,f.m.position.z,f.m.position.y); if(f.m.position.y<=fl+0.03){ f.m.position.y=fl+0.03; f.m.rotation.x=Math.PI/2; falling.splice(i,1); stuck.push(f.m); } }
  for(let i=puffs.length-1;i>=0;i--){ const p=puffs[i]; p.t+=dt; p.m.scale.setScalar(1+p.t*14); p.m.material.opacity=0.35*(1-p.t/0.25); if(p.t>0.25){ scene.remove(p.m); puffs.splice(i,1); } }
}
function clearDarts(){ for(const m of stuck) scene.remove(m); stuck.length=0; for(const f of flying) scene.remove(f.m); flying.length=0; falling.length=0; }

// ---------- audio : air comprimé, ventouses, pas ----------
let AC=null, NB=null;
function audio(){ if(!AC){ try{ AC=new (window.AudioContext||window.webkitAudioContext)(); NB=AC.createBuffer(1,AC.sampleRate,AC.sampleRate); const d=NB.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1; }catch(_){} } if(AC&&AC.state==='suspended') AC.resume(); }
function out(vol,pan){ const g=AC.createGain(); g.gain.value=vol; if(AC.createStereoPanner){ const p=AC.createStereoPanner(); p.pan.value=pan||0; g.connect(p); p.connect(AC.destination); } else g.connect(AC.destination); return g; }
function noise(dst,t,dur,type,f,q,a,peak){ const s=AC.createBufferSource(); s.buffer=NB; const fl=AC.createBiquadFilter(); fl.type=type; fl.frequency.value=f; fl.Q.value=q; const g=AC.createGain();
  g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(peak,t+a); g.gain.exponentialRampToValueAtTime(0.0001,t+dur); s.connect(fl); fl.connect(g); g.connect(dst); s.start(t,Math.random()*0.5); s.stop(t+dur+0.02); }
function tone(dst,t,type,f0,f1,dur,peak){ const o=AC.createOscillator(); o.type=type; o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur); const g=AC.createGain();
  g.gain.setValueAtTime(peak,t); g.gain.exponentialRampToValueAtTime(0.0001,t+dur); o.connect(g); g.connect(dst); o.start(t); o.stop(t+dur+0.02); }
const SND={
  pistol:(d,t)=>{ noise(d,t,.09,'bandpass',2400,1.1,.003,.9); tone(d,t,'sine',170,70,.07,.5); tone(d,t+.01,'triangle',560,420,.05,.12); },
  mp5:(d,t)=>{ noise(d,t,.06,'bandpass',3200,1.4,.002,.7); tone(d,t,'sine',210,90,.04,.35); },
  m4:(d,t)=>{ noise(d,t,.11,'bandpass',1700,.9,.003,1); tone(d,t,'sine',150,55,.09,.6); noise(d,t,.03,'highpass',5000,.7,.001,.25); },
  spas:(d,t)=>{ noise(d,t,.28,'bandpass',900,.6,.004,1.2); tone(d,t,'sine',95,38,.18,.9); clack(d,t+.38,900); clack(d,t+.55,650); },
  awp:(d,t)=>{ noise(d,t,.34,'lowpass',1400,.7,.004,1.3); noise(d,t,.05,'bandpass',4000,1,.001,.4); tone(d,t,'sine',75,32,.24,1.0); clack(d,t+.6,1200); clack(d,t+.85,800); },
  plop:(d,t)=>{ tone(d,t,'sine',820,170,.06,.55); noise(d,t,.015,'bandpass',4500,2,.001,.25); tone(d,t+.05,'sine',260,240,.04,.1); },
  thwap:(d,t)=>{ noise(d,t,.07,'lowpass',1300,.8,.002,.8); tone(d,t,'sine',230,120,.05,.35); },
  step:(d,t)=>{ noise(d,t,.06,'lowpass',500+Math.random()*200,.9,.004,.5); },
  hit:(d,t)=>{ tone(d,t,'square',2600,2400,.03,.15); },
  head:(d,t)=>{ tone(d,t,'sine',1900,1850,.18,.35); tone(d,t,'sine',2850,2800,.12,.12); },
  hurt:(d,t)=>{ noise(d,t,.12,'lowpass',700,.8,.002,.9); tone(d,t,'sawtooth',150,90,.14,.15); },
  reload:(d,t)=>{ clack(d,t,1500); clack(d,t+.18,1100); },
  reloadEnd:(d,t)=>{ clack(d,t,900); clack(d,t+.1,1400); },
  empty:(d,t)=>{ clack(d,t,2200); },
  buy:(d,t)=>{ tone(d,t,'square',1320,1320,.06,.12); tone(d,t+.07,'square',1760,1760,.12,.12); },
  beep:(d,t)=>{ tone(d,t,'sine',880,880,.12,.25); },
  go:(d,t)=>{ tone(d,t,'sine',660,660,.1,.25); tone(d,t+.12,'sine',990,990,.25,.25); },
  win:(d,t)=>{ [660,830,990].forEach((f,i)=>tone(d,t+i*.12,'triangle',f,f,.22,.3)); },
  lose:(d,t)=>{ [440,370,294].forEach((f,i)=>tone(d,t+i*.14,'triangle',f,f*0.98,.25,.3)); },
  scope:(d,t)=>{ clack(d,t,3000); },
};
function clack(d,t,f){ noise(d,t,.025,'bandpass',f,3,.001,.6); }
function sfx(kind,vol=1){ if(!AC||!SND[kind]) return; SND[kind](out(vol,0),AC.currentTime); }
const _cv=new THREE.Vector3(), _cr=new THREE.Vector3();
function sfxAt(kind,pos,vol=1){ if(!AC||!SND[kind]) return; camera.getWorldPosition(_cv); const d=_cv.distanceTo(pos); if(d>90) return;
  _cr.set(1,0,0).applyQuaternion(camera.quaternion); const dir=pos.clone().sub(_cv).normalize(); const pan=Math.max(-1,Math.min(1,dir.dot(_cr)))*0.8;
  SND[kind](out(vol*Math.min(1,3.5/(1+d*0.45)),pan),AC.currentTime); }

// ---------- réseau ----------
const net={conns:{},ready:false,peer:null,rtt:0,
  send(type,data){ const c=type==='s'?(this.conns.st||this.conns.evt):this.conns.evt; if(c&&c.open){ try{ c.send(Object.assign({t:type},data)); }catch(_){} } } };
const ICE={iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'},{urls:'stun:stun.cloudflare.com:3478'},
  {urls:'turn:openrelay.metered.ca:80',username:'openrelayproject',credential:'openrelayproject'},
  {urls:'turn:openrelay.metered.ca:443?transport=tcp',username:'openrelayproject',credential:'openrelayproject'}]};
const params=new URLSearchParams(location.search);
class LocalConn{ constructor(label,me){ this.label=label; this.me=me; this.open=false; this.h={}; this.bc=new BroadcastChannel('lyc-'+label);
    this.bc.onmessage=e=>{ if(e.data.from===this.me) return; if(e.data.hello){ if(!this.open){ this.open=true; this.bc.postMessage({from:this.me,hello:1}); this.h.open&&this.h.open(); } return; } this.h.data&&this.h.data(e.data.d); };
    setTimeout(()=>this.bc.postMessage({from:this.me,hello:1}),200); }
  on(k,f){ this.h[k]=f; } send(d){ this.bc.postMessage({from:this.me,d}); } close(){} }
function bindConn(c){
  net.conns[c.label]=c;
  c.on('open',()=>{ if(c.label==='evt'){ net.send('hello',{}); onConnected(); } });
  c.on('data',d=>onData(d));
  c.on('close',()=>{ if(c.label==='evt') onDisconnected(); });
  c.on('error',e=>console.warn('conn',e));
}
function peerOpts(){ return {config:ICE,debug:1}; }
function hostGame(){
  isHost=true; P.side='A'; enemy.side='B';
  if(params.has('local')){ bindConn(new LocalConn('evt','A')); bindConn(new LocalConn('st','A')); showLink(location.href.split('#')[0]+'#local'); return; }
  const id='lycee-'+Math.random().toString(36).slice(2,8);
  status('Création de la partie…');
  const peer=net.peer=new Peer(id,peerOpts());
  peer.on('open',()=>{ showLink(location.origin+location.pathname+'#'+id); });
  peer.on('connection',c=>{ if(net.conns[c.label]&&net.conns[c.label].open){ c.on('open',()=>c.close()); return; } bindConn(c); });
  peer.on('error',e=>status('Erreur réseau : '+(e.type||e)));
  peer.on('disconnected',()=>{ try{peer.reconnect();}catch(_){} });
}
function joinGame(id){
  isHost=false; P.side='B'; enemy.side='A';
  if(id==='local'){ bindConn(new LocalConn('evt','B')); bindConn(new LocalConn('st','B')); status('Connexion (local)…'); return; }
  status('Connexion à la partie…');
  const peer=net.peer=new Peer(peerOpts());
  peer.on('open',()=>{ bindConn(peer.connect(id,{label:'evt',reliable:true,serialization:'json'})); bindConn(peer.connect(id,{label:'st',reliable:false,serialization:'json'})); });
  peer.on('error',e=>status(e.type==='peer-unavailable'?"Cette partie n'existe plus. Demande un nouveau lien.":'Erreur réseau : '+(e.type||e)));
  setTimeout(()=>{ if(!net.ready) status("La connexion prend du temps… (pare-feu ? réessaie ou demande un nouveau lien)"); },15000);
}
let peerReady=false, meReady=false;
function onConnected(){ net.ready=true; status('Adversaire connecté !'); $('lobbyLink').style.display='none'; $('lobbyMain').style.display='block';
  $('bHost').style.display='none'; $('bSolo').style.display='none'; enterBtn(); }
function onDisconnected(){ net.ready=false; G.phase='wait'; setMsg('Adversaire déconnecté','Recharge la page pour une nouvelle partie'); $('net').textContent='déconnecté'; if(enemy.mesh) enemy.mesh.visible=false; }
function enterBtn(){ let b=$('bEnter'); if(!b){ b=document.createElement('button'); b.id='bEnter'; b.className='primary'; $('lobbyMain').appendChild(b); }
  b.disabled=false; b.style.display='block'; b.textContent='Entrer dans le jeu'; b.onclick=()=>{ audio(); meReady=true; net.send('ready',{}); hideLobby(); mode='net'; maybeStart(); }; }
function maybeStart(){ if(isHost&&meReady&&peerReady&&G.phase==='wait'){ G.sA=0; G.sB=0; G.n=0; startFreeze(); } }

function onData(d){
  switch(d.t){
    case 'ready': peerReady=true; maybeStart(); break;
    case 's': enemy.buf.push({tm:performance.now(),x:d.x,feet:d.f,z:d.z,yaw:d.y,pitch:d.p,alive:d.a,w:d.w}); if(enemy.buf.length>30) enemy.buf.shift(); break;
    case 'shot': { const o=new THREE.Vector3().fromArray(d.o); const wp=WEAPONS[d.w]||WEAPONS.pistol;
      d.e.forEach((e,i)=>spawnDart(o,new THREE.Vector3().fromArray(e),enemy.side,wp.speed,!!(d.h&&d.h[i])));
      spawnPuff(o); sfxAt(wp.snd,o,1.1); break; }
    case 'hit': if(P.alive&&G.phase==='live'){ P.hp=Math.max(0,P.hp-d.dmg); P.lastHitW=d.w; hurtFx(); if(P.hp<=0) die(d.w,d.zone); } break;
    case 'die': enemyDied(d); break;
    case 'g': applyRound(d); break;
    case 'ping': net.send('pong',{ts:d.ts}); break;
    case 'pong': net.rtt=performance.now()-d.ts; $('net').textContent='ping '+Math.round(net.rtt)+' ms'; break;
  }
}

// ---------- manches (l'hôte arbitre) ----------
function now(){ return performance.now()/1000; }
function broadcastRound(){ if(!isHost) return; net.send('g',{phase:G.phase,n:G.n,sA:G.sA,sB:G.sB,rem:Math.max(0,G.deadline-now()),win:G.win||''}); }
function startFreeze(){ G.n++; G.phase='freeze'; G.deadline=now()+FREEZE; G.win=''; respawn(); broadcastRound(); }
function startLive(){ G.phase='live'; G.deadline=now()+ROUND_TIME; liveStart=now(); broadcastRound(); sfx('go'); }
function endRound(winner){ if(G.phase!=='live') return; if(winner==='A')G.sA++; else if(winner==='B')G.sB++;
  G.win=winner; G.phase=(G.sA>=WIN||G.sB>=WIN)?'over':'end'; G.deadline=now()+(G.phase==='over'?8:END_TIME); broadcastRound(); roundFx(); }
let lastN=-1;
function applyRound(d){ const prev=G.phase; G.phase=d.phase; G.n=d.n; G.sA=d.sA; G.sB=d.sB; G.deadline=now()+d.rem; G.win=d.win;
  if(d.phase==='freeze'&&(prev!=='freeze'||lastN!==d.n)) respawn();
  if(d.phase==='live'&&prev==='freeze'){ liveStart=now(); sfx('go'); }
  lastN=d.n;
  if((d.phase==='end'||d.phase==='over')&&prev==='live') roundFx(); }
function roundFx(){ const me=G.win===P.side;
  if(G.win){ sfx(me?'win':'lose'); }
  if(me){ P.money+=3250; P.streak=0; } else if(G.win){ P.money+=1400+500*Math.min(P.streak,4); P.streak++; } else P.money+=1400;
  P.money=Math.min(16000,P.money); }
function hostTick(){
  if(!isHost||mode!=='net') return;
  const t=now();
  if(G.phase==='freeze'&&t>=G.deadline) startLive();
  else if(G.phase==='live'&&t>=G.deadline){ G.win=''; G.phase='end'; G.deadline=t+END_TIME; broadcastRound(); roundFx(); }
  else if(G.phase==='end'&&t>=G.deadline) startFreeze();
  else if(G.phase==='over'&&t>=G.deadline){ G.sA=0; G.sB=0; G.n=0; startFreeze(); }
}
function respawn(){ const s=SPAWN[P.side]; P.x=s.x+(Math.random()-.5)*2; P.z=s.z+(Math.random()-.5)*2; P.feet=0; P.vy=0; P.yaw=s.yaw; P.pitch=0; P.hp=100; P.alive=true;
  if(G.n<=1&&mode==='net'){ P.money=800; P.streak=0; P.inv[1]=null; }
  P.inv[2]={w:'pistol',ammo:12,res:36}; if(P.inv[1]){ const w=WEAPONS[P.inv[1].w]; P.inv[1].ammo=w.mag; P.inv[1].res=w.res; }
  P.cur=P.inv[1]?1:2; P.reloadT=0; P.cool=0; P.deployT=0; setZoom(0); showVM(); clearDarts(); closeShop(false); killfeed.length=0; drawFeed(); sfx('beep'); }
function die(w,zone){ P.alive=false; setZoom(0); net.send('die',{w,zone}); addFeed(enemy.side,w,P.side,zone==='head'); P.inv[1]=null; if(isHost) endRound(enemy.side); }
function enemyDied(d){ enemy.E.alive=false; const w=WEAPONS[d.w]?d.w:'pistol'; P.money=Math.min(16000,P.money+WEAPONS[w].reward); addFeed(P.side,w,enemy.side,d.zone==='head'); if(isHost) endRound(P.side); }

// ---------- boutique ----------
function canBuy(){ if(mode==='solo') return true; if(!P.alive) return false; if(G.phase==='freeze') return true;
  if(G.phase==='live'&&now()-liveStart<BUY_LIVE){ const s=SPAWN[P.side]; return Math.hypot(P.x-s.x,P.z-s.z)<30; } return false; }
let shopOpen=false;
function buildShop(){ const box=$('shopItems'); box.innerHTML='';
  SHOP.forEach((id,i)=>{ const w=WEAPONS[id]; const owned=(P.inv[w.slot]&&P.inv[w.slot].w===id); const b=document.createElement('button'); b.className='item'+(P.money<w.price&&!owned?' poor':'')+(owned?' owned':'');
    b.innerHTML=`<span class="k">${i+1}</span><b>${w.name}</b><small>type ${w.cs}</small><span class="pr">${w.price?w.price+' €':'gratuit'}</span><span class="st">${w.dmg.body} dégâts · ${w.mag} coups${w.pellets>1?' × '+w.pellets:''} · prime ${w.reward} €</span>`;
    b.onclick=()=>{ buy(id); }; box.appendChild(b); });
  $('shopMoney').textContent=P.money+' €'; }
function openShop(){ if(!canBuy()||shopOpen) return; shopOpen=true; buildShop(); $('shop').style.display='flex'; try{ document.exitPointerLock(); }catch(_){} }
function closeShop(relock=true){ if(!shopOpen) return; shopOpen=false; $('shop').style.display='none'; if(relock) lock(); }
function buy(id){ const w=WEAPONS[id]; if(!canBuy()) return closeShop();
  if(P.inv[w.slot]&&P.inv[w.slot].w===id){ P.cur=w.slot; showVM(); closeShop(); return; }
  if(P.money<w.price){ sfx('empty'); return; }
  P.money-=w.price; P.inv[w.slot]={w:id,ammo:w.mag,res:w.res}; P.cur=w.slot; P.deployT=0.5; P.reloadT=0; setZoom(0); showVM(); sfx('buy'); closeShop(); }

// ---------- tir ----------
let recoil=0, mouseDown=false, velX=0, velZ=0;
const DIRV=new THREE.Vector3();
function fire(){
  const w=W(), sl=SLOT();
  if(!P.alive||P.reloadT>0||P.cool>0||P.deployT>0||shopOpen) return;
  if(mode==='net'&&G.phase!=='live') return;
  if(sl.ammo<=0){ sfx('empty'); P.cool=0.25; startReload(); return; }
  sl.ammo--; P.cool=w.rate; recoil=1; flash.intensity=1.2;
  const spd=Math.hypot(velX,velZ);
  let spread=(w.zoom&&P.zoom?w.scoped:w.spread)+(spd>1.5?w.move*Math.min(1,spd/5):0)+(P.grounded?0:w.air);
  if(w.spray) spread+=Math.min(0.03,P.spray*0.004);
  camera.getWorldDirection(DIRV);
  const o=camera.getWorldPosition(new THREE.Vector3()), muzzle=muzzleWorld();
  const ends=[], hits=[]; let total=0, zoneHit=null;
  for(let p=0;p<w.pellets;p++){
    const d=DIRV.clone(); const sp=spread+(w.pelletSpread||0);
    d.x+=(Math.random()-.5)*2*sp; d.y+=(Math.random()-.5)*2*sp; d.z+=(Math.random()-.5)*2*sp; d.normalize();
    const tw=rayWorld(o,d,200);
    let hit=null; if(mode==='net'&&enemy.E.alive){ const r=rayPlayer(o,d,enemy.E); if(r&&r.t<tw) hit=r; }
    const tEnd=hit?hit.t:tw; const end=o.clone().addScaledVector(d,tEnd);
    ends.push(end); hits.push(hit?1:0);
    if(hit){ let dmg=w.dmg[hit.zone]; const [f0,f1,m]=w.fall; if(hit.t>f0) dmg*=1-(1-m)*Math.min(1,(hit.t-f0)/(f1-f0)); total+=dmg; if(!zoneHit||hit.zone==='head') zoneHit=hit.zone; }
  }
  ends.forEach((e,i)=>spawnDart(muzzle,e,P.side,w.speed,!!hits[i])); spawnPuff(muzzle); sfx(w.snd,0.8);
  net.send('shot',{w:sl.w,o:muzzle.toArray().map(v=>+v.toFixed(2)),e:ends.map(e=>e.toArray().map(v=>+v.toFixed(2))),h:hits});
  if(total>0){ total=Math.round(total); net.send('hit',{dmg:total,zone:zoneHit,w:sl.w}); hitMarker(zoneHit==='head'); sfx(zoneHit==='head'?'head':'hit'); }
  // recul
  P.spray++; const k=w.kick*(w.spray?Math.min(1.6,0.6+P.spray*0.12):1);
  P.pitch=Math.min(1.45,P.pitch+k+Math.random()*k*0.3); P.yaw+=(Math.random()-.5)*k*(w.spray&&P.spray>6?1.4:0.5);
  if(w.zoom&&P.zoom){ setTimeout(()=>{ if(P.alive&&SLOT().w==='awp'&&P.zoom) setZoom(0); },60); }
  if(w.snd==='spas'){ const pump=vmModels.spas.getObjectByName('pump'); if(pump){ pump.userData.t=0.5; } }
  if(sl.ammo===0) setTimeout(startReload,300);
}
function startReload(){ const sl=SLOT(), w=W(); if(P.reloadT>0||sl.ammo===w.mag||sl.res<=0||!P.alive) return; P.reloadT=w.reload; setZoom(0); sfx('reload'); }
function finishReload(){ const sl=SLOT(), w=W(); const need=w.mag-sl.ammo, take=Math.min(need,sl.res); sl.ammo+=take; sl.res-=take; sfx('reloadEnd'); }
function switchSlot(s){ if(!P.inv[s]||P.cur===s||!P.alive) return; P.cur=s; P.reloadT=0; P.deployT=0.45; setZoom(0); showVM(); }
function setZoom(z){ const w=WEAPONS[SLOT()?SLOT().w:'pistol']; P.zoom=z; const fov=z&&w.zoom?w.zoom[z-1]:BASEFOV; camera.fov=fov; camera.updateProjectionMatrix();
  $('scope').style.display=z?'block':'none'; vm.visible=!z&&P.alive; $('cross').style.display=z?'none':''; }
let hitT=0; function hitMarker(head){ const h=$('hitm'); h.classList.add('on'); h.querySelectorAll('i').forEach(i=>i.style.background=head?'#ff4b3a':'#fff'); hitT=0.15; }
function hurtFx(){ $('dmg').style.transition='none'; $('dmg').style.opacity=1; requestAnimationFrame(()=>{ $('dmg').style.transition='opacity .6s'; $('dmg').style.opacity=0; }); sfx('hurt'); }

// ---------- fil des éliminations ----------
const killfeed=[];
function addFeed(k,w,v,head){ killfeed.push({k,w,v,head,t:now()}); if(killfeed.length>4) killfeed.shift(); drawFeed(); }
function drawFeed(){ $('feed').innerHTML=killfeed.map(f=>`<div><i style="background:${COL[f.k]}">${f.k===P.side?'Toi':'Adversaire'}</i> ${WEAPONS[f.w].name}${f.head?' 🎯':''} <i style="background:${COL[f.v]}">${f.v===P.side?'Toi':'Adversaire'}</i></div>`).join(''); }

// ---------- contrôles ----------
const keys={};
addEventListener('keydown',e=>{ keys[e.code]=true;
  if(e.code==='KeyR') startReload();
  if(e.code==='KeyB'){ shopOpen?closeShop():openShop(); }
  if(e.code==='Escape'&&shopOpen) closeShop();
  if(shopOpen&&/^Digit[1-5]$/.test(e.code)){ buy(SHOP[+e.code.slice(5)-1]); return; }
  if(e.code==='Digit1') switchSlot(1); if(e.code==='Digit2') switchSlot(2);
  if(e.code==='KeyA'&&false){}
  if(e.code==='KeyQ'&&e.getModifierState&&!e.getModifierState('Shift')) { /* Q = gauche en AZERTY : pas de raccourci */ }
  if(['Space','ArrowUp','ArrowDown','Tab'].includes(e.code)) e.preventDefault(); });
addEventListener('keyup',e=>{ keys[e.code]=false; });
addEventListener('blur',()=>{ for(const k in keys) keys[k]=false; mouseDown=false; });
addEventListener('wheel',e=>{ if(mode==='lobby'||shopOpen) return; switchSlot(P.cur===1?2:1); },{passive:true});
let locked=false;
let sens=1; try{ sens=+localStorage.getItem('sens')||1; }catch(_){}
const look=(dx,dy)=>{ const s=0.0022*sens*(camera.fov/BASEFOV); P.yaw-=dx*s; P.pitch=Math.max(-1.5,Math.min(1.5,P.pitch-dy*s)); };
function lock(){ const q=()=>{ try{ const r=canvas.requestPointerLock(); if(r&&r.catch) r.catch(()=>{}); }catch(_){} };
  try{ const p=canvas.requestPointerLock({unadjustedMovement:true}); if(p&&p.catch) p.catch(q); }catch(_){ q(); } }
document.addEventListener('pointerlockchange',()=>{ locked=document.pointerLockElement===canvas; $('pause').style.display=(!locked&&mode!=='lobby'&&!shopOpen)?'flex':'none'; if(!locked) mouseDown=false; });
document.addEventListener('mousemove',e=>{ if(locked) look(e.movementX,e.movementY); });
canvas.addEventListener('mousedown',e=>{ if(!locked){ lock(); return; } if(e.button===0){ mouseDown=true; fire(); } if(e.button===2){ const w=W(); if(w.zoom){ setZoom((P.zoom+1)%3); sfx('scope'); } } });
canvas.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('mouseup',e=>{ if(e.button===0){ mouseDown=false; P.spray=0; } });
$('pause').onclick=()=>{ audio(); lock(); };
$('shopClose').onclick=()=>closeShop();
$('sens').value=sens; $('sensV').textContent=sens.toFixed(2);
$('sens').oninput=e=>{ sens=+e.target.value; $('sensV').textContent=sens.toFixed(2); try{ localStorage.setItem('sens',sens); }catch(_){} };

// ---------- lobby ----------
function status(t){ $('st').textContent=t; }
function showLink(url){ $('lobbyMain').style.display='none'; $('lobbyLink').style.display='block'; $('lnk').value=url; status("En attente de ton adversaire… (garde cette page ouverte)"); }
$('bCopy').onclick=()=>{ const i=$('lnk'); i.select(); const done=()=>$('bCopy').textContent='Copié ✓'; try{ navigator.clipboard.writeText(i.value).then(done).catch(()=>{ document.execCommand('copy'); done(); }); }catch(_){ document.execCommand('copy'); done(); } };
function hideLobby(){ $('lobby').style.display='none'; lock(); }
$('bHost').onclick=()=>{ audio(); hostGame(); };
$('bSolo').onclick=()=>{ audio(); mode='solo'; P.side='A'; G.phase='live'; P.money=16000; respawn(); hideLobby(); $('score').style.display='none'; $('net').textContent='entraînement · B : boutique'; };

// ---------- HUD ----------
const mm=$('mm'), mg=mm.getContext('2d');
const MB={x0:-14*S,x1:146*S,z0:-56*S,z1:68*S}; const MS=Math.min((mm.width-16)/(MB.x1-MB.x0),(mm.height-16)/(MB.z1-MB.z0));
const mx=x=>8+(x-MB.x0)*MS, mz=z=>8+(z-MB.z0)*MS;
function zoneAt(x,z,lvl){ let best=null,ba=1e9; for(const zn of zones) if(zn.lvl===lvl&&x>=zn.x0&&x<=zn.x1&&z>=zn.z0&&z<=zn.z1){ const a=(zn.x1-zn.x0)*(zn.z1-zn.z0); if(a<ba){ba=a;best=zn;} } return best; }
function drawMap(lvl){ mg.clearRect(0,0,mm.width,mm.height); mg.fillStyle='rgba(255,255,255,.08)';
  for(const z of zones) mg.fillRect(mx(z.x0),mz(z.z0),(z.x1-z.x0)*MS,(z.z1-z.z0)*MS);
  for(const z of zones) if(z.lvl===lvl){ mg.fillStyle=z.c; mg.globalAlpha=.85; mg.fillRect(mx(z.x0),mz(z.z0),(z.x1-z.x0)*MS,(z.z1-z.z0)*MS); }
  mg.globalAlpha=1; for(const s of ['A','B']){ mg.fillStyle=COL[s]; mg.beginPath(); mg.arc(mx(SPAWN[s].x),mz(SPAWN[s].z),4,0,7); mg.fill(); }
  mg.save(); mg.translate(mx(P.x),mz(P.z)); mg.rotate(-P.yaw); mg.fillStyle='#fff'; mg.beginPath(); mg.moveTo(0,-7); mg.lineTo(5,5); mg.lineTo(0,2); mg.lineTo(-5,5); mg.closePath(); mg.fill(); mg.restore(); }
function setMsg(a,b){ const h=a?`${a}${b?`<small>${b}</small>`:''}`:''; if($('msg').innerHTML!==h) $('msg').innerHTML=h; }
let hudT=0;
function hud(dt){
  hudT-=dt; if(hudT>0) return; hudT=0.1;
  const lvl=P.feet<2?0:P.feet<6?1:2; const zn=zoneAt(P.x,P.z,lvl);
  $('lvl').textContent=['RDC','R+1','R+2'][lvl]; $('zone').textContent=zn?zn.name:'Extérieur';
  drawMap(lvl);
  $('hp').innerHTML=Math.ceil(P.hp)+'<small>PV</small>'; $('hp').style.color=P.hp<35?'#ff6b5a':'#fff';
  const sl=SLOT(), w=W();
  $('ammo').innerHTML=(P.reloadT>0?'…':sl.ammo)+`<small>/ ${sl.res} · ${w.name}</small>`;
  $('money').textContent=P.money+' €';
  const cb=canBuy(); $('buyHint').style.display=cb&&!shopOpen?'block':'none';
  if(mode!=='net') return;
  $('sA').textContent=G.sA; $('sB').textContent=G.sB;
  const rem=Math.max(0,G.deadline-now());
  $('timer').textContent=G.phase==='live'||G.phase==='freeze'?`${Math.floor(rem/60)}:${String(Math.floor(rem%60)).padStart(2,'0')}`:'—';
  $('timer').style.color=G.phase==='live'&&rem<15?'#ff6b5a':'#fff';
  const meCol=P.side==='A'?'orange':'bleu';
  if(G.phase==='wait') setMsg("En attente de l'adversaire…",'');
  else if(G.phase==='freeze') setMsg(`Manche ${G.n}`,`Départ dans ${Math.ceil(rem)} s · tu es ${meCol} (${SPAWN[P.side].name}) · B : boutique`);
  else if(G.phase==='live') setMsg(P.alive?'':'Éliminé',P.alive?'':'Prochaine manche bientôt');
  else if(G.phase==='end') setMsg(G.win?(G.win===P.side?'Manche gagnée !':'Manche perdue'):'Temps écoulé — égalité', `${G.sA} – ${G.sB}`);
  else if(G.phase==='over') setMsg(G.win===P.side?'🏆 Victoire !':'Défaite', `${G.sA} – ${G.sB} · nouvelle partie dans ${Math.ceil(rem)} s`);
}

// ---------- boucle ----------
let sendT=0, pingT=0, bob=0, stepAcc=0, bcT=1;
function update(dt){
  const canMove=P.alive&&!shopOpen&&(mode==='solo'||(mode==='net'&&(G.phase==='live'||G.phase==='end'||G.phase==='over')));
  let f=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0), s=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);
  if(!canMove){ f=0; s=0; }
  const fx=-Math.sin(P.yaw), fz=-Math.cos(P.yaw), rx=Math.cos(P.yaw), rz=-Math.sin(P.yaw);
  const m=Math.hypot(f,s)||1, heavy=W().snd==='awp'?0.9:1, sp=((keys.ShiftLeft||keys.ShiftRight)?6.2:4.4)*heavy*(P.zoom?0.5:1);
  const tx=(fx*f+rx*s)/m*sp*(f||s?1:0), tz=(fz*f+rz*s)/m*sp*(f||s?1:0);
  const acc=P.grounded?14:3; velX+=(tx-velX)*Math.min(1,acc*dt); velZ+=(tz-velZ)*Math.min(1,acc*dt);
  const steps=Math.ceil(Math.hypot(velX,velZ)*dt/0.1)||1;
  for(let i=0;i<steps;i++){ P.x+=velX*dt/steps; P.z+=velZ*dt/steps; collide(); }
  if(keys.Space&&P.grounded&&canMove){ P.vy=5.6; P.grounded=false; }
  const fl=floorAt(P.x,P.z,P.feet);
  P.vy-=20*dt; let nf=P.feet+P.vy*dt;
  if(P.vy>0){ const c=ceilAt(P.x,P.z,P.feet); if(nf+HEIGHT>c){ nf=c-HEIGHT; P.vy=0; } }
  if(nf<=fl){ if(!P.grounded&&P.vy<-4) sfx('step',0.5); nf=fl; P.vy=0; P.grounded=true; } else P.grounded=nf-fl<0.05;
  P.feet=nf;
  const spd=Math.hypot(velX,velZ);
  if(P.grounded&&spd>3){ stepAcc+=dt*spd; if(stepAcc>1.9){ stepAcc=0; sfx('step',0.22); } }
  // arme
  P.cool=Math.max(0,P.cool-dt); P.deployT=Math.max(0,P.deployT-dt);
  if(P.reloadT>0){ P.reloadT-=dt; if(P.reloadT<=0){ P.reloadT=0; finishReload(); } }
  if(mouseDown&&W().auto) fire();
  if(!mouseDown) P.spray=Math.max(0,P.spray-dt*12);
  recoil=Math.max(0,recoil-dt*8); flash.intensity=Math.max(0,flash.intensity-dt*30);
  if(hitT>0){ hitT-=dt; if(hitT<=0) $('hitm').classList.remove('on'); }
  const pump=vmModels.spas.getObjectByName('pump'); if(pump){ const t=pump.userData.t||0; if(t>0){ pump.userData.t=t-dt; } const k=t>0?Math.sin(Math.min(1,(0.5-t)/0.5)*Math.PI):0; pump.position.z=-.36+k*0.1; }
  // caméra
  bob+=dt*spd*1.6;
  const eye=P.alive?EYE:0.35;
  camera.position.set(P.x,P.feet+eye+(P.grounded?Math.sin(bob*2)*0.025*Math.min(1,spd/4):0),P.z);
  camera.rotation.set(P.pitch,P.yaw,P.alive?0:0.5);
  const vp=VMPOS[SLOT().w], dep=P.deployT>0?P.deployT*0.5:0;
  vm.visible=P.alive&&!P.zoom;
  vm.position.set(vp[0]+Math.sin(bob)*0.006,vp[1]-Math.abs(Math.cos(bob))*0.006-(P.reloadT>0?0.08:0)-dep,vp[2]+recoil*0.035);
  vm.rotation.set(recoil*(W().kick>0.03?0.4:0.15)+(P.reloadT>0?-0.5:0)-dep*2,0,P.reloadT>0?0.3:0);
  if(mode==='net'){ updEnemy(dt);
    sendT-=dt; if(sendT<=0){ sendT=1/30; sendState(); }
    pingT-=dt; if(pingT<=0){ pingT=2; net.send('ping',{ts:performance.now()}); }
    hostTick(); if(isHost){ bcT-=dt; if(bcT<=0){ bcT=1; broadcastRound(); } }
  }
  updDarts(dt); hud(dt);
}
function sendState(){ net.send('s',{x:+P.x.toFixed(3),f:+P.feet.toFixed(3),z:+P.z.toFixed(3),y:+P.yaw.toFixed(3),p:+P.pitch.toFixed(3),a:P.alive?1:0,w:SLOT().w}); }
function updEnemy(dt){
  const b=enemy.buf; if(!b.length) return;
  if(!enemy.mesh){ enemy.mesh=makeAvatar(COL[enemy.side]); scene.add(enemy.mesh); }
  const rt=performance.now()-80; let a=b[0], c=b[b.length-1];
  for(let i=0;i<b.length-1;i++) if(b[i].tm<=rt&&b[i+1].tm>=rt){ a=b[i]; c=b[i+1]; break; }
  const k=c.tm===a.tm?1:Math.max(0,Math.min(1,(rt-a.tm)/(c.tm-a.tm)));
  let dy=c.yaw-a.yaw; dy=Math.atan2(Math.sin(dy),Math.cos(dy));
  const E=enemy.E, px=E.x, pz=E.z; E.x=a.x+(c.x-a.x)*k; E.feet=a.feet+(c.feet-a.feet)*k; E.z=a.z+(c.z-a.z)*k; E.yaw=a.yaw+dy*k; E.pitch=a.pitch+(c.pitch-a.pitch)*k; E.alive=!!c.alive; E.w=c.w||'pistol';
  const M=enemy.mesh, U=M.userData; M.visible=true; M.position.set(E.x,E.feet,E.z); M.rotation.set(0,E.yaw,E.alive?0:Math.PI/2*0.98);
  if(!E.alive) M.position.y=E.feet+0.3;
  if(U.cur!==E.w){ U.gunHolder.clear(); const gm=gunModel(E.w); gm.traverse(o=>{ if(o.isMesh) o.castShadow=true; }); U.gunHolder.add(gm); U.cur=E.w; }
  U.gunHolder.rotation.x=E.pitch;
  const v=Math.hypot(E.x-px,E.z-pz)/Math.max(dt,1e-3);
  enemy.stepT+=dt*Math.min(v,7); const sw=Math.sin(enemy.stepT*2.2)*Math.min(1,v/3)*0.5; U.legL.rotation.x=sw; U.legR.rotation.x=-sw;
  if(E.alive&&v>3&&Math.abs(E.feet-floorAt(E.x,E.z,E.feet))<0.1){ enemy.stepAcc=(enemy.stepAcc||0)+dt*v; if(enemy.stepAcc>1.9){ enemy.stepAcc=0; sfxAt('step',new THREE.Vector3(E.x,E.feet,E.z),0.9); } }
}
setInterval(()=>{ if(document.hidden&&mode==='net'){ sendState(); hostTick(); if(isHost) broadcastRound(); } },250);
const clock=new THREE.Clock();
function loop(){ requestAnimationFrame(loop); const dt=Math.min(0.05,clock.getDelta()); update(dt); renderer.render(scene,camera); }
addEventListener('resize',()=>{ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); });
const BASEFOV=78; camera.fov=BASEFOV; camera.updateProjectionMatrix();
respawn();
window.__G=G; window.__P=P; window.__net=net; window.__sim=(code,secs)=>{ keys[code]=true; for(let i=0;i<secs*60;i++) update(1/60); keys[code]=false; };
window.__fire=()=>fire(); window.__enemy=enemy; window.__buy=buy; window.__S=S; window.__upd=(s)=>{ for(let i=0;i<s*60;i++) update(1/60); };
window.__info=()=>({calls:renderer.info.render.calls,tris:renderer.info.render.triangles,geo:renderer.info.memory.geometries});
window.__ready=true;
$('bHost').disabled=false; $('bSolo').disabled=false; status('');
const h=location.hash.slice(1);
if(h){ $('bHost').style.display='none'; $('bSolo').style.display='none'; joinGame(h); }
loop();
</script>
</body>
</html>
