/** Offline mesh/rig authoring. Does not import or serialize the runtime placeholder. */
import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const out=resolve('apps/client/public/models/scarlet'); await mkdir(out,{recursive:true});
// GLTFExporter uses FileReader for its binary buffer even without DOM images.
(globalThis as any).FileReader=class { result: unknown; onloadend?:()=>void; async readAsArrayBuffer(blob: Blob) { this.result=await blob.arrayBuffer(); this.onloadend?.(); } };
const model=new T.Group(); model.name='Scarlet_SD_v3_Rigged';
const rig=new T.Bone(); rig.name='Rig'; model.add(rig);
const bones: T.Bone[]=[rig];
function bone(name: string,parent: T.Bone,x=0,y=0,z=0) { const b=new T.Bone(); b.name=name; b.position.set(x,y,z); parent.add(b); bones.push(b); return b; }
const body=bone('Body',rig,0,.05,0), head=bone('Head',body,0,1.17,0);
const hair=bone('BackHair',head,0,.04,-.12), coat=bone('Coat',body,0,.45,-.12);
const right=bone('Arm_R',body,.37,.79,0), left=bone('Arm_L',body,-.37,.79,0);
const rightLeg=bone('Leg_R',body,.16,.38,0), leftLeg=bone('Leg_L',body,-.16,.38,0);
const gold='#c6a06d', white='#eee9f2', violet='#77529c', ink='#3a3045', silver='#a99abf', light='#c7b8d9', skin='#ffe0d8';
const buckets=new Map<T.Material,T.BufferGeometry[]>();
const mats=new Map<string,T.MeshStandardMaterial>();
function mat(color: string,name=color) { const key=name; if(!mats.has(key)) mats.set(key,new T.MeshStandardMaterial({name,color,roughness:.85,metalness:color===gold?.15:0,side:T.DoubleSide})); return mats.get(key)!; }
function add(g: T.BufferGeometry,m:T.Material,b:T.Bone,pos=[0,0,0],rotation=[0,0,0],scale=[1,1,1]) {
  model.updateMatrixWorld(true);
  const local=new T.Matrix4().compose(new T.Vector3(...pos as [number,number,number]),new T.Quaternion().setFromEuler(new T.Euler(...rotation as [number,number,number])),new T.Vector3(...scale as [number,number,number]));
  g.applyMatrix4(b.matrixWorld.clone().multiply(local));
  if(!g.index) g=g.toNonIndexed();
  if(!g.getAttribute('uv')) g.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(g.getAttribute('position').count*2),2));
  const n=g.getAttribute('position').count, joints=new Uint16Array(n*4),weights=new Float32Array(n*4);
  for(let i=0;i<n;i++){joints[i*4]=bones.indexOf(b);weights[i*4]=1;}
  g.setAttribute('skinIndex',new T.Uint16BufferAttribute(joints,4));g.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));
  const list=buckets.get(m)??[];list.push(g);buckets.set(m,list);
}
function ellipsoid(b:T.Bone,pos:number[],size:number[],color:string){add(new T.SphereGeometry(1,32,24),mat(color),b,pos,[0,0,0],size);}
function tube(b:T.Bone,points:number[][],radius:number,color:string){add(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p as [number,number,number]))),Math.max(24,points.length*2),radius,8,false),mat(color),b);}
function surface(rows:number[][][],color:string,b:T.Bone) {
  const p:number[]=[],uv:number[]=[],ind:number[]=[],cols=rows[0].length;
  rows.forEach((row,i)=>row.forEach((v,j)=>{p.push(...v);uv.push(j/(cols-1),1-i/(rows.length-1));}));
  for(let i=0;i<rows.length-1;i++)for(let j=0;j<cols-1;j++){const a=i*cols+j,c=a+cols;ind.push(a,c,a+1,c,c+1,a+1);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ind);g.computeVertexNormals();add(g,mat(color),b);
}
function lock(b:T.Bone,points:number[][],width:number,depth:number,color:string) {
  const c=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p as [number,number,number]))),rows:number[][][]=[];
  for(let i=0;i<=28;i++){const t=i/28,center=c.getPoint(t),w=Math.max(.003,width*Math.pow(1-t,.50)*(1+.12*Math.sin(t*Math.PI)));
    rows.push(Array.from({length:13},(_,j)=>{const a=-j/12*Math.PI*2;return [center.x+Math.cos(a)*w,center.y,center.z+Math.sin(a)*depth*Math.max(.1,1-t*.7)];}));}
  surface(rows,color,b);
}
function ringBody(b:T.Bone,rings:number[][],color:string) {
  surface(rings.map(([y,w,d,z=0])=>Array.from({length:33},(_,j)=>{const a=j/32*Math.PI*2;return [Math.cos(a)*w,y,Math.sin(a)*d+z];})),color,b);
}
// Tailored torso, collar, waist and curved layered side panels.
ringBody(body,[[.40,.24,.16],[.48,.29,.20],[.59,.235,.175],[.71,.265,.20],[.79,.29,.17],[.83,.16,.11]],white);
ellipsoid(body,[0,.85,0],[.12,.11,.10],skin);
for(const s of [-1,1])tube(body,[[s*.12,.85,.12],[s*.20,.77,.19],[s*.19,.65,.19]],.018,ink);
tube(body,[[-.27,.79,.15],[0,.72,.213],[.27,.79,.15]],.018,ink);
ringBody(body,[[.43,.30,.22],[.47,.31,.225],[.52,.28,.205]],violet);
tube(body,[[-.28,.49,.16],[0,.48,.235],[.28,.49,.16]],.025,'#ad3c59');
for(const s of [-1,1]) {
  const rows=Array.from({length:17},(_,i)=>{const t=i/16;return Array.from({length:9},(_,j)=>{const u=j/8;return [s*(.18+u*.22+t*.09),.49-t*.29,.18-u*.12+t*.025+Math.sin(t*Math.PI)*.025];});});
  surface(rows,violet,body);
  tube(body,[[s*.39,.49,.06],[s*.43,.34,.095],[s*.47,.20,.10]],.008,gold);
  tube(body,[[s*.26,.39,.19],[s*.31,.36,.18],[s*.29,.31,.195]],.007,gold);
  const coatRows=Array.from({length:17},(_,i)=>{const t=i/16;return Array.from({length:9},(_,j)=>{const u=j/8;return [s*(.12+u*.18+t*.14),.04-t*.36,-.06-u*.08+Math.sin(t*Math.PI)*.035];});});
  surface(coatRows,white,coat);
}
// Front red cloth tab, small knot and gold clasps.
surface(Array.from({length:13},(_,i)=>{const t=i/12;return [[-.09+t*.02,.47-t*.28,.233],[.10-t*.015,.47-t*.29,.237]];}),'#a43b5c',body);
for(let i=0;i<3;i++)tube(body,[[-.05,.39-i*.053,.244],[.045,.37-i*.053,.247]],.006,white);
ellipsoid(body,[.17,.48,.22],[.045,.035,.025],gold);
for(const [b,side] of [[right,1],[left,-1]] as const) {
  ringBody(b,[[.03,.10,.10],[-.10,.095,.095],[-.22,.072,.073],[-.29,.074,.073]],skin);
  ringBody(b,[[.01,.105,.11],[-.05,.108,.11]],ink);
  ringBody(b,[[-.18,.085,.085],[-.25,.10,.10]],side===1?white:violet);
  ellipsoid(b,[0,-.32,.018],[.085,.092,.07],skin);
  ellipsoid(b,[-side*.058,-.30,.055],[.035,.05,.035],skin);
}
for(const [b,side] of [[rightLeg,1],[leftLeg,-1]] as const) {
  ringBody(b,[[.02,.11,.105],[-.12,.095,.09],[-.26,.085,.09]],white);
  ellipsoid(b,[0,-.28,.07],[.105,.075,.16],white);
  tube(b,[[-.07,-.27,.18],[0,-.30,.22],[.07,-.27,.18]],.01,gold);
  if(side===1)for(let i=0;i<3;i++)tube(b,[[-.09,-.04-i*.065,.08],[0,-.08-i*.065,.10],[.09,-.09-i*.065,.08]],.014,ink);
}
// Custom head topology: flattened facial surface, soft jaw taper and a small chin.
const headGeo=new T.SphereGeometry(1,64,48),hp=headGeo.getAttribute('position');
for(let i=0;i<hp.count;i++){
  const x=hp.getX(i),y=hp.getY(i),z=hp.getZ(i),jaw=y<-.12?1-(Math.max(0,-y-.12)*.30):1;
  hp.setXYZ(i,x*.47*jaw,y*.465,z>0? .11+z*.34 : z*.37+.02);
}
headGeo.computeVertexNormals();add(headGeo,mat(skin,'Skin'),head,[0,.025,0]);
// Back hair volume follows v3: narrow and close to the back, with only five main locks.
ellipsoid(head,[0,.16,-.09],[.49,.45,.35],silver);
for(let i=0;i<5;i++){
  const x=(i-2)*.135;
  lock(hair,[[x,.35,-.10],[x*1.25,-.04,-.27],[x*1.30,-.47,-.29],[x*.83,-.81,-.20],[x*.70+.025,-1.02,-.10]],.105,.075,i%2?light:silver);
}
for(const s of [-1,1]){
  lock(head,[[s*.34,.37,.12],[s*.43,.10,.13],[s*.42,-.20,.17],[s*.33,-.37,.24],[s*.40,-.43,.21]],.08,.050,light);
  lock(hair,[[s*.42,.22,.06],[s*.46,-.15,.05],[s*.43,-.62,.10],[s*.34,-.92,.19]],.075,.05,silver);
}
for(const [x,tip,w,y] of [[-.32,-.34,.10,.06],[-.19,-.24,.13,.07],[-.04,-.10,.12,.10],[.12,.06,.13,.11],[.28,.25,.105,.06]]){
  lock(head,[[x,.45,.18],[x,.32,.32],[tip,.18,.37],[tip-.02,y,.36]],w,.035,light);
}
lock(head,[[.16,.45,.19],[.14,.31,.36],[.08,.17,.43],[-.035,.035,.43]],.145,.030,light);
// UV facial patch conforms to the head surface; the PNG is inserted into the GLB below.
const faceRows=Array.from({length:33},(_,i)=>Array.from({length:41},(_,j)=>{
  const x=(j/40-.5)*.75,y=(.5-i/32)*.52-.015;
  const jaw=y<-.03?1-Math.max(0,-(y-.025)/.465-.12)*.30:1;
  return [x,y,.11+.34*Math.sqrt(Math.max(.01,1-(x/(.47*jaw))**2-((y-.025)/.465)**2))+.004];
}));
const faceMat=mat('#ffffff','Face_Painted');faceMat.transparent=true;faceMat.depthWrite=false;faceMat.roughness=1;
const faceP:number[]=[],faceUv:number[]=[],faceInd:number[]=[];
faceRows.forEach((row,i)=>row.forEach((v,j)=>{faceP.push(...v);faceUv.push(j/40,i/32);}));
for(let i=0;i<32;i++)for(let j=0;j<40;j++){const a=i*41+j,b=a+41;faceInd.push(a,b,a+1,b,b+1,a+1);}
const fg=new T.BufferGeometry();fg.setAttribute('position',new T.Float32BufferAttribute(faceP,3));fg.setAttribute('uv',new T.Float32BufferAttribute(faceUv,2));fg.setIndex(faceInd);fg.computeVertexNormals();add(fg,faceMat,head);
// Shallow conical hat with real thickness and a compact braided crown cord.
const hat=bone('Hat',head,0,.52,-.025);hat.rotation.z=-.07;
add(new T.CylinderGeometry(.035,.83,.245,64),mat(white),hat,[0,.09,0]);
add(new T.CylinderGeometry(.835,.835,.020,64),mat(ink),hat,[0,-.04,0]);
add(new T.CylinderGeometry(.82,.82,.008,64),mat('#e9c4a4'),hat,[0,-.053,0]);
for(const s of [-1,1]) {
  add(new T.ConeGeometry(.035,.29,16),mat(gold),hat,[s*.17,.32,-.055],[0,0,-s*.17]);
  const points=Array.from({length:97},(_,i)=>{const a=i/96*Math.PI*2,r=.44+Math.cos(a*18+s)*.012;return [Math.cos(a)*r,.12+Math.sin(a*18+s)*.012,Math.sin(a)*r];});
  tube(hat,points,.018,light);
  tube(hat,[[s*.69,-.01,.05],[s*.70,-.17,.06],[s*.68,-.37,.08]],.018,light);
  add(new T.CylinderGeometry(.025,.038,.12,12),mat(violet),hat,[s*.68,-.41,.08]);
  ellipsoid(hat,[s*.70,-.005,0],[.073,.08,.073],white);
  tube(head,[[s*.48,.43,.19],[s*.46,-.08,.18],[s*.41,-.27,.20]],.009,ink);
}
for(let i=0;i<5;i++){const a=i/5*Math.PI*2;ellipsoid(hat,[.48+Math.cos(a)*.039,.051,.32+Math.sin(a)*.039],[.022,.008,.037],violet);}
// Sheathed sword, kept behind the hip and clear of the hands.
const sword=bone('Sword',body,-.35,.48,-.20);sword.rotation.z=-.42;
add(new T.CylinderGeometry(.035,.025,.59,8),mat(ink),sword,[0,-.19,0]);
add(new T.CylinderGeometry(.036,.035,.16,8),mat(violet),sword,[0,.205,0]);
ellipsoid(sword,[0,.11,0],[.12,.018,.075],gold);
for(let i=0;i<4;i++)tube(sword,[[-.03,.15+i*.033,.02],[.03,.17+i*.033,.02]],.006,white);

model.updateMatrixWorld(true);const skeleton=new T.Skeleton(bones);
for(const [material,geometries] of buckets){const g=mergeGeometries(geometries,false);if(!g)throw new Error('Could not merge mesh');const mesh=new T.SkinnedMesh(g,material);mesh.name=`Scarlet_${material.name.replace('#','')}`;mesh.castShadow=true;mesh.receiveShadow=true;model.add(mesh);mesh.bind(skeleton);geometries.forEach(g=>g.dispose());}
model.updateMatrixWorld(true);
function rotationTrack(name:string,values:number[][],times:number[]){return new T.QuaternionKeyframeTrack(`${name}.quaternion`,times,values.flatMap(v=>new T.Quaternion().setFromEuler(new T.Euler(...v as [number,number,number])).toArray()));}
const times=[0,.25,.5,.75,1];
const idle=new T.AnimationClip('Idle',2.4,[new T.VectorKeyframeTrack('Body.position',[0,1.2,2.4],[0,.05,0,0,.061,0,0,.05,0]),rotationTrack('Head',[[0,0,-.018],[0,0,.018],[0,0,-.018]],[0,1.2,2.4]),rotationTrack('BackHair',[[.015,0,0],[-.015,0,0],[.015,0,0]],[0,1.2,2.4])]);
const walk=new T.AnimationClip('Walk',.8,[...[[rightLeg,1],[leftLeg,-1],[right,-.65],[left,.65]].map(([b,s])=>rotationTrack((b as T.Bone).name,[0,1,0,-1,0].map(v=>[v*.48*(s as number),0,0]),times.map(t=>t*.8))),rotationTrack('BackHair',[[.05,0,-.035],[-.05,0,.035],[.05,0,-.035]],[0,.4,.8])]);
const wave=new T.AnimationClip('Wave',2.4,[rotationTrack('Arm_R',[[0,0,.1],[0,0,2.5],[0,0,2.25],[0,0,2.55],[0,0,2.25],[0,0,.1]],[0,.35,.8,1.25,1.75,2.4])]);
function sitting(name:string,swing=false){return new T.AnimationClip(name,1,[rotationTrack('Leg_R',[[-Math.PI/2,0,0],[-Math.PI/2,0,0]],[0,1]),rotationTrack('Leg_L',[[-Math.PI/2,0,0],[-Math.PI/2,0,0]],[0,1]),rotationTrack('Arm_R',[swing?[0,0,2.65]:[-.9,0,.1],swing?[0,0,2.65]:[-.9,0,.1]],[0,1]),rotationTrack('Arm_L',[swing?[0,0,-2.65]:[-.9,0,-.1],swing?[0,0,-2.65]:[-.9,0,-.1]],[0,1]),rotationTrack('BackHair',[[.12,0,0],[.12,0,0]],[0,1]),rotationTrack('Coat',[[.5,0,0],[.5,0,0]],[0,1])]);}
const animations=[idle,walk,wave,sitting('Sit'),sitting('Swing',true)];
const binary=await new GLTFExporter().parseAsync(model,{binary:true,animations,onlyVisible:true}) as ArrayBuffer;
// Insert the offline-painted PNG without relying on browser-only canvas APIs.
const raw=Buffer.from(binary),jsonSize=raw.readUInt32LE(12),json=JSON.parse(raw.subarray(20,20+jsonSize).toString());
if(!json.skins.every((s:any)=>JSON.stringify(s.joints)===JSON.stringify(json.skins[0].joints)))throw new Error('Unexpected skeleton mismatch');
json.skins=[json.skins[0]];for(const node of json.nodes)if(node.skin!==undefined)node.skin=0;
const binStart=20+jsonSize,binSize=raw.readUInt32LE(binStart),oldBin=raw.subarray(binStart+8,binStart+8+binSize),png=await readFile(resolve('tools/art/scarlet-face.png'));
const imageOffset=(oldBin.length+3)&~3,bin=Buffer.alloc((imageOffset+png.length+3)&~3);oldBin.copy(bin);png.copy(bin,imageOffset);
const view=json.bufferViews.length;json.bufferViews.push({buffer:0,byteOffset:imageOffset,byteLength:png.length});
json.images=[{bufferView:view,mimeType:'image/png',name:'Scarlet painted face'}];json.samplers=[{magFilter:9729,minFilter:9987,wrapS:33071,wrapT:33071}];json.textures=[{source:0,sampler:0}];
const face=json.materials.find((m:any)=>m.name==='Face_Painted');face.pbrMetallicRoughness.baseColorTexture={index:0};face.alphaMode='BLEND';face.doubleSided=false;
face.extensions={KHR_materials_unlit:{}};json.extensionsUsed=[...new Set([...(json.extensionsUsed??[]),'KHR_materials_unlit'])];
json.buffers[0].byteLength=bin.length;json.asset.extras={design:'docs/art/scarlet-sd-target-v3.png',stage:'rigged modeling draft',generatorSource:'tools/art/build-scarlet.ts'};
let jsonBuffer=Buffer.from(JSON.stringify(json));const padding=(4-jsonBuffer.length%4)%4;jsonBuffer=Buffer.concat([jsonBuffer,Buffer.alloc(padding,32)]);
const header=Buffer.alloc(20);header.writeUInt32LE(0x46546c67);header.writeUInt32LE(2,4);header.writeUInt32LE(20+jsonBuffer.length+8+bin.length,8);header.writeUInt32LE(jsonBuffer.length,12);header.writeUInt32LE(0x4e4f534a,16);
const binHeader=Buffer.alloc(8);binHeader.writeUInt32LE(bin.length);binHeader.writeUInt32LE(0x004e4942,4);
await writeFile(resolve(out,'scarlet-v3.glb'),Buffer.concat([header,jsonBuffer,binHeader,bin]));
await writeFile(resolve(out,'manifest.json'),JSON.stringify({version:1,design:'scarlet-sd-target-v3',stage:'rigged modeling draft',animations:animations.map(a=>a.name),bones:bones.map(b=>b.name),vertices:[...buckets.values()].flat().reduce((sum,g)=>sum+g.getAttribute('position').count,0),fileBytes:20+jsonBuffer.length+8+bin.length},null,2));
console.log(`Built ${out}/scarlet-v3.glb (${(bin.length/1024).toFixed(0)} KB), ${bones.length} bones, ${animations.length} clips`);
