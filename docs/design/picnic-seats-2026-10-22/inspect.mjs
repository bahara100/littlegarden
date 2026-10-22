import {chromium} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const out='C:/nikke-playground/docs/design/picnic-seats-2026-10-22/';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1050}});
 await page.goto('http://127.0.0.1:4185/');await page.waitForFunction(()=>window.garden?.scarletModel==='ready');
 await page.evaluate(()=>{const g=window.garden;g.restoreLayout({items:[{id:'qa-table',kind:'picnicTable',x:0,z:0,turn:0}],stored:[]});g.life.update=()=>{};g.focus=null;g.zoom=5;});
 const art=await page.evaluate(()=>window.garden.game.scene.scenes[0].textures.get('park-fit-picnicTable').getSourceImage().toDataURL());
 await writeFile(out+'table-grid.png',Buffer.from(art.split(',')[1],'base64'));
 for(const bench of ['near','far'])for(const side of [-1,1]){
  const data=await page.evaluate(({bench,side})=>{
   const g=window.garden;g.life.reservations.clear();for(const a of g.life.avatars.values())Object.assign(a,{x:-10,z:-10,seatId:null,phase:'idle',until:1e9});
   const s=g.life.seats.find(s=>s.bench===bench&&s.side===side),a=g.life.avatars.get('snow');
   Object.assign(a,{x:s.x,z:s.z,seatId:s.id,phase:'seated',progress:1,until:1e9,yaw:s.yaw});g.life.reservations.set(s.id,a.id);return s;
  },{bench,side});
  await page.waitForTimeout(100);await page.locator('#game').screenshot({path:out+`before-${bench}-${side}.png`});
  console.log(data);
 }
}finally{await browser.close()}
