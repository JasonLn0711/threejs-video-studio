import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTraffic, frameIndex, beatAt, QUEUE_LIMIT, CAPACITY } from '../src/traffic.ts';

test('fixed-capacity FIFO: normal flow succeeds, overload drops both roles', () => {
  const m = buildTraffic();
  assert.equal(m.frames.length, 1800);
  assert.ok(m.frames.every(f => f.queue.length <= QUEUE_LIMIT));
  assert.equal(m.frames[400].dropped, 0);
  assert.ok(m.packets.some(p => p.role === 'normal' && p.dropped));
  assert.ok(m.packets.some(p => p.role === 'attack' && p.dropped));
  for (let f = 30; f < 1800; f++) assert.ok(m.frames[f].served - m.frames[f - 30].served <= CAPACITY);
  const departed = m.packets.filter(p => p.departure !== null);
  assert.ok(departed.every(p => !p.dropped && p.departure >= p.arrival));
  for (const p of departed) assert.ok(!m.frames[p.departure].queue.includes(p.id));
});
test('independent builds and arbitrary frame reads do not mutate state', () => {
  const a = buildTraffic(), b = buildTraffic();
  assert.deepEqual(a, b);
  const original = JSON.stringify(a);
  for (const f of [1799, 800, 0, 800, 1799, 500]) assert.deepEqual(a.frames[f], b.frames[f]);
  assert.equal(JSON.stringify(a), original);
});
test('exact half-open beat boundaries and time clamps', () => {
  const beats = [{ start: 0, end: 4 }, { start: 4, end: 60 }];
  assert.equal(beatAt(3.999, beats), beats[0]);
  assert.equal(beatAt(4, beats), beats[1]);
  assert.equal(frameIndex(60, 30, 1800), 1799);
  assert.equal(frameIndex(-1, 30, 1800), 0);
  assert.throws(() => frameIndex(NaN, 30, 1800));
});
test('retimed narration keeps attacks after their cue and preserves link capacity', () => {
  const m = buildTraffic(30, 60, 1973, 11.3, 9.2);
  assert.ok(m.packets.filter(p => p.role === 'attack').every(p => p.spawn >= 339));
  assert.equal(m.frames[338].dropped, 0);
  assert.ok(m.frames[900].dropped > 0);
  for (let f = 30; f < 1800; f++) assert.ok(m.frames[f].served - m.frames[f - 30].served <= CAPACITY);
});
