import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {wordpressStateAt} from '../src/php-series/wordpress-state.ts';
const film=JSON.parse(fs.readFileSync(new URL('../examples/wordpress-php/film.json',import.meta.url)));
test('Observing PHP version and illustrating a backport never claims a verified real website',()=>{
 for(let frame=0;frame<film.frameCount;frame++){
  const s=wordpressStateAt(film,frame);
  assert.equal(s.phpPatchStatus,'unknown');assert.equal(s.fixVerified,false);assert.equal(s.realSiteScanned,false);
  assert.equal(s.conceptual,true);assert.equal(s.wordpressCoreStatus,'up-to-date');
  assert.equal(s.versionObserved,frame>=film.shots[3].start_frame);
 }
 assert.equal(wordpressStateAt(film,film.frameCount-1).verificationStep,'verify-running-php');
});
test('WordPress shot ownership and state are independent of prior seeks',()=>{
 for(const shot of film.shots){
  const state=wordpressStateAt(film,shot.start_frame);assert.equal(state.shot,shot.id);
  wordpressStateAt(film,film.frameCount-1);wordpressStateAt(film,0);
  assert.deepEqual(wordpressStateAt(film,shot.start_frame),state);
  if(shot.start_frame)assert.notEqual(wordpressStateAt(film,shot.start_frame-1).shot,shot.id);
 }
 assert.equal(wordpressStateAt(film,-20).frame,0);
 assert.equal(wordpressStateAt(film,film.frameCount+1).frame,film.frameCount-1);
});
test('WordPress episode has its own scope and no inherited exploit events or CVE',()=>{
 assert.equal(film.validationProfile,'wordpress-runtime-v1');assert.equal(film.episodeNumber,3);assert.equal(film.cve,undefined);
 assert.equal(film.shots.length,7);assert.equal(film.voice.speed,1);assert.equal(film.review.humanReview,'pending');
 for(const event of film.events){assert.ok(!/unsafe_access|reference_reset|allocation_failure/.test(event.purpose));assert.equal(event.at,event.frame/film.fps);}
});
