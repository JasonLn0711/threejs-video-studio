import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {stateAt} from '../src/php-series/state.ts';
const films=['php-oom','php-stale-state'].map(id=>JSON.parse(fs.readFileSync(new URL(`../examples/${id}/film.json`,import.meta.url))));
test('OOM invalid cleanup follows incomplete initialization and allocation failure',()=>{
 const f=films[0];let sawPartial=false,sawFailure=false,accesses=0;
 for(let frame=0;frame<f.frameCount;frame++){
  const s=stateAt(f,frame);
  if(s.partial)sawPartial=true;
  if(s.allocationFailed){assert.ok(sawPartial);sawFailure=true;}
  if(s.invalidAccess){assert.ok(sawFailure&&sawPartial);assert.equal(s.initialized,false);accesses++;}
  assert.equal(s.rootAccess,false);
 }
 assert.ok(accesses>0);assert.equal(stateAt(f,f.frameCount-1).invalidAccess,false);
});
test('Stale reference uses freed request memory in the same persistent worker; corrected order resets first',()=>{
 const f=films[1];let staleAccesses=0;
 for(let frame=f.shots[1].start_frame;frame<f.frameCount;frame++){
  const s=stateAt(f,frame);assert.equal(s.workerId,'W01');
  if(s.invalidAccess){assert.equal(s.requestId,'B');assert.ok(s.freed&&s.referenceRetained&&s.earlyConsumer);staleAccesses++;}
  if(s.corrected&&s.freed)assert.equal(s.referenceRetained,false);
 }
 assert.ok(staleAccesses>0);
});
test('Arbitrary seek reconstructs complete state and exact cut ownership',()=>{
 for(const f of films){
  for(const shot of f.shots){
   const frame=shot.start_frame;const before=stateAt(f,frame);stateAt(f,f.frameCount-1);stateAt(f,0);assert.deepEqual(stateAt(f,frame),before);assert.equal(before.shot,shot.id);
   if(frame>0)assert.notEqual(stateAt(f,frame-1).shot,shot.id);
  }
  assert.equal(stateAt(f,f.frameCount).frame,f.frameCount-1);
 }
});
test('Each series episode has an independent authorized final-only scope and one CVE',()=>{
 assert.notEqual(films[0].id,films[1].id);assert.notEqual(films[0].cve,films[1].cve);
 for(const f of films){assert.equal(f.review.mode,'final_only');assert.ok(f.review.renderAuthorization);assert.equal(f.review.humanReview,'pending');assert.ok(f.duration>=45&&f.duration<=60);assert.equal(f.voice.speed,1);}
});
test('Sound cue for invalid access lands on the first hazardous model frame',()=>{
 for(const f of films){
  const event=f.events.find(e=>e.purpose==='unsafe_access');assert.ok(event);assert.equal(event.at,event.frame/f.fps);
  assert.equal(stateAt(f,event.frame-1).invalidAccess,false);assert.equal(stateAt(f,event.frame).invalidAccess,true);
 }
});
