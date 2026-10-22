import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {BokehPass} from 'three/addons/postprocessing/BokehPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {wordpressStateAt, type WordpressClock} from './wordpress-state.ts';
type Film=WordpressClock&{id:string;title:string;duration:number};
type Caption={id:string;start:number;end:number;text:string};
type Win=Window&{studio?:{renderAt:(f:number)=>void;inspect:()=>unknown;dispose:()=>void};__hf?:{buildReady?:Record<string,Promise<void>>}};
export function createWordpressFilm(film:Film,captions:Caption[]) {
 const win=window as Win, el=(id:string)=>document.getElementById(id)!;
 const canvas=el('world') as HTMLCanvasElement;
 const presentation=canvas.getContext('2d',{alpha:false,willReadFrequently:true})!;
 const renderer=new THREE.WebGLRenderer({canvas:document.createElement('canvas'),antialias:true,preserveDrawingBuffer:true});
 renderer.setSize(1080,1920);renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.domElement.addEventListener('webglcontextlost',()=>{throw new Error('WordPress capture lost its WebGL context; reject this capture');});
 const world=new THREE.Scene();world.background=new THREE.Color('#070B14');world.fog=new THREE.FogExp2('#070B14',.014);
 const camera=new THREE.PerspectiveCamera(35,1080/1920,.1,100);
 world.add(new THREE.HemisphereLight('#cfdeeb','#172a39',1.6));
 const light=new THREE.SpotLight('#d6e9ef',1100,80,.65,.7,1.8);light.position.set(-7,15,12);light.castShadow=true;light.shadow.mapSize.set(2048,2048);light.shadow.normalBias=.035;world.add(light,light.target);
 const rim=new THREE.DirectionalLight('#74B8C6',3.5);rim.position.set(8,5,-5);world.add(rim);
 const fill=new THREE.PointLight('#E0A96B',100,30,1.8);fill.position.set(4,3,6);world.add(fill);
 const material=(color:string,metalness=.7,roughness=.3)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
 const metal=material('#627f90',.85,.27),dark=material('#193442',.7,.32),black=material('#0b1822',.35,.45);
 const cyan=new THREE.MeshStandardMaterial({color:'#74B8C6',emissive:'#416f7a',emissiveIntensity:.35,metalness:.45,roughness:.28});
 const amber=new THREE.MeshStandardMaterial({color:'#E0A96B',emissive:'#b77c39',emissiveIntensity:.5,metalness:.35,roughness:.3});
 const green=new THREE.MeshBasicMaterial({color:'#78bf98'});
 const geo=new RoundedBoxGeometry(1,1,1,3,.055);
 function box(parent:THREE.Object3D,x:number,y:number,z:number,w:number,h:number,d:number,mat:THREE.Material=metal){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 const assembly=new THREE.Group();world.add(assembly);assembly.scale.setScalar(.78);
 const runtime=new THREE.Group(),application=new THREE.Group(),host=new THREE.Group(),patch=new THREE.Group(),workflow=new THREE.Group();
 assembly.add(runtime,application,host,patch,workflow);
 // A single website assembly persists across every shot. The runtime substrate
 // has no green light: all apparent status checks concern application core only.
 box(runtime,0,-.9,0,7.6,.65,4.7,dark);box(runtime,0,-.54,0,7.25,.12,4.35,metal);
 box(runtime,0,-.32,0,4.8,.3,3.05,black);box(runtime,0,-.15,0,4.35,.12,2.65,cyan);
 for(let i=0;i<14;i++)for(const z of [-1.66,1.66])box(runtime,-2.2+i*.34,-.27,z,.15,.1,.43,metal);
 for(let i=0;i<5;i++)box(runtime,-3.1+i*.35,-.88,2.37,.18,.15,.035,i===0?amber:dark);
 for(const x of [-3.45,3.45])for(const z of [-1.95,1.95]){const bolt=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,.08,16),metal);bolt.position.set(x,-.42,z);runtime.add(bolt);box(runtime,x,-.37,z,.14,.02,.025,black);}
 box(application,0,0,0,6.65,.32,4.0,dark);box(application,0,.19,0,6.3,.07,3.65,metal);
 box(application,0,.36,-.65,5.5,.3,1.65,black);
 const statusLed=box(application,2.35,.55,-.65,.25,.08,.55,green);
 box(application,-1.45,.36,1.0,2.55,.25,.85,cyan);box(application,1.45,.36,1.0,2.55,.25,.85,cyan);
 const posts:THREE.Mesh[]=[];for(const x of [-2.95,2.95])for(const z of [-1.55,1.55])posts.push(box(assembly,x,.7,z,.07,2,.07,metal));
 // Physical maintenance endpoints, not a fabricated host-control UI.
 for(const x of [-2.0,2.0]){
  box(host,x,.2,0,2.9,.7,2.5,dark);box(host,x,.59,0,2.6,.08,2.2,metal);
  for(let k=0;k<4;k++)box(host,x-1+k*.62,.25,1.27,.32,.12,.035,cyan);
 }
 const linkCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(-2,.3,1.3),new THREE.Vector3(-2,-.35,2.6),new THREE.Vector3(2,-.35,2.6),new THREE.Vector3(2,.3,1.3)]);
 const link=new THREE.Mesh(new THREE.TubeGeometry(linkCurve,48,.035,8,false),cyan);host.add(link);
 const token=new THREE.Mesh(new THREE.SphereGeometry(.10,16,12),amber);host.add(token);
 box(patch,0,0,0,2.1,.28,1.45,amber);for(let i=0;i<5;i++)box(patch,-.8+i*.4,-.2,0,.12,.15,.7,metal);
 const stepLights:THREE.Mesh[]=[];
 for(let i=0;i<3;i++){box(workflow,(i-1)*2.5,0,0,2.25,.4,1.85,dark);stepLights.push(box(workflow,(i-1)*2.5,.24,.62,1.6,.045,.08,cyan));}
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(100,100),material('#0c1722',.3,.5));floor.rotation.x=-Math.PI/2;floor.position.y=-1.01;floor.receiveShadow=true;world.add(floor);
 const grid=new THREE.GridHelper(80,40,'#23404c','#172c39');grid.position.y=-1.0;world.add(grid);
 const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(world,camera));
 const bokeh=new BokehPass(world,camera,{focus:25,aperture:.00010,maxblur:.003});composer.addPass(bokeh);composer.addPass(new OutputPass());composer.setSize(1080,1920);
 const labels:THREE.Texture[]=[];
 function label(parent:THREE.Object3D,text:string,x:number,y:number,z:number,w:number,h:number,color='#d6e7ed'){
  const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d')!;
  ctx.fillStyle=color;ctx.font='500 100px "IBM Plex Mono"';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,512,128,980);
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=renderer.capabilities.getMaxAnisotropy();labels.push(texture);
  const plane=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false}));plane.rotation.x=-Math.PI/2;plane.position.set(x,y,z);parent.add(plane);
 }
 const headings=['WORDPRESS\nIS UPDATED.','PHP RUNS\nTHE CODE.','PHP FIXES?\nSTILL UNCONFIRMED.','FIND YOUR\nPHP VERSION.','CONFIRM WITH\nYOUR HOST.','OLDER PACKAGE.\nNEW SECURITY FIX.','VERIFY THE PHP\nSERVING YOUR SITE.'];
 const subtitles=['What about the runtime underneath?','Core, themes and plugins share a runtime.','Application updates do not verify runtime fixes.','Tools → Site Health → Info → Server','Check the installed package and security fixes.','Vendors can backport security fixes.','Back up. Test compatibility. Verify after updating.'];
 const phases=['APPLICATION UPDATE STATUS','APPLICATION → RUNTIME','SEPARATE MAINTENANCE BOUNDARY','READ-ONLY SERVER INFORMATION','HOST / SERVER ADMINISTRATOR','VENDOR-MAINTAINED PACKAGE','BEFORE AND AFTER THE UPGRADE'];
 const statuses=['WORDPRESS CORE: UP TO DATE','PHP: SERVER-SIDE EXECUTION','PHP PATCH STATUS: UNKNOWN','PHP VERSION: A STARTING POINT','REQUEST PATCH CONFIRMATION','CHECK THE VENDOR SECURITY ADVISORY','VERIFY THE RUNNING WEB RUNTIME'];
 const qualifiers=['Illustrative core-update indicator.','Themes and plugins also need maintenance.','Unknown does not mean compromised.','Viewing this page does not upgrade PHP.','Managed hosts may perform updates for you.','Version numbers alone are not a verdict.','Confirm the fix and test site functionality.'];
 let inspection:Record<string,unknown>={};
 const smooth=(v:number)=>{v=THREE.MathUtils.clamp(v,0,1);return v*v*(3-2*v);};
 function renderAt(input:number){
  if(renderer.getContext().isContextLost())throw new Error('WebGL context lost: stop capturing');
  const st=wordpressStateAt(film,input),i=st.index,p=st.progress,t=st.frame/film.fps,e=smooth(p);
  application.visible=i<=3||i===6;runtime.visible=i!==4;host.visible=i===4;patch.visible=i===5;workflow.visible=i===6;
  const separation=i===0?.75+e*.55:i===1?1.3+e*1.25:i===6?1.8:2.55;
  application.position.y=separation;posts.forEach(m=>{m.visible=application.visible;m.scale.y=separation+.5;m.position.y=(separation-.5)/2;});
  statusLed.material=green;
  host.position.set(0,0,0);token.position.copy(linkCurve.getPointAt((p*.86+.07)%1));
  patch.position.set(1.6*(1-e),2.2-1.6*e,-.3);patch.rotation.y=.15*(1-e);
  workflow.position.set(0,-.1,3.2);stepLights.forEach((m,k)=>{m.material=p>(k/3)?cyan:dark;});
  const target=new THREE.Vector3(0,.65,0),position=new THREE.Vector3(8-p,10,23+p);
  if(i===0){target.set(0,separation-.1,0);position.set(5-p*.5,7+p,15+p*3);}
  if(i===1){target.set(0,.8,0);position.set(8-2*p,11,23+p);}
  if(i===2){target.set(0,.6,0);position.set(6-p,8-p,20-p);}
  if(i===3){target.set(0,.7,0);position.set(6+p,10,24+p);}
  if(i===4){target.set(0,.0,.6);position.set(5-p,10,21+p);}
  if(i===5){target.set(0,.2,0);position.set(7-p*1.5,10,22-p);}
  if(i===6){target.set(0,.5,.5);position.set(7-p*2,11+p,25+p*2);}
  camera.position.copy(position);camera.lookAt(target);camera.updateMatrixWorld();
  (bokeh.uniforms as Record<string,{value:number}>).focus.value=camera.position.distanceTo(target);(bokeh.uniforms as Record<string,{value:number}>).aperture.value=i===0?.00012:.00008;
  el('headline').textContent=headings[i];el('subtitle').textContent=subtitles[i];el('phase').textContent=phases[i];
  el('shot-number').textContent=`${String(i+1).padStart(2,'0')} / 07`;
  el('status').textContent=statuses[i];el('status').style.color=i===0?'#9fcbb1':'#E0A96B';el('qualifier').textContent=qualifiers[i];
  const cue=captions.find(c=>t>=c.start&&t<c.end);el('caption').textContent=cue?.text||'';el('caption').style.opacity=cue?'1':'0';
  const path=el('path');path.style.display=i===3?'flex':'none';
  path.querySelectorAll('span').forEach((node,k)=>{(node as HTMLElement).style.color=p>=k*.17?'#E0A96B':'#718c9b';});
  composer.render(0);renderer.getContext().finish();presentation.drawImage(renderer.domElement,0,0);
  const screen=(v:THREE.Vector3)=>{const q=v.clone().project(camera);return{x:(q.x+1)*540,y:(1-q.y)*960,z:q.z};};
  inspection={...st,caption:cue?.id||null,essentialPoints:{focus:screen(target)},contextLost:renderer.getContext().isContextLost(),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,renderer:renderer.getContext().getParameter(renderer.getContext().getExtension('WEBGL_debug_renderer_info')?.UNMASKED_RENDERER_WEBGL||renderer.getContext().RENDERER)};
 }
 async function prepare(){
  await document.fonts.ready;await document.fonts.load('76px Oswald');await document.fonts.load('40px "IBM Plex Mono"');
  label(application,'WORDPRESS',-.15,.525,-.65,4.4,.75);label(application,'THEMES',-1.45,.5,1,2.1,.48,'#0c2030');label(application,'PLUGINS',1.45,.5,1,2.1,.48,'#0c2030');
  label(runtime,'PHP',0,-.075,0,3.25,1.15,'#112d3b');label(host,'YOUR SITE',-2,.64,0,2.4,.65);label(host,'HOST / ADMIN',2,.64,0,2.5,.65);label(patch,'FIX',0,.15,0,1.55,.6,'#332713');
  ['BACKUP','TEST','VERIFY'].forEach((s,i)=>label(workflow,s,(i-1)*2.5,.22,-.12,1.95,.55));
  camera.position.set(8,10,23);camera.lookAt(0,.6,0);await renderer.compileAsync(world,camera);renderAt(0);
  win.studio={renderAt,inspect:()=>inspection,dispose:()=>{labels.forEach(t=>t.dispose());composer.dispose();renderer.dispose();geo.dispose();}};
 }
 win.__hf??={};win.__hf.buildReady??={};win.__hf.buildReady[film.id]=prepare();
 window.addEventListener('hf-seek',(event)=>renderAt(Math.round((event as CustomEvent<{time:number}>).detail.time*film.fps)));
}
