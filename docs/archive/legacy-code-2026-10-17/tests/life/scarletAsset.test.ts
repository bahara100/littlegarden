import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const bytes=readFileSync(new URL('../../apps/client/public/models/scarlet/scarlet-v3.glb',import.meta.url));
const length=bytes.readUInt32LE(12),gltf=JSON.parse(bytes.subarray(20,20+length).toString());
const binary=bytes.subarray(20+length+8);
function values(index:number):number[] {
  const accessor=gltf.accessors[index],view=gltf.bufferViews[accessor.bufferView];
  const count:Record<string,number>={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16};
  const sizes:Record<number,number>={5121:1,5123:2,5125:4,5126:4};
  const size=sizes[accessor.componentType],components=count[accessor.type],result:number[]=[];
  for(let i=0;i<accessor.count;i++)for(let j=0;j<components;j++){
    const pos=(view.byteOffset??0)+(accessor.byteOffset??0)+i*(view.byteStride??size*components)+j*size;
    assert.ok(pos+size<=binary.length);
    result.push(accessor.componentType===5126?binary.readFloatLE(pos):accessor.componentType===5123?binary.readUInt16LE(pos):accessor.componentType===5125?binary.readUInt32LE(pos):binary.readUInt8(pos));
  }
  return result;
}
test('packaged Scarlet is an embedded, rigged GLB with usable animation clips',()=>{
  assert.equal(bytes.readUInt32LE(0),0x46546c67);assert.equal(bytes.readUInt32LE(4),2);assert.equal(bytes.readUInt32LE(8),bytes.length);
  assert.ok(bytes.length<4_000_000);assert.equal(gltf.skins.length,1);assert.equal(gltf.skins[0].joints.length,11);
  assert.deepEqual(gltf.animations.map((a:any)=>a.name).sort(),['Idle','Sit','Swing','Walk','Wave']);
  assert.ok(gltf.animations.every((a:any)=>a.channels.length>0));
  assert.ok(gltf.nodes.filter((n:any)=>n.mesh!==undefined).every((n:any)=>n.skin===0));
  const image=gltf.images[0],view=gltf.bufferViews[image.bufferView];
  assert.equal(image.mimeType,'image/png');assert.equal(binary.subarray(view.byteOffset,view.byteOffset+8).toString('hex'),'89504e470d0a1a0a');
  assert.ok(!gltf.buffers.some((b:any)=>b.uri));
});
test('asset vertices, skin weights and animation samples are finite and bounded',()=>{
  let triangles=0;
  for(const mesh of gltf.meshes)for(const primitive of mesh.primitives){
    const a=primitive.attributes;assert.ok(a.JOINTS_0!==undefined&&a.WEIGHTS_0!==undefined&&a.TEXCOORD_0!==undefined);
    const positions=values(a.POSITION);assert.ok(positions.every(v=>Number.isFinite(v)&&Math.abs(v)<3));
    const joints=values(a.JOINTS_0);assert.ok(joints.every(v=>v>=0&&v<11));
    const weights=values(a.WEIGHTS_0);for(let i=0;i<weights.length;i+=4)assert.ok(Math.abs(weights.slice(i,i+4).reduce((s,v)=>s+v,0)-1)<1e-5);
    triangles+=gltf.accessors[primitive.indices].count/3;
  }
  assert.ok(triangles<100_000);
  for(const clip of gltf.animations)for(const sampler of clip.samplers){assert.ok(values(sampler.input).every(Number.isFinite));assert.ok(values(sampler.output).every(Number.isFinite));}
});
