import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTraffic } from '../src/traffic.ts';
import { buildIncidentCues, cueAt } from '../src/events.ts';
const model = buildTraffic(30, 60, 1973, 11.3, 9.2);
const plan = buildIncidentCues(model, 918);
test('film incidents coincide with actual simulated loss, not server failure', () => {
  const [loss, request] = plan.events;
  assert.ok(plan.warningFrame < loss.start);
  assert.equal(model.frames[loss.start-1].dropped, 0);
  assert.ok(model.frames[loss.start].dropped > 0);
  const packet = model.packets[request.packetId];
  assert.equal(packet.role, 'normal'); assert.ok(packet.dropped);
  assert.equal(packet.arrival, request.start); assert.ok(request.start >= 918);
});
test('impact envelope resets on arbitrary seeks and respects half-open boundaries', () => {
  for (const cue of plan.events) {
    assert.equal(cueAt(cue.start-1, plan.events).cue, null);
    const peak = cueAt(cue.start+6, plan.events);
    assert.ok(peak.opacity > .9 && peak.impact > 0);
    cueAt(cue.end+100, plan.events);
    assert.deepEqual(cueAt(cue.start+6, plan.events), peak);
    assert.equal(cueAt(cue.end, plan.events).cue, null);
  }
});
