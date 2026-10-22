import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const out='C:/nikke-playground/docs/design/swing-rope-2026-10-22/';
const browser=await chromium.launch({headless:true}),report=[];
try{
 for(const renderer of ['phaser','canvas']){
  const page=await browser.newPage({viewport:{width:1440,height:1050}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4185/'+(renderer==='canvas'?'?renderer=canvas':''));
  await page.waitForFunction(()=>window.garden?.scarletModel==='ready');
  await page.evaluate(()=>{const g=window.garden;g.life.update=()=>{};g.zoom=6;g.focus=null;
   if(!g.game){g.qaTrace=[];const layer=g.drawSwingLayer.bind(g),avatar=g.drawAvatar.bind(g);g.drawSwingLayer=(i,k)=>{g.qaTrace.push(k);g.qaTrace=g.qaTrace.slice(-40);layer(i,k)};g.drawAvatar=a=>{g.qaTrace.push(a.id);g.qaTrace=g.qaTrace.slice(-40);avatar(a)}}
  });
  for(const turn of [0,1,2,3])for(const k of [-16,0,16]){
   await seat('snow',turn,k);await page.waitForTimeout(80);
   const data=await page.evaluate(({renderer,turn,k})=>{
    const g=window.garden,sc=g.game?.scene.scenes[0],item=g.life.layout[0],cell=3-turn%2;
    const pose=sc?sc.swingPose(item):g.swingPose(item),art=(sc||g).swingArt.get(cell);
    const rope=art.ropes[pose.frame],p=rope.getContext('2d').getImageData(0,0,176,176).data;
    let opaque=0,clipped=false;for(let y=0;y<176;y++)for(let x=0;x<176;x++)if(p[(y*176+x)*4+3]){opaque++;if(!x||!y||x===175||y===175)clipped=true;}
    if(sc){
      const view=sc.swingViews.get(item.id),a=sc.avatars.get('snow').sprite;
      return {frame:pose.frame,opaque,clipped,front:view.rope.depth>a.depth&&view.hang.depth<a.depth,sameFrame:view.hang.frame.name===view.rope.frame.name,
       riderX:a.x,expectedX:pose.x+(turn===0||turn===3?-.16:.16)*18};
    }
    const t=g.qaTrace;return {frame:pose.frame,opaque,clipped,front:t.lastIndexOf('ropes')>t.lastIndexOf('snow')&&t.lastIndexOf('hang')<t.lastIndexOf('snow'),sameFrame:true};
   },{renderer,turn,k});
   assert.equal(data.frame,k+16);assert(data.opaque>50);assert.equal(data.clipped,false);assert(data.front);assert(data.sameFrame);
   if(renderer==='phaser')assert(Math.abs(data.riderX-data.expectedX)<1e-7);
   report.push({renderer,turn,k,...data});
   if(turn===0||k===0)await page.locator('#game').screenshot({path:out+`${renderer}-turn${turn}-pose${k}.png`});
  }
  for(const id of ['character','peach','lilac']){await seat(id,0,0);await page.waitForTimeout(60);await page.locator('#game').screenshot({path:out+`${renderer}-${id}.png`});report.push({renderer,character:id,rest:true});}
  await page.evaluate(()=>{const g=window.garden,sc=g.game?.scene.scenes[0],a=g.life.avatars.get('lilac');a.phase='swinging';(sc||g).swingMotion.set('qa-swing',{phase:Math.PI/2,amp:1})});
  await page.waitForTimeout(30);
  assert.notEqual(await page.evaluate(()=>{const g=window.garden,sc=g.game?.scene.scenes[0];return (sc?sc.swingPose(g.life.layout[0]):g.swingPose(g.life.layout[0])).frame}),16);
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(80);
  assert.equal(await page.evaluate(()=>{const g=window.garden,sc=g.game?.scene.scenes[0];return (sc?sc.swingPose(g.life.layout[0]):g.swingPose(g.life.layout[0])).frame}),16);
  const left=await page.evaluate(()=>{const g=window.garden,a=g.life.avatars.get('lilac');g.life.leave('lilac');for(let i=0;i<20;i++)Object.getPrototypeOf(g.life).update.call(g.life,.1);return {seat:a.seatId,reserved:g.life.reservations.has('qa-swing-seat')}});
  assert.equal(left.seat,null);assert.equal(left.reserved,false);
  await page.evaluate(()=>window.garden.restoreLayout({items:[],stored:[]}));await page.waitForTimeout(80);
  assert.equal(await page.evaluate(()=>{const g=window.garden,sc=g.game?.scene.scenes[0];return sc?sc.swingViews.size:g.swingMotion.size}),0);
  assert.deepEqual(errors,[]);await page.close();
  async function seat(id,turn,k){await page.evaluate(({id,turn,k})=>{
   const g=window.garden;g.restoreLayout({items:[{id:'qa-swing',kind:'swing',x:0,z:0,turn}],stored:[]});
   for(const a of g.life.avatars.values())Object.assign(a,{x:-10,z:-10,phase:'idle',until:1e9});
   const s=g.life.seats.find(s=>s.equipment==='qa-swing'),a=g.life.avatars.get(id);
   Object.assign(a,{x:s.x,z:s.z,seatId:s.id,phase:k?'swinging':'seated',progress:1,until:1e9,yaw:s.yaw});g.life.reservations.set(s.id,id);
   const sc=g.game?.scene.scenes[0],m={get amp(){return k?1:0},set amp(v){},get phase(){return k<0?-Math.PI/2:k>0?Math.PI/2:0},set phase(v){}};
   (sc||g).swingMotion.set(s.equipment,m);
  },{id,turn,k});}
 }
 await writeFile(out+'verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify({cases:report.length,renderers:2,rotations:4,poses:3,ropeInFront:true,riderAttached:true,allCharacters:true,reducedMotion:true,cleanup:true}));
}finally{await browser.close()}
