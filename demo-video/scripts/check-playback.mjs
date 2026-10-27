// Play only the final MP4 over a temporary loopback server; no account access.
import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { createReadStream, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const video = fileURLToPath(new URL('../output/shadowbid-zecathon-demo-revised.mp4', import.meta.url));
const size = statSync(video).size;
const server = createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, {'content-type': 'text/html'});
    res.end('<!doctype html><html><body style="margin:0;background:#080a13"><video controls muted style="width:100vw;height:100vh" src="/film.mp4"></video></body></html>');
    return;
  }
  if (req.url !== '/film.mp4') { res.writeHead(404); res.end(); return; }
  const range = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range || '');
  const start = range ? Number(range[1]) : 0;
  const end = range?.[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
  if (start > end || start >= size) { res.writeHead(416); res.end(); return; }
  res.writeHead(range ? 206 : 200, {'content-type': 'video/mp4', 'accept-ranges': 'bytes',
    'content-length': end - start + 1, ...(range ? {'content-range': `bytes ${start}-${end}/${size}`} : {})});
  createReadStream(video, {start, end}).pipe(res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await chromium.launch({executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
    '/home/sopski/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome'});
  const page = await browser.newPage({viewport: {width: 1920, height: 1080}});
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.waitForFunction(() => document.querySelector('video').readyState >= 2);
  await page.evaluate(() => document.querySelector('video').play());
  await page.waitForFunction(() => document.querySelector('video').currentTime > 2);
  const metadata = await page.evaluate(() => {
    const v = document.querySelector('video');
    return {duration: v.duration, width: v.videoWidth, height: v.videoHeight,
      decodedFrames: v.getVideoPlaybackQuality().totalVideoFrames, error: v.error?.code || null};
  });
  assert.equal(metadata.width, 1920); assert.equal(metadata.height, 1080);
  assert(metadata.duration >= 116.9 && metadata.duration < 118);
  assert(metadata.decodedFrames > 0); assert.equal(metadata.error, null);
  await page.evaluate(() => {const v = document.querySelector('video'); v.pause(); v.currentTime = 114;});
  await page.waitForFunction(() => {const v=document.querySelector('video');return !v.seeking && v.readyState >= 2;});
  await page.setViewportSize({width: 844, height: 475});
  await page.screenshot({path: fileURLToPath(new URL('../output/playback-revised-mobile-landscape.png', import.meta.url))});
  writeFileSync(new URL('../output/playback-revised-validation.json', import.meta.url), JSON.stringify({
    ...metadata, browser: 'Chromium', playback: 'passed', mobileLandscape: [844, 475],
    audioListening: 'Not performed; audio stream, loudness, and silence checked separately by FFmpeg.'}, null, 2));
  console.log('PASS: final MP4 plays and seeks in Chromium, with expected resolution/duration and decoded frames.');
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}
