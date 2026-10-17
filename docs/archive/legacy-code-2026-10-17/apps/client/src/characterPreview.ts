import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { loadScarletAsset, type CharacterRig } from './scarletAsset';
import type { Phase } from './simulation';
const host=document.getElementById('stage')!,status=document.getElementById('status')!;
const modelName=new URLSearchParams(location.search).get('model');
const coloredHead=modelName==='hunyuan-head-colored';
const generatedHead=modelName==='hunyuan-head'||coloredHead;
const headFile=coloredHead?'scarlet-head-hunyuan-colored-v1.glb':'scarlet-head-hunyuan-shape.glb';
if(generatedHead){
  document.querySelector('h1')!.textContent='홍련, 이미지에서 입체로';
  document.querySelector('header p')!.textContent='무료 공개 데모가 생성한 실제 입체 형상을 살펴보세요.';
  document.querySelector('.badge')!.textContent='AI 생성 · 형상만';
  const download=document.querySelector<HTMLAnchorElement>('.download')!;download.href='./models/experiments/scarlet-head-hunyuan-shape.glb';download.textContent='생성 원본 GLB 받기 ↓';
  document.querySelector('.note')!.textContent='마우스 드래그 · 회전 / 휠 · 확대. Hunyuan3D 공개 데모에서 생성한 형상 원본입니다. 색상·눈 텍스처·뼈대·애니메이션은 포함되지 않았습니다. 기존 게임 모델과 별도의 검증 결과이며, 표시용 크기와 회색 재질만 맞췄습니다.';
  if(coloredHead){
    document.querySelector('h1')!.textContent='홍련 흉상, 첫 채색';
    document.querySelector('header p')!.textContent='생성된 흉상에 정면 이미지의 색상과 표정을 입혔습니다.';
    document.querySelector('.badge')!.textContent='정면 투영 · 채색 실험';
    download.href=`./models/experiments/${headFile}`;download.textContent='채색 GLB 받기 ↓';
    document.querySelector('.note')!.textContent='마우스 드래그 · 회전 / 휠 · 확대. 정면은 입력 이미지를 표면에 투영했고, 뒷면은 색을 추정해 보완했습니다. 측면의 색 늘어짐과 경계가 남아 있는 첫 채색 실험입니다. 15만 삼각형으로 경량화했으며 뼈대·모션은 없습니다.';
  }
  document.querySelectorAll<HTMLElement>('[data-pose],#pause').forEach(b=>b.hidden=true);
}
const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor('#eee9f1');renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1;host.append(renderer.domElement);
const scene=new T.Scene(),camera=new T.PerspectiveCamera(32,1,.01,50);
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,1.1,0);controls.enableDamping=true;controls.minDistance=2.7;controls.maxDistance=8;controls.maxPolarAngle=Math.PI*.52;controls.enablePan=false;
scene.add(new T.HemisphereLight('#fff8fd','#c1b3cb',1.7));
const key=new T.DirectionalLight('#fff5e4',1.8);key.position.set(-3,5,5);scene.add(key);
const fill=new T.DirectionalLight('#dcd7ff',.8);fill.position.set(4,2,-3);scene.add(fill);
const plinth=new T.Mesh(new T.CylinderGeometry(.9,.95,.07,64),new T.MeshStandardMaterial({color:'#ded4e6',roughness:1}));plinth.position.y=-.035;scene.add(plinth);
let rig:CharacterRig|undefined,phase:Phase='idle',paused=false,disposed=false;
const buttons=Array.from(document.querySelectorAll<HTMLButtonElement>('button'));buttons.forEach(b=>b.disabled=true);
function view(name:string){const poses:Record<string,number[]>={front:[0,1.65,5.0],side:[5,1.65,0],back:[0,1.65,-5],quarter:[2.5,2.1,4.4]};camera.position.set(...poses[name] as [number,number,number]);controls.target.set(0,1.1,0);controls.update();}
view('quarter');
for(const button of Array.from(document.querySelectorAll<HTMLButtonElement>('[data-view]')))button.onclick=()=>{view(button.dataset.view!);document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));};
for(const button of Array.from(document.querySelectorAll<HTMLButtonElement>('[data-pose]')))button.onclick=()=>{phase=button.dataset.pose as Phase;document.querySelectorAll('[data-pose]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));};
document.getElementById('pause')!.onclick=()=>{paused=!paused;document.getElementById('pause')!.setAttribute('aria-pressed',String(paused));document.getElementById('pause')!.textContent=paused?'다시 재생':'일시 정지';};
async function loadModel(){
  if(generatedHead){
    const {GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js');
    const gltf=await new GLTFLoader().loadAsync(`${import.meta.env.BASE_URL}models/experiments/${headFile}`);
    if(disposed)return;
    gltf.scene.traverse(o=>{if(o instanceof T.Mesh){if(!o.geometry.getAttribute('normal'))o.geometry.computeVertexNormals();if(!coloredHead)o.material=new T.MeshStandardMaterial({color:'#d5cddb',roughness:.86,side:T.DoubleSide});}});
    const bounds=new T.Box3().setFromObject(gltf.scene),center=bounds.getCenter(new T.Vector3()),size=bounds.getSize(new T.Vector3()),scale=2.2/size.y;
    gltf.scene.scale.setScalar(scale);gltf.scene.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);scene.add(gltf.scene);
    status.textContent=coloredHead?'흉상 채색 실험 · 정면 투영 / 후면 추정':'무료 생성 원본 · 색상 없는 입체 형상';buttons.filter(b=>b.dataset.view).forEach(b=>b.disabled=false);
  }else{
    const value=await loadScarletAsset();if(disposed)return;rig=value;scene.add(rig.root);status.textContent='실제 모델 · 방향과 모션을 바꿔보세요';buttons.forEach(b=>b.disabled=false);
  }
}
void loadModel().catch(error=>{status.textContent='모델을 열지 못했어요. 새로고침해 다시 시도해주세요.';console.error(error);});
function resize(){const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}const observer=new ResizeObserver(resize);observer.observe(host);resize();
let last=performance.now(),frame=0;function animate(now:number){if(disposed)return;frame=requestAnimationFrame(animate);const dt=Math.min(.1,(now-last)/1000);last=now;if(document.hidden)return;
  if(rig){const seated=phase==='seated'||phase==='swinging'?1:0;rig.root.position.y=seated?.55:0;rig.animate?.(phase,paused?0:dt,seated,false);}
  controls.update();renderer.render(scene,camera);
}frame=requestAnimationFrame(animate);
function dispose(){disposed=true;cancelAnimationFrame(frame);observer.disconnect();controls.dispose();scene.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material]){(m as T.MeshStandardMaterial).map?.dispose();m.dispose();}}});renderer.dispose();}
window.addEventListener('pagehide',dispose,{once:true});if(import.meta.hot)import.meta.hot.dispose(dispose);
