import * as THREE from 'three';
import type { Phase } from './simulation';

export interface CharacterRig {
  root: THREE.Group;
  torso: THREE.Object3D; head: THREE.Object3D; rightArm: THREE.Object3D; leftArm: THREE.Object3D; legs: THREE.Object3D[];
  animate?: (phase: Phase, dt: number, seated: number, reducedMotion: boolean) => void;
}
export async function loadScarletAsset(): Promise<CharacterRig> {
  const { GLTFLoader }=await import('three/addons/loaders/GLTFLoader.js');
  const gltf=await new GLTFLoader().loadAsync(`${import.meta.env.BASE_URL}models/scarlet/scarlet-v3.glb`);
  const root=gltf.scene, get=(name:string)=>{const value=root.getObjectByName(name);if(!value)throw new Error(`Missing Scarlet bone ${name}`);return value;};
  const torso=get('Body'),head=get('Head'),rightArm=get('Arm_R'),leftArm=get('Arm_L'),legs=[get('Leg_R'),get('Leg_L')];
  const mixer=new THREE.AnimationMixer(root),actions=new Map(gltf.animations.map(clip=>[clip.name,mixer.clipAction(clip)]));
  for(const name of ['Idle','Walk','Wave','Sit','Swing'])if(!actions.has(name))throw new Error(`Missing Scarlet clip ${name}`);
  root.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;}});
  const backHair=get('BackHair'),coat=get('Coat');
  let current='';
  return {root,torso,head,rightArm,leftArm,legs,animate(phase,dt,seated,reducedMotion){
    const next=phase==='swinging'?'Swing':seated>.02?'Sit':phase==='walking'?'Walk':phase==='waving'?'Wave':'Idle';
    if(next!==current){
      const previous=actions.get(current),action=actions.get(next)!;action.reset().setEffectiveWeight(1).play();
      if(previous)previous.fadeOut(.18);action.fadeIn(.18);current=next;
    }
    if(reducedMotion) { for(const [name,action] of actions)if(name!==current)action.stop();const action=actions.get(current)!;action.stopFading().setEffectiveWeight(1);action.time=current==='Wave'?.8:0;mixer.update(0); }
    else mixer.update(dt);
    if(seated>0){legs.forEach(leg=>leg.rotation.x=-Math.PI/2*seated);backHair.rotation.x=.5*seated;coat.rotation.x=.5*seated;}
  }};
}
