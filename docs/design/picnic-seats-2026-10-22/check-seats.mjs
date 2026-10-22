import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const out='C:/nikke-playground/docs/design/picnic-seats-2026-10-22/';
const browser=await chromium.launch({headless:true}),report=[];
try{
 for(const renderer of ['phaser','canvas']){
  const page=await browser.newPage({viewport:{width:1440,height:1050}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4185/'+(renderer==='canvas'?'?renderer=canvas':''));await page.waitForFunction(()=>window.garden?.scarletModel==='ready');
  await page.evaluate(()=>{const g=window.garden;g.life.update=()=>{};g.focus=null;g.zoom=5;
   if(!g.game){const draw=g.ctx.drawImage.bind(g.ctx);g.ctx.drawImage=(image,...args)=>{
    if(image instanceof HTMLImageElement&&image.src.includes('snow-white')&&/sit-(se|ne)\.png/.test(image.src)){
     const hip=image.src.includes('sit-se')?[54,94]:[59,94],s=args[2],m=g.ctx.getTransform();g.qaHip=m.transformPoint(new DOMPoint(hip[0]*s/128,hip[1]*s/128));
    }return draw(image,...args)};
    g.qaTrace=[];const top=g.drawPicnicTop.bind(g),avatar=g.drawAvatar.bind(g);g.drawPicnicTop=(i,f=false)=>{g.qaTrace.push(f?'front':'top');g.qaTrace=g.qaTrace.slice(-40);top(i,f)};g.drawAvatar=a=>{g.qaTrace.push(a.id);g.qaTrace=g.qaTrace.slice(-40);avatar(a)};
   }
  });
  for(const turn of [0,1,2,3])for(const bench of ['near','far'])for(const side of [-1,1]){
   await setup('snow',turn,bench,side);await page.waitForTimeout(60);
   const data=await page.evaluate(({renderer,turn,bench,side})=>{
    const g=window.garden,sc=g.game?.scene.scenes[0],item=g.life.layout[0],a=g.life.avatars.get('snow'),s=g.life.seatOf(a);
    const t=side<0?.25:.75,line=bench==='near'?[[11,80],[62,108]]:[[64,55],[120,86]];
    const contact={x:line[0][0]+(line[1][0]-line[0][0])*t,y:line[0][1]+(line[1][1]-line[0][1])*t};
    if(sc){const view=sc.avatars.get('snow').sprite,table=sc.props.get('qa-table'),front=sc.picnicFronts.get('qa-table'),top=sc.picnicTops.get('qa-table');
     const h=bench==='far'?[54,94]:[59,94],hx=view.x+((view.flipX?128-h[0]:h[0])/128-.5)*view.displayWidth,hy=view.y+(h[1]/128-view.originY)*view.displayHeight;
     const targetX=table.x+(contact.x/128-.5)*table.displayWidth*(table.flipX?-1:1),targetY=table.y+(contact.y/128-1)*table.displayHeight;
     return {error:Math.hypot(hx-targetX,hy-targetY),front:front.depth>view.depth,tabletop:bench==='far'?top.depth>view.depth:top.depth<view.depth,source:view.texture.key,flip:view.flipX,seat:s.id};
    }
    const p=g.screen(item),art=g.parkProps.get('picnicTable'),size=Math.round(5.8*g.unit*128/art.width),x=Math.round(p.x-size/2),y=Math.round(p.y-size+g.unit*1.2);
    const rawX=x+contact.x*size/128,targetX=turn%2?2*p.x-rawX:rawX,targetY=y+contact.y*size/128;
    const tr=g.qaTrace;return {error:Math.hypot(g.qaHip.x-targetX,g.qaHip.y-targetY),front:tr.lastIndexOf('front')>tr.lastIndexOf('snow'),tabletop:bench==='far'?tr.lastIndexOf('top')>tr.lastIndexOf('snow'):tr.lastIndexOf('top')<tr.lastIndexOf('snow'),seat:s.id};
   },{renderer,turn,bench,side});
   assert(data.error<(renderer==='phaser'?1e-7:1.7),JSON.stringify({renderer,turn,bench,side,...data}));assert(data.front);assert(data.tabletop);
   if(renderer==='phaser'){assert.equal(data.source,bench==='far'?'snow-sit-se':'snow-sit-ne');assert.equal(data.flip,bench==='far'?!(turn%2):!!(turn%2));}
   report.push({renderer,turn,bench,side,...data});
   if(side===1&&turn<2)await page.locator('#game').screenshot({path:out+`${renderer}-${turn}-${bench}.png`});
  }
  for(const id of ['character','peach','lilac'])for(const bench of ['near','far']){
   await setup(id,0,bench,1);await page.waitForTimeout(50);await page.locator('#game').screenshot({path:out+`${renderer}-${id}-${bench}.png`});report.push({renderer,id,bench,seated:true});
  }
  await page.evaluate(()=>{const g=window.garden;g.life.reservations.clear();[...g.life.avatars.values()].forEach((a,i)=>{const s=g.life.seats.filter(s=>s.kind==='picnicTable')[i];Object.assign(a,{x:s.x,z:s.z,seatId:s.id,phase:'seated',progress:1,until:1e9,yaw:s.yaw});g.life.reservations.set(s.id,a.id)})});
  await page.waitForTimeout(50);await page.locator('#game').screenshot({path:out+`${renderer}-four-friends.png`});
  const leave=await page.evaluate(()=>{const g=window.garden;g.life.leave('snow');for(let i=0;i<30;i++)Object.getPrototypeOf(g.life).update.call(g.life,.1);return {seat:g.life.avatars.get('snow').seatId,count:g.life.reservations.size}});
  assert.equal(leave.seat,null);assert.equal(leave.count,3);
  await page.evaluate(()=>window.garden.restoreLayout({items:[],stored:[]}));await page.waitForTimeout(60);
  if(renderer==='phaser')assert.equal(await page.evaluate(()=>window.garden.game.scene.scenes[0].picnicFronts.size),0);
  assert.deepEqual(errors,[]);await page.close();
  async function setup(id,turn,bench,side){await page.evaluate(({id,turn,bench,side})=>{
   const g=window.garden;g.restoreLayout({items:[{id:'qa-table',kind:'picnicTable',x:0,z:0,turn}],stored:[]});for(const a of g.life.avatars.values())Object.assign(a,{x:-10,z:-10,seatId:null,phase:'idle',until:1e9});
   const s=g.life.seats.find(s=>s.bench===bench&&s.side===side),a=g.life.avatars.get(id);Object.assign(a,{x:s.x,z:s.z,seatId:s.id,phase:'seated',progress:1,until:1e9,yaw:s.yaw});g.life.reservations.set(s.id,id);
  },{id,turn,bench,side});}
 }
 await writeFile(out+'verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify({cases:report.length,hipMatchesBench:true,renderers:2,rotations:4,seats:4,allCharacters:true,fourRiders:true,leaveAndCleanup:true}));
}finally{await browser.close()}
