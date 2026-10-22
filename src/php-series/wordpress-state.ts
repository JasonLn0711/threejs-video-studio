export type WordpressClock = {fps:number; frameCount:number; shots:{id:string;start_frame:number;end_frame_exclusive:number}[]};
export function wordpressStateAt(film:WordpressClock, input:number) {
 const frame=Math.max(0,Math.min(film.frameCount-1,Math.round(input)));
 const index=film.shots.findIndex(s=>frame>=s.start_frame&&frame<s.end_frame_exclusive);
 if(index<0)throw new Error('Frame outside declared shots');
 const shot=film.shots[index],progress=(frame-shot.start_frame)/Math.max(1,shot.end_frame_exclusive-shot.start_frame-1);
 return {frame,index,shot:shot.id,progress,wordpressCoreStatus:'up-to-date' as const,phpPatchStatus:'unknown' as const,
  conceptual:true,realSiteScanned:false,versionObserved:index>=3,fixVerified:false,
  verificationStep:['application-status','dependency-map','runtime-unknown','observe-version','ask-provider','vendor-package','verify-running-php'][index]};
}
