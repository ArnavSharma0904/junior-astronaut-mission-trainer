import {pathToFileURL} from 'node:url';
import * as fs from 'node:fs/promises';
import {Workflow,git} from './workflow.mjs';

export async function installGates(root,{clock=()=>new Date()}={}) {
  const w=new Workflow(root,{clock}); w.start(); await w.repository(); const manifest=await w.verifyProtected();
  // Refuse even an empty configured hooksPath, including inherited/global values.
  let configured=false; try {git(root,'config','--get','core.hooksPath');configured=true;}catch{}
  if(configured)throw new Error('Refusing configured core.hooksPath');
  const gitDir=root+'/.git'; if((await fs.lstat(gitDir)).isSymbolicLink())throw new Error('Symlink .git refused');
  const hooks=gitDir+'/hooks';
  try { const st=await fs.lstat(hooks);if(st.isSymbolicLink()||!st.isDirectory())throw new Error('Unsafe hooks directory');
    const entries=await fs.readdir(hooks);if(entries.some(n=>!n.endsWith('.sample')))throw new Error('Existing hooks refused');
  } catch(e){if(e.code!=='ENOENT')throw e;}
  try{await fs.lstat(gitDir+'/workflow-baseline.json');throw new Error('Existing baseline refused');}catch(e){if(e.code!=='ENOENT')throw e;}
  const staging=gitDir+`/workflow-setup-${process.pid}-${Date.now()}`;await fs.mkdir(staging,{mode:0o700});
  const moved=[];let baseline=false,createdHooks=false;
  try {
    const common='#!/bin/sh\nset -eu\nroot=$(git rev-parse --show-toplevel)\ncd "$root"\n';
    await fs.writeFile(staging+'/pre-commit',common+'exec node "$root/scripts/workflow.mjs" guard\n',{mode:0o755,flag:'wx'});
    // exec inherits stdin unchanged, preserving Git's ref-update stream.
    await fs.writeFile(staging+'/pre-push',common+'exec node "$root/scripts/workflow.mjs" push "$@"\n',{mode:0o755,flag:'wx'});
    await fs.writeFile(staging+'/baseline',manifest,{mode:0o600,flag:'wx'});
    try {await fs.mkdir(hooks);createdHooks=true;}catch(e){if(e.code!=='EEXIST')throw e;}
    // link() never overwrites a raced-in hook. Roll back only files we created.
    await fs.link(staging+'/baseline',gitDir+'/workflow-baseline.json');baseline=true;
    for(const name of ['pre-commit','pre-push']) {await fs.link(staging+'/'+name,hooks+'/'+name);moved.push(name);}
  } catch(e) {
    for(const name of moved)await fs.unlink(hooks+'/'+name);if(baseline)await fs.unlink(gitDir+'/workflow-baseline.json');
    if(createdHooks)await fs.rmdir(hooks).catch(()=>{});throw e;
  } finally {await fs.rm(staging,{recursive:true,force:true});}
  // A power loss can leave a partial setup: the installer refuses retry (baseline/hooks exist), never overwrites.
  // Inspect and remove only the partial files from this transaction before retrying;
  // do not publish until installation and both hook contents have been verified.
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) installGates(decodeURIComponent(new URL('../',import.meta.url).pathname).replace(/\/$/,'')).then(()=>console.log('Installed local advisory hooks. Configure workflow.approvedOrigin only after owner approval. PUSH_AUTHORIZED=1 acknowledges that approval; it is not authentication.')).catch(e=>{console.error('BLOCKED:',e.message);process.exitCode=1;});
