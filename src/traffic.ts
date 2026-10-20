/** Illustrative FIFO link model, baked once; no real network operations. */
export interface Packet {
  id: number; role: 'normal' | 'attack'; lane: number; spawn: number;
  arrival: number; departure: number | null; dropped: boolean;
}
export interface TrafficFrame { queue: number[]; arrivals: number; served: number; dropped: number; utilization: number }
export const CAPACITY = 8;
export const QUEUE_LIMIT = 24;
export function buildTraffic(fps = 30, duration = 60, seed = 1973) {
  if (!Number.isInteger(fps) || fps < 1 || duration <= 0) throw new Error('Invalid timeline');
  const count = Math.round(fps * duration), packets: Packet[] = [], frames: TrafficFrame[] = [];
  const queue: number[] = [];
  let normalBudget = 0, attackBudget = 0, serviceBudget = 0, served = 0, dropped = 0;
  const arrivals = new Map<number, number[]>();
  for (let f = 0; f < count; f++) {
    const t = f / fps;
    normalBudget += 2 / fps;
    attackBudget += (t < 14 ? 0 : 4 + Math.min(1, (t - 14) / 13) * 52) / fps;
    for (const role of ['normal', 'attack'] as const) {
      let budget = role === 'normal' ? normalBudget : attackBudget;
      while (budget >= 1) {
        const id = packets.length;
        // Small deterministic propagation variation avoids phase-locking the
        // normal source to service slots. No class receives admission priority.
        const arrival = f + Math.round(fps * 1.4) + ((id * 17 + seed) % 7) - 3;
        packets.push({ id, role, lane: role === 'normal' ? 0 : 1 + ((id + seed) % 3),
          spawn: f, arrival, departure: null, dropped: false });
        arrivals.set(arrival, [...(arrivals.get(arrival) ?? []), id]);
        budget--;
      }
      if (role === 'normal') normalBudget = budget; else attackBudget = budget;
    }
    for (const id of arrivals.get(f) ?? []) {
      if (queue.length < QUEUE_LIMIT) queue.push(id);
      else { packets[id].dropped = true; dropped++; }
    }
    serviceBudget += CAPACITY / fps;
    if (serviceBudget >= 1) {
      if (queue.length) { packets[queue.shift()!].departure = f; served++; }
      serviceBudget -= 1;
    }
    const previous = f >= fps ? frames[f - fps].served : 0;
    frames.push({ queue: [...queue], arrivals: (arrivals.get(f) ?? []).length, served, dropped,
      utilization: Math.min(1, (served - previous) / CAPACITY) });
  }
  return { packets, frames, fps, duration, seed };
}
export function frameIndex(time: number, fps: number, count: number) {
  if (!Number.isFinite(time)) throw new Error('Nonfinite time');
  return Math.max(0, Math.min(count - 1, Math.round(time * fps)));
}
export function beatAt<T extends { start: number; end: number }>(time: number, beats: T[]): T {
  const result = beats.find(b => time >= b.start && time < b.end);
  return result ?? beats[time < 0 ? 0 : beats.length - 1];
}
