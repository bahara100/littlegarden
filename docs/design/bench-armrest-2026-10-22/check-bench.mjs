import {chromium} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const out='C:/nikke-playground/docs/design/bench-armrest-2026-10-22/';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1050}});
 await page.goto('http://127.0.0.1:4185/');await page.waitForFunction(()=>window.garden?.scarletModel==='ready');
 await page.evaluate(()=>{
  const g=window.garden;g.restoreLayout({items:[{id:'qa-bench',kind:'bench',x:0,z:0,turn:0}],stored:[]});g.life.update=()=>{};
  for(const a of g.life.avatars.values()){a.x=-10;a.z=-10;a.phase='idle';a.until=1e9;}
  const seat=g.life.seats.find(s=>s.id==='qa-bench-right'),a=g.life.avatars.get('snow');
  Object.assign(a,{x:seat.x,z:seat.z,seatId:seat.id,phase:'seated',progress:1,until:1e9,yaw:seat.yaw});g.life.reservations.set(seat.id,'snow');
  g.focus=null;g.zoom=6;
 });
 await page.waitForTimeout(200);
 const imgs=await page.evaluate(()=>{const sc=window.garden.game.scene.scenes[0];return [0,1].map(n=>sc.textures.get('bench-front-'+n).getSourceImage().toDataURL())});
 for(let n=0;n<2;n++)await writeFile(out+`bench-front-${n}.png`,Buffer.from(imgs[n].split(',')[1],'base64'));
 await page.locator('#game').screenshot({path:out+'after-snow.png'});
}finally{await browser.close()}
