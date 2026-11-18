import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const $ = id => document.getElementById(id);
const isTouch = matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window;

// ---------- renderer / scene ----------
const canvas = $('c');
let renderer;
try { renderer = new THREE.WebGLRenderer({canvas, antialias:true, powerPreference:'high-performance'}); }
catch(e){ $('load').textContent = "WebGL n'est pas disponible sur cet appareil."; throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio, isTouch?1.5:2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, innerWidth/innerHeight, 0.08, 1500);
camera.rotation.order = 'YXZ';

// ---------- utils ----------
function rng(seed){ return function(){ seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const R = rng(1234);
// ---------- échelle FPS : le bâti est élargi ×S, le mobilier garde sa taille réelle ----------
const S=1.4; let MODE='lay';
function obj(fn){ const p=MODE; MODE='obj'; try{ fn(); } finally { MODE=p; } }
function wrapO(f){ return function(...a){ const p=MODE; MODE='obj'; try{ return f.apply(this,a); } finally { MODE=p; } }; }
function T1(a0,a1){ if(MODE==='lay') return [a0*S,a1*S]; const c=(a0+a1)/2, h=(a1-a0)/2; return [c*S-h,c*S+h]; }
const _v3=new THREE.Vector3();

function canvasTex(size, draw){
  const c=document.createElement('canvas'); c.width=c.height=size; const g=c.getContext('2d'); draw(g,size);
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.colorSpace=THREE.SRGBColorSpace;
  t.anisotropy=renderer.capabilities.getMaxAnisotropy(); return t;
}
function speckle(g,s,base,n,cols,sz=2){ g.fillStyle=base; g.fillRect(0,0,s,s); const r=rng(n); for(let i=0;i<n;i++){ g.fillStyle=cols[(r()*cols.length)|0]; g.globalAlpha=0.25+r()*0.4; const w=1+r()*sz; g.fillRect(r()*s,r()*s,w,w);} g.globalAlpha=1; }

function marble(g,s,base,cols,n=260,seed=3){ g.fillStyle=base; g.fillRect(0,0,s,s); const r=rng(seed); n=Math.round(n*0.45); try{ g.filter='blur(2px)'; }catch(_){}
  for(let i=0;i<n;i++){ g.strokeStyle=cols[(r()*cols.length)|0]; g.globalAlpha=0.04+r()*0.09; g.lineWidth=1+r()*4; g.beginPath();
    let x=r()*s, y=r()*s; g.moveTo(x,y); for(let k=0;k<4;k++){ const nx=x+(r()-.5)*s*0.5, ny=y+(r()-.3)*s*0.35; g.quadraticCurveTo(x+(r()-.5)*60,y+(r()-.5)*60,nx,ny); x=nx; y=ny; } g.stroke();
    for(const dx of [-s,s]){ g.save(); g.translate(dx,0); g.stroke(); g.restore(); } for(const dy of [-s,s]){ g.save(); g.translate(0,dy); g.stroke(); g.restore(); } }
  g.globalAlpha=1; try{ g.filter='none'; }catch(_){} const r2=rng(seed+1); for(let i=0;i<1500;i++){ g.fillStyle=cols[(r2()*cols.length)|0]; g.globalAlpha=0.15; g.fillRect(r2()*s,r2()*s,1.5,1.5);} g.globalAlpha=1; }
const TX = {
  conc: canvasTex(512,(g,s)=>{ speckle(g,s,'#d8d3c6',9000,['#cfc9bc','#e4dfd4','#c3bdaf','#dcd7cb'],2); const r=rng(21);
    for(let i=0;i<14;i++){ const y=r()*s; const gr=g.createLinearGradient(0,y,0,y+40); gr.addColorStop(0,'rgba(120,110,95,0)'); gr.addColorStop(.5,'rgba(120,110,95,.06)'); gr.addColorStop(1,'rgba(120,110,95,0)'); g.fillStyle=gr; g.fillRect(0,y,s,40); }
    g.strokeStyle='rgba(110,100,88,.35)'; g.lineWidth=2; g.strokeRect(1,1,s-2,s-2); g.beginPath(); g.moveTo(0,s/2); g.lineTo(s,s/2); g.stroke();
    g.fillStyle='rgba(90,85,78,.55)'; for(const x of [s*.17,s*.5,s*.83]) for(const y of [s*.25,s*.75]){ g.beginPath(); g.arc(x,y,4,0,7); g.fill(); }
    g.fillStyle='rgba(80,70,60,.08)'; for(let i=0;i<30;i++){ const x=r()*s; g.fillRect(x,0,1+r()*2,s*r()); } }),
  metal: canvasTex(512,(g,s)=>{ g.fillStyle='#a9adb0'; g.fillRect(0,0,s,s); for(let i=0;i<8;i++){ const x=i*s/8; const gr=g.createLinearGradient(x,0,x+s/8,0); gr.addColorStop(0,'#bec2c5'); gr.addColorStop(.42,'#a6aaad'); gr.addColorStop(.5,'#83878a'); gr.addColorStop(.58,'#9a9ea1'); gr.addColorStop(1,'#b6babd'); g.fillStyle=gr; g.fillRect(x,0,s/8,s);}
    const r=rng(31); for(let i=0;i<60;i++){ g.fillStyle=`rgba(60,55,50,${.02+r()*.04})`; g.fillRect(r()*s,r()*s*0.3+s*0.7,2+r()*6,s*0.3); } g.fillStyle='rgba(40,40,40,.06)'; g.fillRect(0,s-6,s,6); }),
  metalL: canvasTex(256,(g,s)=>{ g.fillStyle='#e6e7e6'; g.fillRect(0,0,s,s); for(let i=0;i<4;i++){ g.fillStyle='rgba(0,0,0,.07)'; g.fillRect(i*s/4,0,3,s); g.fillStyle='rgba(255,255,255,.5)'; g.fillRect(i*s/4+3,0,2,s);} g.fillStyle='rgba(0,0,0,.06)'; g.fillRect(0,s/2,s,2); }),
  wood: canvasTex(256,(g,s)=>{ const r=rng(7); g.fillStyle='#5a4128'; g.fillRect(0,0,s,s); const n=10; for(let i=0;i<n;i++){ const x=i*s/n; const c=150+r()*40|0; g.fillStyle=`rgb(${c+40},${c},${c-55})`; g.fillRect(x+2,0,s/n-5,s); for(let k=0;k<30;k++){ g.fillStyle='rgba(90,60,30,.18)'; g.fillRect(x+2+r()*(s/n-6),r()*s,1,10+r()*40);} } }),
  woodInt: canvasTex(256,(g,s)=>{ const r=rng(9); g.fillStyle='#c79b63'; g.fillRect(0,0,s,s); for(let k=0;k<400;k++){ g.fillStyle=`rgba(120,80,40,${.05+r()*.1})`; g.fillRect(0,r()*s,s,1+r()*2);} }),
  white: canvasTex(256,(g,s)=>{ speckle(g,s,'#f2f1ec',2600,['#ebeae4','#f7f6f1','#e6e4dd'],2); const r=rng(41); for(let i=0;i<40;i++){ g.fillStyle=`rgba(150,145,130,${.015+r()*.02})`; g.beginPath(); g.ellipse(r()*s,r()*s,10+r()*30,5+r()*12,r()*3,0,7); g.fill(); } }),
  ceil: canvasTex(512,(g,s)=>{ speckle(g,s,'#f1efe8',14000,['#e2dfd6','#f7f5ef','#d8d5cb','#ebe8e0'],1.6); const n=4; g.strokeStyle='#cfcbc0'; g.lineWidth=5;
    for(let i=0;i<=n;i++){ g.beginPath(); g.moveTo(i*s/n,0); g.lineTo(i*s/n,s); g.stroke(); g.beginPath(); g.moveTo(0,i*s/n); g.lineTo(s,i*s/n); g.stroke(); }
    g.strokeStyle='rgba(255,255,255,.8)'; g.lineWidth=1.5; for(let i=0;i<=n;i++){ g.beginPath(); g.moveTo(i*s/n+3,0); g.lineTo(i*s/n+3,s); g.stroke(); g.beginPath(); g.moveTo(0,i*s/n+3); g.lineTo(s,i*s/n+3); g.stroke(); } }),
  linoG: canvasTex(512,(g,s)=>marble(g,s,'#b9c98f',['#a7b97c','#cbd8a6','#9fb172','#dfe7c4'],300,3)),
  linoG2: canvasTex(512,(g,s)=>marble(g,s,'#93b46c',['#86a75f','#a9c785','#7a9a55','#c3d9a6'],300,5)),
  linoC: canvasTex(512,(g,s)=>marble(g,s,'#d6d9d1',['#c6cac0','#e6e8e2','#bfc3b9','#f0f1ec'],280,7)),
  linoB: canvasTex(512,(g,s)=>marble(g,s,'#b7d3d1',['#a5c4c2','#cde3e1','#98b8b6','#e0efee'],280,9)),
  tiles: canvasTex(256,(g,s)=>{ speckle(g,s,'#d6d2c8',1500,['#ccc7bc','#e0ddd5']); g.strokeStyle='#b8b3a8'; g.lineWidth=2; for(let i=0;i<=4;i++){ g.beginPath(); g.moveTo(i*s/4,0); g.lineTo(i*s/4,s); g.stroke(); g.beginPath(); g.moveTo(0,i*s/4); g.lineTo(s,i*s/4); g.stroke(); } }),
  tilesK: canvasTex(256,(g,s)=>{ g.fillStyle='#8a7a70'; g.fillRect(0,0,s,s); g.strokeStyle='#6d5f56'; g.lineWidth=2; for(let i=0;i<=8;i++){ g.beginPath(); g.moveTo(i*s/8,0); g.lineTo(i*s/8,s); g.stroke(); g.beginPath(); g.moveTo(0,i*s/8); g.lineTo(s,i*s/8); g.stroke(); } }),
  mineral: canvasTex(256,(g,s)=>{ speckle(g,s,'#cfccc4',3500,['#c4c1b8','#dad7cf','#bdbab1'],2); g.strokeStyle='rgba(100,100,90,.25)'; g.lineWidth=1.5; g.strokeRect(0,0,s,s/2); g.strokeRect(0,s/2,s,s/2); }),
  pave: canvasTex(512,(g,s)=>{ const r=rng(51); g.fillStyle='#8f8a80'; g.fillRect(0,0,s,s); const rows=4, cols=3, h=s/rows, w=s/cols;
    for(let i=0;i<rows;i++) for(let j=-1;j<=cols;j++){ const x=j*w+(i%2)*w/2, y=i*h; const c=188+r()*22|0; g.fillStyle=`rgb(${c},${c-4},${c-14})`; g.fillRect(x+3,y+3,w-6,h-6);
      for(let k=0;k<260;k++){ const t=r(); g.fillStyle=t<.5?'rgba(255,255,255,.12)':'rgba(70,65,55,.12)'; g.fillRect(x+3+r()*(w-8),y+3+r()*(h-8),2,2); }
      if(r()<.25){ g.fillStyle='rgba(60,55,45,.08)'; g.beginPath(); g.ellipse(x+w/2,y+h/2,w*.3,h*.25,0,0,7); g.fill(); } } }),
  grass: canvasTex(1024,(g,s)=>{ g.fillStyle='#6b8f44'; g.fillRect(0,0,s,s); const r=rng(61);
    for(let i=0;i<70;i++){ const x=r()*s,y=r()*s,rad=60+r()*180; const gr=g.createRadialGradient(x,y,0,x,y,rad); const c=r()<.5?'rgba(120,150,70,.25)':'rgba(70,95,40,.25)'; gr.addColorStop(0,c); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(x-rad,y-rad,rad*2,rad*2); }
    const cols=['#5d8238','#7aa04e','#88ae5a','#527530','#9bbd6c','#6e9543'];
    for(let i=0;i<60000;i++){ const x=r()*s,y=r()*s; g.strokeStyle=cols[(r()*cols.length)|0]; g.globalAlpha=.55; g.lineWidth=1; g.beginPath(); g.moveTo(x,y); g.lineTo(x+(r()-.5)*3,y-2-r()*5); g.stroke(); }
    g.globalAlpha=1; for(let i=0;i<500;i++){ g.fillStyle=r()<.5?'rgba(240,240,200,.5)':'rgba(120,100,60,.35)'; g.fillRect(r()*s,r()*s,2,2); } }),
  asph: canvasTex(256,(g,s)=>speckle(g,s,'#55585a',6000,['#4a4d4f','#606365','#3f4244','#6b6e70'],2)),
  groen: canvasTex(256,(g,s)=>speckle(g,s,'#7a8a4a',6000,['#8a9a52','#9a6a4a','#6d7d40','#a8b062','#8a5a40'],4)),
  locker: canvasTex(256,(g,s)=>{ g.fillStyle='#f0f0ed'; g.fillRect(0,0,s,s); g.strokeStyle='#c9cbc6'; g.lineWidth=3; for(let i=0;i<=2;i++){ g.beginPath(); g.moveTo(i*s/2,0); g.lineTo(i*s/2,s); g.stroke(); g.beginPath(); g.moveTo(0,i*s/2); g.lineTo(s,i*s/2); g.stroke(); } g.fillStyle='#8cc63f'; for(let i=0;i<2;i++)for(let j=0;j<2;j++) g.fillRect(i*s/2+s/2-22,j*s/2+s/4-6,8,12); }),
  shelf: canvasTex(256,(g,s)=>{ const r=rng(5); g.fillStyle='#c79b63'; g.fillRect(0,0,s,s); const cols=['#c0392b','#2e86c1','#f4d03f','#27ae60','#8e44ad','#e67e22','#ecf0f1','#34495e']; for(let row=0;row<4;row++){ let x=4; const y0=row*s/4+6; while(x<s-6){ const w=5+r()*9; g.fillStyle=cols[(r()*cols.length)|0]; g.fillRect(x,y0+r()*8,w,s/4-14-r()*6); x+=w+1; } g.fillStyle='#9b7444'; g.fillRect(0,row*s/4,s,5);} }),
};
function normalFrom(tex,strength=2){ const c=tex.image, w=c.width, h=c.height, src=c.getContext('2d').getImageData(0,0,w,h).data;
  const L=new Float32Array(w*h); for(let i=0;i<w*h;i++) L[i]=(src[i*4]*0.3+src[i*4+1]*0.59+src[i*4+2]*0.11)/255;
  const o=document.createElement('canvas'); o.width=w; o.height=h; const og=o.getContext('2d'), im=og.createImageData(w,h), d=im.data;
  const at=(x,y)=>L[((y+h)%h)*w+((x+w)%w)];
  for(let y=0;y<h;y++) for(let x=0;x<w;x++){ const dx=(at(x+1,y)-at(x-1,y))*strength, dy=(at(x,y+1)-at(x,y-1))*strength; const nz=1/Math.sqrt(dx*dx+dy*dy+1);
    const i=(y*w+x)*4; d[i]=(-dx*nz*0.5+0.5)*255; d[i+1]=(dy*nz*0.5+0.5)*255; d[i+2]=nz*255; d[i+3]=255; }
  og.putImageData(im,0,0); const t=new THREE.CanvasTexture(o); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=8; return t; }
const NRM={ceil:1.5,white:0.4,tiles:4,tilesK:4,wood:3,woodInt:1.5,metal:5,metalL:3,pave:3,mineral:1.5,conc:2,locker:3,groen:2,asph:2,shelf:2};
const TXS = {ceil:2.4, conc:3, metal:2, metalL:3, wood:1.6, woodInt:2, white:2, linoG:2, linoG2:2, linoC:2.5, linoB:2.5, tiles:1.2, tilesK:1.6, mineral:2, pave:2, grass:8, asph:5, groen:5, locker:1, shelf:1.8};

function M(o){ return new THREE.MeshStandardMaterial(Object.assign({roughness:.85, metalness:0}, o)); }
const MAT = {
  conc:M({map:TX.conc}), metal:M({map:TX.metal, roughness:.5, metalness:.35}), metalL:M({map:TX.metalL, roughness:.6, metalness:.15}),
  wood:M({map:TX.wood, roughness:.8}), woodInt:M({map:TX.woodInt}), white:M({map:TX.white, roughness:.9}), slab:M({map:TX.ceil, roughness:.95}), skirt:M({color:'#9aa097', roughness:.6}),
  linoG:M({map:TX.linoG, roughness:.55}), linoG2:M({map:TX.linoG2, roughness:.55}), linoC:M({map:TX.linoC, roughness:.5}), linoB:M({map:TX.linoB, roughness:.5}),
  tiles:M({map:TX.tiles, roughness:.4}), tilesK:M({map:TX.tilesK, roughness:.5}), mineral:M({map:TX.mineral}), pave:M({map:TX.pave}),
  asph:M({map:TX.asph, roughness:.95}), groen:M({map:TX.groen}), locker:M({map:TX.locker, roughness:.4}), shelf:M({map:TX.shelf}),
  glass:new THREE.MeshStandardMaterial({color:'#bcd7e3', roughness:.05, metalness:.1, transparent:true, opacity:.22, depthWrite:false, side:THREE.DoubleSide}),
  lime:M({color:'#9ccc3c', roughness:.45}), steel:M({color:'#8f969c', roughness:.35, metalness:.7}), dark:M({color:'#4b4f52'}),
  board:M({color:'#fbfbfa', roughness:.25}), screen:M({color:'#15181a', roughness:.3}), blue:M({color:'#2a6fb5'}), desk:M({color:'#e9dcc0', roughness:.6}),
  yellow:M({color:'#e2c21e', roughness:.5}), orange:M({color:'#e8742c'}), pink:M({color:'#d9508f'}), teal:M({color:'#2a9d8f'}), red:M({color:'#c94a3c'}),
  plant:M({color:'#3e7b38', roughness:.9, flatShading:true}), plant2:M({color:'#5c9a3e', roughness:.9, flatShading:true}), trunk:M({color:'#6b5039'}),
  sofa:M({color:'#7b5ea7'}), kitchen:M({color:'#c9cdd0', roughness:.3, metalness:.6}), cream:M({color:'#efe6d2'}),
  lamp:new THREE.MeshStandardMaterial({color:'#ffffff', emissive:'#fff8ec', emissiveIntensity:.6, roughness:.4}),
  tray:M({color:'#c9c4b6',roughness:.5}), trayB:M({color:'#6f8a9e',roughness:.5}),
  exit:new THREE.MeshStandardMaterial({color:'#1f9d55', emissive:'#22c55e', emissiveIntensity:1.2}),
  poster:M({roughness:.7}), bin:M({color:'#3e6b4a',roughness:.6}),
};
MAT.glassR=MAT.glass;
for(const k in NRM){ if(MAT[k]&&MAT[k].map){ MAT[k].normalMap=normalFrom(MAT[k].map,NRM[k]); MAT[k].normalScale=new THREE.Vector2(1,1); } }
const OWNUV=new Set(['poster']);
const NOSHADOW = new Set(['glass','glassR','lamp']);

// ---------- geometry bins + collision ----------
const bins = {};
function addRaw(mat, g){ if(g.index) g=g.toNonIndexed(); (bins[mat]||(bins[mat]=[])).push(g); }
function addG(mat, g){ if(MODE==='lay') g.scale(S,1,S); else { g.computeBoundingBox(); g.boundingBox.getCenter(_v3); g.translate(_v3.x*(S-1),0,_v3.z*(S-1)); } addRaw(mat,g); }
const CELL=4, grid=new Map(), boxes=[]; const LVSET=new Set([0,4,7.6]);
function addBox(x0,x1,y0,y1,z0,z1,m){
  const b={x0,x1,y0,y1,z0,z1,m}; boxes.push(b);
  for(let cx=Math.floor(x0/CELL); cx<=Math.floor(x1/CELL); cx++) for(let cz=Math.floor(z0/CELL); cz<=Math.floor(z1/CELL); cz++){
    const k=cx*100003+cz; let a=grid.get(k); if(!a){a=[];grid.set(k,a);} a.push(b); }
  return b;
}
function B(mat,x0,x1,y0,y1,z0,z1,solid=true){
  if(x1<x0)[x0,x1]=[x1,x0]; if(y1<y0)[y0,y1]=[y1,y0]; if(z1<z0)[z0,z1]=[z1,z0];
  if(x1-x0<1e-3||y1-y0<1e-3||z1-z0<1e-3) return;
  [x0,x1]=T1(x0,x1); [z0,z1]=T1(z0,z1);
  if(mat==='glass'&&solid){ // vitrage découpé en carreaux d'environ 2 m × 3,8 m maximum
    const alongX=(x1-x0)>=(z1-z0), L=alongX?x1-x0:z1-z0, nh=Math.max(1,Math.round(L/2.0)), nv=Math.max(1,Math.ceil((y1-y0)/3.8));
    for(let i=0;i<nh;i++) for(let j=0;j<nv;j++){ const a0=(alongX?x0:z0)+L*i/nh, a1=(alongX?x0:z0)+L*(i+1)/nh, b0=y0+(y1-y0)*j/nv, b1=y0+(y1-y0)*(j+1)/nv;
      const X0=alongX?a0:x0, X1=alongX?a1:x1, Z0=alongX?z0:a0, Z1=alongX?z1:a1;
      const g=new THREE.BoxGeometry(X1-X0,b1-b0,Z1-Z0); g.translate((X0+X1)/2,(b0+b1)/2,(Z0+Z1)/2); addRaw(mat,g);
      registerPane([addBox(X0,X1,b0,b1,Z0,Z1,mat)],X0,X1,b0,b1,Z0,Z1); }
    return; }
  const g=new THREE.BoxGeometry(x1-x0,y1-y0,z1-z0); g.translate((x0+x1)/2,(y0+y1)/2,(z0+z1)/2); addRaw(mat,g);
  if(solid) addBox(x0,x1,y0,y1,z0,z1,mat);
}
const panes=[];
function registerPane(bx,x0,x1,y0,y1,z0,z1){ const id=panes.length; const g=bins.glass.length-1;
  const nAxis=(x1-x0)<(z1-z0)?'x':'z', area=(nAxis==='x'?(z1-z0):(x1-x0))*(y1-y0);
  const hp=Math.round(Math.min(80,45+area*3)); panes.push({id,boxes:bx,gi:g,x0,x1,y0,y1,z0,z1,nAxis,hp,hp0:hp,broken:false});
  for(const b of bx) b.pane=id; }
// arbitrary-angle wall segment (visual box + small collision boxes)
function seg(mat,xa,za,xb,zb,y0,y1,t,solid=true){
  xa*=S; xb*=S; za*=S; zb*=S;
  const dx=xb-xa, dz=zb-za, L=Math.hypot(dx,dz); if(L<1e-3) return;
  const g=new THREE.BoxGeometry(L,y1-y0,t); g.rotateY(-Math.atan2(dz,dx)); g.translate((xa+xb)/2,(y0+y1)/2,(za+zb)/2); addRaw(mat,g);
  if(solid){ const n=Math.ceil(L/0.35), bx=[]; for(let i=0;i<=n;i++){ const x=xa+dx*i/n, z=za+dz*i/n; bx.push(addBox(x-.12,x+.12,y0,y1,z-.12,z+.12,mat));}
    if(mat==='glass') registerPane(bx,Math.min(xa,xb)-.12,Math.max(xa,xb)+.12,y0,y1,Math.min(za,zb)-.12,Math.max(za,zb)+.12); }
}
function rotBox(mat,cx,cz,w,d,y0,y1,ang,solid){
  cx*=S; cz*=S; if(MODE==='lay'){ w*=S; d*=S; }
  const g=new THREE.BoxGeometry(w,y1-y0,d); g.rotateY(ang); g.translate(cx,(y0+y1)/2,cz); addRaw(mat,g);
  if(solid){ const r=Math.min(w,d)/2*0.85; addBox(cx-r,cx+r,y0,y1,cz-r,cz+r); }
}

// walls: dir 'x' => along x at z=c ; 'z' => along z at x=c. ops: {a,b,lo,hi,glass}
function wall(dir,c,a0,a1,y0,y1,t,mat,ops=[],frame=false){
  ops=ops.filter(o=>o.b>a0&&o.a<a1).map(o=>Object.assign({},o,{a:Math.max(o.a,a0),b:Math.min(o.b,a1)})).sort((p,q)=>p.a-q.a);
  const S=(a,b,lo,hi,m=mat,solid=true,tt=t)=>{ if(dir==='x') B(m,a,b,lo,hi,c-tt/2,c+tt/2,solid); else B(m,c-tt/2,c+tt/2,lo,hi,a,b,solid); };
  let cur=a0;
  for(const o of ops){
    if(o.a>cur){ S(cur,o.a,y0,y1); if(mat==='white'&&LVSET.has(y0)) S(cur,o.a,y0,y0+0.09,'skirt',false,t+0.03); }
    const lo=Math.max(o.lo,y0), hi=Math.min(o.hi,y1);
    if(lo>y0) S(o.a,o.b,y0,lo); if(hi<y1) S(o.a,o.b,hi,y1);
    if(o.glass) S(o.a,o.b,lo,hi,'glass',true,0.03);
    if(frame && !o.glass){ const f=0.07, tt=t+0.05; S(o.a-f,o.a,y0,hi+f,'lime',false,tt); S(o.b,o.b+f,y0,hi+f,'lime',false,tt); S(o.a-f,o.b+f,hi,hi+f,'lime',false,tt); }
    cur=Math.max(cur,o.b);
  }
  if(cur<a1){ S(cur,a1,y0,y1); if(mat==='white'&&LVSET.has(y0)) S(cur,a1,y0,y0+0.09,'skirt',false,t+0.03); }
}
// exterior wall: cladding outside, white inside. out=+1/-1 (direction of outside along normal axis)
function ext(dir,c,a0,a1,y0,y1,yIn,out,matOut,ops=[]){
  const oc=c+out*0.09, ic=c-out*0.07;
  wall(dir,oc,a0,a1,y0,y1,0.16,matOut,ops.map(o=>Object.assign({},o,{glass:false})));
  wall(dir,ic,a0,a1,y0,yIn,0.12,'white',ops.map(o=>Object.assign({},o,{glass:false})));
  for(const o of ops) if(o.glass){ const lo=Math.max(o.lo,y0), hi=Math.min(o.hi,yIn);
    if(dir==='x') B('glass',o.a,o.b,lo,hi,c-0.02,c+0.02); else B('glass',c-0.02,c+0.02,lo,hi,o.a,o.b);
    // sill + frame
    if(dir==='x') B('steel',o.a,o.b,lo-0.04,lo,c-0.12,c+0.12,false); else B('steel',c-0.12,c+0.12,lo-0.04,lo,o.a,o.b,false);
  }
}
const D=(a,b,L,h=2.4)=>({a:a-0.25,b:b+0.25,lo:L,hi:L+h});
function wins(a0,a1,w,step,lo,hi,doors=[]){ const o=[]; const n=Math.floor((a1-a0)/step+1e-6); const off=a0+((a1-a0)-n*step)/2;
  for(let i=0;i<n;i++){ const a=off+i*step+(step-w)/2, b=a+w; if(doors.some(d=>d.b>a-0.2&&d.a<b+0.2)) continue; o.push({a,b,lo,hi,glass:true}); } return o.concat(doors); }
const F=(mat,x0,x1,z0,z1,L)=>B(mat,x0,x1,L-0.025,L,z0,z1);
let lamp=(x,z,y,s=0.6)=>B('lamp',x-s,x+s,y-0.035,y,z-s,z+s,false);
function lamps(x0,x1,z0,z1,y,sp=3.2){ const nx=Math.max(1,Math.round((x1-x0)/sp)), nz=Math.max(1,Math.round((z1-z0)/sp));
  for(let i=0;i<nx;i++)for(let j=0;j<nz;j++) lamp(x0+(i+.5)*(x1-x0)/nx, z0+(j+.5)*(z1-z0)/nz, y); }

// rect subtract (rects: [x0,x1,z0,z1])
function sub(rects,holes){
  const out=[];
  for(const r of rects){
    const xs=new Set([r[0],r[1]]), zs=new Set([r[2],r[3]]);
    for(const h of holes){ for(const x of [h[0],h[1]]) if(x>r[0]&&x<r[1]) xs.add(x); for(const z of [h[2],h[3]]) if(z>r[2]&&z<r[3]) zs.add(z); }
    const X=[...xs].sort((a,b)=>a-b), Z=[...zs].sort((a,b)=>a-b);
    for(let j=0;j<Z.length-1;j++){ let start=null;
      for(let i=0;i<X.length-1;i++){ const cx=(X[i]+X[i+1])/2, cz=(Z[j]+Z[j+1])/2;
        const inH=holes.some(h=>cx>h[0]&&cx<h[1]&&cz>h[2]&&cz<h[3]);
        if(!inH){ if(start===null) start=X[i]; } else if(start!==null){ out.push([start,X[i],Z[j],Z[j+1]]); start=null; } }
      if(start!==null) out.push([start,X[X.length-1],Z[j],Z[j+1]]);
    }
  }
  return out;
}

// zones (HUD + minimap)
const zones=[];
const ZC={cls:'#8fbfe6',lab:'#62cfcf',self:'#bf9ae0',adm:'#c9c9c9',cdi:'#a7d66f',serv:'#e48a6c',circ:'#ecebe4',wc:'#f2c84b',preau:'#ffffff',ens:'#f3c99a',info:'#7fd4e8',mdl:'#b6e06b',poly:'#f0a35a',stair:'#9aa4a8'};
function Z(name,lvl,x0,x1,z0,z1,type){ zones.push({name,lvl,x0:x0*S,x1:x1*S,z0:z0*S,z1:z1*S,c:ZC[type]||'#ddd',type}); }

// ---------- furniture ----------
const chairCols=['orange','pink','teal','lime','white','yellow'];
const CR=rng(4242);
const _m4=new THREE.Matrix4(), _q=new THREE.Quaternion(), _e=new THREE.Euler();
function part(mat,w,h,d,lx,ly,lz,M){ const g=new THREE.BoxGeometry(w,h,d); g.translate(lx,ly,lz); g.applyMatrix4(M); addRaw(mat,g); }
function chair(x,z,L,mat='blue',face=0,mess=1){ // face: côté du dossier (0:+z,1:-z,2:+x,3:-x)
  let yaw=[0,Math.PI,Math.PI/2,-Math.PI/2][face]+(CR()-.5)*0.9*mess, ox=(CR()-.5)*0.25*mess, oz=(CR()-.5)*0.25*mess, tip=0, y=L;
  const pull=CR()<0.25*mess?0.35:0; ox+=Math.sin(yaw)*pull; oz+=Math.cos(yaw)*pull;
  if(CR()<0.05*mess){ tip=Math.PI/2; y=L+0.21; }
  const cx=x*S+ox, cz=z*S+oz;
  _e.set(0,yaw,tip,'YXZ'); _q.setFromEuler(_e); _m4.compose(new THREE.Vector3(cx,y,cz),_q,new THREE.Vector3(1,1,1));
  part(mat,.42,.05,.42,0,.445,0,_m4); part(mat,.42,.38,.04,0,.68,.19,_m4);
  for(const [a,b] of [[-.18,-.18],[.18,-.18],[-.18,.18],[.18,.18]]) part('steel',.025,.42,.025,a,.21,b,_m4);
}
function desk2(x,z,L,alongZ=true,w=1.3,d=0.55,top='desk',leg='yellow'){ // centre x,z
  const hx=alongZ?d/2:w/2, hz=alongZ?w/2:d/2;
  B(top,x-hx,x+hx,L+.72,L+.76,z-hz,z+hz);
  if(alongZ){ B(leg,x-hx+.03,x+hx-.03,L,L+.72,z-hz+.02,z-hz+.06,false); B(leg,x-hx+.03,x+hx-.03,L,L+.72,z+hz-.06,z+hz-.02,false); }
  else { B(leg,x-hx+.02,x-hx+.06,L,L+.72,z-hz+.03,z+hz-.03,false); B(leg,x+hx-.06,x+hx-.02,L,L+.72,z-hz+.03,z+hz-.03,false); }
}
// classroom with board on wall at x0 (students face -x) or x1 (face +x)
function classroom(x0,x1,z0,z1,L,boardAt='x0',chairMat='blue'){
  const W=z1-z0, dirx=boardAt==='x0'?1:-1, xb=boardAt==='x0'?x0:x1;
  B('board',xb+dirx*0.06,xb+dirx*0.1,L+0.9,L+2.1,(z0+z1)/2-1.8,(z0+z1)/2+1.8,false);
  B('steel',xb+dirx*0.06,xb+dirx*0.16,L+0.86,L+0.9,(z0+z1)/2-1.8,(z0+z1)/2+1.8,false);
  desk2(xb+dirx*1.3,(z0+z1)/2-1.5,L,true,1.4,0.7,'desk','steel');
  const nz=Math.max(1,Math.floor((W-1.2)/1.85)), first=2.6, depth=Math.abs(x1-x0);
  for(let i=0; first+i*1.25<depth-0.9; i++){
    const x=xb+dirx*(first+i*1.25);
    for(let j=0;j<nz;j++){ const z=z0+(j+.5)*W/nz; desk2(x,z,L); chair(x+dirx*.55,z-.33,L,chairMat,dirx>0?2:3); chair(x+dirx*.55,z+.33,L,chairMat,dirx>0?2:3);
      if(CR()<0.35) bag(x*S+dirx*(0.5+CR()*0.4),z*S+(CR()<.5?-.75:.75),L); if(CR()<0.5) notebook(x*S,z*S+(CR()-.5)*0.8,L+.76); }
  }
  lamps(Math.min(x0,x1),Math.max(x0,x1),z0,z1,L+3.3);
}
function lab(x0,x1,z0,z1,L){
  B('board',x0+.06,x0+.1,L+.9,L+2.1,(z0+z1)/2-1.8,(z0+z1)/2+1.8,false);
  const n=Math.floor((z1-z0-1)/2.4);
  for(let j=0;j<n;j++){ const z=z0+1.2+(j+.5)*(z1-z0-1.4)/n;
    B('white',x0+2.2,x1-0.8,L,L+.86,z-.35,z+.35); B('cream',x0+2.15,x1-0.75,L+.86,L+.92,z-.4,z+.4);
    for(let x=x0+2.6;x<x1-1;x+=1.0){ B('lime',x-.15,x+.15,L,L+.65,z-.75,z-.55,false); B('lime',x-.15,x+.15,L,L+.65,z+.55,z+.75,false); }
    B('steel',(x0+x1)/2-.04,(x0+x1)/2+.04,L+.92,L+1.25,z-.04,z+.04,false); }
  B('white',x1-0.6,x1-0.1,L,L+2,z0+0.3,z0+2.2); // armoire
  lamps(x0,x1,z0,z1,L+3.3);
}
function infoRoom(x0,x1,z0,z1,L){
  const along=(x1-x0)>(z1-z0);
  for(let x=x0+1.2;x<x1-0.8;x+=1.3){ desk2(x,z0+0.45,L,false,1.2,0.75,'white','steel'); B('screen',x-.3,x+.3,L+.8,L+1.2,z0+0.25,z0+0.3,false); chair(x,z0+1.2,L,'teal',0);
    if(z1-z0>6){ desk2(x,z1-0.45,L,false,1.2,0.75,'white','steel'); B('screen',x-.3,x+.3,L+.8,L+1.2,z1-0.3,z1-0.25,false); chair(x,z1-1.2,L,'teal',1);} }
  const zc=(z0+z1)/2; for(let x=x0+1.8;x<x1-1.5;x+=1.3){ desk2(x,zc,L,false,1.2,1.2,'white','steel'); B('screen',x-.3,x+.3,L+.8,L+1.2,zc-.02,zc+.02,false); }
  lamps(x0,x1,z0,z1,L+3.3);
}
function office(x0,x1,z0,z1,L,n=1){
  for(let i=0;i<n;i++){ const x=x0+(i+.5)*(x1-x0)/n, z=(z0+z1)/2; desk2(x,z,L,false,1.6,0.8,'woodInt','dark'); B('screen',x-.3,x+.3,L+.78,L+1.15,z+.2,z+.24,false); chair(x,z-.7,L,'dark',1); }
  B('shelf',x1-0.5,x1-0.1,L,L+1.9,z0+0.4,Math.min(z1-0.4,z0+2.6));
  lamps(x0,x1,z0,z1,L+3.3);
}
function lockers(x0,x1,z,L,side){ const d=0.45; B('locker',x0,x1,L,L+1.9,side>0?z:z-d,side>0?z+d:z);
  // quelques portes ouvertes (cellules de 0,5 m)
  const X0=x0*S, X1=x1*S, zf=side>0?z*S+d*S:z*S-d*S, out=side>0?1:-1;
  for(let cx=Math.ceil(X0/0.5)*0.5; cx+0.5<=X1; cx+=0.5) for(let cy=0; cy<3; cy++){ if(CR()>0.12) continue;
    const y0=L+cy*0.5+0.02, y1=y0+0.46;
    rawBox('dark',cx+0.02,cx+0.48,y0,y1,zf-out*0.02,zf+out*0.004);
    const g=new THREE.BoxGeometry(0.46,0.46,0.02); g.translate(0.23,0,0); g.rotateY(out*(1.6+CR()*0.5)); g.translate(cx+0.02,(y0+y1)/2,zf+out*0.01); addRaw('locker',g);
    if(CR()<0.5) rawBox(['red','blue','yellow','teal','orange'][(CR()*5)|0],cx+0.1,cx+0.4,y0,y0+0.25,zf-out*0.35,zf-out*0.1); } }
function lockersZ(x,z0,z1,L,side){ const d=0.45; B('locker',side>0?x:x-d,side>0?x+d:x,L,L+1.9,z0,z1); }
function rawBox(mat,x0,x1,y0,y1,z0,z1){ if(x1<x0)[x0,x1]=[x1,x0]; if(z1<z0)[z0,z1]=[z1,z0]; const g=new THREE.BoxGeometry(x1-x0,y1-y0,z1-z0); g.translate((x0+x1)/2,(y0+y1)/2,(z0+z1)/2); addRaw(mat,g); }
const BAGC=['red','blue','dark','teal','pink','orange','sofa','lime','cream'];
// sac à dos (coordonnées monde)
function bag(X,Zw,L){ const yaw=CR()*Math.PI*2, flat=CR()<0.35, m=BAGC[(CR()*BAGC.length)|0];
  _e.set(flat?-Math.PI/2:(CR()-.5)*0.3,yaw,0,'YXZ'); _q.setFromEuler(_e); _m4.compose(new THREE.Vector3(X,L+(flat?0.1:0),Zw),_q,new THREE.Vector3(1,1,1));
  part(m,.32,.42,.18,0,.21,0,_m4); part(m,.26,.2,.07,0,.15,.12,_m4); part('dark',.22,.04,.02,0,.43,0,_m4); part('dark',.04,.36,.03,-.09,.22,-.1,_m4); part('dark',.04,.36,.03,.09,.22,-.1,_m4);
  if(CR()<0.4) part('steel',.06,.12,.06,.18,.08,0,_m4); }
function notebook(X,Zw,y){ const yaw=CR()*Math.PI*2; _e.set(0,yaw,0); _q.setFromEuler(_e); _m4.compose(new THREE.Vector3(X,y,Zw),_q,new THREE.Vector3(1,1,1));
  part(['red','blue','yellow','teal','white','pink'][(CR()*6)|0],.21,.012,.297,0,.006,0,_m4); if(CR()<.5) part('white',.2,.004,.28,.03,.015,.02,_m4); if(CR()<.4) part('blue',.008,.008,.14,.06,.02,0,_m4); }
const FOOD=['orange','lime','yellow','trunk','red','cream','plant2'];
function tray(X,Zw,y,r=CR){ const yaw=(r()-.5)*0.6; _e.set(0,yaw,0); _q.setFromEuler(_e); _m4.compose(new THREE.Vector3(X,y,Zw),_q,new THREE.Vector3(1,1,1));
  part(r()<.5?'tray':'trayB',.46,.02,.34,0,.01,0,_m4);
  const pl=new THREE.CylinderGeometry(.12,.1,.025,16); pl.translate(-.06,.035,0); pl.applyMatrix4(_m4); addRaw('white',pl);
  for(let i=0;i<3;i++){ const f=new THREE.IcosahedronGeometry(.035+r()*.03,0); f.scale(1.2,.5,1); f.translate(-.06+(r()-.5)*.12,.055,(r()-.5)*.12); f.applyMatrix4(_m4); addRaw(FOOD[(r()*FOOD.length)|0],f); }
  const gl=new THREE.CylinderGeometry(.035,.03,.1,10); gl.translate(.15,.07,.09); gl.applyMatrix4(_m4); addRaw('glass',gl);
  const bo=new THREE.CylinderGeometry(.045,.04,.04,12); bo.translate(.14,.04,-.08); bo.applyMatrix4(_m4); addRaw(r()<.5?'white':'yellow',bo);
  part('cream',.08,.04,.06,.06,.04,-.1,_m4); part('steel',.012,.006,.17,.2,.025,-.02,_m4); part('steel',.012,.006,.15,.22,.025,-.02,_m4); }
function bench(x,z,L,len=2.2,alongX=true){ if(alongX) B('dark',x-len/2,x+len/2,L,L+.45,z-.25,z+.25); else B('dark',x-.25,x+.25,L,L+.45,z-len/2,z+len/2); }
function plantBlob(x,z,y,s,mat='plant'){ const g=new THREE.IcosahedronGeometry(s,0); g.scale(1,1.2,1); g.translate(x,y+s,z); addG(mat,g); }
function planter(x0,x1,z0,z1,L){ B('dark',x0,x1,L,L+.5,z0,z1); const r=rng(Math.round(x0*31+z0*17));
  for(let i=0;i<(x1-x0)*(z1-z0)*1.1;i++){ plantBlob(x0+.3+r()*(x1-x0-.6),z0+.3+r()*(z1-z0-.6),L+.4,.35+r()*.6,r()<.5?'plant':'plant2'); } }
function wcRoom(x0,x1,z0,z1,L){ const n=Math.floor((x1-x0-0.4)/1.2);
  for(let i=0;i<n;i++){ const x=x0+0.2+i*1.2; B('lime',x,x+0.04,L+.15,L+2.0,z1-1.6,z1,false); B('white',x+0.4,x+0.8,L,L+.42,z1-0.6,z1-0.1,false); }
  B('white',x0+0.3,x1-0.3,L+0.8,L+0.88,z0+0.1,z0+0.6,false); lamps(x0,x1,z0,z1,L+3.3); }
function selfTables(x0,x1,z0,z1,L){ const r=rng(Math.round(x0*7+z0));
  for(let x=x0+1.2;x<x1-1;x+=2.6) for(let z=z0+1.1;z<z1-0.8;z+=2.2){ B('white',x-.8,x+.8,L+.72,L+.76,z-.4,z+.4); B('steel',x-.04,x+.04,L,L+.72,z-.04,z+.04,false);
    for(const dx of [-.45,.45]){ chair(x+dx,z-.65,L,chairCols[(r()*6)|0],1); chair(x+dx,z+.65,L,chairCols[(r()*6)|0],0);
      if(r()<0.55) tray(x*S+dx,z*S-.22,L+.76,r); if(r()<0.55) tray(x*S+dx,z*S+.22,L+.76,r); } } }
chair=wrapO(chair); desk2=wrapO(desk2); lamp=wrapO(lamp); bench=wrapO(bench); plantBlob=wrapO(plantBlob); office=wrapO(office); infoRoom=wrapO(infoRoom);
// straight stair: x[x0,x1], foot at zFoot, climbing toward dir (+1/-1) ; returns end z
function stair(x0,x1,zFoot,dir,L,rise,n,g=0.28,rail=true){
  const r=rise/n;
  for(let i=0;i<n;i++){ const za=zFoot+dir*i*g, zb=zFoot+dir*(i+1)*g; B('linoC',x0,x1,L+(i+1)*r-0.2,L+(i+1)*r,za,zb); B('lime',x0,x1,L+(i+1)*r-0.005,L+(i+1)*r+0.002,dir>0?za:zb-0.05,dir>0?za+0.05:zb,false); }
  // stringer underside
  const len=n*g, ang=Math.atan2(rise,len);
  const geo=new THREE.BoxGeometry(x1-x0,0.18,Math.hypot(len,rise)); geo.rotateX(dir>0?-ang:ang); geo.translate((x0+x1)/2,L+rise/2-0.22,zFoot+dir*len/2); addG('white',geo);
  if(rail){ for(const x of [x0+0.03,x1-0.03]){ const gr=new THREE.BoxGeometry(0.04,0.05,Math.hypot(len,rise)); gr.rotateX(dir>0?-ang:ang); gr.translate(x,L+rise/2+0.95,zFoot+dir*len/2); addG('steel',gr);
      const gp=new THREE.BoxGeometry(0.02,0.9,Math.hypot(len,rise)); gp.rotateX(dir>0?-ang:ang); gp.translate(x,L+rise/2+0.5,zFoot+dir*len/2); addG('glassR',gp); }
    // collision des rampes : une petite boîte par marche, de chaque côté
    for(let i=0;i<n;i++){ const za=zFoot+dir*i*g, zb=zFoot+dir*(i+1)*g, top=L+(i+1)*r;
      for(const [xa,xb] of [[x0,x0+0.07],[x1-0.07,x1]]){ const [X0,X1]=T1(xa,xb), [Z0,Z1]=T1(Math.min(za,zb),Math.max(za,zb)); addBox(X0,X1,top,top+1.05,Z0,Z1,'rail'); } } }
  return zFoot+dir*len;
}
// switchback: front at zFront (floor side), flights go toward dir
function switchback(x0,x1,zFront,dir,L,rise,n2){
  const n=n2/2, r=rise/n2, g=0.28, w=(x1-x0-0.16)/2, zFar=zFront+dir*n*g, zEnd=zFar+dir*1.4;
  for(let i=0;i<n;i++){ const za=zFront+dir*i*g, zb=zFront+dir*(i+1)*g; B('linoC',x0,x0+w,L+(i+1)*r-0.2,L+(i+1)*r,za,zb); }
  B('linoC',x0,x1,L+n*r-0.25,L+n*r,zFar,zEnd);
  for(let j=0;j<n;j++){ const za=zFar-dir*j*g, zb=zFar-dir*(j+1)*g; B('linoC',x1-w,x1,L+n*r+(j+1)*r-0.2,L+n*r+(j+1)*r,za,zb); }
  B('white',x0+w,x1-w,L,L+rise+1.0,zFront,zFar);
  return [x0,x1,Math.min(zFront,zEnd),Math.max(zFront,zEnd)];
}
function railX(z,x0,x1,L){ B('glassR',x0,x1,L,L+1.05,z-.02,z+.02); B('steel',x0,x1,L+1.02,L+1.08,z-.04,z+.04,false); }
function railZ(x,z0,z1,L){ B('glassR',x-.02,x+.02,L,L+1.05,z0,z1); B('steel',x-.04,x+.04,L+1.02,L+1.08,z0,z1,false); }

// ============================================================
//  BUILD — coordinates in metres: x → est, z → sud, y ↑
// ============================================================
const LV=[0,4,7.6], CE=[3.7,7.3,10.9], TOP=11.2;

// ---------- RDC : socle (bâtiment B) ----------
{
  const L=0, yi=CE[0], yo=4;
  // façades extérieures
  const dNorth=[D(62.6,64.4,0,2.5)];
  ext('x',-3,-10,141,0,yo,yi,-1,'conc', [].concat(
    wins(-10,14,1.4,3.4,1.0,2.4), wins(14,36,1.4,3.6,1.0,2.4), wins(36,62,2.8,3.25,0.6,3.0),
    dNorth, wins(65,90,1.6,3.1,0.9,2.5), wins(90,128,2.4,3.8,0.9,2.7), wins(128,141,2.4,3.25,0.9,2.7)));
  ext('z',-10,-3,22,0,yo,yi,-1,'conc', wins(-3,22,1.4,3.5,1.0,2.4,[D(8,10,0,2.4)]));
  ext('z',141,-3,22,0,yo,yi,1,'conc', wins(-3,22,2.2,3.5,0.9,2.7,[D(8.6,11,0,2.6)]));
  ext('x',22,-10,62,0,yo,yi,1,'conc', [].concat(wins(-10,14,1.4,3.4,1.0,2.4), wins(14,62,3.0,3.4,0.25,3.4,[D(38.2,40.4,0,2.6),D(55,57.2,0,2.6)])));
  ext('x',22,94,141,0,yo,yi,1,'conc', wins(94,141,2.4,3.5,0.9,2.7));
  // entretien
  wall('x',9.5,-10,14,0,yi,.12,'white',[D(-3,-2,0),D(8,9,0)],true); wall('z',2,-3,9.5,0,yi,.12,'white',[D(7,8,0)],true);
  wall('z',14,-3,22,0,yi,.15,'white');
  F('linoC',-10,14,-3,22,0); lamps(-10,14,-3,22,yi,4);
  Z("Locaux d'entretien",0,-10,14,-3,22,'serv');
  // cuisine
  wall('x',9,14,36,0,yi,.15,'white',[{a:18,b:33,lo:0.92,hi:2.1},D(34,35.4,0)],true); wall('z',36,-3,9,0,yi,.15,'white',[D(3,4.6,0)],true);
  F('tilesK',14,36,-3,9,0); B('kitchen',15,35,0,.9,-2.8,-2.1); B('kitchen',19,31,0,.9,2,3.4); B('kitchen',15,15.8,0,.9,0,7.5);
  B('kitchen',20,30,2.3,2.6,1.6,3.8,false); lamps(14,36,-3,9,yi,4);
  Z('Cuisine',0,14,36,-3,9,'serv');
  // self
  F('tiles',36,62,-3,9,0); F('tiles',14,62,9,22,0);
  B('steel',18,33,0,.85,9.1,9.95); B('lime',17.8,33.2,.85,.92,9.05,10.25); B('glass',18,33,1.25,1.29,9.35,9.6,false);
  for(let x=18.3;x<33;x+=2.4) B('steel',x,x+.05,.92,1.27,9.45,9.5,false);
  B('steel',17.8,33.2,.78,.82,10.25,10.55,false);
  selfTables(38,61,-2.5,8.5,0); selfTables(15,61,12,21.5,0);
  wall('z',62,-3,22,0,yi,.15,'white',[D(4,6,0),D(14,16,0),D(19.5,21.5,0)],true);
  lamps(36,62,-3,9,yi,4); lamps(14,62,9,22,yi,4);
  Z('Self — restaurant scolaire',0,14,62,9,22,'self'); Z('Self — restaurant scolaire',0,36,62,-3,9,'self');
  // passage restauration
  F('linoC',62,65,-3,18.6,0); lamps(62,65,-3,18.6,yi,3.5); Z('Accès restauration',0,62,65,-3,18.6,'circ');
  // infirmerie / EPS
  wall('z',65,-3,8,0,yi,.12,'white'); wall('z',78,-3,8,0,yi,.12,'white'); wall('z',90,-3,8,0,yi,.12,'white');
  F('linoC',65,90,-3,8,0);
  B('white',66,68,0,.6,-2.6,-.7,true); B('white',69,71,0,.6,-2.6,-.7,true); office(72,78,-3,8,0,1); office(78,90,-3,8,0,2);
  lamps(65,78,-3,8,yi,3.5);
  Z('Infirmerie',0,65,78,-3,8,'serv'); Z('EPS / Santé',0,78,90,-3,8,'serv');
  // couloir RDC
  const cdoors=[D(75,76.2,0),D(87,88.2,0)];
  const xi=[90,97.6,105.2,112.8,120.4,128];
  for(let i=0;i<5;i++) cdoors.push(D(xi[i+1]-1.6,xi[i+1]-0.5,0));
  wall('x',8,65,128,0,yi,.12,'white',cdoors,true);
  for(let i=1;i<5;i++) wall('z',xi[i],-3,8,0,yi,.12,'white');
  for(let i=0;i<5;i++){ infoRoom(xi[i],xi[i+1],-3,8,0); Z('Salle informatique',0,xi[i],xi[i+1],-3,8,'info'); F('linoB',xi[i],xi[i+1],-3,8,0); }
  F('linoC',65,128,8,11,0); lamps(65,128,8,11,yi,4); Z('Couloir — pôle multimédia',0,65,128,8,11,'circ');
  const xs=[94,102.5,111,119.5,128];
  const sdoors=[D(70,71.2,0),D(78,79.2,0),D(89,90.4,0)];
  for(let i=0;i<4;i++) sdoors.push(D(xs[i]+0.5,xs[i]+1.6,0));
  wall('x',11,69,128,0,yi,.12,'white',sdoors,true);
  wall('z',69,11,18.6,0,yi,.12,'white'); wall('z',74.5,11,18.6,0,yi,.12,'white'); wall('z',80,11,18.6,0,yi,.12,'white');
  wall('x',18.6,69,80,0,yi,.12,'white'); F('tiles',69,80,11,18.6,0); wcRoom(69,74.5,11,18.6,0); wcRoom(74.5,80,11,18.6,0);
  Z('Sanitaires',0,69,80,11,18.6,'wc');
  F('linoC',65,69,11,18.6,0); F('linoC',80,83,11,18.6,0); lamps(65,69,11,18.6,yi); lamps(80,83,11,18.6,yi);
  Z('Liaison préau',0,65,69,11,18.6,'circ'); Z('Liaison hall',0,80,83,11,18.6,'circ');
  wall('z',83,11,18.6,0,yi,.12,'white');
  wall('x',18.6,83,94,0,yi,.12,'white',[D(85,86.6,0),{a:88,b:93,lo:1,hi:2.6,glass:true}],true);
  F('linoC',83,94,11,18.6,0); office(83,94,11,18.6,0,3); Z('Vie scolaire',0,83,94,11,18.6,'adm');
  wall('z',94,11,22,0,yi,.12,'white');
  for(let i=1;i<4;i++) wall('z',xs[i],11,22,0,yi,.12,'white');
  for(let i=0;i<4;i++){ infoRoom(xs[i],xs[i+1],11,22,0); F('linoB',xs[i],xs[i+1],11,22,0); Z('Salle informatique',0,xs[i],xs[i+1],11,22,'info'); }
  for(let i=0;i<4;i++) lockers(xs[i]+2.2,xs[i+1]-0.6,11,0,-1);
  // multimédia + noyau est
  wall('z',128,-3,8,0,yi,.12,'white'); wall('z',128,11,22,0,yi,.12,'white');
  F('linoG',128,141,-3,22,0); lamps(134.5,141,-3,22,yi); lamps(128,141,8.5,22,yi);
  for(let z=11;z<21;z+=2.5){ desk2(136,z,0,false,2.2,1,'white','steel'); B('screen',135.4,136.6,.8,1.2,z-.03,z+.03,false); chair(136,z-.8,0,'teal',1); chair(136,z+.8,0,'teal',0); }
  B('sofa',136,140.5,0,.45,-2.6,-1.6); B('sofa',140,140.6,0.45,.9,-2.6,1.5,false);
  Z('Espace multimédia',0,128,141,-3,22,'info');
}

// ---------- étages du bâtiment B (R+1, R+2) ----------
const PODS=[[4,8.4,'stairW'],[21,30.5,'tech'],[45,54,'cls'],[60.5,66.5,'room'],[66.5,70.9,'stairC'],[70.9,79,'wc'],[79,83,'pass'],[83,94,'cls2'],[109,126,'cls']];
const NX=[]; for(let i=0;i<=17;i++) NX.push(+(i*129.6/17).toFixed(2)); // 17 salles nord
function barLevel(k){
  const L=LV[k], yi=CE[k], yo=(k===2?TOP:LV[k+1]);
  const pre=k===1?'1':'2';
  // façade nord
  const nOps=[]; for(let i=0;i<17;i++){ const a=NX[i]; nOps.push({a:a+0.9,b:a+3.4,lo:L+0.9,hi:L+3.0,glass:true},{a:a+4.2,b:a+6.7,lo:L+0.9,hi:L+3.0,glass:true}); }
  nOps.push({a:131,b:132.6,lo:L+1,hi:L+3,glass:true});
  ext('x',0,0,134,L,yo,yi,-1,'metal',nOps);
  ext('z',0,0,13,L,yo,yi,-1,'metal',[{a:9,b:11.5,lo:L+.9,hi:L+3,glass:true}]);
  ext('z',134,0,13,L,yo,yi,1,'metal',[{a:9,b:11.5,lo:L+.9,hi:L+3,glass:true}]);
  // salles nord + couloir
  const doors=[];
  for(let i=0;i<17;i++) doors.push(D(NX[i+1]-1.6,NX[i+1]-0.6,L));
  wall('x',8,0,129.6,L,yi,.12,'white',doors,true);
  for(let i=1;i<=17;i++) wall('z',NX[i],0,8,L,yi,.12,'white');
  for(let i=0;i<17;i++){ const a=NX[i], b=NX[i+1];
    if(k===2 && b<86){ lab(a,b,0,8,L); F('linoB',a,b,0,8,L); Z('Laboratoire de sciences '+(200+i+1),2,a,b,0,8,'lab'); }
    else if(k===1 && i===3){ office(a,b,0,8,L,2); F('linoG',a,b,0,8,L); Z('Salle de ressources',1,a,b,0,8,'ens'); }
    else { classroom(a,b,0,8,L,'x0',k===1?'blue':'teal'); F('linoG',a,b,0,8,L); Z('Salle de cours '+pre+String(i+1).padStart(2,'0'),k,a,b,0,8,'cls'); }
    if(i%2===0) lockers(a+0.3,b-1.9,8,L,1);
  }
  F('linoC',0,134,8,12,L); lamps(0,134,8,12,yi,4.2);
  Z('Couloir '+(k===1?'R+1':'R+2'),k,0,134,8,13,'circ');
  // côté sud : vitrage entre plots
  let cur=0; const gaps=[];
  for(const p of PODS){ if(p[0]>cur) gaps.push([cur,p[0]]); cur=p[1]; } if(cur<134) gaps.push([cur,134]);
  for(const [a,b] of gaps){
    B('glass',a,b,L,yi,12.98,13.02); for(let x=a;x<=b+1e-6;x+=1.5) B('steel',x-.03,x+.03,L,yi,12.95,13.05,false);
    B('metal',a,b,yi,yo,12.9,13.15); F('linoC',a,b,12,13,L); bench((a+b)/2,12.6,L,Math.min(3,(b-a)-1));
  }
  // plots
  const bnd=new Set(); PODS.forEach(p=>{bnd.add(p[0]);bnd.add(p[1]);});
  for(const x of bnd){ const leftPod=PODS.find(p=>p[1]===x), rightPod=PODS.find(p=>p[0]===x);
    if(leftPod&&rightPod) wall('z',x,12,17.5,L,yi,.12,'white');
    else { wall('z',x,12,13,L,yi,.12,'white'); ext('z',x,13,17.5,L,yo,yi,rightPod?-1:1,'metal'); } }
  for(const [a,b,t] of PODS){
    const facePreau=a>=60.5&&b<=83, matS=facePreau?'wood':'metal';
    let sOps=[]; if(t==='cls'||t==='cls2'||t==='room') sOps=wins(a,b,2.2,3.0,L+0.9,L+3.0);
    if(t==='cls2'&&k===1) sOps=wins(a,b,2.2,3.0,L+0.9,L+3.0,[D(91,92.6,L,2.4)]);
    if(t==='pass'&&k===1){ B(matS,a,b,yi,yo,17.45,17.62); }
    else ext('x',17.5,a,b,L,yo,yi,1,matS,sOps);
    if(t==='stairW'||t==='stairC'){ wall('x',12,a,b,L,yi,.12,'white',[{a:a+0.1,b:b-0.1,lo:L,hi:L+2.6}]); }
    else if(t==='pass'&&k===1){ /* ouvert */ }
    else wall('x',12,a,b,L,yi,.12,'white',[D(a+0.6,a+1.6,L)],true);
    if(t==='cls'||t==='cls2'){ classroom(a,b,12,17.5,L,'x0',k===1?'blue':'teal'); F('linoG',a,b,12,17.5,L); Z('Salle de cours '+pre+(a<50?'20':a<100?'21':'22'),k,a,b,12,17.5,'cls'); }
    if(t==='room'||(t==='pass'&&k===2)){ office(a,b,12,17.5,L,1); F('linoG',a,b,12,17.5,L); Z(k===1?'Salle de permanence':'Salle de travail',k,a,b,12,17.5,'ens'); }
    if(t==='tech'){ F('linoC',a,b,12,17.5,L); B('steel',a+1,a+4,L,L+2,14,17); B('steel',b-4,b-1,L,L+2,14,17); Z('Local technique',k,a,b,12,17.5,'serv'); }
    if(t==='wc'){ F('tiles',a,b,12,17.5,L); wall('z',(a+b)/2,12,17.5,L,yi,.12,'white'); wcRoom(a,(a+b)/2,12,17.5,L); wcRoom((a+b)/2,b,12,17.5,L); Z('Sanitaires',k,a,b,12,17.5,'wc'); }
    if(t==='pass'&&k===1){ F('linoC',a,b,12,17.5,L); lamps(a,b,12,17.5,yi); Z('Passerelle vers le préau',1,a,b,12,17.5,'circ'); }
    if(t==='stairW'||t==='stairC'){ F('linoC',a,b,12,12.4,L); Z('Escalier',k,a,b,12,17.5,'stair'); }
  }
  // noyau est
  wall('z',134,0,8,L,yi,.12,'white'); Z('Escalier est',k,129.6,134,0,8,'stair');
}
barLevel(1); barLevel(2);

// escaliers
switchback(129.6,134,8,-1,0,4,24);          // E : RDC → R+1
switchback(129.6,134,8,-1,4,3.6,22);        // E : R+1 → R+2
switchback(4,8.4,12,1,4,3.6,22);            // O : R+1 → R+2
switchback(66.5,70.9,12,1,4,3.6,22);        // C : R+1 → R+2
wall('z',129.6,0,8,0,CE[0],.12,'white'); wall('x',0,129.6,134,0,CE[0],.12,'white');
const HOLE1=[[129.6,134,8-4.76,8]], HOLE2=[[129.6,134,8-4.48,8],[4,8.4,12,12+4.48],[66.5,70.9,12,12+4.48]];

// dalles R+1
{
  const rects=[[-10,62,-3,22],[62,94,-3,18.6],[94,141,-3,22],[62,83,18.6,19.6],[62,64.5,19.6,42],[80.5,83,19.6,42],[83,94,18.6,28.3],[30,62,42,63],[62,83,42,57],[83,112,35.6,57]];
  for(const r of sub(rects,HOLE1)) B('slab',r[0],r[1],3.7,3.975,r[2],r[3]);
  // terrasses végétalisées
  const bar=[[0,134,-3,13]].concat(PODS.map(p=>[p[0],p[1],12,17.5]));
  for(const r of sub([[-10,62,-3,22],[62,94,-3,18.6],[94,141,-3,22]],bar.concat([[0,134,-3,0]]))) F('groen',r[0],r[1],r[2],r[3],4);
  F('groen',0,134,-3,0,4);
  // parapets socle
  B('conc',-10.2,141.2,4,4.6,-3.2,-2.85); B('conc',-10.2,-9.85,4,4.6,-3,22.2); B('conc',140.85,141.2,4,4.6,-3,22.2);
  B('conc',-10.2,62,4,4.6,21.85,22.2); B('conc',94,141.2,4,4.6,21.85,22.2); B('conc',62,62.15,4,4.6,18.6,22);
  // palier + coursives
  F('linoC',62,83,17.5,19.6,4); F('linoC',62,64.5,19.6,42,4); F('linoC',80.5,83,19.6,42,4); F('linoC',83,94,17.5,28.3,4);
  railX(19.6,64.5,66,4); railX(19.6,74,80.5,4); railZ(64.5,19.6,42,4); railZ(80.5,19.6,42,4); railX(28.3,83,90.8,4);
  lamps(62,64.5,19.6,42,7.6-0.3,4);
  Z('Palier du préau',1,62,83,17.5,19.6,'circ'); Z('Coursive ouest',1,62,64.5,19.6,42,'circ'); Z('Coursive est',1,80.5,83,19.6,42,'circ'); Z('Mezzanine du hall',1,83,94,17.5,28.3,'circ');
}
// dalles R+2, toitures
{
  const bar=[[0,134,0,13]].concat(PODS.map(p=>[p[0],p[1],13,17.5]));
  for(const r of sub(bar,HOLE2)) B('slab',r[0],r[1],7.3,7.575,r[2],r[3]);
  for(const r of bar) B('slab',r[0],r[1],10.9,11.2,r[2],r[3]);
  for(const r of bar) F('groen',r[0],r[1],r[2],r[3],11.22);
  // acrotères barre
  B('metal',-0.25,134.25,11.2,11.8,-0.25,0); B('metal',-0.25,0,11.2,11.8,0,13); B('metal',134,134.25,11.2,11.8,0,13);
  // bloc A + hall : toiture 7.6
  for(const r of [[30,62,42,63],[62,83,42,57],[83,112,35.6,57],[83,94,17.5,35.6]]){ B('slab',r[0],r[1],7.3,7.6,r[2],r[3]); F('groen',r[0],r[1],r[2],r[3],7.62); }
  B('wood',29.8,62,7.6,8.1,62.85,63.2); B('wood',29.8,30.15,7.6,8.1,41.8,63.2); B('wood',29.8,62,7.6,8.1,41.8,42.15);
  B('metalL',83,112.2,7.6,8.1,56.85,57.2); B('metalL',111.85,112.2,7.6,8.1,35.4,57.2); B('metalL',94,112.2,7.6,8.1,35.4,35.75);
}

// ---------- préau bioclimatique ----------
{
  F('mineral',62,94,18.6,42,0);
  for(const z of [24,30.5,37]) B('lime',62,83,0,0.004,z-0.12,z+0.12,false);
  B('lime',72.4,72.6,0,0.004,26.4,42,false);
  // grand escalier
  stair(66,74,26.32,-1,0,4,24,0.28);
  // façade ouest vitrée
  const gx=62;
  B('glass',gx-0.02,gx+0.02,0,3.7,22,30); B('glass',gx-0.02,gx+0.02,2.6,3.7,30,33.2); B('glass',gx-0.02,gx+0.02,0,3.7,33.2,42);
  B('glass',gx-0.02,gx+0.02,3.7,11.8,17.5,42);
  for(let z=22;z<=42.01;z+=1.6) B('steel',gx-.05,gx+.05,0,11.8,z-.04,z+.04,z<30||z>33.2);
  for(let z=17.5;z<22;z+=1.5) B('steel',gx-.05,gx+.05,3.7,11.8,z-.04,z+.04,false);
  for(const y of [3.7,7.6]) B('steel',gx-.06,gx+.06,y-.08,y,17.5,42,false);
  // bardages hauts
  B('metalL',83,83.2,7.6,11.8,17.5,42); B('wood',62,83,7.6,11.8,41.9,42.15);
  B('wood',60.5,94,TOP,11.8,17.45,17.65);
  // toiture vitrée en sheds
  const z0=17.5, z1=42, nb=8, bw=(z1-z0)/nb;
  for(let i=0;i<nb;i++){ const za=z0+i*bw, zb=za+bw, lo=11.6, hi=12.9, len=Math.hypot(bw,hi-lo), ang=Math.atan2(hi-lo,bw);
    const g=new THREE.BoxGeometry(21,0.03,len); g.rotateX(ang); g.translate(72.5,(lo+hi)/2,(za+zb)/2); addG('glass',g);
    B('glass',62,83,lo,hi,zb-0.015,zb+0.015,false);
    B('steel',62,83,lo-0.25,lo,zb-0.1,zb+0.1,false);
    const s=new THREE.BoxGeometry(0.1,0.1,len); for(let x=62.5;x<83;x+=3){ const sg=s.clone(); sg.rotateX(ang); sg.translate(x,(lo+hi)/2-0.05,(za+zb)/2); addG('steel',sg); }
  }
  B('steel',62,83,11.4,11.6,17.4,17.6,false);
  // mobilier préau
  planter(63,66,28,30,0); planter(77,81,27,29.5,0); planter(64,67,36,39,0); planter(76.5,80.5,35.5,38.5,0); planter(70,75.5,32.5,34.5,0);
  bench(66,33.5,0,2.4); bench(78.5,32.5,0,2.4); bench(71,38.5,0,2.4); bench(76,24,0,2,false); bench(64.2,24.5,0,2,false);
  for(let i=0;i<3;i++) B('dark',68+i*3,69.6+i*3,0,.45,40,40.6);
  Z('Préau bioclimatique',0,62,83,18.6,42,'preau'); Z('Préau (vide)',1,64.5,80.5,19.6,42,'preau');
}
// ---------- hall d'accueil ----------
{
  // façade d'entrée vitrée
  const hx=94;
  B('glass',hx-0.02,hx+0.02,0,7.6,22,25.5); B('glass',hx-0.02,hx+0.02,2.7,7.6,25.5,29.5); B('glass',hx-0.02,hx+0.02,0,7.6,29.5,38);
  for(let z=22;z<=38.01;z+=1.6) B('steel',hx-.05,hx+.05,0,7.6,z-.04,z+.04,!(z>25.4&&z<29.6));
  B('steel',hx-.06,hx+.06,2.62,2.7,25.5,29.5,false); B('steel',hx-.06,hx+.06,3.7,3.85,22,38,false);
  B('metalL',hx-0.1,hx+0.15,7.3,7.6,22,38);
  // auvent d'entrée
  B('white',94,98,3.9,4.1,24.5,30.5); B('steel',97.8,98,0,3.9,24.6,24.8); B('steel',97.8,98,0,3.9,30.2,30.4);
  // escalier du hall
  stair(90.8,93.3,35.0,-1,0,4,24,0.28);
  F('mineral',83,94,35.6,42,0);
  // accueil
  B('lime',85,88.5,0,1.05,33,34); B('white',84.9,88.6,1.05,1.12,32.9,34.1);
  lamps(83,94,18.6,28.3,CE[0]); lamps(83,94,28.3,42,7.3,4);
  Z("Hall d'accueil",0,83,94,18.6,42,'circ');
}
// ---------- bloc A — RDC ----------
{
  const L=0, yi=CE[0], yo=4;
  F('linoC',62,94,42,44.5,0); lamps(62,94,42,44.5,yi); Z('Galerie — locaux d\'accompagnement',0,62,94,42,44.5,'circ');
  const rx=[62,68.3,74.6,81,94];
  const dd=[]; for(let i=0;i<4;i++) dd.push(D(rx[i]+0.5,rx[i]+1.6,0));
  wall('x',44.5,62,94,0,yi,.12,'white',dd,true);
  for(let i=1;i<4;i++) wall('z',rx[i],44.5,58,0,yi,.12,'white');
  for(let i=0;i<3;i++){ classroom(rx[i],rx[i+1],44.5,58,0,'x0','orange'); F('linoG',rx[i],rx[i+1],44.5,58,0); Z("Salle d'accompagnement",0,rx[i],rx[i+1],44.5,58,'ens'); }
  office(81,94,44.5,58,0,2); F('linoC',81,94,44.5,58,0); Z('Bureaux',0,81,94,44.5,58,'adm');
  ext('x',58,62,107,L,yo,yi,1,'wood',wins(62,107,2.2,3.0,0.9,2.9));
  ext('z',62,42,58,L,yo,yi,-1,'conc',wins(44.5,58,2.0,3.2,0.9,2.8,[D(42.4,44.2,0,2.5)]));
  // salle polyvalente
  wall('z',94,38,52,0,yi,.15,'white',[D(39.4,41.4,0,2.4)],true);
  ext('x',38,94,107,L,yo,yi,-1,'metalL',[D(95,96.8,0,2.5)]);
  ext('z',107,38,58,L,yo,yi,1,'metalL',wins(52,58,2,3,0.9,2.8));
  wall('x',52,94,107,0,yi,.12,'white',[D(95,96.2,0)],true);
  F('linoC',94,99,38,52,0);
  for(let k=0;k<7;k++){ const xa=99+k*0.95, xb=k===6?107:xa+0.95, h=(k+1)*0.18; B('linoC',xa,xb,0,h,38.1,51.9);
    for(let z=38.8;z<51.4;z+=0.62){ B('blue',xa+0.35,xa+0.82,h,h+0.44,z-.24,z+.24,false); B('blue',xa+0.78,xa+0.86,h+0.44,h+0.95,z-.24,z+.24,false); } }
  B('white',94.1,94.14,0.9,3.3,41,49,false); B('dark',95,97.5,0,.75,43,45);
  for(let z=39;z<52;z+=2.6) lamp(101,z,yi,.4);
  Z('Salle polyvalente (amphithéâtre)',0,94,107,38,52,'poly');
  office(94,107,52,58,0,2); F('linoC',94,107,52,58,0); Z('Salle de réunion',0,94,107,52,58,'adm');
  // maison des lycéens (pavillon arrondi sous le CDI)
  const cx=44, cz=53, rx2=11, rz2=8, pts=[];
  for(let i=0;i<=40;i++){ const t=i/40*Math.PI*2; const c=Math.cos(t), s=Math.sin(t);
    pts.push([cx+rx2*Math.sign(c)*Math.pow(Math.abs(c),0.55), cz+rz2*Math.sign(s)*Math.pow(Math.abs(s),0.55)]); }
  for(let i=0;i<40;i++){ const [xa,za]=pts[i], [xb,zb]=pts[i+1];
    const isDoor = za<cz-rz2+0.6 && zb<cz-rz2+0.6 && (xa+xb)/2>41 && (xa+xb)/2<46;
    if(isDoor){ seg('lime',xa,za,xb,zb,2.6,3.7,0.1,false); continue; }
    seg('lime',xa,za,xb,zb,0,0.9,0.12); seg('glass',xa,za,xb,zb,0.9,3.3,0.03); seg('lime',xa,za,xb,zb,3.3,3.7,0.12,false); }
  const sh=new THREE.Shape(); pts.forEach((p,i)=> i?sh.lineTo(p[0],p[1]):sh.moveTo(p[0],p[1]));
  const fg=new THREE.ShapeGeometry(sh); fg.rotateX(Math.PI/2); fg.translate(0,0.004,0); addG('linoG2',fg);
  B('sofa',36,40,0,.45,50,51); B('sofa',36,36.6,0.45,.9,50,51,false); B('sofa',36,40,0,.45,56,57); B('orange',47,50,0,.45,58,59);
  B('woodInt',42,44,0,.85,52,53.3); for(const z of [52,53.3]) B('steel',42,44,.75,.78,z-.02,z+.02,false);
  B('white',48,51,0,.74,48,49.6); chair(48.6,47.4,0,'pink',1); chair(50.4,47.4,0,'teal',1);
  for(let i=0;i<6;i++) lamp(cx-6+i*2.4,cz,3.65,.45);
  Z('Maison des lycéens',0,33,55,45,61,'mdl');
  // pilotis sous le CDI
  for(let x=31;x<61;x+=6){ B('conc',x-.2,x+.2,0,3.7,42.2,42.6); B('conc',x-.2,x+.2,0,3.7,62.4,62.8); }
  for(let z=48;z<62;z+=6) B('conc',30.2,30.6,0,3.7,z-.2,z+.2);
}
// ---------- bloc A — R+1 ----------
{
  const L=4, yi=CE[1], yo=7.6;
  // CDI
  ext('x',42,30,62,L,yo,yi,-1,'wood',wins(30,62,2.6,3.2,L+0.5,L+3.1));
  ext('z',30,42,63,L,yo,yi,-1,'wood',wins(42,63,2.6,3.0,L+0.5,L+3.1));
  ext('x',63,30,62,L,yo,yi,1,'wood',wins(30,62,2.6,3.2,L+0.5,L+3.1));
  ext('z',62,57,63,L,yo,yi,1,'wood',[{a:58.5,b:61.5,lo:L+.5,hi:L+3.1,glass:true}]);
  wall('z',62,42,57,L,yi,.15,'white',[D(42.3,44.2,L,2.4)],true);
  F('linoG2',30,62,42,63,L);
  for(const x of [33,35.6,38.2,40.8]) { B('shelf',x-.22,x+.22,L,L+1.7,44,51); B('shelf',x-.22,x+.22,L,L+1.7,53,61); }
  B('shelf',30.2,30.6,L,L+1.2,43,62);
  for(let x=45;x<60;x+=3.2) for(let z=45.5;z<61;z+=3){ B('white',x-.8,x+.8,L+.72,L+.76,z-.6,z+.6); B('lime',x-.05,x+.05,L,L+.72,z-.05,z+.05,false);
    chair(x-.4,z-.95,L,'lime',1); chair(x+.4,z-.95,L,'lime',1); chair(x-.4,z+.95,L,'lime',0); chair(x+.4,z+.95,L,'lime',0); }
  B('lime',56,59.5,L,L+1.05,43,44); B('white',55.9,59.6,L+1.05,L+1.1,42.9,44.1);
  B('sofa',44,47,L,L+.45,61.6,62.4);
  lamps(30,62,42,63,yi,3.6);
  Z('CDI — centre de documentation',1,30,62,42,63,'cdi');
  // galerie R+1
  F('linoC',62,112,42,44.5,L); lamps(62,112,42,44.5,yi,4); Z('Galerie R+1',1,62,112,42,44.5,'circ');
  B('glass',64.5,80.5,L,yi,41.98,42.02); for(let x=64.5;x<=80.6;x+=1.6) B('steel',x-.03,x+.03,L,yi,41.95,42.05,false);
  // espace des enseignants
  const ex=[62,72,77.5,83];
  wall('x',44.5,62,112,L,yi,.12,'white',[D(63,64.2,L),D(73,74.2,L),D(78.5,79.7,L),D(84,85.2,L),D(91,92.2,L),D(98,99.2,L),D(105.5,106.7,L)],true);
  wall('z',72,44.5,57,L,yi,.12,'white'); wall('z',77.5,44.5,57,L,yi,.12,'white'); wall('z',83,44.5,57,L,yi,.12,'white');
  F('linoG',62,83,44.5,57,L);
  for(let x=64;x<71;x+=2.6) for(let z=47;z<56;z+=3){ B('woodInt',x-.9,x+.9,L+.72,L+.76,z-.5,z+.5); chair(x,z-.8,L,'dark',1); chair(x,z+.8,L,'dark',0); }
  B('sofa',63,66,L,L+.45,55.6,56.5); lockersZ(71.95,45,56.5,L,-1);
  lamps(62,72,44.5,57,yi); office(72,77.5,44.5,57,L,1); office(77.5,83,44.5,57,L,1);
  Z('Salle des professeurs',1,62,72,44.5,57,'ens'); Z('Espace des enseignants',1,72,83,44.5,57,'ens');
  ext('x',57,62,112,L,yo,yi,1,'wood',wins(62,112,2.4,3.0,L+0.9,L+3.0));
  // administration
  ext('x',35.6,83,112,L,yo,yi,-1,'metalL',wins(83,112,2.4,3.2,L+0.9,L+3.0));
  ext('z',112,35.6,57,L,yo,yi,1,'metalL',wins(35.6,57,2.4,3.2,L+0.9,L+3.0));
  wall('z',83,35.6,42,L,yi,.12,'white',[{a:36.5,b:41.2,lo:L+0.9,hi:L+2.6,glass:true}]);
  wall('x',42,85,112,L,yi,.12,'white',[D(86,87.2,L),D(97,98.2,L),D(105,106.2,L)],true);
  wall('z',85,35.6,42,L,yi,.12,'white'); wall('z',96,35.6,42,L,yi,.12,'white'); wall('z',104,35.6,42,L,yi,.12,'white');
  F('linoC',83,112,35.6,42,L); F('linoC',83,112,44.5,57,L);
  for(let x=87;x<95;x+=2.2){ B('woodInt',x-.9,x+.9,L+.72,L+.76,37.6,39.6); chair(x,37,L,'dark',1); chair(x,40.2,L,'dark',0); }
  lamps(85,96,35.6,42,yi); office(96,104,35.6,42,L,1); office(104,112,35.6,42,L,1);
  wall('z',90,44.5,57,L,yi,.12,'white'); wall('z',97,44.5,57,L,yi,.12,'white'); wall('z',104.5,44.5,57,L,yi,.12,'white');
  office(83,90,44.5,57,L,2); office(90,97,44.5,57,L,2); office(97,104.5,44.5,57,L,1); office(104.5,112,44.5,57,L,1);
  Z('Salle de réunion',1,85,96,35.6,42,'adm'); Z('Direction',1,96,112,35.6,42,'adm');
  Z('Vie scolaire / CPE',1,83,90,44.5,57,'adm'); Z('Secrétariat',1,90,97,44.5,57,'adm'); Z('Proviseur',1,97,104.5,44.5,57,'adm'); Z('Gestion',1,104.5,112,44.5,57,'adm');
}

// ---------- extérieur ----------
// sols
for(const r of sub([[-10,62,22,66],[62,140,58,66]],[[30,62,42,63]])) F('pave',r[0],r[1],r[2],r[3],0);
for(const r of sub([[94,145,22,58]],[[94,107,38,58]])) F('pave',r[0],r[1],r[2],r[3],0);
F('pave',141,147,-62,22,0); F('asph',-12,141,-9,-4,0); F('pave',-12,-10,-9,22,0);
F('asph',100,150,-70,-34,0);
for(let x=103;x<148;x+=2.6){ B('white',x,x+0.1,0,0.006,-69,-64,false); B('white',x,x+0.1,0,0.006,-40,-35,false); }
obj(()=>{ const cr=rng(77), cc=['white','dark','red','blue','steel','cream'];
  for(let i=0;i<22;i++){ const row=i%2, x=104.3+((i/2)|0)*2.6+cr()*0.2, z=row?-37.5:-66.5; if(cr()<.25) continue; const m=cc[(cr()*cc.length)|0];
    B(m,x-0.85,x+0.85,0.3,0.95,z-2.1,z+2.1); B(m,x-0.75,x+0.75,0.95,1.45,z-1.1,z+0.9); B('glass',x-0.76,x+0.76,0.95,1.42,z-1.15,z+0.95,false); B('dark',x-0.9,x+0.9,0,0.35,z-1.6,z+1.6,false); } });
// routes
function road(pts,w){ for(let i=0;i<pts.length-1;i++){ const [xa,za]=pts[i],[xb,zb]=pts[i+1]; const L=Math.hypot(xb-xa,zb-za);
  const g=new THREE.BoxGeometry(L+w*0.5,0.03,w); g.rotateY(-Math.atan2(zb-za,xb-xa)); g.translate((xa+xb)/2,-0.005,(za+zb)/2); addG('asph',g);
  const m=new THREE.BoxGeometry(L,0.035,0.15); m.rotateY(-Math.atan2(zb-za,xb-xa)); m.translate((xa+xb)/2,-0.002,(za+zb)/2); addG('white',m); } }
road([[-180,92],[-60,86],[40,80],[120,66],[170,46],[260,12]],8);
road([[168,48],[166,-60],[170,-200]],8);
road([[141,-6],[166,-6]],6); road([[120,66],[150,26],[147,10]],6);
// logements de fonction
obj(()=>{ const H=[[12,-46],[24,-42],[36,-38],[60,-46],[72,-42],[84,-38]], ang=-0.38;
  for(const [x,z] of H){ rotBox('wood',x,z,8.5,9,0,6.4,ang,true); rotBox('dark',x,z,9.1,9.6,6.4,6.7,ang,false);
    const c=Math.cos(ang), s=Math.sin(ang);
    for(const [u,v] of [[-2,4.52],[2,4.52],[-2,-4.52],[2,-4.52]]) for(const y of [1.6,4.6]){ const gx=x+(u*c+v*s)/S, gz=z+(-u*s+v*c)/S; rotBox('glass',gx,gz,1.6,0.06,y-0.8,y+0.6,ang,false); }
    rotBox('pave',x+5*Math.sin(ang)/S,z+5*Math.cos(ang)/S,6,3,0,0.02,ang,false); } });

// mobilier extérieur / cour
for(const [x,z] of [[10,30],[22,36],[34,30],[46,36],[56,28],[18,26],[40,26]]) bench(x,z,0,2.2);
for(let x=96;x<140;x+=7) B('steel',x,x+0.12,0,1.0,23,23.12,false);
// nom sur la façade
const signTex=(()=>{ const c=document.createElement('canvas'); c.width=2048; c.height=256; const g=c.getContext('2d');
  g.clearRect(0,0,2048,256); g.fillStyle='#ffffff'; g.font='600 150px system-ui, sans-serif'; g.textBaseline='middle'; g.fillText('LYCÉE DU PAYS DE RETZ',20,130);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t; })();
{ const m=new THREE.Mesh(new THREE.PlaneGeometry(24,3),new THREE.MeshBasicMaterial({map:signTex,transparent:true}));
  m.position.set(141.4,9.0,-1); m.rotation.y=Math.PI/2; } // (non utilisé)
const mottoTex=(()=>{ const c=document.createElement('canvas'); c.width=1024; c.height=512; const g=c.getContext('2d');
  const words=[['Liberté',0,90,'#ffffff',96],['Égalité',260,210,'#9ccc3c',130],['Fraternité',40,350,'#ffffff',150],['Liberté',520,450,'#9ccc3c',70],['Égalité',600,90,'#ffffff',70]];
  for(const [w,x,y,col,sz] of words){ g.font=`600 ${sz}px system-ui, sans-serif`; g.fillStyle=col; g.globalAlpha=.9; g.fillText(w,x,y); }
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t; })();

// ---------- détails de vie : affiches, extincteurs, panneaux, poubelles, sacs ----------
const posterTex=(()=>{ const c=document.createElement('canvas'); c.width=1024; c.height=1024; const g=c.getContext('2d');
  const P=[['CLUB THÉÂTRE','Jeudi 12h30 · salle polyvalente','#7b2d8b','#ffd23f'],['BAC 2027','Courage, on y croit !','#1f4e9e','#ffffff'],['SILENCE','au CDI merci','#2a9d8f','#ffffff'],['PORTES OUVERTES','samedi 9h – 13h','#e8742c','#ffffff'],
           ['TOURNOI DE FOOT','inscriptions vie scolaire','#2d7d32','#ffffff'],['ÉLECTIONS CVL','votez !','#c0392b','#ffffff'],['VOYAGE À ROME','réunion d\'information','#d4a017','#1d2a22'],['DON DU SANG','au gymnase · 14 mars','#b71c1c','#ffffff']];
  P.forEach(([t,sub,bg,fg],i)=>{ const x=(i%4)*256, y=((i/4)|0)*512; g.fillStyle='#f4f1ea'; g.fillRect(x,y,256,512); g.fillStyle=bg; g.fillRect(x+12,y+12,232,488);
    g.fillStyle='rgba(255,255,255,.15)'; for(let k=0;k<6;k++){ g.beginPath(); g.arc(x+40+k*40,y+300+Math.sin(k)*60,30+k*6,0,7); g.fill(); }
    g.fillStyle=fg; g.textAlign='center'; let fs=t.length>12?30:40; g.font=`800 ${fs}px system-ui,sans-serif`;
    const words=t.split(' '); words.forEach((w,j)=>g.fillText(w,x+128,y+90+j*(fs+8)));
    g.font='600 17px system-ui,sans-serif'; g.fillText(sub,x+128,y+450); });
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8; return t; })();
MAT.poster.map=posterTex;
function poster(X,y,Zw,face){ // face: normale (+z,-z,+x,-x)
  const i=(CR()*8)|0, g=new THREE.PlaneGeometry(0.6,1.0), uv=g.attributes.uv, u0=(i%4)/4, v0=1-(((i/4)|0)+1)/2;
  for(let k=0;k<uv.count;k++) uv.setXY(k,u0+uv.getX(k)/4,v0+uv.getY(k)/2);
  g.rotateZ((CR()-.5)*0.06); g.rotateY([0,Math.PI,Math.PI/2,-Math.PI/2][face]); g.translate(X,y,Zw); addRaw('poster',g); }
function extinguisher(X,L,Zw){ const g=new THREE.CylinderGeometry(.08,.08,.5,12); g.translate(X,L+0.75,Zw); addRaw('red',g); const h=new THREE.CylinderGeometry(.02,.02,.12,6); h.translate(X,L+1.06,Zw); addRaw('dark',h); }
function exitSign(X,y,Zw,alongX=true){ if(alongX) rawBox('exit',X-.2,X+.2,y,y+.15,Zw-.03,Zw+.03); else rawBox('exit',X-.03,X+.03,y,y+.15,Zw-.2,Zw+.2); }
function bin(X,L,Zw){ const g=new THREE.CylinderGeometry(.22,.19,.7,14,1,true); g.translate(X,L+.35,Zw); addRaw('bin',g); const b=new THREE.CircleGeometry(.19,14); b.rotateX(-Math.PI/2); b.translate(X,L+.01,Zw); addRaw('bin',b); }
{
  // couloirs du bâtiment B (R+1, R+2) : affiches, extincteurs, sacs près des casiers
  for(const k of [1,2]){ const L=LV[k];
    for(let i=0;i<17;i++){ const xa=NX[i]*S, xb=NX[i+1]*S;
      if(i%2===1){ poster((xa+xb)/2-0.9,L+1.55,8*S+0.08,0); poster((xa+xb)/2+0.1,L+1.6,8*S+0.08,0); }
      if(i%4===0){ extinguisher(xa+0.4,L,8*S+0.15); }
      if(CR()<0.45) bag(xa+1+CR()*(xb-xa-2),9*S+CR()*1.2,L);
      if(i%5===2) bin(xa+0.5,L,12*S-0.3);
    }
    exitSign(2*S,L+2.5,8*S+0.08); exitSign(131.8*S,L+2.5,8*S+0.1); exitSign(68.7*S,L+2.6,12*S-0.1); exitSign(6.2*S,L+2.6,12*S-0.1);
  }
  // couloir RDC
  for(let x=70;x<126;x+=7.6){ poster(x*S,1.6,8*S+0.08,0); if(CR()<.5) bag((x+2)*S,9.5*S,0); }
  extinguisher(66*S,0,8*S+0.15); extinguisher(127*S,0,11*S-0.15); exitSign(64*S,2.6,11*S-0.1);
  // préau : sacs autour des bancs, poubelles
  for(const [x,z] of [[66,33],[67,34.2],[78,32],[71,39],[64,25],[75.5,24.5],[79,36.8],[69,30]]) bag(x*S+(CR()-.5),z*S+(CR()-.5),0);
  bin(63*S,0,31*S); bin(82*S,0,26*S); bin(70*S,0,41.5*S);
  for(const [x,z] of [[63,20],[81,20],[63,40],[81,40]]) bag(x*S,z*S,4);
  // hall
  poster(83*S+0.1,1.6,24*S,2); poster(83*S+0.1,1.6,26*S,2); exitSign(94*S-0.1,2.9,27.5*S,false);
  // self : bacs du self et piles de plateaux
  obj(()=>{ for(let x=18.4;x<32.6;x+=1.0){ B(['orange','lime','yellow','trunk','red','cream'][Math.floor(x)%6],x,x+0.8,0.9,0.95,9.2,9.75,false); } });
  for(let i=0;i<14;i++) rawBox(i%2?'tray':'trayB',16*S,16*S+0.46,0.0+i*0.03,0.02+i*0.03,10*S,10*S+0.34);
  for(let i=0;i<18;i++){ const x=38+CR()*22, z=-2+CR()*22; if(CR()<.3) bag(x*S,z*S,0); }
  bin(36.5*S,0,21*S); bin(61*S,0,9.5*S); exitSign(62*S-0.1,2.6,15*S,false);
  // CDI : livres et cahiers sur les tables
  for(let x=45;x<60;x+=3.2) for(let z=45.5;z<61;z+=3){ if(CR()<.7) notebook(x*S+(CR()-.5),z*S+(CR()-.5)*0.6,4.76); if(CR()<.35) bag(x*S+(CR()-.5)*2,z*S+1.4,4); }
  // galerie R+1 et RDC du bloc A
  for(let x=64;x<110;x+=6){ poster(x*S,LV[1]+1.6,44.5*S-0.08,1); if(CR()<.3) bag(x*S+1,43*S,LV[1]); }
  for(let x=64;x<92;x+=6){ poster(x*S,1.6,44.5*S-0.08,1); }
}
// ---------- merge ----------
function worldUV(g,s){ const p=g.attributes.position, n=g.attributes.normal, uv=new Float32Array(p.count*2);
  for(let i=0;i<p.count;i++){ const ax=Math.abs(n.getX(i)), ay=Math.abs(n.getY(i)), az=Math.abs(n.getZ(i)); let u,v;
    if(ay>=ax&&ay>=az){u=p.getX(i);v=p.getZ(i);} else if(ax>=az){u=p.getZ(i);v=p.getY(i);} else {u=p.getX(i);v=p.getY(i);}
    uv[i*2]=u/s; uv[i*2+1]=v/s; }
  g.setAttribute('uv',new THREE.BufferAttribute(uv,2)); }
const staticGroup=new THREE.Group(); scene.add(staticGroup); const GLASS={mesh:null,orig:null};
for(const k in bins){
  const keepUV=OWNUV.has(k);
  const gs=bins[k].map(g=>{ const o=new THREE.BufferGeometry(); o.setAttribute('position',g.attributes.position); o.setAttribute('normal',g.attributes.normal); if(keepUV) o.setAttribute('uv',g.attributes.uv); return o; });
  const merged=mergeGeometries(gs,false); if(!keepUV) worldUV(merged,TXS[k]||2);
  const mesh=new THREE.Mesh(merged,MAT[k]); mesh.castShadow=!NOSHADOW.has(k); mesh.receiveShadow=!(k==='glass'||k==='glassR');
  if(k==='glass'||k==='glassR') mesh.renderOrder=2;
  if(k==='glass'){ let off=0; const starts=bins[k].map(g=>{ const o=off; off+=g.attributes.position.count; return o; });
    for(const p of panes){ p.start=starts[p.gi]; p.count=bins[k][p.gi].attributes.position.count; }
    GLASS.mesh=mesh; GLASS.orig=merged.attributes.position.array.slice(); }
  staticGroup.add(mesh);
}
// devise sur le vitrage d'entrée
{ const m=new THREE.Mesh(new THREE.PlaneGeometry(7.5,3.75),new THREE.MeshBasicMaterial({map:mottoTex,transparent:true,depthWrite:false,side:THREE.DoubleSide}));
  m.position.set(94*S+0.08,2.1,34*S); m.scale.set(S,1,1); m.rotation.y=Math.PI/2; m.renderOrder=3; scene.add(m); }

// sol + étang + ciel
const grassMat=M({map:TX.grass.clone()}); grassMat.map.needsUpdate=true; grassMat.map.repeat.set(140,140); grassMat.normalMap=normalFrom(TX.grass,1.4); grassMat.normalMap.repeat.set(140,140);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(1100,1100),grassMat); ground.rotation.x=-Math.PI/2; ground.position.set(60*S,-0.03,0); ground.receiveShadow=true; scene.add(ground);
{ const sh=new THREE.Shape(); for(let i=0;i<=48;i++){ const t=i/48*Math.PI*2; const r=1+0.12*Math.sin(t*3)+0.08*Math.cos(t*5); const x=(-100+36*r*Math.cos(t))*S, z=(-20+70*r*Math.sin(t))*S; i?sh.lineTo(x,z):sh.moveTo(x,z); }
  const g=new THREE.ShapeGeometry(sh); g.rotateX(Math.PI/2);
  const water=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:'#4c7b8f',roughness:.08,metalness:.3,side:THREE.DoubleSide})); water.position.y=-0.01; scene.add(water); }
const skyU={top:{value:new THREE.Color('#5d9ad6')},bot:{value:new THREE.Color('#dfeaf0')}};
const sky=new THREE.Mesh(new THREE.SphereGeometry(900,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:skyU,
  vertexShader:'varying vec3 vp; void main(){ vp=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader:'uniform vec3 top; uniform vec3 bot; varying vec3 vp; void main(){ float h=clamp(vp.y*1.6+0.05,0.0,1.0); gl_FragColor=vec4(mix(bot,top,pow(h,0.7)),1.0); }'}));
scene.add(sky);
scene.fog=new THREE.Fog('#dfeaf0',220,900);

// arbres (instanciés)
{
  const T=[]; const r=rng(99);
  const line=(xa,za,xb,zb,sp,j=2)=>{ const L=Math.hypot(xb-xa,zb-za), n=Math.floor(L/sp); for(let i=0;i<=n;i++) T.push([xa+(xb-xa)*i/n+(r()-.5)*j, za+(zb-za)*i/n+(r()-.5)*j, 0.8+r()*0.6]); };
  line(-40,-62,135,-62,6); line(-45,-60,-45,30,6); line(-40,74,30,70,5,3); line(40,88,130,72,7,3); line(176,-150,178,40,8); line(156,-150,157,-74,8);
  line(-12,-12,140,-12,9,1.5); line(150,30,240,0,9);
  for(const p of [[8,40],[26,42],[44,38],[15,32],[52,30],[120,62],[118,40],[132,50],[124,30],[116,63],[-20,40],[-25,10],[-30,55]]) T.push([p[0],p[1],0.9+r()*0.4]);
  for(let i=0;i<60;i++){ const a=r()*Math.PI*2, d=60+r()*30; T.push([-100+Math.cos(a)*42*(1+r()*.3), -20+Math.sin(a)*78*(1+r()*.2), 0.8+r()*.6]); }
  const tg=new THREE.CylinderGeometry(0.18,0.28,3.2,6); tg.translate(0,1.6,0);
  const cg=new THREE.IcosahedronGeometry(2.6,1); cg.translate(0,5.2,0);
  const tm=new THREE.InstancedMesh(tg,MAT.trunk,T.length), cm=new THREE.InstancedMesh(cg,new THREE.MeshStandardMaterial({roughness:.95,flatShading:true}),T.length);
  const m4=new THREE.Matrix4(), q=new THREE.Quaternion(), col=new THREE.Color();
  T.forEach(([x,z,s],i)=>{ x*=S; z*=S; q.setFromAxisAngle(new THREE.Vector3(0,1,0),r()*6); m4.compose(new THREE.Vector3(x,0,z),q,new THREE.Vector3(s,s*(0.9+r()*0.4),s)); tm.setMatrixAt(i,m4); cm.setMatrixAt(i,m4);
    col.setHSL(0.24+r()*0.07,0.38+r()*0.2,0.25+r()*0.12); cm.setColorAt(i,col); addBox(x-.3,x+.3,0,3,z-.3,z+.3); });
  tm.castShadow=cm.castShadow=true; scene.add(tm,cm);
}

// lumières
const hemi=new THREE.HemisphereLight('#ffffff','#d6d1c4',1.25); scene.add(hemi);
const amb=new THREE.AmbientLight('#ffffff',0.55); scene.add(amb);
const sun=new THREE.DirectionalLight('#fff4e0',2.4); sun.position.set(66*S-46,110,22*S+80); sun.target.position.set(66*S,0,22*S);
sun.castShadow=true; sun.shadow.mapSize.set(isTouch?2048:4096,isTouch?2048:4096);
Object.assign(sun.shadow.camera,{left:-150,right:150,top:120,bottom:-120,near:10,far:320}); sun.shadow.bias=-0.0004; sun.shadow.normalBias=0.04;
scene.add(sun,sun.target);