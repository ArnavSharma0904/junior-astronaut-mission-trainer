import {spawnSync} from 'node:child_process';
let missing=false;
for(const tool of ['node','npm','git','claude','codex']) {
  const result=spawnSync(tool,['--version'],{encoding:'utf8',timeout:10000,stdio:['ignore','pipe','pipe']});
  if(result.error||result.status!==0){console.log(`${tool}: UNAVAILABLE (${result.error?.code||'exit '+result.status})`);missing=true;}
  else console.log(`${tool}: ${result.stdout.trim()}`);
}
console.log('Version checks only. No installation, authentication, or agent execution. Missing reviewer CLI requires an honest documented fallback.');
process.exitCode=missing?1:0;
