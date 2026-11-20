/** Native players can report a nominal frame time just below the frame boundary. */
export function canonicalFrame(time: number, fps: number, count: number): number {
  if (!Number.isFinite(time) || fps <= 0 || !Number.isInteger(count) || count < 1) throw new Error('Invalid frame clock');
  return Math.min(count - 1, Math.max(0, Math.round(time * fps)));
}
