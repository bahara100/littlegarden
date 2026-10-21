import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const out='C:/nikke-playground/docs/design/scarlet2-chair-map-v2/';
const browser=await chromium.launch({headless:true});const report=[];
try{
 for(const renderer of ['phaser','canvas']){
  const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
  await page.addInitScript(()=>{localStorage.clear();Math.random=()=>.99;window.heroDraws=[];const draw=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(im,...args){if(im instanceof HTMLImageElement&&im.src.includes('/sprites/scarlet2/approved-v6/')){window.heroDraws.push({file:im.src.split('/').pop(),a:this.getTransform().a,args});if(window.heroDraws.length>40)window.heroDraws.shift()}return draw.call(this,im,...args)}});
  await page.goto(`http://127.0.0.1:4185/${renderer==='canvas'?'?renderer=canvas':''}`);await page.waitForFunction(()=>window.garden?.scarletModel==='ready');
  const cases=[['bench',0,0],['bench',1,0],['swing',0,0],['swing',1,0],['seesaw',0,0],['seesaw',0,1],['picnicTable',0,0],['picnicTable',0,2],['picnicTable',1,0],['picnicTable',1,2],['picnicRug',0,0]];
  for(const [kind,turn,fill] of cases){
   const state=await page.evaluate(({kind,turn,fill})=>{
    const g=window.garden,itemId=`chair-${kind}-${turn}-${fill}`;g.life.dayCycle=false;const layoutError=g.restoreLayout({items:kind==='picnicRug'?[]:[{id:itemId,kind,x:0,z:-1.5,turn}],stored:[]});if(layoutError)throw Error(`${kind}/${turn} restore: ${layoutError}`);g.selectedAvatar='character';g.focusFriend();
    for(const a of g.life.avatars.values()){a.phase='idle';a.path=[];a.until=Infinity;a.directed=true}
    const id=kind==='picnicRug'?'picnic-rug':itemId;
    for(const friend of ['peach','lilac'].slice(0,fill)){const e=g.life.use(friend,id);if(e)throw Error(`${kind}/${turn}/${fill} ${friend}: ${e}`)}
    const e=g.life.use('character',id);if(e)throw Error(`${kind}/${turn}/${fill} character: ${e}`);
    const a=g.life.avatars.get('character');let tries=0;
    while(!['seated','swinging'].includes(a.phase)&&tries++<500)g.life.update(.1);
    if(tries>=500)throw Error(`Could not sit: ${kind} ${a.phase}`);
    a.until=Infinity;for(let n=0;n<30;n++)g.life.update(.1);
    a.until=Infinity;const seat=g.life.seatOf(a);
    const dir=(kind==='bench'||kind==='swing')?(turn===0||turn===3?'sw':'se'):(Math.abs(Math.sin(seat.yaw))>=Math.abs(Math.cos(seat.yaw))?(Math.sin(seat.yaw)>=0?'se':'nw'):(Math.cos(seat.yaw)>=0?'sw':'ne'));
    window.heroDraws=[];return {phase:a.phase,dir,seat:seat.kind};
   },{kind,turn,fill});
   await page.waitForTimeout(120);
   const source=state.dir==='se'||state.dir==='sw'?'se':'ne',flip=state.dir==='sw'||state.dir==='nw',pose=kind==='picnicRug'?'idle':'sit';
   const shown=await page.evaluate(renderer=>{const g=window.garden;if(renderer==='phaser'){const s=g.game.scene.getScene('garden').avatars.get('character').sprite;return {file:s.texture.key,flip:s.flipX,origin:s.originY}}return window.heroDraws.at(-1)},renderer);
   assert.equal(shown.file,renderer==='phaser'?`${pose}-${source}`:`${pose}-${source}.png`,`${renderer} ${kind} ${turn} ${fill}`);
   assert.equal(renderer==='phaser'?shown.flip:shown.a<0,flip);
   if(renderer==='phaser')assert.equal(shown.origin,kind==='picnicRug'?115/128:(96*.97+24)/128);
   if((kind==='bench'&&turn===0)||(kind==='picnicTable'&&fill===2)||(kind==='seesaw'&&fill===1))await page.screenshot({path:out+`${renderer}-${kind}-${turn}-${fill}.png`});
   await page.evaluate(()=>{const g=window.garden,a=g.life.avatars.get('character');g.life.leave('character');let n=0;while((a.seatId||a.phase!=='idle')&&n++<500)g.life.update(.1);if(n>=500)throw Error('Failed to leave');a.until=Infinity;window.heroDraws=[]});
   await page.waitForTimeout(90);
   const standing=await page.evaluate(renderer=>renderer==='phaser'?{file:window.garden.game.scene.getScene('garden').avatars.get('character').sprite.texture.key,origin:window.garden.game.scene.getScene('garden').avatars.get('character').sprite.originY}:window.heroDraws.at(-1),renderer);
   assert(standing.file.startsWith('idle-'));if(renderer==='phaser')assert.equal(standing.origin,115/128);
   report.push({renderer,kind,turn,fill,direction:state.dir,pose,stoodUp:true});
  }
  assert.deepEqual(errors,[]);await page.close();
 }
 await writeFile(out+'browser-check.json',JSON.stringify(report,null,2));console.log(JSON.stringify({cases:report.length,directions:[...new Set(report.filter(r=>r.pose==='sit').map(r=>r.direction))],bothRenderers:true,standingRestored:true,rugUnchanged:true,errors:[]}));
}finally{await browser.close()}
