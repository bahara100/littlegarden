import * as T from 'three';
import type { CharacterRig } from './scarletAsset';

import { loadPixelAtlas, pixelFrame } from './pixelAtlas';
export { PIXEL_SIZE, PIXEL_SHEET, loadPixelAtlas, pixelFrame } from './pixelAtlas';
export async function loadScarletPixel():Promise<CharacterRig>{
  const atlas=await loadPixelAtlas(),texture=new T.CanvasTexture(atlas);
  texture.colorSpace=T.SRGBColorSpace;texture.magFilter=T.NearestFilter;texture.minFilter=T.NearestFilter;texture.generateMipmaps=false;texture.repeat.set(.25,.5);
  const root=new T.Group(),dummy=new T.Group();root.add(dummy);
  const material=new T.SpriteMaterial({map:texture,transparent:true,alphaTest:.3,depthWrite:true,toneMapped:false});
  const sprite=new T.Sprite(material);sprite.center.set(.5,0);sprite.scale.set(2.15,2.15,1);root.add(sprite);
  // Mesh pick target keeps the existing selection interaction available.
  const hit=new T.Mesh(new T.BoxGeometry(1.2,1.9,.4),new T.MeshBasicMaterial({visible:false}));hit.position.y=.95;root.add(hit);
  let time=0;
  return{root,torso:dummy,head:dummy,rightArm:dummy,leftArm:dummy,legs:[],animate(phase,dt,_seated,reduced){
    time+=dt;const frame=pixelFrame(phase==='walking',time,reduced);
    texture.offset.set((frame%4)/4,frame<4?.5:0);
  }};
}

