import type { buildTraffic } from './traffic.ts';
export interface IncidentCue {
  id: 'packet-loss' | 'request-lost'; start: number; end: number;
  title: string; detail: string; packetId?: number;
}
export function buildIncidentCues(model: ReturnType<typeof buildTraffic>, legitimateBeatStart: number) {
  const warningFrame = model.frames.findIndex(f => f.queue.length >= 18);
  const firstLoss = model.frames.findIndex(f => f.dropped > 0);
  const lostRequest = model.packets.find(p => p.role === 'normal' && p.dropped && p.arrival >= legitimateBeatStart);
  const events: IncidentCue[] = [];
  if (firstLoss >= 0) events.push({ id: 'packet-loss', start: firstLoss, end: firstLoss + 72,
    title: 'PACKETS DROPPED', detail: 'LINK CAPACITY EXCEEDED' });
  if (lostRequest) events.push({ id: 'request-lost', start: lostRequest.arrival, end: lostRequest.arrival + 84,
    title: 'REQUEST LOST', detail: 'SERVER STILL ONLINE', packetId: lostRequest.id });
  return { warningFrame, events };
}
export function cueAt(frame: number, events: IncidentCue[]) {
  const cue = events.find(e => frame >= e.start && frame < e.end);
  if (!cue) return { cue: null, opacity: 0, scale: .94, lift: 12, impact: 0, ring: 0 };
  const age = frame - cue.start;
  const enter = 1 - (1 - Math.min(1, (age + 1) / 9)) ** 3;
  const fade = Math.min(1, (cue.end - frame) / 8);
  return { cue, opacity: enter * fade, scale: .94 + .06 * enter, lift: 12 * (1 - enter),
    impact: Math.sin(Math.min(1, age / 16) * Math.PI) * Math.max(0, 1 - age / 24),
    ring: Math.max(0, 1 - age / 27) };
}
