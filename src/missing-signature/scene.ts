import * as THREE from 'three';
import { canonicalFrame } from './clock.ts';
import film from '../../examples/the-missing-signature/film.json';
import captions from '../../examples/the-missing-signature/display-captions.json';

type StudioWindow = Window & {studio: {renderAt:(frame:number)=>void;inspect:()=>unknown;dispose:()=>void}; __hf?: {buildReady?:Record<string,Promise<void>>}; __timelines?:Record<string,{kill:()=>void}>};
const win=window as unknown as StudioWindow;
const el=(id:string)=>document.getElementById(id)!;
const root=el('film');
const offset=Number(root.dataset.sourceOffset||0);
const isProof=root.dataset.proof==='true';
const mapping: {at:number;duration:number;source:number;sourceEnd:number}[]=JSON.parse(root.dataset.sourceMap||'[]');
const canvas=el('world') as HTMLCanvasElement;
// Present completed GPU frames atomically to the capture surface. Native screenshot
// capture can otherwise observe a partially updated WebGL default framebuffer.
canvas.width=1080;canvas.height=1920;
const presentation=canvas.getContext('2d',{alpha:false})!;
const renderer=new THREE.WebGLRenderer({canvas:document.createElement('canvas'),antialias:true,alpha:false,preserveDrawingBuffer:true});
renderer.setPixelRatio(1);renderer.setSize(1080,1920,false);
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
const world=new THREE.Scene();world.background=new THREE.Color('#070B14');world.fog=new THREE.Fog('#070B14',18,40);
const camera=new THREE.PerspectiveCamera(38,1080/1920,.1,100);
world.add(new THREE.HemisphereLight(0xa8e4f2,0x111725,2.2));
const key=new THREE.DirectionalLight(0xc6f2ff,4);key.position.set(-5,9,8);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.bias=-.001;key.shadow.normalBias=.035;world.add(key);
const rim=new THREE.DirectionalLight(0x74b8c6,3);rim.position.set(6,3,-4);world.add(rim);
const warm=new THREE.PointLight(0xe0a96b,35,16,2);warm.position.set(3,0,4);world.add(warm);
const metal=new THREE.MeshStandardMaterial({color:'#28404f',metalness:.65,roughness:.33});
const dark=new THREE.MeshStandardMaterial({color:'#101e2b',metalness:.45,roughness:.55});
const pale=new THREE.MeshStandardMaterial({color:'#74b8c6',emissive:'#74b8c6',emissiveIntensity:.5,metalness:.2,roughness:.45});
const amber=new THREE.MeshStandardMaterial({color:'#E0A96B',emissive:'#E0A96B',emissiveIntensity:.7});
const ground=new THREE.Mesh(new THREE.PlaneGeometry(70,70),new THREE.MeshStandardMaterial({color:'#111d2c',roughness:.55,metalness:.3}));ground.rotation.x=-Math.PI/2;ground.position.y=-3.8;ground.receiveShadow=true;world.add(ground);
const groups:THREE.Group[]=[];
const box=(g:THREE.Group,x:number,y:number,z:number,w:number,h:number,d:number,mat:THREE.Material=metal)=>{
 const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;
};
const edge=(g:THREE.Group,m:THREE.Mesh,color=0x74b8c6)=>{const e=new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry),new THREE.LineBasicMaterial({color,transparent:true,opacity:.6}));e.position.copy(m.position);e.rotation.copy(m.rotation);g.add(e);};
const group=()=>{const g=new THREE.Group();world.add(g);groups.push(g);return g;};
function door(){const g=group();box(g,0,0,0,4.4,6.6,.8,dark);for(const x of [-2.25,2.25])box(g,x,0,.4,.24,7,.6,metal);for(const y of [-3.4,3.4])box(g,0,y,.4,4.75,.24,.6,metal);for(const x of [-1.06,1.06]){const m=box(g,x,0,.6,2.02,6.25,.25,metal);edge(g,m,0x37606c);for(let k=0;k<3;k++)box(g,x,-2+k*2,.82,1.7,.035,.04,dark);}box(g,0,0,.82,.032,6.24,.05,pale);box(g,1.2,0,.87,.6,.9,.15,dark);box(g,1.2,.18,.97,.35,.04,.02,amber);box(g,2.5,-1,-.05,.3,.65,.48,amber);return g;}
door();door();
// S03: spatial investigation graph, with local illustrative archive leaves.
{const g=group();const points:THREE.Vector3[]=[];for(let i=0;i<12;i++){const x=(i%3-1)*2,y=(Math.floor(i/3)-1.5)*1.3,z=(i%2)*.8;points.push(new THREE.Vector3(x,y,z));const n=new THREE.Mesh(new THREE.IcosahedronGeometry(i===7?.2:.09,1),i===7?amber:pale);n.position.copy(points[i]);g.add(n);}for(let i=1;i<12;i++){const geo=new THREE.BufferGeometry().setFromPoints([points[Math.floor((i-1)/2)],points[i]]);g.add(new THREE.Line(geo,new THREE.LineBasicMaterial({color:0x376675})));}for(let i=0;i<3;i++){const m=box(g,1.3+i*.16,-1.6+i*.1,1.2+i*.08,1.5,1.9,.035,dark);edge(g,m);}}
// S04: separate claim checks.
{const g=group();for(let i=0;i<4;i++){const m=box(g,(i%2-.5)*2.25,(.5-Math.floor(i/2))*1.65,0,2,1.4,.16,dark);edge(g,m);box(g,m.position.x-.8,m.position.y,.12,.035,1,.025,amber);}}
// S05: three glass-like orthogonal panes, each independently modelled.
{const g=group();for(let i=0;i<3;i++){const glass=new THREE.MeshPhysicalMaterial({color:i===2?'#6d4f2d':'#5799ac',metalness:.1,roughness:.18,transparent:true,opacity:.28,side:THREE.DoubleSide,depthWrite:false});const m=box(g,(i-1)*1.65,0,(i-1)*-.45,1.4,3.8,.08,glass);edge(g,m,i===2?0xe0a96b:0x74b8c6);if(i<2)for(let k=0;k<5;k++)box(g,(i-1)*1.65,.9-k*.42,m.position.z+.07,.9,.04,.02,pale);}}
// S06: repeated rejected local lookups; no genuine identities.
{const g=group();for(let i=0;i<14;i++){const m=box(g,(i%2?1:-1)*2,(i%3-1)*1.35,-Math.floor(i/2)*1.25,1.7,.9,.08,dark);edge(g,m,0x743f45);}}
// S07: tactile desk and keyboard, without depicting the researcher.
let pressedKey:THREE.Mesh;
{const g=group();box(g,0,-2.25,0,8,.25,5,dark);box(g,0,-1.95,.7,4.2,.3,1.5,metal);for(let r=0;r<4;r++)for(let c=0;c<12;c++){const m=box(g,(c-5.5)*.31,-1.73,.25+r*.29,.25,.12,.23,c===11&&r===3?amber:dark);if(c===11&&r===3)pressedKey=m;}box(g,0,.3,-1.2,5.4,2.9,.14,dark);box(g,0,.3,-1.1,5.1,2.6,.03,new THREE.MeshStandardMaterial({color:'#08121b',roughness:.8}));box(g,0,-1.55,-1.2,.3,.9,.3,metal);}
// S08: the same room, now still, with the bounded query result in DOM.
{const g=group();for(const x of [-3.2,3.2]){box(g,x,0,0,.12,7,3,dark);box(g,x,0,1.55,.03,5,.03,pale);}box(g,0,-3.5,0,6.5,.1,4,dark);}
// S09 proof architecture: exactly 17 towers, not a statistical chart.
let towers:THREE.InstancedMesh;
{const g=group();towers=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),metal,17);towers.castShadow=true;towers.receiveShadow=true;const obj=new THREE.Object3D();for(let i=0;i<17;i++){const row=Math.floor(i/4),col=i%4;const h=2.5+(i*7%5)*.42;obj.position.set((col-1.5)*1.6,-3.7+h/2,-row*2.05);obj.scale.set(1.15,h,1.15);obj.updateMatrix();towers.setMatrixAt(i,obj.matrix);for(let j=0;j<5;j++)box(g,obj.position.x,-3.1+j*.39,obj.position.z+.59,.87,.024,.025,pale);}g.add(towers);}
// S10: a report object, not an email screenshot.
{const g=group();const m=box(g,0,0,0,4.5,2.8,.15,metal);edge(g,m);const geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-2.2,1.3,.1),new THREE.Vector3(0,-.4,.1),new THREE.Vector3(2.2,1.3,.1)]);g.add(new THREE.Line(geo,new THREE.LineBasicMaterial({color:0x74b8c6})));}
door();door();
const titles=['A LOCKED\nFRONT DOOR.','ANOTHER\nENTRANCE.','AN AI\nFOUND A LEAD.','TEN DAYS.\nONE CHECK AT A TIME.','THE MISSING\nSIGNATURE.','EVERY USER\nWAS REJECTED.','ONE HUMAN\nHUNCH.','A VERY\nINTERESTING ONE.','THE SCALE\nBEHIND IT.','A RESPONSIBLE\nDISCLOSURE.','THE ENDPOINT\nWAS RESTRICTED.','WHO VERIFIED\nTHE SIGNATURE?'];
const subtitles=['VPN REQUIRED','PUBLIC API','ANTARES · AUG 25, 2026','TENANT / AUDIENCE / APP ID / USER','HEADER / PAYLOAD / SIGNATURE','USER NOT FOUND','LOCAL USER LOOKUP','BOUNDED PROOF · SELECT 1','17 CONNECTED ANALYTICS DATABASES','MSRC · REPORTED SEP 05','SEP 09 RESTRICTED · SEP 17 AWARD','VERIFY THE PROOF OF IDENTITY'];

let state:Record<string,unknown>={};
const smooth=(x:number)=>{x=Math.min(1,Math.max(0,x));return x*x*(3-2*x);};
function sourceTime(t:number){const cut=mapping.find(x=>t>=x.at&&t<x.at+x.duration);return Math.min(film.duration-1/30,Math.max(0,cut?Math.min(cut.source+t-cut.at,cut.sourceEnd-1/30):t+offset));}
function renderAt(frame:number){
 const t=sourceTime(frame/30);const i=Math.max(0,film.shots.findIndex(s=>t>=s.start&&t<s.end));const shot=film.shots[i];const p=Math.min(1,Math.max(0,(t-shot.start)/(shot.end-shot.start)));const e=smooth(p);
 for(let k=0;k<groups.length;k++){groups[k].visible=k===i;groups[k].rotation.set(0,0,0);groups[k].position.set(0,0,0);}
 camera.position.set(0,1,15);camera.lookAt(0,0,0);warm.intensity=[1,6,8].includes(i)?45:16;
 if(i===0||i===11){camera.position.set(.15,.45,14.5-(i===0?.45*e:0));camera.lookAt(0,0,0);}
 if(i===1){camera.position.set(3+3*e,.8,13.4);camera.lookAt(.5,0,0);}
 if(i===2){camera.position.set(.9-.5*e,.8,13.5-.5*e);camera.lookAt(0,0,0);}
 if(i===3){camera.position.set((e-.5)*1.3,.5,14);camera.lookAt(0,0,0);}
 if(i===4){camera.position.set(-1.2+2.4*e,.7,13.5);camera.lookAt(0,0,0);}
 if(i===5){camera.position.set(0,.4,14-e*1.2);camera.lookAt(0,0,-2);}
 if(i===6){camera.position.set(.4,3,13.5-.3*e);camera.lookAt(0,-.4,0);pressedKey!.position.y=-1.73-(t>=film.adminRevealSeconds&&t<film.adminRevealSeconds+.16?.07:0);}
 if(i===7){camera.position.set(0,.4,14.3-.15*e);camera.lookAt(0,0,0);}
 if(i===8){camera.position.set(2.5+e*2,5+e*3,12+e*6);camera.lookAt(0,-.3,-3);}
 if(i===9){camera.position.set(.5,.7,12.5+e);camera.lookAt(0,0,0);}
 if(i===10){camera.position.set(-1+e*2,.5,14.7);camera.lookAt(0,0,0);}
 el('shot-number').textContent=`${String(i+1).padStart(2,'0')} / 12`;
 el('headline').textContent=titles[i];el('subtitle').textContent=subtitles[i];
 for(const id of ['admin','result','scale','claims','dates','archive','rejection','report'])el(id).style.display='none';
 if(i===2)el('archive').style.display='block';
 if(i===4)el('claims').style.display='block';
 if(i===5)el('rejection').style.display='block';
 if(i===6){el('admin').style.display='block';el('admin-word').textContent=t>=film.adminRevealSeconds?'admin':'_';el('admin-word').style.color=t>=film.adminRevealSeconds?'#E0A96B':'#74B8C6';}
 if(i===7)el('result').style.display='block';
 if(i===8)el('scale').style.display='block';
 if(i===9)el('report').style.display='block';
 if(i===10)el('dates').style.display='block';
 const cue=captions.find(c=>t>=c.start&&t<c.end);
 el('caption').textContent=cue?.text||'';
 el('caption').style.opacity=cue?'1':'0';
 renderer.render(world,camera);renderer.getContext().finish();presentation.drawImage(renderer.domElement,0,0);
 state={frame,sourceTime:t,shot:shot.id,progress:p,caption:cue?.id||null,towerCount:towers.count,camera:camera.position.toArray(),proof:isProof,sourceOffset:offset};
}
async function prepare(){await document.fonts.ready;for(const name of ['Oswald','IBM Plex Mono','Signature Caption'])await document.fonts.load(`52px "${name}"`);camera.position.set(0,1,15);camera.lookAt(0,0,0);renderer.render(world,camera);renderer.getContext().finish();await renderer.compileAsync(world,camera);renderAt(0);renderer.render(world,camera);renderer.getContext().finish();win.studio={renderAt,inspect:()=>state,dispose:()=>{win.__timelines?.[root.dataset.compositionId!]?.kill();renderer.dispose();}};}
win.__hf??={};win.__hf.buildReady??={};win.__hf.buildReady['signature-three-scene']=prepare();
window.addEventListener('hf-seek',event=>{const time=(event as CustomEvent<{time:number}>).detail.time;renderAt(canonicalFrame(time,30,Math.round(Number(root.dataset.duration)*30)));});
