import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({headless:true});
const out='C:/nikke-playground/docs/design/snow-white-idle-v1/';
const results=[];
try {
 for(const [name,width,height] of [['desktop',1440,1050],['mobile',390,844]]) {
  const page=await browser.newPage({viewport:{width,height}});const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
  await page.goto('http://127.0.0.1:4185/snow-white-idle-v1/index.html');
  for(const d of ['se','sw','ne','nw']) {
   await page.locator(`[data-dir="${d}"]`).click();
   await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));
   const info=await page.evaluate(()=>({src:document.getElementById('art').getAttribute('src'),images:[...document.images].map(i=>({w:i.naturalWidth,scale:i.getBoundingClientRect().width/i.naturalWidth,render:getComputedStyle(i).imageRendering})),overflow:document.documentElement.scrollWidth>innerWidth}));
   assert.equal(info.src,`idle-${d}.png`);assert.equal(info.overflow,false);
   for(const im of info.images){assert.equal(im.w,128);assert.equal(im.render,'pixelated');assert.equal(im.scale%1,0)}
   results.push({viewport:name,direction:d,integerScaling:true,loaded:true});
  }
  await page.locator('[data-dir="se"]').click();
  await page.screenshot({path:out+name+'.png',fullPage:true});
  await page.locator('#backdrop').click();assert.equal(await page.locator('.stage.dark').count(),7);
  const zip=await page.request.get('http://127.0.0.1:4185/snow-white-idle-v1/snow-white-idle-v1.zip');assert.equal(zip.status(),200);
  assert.deepEqual(errors,[]);await page.close();
 }
 await writeFile(out+'browser-check.json',JSON.stringify(results,null,2));
 console.log(JSON.stringify(results));
}finally{await browser.close()}
