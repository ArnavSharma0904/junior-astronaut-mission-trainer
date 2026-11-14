import {pathToFileURL} from 'node:url';
import {Workflow,id} from './workflow.mjs';
export async function waitReview(w,requestId,seconds=300) {
  id(requestId);if(!Number.isInteger(seconds)||seconds<1||seconds>3600)throw new Error('Wait must be 1..3600 seconds');
  await w.requestRecord(requestId);const deadline=Date.now()+seconds*1000;
  console.log('Polling only. This does not wake or resume a dead agent.');
  while(Date.now()<deadline) {
    let all=true;
    for(const role of ['independent','browser']) {
      let review;try{review=await w.read(`.agent-bus/reviews/${requestId}-${role}.json`);}catch(e){if(e.code==='ENOENT'){all=false;continue;}throw e;}
      if(review.verdict!=='PASS')throw new Error(`${role}: ${review.verdict}`);
    }
    if(all){await w.gate(requestId);return;}
    await new Promise(resolve=>setTimeout(resolve,Math.min(1000,Math.max(1,deadline-Date.now()))));
  } throw new Error('Review timeout: BLOCKED; no agent was awakened');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)waitReview(new Workflow(decodeURIComponent(new URL('../',import.meta.url).pathname).replace(/\/$/,'')),process.argv[2],Number(process.argv[3]||300)).then(()=>console.log('Both lanes PASS for current SHA')).catch(e=>{console.error('BLOCKED:',e.message);process.exitCode=1;});
