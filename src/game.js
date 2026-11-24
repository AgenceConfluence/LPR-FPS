
// ============================================================
//  JEU 1v1 — blasters en mousse
// ============================================================
const STEP=0.45, RAD=0.3, EYE=1.62, EYE_C=1.08, H_STAND=1.72, H_CROUCH=1.2; let HEIGHT=H_STAND;
const ROUND_TIME=105, FREEZE=12, END_TIME=4, WIN=5, BUY_LIVE=20;
const SPAWN={ A:{x:118*S,z:27*S,yaw:Math.PI/2,name:'Parvis'}, B:{x:38*S,z:31*S,yaw:-Math.PI/2,name:'Devant le self'} };
const PB=window.THEME==='paintball';
const COL=PB?{A:'#ff2d95',B:'#f2c200'}:{A:'#e8742c',B:'#2a7fd4'};
const WEAPONS={
  pistol:{name:'Piston',cs:'USP-S',price:0,slot:2,mag:12,res:36,auto:false,rate:0.17,reload:2.1,dmg:{head:100,body:34,leg:26},spread:0.003,move:0.02,air:0.06,kick:0.014,pellets:1,reward:300,speed:90,snd:'pistol',fall:[40,120,0.75]},
  mp5:{name:'Vortex',cs:'MP5-SD',price:1500,slot:1,mag:30,res:120,auto:true,rate:0.08,reload:2.6,dmg:{head:72,body:25,leg:19},spread:0.005,move:0.012,air:0.06,kick:0.006,pellets:1,reward:600,speed:85,snd:'mp5',fall:[25,70,0.7]},
  spas:{name:'Tempête',cs:'SPAS-12',price:1800,slot:1,mag:7,res:28,auto:false,rate:0.9,reload:3.2,dmg:{head:40,body:22,leg:16},spread:0.0,pelletSpread:0.045,move:0.0,air:0.03,kick:0.05,pellets:8,reward:900,speed:60,snd:'spas',fall:[8,24,0.15]},
  m4:{name:'Rafale',cs:'M4A1-S',price:2900,slot:1,mag:25,res:75,auto:true,rate:0.1,reload:3.0,dmg:{head:92,body:31,leg:24},spread:0.0025,move:0.05,air:0.1,kick:0.009,spray:true,pellets:1,reward:300,speed:120,snd:'m4',fall:[50,150,0.8]},
  awp:{name:'Longue-Vue',cs:'AWP',price:4750,slot:1,mag:5,res:30,auto:false,rate:1.45,reload:3.6,dmg:{head:200,body:115,leg:85},spread:0.09,scoped:0.0006,move:0.12,air:0.2,kick:0.06,pellets:1,reward:100,speed:220,snd:'awp',zoom:[40,15],fall:[200,300,1]},
};
const NADE_BASE={slot:3,isNade:true,mag:1,res:0,auto:false,rate:0.5,reload:0,dmg:{head:0,body:0,leg:0},spread:0,move:0,air:0,kick:0,pellets:1,speed:0,snd:'nade',fall:[1,2,1],reward:300};
WEAPONS.he=Object.assign({},NADE_BASE,{name:'Grenade à billes',cs:'HE',price:300,max:1,info:'jusqu\'à 98 dégâts · rayon 6 m'});
WEAPONS.flash=Object.assign({},NADE_BASE,{name:'Flash',cs:'flashbang',price:200,max:2,info:'aveugle jusqu\'à 4 s'});
WEAPONS.smoke=Object.assign({},NADE_BASE,{name:'Fumigène',cs:'smoke',price:300,max:1,info:'nuage de 15 s'});
if(PB){ // lanceurs de paintball (calibre .68) : 2 billes au corps, 1 à la tête
  Object.assign(WEAPONS.pistol,{drag:0.01,name:'TPX',cs:'pistolet Tippmann TiPX',mag:10,res:30,rate:0.2,reload:2.2,dmg:{head:100,body:50,leg:34},spread:0.006,move:0.02,air:0.06,kick:0.01,speed:88,snd:'pb_pistol',reward:300,bounce:0.08,fall:[200,300,1]});
  Object.assign(WEAPONS.mp5,{drag:0.01,name:'Etha 3',cs:'électro Planet Eclipse Etha3',mag:200,res:200,auto:true,rate:0.095,reload:2.6,dmg:{head:100,body:50,leg:34},spread:0.011,move:0.012,air:0.05,kick:0.004,speed:86,snd:'pb_etha',reward:600,bounce:0.08,fall:[200,300,1]});
  Object.assign(WEAPONS.spas,{drag:0.01,name:'AMP Rampe',cs:'Shocker AMP en rafale de 3',price:1800,mag:150,res:150,auto:false,rate:0.32,reload:2.6,dmg:{head:100,body:50,leg:34},spread:0.004,pelletSpread:0.018,pellets:3,move:0.01,air:0.04,kick:0.02,speed:88,snd:'pb_amp',reward:900,bounce:0.08,fall:[200,300,1]});
  Object.assign(WEAPONS.m4,{drag:0.009,name:'CS3 Pro',cs:'Planet Eclipse CS3 Pro',mag:200,res:200,auto:true,rate:0.067,reload:2.4,dmg:{head:100,body:50,leg:34},spread:0.008,move:0.035,air:0.08,kick:0.004,spray:true,speed:90,snd:'pb_cs3',reward:300,bounce:0.07,fall:[200,300,1]});
  Object.assign(WEAPONS.awp,{drag:0.004,name:'First Strike',cs:'Tippmann TMC + billes First Strike',mag:10,res:30,rate:0.75,reload:3,dmg:{head:200,body:100,leg:60},spread:0.06,scoped:0.0012,move:0.1,air:0.15,kick:0.03,speed:115,snd:'pb_fs',reward:100,bounce:0,fall:[300,400,1]});
  WEAPONS.he.name='Grenade de peinture'; WEAPONS.he.info='repeint tout dans un rayon de 4 m · jusqu\'à 98 dégâts';
}
const SHOP=['pistol','mp5','spas','m4','awp','he','flash','smoke'];
const NADES=['he','flash','smoke'];

scene.add(camera);
const P={x:0,z:0,feet:0,vy:0,yaw:0,pitch:0,grounded:true,hp:100,alive:true,side:'A',money:800,streak:0,
  inv:{1:null,2:{w:'pistol',ammo:12,res:36}},cur:2,nades:{he:0,flash:0,smoke:0},prev:2,blind:0,crouch:false,eyeH:1.62,reloadT:0,cool:0,deployT:0,spray:0,zoom:0,lastHitW:'pistol'};
let mode='lobby';
let G={phase:'wait',n:0,sA:0,sB:0,deadline:0,win:'',mode:'classic',pA:0,pB:0};
let isHost=false, liveStart=0;
const SLOT=()=>P.inv[P.cur]||P.inv[2], W=()=>WEAPONS[SLOT().w];

const params0=new URLSearchParams(location.search);
// ---------- environnement HDRI (CC0, Poly Haven via @pmndrs/assets) ----------
if(!params0.has('noenv')) import('three/addons/loaders/EXRLoader.js').then(({EXRLoader})=>{
  new EXRLoader().load((PB?'../':'')+'assets/park.exr',tex=>{ tex.mapping=THREE.EquirectangularReflectionMapping; const pm=new THREE.PMREMGenerator(renderer);
    const env=pm.fromEquirectangular(tex).texture; tex.dispose(); pm.dispose();
    for(const k of ['glass','steel','kitchen']){ MAT[k].envMap=env; MAT[k].envMapIntensity=k==='glass'?1.0:0.6; MAT[k].needsUpdate=true; } });
}).catch(()=>{});

// ---------- collisions ----------
function near(x,z,r){ const out=new Set(); for(let cx=Math.floor((x-r)/CELL);cx<=Math.floor((x+r)/CELL);cx++) for(let cz=Math.floor((z-r)/CELL);cz<=Math.floor((z+r)/CELL);cz++){ const a=grid.get(cx*100003+cz); if(a) for(const b of a) out.add(b);} return out; }
function floorAt(x,z,feet){ let h=0; for(const b of near(x,z,0)) if(!b.broken&&x>=b.x0&&x<=b.x1&&z>=b.z0&&z<=b.z1&&b.y1<=feet+STEP&&b.y1>h) h=b.y1; return h; }
function ceilAt(x,z,feet){ let h=1e9; for(const b of near(x,z,RAD)) if(!b.broken&&x>=b.x0-RAD&&x<=b.x1+RAD&&z>=b.z0-RAD&&z<=b.z1+RAD&&b.y0>=feet+HEIGHT-0.05&&b.y0<h) h=b.y0; return h; }
function collide(){
  for(let it=0;it<3;it++) for(const b of near(P.x,P.z,RAD+0.1)){
    if(b.broken||b.y1<=P.feet+STEP||b.y0>=P.feet+HEIGHT) continue;
    const cx=Math.max(b.x0,Math.min(P.x,b.x1)), cz=Math.max(b.z0,Math.min(P.z,b.z1));
    const dx=P.x-cx, dz=P.z-cz, d=Math.hypot(dx,dz);
    if(d<RAD){ if(d<1e-6){ const pen=[P.x-b.x0,b.x1-P.x,P.z-b.z0,b.z1-P.z]; const i=pen.indexOf(Math.min(...pen));
        if(i===0)P.x=b.x0-RAD; else if(i===1)P.x=b.x1+RAD; else if(i===2)P.z=b.z0-RAD; else P.z=b.z1+RAD; }
      else { P.x=cx+dx/d*RAD; P.z=cz+dz/d*RAD; } }
  }
}
let rwBox=null, rwAxis=-1;
function rayWorld(o,d,maxT){
  let best=maxT, nrm=null, hb=null; const seen=new Set(), cells=new Set();
  for(let t=0;t<=maxT&&t<best+CELL;t+=0.5){
    const x=o.x+d.x*t, z=o.z+d.z*t; const k=Math.floor(x/CELL)*100003+Math.floor(z/CELL); if(cells.has(k)) continue; cells.add(k);
    const a=grid.get(k); if(!a) continue;
    for(const b of a){ if(seen.has(b)) continue; seen.add(b); if(b.broken) continue;
      let t0=0,t1=best,ax=-1;
      const A=[[o.x,d.x,b.x0,b.x1],[o.y,d.y,b.y0,b.y1],[o.z,d.z,b.z0,b.z1]];
      for(let i=0;i<3;i++){ const [oo,dd,lo,hi]=A[i];
        if(Math.abs(dd)<1e-9){ if(oo<lo||oo>hi){t0=1e9;break;} continue; }
        let ta=(lo-oo)/dd, tb=(hi-oo)/dd; if(ta>tb)[ta,tb]=[tb,ta]; if(ta>t0){t0=ta;ax=i;} t1=Math.min(t1,tb); if(t0>t1) break; }
      if(t0<=t1&&t0<best&&t0>0.02){ best=t0; nrm=ax; hb=b; } }
  }
  rwBox=best<maxT?hb:null; rwAxis=nrm;
  return best;
}
function rayPlayer(o,d,E){
  let res=null;
  const cr=!!E.crouch, hc={x:E.x,y:E.feet+(cr?1.08:1.56),z:E.z}, r=0.19;
  const ox=o.x-hc.x, oy=o.y-hc.y, oz=o.z-hc.z, bq=ox*d.x+oy*d.y+oz*d.z, c=ox*ox+oy*oy+oz*oz-r*r, disc=bq*bq-c;
  if(disc>=0){ const t=-bq-Math.sqrt(disc); if(t>0) res={t,zone:'head'}; }
  const R2=0.3, a=d.x*d.x+d.z*d.z;
  if(a>1e-9){ const px=o.x-E.x, pz=o.z-E.z, b2=px*d.x+pz*d.z, c2=px*px+pz*pz-R2*R2, ds=b2*b2-a*c2;
    if(ds>=0){ const t=(-b2-Math.sqrt(ds))/a; if(t>0){ const y=o.y+d.y*t-E.feet; if(y>=0&&y<=(cr?0.95:1.38)&&(!res||t<res.t)) res={t,zone:y<(cr?0.5:0.8)?'leg':'body'}; } } }
  return res;
}

// ---------- modèles d'armes ----------
const GM={o:new THREE.MeshStandardMaterial({color:'#f28c28',roughness:.45}),y:new THREE.MeshStandardMaterial({color:'#ffd23f',roughness:.4}),g:new THREE.MeshStandardMaterial({color:'#3a3f44',roughness:.6}),
  b:new THREE.MeshStandardMaterial({color:'#2a7fd4',roughness:.5}),t:new THREE.MeshStandardMaterial({color:'#2fb39a',roughness:.5}),k:new THREE.MeshStandardMaterial({color:'#15181a',roughness:.4}),
  v:new THREE.MeshStandardMaterial({color:'#6b8f3a',roughness:.55}),w:new THREE.MeshStandardMaterial({color:'#eceae4',roughness:.5}),lens:new THREE.MeshStandardMaterial({color:'#7fd3ff',roughness:.05,metalness:.6})};
const SKIN=new THREE.MeshStandardMaterial({color:'#e0b48f',roughness:.75}), SLEEVE=new THREE.MeshStandardMaterial({color:'#e8742c',roughness:.8});
function pbMarker(g,id,bx,cy){
  const C={pistol:['k','g'],mp5:['t','k'],spas:['o','k'],m4:['t','w'],awp:['v','k']}[id], body=C[0], acc=C[1];
  if(id==='pistol'){ bx(.04,.1,.24,'k',0,.01,0); cy(.012,.16,'g',0,.02,-.2); bx(.045,.14,.06,acc,0,-.1,.08,-.2); bx(.03,.03,.1,body,0,.07,0); bx(.05,.04,.06,'g',0,-.19,.1,-.2); return .28; }
  bx(.045,.085,.24,body,0,0,0); bx(.04,.13,.06,'g',0,-.1,.09,-.15); bx(.012,.05,.07,'g',0,-.06,.01);
  cy(.011,id==='m4'?.42:id==='awp'?.52:.34,'g',0,.015,id==='m4'?-.33:id==='awp'?-.38:-.29);
  bx(.036,.11,.06,acc,0,-.09,-.07);
  const tank=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.26,14),GM.g); tank.rotation.x=Math.PI/2+0.25; tank.position.set(0,-.11,.24); g.add(tank);
  const cap=new THREE.Mesh(new THREE.SphereGeometry(.04,12,8),GM.g); cap.position.set(0,-.145,.37); g.add(cap);
  if(id==='awp'){ bx(.035,.12,.07,'k',0,-.11,-.03); cy(.022,.2,'k',0,.08,0); cy(.024,.02,'lens',0,.08,-.1); }
  else { const hop=new THREE.Mesh(new THREE.BoxGeometry(.1,.09,.14),new THREE.MeshStandardMaterial({color:'#1b1f23',roughness:.25,transparent:true,opacity:.85})); hop.position.set(0,.135,.03); g.add(hop);
    const top=new THREE.Mesh(new THREE.SphereGeometry(.055,14,8,0,Math.PI*2,0,Math.PI/2),GM.k); top.scale.set(1,.45,1.3); top.position.set(0,.18,.03); g.add(top); const st=new THREE.Mesh(new THREE.BoxGeometry(.102,.015,.142),GM[acc==='k'?body:acc]); st.position.set(0,.12,.03); g.add(st);
    const neck=new THREE.Mesh(new THREE.CylinderGeometry(.016,.016,.06,10),GM.k); neck.position.set(0,.075,.01); g.add(neck); }
  return id==='m4'?.54:id==='awp'?.64:.46;
}
function gunModel(id,arms=false){
  const g=new THREE.Group();
  const bx=(w,h,d,m,x,y,z,rx=0)=>{ const me=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),GM[m]); me.position.set(x,y,z); me.rotation.x=rx; g.add(me); return me; };
  const cy=(r,l,m,x,y,z)=>{ const me=new THREE.Mesh(new THREE.CylinderGeometry(r,r,l,14),GM[m]); me.rotation.x=Math.PI/2; me.position.set(x,y,z); g.add(me); return me; };
  let pbLen=0; if(PB&&!['he','flash','smoke'].includes(id)) pbLen=pbMarker(g,id,bx,cy);
  if(!PB&&id==='pistol'){ bx(.075,.1,.34,'o',0,0,0); bx(.06,.06,.14,'y',0,.01,-.22); cy(.018,.02,'g',0,.01,-.3); bx(.06,.15,.08,'g',0,-.11,.09,-.25); bx(.08,.03,.2,'b',0,.065,-.02); bx(.02,.05,.06,'g',0,-.07,-.02); }
  if(!PB&&id==='mp5'){ bx(.07,.11,.36,'w',0,0,0); cy(.04,.26,'g',0,.01,-.3); bx(.05,.2,.07,'o',0,-.15,-.06,0.25); bx(.055,.13,.07,'g',0,-.11,.12,-.2); bx(.02,.02,.2,'g',.03,.0,.27); bx(.02,.02,.2,'g',-.03,.0,.27); bx(.07,.06,.03,'g',0,0,.37); bx(.07,.04,.08,'t',0,.075,-.02); }
  if(!PB&&id==='m4'){ bx(.08,.12,.48,'b',0,0,0); cy(.028,.34,'g',0,.01,-.4); bx(.065,.1,.24,'o',0,-.01,.34); bx(.05,.19,.09,'y',0,-.15,-.07,0.2); bx(.055,.13,.07,'g',0,-.11,.13,-.2); bx(.03,.05,.16,'g',0,.09,-.02); bx(.07,.07,.18,'g',0,-.06,-.22); }
  if(!PB&&id==='spas'){ bx(.08,.11,.38,'t',0,0,0); cy(.026,.5,'g',0,.025,-.38); cy(.022,.42,'g',0,-.035,-.34); const pump=bx(.085,.075,.18,'o',0,-.035,-.36); pump.name='pump'; bx(.06,.1,.26,'g',0,-.02,.3); bx(.055,.13,.07,'g',0,-.11,.11,-.2); }
  if(!PB&&id==='awp'){ bx(.075,.11,.62,'v',0,0,0); cy(.022,.62,'g',0,.02,-.6); cy(.034,.32,'k',0,.11,-.03); cy(.036,.02,'lens',0,.11,-.2); bx(.07,.13,.3,'v',0,-.02,.42); bx(.055,.14,.07,'g',0,-.12,.12,-.2); bx(.05,.09,.06,'y',0,-.1,-.08); const bolt=new THREE.Mesh(new THREE.SphereGeometry(.02,8,6),GM.y); bolt.position.set(.07,.03,.1); g.add(bolt); }
  if(id==='he'){ const s=new THREE.Mesh(new THREE.SphereGeometry(.055,16,12),GM.v); g.add(s); const b=new THREE.Mesh(new THREE.TorusGeometry(.055,.008,6,20),GM.y); b.rotation.x=Math.PI/2; g.add(b); bx(.02,.03,.02,'g',0,.06,0); }
  if(id==='flash'){ const c=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.12,14),GM.w); g.add(c); bx(.02,.03,.02,'g',0,.075,0); const r2=new THREE.Mesh(new THREE.CylinderGeometry(.037,.037,.02,14),GM.b); g.add(r2); }
  if(id==='smoke'){ const c=new THREE.Mesh(new THREE.CylinderGeometry(.038,.038,.13,14),GM.g); g.add(c); const t=new THREE.Mesh(new THREE.CylinderGeometry(.039,.039,.025,14),GM.t); t.position.y=.06; g.add(t); }
  g.userData.len=pbLen||({pistol:.32,mp5:.43,spas:.63,m4:.57,awp:.91}[id]||.1);
  if(arms&&NADES.includes(id)){ const h=new THREE.Mesh(new THREE.BoxGeometry(.085,.09,.11),SKIN); h.position.set(.02,-.05,.04); g.add(h); const A=new THREE.Vector3(.03,-.08,.08), Bv=new THREE.Vector3(.16,-.38,.6), d=Bv.clone().sub(A), L=d.length(); const m=new THREE.Mesh(new THREE.BoxGeometry(.085,.085,L),SLEEVE); m.position.copy(A).addScaledVector(d,0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),d.normalize()); g.add(m); }
  else if(arms){ const grip={pistol:[0,-.12,.09],mp5:[0,-.12,.12],spas:[0,-.12,.11],m4:[0,-.12,.13],awp:[0,-.13,.12]}[id], fore={pistol:[-.035,-.12,.07],mp5:[0,-.07,-.2],spas:[0,-.075,-.36],m4:[0,-.08,-.22],awp:[0,-.07,-.3]}[id];
    const hand=(p,par)=>{ const h=new THREE.Mesh(new THREE.BoxGeometry(.075,.085,.12),SKIN); h.position.set(p[0],p[1],p[2]); par.add(h); return h; };
    const limb=(a,b,par)=>{ const A=new THREE.Vector3(...a), Bv=new THREE.Vector3(...b), d=Bv.clone().sub(A), L=d.length(); const m=new THREE.Mesh(new THREE.BoxGeometry(.085,.085,L),SLEEVE);
      m.position.copy(A).addScaledVector(d,0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),d.normalize()); par.add(m); };
    hand(grip,g); limb([grip[0]+.01,grip[1]-.03,grip[2]+.06],[.16,-.38,.62],g);
    const pump=g.getObjectByName('pump'); if(pump){ hand([0,-.045,0],pump); limb([-.02,-.07,.06],[-.26,-.36,.5],pump); }
    else { hand(fore,g); limb([fore[0]-.02,fore[1]-.03,fore[2]+.05],[-.24,-.38,.5],g); } }
  return g;
}
const vm=new THREE.Group(); camera.add(vm);
const vmModels={}; for(const id of SHOP){ if(false) continue; const m=gunModel(id,true); m.visible=false; m.traverse(o=>{ if(o.isMesh){ o.renderOrder=10; } }); vm.add(m); vmModels[id]=m; }
const VMPOS=PB?{he:[.2,-.2,-.38,.9],flash:[.2,-.2,-.38,.9],smoke:[.2,-.2,-.38,.9],pistol:[.18,-.18,-.34,.6],mp5:[.22,-.25,-.3,.45],spas:[.22,-.25,-.3,.45],m4:[.22,-.25,-.29,.45],awp:[.22,-.24,-.27,.44]}:{he:[.2,-.2,-.38,.9],flash:[.2,-.2,-.38,.9],smoke:[.2,-.2,-.38,.9],pistol:[.17,-.17,-.36,.6],mp5:[.19,-.19,-.33,.52],spas:[.2,-.2,-.31,.5],m4:[.2,-.2,-.31,.5],awp:[.2,-.21,-.28,.46]};
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
const ballGeo=new THREE.SphereGeometry(0.0085,10,8), ballMat={A:new THREE.MeshStandardMaterial({color:COL.A,roughness:.2,metalness:.1}),B:new THREE.MeshStandardMaterial({color:COL.B,roughness:.2,metalness:.1})};
function makeDart(side){ if(PB){ const g=new THREE.Group(); g.add(new THREE.Mesh(ballGeo,ballMat[side])); g.scale.setScalar(2.4); return g; } const g=new THREE.Group(); g.add(new THREE.Mesh(dartGeo,dartMat[side])); g.add(new THREE.Mesh(tipGeo,tipMat)); g.scale.setScalar(2.1); return g; }
// projectiles balistiques : vitesse initiale + gravité, impact testé segment par segment
const GRAV=9.8, MAXLIFE=15;
function spawnProj(o,vel,side,w,local,muzzle){
  const m=makeDart(side); scene.add(m);
  const tr=new THREE.Mesh(trailGeo,trailMat[side]); tr.scale.set(1,1,0.01); m.add(tr);
  const off=muzzle?muzzle.clone().sub(o):new THREE.Vector3();
  flying.push({m,tr,pos:o.clone(),vel:vel.clone(),side,w,local,dist:0,life:0,off});
}
const _seg=new THREE.Vector3(), _nx=new THREE.Vector3(), _look=new THREE.Vector3();
function surfNormal(dir){ const n=new THREE.Vector3(); const a=(rwAxis==null||rwAxis<0)?1:rwAxis; n.setComponent(a,-Math.sign(dir.getComponent(a))||1); return n; }
function pbLand(f,at,dir,onPlayer,bounced){
  scene.remove(f.m); if(!onPlayer&&!bounced){ const nrm=surfNormal(dir); addSplat(at,nrm,f.side,G.mode==='paint'?1.5:1); if(f.local&&nrm.y>0.7) paintAt(at,0.75,f.side,true); sfxAt('splat',at); return; }
  if(bounced){ sfxAt('pok',at); const m=f.m; m.remove(f.tr); scene.add(m); m.position.copy(at); const v=dir.clone().multiplyScalar(-3); v.y=1.5+Math.random(); falling.push({m,v,spin:new THREE.Vector3(0,0,0)}); return; }
  if(onPlayer){ sfxAt('splatP',at); paintAvatarAt(at,f.side); return; }
  const nrm=surfNormal(dir); addSplat(at,nrm,f.side,1); sfxAt('splat',at);
}
function landDart(f,at,dir,onPlayer,paneId){ if(PB) return pbLand(f,at,dir,onPlayer,false);
  scene.remove(f.m); f.m.remove(f.tr); scene.add(f.m);
  if(onPlayer){ sfxAt('thwap',at); f.m.position.copy(at); const v=dir.clone().multiplyScalar(-2.5); v.y=2; falling.push({m:f.m,v,spin:new THREE.Vector3(Math.random()*12,Math.random()*12,0)}); }
  else { f.m.position.copy(at).addScaledVector(dir,0.03); _look.copy(f.m.position).sub(dir); f.m.lookAt(_look); f.m.userData.wob={t:0,base:f.m.quaternion.clone()}; f.m.userData.pane=paneId; stuck.push(f.m); if(paneId===undefined) sfxAt('plop',at); if(stuck.length>160) scene.remove(stuck.shift()); }
}
function stepProj(f,dt){
  const n=Math.max(1,Math.ceil(f.vel.length()*dt/0.6)), h=dt/n;
  for(let i=0;i<n;i++){
    _nx.copy(f.pos).addScaledVector(f.vel,h); _nx.y-=0.5*GRAV*h*h;
    _seg.copy(_nx).sub(f.pos); const len=_seg.length(); if(len<1e-6) continue; const dir=_seg.clone().divideScalar(len);
    let tw=rayWorld(f.pos,dir,len+0.01);
    if(f.pos.y>0&&_nx.y<=0){ const tg=len*f.pos.y/(f.pos.y-_nx.y); if(tg<tw){ tw=tg; rwBox=null; rwAxis=1; } }
    let r=null;
    if(f.local){ if(mode==='net'&&enemy.E.alive){ r=rayPlayer(f.pos,dir,enemy.E); if(r&&(r.t>len||r.t>=tw)) r=null; } }
    else if(P.alive){ r=rayPlayer(f.pos,dir,{x:P.x,feet:P.feet,z:P.z,crouch:P.crouch}); if(r&&(r.t>len||r.t>=tw)) r=null; }
    if(r){ const at=f.pos.clone().addScaledVector(dir,r.t);
      if(PB){ const w=WEAPONS[f.w]; const bnc=f.local&&Math.random()<(w.bounce||0);
        if(f.local&&!bnc){ const dmg=G.mode==='oneshot'&&mode==='net'?999:w.dmg[r.zone]; net.send('hit',{dmg,zone:r.zone,w:f.w}); hitMarker(r.zone==='head'); sfx(r.zone==='head'?'head':'hit'); }
        pbLand(f,at,dir,true,bnc); return false; }
      if(f.local){ const w=WEAPONS[f.w]; let dmg=w.dmg[r.zone]; const [f0,f1,m]=w.fall, d=f.dist+r.t; if(d>f0) dmg*=1-(1-m)*Math.min(1,(d-f0)/(f1-f0));
        dmg=G.mode==='oneshot'&&mode==='net'?999:Math.round(dmg); net.send('hit',{dmg,zone:r.zone,w:f.w}); hitMarker(r.zone==='head'); sfx(r.zone==='head'?'head':'hit'); }
      landDart(f,at,dir,true); return false; }
    if(tw<=len){ const at=f.pos.clone().addScaledVector(dir,tw), hb=rwBox;
      if(!PB&&hb&&hb.pane!==undefined){ const pn=panes[hb.pane];
        if(f.local){ const w=WEAPONS[f.w]; const broke=paneHit(pn,w.dmg.body,at,dir); net.send('glass',{id:pn.id,a:at.toArray().map(v=>+v.toFixed(2)),d:dir.toArray().map(v=>+v.toFixed(2)),b:broke?1:0});
          if(broke){ f.pos.copy(at).addScaledVector(dir,0.05); f.dist+=tw; continue; } }
        else if(pn.broken){ f.pos.copy(at).addScaledVector(dir,0.05); continue; }
        sfxAt('tink',at); landDart(f,at,dir,false,pn.id); return false; }
      landDart(f,at,dir,false); return false; }
    f.pos.copy(_nx); f.vel.y-=GRAV*h; f.dist+=len;
    { const k=WEAPONS[f.w].drag||(PB?0.008:0.012), sp=f.vel.length(); f.vel.multiplyScalar(1/(1+k*sp*h)); }
  }
  f.life+=dt; if(f.life>MAXLIFE||f.pos.y<-10){ scene.remove(f.m); return false; }
  // rendu : le visuel part du canon puis rejoint la trajectoire réelle
  const k=Math.max(0,1-f.life/0.12); f.m.position.copy(f.pos).addScaledVector(f.off,k);
  _look.copy(f.m.position).sub(f.vel); f.m.lookAt(_look);
  f.tr.scale.z=Math.min(2.4,f.dist)/2.1;
  return true;
}
// ---------- peinture : décals instanciés (8 formes × 2 équipes) ----------
const splatTex=(()=>{ const c=document.createElement('canvas'); c.width=1024; c.height=512; const g=c.getContext('2d'); g.fillStyle='#fff';
  for(let i=0;i<8;i++){ const ox=(i%4)*256+128, oy=((i/4)|0)*256+118, r=rng(300+i);
    g.beginPath(); for(let k=0;k<=40;k++){ const a=k/40*Math.PI*2, rad=42+r()*22+(k%5===0?r()*30:0); const x=ox+Math.cos(a)*rad, y=oy+Math.sin(a)*rad*0.9; k?g.lineTo(x,y):g.moveTo(x,y); } g.closePath(); g.fill();
    for(let k=0;k<14;k++){ const a=r()*Math.PI*2, d=60+r()*55, s=3+r()*10; g.beginPath(); g.arc(ox+Math.cos(a)*d,oy+Math.sin(a)*d*0.9,s,0,7); g.fill(); }
    for(let k=0;k<6;k++){ const a=r()*Math.PI*2, d=40+r()*30, w=4+r()*7; const x=ox+Math.cos(a)*d*0.8; g.beginPath(); g.moveTo(x-w/2,oy+10); g.lineTo(x+w/2,oy+10); g.lineTo(x+w/2*0.6,oy+10+d*1.6); g.arc(x,oy+10+d*1.6,w*0.55,0,Math.PI); g.closePath(); g.fill(); }
    g.beginPath(); g.arc(ox,oy,46,0,7); g.fill(); }
  return new THREE.CanvasTexture(c); })();
const SPL={A:[],B:[]}, SPLCAP=110;
if(PB){ for(const s of ['A','B']) for(let i=0;i<8;i++){ const geo=new THREE.PlaneGeometry(1,1), uv=geo.attributes.uv, u0=(i%4)/4, v0=1-(((i/4)|0)+1)/2;
    for(let k=0;k<uv.count;k++) uv.setXY(k,u0+uv.getX(k)/4,v0+uv.getY(k)/2);
    const mat=new THREE.MeshStandardMaterial({color:COL[s],alphaMap:splatTex,transparent:true,depthWrite:false,roughness:.25,metalness:.05,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4});
    const im=new THREE.InstancedMesh(geo,mat,SPLCAP); im.count=0; im.frustumCulled=false; im.renderOrder=1; scene.add(im); SPL[s].push({im,n:0}); } }
const _bx=new THREE.Vector3(), _by=new THREE.Vector3(), _sm=new THREE.Matrix4(), UPV=new THREE.Vector3(0,1,0);
function addSplat(at,n,side,scale=1){ if(!PB) return; const pool=SPL[side][(Math.random()*8)|0]; const z=n.clone().normalize();
  if(Math.abs(z.y)>0.9){ const a=Math.random()*6.3; _bx.set(Math.cos(a),0,Math.sin(a)); } else _bx.crossVectors(UPV,z).normalize();
  _by.crossVectors(z,_bx); const s=(0.3+Math.random()*0.32)*scale;
  _sm.makeBasis(_bx.clone().multiplyScalar(s),_by.clone().multiplyScalar(s),z); _sm.setPosition(at.x+z.x*0.006,at.y+z.y*0.006,at.z+z.z*0.006);
  const i=pool.n%SPLCAP; pool.im.setMatrixAt(i,_sm); pool.n++; pool.im.count=Math.min(SPLCAP,pool.n); pool.im.instanceMatrix.needsUpdate=true; }
function clearSplats(){ for(const s of ['A','B']) for(const p of SPL[s]){ p.n=0; p.im.count=0; } }
const avSplatGeo=new THREE.CircleGeometry(0.07,10);
function paintAvatarAt(at,side){ const tgt=(enemy.mesh&&enemy.mesh.visible&&enemy.mesh.position.distanceTo(at)<2.5&&side===P.side)?enemy.mesh:null;
  if(tgt){ const m=new THREE.Mesh(avSplatGeo,new THREE.MeshStandardMaterial({color:COL[side],roughness:.3,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2})); const loc=tgt.worldToLocal(at.clone()); m.position.copy(loc); const out=new THREE.Vector3(loc.x,0,loc.z).normalize(); m.lookAt(loc.clone().add(out)); m.scale.set(1+Math.random(),1+Math.random(),1); tgt.add(m); (tgt.userData.splats||(tgt.userData.splats=[])).push(m); } }
function screenSplat(side){ const el=$('splatov'); if(!el) return; el.style.setProperty('--c',COL[side]); el.style.transform=`rotate(${Math.random()*360}deg) scale(${0.9+Math.random()*0.5})`; el.style.transition='none'; el.style.opacity=0.85; requestAnimationFrame(()=>{ el.style.transition='opacity 2.2s'; el.style.opacity=0; }); }

// ---------- mode territoire : grille du sol (cellules de 0,7 m sur 3 niveaux) ----------
const PGC=0.7, PGX0=-12*S, PGZ0=-12*S, PGNX=Math.ceil((159*S)/PGC), PGNZ=Math.ceil((78*S)/PGC), PGL=[0,4,7.6];
let PGRID=null, PGTOT=0, pendingPaint={A:[],B:[]}, paintFlushT=0;
function buildPaintGrid(){ if(PGRID) return; PGRID=new Uint8Array(PGNX*PGNZ*3).fill(255); PGTOT=0;
  for(let l=0;l<3;l++){ const L=PGL[l]; for(let i=0;i<PGNX;i++) for(let j=0;j<PGNZ;j++){ const x=PGX0+(i+.5)*PGC, z=PGZ0+(j+.5)*PGC; let top=-1;
      for(const b of near(x,z,0)) if(!b.broken&&x>=b.x0&&x<=b.x1&&z>=b.z0&&z<=b.z1&&b.y1<=L+0.45&&b.y1>top) top=b.y1;
      if(top>=0&&Math.abs(top-L)<0.06){ PGRID[(l*PGNX+i)*PGNZ+j]=0; PGTOT++; } } } }
function resetPaintGrid(){ if(!PGRID) return; for(let k=0;k<PGRID.length;k++) if(PGRID[k]!==255) PGRID[k]=0; pendingPaint={A:[],B:[]}; }
function paintAt(at,rad,side,send){ if(!PGRID||G.mode!=='paint'||G.phase!=='live') return; let l=-1; for(let k=0;k<3;k++) if(Math.abs(at.y-PGL[k])<0.35) l=k; if(l<0) return;
  const code=side==='A'?1:2, i0=Math.floor((at.x-rad-PGX0)/PGC), i1=Math.floor((at.x+rad-PGX0)/PGC), j0=Math.floor((at.z-rad-PGZ0)/PGC), j1=Math.floor((at.z+rad-PGZ0)/PGC);
  for(let i=Math.max(0,i0);i<=Math.min(PGNX-1,i1);i++) for(let j=Math.max(0,j0);j<=Math.min(PGNZ-1,j1);j++){ const x=PGX0+(i+.5)*PGC-at.x, z=PGZ0+(j+.5)*PGC-at.z; if(x*x+z*z>rad*rad) continue;
    const k=(l*PGNX+i)*PGNZ+j; if(PGRID[k]===255||PGRID[k]===code) continue; PGRID[k]=code; if(send) pendingPaint[side].push(k); } }
function applyPaint(side,cells){ if(!PGRID) return; const code=side==='A'?1:2; for(const k of cells) if(PGRID[k]!==255) PGRID[k]=code; }
function paintScore(){ let a=0,b=0; if(PGRID) for(let k=0;k<PGRID.length;k++){ if(PGRID[k]===1) a++; else if(PGRID[k]===2) b++; } const t=a+b; return [t?a/t*100:0,t?b/t*100:0,a*PGC*PGC,b*PGC*PGC]; }
// animation de fin de manche : caméra autour du perso + jauge
let paintAnim=null, selfAv=null;
function startPaintAnim(pA,pB,win){ if(!selfAv){ selfAv=makeAvatar(COL[P.side]); scene.add(selfAv); } selfAv.visible=true; selfAv.position.set(P.x,P.feet,P.z); selfAv.rotation.set(0,P.yaw,0);
  paintAnim={t:0,pA,pB,win}; $('paintres').style.display='flex'; $('prTitle').textContent='Territoire repeint…'; $('pA').textContent='0 %'; $('pB').textContent='0 %'; $('gA').style.width='0'; $('gB').style.width='0';
  $('gA').style.background=COL.A; $('gB').style.background=COL.B; vm.visible=false; setZoom(0); document.body.classList.add('anim'); }
function stopPaintAnim(){ paintAnim=null; $('paintres').style.display='none'; document.body.classList.remove('anim'); if(selfAv) selfAv.visible=false; }
function updPaintAnim(dt){ const a=paintAnim; if(!a) return; a.t+=dt; const k=Math.min(1,a.t/3), e=1-Math.pow(1-k,3);
  const va=a.pA*e, vb=a.pB*e, tot=Math.max(0.0001,a.pA+a.pB);
  $('pA').innerHTML=Math.round(va)+' %<small>'+Math.round((G.mA||0)*e)+' m²</small>'; $('pB').innerHTML=Math.round(vb)+' %<small>'+Math.round((G.mB||0)*e)+' m²</small>';
  $('gA').style.width=(a.pA/tot*100*e)+'%'; $('gB').style.width=(a.pB/tot*100*e)+'%';
  if(k>=1&&!a.done){ a.done=true; const me=a.win===P.side; $('prTitle').textContent=a.win?(me?'🏆 Manche gagnée !':'Manche perdue'):'Égalité !'; sfx(a.win?(me?'win':'lose'):'beep'); }
  const ang=P.yaw+Math.PI*0.75+a.t*0.35, R=2.4; selfAv.position.y=P.feet+(a.done&&a.win===P.side?Math.abs(Math.sin(a.t*6))*0.25:0); selfAv.rotation.y=P.yaw+(a.done&&a.win===P.side?a.t*2:0);
  camera.position.set(P.x+Math.sin(ang)*R,P.feet+1.55,P.z+Math.cos(ang)*R); camera.lookAt(P.x,P.feet+1.05,P.z); }

// ---------- grenades ----------
const nades=[], smokes=[], pellets=[];
const pelletGeo=new THREE.SphereGeometry(0.03,6,4), pelletMats=['#ff8a1f','#3ba0ff','#ffd23f','#2fb39a','#e4572e'].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:.6}));
const smokeTex=(()=>{ const c=document.createElement('canvas'); c.width=c.height=128; const g=c.getContext('2d'); const gr=g.createRadialGradient(64,64,0,64,64,64);
  gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(.5,'rgba(255,255,255,.55)'); gr.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=gr; g.fillRect(0,0,128,128);
  const r=rng(5); for(let i=0;i<40;i++){ g.fillStyle=`rgba(0,0,0,${r()*.06})`; g.beginPath(); g.arc(30+r()*68,30+r()*68,8+r()*14,0,7); g.fill(); } return new THREE.CanvasTexture(c); })();
let nadeSeq=0;
function quickNade(){ for(const k of ['he','flash','smoke']) if(P.nades[k]>0){ selectNade(k); return; } }
function selectNade(k){ if(!P.alive||!P.nades[k]) return; if(P.cur!==3) P.prev=P.cur; P.inv[3]={w:k,ammo:P.nades[k],res:0}; P.cur=3; P.deployT=0.3; P.reloadT=0; setZoom(0); showVM(); }
function throwNade(power){ const k=SLOT().w; if(!P.alive||P.deployT>0||P.cool>0||shopOpen||!P.nades[k]) return; if(mode==='net'&&G.phase!=='live') return;
  const dir=new THREE.Vector3(); camera.getWorldDirection(dir); const o=camera.getWorldPosition(new THREE.Vector3()).addScaledVector(dir,0.45); o.y-=0.12;
  const v=dir.clone().multiplyScalar(power*17); v.y+=2.2*power+0.8; v.x+=velX*0.6; v.z+=velZ*0.6;
  const id=(P.side==='A'?1:2)*100000+(++nadeSeq);
  spawnNade(k,o,v,true,id); net.send('nade',{k,id,o:o.toArray().map(x=>+x.toFixed(3)),v:v.toArray().map(x=>+x.toFixed(3))}); sfx('throw',0.7);
  P.nades[k]--; P.cool=0.4; if(P.nades[k]>0){ P.inv[3].ammo=P.nades[k]; P.deployT=0.6; } else { P.cur=P.inv[P.prev]?P.prev:2; P.deployT=0.45; } showVM(); }
function spawnNade(k,o,v,local,id){ const m=gunModel(k); m.traverse(x=>{ if(x.isMesh) x.castShadow=true; }); m.scale.setScalar(1.3); m.position.copy(o); scene.add(m);
  nades.push({k,id,pos:o.clone(),vel:v.clone(),t:0,fuse:{he:1.7,flash:1.5,smoke:2.6}[k],mesh:m,local,settled:false,done:false,bt:0}); }
function stepNade(n,dt){
  const N=Math.max(1,Math.ceil(n.vel.length()*dt/0.15)), h=dt/N;
  for(let i=0;i<N&&!n.settled;i++){
    n.vel.y-=9.8*h; const step=n.vel.clone().multiplyScalar(h), len=step.length(); if(len<1e-6) continue; const dir=step.clone().divideScalar(len);
    const tw=rayWorld(n.pos,dir,len+0.06);
    if(tw<=len+0.05){ const hb=rwBox, ax=rwAxis;
      if(hb&&hb.pane!==undefined&&n.local&&n.vel.length()>5){ const pn=panes[hb.pane]; const at=n.pos.clone().addScaledVector(dir,tw); if(paneHit(pn,999,at,dir)){ net.send('glass',{id:pn.id,a:at.toArray().map(v=>+v.toFixed(2)),d:dir.toArray().map(v=>+v.toFixed(2)),b:1}); n.pos.addScaledVector(step,1); continue; } }
      n.pos.addScaledVector(dir,Math.max(0,tw-0.06));
      const sp=n.vel.length(); if(sp>1.5&&n.bt<=0){ sfxAt('bounce',n.pos,Math.min(1,sp/8)); n.bt=0.08; }
      if(ax===0){ n.vel.x*=-0.45; n.vel.y*=0.8; n.vel.z*=0.8; } else if(ax===2){ n.vel.z*=-0.45; n.vel.y*=0.8; n.vel.x*=0.8; }
      else { n.vel.y*=-0.35; n.vel.x*=0.7; n.vel.z*=0.7; if(Math.abs(n.vel.y)<0.8&&dir.y<0){ n.vel.y=0; if(Math.hypot(n.vel.x,n.vel.z)<0.25) n.settled=true; } }
    } else n.pos.add(step);
    const fl=floorAt(n.pos.x,n.pos.z,n.pos.y); if(n.pos.y<fl+0.06){ n.pos.y=fl+0.06; if(n.vel.y<0) n.vel.y=0; n.vel.x*=(1-3*h); n.vel.z*=(1-3*h); if(Math.hypot(n.vel.x,n.vel.z)<0.2) n.settled=true; }
  }
  n.bt-=dt; n.t+=dt; n.mesh.position.copy(n.pos); if(!n.settled){ n.mesh.rotation.x+=dt*9; n.mesh.rotation.z+=dt*5; }
  const ready=n.k==='smoke'?(n.settled&&n.t>0.8)||n.t>n.fuse+1.5:n.t>=n.fuse;
  if(n.local&&ready){ n.done=true; scene.remove(n.mesh); const p=n.pos.toArray().map(x=>+x.toFixed(2)); net.send('boom',{id:n.id,k:n.k,p}); explode(n.k,n.pos.clone(),true); }
  else if(!n.local&&n.t>n.fuse+3){ n.done=true; scene.remove(n.mesh); }
}
function losClear(a0,b){ const a=a0.clone(); a.y+=0.25; const d=b.clone().sub(a), L=d.length(); if(L<0.05) return true; d.divideScalar(L); return rayWorld(a,d,L)>=L-0.25; }
function explode(k,p,local){
  if(k==='he'){ sfxAt('boom',p,1.6); const L=new THREE.PointLight('#ffd9a0',14,14); L.position.copy(p); scene.add(L); setTimeout(()=>scene.remove(L),140); spawnPuff(p); spawnPuff(p.clone().add(new THREE.Vector3(0,.3,0)));
    if(PB){ const side=local?P.side:enemy.side; for(let i=0;i<46;i++){ const d=new THREE.Vector3(Math.random()-.5,(Math.random()-.25)*0.9,Math.random()-.5).normalize(); const t=rayWorld(p,d,4.5); if(t<4.5) addSplat(p.clone().addScaledVector(d,t),surfNormal(d),side,1.4+Math.random()); }
      const gp=new THREE.Vector3(p.x,floorAt(p.x,p.z,p.y+0.2)+0.002,p.z); addSplat(gp,new THREE.Vector3(0,1,0),side,4.5); if(local) paintAt(gp,3.0,side,true); }
    else for(let i=0;i<70;i++){ const m=new THREE.Mesh(pelletGeo,pelletMats[i%5]); m.position.copy(p); scene.add(m); const v=new THREE.Vector3(Math.random()-.5,Math.random()*0.8,Math.random()-.5).normalize().multiplyScalar(5+Math.random()*9); pellets.push({m,v,t:0,rest:false}); }
    if(local){ const R=6;
      if(mode==='net'&&enemy.E.alive){ const c=new THREE.Vector3(enemy.E.x,enemy.E.feet+(enemy.E.crouch?0.7:1.0),enemy.E.z), d=c.distanceTo(p);
        if(d<R&&losClear(p,c)){ let dmg=Math.round(98*Math.pow(1-d/R,1.3)); if(G.mode==='oneshot'&&dmg>=20) dmg=999; if(dmg>0){ net.send('hit',{dmg,zone:'body',w:'he'}); hitMarker(false); sfx('hit'); } } }
      const me=new THREE.Vector3(P.x,P.feet+(P.crouch?0.7:1.0),P.z), dm=me.distanceTo(p);
      if(P.alive&&G.mode!=='paint'&&dm<R&&losClear(p,me)&&(mode==='solo'||G.phase==='live')){ const dmg=Math.round(98*Math.pow(1-dm/R,1.3)); P.hp=Math.max(0,P.hp-dmg); hurtFx(); if(P.hp<=0&&mode==='net') die('he','body'); if(P.hp<=0&&mode==='solo'){ P.hp=100; } }
      if(!PB) for(const pn of panes){ if(pn.broken) continue; const c=new THREE.Vector3((pn.x0+pn.x1)/2,(pn.y0+pn.y1)/2,(pn.z0+pn.z1)/2); if(c.distanceTo(p)<3.2){ const dir=c.clone().sub(p).normalize(); breakPane(pn,c,dir); net.send('glass',{id:pn.id,a:c.toArray().map(v=>+v.toFixed(2)),d:dir.toArray().map(v=>+v.toFixed(2)),b:1}); } } } }
  if(k==='flash'){ sfxAt('flashbang',p,1.5); const L=new THREE.PointLight('#ffffff',40,30); L.position.copy(p); scene.add(L); setTimeout(()=>scene.remove(L),120);
    const cam=camera.getWorldPosition(new THREE.Vector3()), d=cam.distanceTo(p);
    if(P.alive&&d<32&&losClear(p,cam)){ const fwd=new THREE.Vector3(); camera.getWorldDirection(fwd); const f=fwd.dot(p.clone().sub(cam).normalize());
      let dur=f>0.55?4.2:f>0.05?2.4:0.7; dur*=Math.max(0.35,1-d/32); if(d<2) dur=Math.max(dur,2.2);
      if(dur>P.blind){ P.blind=dur; P.blindMax=dur; } if(dur>1.2){ sfx('ring',Math.min(1,dur/3)); if(MASTER){ MASTER.gain.cancelScheduledValues(AC.currentTime); MASTER.gain.setValueAtTime(VOL*0.25,AC.currentTime); MASTER.gain.linearRampToValueAtTime(VOL,AC.currentTime+dur); } } } }
  if(k==='smoke'){ sfxAt('hiss',p,1.2); const fl=floorAt(p.x,p.z,p.y+0.2); const grp=new THREE.Group(); scene.add(grp); const mat=new THREE.SpriteMaterial({map:smokeTex,color:'#cfd0cb',transparent:true,depthWrite:false,opacity:0.95});
    const parts=[]; for(let i=0;i<46;i++){ const sp=new THREE.Sprite(mat); const u=new THREE.Vector3(Math.random()-.5,Math.random()*0.7,Math.random()-.5).normalize(); const r=0.3+Math.pow(Math.random(),0.5);
      sp.userData={u,r,s:2.2+Math.random()*1.6,rot:Math.random()*6}; grp.add(sp); parts.push(sp); }
    smokes.push({grp,mat,parts,t:0,c:new THREE.Vector3(p.x,fl,p.z)}); }
}
function updNades(dt){
  for(let i=nades.length-1;i>=0;i--){ const n=nades[i]; if(!n.done) stepNade(n,dt); if(n.done) nades.splice(i,1); }
  for(let i=pellets.length-1;i>=0;i--){ const q=pellets[i]; q.t+=dt; if(!q.rest){ q.v.y-=9.8*dt; q.m.position.addScaledVector(q.v,dt); const fl=floorAt(q.m.position.x,q.m.position.z,q.m.position.y+0.1); if(q.m.position.y<fl+0.03){ q.m.position.y=fl+0.03; if(Math.abs(q.v.y)>2){ q.v.y*=-0.3; q.v.x*=0.5; q.v.z*=0.5; } else q.rest=true; } }
    if(q.t>20){ scene.remove(q.m); pellets.splice(i,1); } }
  for(let i=smokes.length-1;i>=0;i--){ const s=smokes[i]; s.t+=dt; const grow=Math.min(1,s.t/1.8), R=4.3*grow+0.4;
    for(const sp of s.parts){ const u=sp.userData; sp.position.set(s.c.x+u.u.x*R*u.r*1.2,s.c.y+0.9+u.u.y*R*u.r*0.8,s.c.z+u.u.z*R*u.r*1.2); sp.scale.setScalar(u.s*(0.5+grow*0.7)); sp.material.rotation=u.rot+s.t*0.05; }
    s.mat.opacity=0.95*Math.min(1,(16-s.t)/2.5); if(s.t>16){ scene.remove(s.grp); smokes.splice(i,1); } }
  if(P.blind>0||lastBlindOp>0){ P.blind=Math.max(0,P.blind-dt); const op=Math.min(1,P.blind/1.3); if(op!==lastBlindOp){ $('flashov').style.opacity=op; lastBlindOp=op; } } }
let lastBlindOp=0;
function clearNades(){ for(const n of nades) scene.remove(n.mesh); nades.length=0; for(const s of smokes) scene.remove(s.grp); smokes.length=0; for(const q of pellets) scene.remove(q.m); pellets.length=0; }

// ---------- vitres cassables ----------
const crackTex=(()=>{ const c=document.createElement('canvas'); c.width=c.height=256; const x=c.getContext('2d'); const r=rng(77);
  x.strokeStyle='rgba(255,255,255,.9)'; x.lineCap='round';
  for(let i=0;i<14;i++){ let a=i/14*Math.PI*2+r()*0.3, px=128, py=128; x.lineWidth=1.6; x.beginPath(); x.moveTo(px,py);
    for(let k=0;k<6;k++){ a+=(r()-.5)*0.5; px+=Math.cos(a)*(14+r()*10); py+=Math.sin(a)*(14+r()*10); x.lineTo(px,py); } x.stroke(); }
  for(let ring=1;ring<=3;ring++){ x.lineWidth=1; x.beginPath(); for(let i=0;i<=14;i++){ const a=i/14*Math.PI*2, rr=ring*26+r()*8; const px=128+Math.cos(a)*rr, py=128+Math.sin(a)*rr; i?x.lineTo(px,py):x.moveTo(px,py); } x.stroke(); }
  x.fillStyle='rgba(255,255,255,.8)'; x.beginPath(); x.arc(128,128,5,0,7); x.fill();
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t; })();
const crackMat=new THREE.MeshBasicMaterial({map:crackTex,transparent:true,depthWrite:false,side:THREE.DoubleSide,opacity:.85});
const crackGeo=new THREE.PlaneGeometry(0.55,0.55);
const shardGeo=(()=>{ const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0, .09,.02,0, .03,.11,0],3)); g.computeVertexNormals(); return g; })();
const shardMat=new THREE.MeshStandardMaterial({color:'#d8ecf5',roughness:.05,metalness:.2,transparent:true,opacity:.75,side:THREE.DoubleSide,depthWrite:false});
const cracks=[], shards=[];
function addCrack(pn,at){ const m=new THREE.Mesh(crackGeo,crackMat); m.position.copy(at); if(pn.nAxis==='x') m.rotation.y=Math.PI/2; m.rotation.z=Math.random()*6; m.renderOrder=3;
  if(pn.nAxis==='x') m.position.x=(pn.x0+pn.x1)/2; else m.position.z=(pn.z0+pn.z1)/2;
  m.scale.setScalar(0.7+Math.random()*0.6); m.userData.pane=pn.id; scene.add(m); cracks.push(m); }
function paneHit(pn,dmg,at,dir){ if(pn.broken) return false; pn.hp-=dmg; if(pn.hp<=0){ breakPane(pn,at,dir); return true; } addCrack(pn,at); sfxAt('crack',at); return false; }
function breakPane(pn,at,dir){ if(pn.broken) return; pn.broken=true; for(const b of pn.boxes) b.broken=true;
  const pos=GLASS.mesh.geometry.attributes.position, a=pos.array; for(let i=pn.start*3;i<(pn.start+pn.count)*3;i++) a[i]=0; pos.needsUpdate=true;
  for(let i=cracks.length-1;i>=0;i--) if(cracks[i].userData.pane===pn.id){ scene.remove(cracks[i]); cracks.splice(i,1); }
  for(let i=stuck.length-1;i>=0;i--){ const m=stuck[i]; if(m.userData.pane===pn.id){ stuck.splice(i,1); falling.push({m,v:new THREE.Vector3(0,0,0),spin:new THREE.Vector3(4,2,0)}); } }
  const w=pn.nAxis==='x'?(pn.z1-pn.z0):(pn.x1-pn.x0), h=pn.y1-pn.y0, n=Math.min(70,Math.round(12+w*h*5));
  const c=new THREE.Vector3((pn.x0+pn.x1)/2,(pn.y0+pn.y1)/2,(pn.z0+pn.z1)/2);
  for(let i=0;i<n;i++){ const m=new THREE.Mesh(shardGeo,shardMat); const u=(Math.random()-.5)*w, v=(Math.random()-.5)*h;
    m.position.set(pn.nAxis==='x'?c.x:c.x+u, c.y+v, pn.nAxis==='x'?c.z+u:c.z); m.rotation.set(Math.random()*6,Math.random()*6,Math.random()*6); m.scale.setScalar(0.6+Math.random()*1.6);
    const near=at?Math.max(0.2,1.5-at.distanceTo(m.position)):0.5; const vel=dir?new THREE.Vector3(dir[0]??dir.x,dir[1]??dir.y,dir[2]??dir.z).multiplyScalar(2.5*near):new THREE.Vector3();
    vel.x+=(Math.random()-.5)*1.2; vel.z+=(Math.random()-.5)*1.2; vel.y+=Math.random()*1.2;
    scene.add(m); shards.push({m,v:vel,s:new THREE.Vector3(Math.random()*10,Math.random()*10,0),t:0,rest:false}); }
  sfxAt('shatter',at||c,1.3);
}
function updShards(dt){ for(let i=shards.length-1;i>=0;i--){ const s=shards[i]; s.t+=dt;
    if(!s.rest){ s.v.y-=9.8*dt; s.m.position.addScaledVector(s.v,dt); s.m.rotation.x+=s.s.x*dt; s.m.rotation.y+=s.s.y*dt;
      const fl=floorAt(s.m.position.x,s.m.position.z,s.m.position.y+0.05); if(s.m.position.y<=fl+0.01){ s.m.position.y=fl+0.01; s.m.rotation.set(-Math.PI/2,0,Math.random()*6); s.rest=true; if(Math.random()<.25) sfxAt('tink',s.m.position,0.4); } }
    if(s.t>25){ scene.remove(s.m); shards.splice(i,1); } } }
function resetGlass(){ if(!GLASS.mesh) return; let any=false; for(const pn of panes){ pn.hp=pn.hp0; if(pn.broken){ pn.broken=false; any=true; for(const b of pn.boxes) b.broken=false; } }
  if(any){ GLASS.mesh.geometry.attributes.position.array.set(GLASS.orig); GLASS.mesh.geometry.attributes.position.needsUpdate=true; }
  for(const m of cracks) scene.remove(m); cracks.length=0; for(const s of shards) scene.remove(s.m); shards.length=0; }
function spawnPuff(p){ const m=new THREE.Mesh(puffGeo,puffMat.clone()); m.position.copy(p); scene.add(m); puffs.push({m,t:0}); }
function updDarts(dt){
  for(let i=flying.length-1;i>=0;i--){ if(!stepProj(flying[i],dt)) flying.splice(i,1); }
  for(const m of stuck){ const w=m.userData.wob; if(w&&w.t<0.45){ w.t+=dt; const a=Math.sin(w.t*45)*0.12*Math.exp(-w.t*9); m.quaternion.copy(w.base); m.rotateX(a); } }
  for(let i=falling.length-1;i>=0;i--){ const f=falling[i]; f.v.y-=9.8*dt; f.m.position.addScaledVector(f.v,dt); f.m.rotation.x+=f.spin.x*dt; f.m.rotation.y+=f.spin.y*dt;
    const fl=floorAt(f.m.position.x,f.m.position.z,f.m.position.y); if(f.m.position.y<=fl+0.03){ f.m.position.y=fl+0.03; f.m.rotation.x=Math.PI/2; falling.splice(i,1); stuck.push(f.m); } }
  for(let i=puffs.length-1;i>=0;i--){ const p=puffs[i]; p.t+=dt; p.m.scale.setScalar(1+p.t*14); p.m.material.opacity=0.35*(1-p.t/0.25); if(p.t>0.25){ scene.remove(p.m); puffs.splice(i,1); } }
}
function clearDarts(){ for(const m of stuck) scene.remove(m); stuck.length=0; for(const f of flying) scene.remove(f.m); flying.length=0; for(const f of falling) scene.remove(f.m); falling.length=0; resetGlass(); }

// ---------- audio : air comprimé, ventouses, pas ----------
let AC=null, NB=null;
let MASTER=null, REV=null, VOL=0.8; try{ const v=localStorage.getItem('vol'); if(v!==null) VOL=+v; }catch(_){}
function makeIR(sec){ const n=AC.sampleRate*sec, b=AC.createBuffer(2,n,AC.sampleRate); for(let c=0;c<2;c++){ const d=b.getChannelData(c); for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/n,3.2)*(i<AC.sampleRate*0.01?i/(AC.sampleRate*0.01):1); } return b; }
function audio(){ if(!AC){ try{ AC=new (window.AudioContext||window.webkitAudioContext)(); NB=AC.createBuffer(1,AC.sampleRate,AC.sampleRate); const d=NB.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
    MASTER=AC.createGain(); MASTER.gain.value=VOL; const comp=AC.createDynamicsCompressor(); comp.threshold.value=-10; comp.ratio.value=4; MASTER.connect(comp); comp.connect(AC.destination);
    const conv=AC.createConvolver(); conv.buffer=makeIR(1.8); REV=AC.createGain(); REV.gain.value=0.15; REV.connect(conv); conv.connect(MASTER); }catch(_){} } if(AC&&AC.state==='suspended') AC.resume(); }
function setReverb(w){ if(REV) REV.gain.setTargetAtTime(w,AC.currentTime,0.3); }
function out(vol,pan,muffle){ const g=AC.createGain(); g.gain.value=vol; let n=g;
  if(muffle){ const lp=AC.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=750; g.connect(lp); n=lp; }
  if(AC.createStereoPanner){ const p=AC.createStereoPanner(); p.pan.value=pan||0; n.connect(p); p.connect(MASTER); } else n.connect(MASTER);
  if(REV) n.connect(REV); return g; }
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
  step_lino:(d,t)=>{ noise(d,t,.07,'lowpass',380+Math.random()*120,.8,.004,.7); noise(d,t,.03,'bandpass',1300,2,.002,.18); if(Math.random()<.12) tone(d,t+.02,'sine',1900+Math.random()*500,2300,.05,.05); },
  step_tile:(d,t)=>{ noise(d,t,.05,'lowpass',450,.8,.003,.55); noise(d,t,.022,'bandpass',3200+Math.random()*600,3,.001,.45); },
  step_stone:(d,t)=>{ noise(d,t,.06,'lowpass',420,.8,.004,.5); noise(d,t,.1,'bandpass',1900+Math.random()*500,.7,.004,.32); },
  step_grass:(d,t)=>{ noise(d,t,.12,'highpass',1600+Math.random()*600,.6,.01,.22); noise(d,t,.06,'lowpass',260,.8,.006,.25); },
  tink:(d,t)=>{ tone(d,t,'sine',3200+Math.random()*1800,3000,.08,.18); noise(d,t,.02,'highpass',5000,.7,.001,.2); },
  crack:(d,t)=>{ noise(d,t,.05,'highpass',2500,.7,.001,.7); tone(d,t,'sine',2600,1800,.06,.2); noise(d,t+.01,.12,'bandpass',4200,4,.002,.2); },
  shatter:(d,t)=>{ noise(d,t,.35,'highpass',2200,.6,.002,1.1); noise(d,t,.12,'lowpass',500,.8,.002,.6);
    for(let i=0;i<18;i++){ const tt=t+0.02+Math.random()*0.7; tone(d,tt,'sine',2500+Math.random()*4500,2400,.05+Math.random()*.07,.12+Math.random()*.12); } },
  throw:(d,t)=>{ noise(d,t,.18,'bandpass',900,.8,.02,.35); },
  bounce:(d,t)=>{ tone(d,t,'sine',420+Math.random()*120,200,.05,.3); noise(d,t,.02,'bandpass',1800,2,.001,.2); },
  boom:(d,t)=>{ noise(d,t,.6,'lowpass',900,.7,.003,1.6); tone(d,t,'sine',70,28,.45,1.2); noise(d,t,.08,'highpass',3000,.7,.001,.6);
    for(let i=0;i<26;i++) noise(d,t+0.08+Math.random()*0.9,.02,'bandpass',2200+Math.random()*2000,3,.001,.12+Math.random()*.1); },
  flashbang:(d,t)=>{ noise(d,t,.25,'highpass',1500,.6,.002,1.4); tone(d,t,'sine',90,40,.25,.8); },
  ring:(d,t)=>{ tone(d,t,'sine',3600,3500,3.2,.22); tone(d,t,'sine',3620,3600,3.2,.1); },
  hiss:(d,t)=>{ noise(d,t,2.2,'highpass',1200,.4,.05,.45); noise(d,t,1.2,'lowpass',400,.6,.05,.25); },
  pb_pistol:(d,t)=>{ noise(d,t,.07,'bandpass',1500,1,.002,.9); noise(d,t,.12,'highpass',4000,.5,.004,.25); tone(d,t,'sine',140,60,.05,.45); },
  pb_etha:(d,t)=>{ noise(d,t,.06,'bandpass',1300,1,.002,.8); noise(d,t,.09,'highpass',4500,.5,.003,.22); tone(d,t,'sine',130,55,.05,.4); },
  pb_amp:(d,t)=>{ for(let i=0;i<3;i++){ noise(d,t+i*.055,.05,'bandpass',1350,1,.002,.7); tone(d,t+i*.055,'sine',135,60,.04,.35); } noise(d,t,.2,'highpass',4500,.5,.004,.2); },
  pb_cs3:(d,t)=>{ noise(d,t,.05,'bandpass',1700,1.2,.002,.85); noise(d,t,.07,'highpass',5000,.6,.002,.25); tone(d,t,'sine',150,65,.04,.35); },
  pb_fs:(d,t)=>{ noise(d,t,.12,'bandpass',900,.8,.003,1.1); noise(d,t,.15,'highpass',3500,.5,.004,.3); tone(d,t,'sine',95,40,.1,.7); clack(d,t+.3,1600); },
  splat:(d,t)=>{ noise(d,t,.09,'lowpass',1900,.8,.002,.9); tone(d,t,'sine',320,110,.05,.35); noise(d,t+.02,.06,'bandpass',3000,2,.003,.15); },
  splatP:(d,t)=>{ noise(d,t,.1,'lowpass',1400,.8,.002,1.0); tone(d,t,'sine',260,90,.06,.4); },
  pok:(d,t)=>{ tone(d,t,'sine',950,620,.04,.35); },
  kill:(d,t)=>{ tone(d,t,'sine',1320,1320,.1,.25); tone(d,t+.09,'sine',1760,1760,.22,.25); },
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
function sfx(kind,vol=1){ if(!AC||!SND[kind]) return; SND[kind](out(vol,0,false),AC.currentTime); }
const _cv=new THREE.Vector3(), _cr=new THREE.Vector3();
function sfxAt(kind,pos,vol=1){ if(!AC||!SND[kind]) return; camera.getWorldPosition(_cv); const d=_cv.distanceTo(pos); if(d>90) return;
  _cr.set(1,0,0).applyQuaternion(camera.quaternion); const dir=pos.clone().sub(_cv); const dl=dir.length()||1; dir.divideScalar(dl); const pan=Math.max(-1,Math.min(1,dir.dot(_cr)))*0.8;
  const blocked=dl>1&&rayWorld(_cv,dir,dl-0.3)<dl-0.5;
  SND[kind](out(vol*Math.min(1,3.5/(1+d*0.45))*(blocked?0.45:1),pan,blocked),AC.currentTime); }
const SURF={linoG:'lino',linoG2:'lino',linoC:'lino',linoB:'lino',tiles:'tile',tilesK:'tile',mineral:'tile',pave:'stone',asph:'stone',conc:'stone',groen:'grass'};
function surfaceAt(x,z,feet){ let h=-1,m=null; for(const b of near(x,z,0)) if(!b.broken&&x>=b.x0&&x<=b.x1&&z>=b.z0&&z<=b.z1&&b.y1<=feet+STEP&&b.y1>h){ h=b.y1; m=b.m; } return SURF[m]||(h<=0.01&&!m?'grass':'lino'); }

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
  const id=(PB?'lyceepb-':'lycee-')+Math.random().toString(36).slice(2,8);
  status('Création de la partie…');
  const peer=net.peer=new Peer(id,peerOpts());
  peer.on('open',()=>{ showLink(location.origin+location.pathname+'#'+id); });
  peer.on('call',c=>onIncomingCall(c));
  peer.on('connection',c=>{ if(net.conns[c.label]&&net.conns[c.label].open){ c.on('open',()=>c.close()); return; } bindConn(c); });
  peer.on('error',e=>status('Erreur réseau : '+(e.type||e)));
  peer.on('disconnected',()=>{ try{peer.reconnect();}catch(_){} });
}
function joinGame(id){
  net.hostId=id; isHost=false; P.side='B'; enemy.side='A';
  if(id==='local'){ bindConn(new LocalConn('evt','B')); bindConn(new LocalConn('st','B')); status('Connexion (local)…'); return; }
  status('Connexion à la partie…');
  const peer=net.peer=new Peer(peerOpts());
  peer.on('open',()=>{ bindConn(peer.connect(id,{label:'evt',reliable:true,serialization:'json'})); bindConn(peer.connect(id,{label:'st',reliable:false,serialization:'json'})); });
  peer.on('error',e=>status(e.type==='peer-unavailable'?"Cette partie n'existe plus. Demande un nouveau lien.":'Erreur réseau : '+(e.type||e)));
  setTimeout(()=>{ if(!net.ready) status("La connexion prend du temps… (pare-feu ? réessaie ou demande un nouveau lien)"); },15000);
}
let peerReady=false, meReady=false;
function onConnected(){ net.ready=true; lsec('lJoin'); $('joinTitle').textContent=isHost?'Ton adversaire est connecté !':'Connecté à la partie !'; showJoinMode(); status(''); if(isHost) net.send('hello',{mode:G.mode}); enterBtn(); }
function onDisconnected(){ net.ready=false; G.phase='wait'; setMsg('Adversaire déconnecté','Recharge la page pour une nouvelle partie'); $('net').textContent='déconnecté'; if(enemy.mesh) enemy.mesh.visible=false; }
function enterBtn(){ const b=$('bEnter'); b.disabled=false; b.textContent='▶ Entrer dans le jeu'; b.onclick=()=>{ audio(); meReady=true; net.send('ready',{}); hideLobby(); mode='net'; if(G.mode==='paint') buildPaintGrid(); startVoice(); maybeStart(); }; }
function maybeStart(){ if(isHost&&meReady&&peerReady&&G.phase==='wait'){ G.sA=0; G.sB=0; G.n=0; startFreeze(); } }

function onData(d){
  switch(d.t){
    case 'ready': peerReady=true; maybeStart(); break;
    case 'hello': if(!isHost&&d.mode){ G.mode=d.mode; showJoinMode(); } break;
    case 's': enemy.buf.push({tm:performance.now(),x:d.x,feet:d.f,z:d.z,yaw:d.y,pitch:d.p,alive:d.a,w:d.w,c:d.c}); if(enemy.buf.length>30) enemy.buf.shift(); break;
    case 'shot': { const o=new THREE.Vector3().fromArray(d.o), mz=new THREE.Vector3().fromArray(d.m||d.o); const wp=WEAPONS[d.w]||WEAPONS.pistol;
      (d.v||[]).forEach(v=>spawnProj(o,new THREE.Vector3().fromArray(v),enemy.side,d.w,false,mz));
      spawnPuff(mz); sfxAt(wp.snd,mz,1.1); break; }
    case 'hit': if(G.mode==='paint'){ if(G.phase==='live'){ screenSplat(enemy.side); P.slowT=1.1; sfx('splatP',0.6); dmgDir(); } break; }
      if(P.alive&&G.phase==='live'){ P.hp=Math.max(0,P.hp-d.dmg); P.lastHitW=d.w; hurtFx(); dmgDir(); if(PB) screenSplat(enemy.side); if(P.hp<=0) die(d.w,d.zone); } break;
    case 'die': enemyDied(d); break;
    case 'paint': applyPaint(d.s,d.c); break;
    case 'nade': spawnNade(d.k,new THREE.Vector3().fromArray(d.o),new THREE.Vector3().fromArray(d.v),false,d.id); sfxAt('throw',new THREE.Vector3().fromArray(d.o),0.8); break;
    case 'boom': { const n=nades.find(x=>x.id===d.id); if(n){ scene.remove(n.mesh); n.done=true; } explode(d.k,new THREE.Vector3().fromArray(d.p),false); break; }
    case 'glass': { const pn=panes[d.id]; if(!pn) break; const at=new THREE.Vector3().fromArray(d.a);
      if(d.b){ pn.hp=0; breakPane(pn,at,d.d); } else if(!pn.broken){ pn.hp=Math.min(pn.hp,pn.hp0-1); addCrack(pn,at); sfxAt('crack',at); } break; }
    case 'g': applyRound(d); break;
    case 'ping': net.send('pong',{ts:d.ts}); break;
    case 'pong': net.rtt=performance.now()-d.ts; $('net').textContent='ping '+Math.round(net.rtt)+' ms'; break;
  }
}

// ---------- chat vocal de proximité (WebRTC + son 3D) ----------
const VOICE={on:true,ptt:true,vol:1,local:null,call:null,pending:null,src:null,panner:null,lp:null,gain:null,an:null,buf:null,occT:0,tx:false,rx:false};
try{ const v=localStorage.getItem('vOn'); if(v!==null) VOICE.on=v==='1'; const m=localStorage.getItem('vMode'); if(m) VOICE.ptt=m!=='open'; const vv=localStorage.getItem('vvol'); if(vv!==null) VOICE.vol=+vv; }catch(_){}
function silentStream(){ audio(); return AC.createMediaStreamDestination().stream; }
async function startVoice(){ if(!net.peer||params.has('local')) return; audio();
  if(VOICE.on&&!VOICE.local){ try{ VOICE.local=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}}); }catch(e){ VOICE.local=null; $('vStat').textContent="Micro indisponible ou refusé : tu entends ton adversaire, mais lui ne t'entend pas."; } }
  const stream=VOICE.local||silentStream(); gateMic();
  if(!isHost&&!VOICE.call&&net.hostId){ try{ bindCall(net.peer.call(net.hostId,stream)); }catch(e){ console.warn(e); } }
  if(isHost&&VOICE.pending){ VOICE.pending.answer(stream); bindCall(VOICE.pending); VOICE.pending=null; } }
function onIncomingCall(c){ if(meReady){ c.answer(VOICE.local||silentStream()); bindCall(c); } else VOICE.pending=c; }
function bindCall(c){ VOICE.call=c; c.on('stream',rs=>attachRemote(rs)); c.on('error',e=>console.warn('voix',e)); }
function attachRemote(rs){ audio(); try{ const el=new Audio(); el.srcObject=rs; el.muted=true; el.play().catch(()=>{}); VOICE.el=el;
    VOICE.src=AC.createMediaStreamSource(rs); VOICE.lp=AC.createBiquadFilter(); VOICE.lp.type='lowpass'; VOICE.lp.frequency.value=20000;
    VOICE.panner=new PannerNode(AC,{panningModel:'HRTF',distanceModel:'inverse',refDistance:2.5,maxDistance:90,rolloffFactor:1.2});
    VOICE.gain=AC.createGain(); VOICE.gain.gain.value=VOICE.on?VOICE.vol:0; VOICE.an=AC.createAnalyser(); VOICE.an.fftSize=512; VOICE.buf=new Uint8Array(512);
    VOICE.src.connect(VOICE.an); VOICE.src.connect(VOICE.lp); VOICE.lp.connect(VOICE.panner); VOICE.panner.connect(VOICE.gain); VOICE.gain.connect(MASTER); }catch(e){ console.warn('voix',e); } }
function gateMic(){ if(!VOICE.local) return; const on=VOICE.on&&mode==='net'&&(!VOICE.ptt||down('talk')); for(const t of VOICE.local.getAudioTracks()) t.enabled=on; VOICE.tx=on; }
const _lf=new THREE.Vector3();
function updVoice(dt){ gateMic(); if(!VOICE.panner||!AC) return; const L=AC.listener, c=camera.getWorldPosition(_cv); camera.getWorldDirection(_lf);
  if(L.positionX){ L.positionX.value=c.x; L.positionY.value=c.y; L.positionZ.value=c.z; L.forwardX.value=_lf.x; L.forwardY.value=_lf.y; L.forwardZ.value=_lf.z; L.upX.value=0; L.upY.value=1; L.upZ.value=0; }
  else { L.setPosition(c.x,c.y,c.z); L.setOrientation(_lf.x,_lf.y,_lf.z,0,1,0); }
  const E=enemy.E, hp=new THREE.Vector3(E.x,E.feet+1.5,E.z); if(VOICE.panner.positionX){ VOICE.panner.positionX.value=hp.x; VOICE.panner.positionY.value=hp.y; VOICE.panner.positionZ.value=hp.z; } else VOICE.panner.setPosition(hp.x,hp.y,hp.z);
  VOICE.occT-=dt; if(VOICE.occT<=0){ VOICE.occT=0.25; const clear=losClear(hp,c); VOICE.lp.frequency.setTargetAtTime(clear?20000:900,AC.currentTime,0.08); VOICE.gain.gain.setTargetAtTime(VOICE.on?VOICE.vol*(clear?1:0.6):0,AC.currentTime,0.08);
    VOICE.an.getByteTimeDomainData(VOICE.buf); let s=0; for(const v of VOICE.buf){ const d=(v-128)/128; s+=d*d; } VOICE.rx=Math.sqrt(s/VOICE.buf.length)>0.02; }
  const html=(VOICE.tx?'<span>🎙 tu parles</span>':'')+(VOICE.rx&&VOICE.on?'<span>🔊 adversaire</span>':''); if($('voice').innerHTML!==html) $('voice').innerHTML=html; }
function segInit(id,attr,val,set){ const box=$(id); const upd=v=>box.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset[attr]===v)); upd(val); box.querySelectorAll('button').forEach(b=>b.onclick=()=>{ upd(b.dataset[attr]); set(b.dataset[attr]); }); }
segInit('vOn','v',VOICE.on?'1':'0',v=>{ VOICE.on=v==='1'; try{ localStorage.setItem('vOn',v); }catch(_){} if(VOICE.gain) VOICE.gain.gain.value=VOICE.on?VOICE.vol:0; if(VOICE.on&&mode==='net'&&!VOICE.local) startVoice(); });
segInit('vMode','m',VOICE.ptt?'ptt':'open',m=>{ VOICE.ptt=m==='ptt'; try{ localStorage.setItem('vMode',m); }catch(_){} });

// ---------- manches (l'hôte arbitre) ----------
function now(){ return performance.now()/1000; }
function broadcastRound(){ if(!isHost) return; net.send('g',{phase:G.phase,n:G.n,sA:G.sA,sB:G.sB,rem:Math.max(0,G.deadline-now()),win:G.win||'',mode:G.mode,pA:G.pA,pB:G.pB,mA:G.mA||0,mB:G.mB||0}); }
function startFreeze(){ G.pA=0; G.pB=0; G.n++; G.phase='freeze'; G.deadline=now()+FREEZE; G.win=''; respawn(); broadcastRound(); }
function startLive(){ G.phase='live'; G.deadline=now()+(G.mode==='paint'?90:ROUND_TIME); liveStart=now(); broadcastRound(); sfx('go'); }
function endRound(winner){ if(G.phase!=='live') return; if(winner==='A')G.sA++; else if(winner==='B')G.sB++;
  G.win=winner; G.phase=(G.sA>=WIN||G.sB>=WIN)?'over':'end'; G.deadline=now()+(G.phase==='over'?8:END_TIME); broadcastRound(); roundFx(); }
let lastN=-1;
function applyRound(d){ const prev=G.phase; G.phase=d.phase; G.n=d.n; G.sA=d.sA; G.sB=d.sB; G.deadline=now()+d.rem; G.win=d.win; if(d.mode&&d.mode!==G.mode){ G.mode=d.mode; showJoinMode(); } G.pA=d.pA||0; G.pB=d.pB||0; G.mA=d.mA||0; G.mB=d.mB||0;
  if(G.mode==='paint'&&(d.phase==='end'||d.phase==='over')&&prev==='live') startPaintAnim(G.pA,G.pB,G.win);
  if(d.phase==='freeze'&&(prev!=='freeze'||lastN!==d.n)) respawn();
  if(d.phase==='live'&&prev==='freeze'){ liveStart=now(); sfx('go'); }
  lastN=d.n;
  if((d.phase==='end'||d.phase==='over')&&prev==='live') roundFx(); }
function roundFx(){ const me=G.win===P.side;
  if(G.win){ sfx(me?'win':'lose'); }
  if(me){ P.money+=3250; P.streak=0; } else if(G.win){ P.money+=1400+500*Math.min(P.streak,4); P.streak++; } else P.money+=1400;
  P.money=Math.min(16000,P.money); }
function flushPaint(){ for(const s of ['A','B']) if(pendingPaint[s].length){ net.send('paint',{s,c:pendingPaint[s]}); pendingPaint[s]=[]; } }
function hostTick(){
  if(!isHost||mode!=='net') return;
  const t=now();
  if(G.phase==='freeze'&&t>=G.deadline) startLive();
  else if(G.phase==='live'&&t>=G.deadline){ if(G.mode==='paint'){ flushPaint(); const [a,b,ma,mb]=paintScore(); G.pA=+a.toFixed(1); G.pB=+b.toFixed(1); G.mA=Math.round(ma); G.mB=Math.round(mb); const w=ma>mb?'A':mb>ma?'B':''; if(w==='A')G.sA++; else if(w==='B')G.sB++; G.win=w;
      G.phase=(G.sA>=WIN||G.sB>=WIN)?'over':'end'; G.deadline=t+(G.phase==='over'?10:8); broadcastRound(); roundFx(); startPaintAnim(G.pA,G.pB,w); }
    else { G.win=''; G.phase='end'; G.deadline=t+END_TIME; broadcastRound(); roundFx(); } }
  else if(G.phase==='end'&&t>=G.deadline) startFreeze();
  else if(G.phase==='over'&&t>=G.deadline){ G.sA=0; G.sB=0; G.n=0; startFreeze(); }
}
function respawn(){ const s=SPAWN[P.side]; P.x=s.x+(Math.random()-.5)*2; P.z=s.z+(Math.random()-.5)*2; P.feet=0; P.vy=0; P.yaw=s.yaw; P.pitch=0; P.hp=100; P.alive=true;
  stopPaintAnim(); P.slowT=0; if(G.mode==='paint'){ buildPaintGrid(); resetPaintGrid(); clearSplats(); }
  if(G.n<=1) clearSplats(); if(enemy.mesh&&enemy.mesh.userData.splats){ for(const m of enemy.mesh.userData.splats) enemy.mesh.remove(m); enemy.mesh.userData.splats=[]; }
  if(G.n<=1&&mode==='net'){ P.money=800; P.streak=0; P.inv[1]=null; P.nades={he:0,flash:0,smoke:0}; }
  if(P.cur===3) P.cur=2; P.blind=0; $('flashov').style.opacity=0; clearNades();
  P.inv[2]={w:'pistol',ammo:12,res:36}; if(P.inv[1]){ const w=WEAPONS[P.inv[1].w]; P.inv[1].ammo=w.mag; P.inv[1].res=w.res; }
  SLEEVE.color.set(COL[P.side]); P.crouch=false; P.cur=P.inv[1]?1:2; P.reloadT=0; P.cool=0; P.deployT=0; setZoom(0); showVM(); clearDarts(); closeShop(false); killfeed.length=0; drawFeed(); sfx('beep'); }
function die(w,zone){ P.alive=false; P.nades={he:0,flash:0,smoke:0}; if(P.cur===3) P.cur=2; setZoom(0); net.send('die',{w,zone}); addFeed(enemy.side,w,P.side,zone==='head'); P.inv[1]=null; P.cur=2; P.reloadT=0; try{ showVM(); }catch(_){} if(isHost) endRound(enemy.side); }
function enemyDied(d){ enemy.E.alive=false; sfx('kill'); const w=WEAPONS[d.w]?d.w:'pistol'; P.money=Math.min(16000,P.money+WEAPONS[w].reward); addFeed(P.side,w,enemy.side,d.zone==='head'); if(isHost) endRound(P.side); }

// ---------- boutique ----------
function canBuy(){ if(mode==='solo') return true; if(!P.alive) return false; if(G.phase==='freeze') return true;
  if(G.phase==='live'&&now()-liveStart<BUY_LIVE){ const s=SPAWN[P.side]; return Math.hypot(P.x-s.x,P.z-s.z)<30; } return false; }
let shopOpen=false;
function buildShop(){ const box=$('shopItems'); box.innerHTML='';
  SHOP.forEach((id,i)=>{ const w=WEAPONS[id]; const owned=w.isNade?P.nades[id]>=w.max:(P.inv[w.slot]&&P.inv[w.slot].w===id); const b=document.createElement('button'); b.className='item'+(P.money<w.price&&!owned?' poor':'')+(owned?' owned':'');
    b.innerHTML=`<span class="k">${i+1}</span><b>${w.name}</b><small>type ${w.cs}</small><span class="pr">${w.price?w.price+' €':'gratuit'}</span><span class="st">${w.isNade?w.info+' · '+P.nades[id]+'/'+w.max:w.dmg.body+' dégâts · '+w.mag+' coups'+(w.pellets>1?' × '+w.pellets:'')+' · prime '+w.reward+' €'}</span>`;
    b.onclick=()=>{ buy(id); }; box.appendChild(b); });
  $('shopMoney').textContent=P.money+' €'; }
function openShop(){ if(!canBuy()||shopOpen) return; shopOpen=true; buildShop(); $('shop').style.display='flex'; try{ document.exitPointerLock(); }catch(_){} }
function closeShop(relock=true){ if(!shopOpen) return; shopOpen=false; $('shop').style.display='none'; if(relock) lock(); }
function buy(id){ const w=WEAPONS[id]; if(!canBuy()) return closeShop();
  if(w.isNade){ if(P.nades[id]>=w.max||P.money<w.price){ sfx('empty'); return; } P.money-=w.price; P.nades[id]++; sfx('buy'); buildShop(); return; }
  if(P.inv[w.slot]&&P.inv[w.slot].w===id){ P.cur=w.slot; showVM(); closeShop(); return; }
  if(P.money<w.price){ sfx('empty'); return; }
  P.money-=w.price; P.inv[w.slot]={w:id,ammo:w.mag,res:w.res}; P.cur=w.slot; P.deployT=0.5; P.reloadT=0; setZoom(0); showVM(); sfx('buy'); closeShop(); }

// ---------- tir ----------
let recoil=0, mouseDown=false, velX=0, velZ=0;
const DIRV=new THREE.Vector3();
function fire(){
  if(W().isNade){ throwNade(1); return; }
  const w=W(), sl=SLOT();
  if(!P.alive||P.reloadT>0||P.cool>0||P.deployT>0||shopOpen) return;
  if(mode==='net'&&G.phase!=='live') return;
  if(sl.ammo<=0){ sfx('empty'); P.cool=0.25; startReload(); return; }
  sl.ammo--; P.cool=w.rate; recoil=1; flash.intensity=1.2;
  const spd=Math.hypot(velX,velZ);
  let spread=((w.zoom&&P.zoom?w.scoped:w.spread)+(spd>1.5?w.move*Math.min(1,spd/5):0)+(P.grounded?0:w.air))*(P.crouch&&P.grounded?0.6:1);
  if(w.spray) spread+=Math.min(0.03,P.spray*0.004);
  camera.getWorldDirection(DIRV);
  const o=camera.getWorldPosition(new THREE.Vector3()), muzzle=muzzleWorld();
  const vels=[];
  for(let p=0;p<w.pellets;p++){
    const d=DIRV.clone(); const sp=spread+(w.pelletSpread||0);
    d.x+=(Math.random()-.5)*2*sp; d.y+=(Math.random()-.5)*2*sp; d.z+=(Math.random()-.5)*2*sp; d.normalize();
    const v=d.multiplyScalar(w.speed); vels.push(v); spawnProj(o,v,P.side,sl.w,true,muzzle);
  }
  spawnPuff(muzzle); sfx(w.snd,0.8);
  const r2=a=>a.toArray().map(x=>+x.toFixed(3));
  net.send('shot',{w:sl.w,o:r2(o),m:r2(muzzle),v:vels.map(r2)});
  // recul
  P.spray++; const k=w.kick*(w.spray?Math.min(1.6,0.6+P.spray*0.12):1);
  P.pitch=Math.min(1.45,P.pitch+k+Math.random()*k*0.3); P.yaw+=(Math.random()-.5)*k*(w.spray&&P.spray>6?1.4:0.5);
  if(w.zoom&&P.zoom){ setTimeout(()=>{ if(P.alive&&SLOT().w==='awp'&&P.zoom) setZoom(0); },60); }
  if(w.snd==='spas'){ const pump=vmModels.spas.getObjectByName('pump'); if(pump){ pump.userData.t=0.5; } }
  if(sl.ammo===0) setTimeout(startReload,300);
}
function startReload(){ const sl=SLOT(), w=W(); if(P.reloadT>0||sl.ammo===w.mag||sl.res<=0||!P.alive) return; P.reloadT=w.reload; setZoom(0); sfx('reload'); }
function finishReload(){ const sl=SLOT(), w=W(); const need=w.mag-sl.ammo, take=Math.min(need,sl.res); sl.ammo+=take; sl.res-=take; sfx('reloadEnd'); }
function switchSlot(s){ if(!P.inv[s]||P.cur===s||!P.alive) return; if(s!==3&&P.cur!==3) P.prev=P.cur; P.cur=s; P.reloadT=0; P.deployT=0.45; setZoom(0); showVM(); }
function setZoom(z){ const w=WEAPONS[SLOT()?SLOT().w:'pistol']; P.zoom=z; const fov=z&&w.zoom?w.zoom[z-1]:BASEFOV; camera.fov=fov; camera.updateProjectionMatrix();
  $('scope').style.display=z?'block':'none'; vm.visible=!z&&P.alive; $('cross').style.display=z?'none':''; }
let hitT=0; function hitMarker(head){ const h=$('hitm'); h.classList.add('on'); h.querySelectorAll('i').forEach(i=>i.style.background=head?'#ff4b3a':'#fff'); hitT=0.15; }
function dmgDir(){ const E=enemy.E; const a=Math.atan2(-(E.x-P.x),-(E.z-P.z)); let rel=a-P.yaw; rel=Math.atan2(Math.sin(rel),Math.cos(rel));
  const el=$('dmgdir'); el.style.transform=`rotate(${-rel}rad)`; el.style.transition='none'; el.style.opacity=1; requestAnimationFrame(()=>{ el.style.transition='opacity 1.2s'; el.style.opacity=0; }); }
function hurtFx(){ $('dmg').style.transition='none'; $('dmg').style.opacity=1; requestAnimationFrame(()=>{ $('dmg').style.transition='opacity .6s'; $('dmg').style.opacity=0; }); sfx('hurt'); }

// ---------- fil des éliminations ----------
const killfeed=[];
function addFeed(k,w,v,head){ killfeed.push({k,w,v,head,t:now()}); if(killfeed.length>4) killfeed.shift(); drawFeed(); }
function drawFeed(){ $('feed').innerHTML=killfeed.map(f=>`<div><i style="background:${COL[f.k]}">${f.k===P.side?'Toi':'Adversaire'}</i> ${WEAPONS[f.w].name}${f.head?' 🎯':''} <i style="background:${COL[f.v]}">${f.v===P.side?'Toi':'Adversaire'}</i></div>`).join(''); }

// ---------- contrôles (touches réassignables) ----------
const keys={};
const ACTIONS=[['fwd','Avancer','KeyW'],['back','Reculer','KeyS'],['left','Aller à gauche','KeyA'],['right','Aller à droite','KeyD'],['jump','Sauter','Space'],['crouch',"S'accroupir",'KeyC'],
  ['sprint','Courir','ShiftLeft'],['reload','Recharger','KeyR'],['shop','Boutique','KeyB'],['w1','Arme principale','Digit1'],['w2','Pistolet','Digit2'],['he',PB?'Grenade de peinture':'Grenade','Digit3'],
  ['flash','Flash','Digit4'],['smoke','Fumigène','Digit5'],['quick','Grenade rapide','KeyG'],['talk','Parler (chat vocal)','KeyV']];
let BIND={}; ACTIONS.forEach(a=>BIND[a[0]]=a[2]); try{ Object.assign(BIND,JSON.parse(localStorage.getItem('binds')||'{}')); }catch(_){}
const down=a=>!!keys[BIND[a]];
let LAYOUT=null; try{ navigator.keyboard&&navigator.keyboard.getLayoutMap().then(m=>{ LAYOUT=m; renderBinds(); renderHints(); }).catch(()=>{}); }catch(_){}
const SPECIAL={Space:'Espace',ShiftLeft:'Maj',ShiftRight:'Maj D',ControlLeft:'Ctrl',ControlRight:'Ctrl D',AltLeft:'Alt',Tab:'Tab',CapsLock:'Verr Maj',Enter:'Entrée',Backspace:'Retour',ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→'};
function keyLabel(c){ if(!c) return '—'; if(SPECIAL[c]) return SPECIAL[c]; const l=LAYOUT&&LAYOUT.get(c); if(l) return l.toUpperCase(); return c.replace(/^Key/,'').replace(/^Digit/,'').replace(/^Numpad/,'Pavé '); }
let rebinding=null;
function renderBinds(){ const box=$('binds'); if(!box) return; box.innerHTML=''; for(const [id,name] of ACTIONS){ const r=document.createElement('div'); r.className='bind'; r.innerHTML=`<span>${name}</span>`; const b=document.createElement('button'); b.textContent=rebinding===id?'…':keyLabel(BIND[id]); if(rebinding===id) b.className='wait'; b.onclick=()=>{ rebinding=id; renderBinds(); }; r.appendChild(b); box.appendChild(r); } }
function saveBinds(){ try{ localStorage.setItem('binds',JSON.stringify(BIND)); }catch(_){} renderHints(); }
function renderHints(){ const k=a=>`<span class="kbd">${keyLabel(BIND[a])}</span>`;
  $('keysHint').innerHTML=`${k('fwd')}${k('left')}${k('back')}${k('right')} se déplacer · ${k('sprint')} courir · ${k('crouch')} accroupi · ${k('jump')} sauter<br>Clic gauche tirer · clic droit lunette/lob · ${k('reload')} recharger · ${k('shop')} boutique · ${k('talk')} parler`;
  $('buyHint').textContent=keyLabel(BIND.shop)+' : boutique'; }
$('bindReset').onclick=()=>{ ACTIONS.forEach(a=>BIND[a[0]]=a[2]); saveBinds(); renderBinds(); };
addEventListener('keydown',e=>{
  if(rebinding){ e.preventDefault(); if(e.code!=='Escape'){ for(const a in BIND) if(BIND[a]===e.code&&a!==rebinding) BIND[a]=''; BIND[rebinding]=e.code; saveBinds(); } rebinding=null; renderBinds(); return; }
  keys[e.code]=true;
  if(['Space','ArrowUp','ArrowDown','Tab'].includes(e.code)) e.preventDefault();
  if(mode==='lobby') return;
  if(e.code==='Escape'&&shopOpen){ closeShop(false); showPause(); return; }
  if(shopOpen&&/^Digit[1-8]$/.test(e.code)){ buy(SHOP[+e.code.slice(5)-1]); return; }
  if(e.code===BIND.shop){ shopOpen?closeShop():openShop(); return; }
  if(e.code===BIND.reload) startReload();
  if(e.code===BIND.w1) switchSlot(1); if(e.code===BIND.w2) switchSlot(2);
  if(e.code===BIND.he) selectNade('he'); if(e.code===BIND.flash) selectNade('flash'); if(e.code===BIND.smoke) selectNade('smoke'); if(e.code===BIND.quick) quickNade(); });
addEventListener('keyup',e=>{ keys[e.code]=false; });
addEventListener('blur',()=>{ for(const k in keys) keys[k]=false; mouseDown=false; });
addEventListener('wheel',e=>{ if(mode==='lobby'||shopOpen) return; switchSlot(P.cur===1?2:P.inv[1]?1:2); },{passive:true});
let locked=false;
let sens=1; try{ sens=+localStorage.getItem('sens')||1; }catch(_){}
const look=(dx,dy)=>{ const s=0.0022*sens*(camera.fov/BASEFOV); P.yaw-=dx*s; P.pitch=Math.max(-1.5,Math.min(1.5,P.pitch-dy*s)); };
function lock(){ const q=()=>{ try{ const r=canvas.requestPointerLock(); if(r&&r.catch) r.catch(()=>{}); }catch(_){} };
  try{ const p=canvas.requestPointerLock({unadjustedMovement:true}); if(p&&p.catch) p.catch(q); }catch(_){ q(); } }
function settingsOpen(){ return $('settings').style.display==='flex'; }
function showPause(){ if(mode==='lobby') return; $('pause').style.display='flex'; }
document.addEventListener('pointerlockchange',()=>{ locked=document.pointerLockElement===canvas; if(locked){ $('pause').style.display='none'; $('settings').style.display='none'; } else if(mode!=='lobby'&&!shopOpen&&!settingsOpen()) showPause(); if(!locked) mouseDown=false; });
function openSettings(tab){ $('settings').style.display='flex'; selectTab(tab||'jeu'); renderBinds(); }
function selectTab(t){ document.querySelectorAll('.tabs [data-tab]').forEach(b=>b.classList.toggle('on',b.dataset.tab===t)); for(const id of ['jeu','touches','son']) $('tab-'+id).hidden=id!==t; }
document.querySelectorAll('.tabs [data-tab]').forEach(b=>b.onclick=()=>selectTab(b.dataset.tab));
document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openSettings(b.dataset.open));
$('setClose').onclick=()=>{ $('settings').style.display='none'; rebinding=null; if(mode!=='lobby') showPause(); };
$('quit').onclick=()=>{ location.href=location.pathname+location.search; };
document.addEventListener('mousemove',e=>{ if(locked) look(e.movementX,e.movementY); });
canvas.addEventListener('mousedown',e=>{ if(!locked){ lock(); return; } if(e.button===0){ mouseDown=true; fire(); } if(e.button===2){ const w=W(); if(w.isNade){ throwNade(0.45); } else if(w.zoom){ setZoom((P.zoom+1)%3); sfx('scope'); } } });
canvas.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('mouseup',e=>{ if(e.button===0){ mouseDown=false; P.spray=0; } });

$('shopClose').onclick=()=>closeShop();


// ---------- lobby ----------
const MODES=PB?[['classic','Classique','2 billes au corps ou 1 à la tête · boutique et économie'],['oneshot','One-shot','une seule bille qui éclate = éliminé'],['paint','Territoire','pas de PV : repeins le plus de sol en 90 s, comme Splatoon']]
              :[['classic','Classique','PV et dégâts selon l\'arme · boutique et économie'],['oneshot','One-shot','une seule fléchette qui touche = éliminé']];
const MODENAME=Object.fromEntries(MODES.map(m=>[m[0],m[1]]));
let pickMode='classic'; try{ pickMode=localStorage.getItem('mode')||'classic'; }catch(_){} if(!MODENAME[pickMode]) pickMode='classic';
function renderModes(){ const box=$('modes'); box.innerHTML=''; for(const [id,name,desc] of MODES){ const b=document.createElement('button'); b.className='mode'+(id===pickMode?' on':''); b.innerHTML=`<b>${name}</b><span>${desc}</span>`; b.onclick=()=>{ pickMode=id; try{ localStorage.setItem('mode',id); }catch(_){} renderModes(); }; box.appendChild(b); } }
function lsec(id){ for(const s of ['lMain','lMode','lLink','lJoin']) $(s).hidden=s!==id; }
function status(t){ $('st').textContent=t; }
function showJoinMode(){ const t='Mode : '+(MODENAME[G.mode]||G.mode); $('joinMode').textContent=t; $('hostMode').textContent=t; }
function showLink(url){ lsec('lLink'); $('lnk').value=url; showJoinMode(); status(''); }
$('bCopy').onclick=()=>{ const i=$('lnk'); i.select(); const done=()=>$('bCopy').textContent='Copié ✓'; try{ navigator.clipboard.writeText(i.value).then(done).catch(()=>{ document.execCommand('copy'); done(); }); }catch(_){ document.execCommand('copy'); done(); } };
function hideLobby(){ $('lobby').style.display='none'; document.body.classList.remove('inlobby'); lock(); }
$('bHost').onclick=()=>{ audio(); renderModes(); lsec('lMode'); };
$('bBack').onclick=()=>lsec('lMain');
$('bCreate').onclick=()=>{ audio(); G.mode=pickMode; hostGame(); };
$('bSolo').onclick=()=>{ audio(); mode='solo'; P.side='A'; G.phase='live'; P.money=16000; respawn(); hideLobby(); $('score').style.display='none'; $('net').textContent='entraînement · '+keyLabel(BIND.shop)+' : boutique'; };
let attractT=0;
function attractCam(dt){ attractT+=dt; const cx=70*S, cz=24*S, R=150, a=attractT*0.045+2.2; camera.position.set(cx+Math.cos(a)*R,48+Math.sin(attractT*0.07)*8,cz+Math.sin(a)*R); camera.lookAt(cx,6,cz); }

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
  setReverb(!zn?0.05:zn.type==='preau'?0.42:zn.type==='circ'?0.3:zn.type==='self'||zn.type==='poly'?0.32:0.2);
  if(mode==='net'&&G.phase==='freeze'){ const r=Math.ceil(G.deadline-now()); if(r<=3&&r>=1&&r!==lastBeep){ lastBeep=r; sfx('beep'); } } else lastBeep=-1;
  $('lvl').textContent=['RDC','R+1','R+2'][lvl]; $('zone').textContent=zn?zn.name:'Extérieur';
  drawMap(lvl);
  $('hp').innerHTML=G.mode==='paint'&&mode==='net'?'🎨<small>territoire</small>':Math.ceil(P.hp)+'<small>PV</small>'; $('hp').style.color=P.hp<35?'#ff6b5a':'#fff';
  const sl=SLOT(), w=W();
  $('nades').innerHTML=NADES.map(k=>P.nades[k]?`<span>${{he:'💥',flash:'⚡',smoke:'☁️'}[k]}${P.nades[k]>1?'×'+P.nades[k]:''}<small>${{he:3,flash:4,smoke:5}[k]}</small></span>`:'').join('');
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
  const canMove=P.alive&&!shopOpen&&!paintAnim&&(mode==='solo'||(mode==='net'&&(G.phase==='live'||G.phase==='end'||G.phase==='over')));
  if(mode==='lobby'){ attractCam(dt); return; }
  let f=(down('fwd')||keys.ArrowUp?1:0)-(down('back')||keys.ArrowDown?1:0), s=(down('right')||keys.ArrowRight?1:0)-(down('left')||keys.ArrowLeft?1:0);
  if(!canMove){ f=0; s=0; }
  const fx=-Math.sin(P.yaw), fz=-Math.cos(P.yaw), rx=Math.cos(P.yaw), rz=-Math.sin(P.yaw);
  // accroupi (C) : impossible de se relever sous un plafond bas
  const wantC=down('crouch')&&P.alive;
  if(wantC) P.crouch=true; else if(P.crouch&&ceilAt(P.x,P.z,P.feet)>=P.feet+H_STAND) P.crouch=false;
  HEIGHT=P.crouch?H_CROUCH:H_STAND;
  const m=Math.hypot(f,s)||1, heavy=W().snd==='awp'?0.9:1, sp=(P.crouch?2.0:down('sprint')?6.2:4.4)*heavy*(P.zoom?0.5:1)*(P.slowT>0?0.45:1);
  const tx=(fx*f+rx*s)/m*sp*(f||s?1:0), tz=(fz*f+rz*s)/m*sp*(f||s?1:0);
  const acc=P.grounded?14:3; velX+=(tx-velX)*Math.min(1,acc*dt); velZ+=(tz-velZ)*Math.min(1,acc*dt);
  const steps=Math.ceil(Math.hypot(velX,velZ)*dt/0.1)||1;
  for(let i=0;i<steps;i++){ P.x+=velX*dt/steps; P.z+=velZ*dt/steps; collide(); }
  if(down('jump')&&P.grounded&&canMove){ P.vy=5.6; P.grounded=false; }
  const fl=floorAt(P.x,P.z,P.feet);
  P.vy-=20*dt; let nf=P.feet+P.vy*dt;
  if(P.vy>0){ const c=ceilAt(P.x,P.z,P.feet); if(nf+HEIGHT>c){ nf=c-HEIGHT; P.vy=0; } }
  if(nf<=fl){ if(!P.grounded&&P.vy<-4) sfx('step_'+surfaceAt(P.x,P.z,fl),0.6); nf=fl; P.vy=0; P.grounded=true; } else P.grounded=nf-fl<0.05;
  P.feet=nf;
  const spd=Math.hypot(velX,velZ);
  if(P.grounded&&spd>2.5&&!P.crouch){ stepAcc+=dt*spd; if(stepAcc>(spd>5?2.2:1.8)){ stepAcc=0; sfx('step_'+surfaceAt(P.x,P.z,P.feet),0.16*Math.min(1.4,spd/4.4)); } }
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
  P.eyeH+=((P.crouch?EYE_C:EYE)-P.eyeH)*Math.min(1,dt*14); const eye=P.alive?P.eyeH:0.35;
  camera.position.set(P.x,P.feet+eye+(P.grounded?Math.sin(bob*2)*0.025*Math.min(1,spd/4):0),P.z);
  camera.rotation.set(P.pitch,P.yaw,P.alive?0:0.5);
  const vp=VMPOS[SLOT().w], dep=P.deployT>0?P.deployT*0.5:0;
  vm.visible=P.alive&&!P.zoom&&!paintAnim;
  vm.position.set(vp[0]+Math.sin(bob)*0.006,vp[1]-Math.abs(Math.cos(bob))*0.006-(P.reloadT>0?0.08:0)-dep,vp[2]+recoil*0.035);
  vm.rotation.set(recoil*(W().kick>0.03?0.4:0.15)+(P.reloadT>0?-0.5:0)-dep*2,0,P.reloadT>0?0.3:0);
  if(mode==='net'){ updEnemy(dt);
    sendT-=dt; if(sendT<=0){ sendT=1/30; sendState(); }
    pingT-=dt; if(pingT<=0){ pingT=2; net.send('ping',{ts:performance.now()}); }
    hostTick(); if(isHost){ bcT-=dt; if(bcT<=0){ bcT=1; broadcastRound(); } }
  }
  { const w=W(); const spr=((w.zoom&&P.zoom?w.scoped:w.spread)+(spd>1.5?w.move*Math.min(1,spd/5):0)+(P.grounded?0:w.air))*(P.crouch&&P.grounded?0.6:1)+(w.spray?Math.min(0.03,P.spray*0.004):0)+(w.pelletSpread||0);
    const gap=Math.round(Math.min(46,3+spr*innerHeight/(2*Math.tan(camera.fov*Math.PI/360))));
    if(gap!==lastGap){ $('cross').style.setProperty('--g',gap+'px'); lastGap=gap; } }
  P.slowT=Math.max(0,(P.slowT||0)-dt); { const op=P.slowT>0?Math.min(0.8,P.slowT):0; if(op!==lastSlow){ $('slowfx').style.setProperty('--c',COL[enemy.side]); $('slowfx').style.opacity=op; lastSlow=op; } }
  if(mode==='net'){ if(G.mode==='paint'){ paintFlushT-=dt; if(paintFlushT<=0){ paintFlushT=0.25; flushPaint(); } } updVoice(dt); }
  updPaintAnim(dt);
  updDarts(dt); updShards(dt); updNades(dt); hud(dt);
}
let lastGap=-1, lastBeep=-1, lastSlow=0;
function sendState(){ net.send('s',{x:+P.x.toFixed(3),f:+P.feet.toFixed(3),z:+P.z.toFixed(3),y:+P.yaw.toFixed(3),p:+P.pitch.toFixed(3),a:P.alive?1:0,w:SLOT().w,c:P.crouch?1:0}); }
function updEnemy(dt){
  const b=enemy.buf; if(!b.length) return;
  if(!enemy.mesh){ enemy.mesh=makeAvatar(COL[enemy.side]); scene.add(enemy.mesh); }
  const rt=performance.now()-80; let a=b[0], c=b[b.length-1];
  for(let i=0;i<b.length-1;i++) if(b[i].tm<=rt&&b[i+1].tm>=rt){ a=b[i]; c=b[i+1]; break; }
  const k=c.tm===a.tm?1:Math.max(0,Math.min(1,(rt-a.tm)/(c.tm-a.tm)));
  let dy=c.yaw-a.yaw; dy=Math.atan2(Math.sin(dy),Math.cos(dy));
  const E=enemy.E, px=E.x, pz=E.z; E.x=a.x+(c.x-a.x)*k; E.feet=a.feet+(c.feet-a.feet)*k; E.z=a.z+(c.z-a.z)*k; E.yaw=a.yaw+dy*k; E.pitch=a.pitch+(c.pitch-a.pitch)*k; E.alive=!!c.alive; E.w=c.w||'pistol'; E.crouch=!!c.c;
  const M=enemy.mesh, U=M.userData; M.visible=true; M.position.set(E.x,E.feet,E.z); M.rotation.set(0,E.yaw,E.alive?0:Math.PI/2*0.98);
  if(!E.alive) M.position.y=E.feet+0.3;
  if(U.cur!==E.w){ U.gunHolder.clear(); const gm=gunModel(E.w); gm.traverse(o=>{ if(o.isMesh) o.castShadow=true; }); U.gunHolder.add(gm); U.cur=E.w; }
  U.gunHolder.rotation.x=E.pitch; U.cs=(U.cs||1)+((E.crouch?0.68:1)-(U.cs||1))*Math.min(1,dt*12); M.scale.y=U.cs;
  const v=Math.hypot(E.x-px,E.z-pz)/Math.max(dt,1e-3);
  enemy.stepT+=dt*Math.min(v,7); const sw=Math.sin(enemy.stepT*2.2)*Math.min(1,v/3)*0.5; U.legL.rotation.x=sw; U.legR.rotation.x=-sw;
  if(E.alive&&!E.crouch&&v>2.5&&Math.abs(E.feet-floorAt(E.x,E.z,E.feet))<0.1){ enemy.stepAcc=(enemy.stepAcc||0)+dt*v; if(enemy.stepAcc>(v>5?2.2:1.8)){ enemy.stepAcc=0; sfxAt('step_'+surfaceAt(E.x,E.z,E.feet),new THREE.Vector3(E.x,E.feet,E.z),1.1*Math.min(1.5,v/4.4)); } }
}
setInterval(()=>{ if(document.hidden&&mode==='net'){ sendState(); hostTick(); if(isHost) broadcastRound(); } },250);
const clock=new THREE.Clock();
let loopErr=0;
function loop(){ requestAnimationFrame(loop); const dt=Math.min(0.05,clock.getDelta());
  try{ update(dt); }catch(e){ if(loopErr++<5) console.error(e); try{ if(mode==='net') hostTick(); }catch(_){} }
  renderer.render(scene,camera); }
// filet de sécurité : l'hôte fait toujours avancer les manches
setInterval(()=>{ try{ if(mode==='net'&&isHost) hostTick(); }catch(_){} },300);
addEventListener('resize',()=>{ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); });
let BASEFOV=78; try{ BASEFOV=+localStorage.getItem('fov')||78; }catch(_){} camera.fov=BASEFOV; camera.updateProjectionMatrix();
let QUAL='normale'; try{ QUAL=localStorage.getItem('qual')||'normale'; }catch(_){}
function applyQuality(q){ QUAL=q; const pr={basse:1,normale:Math.min(devicePixelRatio,1.5),haute:Math.min(devicePixelRatio,2)}[q]; const sm={basse:1024,normale:2048,haute:4096}[q];
  renderer.setPixelRatio(pr); renderer.setSize(innerWidth,innerHeight); sun.shadow.mapSize.set(sm,sm); if(sun.shadow.map){ sun.shadow.map.dispose(); sun.shadow.map=null; }
  renderer.shadowMap.type=q==='basse'?THREE.PCFShadowMap:THREE.PCFSoftShadowMap; for(const k in MAT) MAT[k].needsUpdate=true;
  try{ localStorage.setItem('qual',q); }catch(_){} document.querySelectorAll('#qual button').forEach(b=>b.classList.toggle('on',b.dataset.q===q)); }
applyQuality(QUAL);
document.querySelectorAll('#qual button').forEach(b=>b.onclick=()=>applyQuality(b.dataset.q));
const bindRange=(id,val,fmt,set)=>{ const el=$(id); el.value=val; $(id+'V').textContent=fmt(val); el.oninput=e=>{ const v=+e.target.value; $(id+'V').textContent=fmt(v); set(v); }; };
bindRange('vol2',VOL,v=>Math.round(v*100)+' %',v=>{ VOL=v; if(MASTER) MASTER.gain.value=v; try{ localStorage.setItem('vol',v); }catch(_){} });
bindRange('fov2',BASEFOV,v=>v+'°',v=>{ BASEFOV=v; if(!P.zoom){ camera.fov=v; camera.updateProjectionMatrix(); } try{ localStorage.setItem('fov',v); }catch(_){} });
bindRange('sens2',sens,v=>v.toFixed(2),v=>{ sens=v; try{ localStorage.setItem('sens',v); }catch(_){} });
bindRange('vvol',VOICE.vol,v=>Math.round(v*100)+' %',v=>{ VOICE.vol=v; if(VOICE.gain) VOICE.gain.gain.value=VOICE.on?v:0; try{ localStorage.setItem('vvol',v); }catch(_){} });
$('resume').onclick=()=>{ audio(); lock(); };
respawn();
window.__G=G; window.__P=P; window.__net=net; window.__sim=(code,secs)=>{ keys[code]=true; if(code==='KeyW'&&BIND.fwd!=='KeyW') keys[BIND.fwd]=true; for(let i=0;i<secs*60;i++) update(1/60); keys[code]=false; };
window.__fire=()=>fire(); window.__SPL=SPL; window.__splatCount=()=>SPL.A.reduce((s,p)=>s+p.n,0)+SPL.B.reduce((s,p)=>s+p.n,0); window.__throw=(k,p)=>{ P.nades[k]=Math.max(1,P.nades[k]); selectNade(k); P.deployT=0; P.cool=0; throwNade(p||1); }; window.__nades=nades; window.__smokes=smokes; window.__panes=panes; window.__breakPane=breakPane; window.__stuck=stuck; window.__flying=flying; window.__enemy=enemy; window.__buy=buy; window.__S=S; window.__upd=(s)=>{ for(let i=0;i<s*60;i++) update(1/60); };
window.__info=()=>({calls:renderer.info.render.calls,tris:renderer.info.render.triangles,geo:renderer.info.memory.geometries});
window.__ready=true;
document.body.classList.add('inlobby'); $('bHost').disabled=false; $('bSolo').disabled=false; status(''); renderHints(); renderBinds();
const h=location.hash.slice(1);
if(h){ lsec('lJoin'); joinGame(h); }
loop();
</script>
</body>
</html>
