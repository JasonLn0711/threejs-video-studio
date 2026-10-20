import path from 'node:path';
export async function encode({ child, hf, project, output }) {
  const native = path.join(output, 'ddos-capacity-native.mp4');
  const final = path.join(output, 'ddos-capacity.mp4');
  await child('render', hf, ['render', '--output', native, '--fps', '30', '--quality', 'delivery',
    '--workers', '1', '--browser-gpu', '--strict'], project);
  // Re-mux the exact reference PCM at an explicit sample rate, retaining the
  // native encoded picture stream without another video generation.
  await child('mux', 'ffmpeg', ['-v', 'error', '-nostdin', '-y', '-i', native,
    '-i', path.join(project, 'assets/audio/narration.wav'), '-map', '0:v:0', '-map', '1:a:0',
    '-c:v', 'copy', '-c:a', 'aac', '-ar', '48000', '-ac', '2', '-b:a', '192k',
    '-t', '60', '-movflags', '+faststart', final]);
  return final;
}
