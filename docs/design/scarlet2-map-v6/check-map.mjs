import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile,readFile} from 'node:fs/promises';
const out='C:/nikke-playground/docs/design/scarlet2-map-v6/';
for(const name of ['idle-se.png','idle-ne.png','walk-se.png','walk-ne.png','review.html'])assert((await readFile(`C:/nikke-playground/apps/client/dist/sprites/scarlet2/approved-v6/${name}`)).length>0,`Build pruned ${name}`);
const browser=await chromium.launch({headless:true});const results=[];
try{
 for(const renderer of ['phaser','canvas']){
  const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];const loaded=new Set();
  page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);if(r.url().includes('/sprites/scarlet2/approved-v6/')&&r.status()===200)loaded.add(r.url().split('/').pop())});
  await page.addInitScript(()=>{
   localStorage.clear();Math.random=()=>.99;window.scarletDraws=[];
   const draw=CanvasRenderingContext2D.prototype.drawImage;
   CanvasRenderingContext2D.prototype.drawImage=function(im,...args){if(im instanceof HTMLImageElement&&im.src.includes('/sprites/scarlet2/approved-v6/')){window.scarletDraws.push({src:im.src.split('/').pop(),args,a:this.getTransform().a});if(window.scarletDraws.length>200)window.scarletDraws.shift()}return draw.call(this,im,...args)};
  });
  await page.goto(`http://127.0.0.1:4185/${renderer==='canvas'?'?renderer=canvas':''}`);
  await page.waitForFunction(()=>window.garden?.scarletModel==='ready');
  await page.evaluate(()=>{const g=window.garden;g.life.dayCycle=false;for(const a of g.life.avatars.values()){a.phase='idle';a.until=Infinity;a.path=[];a.directed=true}});
  await page.waitForTimeout(150);await page.screenshot({path:out+`${renderer}-park.png`});
  assert.deepEqual([...loaded].sort(),['idle-ne.png','idle-se.png','walk-ne.png','walk-se.png']);
  if(renderer==='phaser')assert(await page.evaluate(async()=>{
   const scene=window.garden.game.scene.getScene('garden');
   for(const source of ['se','ne'])for(const pose of ['idle','walk']){
    const original=new Image;original.src=`sprites/scarlet2/approved-v6/${pose}-${source}.png`;await original.decode();
    const make=im=>{const c=document.createElement('canvas');c.width=original.naturalWidth;c.height=128;c.getContext('2d').drawImage(im,0,0);return c.toDataURL()};
    if(make(original)!==make(scene.textures.get(`${pose}-${source}`).getSourceImage()))return false;
   }return true;
  }),'Phaser textures must contain the exact runtime PNGs');
  await page.evaluate(()=>{const g=window.garden;g.restoreLayout({items:[],stored:[]});g.focusFriend();for(const a of g.life.avatars.values()){a.phase='idle';a.until=Infinity;a.path=[];a.directed=true;if(a.id!=='character'){a.x=-6;a.z=a.id==='peach'?-6:6}}});
  const directions=[];
  for(const [d,dx,dz,source,flip] of [['se',1,0,'se',false],['sw',0,1,'se',true],['ne',0,-1,'ne',false],['nw',-1,0,'ne',true]]){
   const error=await page.evaluate(({dx,dz})=>{const g=window.garden,a=g.life.avatars.get('character');a.x=.5;a.z=.5;a.phase='idle';a.path=[];a.until=Infinity;window.scarletDraws=[];return g.life.moveTo('character',{x:.5+2*dx,z:.5+2*dz})},{dx,dz});assert.equal(error,null);
   const frames=new Set();
   for(let n=0;n<12;n++){
    await page.waitForTimeout(90);
    const state=await page.evaluate(renderer=>{const g=window.garden;if(renderer==='phaser'){const scene=g.game.scene.getScene('garden'),s=scene.avatars.get('character').sprite;return {texture:s.texture.key,frame:s.frame.name,width:s.frame.width,height:s.frame.height,flip:s.flipX,origin:s.originY,src:s.texture.getSourceImage().src}}return window.scarletDraws.at(-1)},renderer);
    if(renderer==='phaser'){assert.equal(state.texture,`walk-${source}`);assert.equal(state.width,128);assert.equal(state.height,128);assert.equal(state.flip,flip);assert.equal(state.origin,115/128);frames.add(Number(state.frame))}
    else{assert.equal(state.src,`walk-${source}.png`);assert.equal(state.args[2],128);assert.equal(state.args[3],128);assert.equal(state.a<0,flip);frames.add(state.args[0]/128)}
   }
   assert.equal(frames.size,4,`${renderer} ${d} must cycle four exact drawings`);directions.push({direction:d,frames:[...frames].sort()});
   if(d==='se'||d==='ne')await page.screenshot({path:out+`${renderer}-${d}-moving.png`});
   await page.evaluate(()=>{const a=window.garden.life.avatars.get('character');a.phase='idle';a.path=[];a.until=Infinity;window.scarletDraws=[]});await page.waitForTimeout(90);
   const idle=await page.evaluate(renderer=>renderer==='phaser'?window.garden.game.scene.getScene('garden').avatars.get('character').sprite.texture.key:window.scarletDraws.at(-1)?.src,renderer);assert.equal(idle,renderer==='phaser'?`idle-${source}`:`idle-${source}.png`);
  }
  assert.deepEqual(errors,[]);results.push({renderer,directions,standingV2:true,walkingV6:true,frameSize:128,errors});await page.close();
 }
 await writeFile(out+'browser-check.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));
}finally{await browser.close()}
