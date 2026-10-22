import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const out='C:/nikke-playground/docs/design/snow-white-walk-v1/';
const browser=await chromium.launch({headless:true}),report=[];
try{
 for(const [viewport,width,height] of [['desktop',1440,1050],['mobile',390,844]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
  await page.goto('http://127.0.0.1:4185/snow-white-walk-v1/index.html?v=arm-edge-r7&dir=ne&frame=3');await page.waitForFunction(()=>window.review?.ready);
  assert.deepEqual(await page.evaluate(()=>[window.review.dir,window.review.frame,window.review.playing]),['ne',2,false]);
  assert.equal(await page.locator('[data-dir="ne"]').getAttribute('aria-pressed'),'true');
  for(const d of ['se','sw','ne','nw']){
   await page.locator(`[data-dir="${d}"]`).click();
   for(let n=0;n<4;n++){
    await page.locator(`[data-frame="${n}"]`).click();
    const data=await page.evaluate(async({d,n})=>{
     const check=async(id,src,rect)=>{
      const im=new Image;im.src=src;await im.decode();const canvas=document.getElementById(id),ref=document.createElement('canvas');ref.width=canvas.width;ref.height=canvas.height;
      const ctx=ref.getContext('2d');ctx.imageSmoothingEnabled=false;if(rect)ctx.drawImage(im,...rect,0,0,ref.width,ref.height);else ctx.drawImage(im,0,0,ref.width,ref.height);
      const a=canvas.getContext('2d').getImageData(0,0,ref.width,ref.height).data,b=ctx.getImageData(0,0,ref.width,ref.height).data;
      return a.every((v,i)=>v===b[i]);
     };
     const rect=[d.endsWith('w')?42:54,60,32,26];
     return {walkExact:await check('walk',`frame-${d}-${n+1}.png`),baseExact:await check('base',`base-${d}-${n+1}.png`),
      neckBeforeExact:await check('neck-before',d.startsWith('s')?`before-neck-${d}-${n+1}.png`:`frame-${d}-${n+1}.png`,rect),neckAfterExact:await check('neck-after',`frame-${d}-${n+1}.png`,rect),
      smoothing:[...document.querySelectorAll('canvas')].some(c=>c.getContext('2d').imageSmoothingEnabled),frame:window.review.frame,dir:window.review.dir,playing:window.review.playing,
      overflow:document.documentElement.scrollWidth>innerWidth};
    },{d,n});
    assert.equal(data.walkExact,true);assert.equal(data.baseExact,true);assert.equal(data.neckBeforeExact,true);assert.equal(data.neckAfterExact,true);assert.equal(data.smoothing,false);assert.equal(data.overflow,false);assert.equal(data.frame,n);assert.equal(data.dir,d);assert.equal(data.playing,false);
    report.push({viewport,direction:d,frame:n+1,actualPngExact:true,baseSynchronized:true,neckComparisonExact:true});
   }
   if(viewport==='desktop'){await page.locator('[data-frame="0"]').click();await page.screenshot({path:out+`desktop-${d}.png`,fullPage:true})}
  }
  await page.locator('[data-dir="se"]').click();await page.locator('[data-frame="0"]').click();
  if(viewport==='mobile')await page.screenshot({path:out+'mobile.png',fullPage:true});
  await page.locator('#slow').click();assert.equal(await page.evaluate(()=>window.review.fps),3);
  await page.locator('#play').click();await page.waitForFunction(()=>window.review.frame!==0);assert.equal(await page.evaluate(()=>window.review.playing),true);
  await page.locator('#play').click();await page.locator('#backdrop').click();assert.equal(await page.locator('body.dark').count(),1);
  const zip=await page.request.get('http://127.0.0.1:4185/snow-white-walk-v1/snow-white-walk-v1.zip');assert.equal(zip.status(),200);
  assert.deepEqual(errors,[]);await page.close();
 }
 await writeFile(out+'browser-check.json',JSON.stringify(report,null,2));console.log(JSON.stringify({cases:report.length,desktopAndMobile:true,pngExact:true,baseSync:true,playback:true,download:true}));
}finally{await browser.close()}
