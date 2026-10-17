import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/** Original, code-built chibi interpretation of Scarlet's default costume. +Z faces forward. */
export function createScarlet() {
  const root = new THREE.Group(), torso = new THREE.Group(), head = new THREE.Group();
  const rightArm = new THREE.Group(), leftArm = new THREE.Group(), legs: THREE.Group[] = [];
  root.name = 'scarlet-default-chibi'; root.add(torso); torso.position.y = .05;
  const p = { white: '#f2eff8', shade: '#b8aecb', hair: '#aaa0bf', hairLight: '#d8cfe6', ink: '#393040', purple: '#8055ae', gold: '#d0ad73', red: '#ad4767', skin: '#ffe5dd' };
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  function mesh(parent: THREE.Object3D, geometry: THREE.BufferGeometry, color: string, x=0, y=0, z=0) {
    let material = materials.get(color); if (!material) { material = new THREE.MeshStandardMaterial({ color, roughness: .74, ...(color === p.skin ? { emissive: color, emissiveIntensity: .13 } : {}) }); materials.set(color, material); }
    const m = new THREE.Mesh(geometry, material); m.position.set(x,y,z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  }
  function box(parent: THREE.Object3D, x: number, y: number, z: number, w: number, h: number, d: number, color: string, radius=.025) {
    return mesh(parent, new RoundedBoxGeometry(w,h,d,2,Math.min(radius,w/3,h/3,d/3)),color,x,y,z);
  }
  function ball(parent: THREE.Object3D,x: number,y: number,z: number,r: number,color: string,scale: [number,number,number]=[1,1,1]) {
    const m=mesh(parent,new THREE.SphereGeometry(r,24,16),color,x,y,z); m.scale.set(...scale); return m;
  }
  function line(parent: THREE.Object3D, points: number[][], radius: number, color: string) {
    return mesh(parent,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v as [number,number,number]))),Math.max(24,points.length*2),radius,6,false),color);
  }
  function strand(points: number[][], width: number, color: string, depth=.055) {
    const curve=new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v as [number,number,number])));
    const vertices: number[]=[], indices: number[]=[];
    for(let i=0;i<=24;i++) {
      const t=i/24, c=curve.getPoint(t), radius=Math.max(.006,width*Math.pow(1-t,.55)*(.83+.17*Math.sin(t*Math.PI)));
      for(let j=0;j<=12;j++) { const a=j/12*Math.PI*2; vertices.push(c.x+Math.cos(a)*radius,c.y,c.z+Math.sin(a)*depth*Math.max(.12,1-t*.8)); }
    }
    for(let i=0;i<24;i++) for(let j=0;j<12;j++) { const a=i*13+j,b=a+13; indices.push(a,b,a+1,b,b+1,a+1); }
    const geometry=new THREE.BufferGeometry(); geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3)); geometry.setIndex(indices); geometry.computeVertexNormals();
    return mesh(head,geometry,color);
  }
  for (const [i,x] of [-.17,.17].entries()) {
    const leg=new THREE.Group(); leg.position.set(x,.38,0); torso.add(leg); legs.push(leg);
    ball(leg,0,-.15,0,.13,i ? p.shade : p.white,[.83,1.42,.94]);
    ball(leg,0,-.29,.065,.14,p.white,[.84,.63,1.35]);
    box(leg,0,-.26,.26,.17,.035,.035,p.gold,.008);
    if (i) for(let n=0;n<3;n++) box(leg,0,-.02-n*.085,.13,.235,.032,.025,p.ink,.005).rotation.z = -.16;
  }
  ball(torso,0,.57,0,.35,p.white,[.95,1.05,.73]);
  ball(torso,0,.70,.20,.25,p.white,[.89,.76,.43]);
  line(torso,[[-.19,.84,.20],[-.12,.76,.29],[0,.73,.31],[.12,.76,.29],[.19,.84,.20]],.018,p.ink);
  for(const x of [-.16,.16]) box(torso,x,.79,.273,.03,.16,.025,p.ink,.008);
  line(torso,[[0,.73,.316],[0,.58,.323]],.008,p.gold);
  box(torso,0,.48,.02,.68,.105,.50,p.purple,.025);
  box(torso,0,.49,.286,.15,.12,.035,p.gold,.015);
  box(torso,0,.49,.309,.09,.065,.02,p.white,.008);
  const sash=box(torso,.035,.33,.23,.24,.27,.045,p.red); sash.rotation.z=-.15;
  for(let i=0;i<3;i++) box(torso,.03,.25+i*.065,.258,.11,.016,.01,p.white,.002).rotation.z=.35;
  for(const side of [-1,1]) {
    const panel=box(torso,side*.30,.36,.015,.20,.34,.40,p.purple,.055); panel.rotation.z=side*.13;
    line(torso,[[side*.39,.49,.22],[side*.41,.32,.22],[side*.35,.20,.22]],.009,p.gold);
    line(torso,[[side*.29,.43,.228],[side*.34,.38,.228],[side*.29,.33,.228],[side*.24,.38,.228],[side*.29,.43,.228]],.007,p.gold);
  }
  // Trailing white coat panels sit behind the legs, leaving the seat anchor unobstructed.
  for(const side of [-1,1]) {
    const coat=box(torso,side*.30,.36,-.24,.27,.48,.08,p.white); coat.rotation.z=side*-.18;
    box(coat,0,-.16,.05,.19,.025,.012,p.gold,.004);
  }
  leftArm.position.set(-.37,.78,0); rightArm.position.set(.37,.78,0); torso.add(leftArm,rightArm);
  for(const [i,arm] of [leftArm,rightArm].entries()) {
    ball(arm,0,-.05,0,.115,p.skin,[1,1.15,1]);
    box(arm,0,-.02,.01,.24,.095,.25,p.ink);
    ball(arm,0,-.19,0,.10,p.skin,[.85,1.4,.9]);
    box(arm,0,-.23,.02,.17,.15,.19,i ? p.white : p.purple,.045);
    ball(arm,0,-.32,.02,.105,p.skin);
  }
  head.position.y=1.23; torso.add(head);
  // Long layered hair stays behind the face and folds above the seat.
  ball(head,0,.10,-.06,.50,p.hair,[1.02,1.08,.95]);
  for(let i=0;i<9;i++) {
    const x=(i-4)*.093;
    strand([[x,.35,-.22],[x*1.12,-.06,-.38],[x*1.25,-.40,-.30],[x*1.15+.03,-.61,-.19]],.083,i%3===1 ? p.hairLight : p.hair,.08);
  }
  ball(head,0,.005,.10,.435,p.skin,[1,.96,.91]);
  for(const side of [-1,1]) {
    strand([[side*.36,.39,.18],[side*.43,.12,.22],[side*.44,-.19,.22],[side*.36,-.40,.30],[side*.45,-.46,.26]],.095,p.hairLight);
    strand([[side*.43,.29,.05],[side*.49,-.06,.06],[side*.47,-.38,.07],[side*.53,-.52,.15]],.065,p.hair);
    ball(head,side*.43,-.31,.19,.022,p.gold,[1,2,1]);
  }
  for(const [x,tip,w] of [[-.30,-.34,.105],[-.18,-.24,.12],[-.035,-.10,.11],[.105,.045,.105],[.25,.22,.105]] ) {
    strand([[x,.46,.22],[x+.015,.33,.38],[tip,.15,.45],[tip-.025,.055+Math.abs(x)*.09,.46]],w,p.hairLight,.045);
  }
  // Curved face decal keeps anime eyes flush with the face instead of protruding beads.
  if (typeof document !== 'undefined') {
    const canvas=document.createElement('canvas'); canvas.width=1024; canvas.height=768;
    const ctx=canvas.getContext('2d')!;
    for(const side of [-1,1]) {
      const x=512+side*205,y=366;
      ctx.save(); ctx.translate(x,y); ctx.scale(1.25,1.30);
      ctx.beginPath(); ctx.moveTo(-105,-18); ctx.bezierCurveTo(-70,-90,53,-92,102,-28); ctx.bezierCurveTo(82,65,-62,84,-105,-18); ctx.closePath();
      ctx.fillStyle='#fff8f4'; ctx.fill(); ctx.save(); ctx.clip();
      const iris=ctx.createLinearGradient(0,-60,0,70); iris.addColorStop(0,'#5b354e'); iris.addColorStop(.42,'#b88743'); iris.addColorStop(1,'#f5cf75');
      ctx.fillStyle=iris; ctx.beginPath(); ctx.ellipse(0,0,65,83,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#423047'; ctx.beginPath(); ctx.ellipse(0,-10,24,47,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#fffefb'; ctx.beginPath(); ctx.ellipse(-26,-38,22,15,-.4,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(30,31,10,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#ffdf9c'; ctx.beginPath(); ctx.ellipse(-16,51,17,7,.2,0,Math.PI*2); ctx.fill(); ctx.restore();
      ctx.strokeStyle='#503849'; ctx.lineWidth=13; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(-108,-17); ctx.bezierCurveTo(-69,-97,59,-92,105,-27); ctx.stroke();
      ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(-80,47); ctx.quadraticCurveTo(2,86,78,43); ctx.stroke();
      const outer=side*100; ctx.lineWidth=7;
      for(let i=0;i<3;i++) { ctx.beginPath(); ctx.moveTo(outer-side*i*15,-27-i*8); ctx.lineTo(outer+side*(21-i*4),-52-i*13); ctx.stroke(); }
      ctx.strokeStyle='#b398b3'; ctx.lineWidth=7; ctx.beginPath(); ctx.moveTo(-73,-128); ctx.quadraticCurveTo(0,-149,72,-125); ctx.stroke();
      ctx.restore();
      const blush=ctx.createRadialGradient(x+side*90,470,2,x+side*90,470,70); blush.addColorStop(0,'rgba(235,139,163,.42)'); blush.addColorStop(1,'rgba(235,139,163,0)'); ctx.fillStyle=blush; ctx.fillRect(x+side*90-70,414,140,115);
    }
    ctx.strokeStyle='#bd7a89'; ctx.lineWidth=6; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(479,526); ctx.quadraticCurveTo(514,548,550,523); ctx.stroke();
    ctx.fillStyle='rgba(232,169,161,.45)'; ctx.beginPath(); ctx.ellipse(514,458,9,5,0,0,Math.PI*2); ctx.fill();
    const texture=new THREE.CanvasTexture(canvas); texture.colorSpace=THREE.SRGBColorSpace; texture.anisotropy=4;
    const geometry=new THREE.PlaneGeometry(.78,.56,32,24), positions=geometry.getAttribute('position');
    for(let i=0;i<positions.count;i++) { const x=positions.getX(i),y=positions.getY(i)-.025; positions.setXYZ(i,x,y,.10+.4002*Math.sqrt(Math.max(.01,1-(x/.435)**2-((y-.005)/.413)**2))+.007); }
    geometry.computeVertexNormals();
    const face=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1})); head.add(face);
  }
  // Broad, slightly tilted kasa: pale crown, dark rim and warm underside.
  const hat=new THREE.Group(); hat.position.set(0,.51,-.025); hat.rotation.z=-.10; hat.scale.set(.92,1,.92); head.add(hat);
  mesh(hat,new THREE.CylinderGeometry(.015,.91,.29,64),p.white,0,.13,0);
  mesh(hat,new THREE.CylinderGeometry(.91,.91,.035,64),p.ink,0,-.024,0);
  mesh(hat,new THREE.CylinderGeometry(.885,.885,.012,64),'#e5ba8c',0,-.046,0);
  for(let i=0;i<12;i++) {
    const a=i*Math.PI/6;
    line(hat,[[Math.cos(a)*.06,.268,Math.sin(a)*.06],[Math.cos(a)*.46,.135,Math.sin(a)*.46],[Math.cos(a)*.88,.003,Math.sin(a)*.88]],.008,p.shade);
  }
  for(const phase of [0,Math.PI]) {
    const points=Array.from({length:97},(_,i)=>{
      const a=i/96*Math.PI*2, twist=a*16+phase, radius=.53+Math.cos(twist)*.018;
      return [Math.cos(a)*radius,.14+Math.sin(twist)*.018,Math.sin(a)*radius];
    });
    line(hat,points,.023,p.white);
  }
  for(let i=0;i<5;i++) {
    const a=i*Math.PI*2/5, x=.50+Math.cos(a)*.055, z=.36+Math.sin(a)*.055;
    const petal=ball(hat,x,.275*(1-Math.hypot(x,z)/.91)+.012,z,.042,p.purple,[.65,.22,1.15]); petal.rotation.y=-a;
  }
  for(const side of [-1,1]) {
    const horn=mesh(hat,new THREE.ConeGeometry(.042,.31,16),p.gold,side*.18,.37,-.07); horn.rotation.z=side*-.22;
    const x=side*.77;
    line(hat,[[x,.05,0],[x+side*.02,-.19,.02],[x,-.40,.04]],.027,p.shade);
    for(let i=0;i<3;i++) box(hat,x+(i-1)*.025,-.46,.04,.02,.14,.035,p.purple,.006);
    ball(hat,x,.06,-.03,.11,p.white,[1,1.12,1]);
    line(head,[[side*.52,.43,.27],[side*.49,-.10,.25],[side*.43,-.33,.20]],.012,p.ink);
  }
  // Compact sheathed sword follows the torso so both hands remain free for equipment.
  const sword=new THREE.Group(); sword.position.set(-.41,.47,-.23); sword.rotation.z=-.48; sword.rotation.x=-.20; torso.add(sword);
  box(sword,0,-.24,0,.10,.65,.10,p.ink);
  box(sword,0,-.24,.06,.065,.54,.025,p.white);
  box(sword,0,-.58,0,.12,.07,.12,p.gold);
  box(sword,0,.12,0,.29,.045,.18,p.purple);
  box(sword,0,.24,0,.085,.23,.09,p.ink);
  for(let i=0;i<4;i++) box(sword,0,.16+i*.045,.052,.09,.016,.015,p.white,.003).rotation.z=.35;
  box(sword,0,.37,0,.11,.035,.12,p.gold);
  return { root, torso, head, rightArm, leftArm, legs };
}
