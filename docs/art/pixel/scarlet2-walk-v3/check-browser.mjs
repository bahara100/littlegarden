import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const out='C:/nikke-playground/docs/art/pixel/scarlet2-walk-v3/';
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage({viewport:{width:1440,height:1200},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
 await page.goto('http://127.0.0.1:4185/scarlet2-walk-v3/index.html');
 await page.waitForSelector('body[data-ready=true]');
 const frames=new Set();
 for(let n=0;n<12;n++){frames.add(await page.locator('#walk').getAttribute('data-frame'));await page.waitForTimeout(90)}
 assert.equal(frames.size,4);
 for(const d of ['se','sw','ne','nw']){
  await page.locator(`[data-dir="${d}"]`).click();
  const hashes=[];
  for(let n=0;n<4;n++){
   await page.locator(`[data-frame="${n}"]`).click();
   assert.equal(await page.locator('#walk').getAttribute('data-frame'),String(n));
   const equal=await page.evaluate(async ({d,n})=>{const original=new Image;original.src=`frame-${d}-${n+1}.png`;await original.decode();const c=document.createElement('canvas');c.width=c.height=384;const x=c.getContext('2d');x.imageSmoothingEnabled=false;x.drawImage(original,0,0,384,384);return c.toDataURL()===document.querySelector('#walk').toDataURL()},{d,n});
   assert(equal,'Canvas differs from exact displayed PNG');
   const details=await page.evaluate(async ({d,n})=>{for(const [id,src] of [['new-detail',`frame-${d}-${n+1}.png`],['old-detail',`../scarlet2-walk-v2/frame-${d}-${n+1}.png`]]){const im=new Image;im.src=src;await im.decode();const c=document.createElement('canvas');c.width=320;c.height=240;const x=c.getContext('2d');x.imageSmoothingEnabled=false;x.drawImage(im,44,70,40,30,0,0,320,240);if(c.toDataURL()!==document.getElementById(id).toDataURL())return false}return true},{d,n});
   assert(details,'Upper-body magnifier differs from actual sprite');
   hashes.push(await page.locator('#walk').evaluate(c=>c.toDataURL()));
  }
  assert.equal(new Set(hashes).size,4);
 }
 await page.locator('[data-dir="se"]').click();await page.locator('[data-frame="0"]').click();
 await page.screenshot({path:out+'browser-desktop.png',fullPage:true});
 await page.locator('[data-dir="ne"]').click();await page.locator('[data-frame="2"]').click();
 await page.screenshot({path:out+'browser-rear.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:out+'browser-mobile.png',fullPage:true});
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);assert(!overflow);
 assert.deepEqual(errors,[]);
 const report={oneBrowser:true,playedFrames:[...frames],directions:4,frameSelections:16,canvasMatchesActualPng:true,upperBodyMagnifiersMatchActualPng:true,mobileOverflow:false,errors};
 await writeFile(out+'browser-check.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close()}
