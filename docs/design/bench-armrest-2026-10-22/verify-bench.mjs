import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const out='C:/nikke-playground/docs/design/bench-armrest-2026-10-22/';
const browser=await chromium.launch({headless:true}),results=[];
try{
 for(const renderer of ['phaser','canvas']){
  const page=await browser.newPage({viewport:{width:1440,height:1050}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4185/'+(renderer==='canvas'?'?renderer=canvas':''));
  await page.waitForFunction(()=>window.garden?.scarletModel==='ready');
  const mask=await page.evaluate(renderer=>{
   const g=window.garden,sc=renderer==='phaser'?g.game.scene.scenes[0]:null;
   return [0,1].map(n=>{
    const full=sc?sc.textures.get('prop'+n).getSourceImage():g.props[n].image;
    const front=sc?sc.textures.get('bench-front-'+n).getSourceImage():g.benchFronts[n];
    const a=full.getContext('2d').getImageData(0,0,128,128).data,b=front.getContext('2d').getImageData(0,0,128,128).data;
    let kept=0,same=true,wood=0;
    for(let i=0;i<b.length;i+=4)if(b[i+3]){kept++;same&&=[0,1,2,3].every(k=>a[i+k]===b[i+k]);if(b[i]>b[i+1]&&b[i+1]>b[i+2])wood++;}
    return {kept,same,wood};
   });
  },renderer);
  for(const m of mask){assert(m.kept>200&&m.kept<1800);assert(m.same);assert.equal(m.wood,0);}
  await page.evaluate(()=>{
   const g=window.garden;g.life.update=()=>{};g.zoom=6;g.focus=null;
   if(!g.game){g.benchTrace=[];const arm=g.drawBenchFront.bind(g),avatar=g.drawAvatar.bind(g);g.drawBenchFront=i=>{g.benchTrace.push('arm');g.benchTrace=g.benchTrace.slice(-40);arm(i)};g.drawAvatar=a=>{g.benchTrace.push(a.id);g.benchTrace=g.benchTrace.slice(-40);avatar(a)}}
  });
  for(const turn of [0,1,2,3])for(const suffix of ['left','right']){
   await seat('snow',turn,suffix);
   await page.waitForTimeout(80);
   const data=await page.evaluate(renderer=>{
    const g=window.garden,a=g.life.avatars.get('snow'),s=g.life.seatOf(a),p=(a.x-a.z),turn=g.life.layout[0].turn;
    if(renderer==='phaser'){
     const sc=g.game.scene.scenes[0],front=sc.benchFronts.get('qa-bench'),view=sc.avatars.get('snow').sprite;
     return {frontAfterRider:front.depth>view.depth,shift:(view.x-p*18)/18,origin:view.originY,seat:s.id};
    }
    const trace=g.benchTrace;return {frontAfterRider:trace.lastIndexOf('arm')>trace.lastIndexOf('snow'),shift:null,seat:s.id};
   },renderer);
   assert(data.frontAfterRider);assert.equal(data.seat,`qa-bench-${suffix}`);
   if(renderer==='phaser')assert(Math.abs(data.shift-(turn===0||turn===3?-.16:.16))<1e-8);
   results.push({renderer,turn,seat:suffix,...data});
   if(suffix==='right')await page.locator('#game').screenshot({path:out+`${renderer}-turn-${turn}.png`});
  }
  for(const id of ['character','peach','lilac']){
   await seat(id,0,'right');await page.waitForTimeout(80);
   await page.locator('#game').screenshot({path:out+`${renderer}-${id}.png`});
   results.push({renderer,character:id,seated:true});
  }
  const leave=await page.evaluate(()=>{
   const g=window.garden,a=g.life.avatars.get('lilac'),seat=g.life.seatOf(a);g.leaveSeat=Object.getPrototypeOf(g).leaveSeat.bind(g);g.selectedAvatar='lilac';g.leaveSeat();
   const leavePhase=a.phase;
   for(let n=0;n<50;n++)Object.getPrototypeOf(g.life).update.call(g.life,.1);
   return {leavePhase,phase:a.phase,seat:a.seatId,reserved:g.life.reservations.has(seat.id)};
  });
  assert.equal(leave.leavePhase,'leaving');assert.equal(leave.seat,null);assert.equal(leave.reserved,false);
  await page.evaluate(()=>window.garden.restoreLayout({items:[],stored:[]}));await page.waitForTimeout(80);
  if(renderer==='phaser')assert.equal(await page.evaluate(()=>window.garden.game.scene.scenes[0].benchFronts.size),0);
  assert.deepEqual(errors,[]);await page.close();
  async function seat(id,turn,suffix){
   await page.evaluate(({id,turn,suffix})=>{
    const g=window.garden;g.restoreLayout({items:[{id:'qa-bench',kind:'bench',x:0,z:0,turn}],stored:[]});
    for(const a of g.life.avatars.values())Object.assign(a,{x:-10,z:-10,phase:'idle',until:1e9});
    const s=g.life.seats.find(s=>s.id===`qa-bench-${suffix}`),a=g.life.avatars.get(id);
    Object.assign(a,{x:s.x,z:s.z,seatId:s.id,phase:'seated',progress:1,until:1e9,yaw:s.yaw});g.life.reservations.set(s.id,id);
   },{id,turn,suffix});
  }
 }
 await writeFile(out+'verification.json',JSON.stringify({cases:results,masksPreserveSource:true,emptyBenchCleanup:true,leaveReservationReleased:true},null,2));
 console.log(JSON.stringify({cases:results.length,renderers:2,rotations:4,seats:2,allCharacters:true,leaveAndCleanup:true}));
}finally{await browser.close()}
