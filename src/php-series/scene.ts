import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {BokehPass} from 'three/addons/postprocessing/BokehPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {stateAt, type FilmClock} from './state.ts';

type Film=FilmClock&{id:string;title:string;cve:string;episodeNumber:number;frameCount:number};
type Caption={id:string;start:number;end:number;text:string};
type Win=Window&{studio?:{renderAt:(f:number)=>void;inspect:()=>unknown;dispose:()=>void};__hf?:{buildReady?:Record<string,Promise<void>>};__timelines?:Record<string,{kill:()=>void}>};
export function createFilm(film:Film,captions:Caption[]) {
 const win=window as Win, el=(id:string)=>document.getElementById(id)!;
 const canvas=el('world') as HTMLCanvasElement;canvas.width=1080;canvas.height=1920;
 const presentation=canvas.getContext('2d',{alpha:false})!;
 const renderer=new THREE.WebGLRenderer({canvas:document.createElement('canvas'),antialias:true,preserveDrawingBuffer:true});
 renderer.setSize(1080,1920);renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 const world=new THREE.Scene();world.background=new THREE.Color('#070B14');world.fog=new THREE.FogExp2('#070B14',.012);
 const camera=new THREE.PerspectiveCamera(35,1080/1920,.1,100);
 world.add(new THREE.HemisphereLight('#aec5d4','#152335',2.1));
 const key=new THREE.SpotLight('#cfdee5',1350,70,.58,.65,1.8);key.position.set(-7,14,9);key.target.position.set(0,0,0);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.bias=-.0002;key.shadow.normalBias=.035;world.add(key,key.target);
 const rim=new THREE.DirectionalLight('#74B8C6',3);rim.position.set(5,6,-7);world.add(rim);
 const fill=new THREE.PointLight('#E0A96B',130,23,1.8);fill.position.set(4,4,3);world.add(fill);
 const mat=(color:string,metalness=.7,roughness=.3)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
 const metal=mat('#476372',.85,.28), dark=mat('#132532',.65,.4), edgeMat=mat('#7b8e98',.85,.24), black=mat('#09121b',.3,.48);
 const cyan=new THREE.MeshStandardMaterial({color:'#74B8C6',emissive:'#528e9e',emissiveIntensity:.45,metalness:.5,roughness:.22});
 const amber=new THREE.MeshStandardMaterial({color:'#E0A96B',emissive:'#b8783b',emissiveIntensity:.5,metalness:.4,roughness:.28});
 const red=new THREE.MeshStandardMaterial({color:'#C85A5A',emissive:'#b03535',emissiveIntensity:.7,metalness:.3,roughness:.3});
 const baseGeo=new RoundedBoxGeometry(1,1,1,3,.055);
 const meshes:THREE.Mesh[]=[];
 function box(x:number,y:number,z:number,w:number,h:number,d:number,m:THREE.Material=metal){const o=new THREE.Mesh(baseGeo,m);o.position.set(x,y,z);o.scale.set(w,h,d);o.castShadow=true;o.receiveShadow=true;world.add(o);meshes.push(o);return o;}
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(160,160),mat('#0b141e',.28,.45));floor.rotation.x=-Math.PI/2;floor.position.y=-.9;floor.receiveShadow=true;world.add(floor);
 // One machined worker chassis; every shot preserves this identity.
 box(0,-.35,0,7.8,.5,5.8,dark);box(0,-.06,0,7.35,.14,5.35,metal);box(0,.06,0,6.75,.14,4.72,black);
 for(const x of [-3.75,3.75]){box(x,.25,0,.16,.7,5.6,edgeMat);for(let k=0;k<7;k++)box(x,.55,-2.1+k*.7,.19,.035,.3,dark);}
 for(const z of [-2.75,2.75])box(0,.25,z,7.45,.7,.15,edgeMat);
 for(const x of [-3.45,3.45])for(const z of [-2.45,2.45]){
  const bolt=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,.07,16),edgeMat);bolt.position.set(x,.32,z);world.add(bolt);
  box(x,.36,z,.15,.015,.025,dark);
 }
 // Request-owned memory tray, individual allocations and their retained outlines.
 const cells:THREE.Mesh[]=[],outlines:THREE.LineSegments[]=[],stripes:THREE.Mesh[][]=[];
 for(let i=0;i<24;i++){
  const x=(i%6-2.5)*.96,z=(Math.floor(i/6)-1.5)*1.02;
  box(x,.18,z,.84,.1,.88,dark);
  const c=box(x,.38,z,.74,.28,.76,cyan);cells.push(c);
  const outline=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(.8,.42,.82)),new THREE.LineBasicMaterial({color:'#92a5af',transparent:true,opacity:.42}));outline.position.set(x,.4,z);world.add(outline);outlines.push(outline);
  stripes.push(Array.from({length:3},(_,j)=>box(x-.22+j*.22,.545,z,.11,.012,.44,black)));
 }
 const target=cells[17].position.clone();target.y=.55;
 const registerParts=[box(-2.5,.85,-2.7,2,.66,.55,dark),box(-2.5,1.2,-2.7,1.85,.04,.38,edgeMat)];
 for(let i=0;i<5;i++)registerParts.push(box(-3.15+i*.32,.85,-2.4,.2,.18,.02,cyan));
 const regPoint=new THREE.Vector3(-1.55,.87,-2.4);
 const refCurve=new THREE.CatmullRomCurve3([regPoint,new THREE.Vector3(-.8,1.0,-1.4),new THREE.Vector3(target.x,1.1,target.z),target]);
 const reference=new THREE.Mesh(new THREE.TubeGeometry(refCurve,48,.026,8,false),amber);world.add(reference);
 const refPulse=new THREE.Mesh(new THREE.SphereGeometry(.09,16,12),amber);world.add(refPulse);
 const exitCurve=new THREE.CatmullRomCurve3([target,new THREE.Vector3(target.x,2.5,target.z),new THREE.Vector3(-2.8,2.4,0),new THREE.Vector3(-3,.78,0)]);
 const exitPath=new THREE.Mesh(new THREE.TubeGeometry(exitCurve,48,.023,8,false),amber);world.add(exitPath);
 const exitPulse=new THREE.Mesh(new THREE.SphereGeometry(.11,16,12),amber);world.add(exitPulse);
 const incoming=box(5,1.1,0,.52,.15,.8,amber);
 const incomingMarks:THREE.Mesh[]=[];for(let i=0;i<3;i++)incomingMarks.push(box(5,1.19,-.22+i*.22,.3,.015,.04,black));
 const gateway=new THREE.Mesh(new THREE.TorusGeometry(.56,.07,12,48),metal);gateway.position.set(3.8,1.1,0);gateway.rotation.y=Math.PI/2;world.add(gateway);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.62,.025,10,64),red);ring.rotation.x=-Math.PI/2;ring.position.copy(target);ring.position.y=.73;world.add(ring);
 const scanner=box(-3,.78,0,.07,.02,4.15,amber);
 // A broken line expresses a possible consequence, not a successful exploit recording.
 const risk=new THREE.Group();world.add(risk);for(let i=0;i<8;i++){
  const p=new THREE.Mesh(new THREE.BoxGeometry(.07,.07,.18),red);p.position.set(3.2,1+i*.13,.5+i*.22);risk.add(p);
 }
 // Finite cone integrates density along view-facing height: illustrative volumetric light.
 const beamMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
  uniforms:{tint:{value:new THREE.Color('#75a7b8')}},vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'varying vec2 vUv;uniform vec3 tint;void main(){float side=pow(max(0.,sin(vUv.x*3.14159265)),3.);float a=side*pow(1.-vUv.y,2.)*.035;gl_FragColor=vec4(tint,a);}'});
 const beam=new THREE.Mesh(new THREE.ConeGeometry(4,15,40,1,true),beamMat);beam.position.set(-2,6,1);beam.rotation.z=-.2;world.add(beam);
 const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(world,camera));
 const bokeh=new BokehPass(world,camera,{focus:25,aperture:.00015,maxblur:.004});composer.addPass(bokeh);composer.addPass(new OutputPass());
 const focusUniforms=bokeh.uniforms as Record<string,{value:number}>;
 composer.setSize(1080,1920);
 const headings=film.episode==='oom'?[
  "YOUR CODE\nHASN'T STARTED.","STILL BEING\nINITIALIZED.","AN EXIT.\nNOT A CLEANUP.","UNFINISHED.\nTREATED AS VALID.","CODE EXECUTION.\nWORKER PERMISSIONS.","PATCH THE\nRUNTIME."]:[
  "THE REQUEST\nIS GONE.","ONE WORKER.\nTWO LIFETIMES.","MEMORY FREED.\nREFERENCE RETAINED.","A NEW REQUEST.\nAN OLD REFERENCE.","USE\nAFTER FREE.","RESET STATE.\nEND THE LIFETIME."];
 const subtitles=film.episode==='oom'?[
  'PHP processes input before the application starts.', 'A request allocation can fail mid-initialization.', 'The old OOM path abandons unfinished work.', 'Cleanup reaches data left in an invalid state.', 'Unauthenticated RCE is a conditional outcome.', 'Update PHP. Verify the running service.'
 ]:[
  'Its pointer is still there.', 'Request-owned memory. Worker-wide state.', 'Free ends ownership; it does not erase a reference.', 'An early operation runs before the normal reset.', 'Invalid access can become remote code execution.', 'Patch PHP and restart affected workers.'
 ];
 const phases=film.episode==='oom'?['INPUT PARSING','PARTIAL INITIALIZATION','OOM / EARLY EXIT','UNSAFE CLEANUP','CONDITIONAL RCE','CORRECTED PATH']:['STALE REFERENCE','REQUEST A / ALLOCATE','REQUEST A / RELEASE','REQUEST B / EARLY ACCESS','USE-AFTER-FREE','CORRECTED LIFECYCLE'];
 let inspection:Record<string,unknown>={};
 const smooth=(v:number)=>{v=THREE.MathUtils.clamp(v,0,1);return v*v*(3-2*v);};
 function renderAt(frame:number){
  const st=stateAt(film,frame),t=st.frame/film.fps,p=st.progress,i=st.index,e=smooth(p),oom=film.episode==='oom';
  for(let j=0;j<24;j++){
   const c=cells[j];c.visible=true;c.material=cyan;c.scale.y=.28;c.position.y=.38;
   outlines[j].visible=true;
   if(oom&&i<5){const active=i===0?8:i===1?Math.min(23,8+Math.floor(p*19)):23;c.visible=j<active;c.material=j===17?amber:cyan;}
  }
  if(st.partial){cells[17].visible=true;cells[17].scale.y=.14;cells[17].position.y=.31;cells[17].material=st.invalidAccess?red:amber;}
  if(st.allocationFailed)cells[22].visible=false;
  if(!oom){cells[17].visible=!st.freed;cells[17].material=i===2?amber:cyan;if(i===5&&p>.65)cells[17].visible=false;}
  reference.visible=!oom&&st.referenceRetained;reference.material=st.invalidAccess?red:amber;
  refPulse.visible=reference.visible;refPulse.position.copy(refCurve.getPointAt(i===3?smooth(p):(.2+.75*p)%1));refPulse.material=st.invalidAccess?red:amber;
  registerParts.forEach(m=>m.visible=!oom);
  stripes.forEach((row,j)=>row.forEach(m=>{m.visible=cells[j].visible;m.position.y=cells[j].position.y+cells[j].scale.y/2+.012;}));
  incoming.visible=i===0&&oom||i===1&&!oom||i===3&&!oom;
  incoming.position.set(5.3-6.8*e,1.1,0);
  incomingMarks.forEach((m,k)=>{m.visible=incoming.visible;m.position.set(incoming.position.x,1.19,-.22+k*.22);});
  exitPath.visible=oom&&i===2;exitPulse.visible=exitPath.visible;exitPulse.position.copy(exitCurve.getPointAt(smooth(p)));
  scanner.visible=oom&&i===3;scanner.position.x=-3.1+5.65*Math.min(1,p/.28);
  ring.visible=st.invalidAccess;const pulse=1+.1*Math.sin(p*8);ring.scale.setScalar(pulse);ring.material=red;
  risk.visible=i===4;fill.intensity=i===4?170:110;
  // Camera never rotates freely: each move reveals a specified relationship.
  const look=new THREE.Vector3(0,.3,0);let position=new THREE.Vector3(10,14,24);
  if(i===0){position.set(8.5-e*.7,12-e,22-e*1.4);if(!oom){look.copy(target);position.copy(target).add(new THREE.Vector3(3.8,5.5,10-e*.3));}}
  if(i===1){const a=(oom?.37:.5)-e*.15;position.set(Math.sin(a)*26,13,Math.cos(a)*26);look.set(0,.4,-.2);}
  if(i===2){position.set(7-e*1.3,10,19-e*.5);look.copy(target).multiplyScalar(.35);}
  if(i===3){look.copy(target).add(new THREE.Vector3(-.4,.05,0));position.copy(target).add(new THREE.Vector3(4-e*.6,6,11-e*.5));}
  if(i===4){position.set(6+e*2,10+e*2,19+e*2);look.set(.4,.5,0);}
  if(i===5){position.set(8-p*2,12+p,22+p*3);look.set(0,.4,0);}
  camera.position.copy(position);camera.lookAt(look);camera.updateMatrixWorld();
  const focusPoint=i===3?regPoint.clone().lerp(target,e):look;
  focusUniforms.focus.value=camera.position.distanceTo(focusPoint);
  focusUniforms.aperture.value=i===3?.00022:.00010;
  focusUniforms.maxblur.value=.004;
  const anchor=target.clone().project(camera);const tag=el('memory-label');tag.style.left=`${Math.max(110,Math.min(690,(anchor.x+1)*540-95))}px`;tag.style.top=`${Math.max(680,Math.min(1080,(1-anchor.y)*960-100))}px`;tag.textContent=!st.allocated&&!st.freed?'M17 / UNALLOCATED':st.partial?'M17 / PARTIAL':st.freed?'M17 / FREED':'M17 / VALID';tag.style.display=oom&&i===0?'none':'block';
  el('headline').textContent=headings[i];el('subtitle').textContent=subtitles[i];el('phase').textContent=phases[i];
  el('shot-number').textContent=`${String(i+1).padStart(2,'0')} / 06`;
  el('status').textContent=oom?(i===2?'longjmp() → EARLY EXIT':st.invalidAccess?'CLEANUP USES INVALID M17':st.allocationFailed?'ALLOCATION FAILED / M22':i===5?'PATCHED RUNTIME':'REQUEST MEMORY BUDGET'):(i===5?'REFERENCE RESET BEFORE RELEASE':st.freed?'M17: FREED · REFERENCE RETAINED':'W01 · REQUEST A');
  el('status').style.color=st.invalidAccess?'#ef9a91':'#E0A96B';
  el('qualifier').textContent=oom?(i===4?'DEMONSTRATED: APACHE mod_php\nOther deployments have different conditions.':'ILLUSTRATIVE mod_php PATH · WORKER W01'):(i===4?'CONDITIONAL RCE · WORKER PRIVILEGES\nNot automatic root access.':i===0?'CONCEPTUAL PREVIEW · SAME WORKER W01':i===1?'EARLIER · REQUEST A · WORKER W01':'ILLUSTRATIVE LIFECYCLE · SAME WORKER W01');
  const c=captions.find(c=>t>=c.start&&t<c.end);el('caption').textContent=c?.text||'';el('caption').style.opacity=c?'1':'0';
  composer.render(0);renderer.getContext().finish();presentation.drawImage(renderer.domElement,0,0);
  const screen=(v:THREE.Vector3)=>{const q=v.clone().project(camera);return {x:(q.x+1)*540,y:(1-q.y)*960,z:q.z};};
  inspection={...st,caption:c?.id||null,camera:camera.position.toArray(),essentialPoints:{memory:screen(target),...(i===3||i===0&&!oom?{}:{worker:screen(new THREE.Vector3(0,.3,0))})},drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,renderer:renderer.getContext().getParameter(renderer.getContext().getExtension('WEBGL_debug_renderer_info')?.UNMASKED_RENDERER_WEBGL||renderer.getContext().RENDERER)};
 }
 async function prepare(){await document.fonts.ready;await document.fonts.load('76px Oswald');await document.fonts.load('40px "IBM Plex Mono"');camera.position.set(10,14,24);camera.lookAt(0,0,0);await renderer.compileAsync(world,camera);renderAt(0);win.studio={renderAt,inspect:()=>inspection,dispose:()=>{composer.dispose();renderer.dispose();baseGeo.dispose();win.__timelines?.[film.id]?.kill();}};}
 win.__hf??={};win.__hf.buildReady??={};win.__hf.buildReady[film.id]=prepare();
 window.addEventListener('hf-seek',(event)=>{const time=(event as CustomEvent<{time:number}>).detail.time;renderAt(Math.round(time*film.fps));});
}
