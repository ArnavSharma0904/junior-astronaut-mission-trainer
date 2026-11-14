import {pathToFileURL} from 'node:url';
import * as fs from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {Workflow, CHECKS, immutable, id} from './workflow.mjs';

export async function runChecks(root,{clock=()=>new Date(),timeoutMs=300000,runId=`run-${Date.now()}-${Math.random().toString(36).slice(2,10)}`}={}) {
  id(runId); if(!Number.isInteger(timeoutMs)||timeoutMs<1||timeoutMs>3600000) throw new Error('Invalid timeout');
  const w=new Workflow(root,{clock}); w.start(); await w.bus(); await w.clean(); const head=await w.head();
  const dir=`${root}/.agent-bus/runs/${runId}`; await fs.mkdir(dir); await w.safe(`.agent-bus/runs/${runId}`);
  const summary={id:runId,sha:head,startedAt:w.now().toISOString(),checks:[],status:'BLOCKED',exitCode:1,clean:false};
  let blocked='';
  try {
    const pkg=JSON.parse(await fs.readFile(await w.safe('package.json',{file:true}),'utf8'));
    for(const name of CHECKS) if(typeof pkg.scripts?.[name]!=='string'||!pkg.scripts[name].trim()) throw new Error(`Missing npm script ${name}`);
    for(const name of CHECKS) {
      if(await w.head()!==head) throw new Error('HEAD changed during checks'); await w.clean();
      const startedAt=w.now().toISOString(); const log=`.agent-bus/runs/${runId}/${name.replace(':','-')}.log`;
      const handle=await fs.open(root+'/'+log,'wx',0o600);
      let result;
      try {
        await handle.write(`SHA ${head}\nSTART ${startedAt}\nCOMMAND npm run ${name}\n`);
        result=await new Promise(resolve=>{
          let done=false,timedOut=false,error='';
          const child=spawn('npm',['run',name],{cwd:root,detached:process.platform!=='win32',stdio:['ignore',handle.fd,handle.fd]});
          const kill=signal=>{try { if(process.platform!=='win32') process.kill(-child.pid,signal); else child.kill(signal); } catch {} };
          // Even after the leader exits, kill any surviving group members. No shell is used.
          const timer=setTimeout(()=>{timedOut=true;kill('SIGTERM');setTimeout(()=>kill('SIGKILL'),250);},timeoutMs);
          const finish=(code,signal)=>{if(done)return;done=true;clearTimeout(timer);kill('SIGKILL');resolve({exitCode:Number.isInteger(code)?code:1,timedOut,error,signal:signal||null});};
          child.once('error',e=>{error=e.message;finish(1,null);}); child.once('exit',finish);
        });
        await handle.write(`END ${w.now().toISOString()}\nEXIT ${result.exitCode}\nTIMEOUT ${result.timedOut}\n${result.error}\n`);
      } finally { await handle.close(); }
      summary.checks.push({script:name,command:`npm run ${name}`,startedAt,finishedAt:w.now().toISOString(),log,...result});
      if(await w.head()!==head) throw new Error('HEAD changed during checks'); await w.clean();
      if(result.exitCode!==0||result.timedOut) throw new Error(`Check failed: ${name}`);
    }
    summary.status='PASS'; summary.exitCode=0;
  } catch(e) { blocked=e.message; }
  finally {
    try { summary.finalSha=await w.head(); await w.clean(); summary.clean=summary.finalSha===head; } catch(e) { blocked ||= e.message; summary.clean=false; }
    if(!summary.clean||blocked) {summary.status='BLOCKED';summary.exitCode=1;}
    summary.finishedAt=w.now().toISOString(); if(blocked)summary.reason=blocked;
    await immutable(dir+'/summary.json',summary);
  }
  return summary;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  const root=decodeURIComponent(new URL('../',import.meta.url).pathname).replace(/\/$/,'');
  runChecks(root).then(s=>{console.log(`${s.id}: ${s.status}${s.reason?' '+s.reason:''}`);process.exitCode=s.exitCode;}).catch(e=>{console.error('BLOCKED:',e.message);process.exitCode=1;});
}
