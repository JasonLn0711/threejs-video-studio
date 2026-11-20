import {test} from 'node:test';
import assert from 'node:assert/strict';
import {canonicalFrame} from '../src/missing-signature/clock.ts';
test('cinematic clock tolerates sub-microsecond seek rounding at cuts and frame 231',()=>{
  for(const frame of [0,129,189,231,299])for(const error of [-1e-7,0,1e-7])assert.equal(canonicalFrame(frame/30+error,30,300),frame);
});
test('proof end clamps to its own final frame instead of falling into the full film',()=>{
  assert.equal(canonicalFrame(10,30,300),299);
  assert.equal(canonicalFrame(49.2333333,30,300),299);
  assert.equal(canonicalFrame(-1,30,300),0);
});
