/** Inert explanatory state; no PHP, HTTP requests or exploit code is executed. */
export type Episode = 'oom' | 'stale';
export type FilmClock = {episode:string; fps:number;duration:number;shots:{id:string;start_frame:number;end_frame_exclusive:number}[]};
export function stateAt(film:FilmClock, frame:number) {
  const total=Math.round(film.duration*film.fps);
  frame=Math.max(0,Math.min(total-1,Math.round(frame)));
  const index=film.shots.findIndex(s=>frame>=s.start_frame&&frame<s.end_frame_exclusive);
  if(index<0)throw new Error('Frame outside declared shots');
  const s=film.shots[index], progress=(frame-s.start_frame)/Math.max(1,s.end_frame_exclusive-s.start_frame-1);
  const oom=film.episode==='oom';
  const freed=!oom&&(index===0||index===2&&progress>=.42||index===3||index===4||index===5&&progress>.65);
  const partial=oom&&index>=1&&index<=4;
  const invalidAccess=oom?(index===3&&progress>=.22||index===4):(index===3&&progress>=.72||index===4);
  const allocationFailed=oom&&(index===1&&progress>=.75||index>=2&&index<=4);
  const allocated=!(oom&&index===0)&&!freed;
  return {frame,shot:s.id,index,progress,workerId:'W01',requestId:oom?'A':index===3||index===4?'B':'A',
    memoryId:'M17',allocationFailed,allocated,initialized:allocated&&!partial,partial,freed,
    referenceRetained:!oom&&(index<5||progress<.18),invalidAccess,
    earlyConsumer:!oom&&(index===3&&progress>=.72||index===4),
    sameWorker:true,rce:'conditional_risk',rootAccess:false,corrected:index===5,
    context:!oom&&index===0?'preview_of_stale_state':index===5?'corrected_lifecycle_illustration':'vulnerable_path_illustration'};
}
