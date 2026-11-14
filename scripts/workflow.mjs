import {pathToFileURL} from 'node:url';
import * as fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

export const START = Date.parse('2026-11-14T17:00:00Z');
export const CHECKS = ['typecheck','lint','test:unit','build','test:e2e'];
const ROLES = ['independent','browser'];
const fail = message => { throw new Error(message); };
export function id(value) { if (typeof value !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(value)) fail('Unsafe identifier'); return value; }
const sha = value => typeof value === 'string' && /^[a-f0-9]{40}$/.test(value);
export function git(root, ...args) { return execFileSync('git',['-C',root,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim(); }
export async function immutable(file, value) {
  // A complete temporary file is linked into place atomically; readers never see partial JSON.
  const temp = `${file}.tmp-${process.pid}-${Math.random().toString(36).slice(2)}`;
  try { await fs.writeFile(temp,JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600}); await fs.link(temp,file); }
  finally { await fs.unlink(temp).catch(()=>{}); }
}
export class Workflow {
  constructor(root, {clock = () => new Date()} = {}) { this.root = root.replace(/\/$/,''); this.clock = clock; }
  now() { return new Date(this.clock()); }
  start() { if (!(this.now().getTime() >= START)) fail('BLOCKED: before permitted start 2026-11-14T17:00Z'); }
  async repository() {
    const real = await fs.realpath(this.root);
    if (real !== this.root || git(this.root,'rev-parse','--show-toplevel') !== real) fail('Exact Git root required; refusing parent repository or symlink root');
    if (git(this.root,'rev-parse','--is-bare-repository') !== 'false') fail('Worktree required');
    return real;
  }
  async head() { await this.repository(); const value = git(this.root,'rev-parse','HEAD'); if (!sha(value)) fail('Committed HEAD required'); return value; }
  async clean() { if (git(this.root,'status','--porcelain=v1','--untracked-files=all')) fail('Clean committed worktree required, including untracked files'); }
  async safe(relative, {file = false} = {}) {
    if (typeof relative !== 'string' || !relative || relative.startsWith('/') || relative.includes('\\') || relative.split('/').some(p=>!p || p==='.' || p==='..' || !/^[a-zA-Z0-9._-]+$/.test(p))) fail('Unsafe relative path');
    const target = `${this.root}/${relative}`;
    let cursor = this.root;
    for (const part of relative.split('/')) { cursor += '/'+part; const st = await fs.lstat(cursor); if (st.isSymbolicLink()) fail('Symlink forbidden'); }
    const real = await fs.realpath(target); if (!real.startsWith(this.root+'/')) fail('Path escapes repository');
    if (file && !(await fs.stat(real)).isFile()) fail('Regular file required');
    return real;
  }
  async bus() {
    await this.repository();
    for (const rel of ['.agent-bus',...['requests','reviews','runs','evidence','locks','candidates'].map(x=>'.agent-bus/'+x)]) {
      const target = this.root+'/'+rel; await fs.mkdir(target,{recursive:false}).catch(e=>{if(e.code!=='EEXIST') throw e;});
      await this.safe(rel); if (!(await fs.stat(target)).isDirectory()) fail('Bus directory required');
    }
    try { git(this.root,'check-ignore','--no-index','.agent-bus/requests/probe.json'); } catch { fail('.agent-bus must be ignored by Git'); }
  }
  async read(relative) { return JSON.parse(await fs.readFile(await this.safe(relative,{file:true}),'utf8')); }
  async writer(owner) { id(owner); const lease = await this.read('.agent-bus/locks/writer.json'); if (lease.owner !== owner) fail('Wrong writer owner'); return lease; }
  async claim(owner, scope = 'tools/planning') {
    id(owner); if (this.now().getTime() < START && (owner !== 'claude' || scope !== 'tools/planning')) fail('Only claude tools/planning lease allowed before start');
    await this.bus(); await this.clean(); const head = await this.head();
    await immutable(this.root+'/.agent-bus/locks/writer.json',{owner,scope,sha:head,claimedAt:this.now().toISOString()});
  }
  async release(owner) { await this.repository(); await this.writer(owner); await this.clean(); await fs.unlink(await this.safe('.agent-bus/locks/writer.json',{file:true})); }
  async lock(requestId, role, reviewer) {
    id(requestId); id(reviewer); if (!ROLES.includes(role)) fail('Invalid review role'); await this.bus();
    const request = await this.requestRecord(requestId); if (request.builder === reviewer) fail('Self-review forbidden');
    await immutable(this.root+`/.agent-bus/locks/${requestId}-${role}.json`,{requestId,role,reviewer});
  }
  async unlock(requestId, role, reviewer) {
    id(requestId); id(reviewer); if (!ROLES.includes(role)) fail('Invalid review role');
    const rel = `.agent-bus/locks/${requestId}-${role}.json`; const lock = await this.read(rel);
    if (lock.reviewer !== reviewer) fail('Wrong review lock owner'); await fs.unlink(await this.safe(rel,{file:true}));
  }
  async requestRecord(requestId) { id(requestId); const r = await this.read(`.agent-bus/requests/${requestId}.json`); if(r.id !== requestId || !sha(r.sha)) fail('Invalid request'); return r; }
  async evidence(relative) {
    if (typeof relative !== 'string' || !relative.startsWith('.agent-bus/')) fail('Evidence must be under .agent-bus');
    const file = await this.safe(relative,{file:true}); if (!(await fs.stat(file)).size) fail('Empty evidence file'); return file;
  }
  async run(runId, expectedSha) {
    id(runId); const run = await this.read(`.agent-bus/runs/${runId}/summary.json`);
    const commitTime = Number(git(this.root,'show','-s','--format=%ct',expectedSha))*1000;
    const begin = Date.parse(run.startedAt), end = Date.parse(run.finishedAt);
    if (run.id !== runId || run.sha !== expectedSha || run.finalSha !== expectedSha || run.clean !== true || run.exitCode !== 0 || run.status !== 'PASS' || !Number.isFinite(begin) || !Number.isFinite(end) || begin < START || begin < commitTime || end < begin || end > this.now().getTime()) fail('Invalid, failed, or stale check run');
    if (!Array.isArray(run.checks) || run.checks.length !== CHECKS.length) fail('All five checks required');
    for (let i=0; i<CHECKS.length; i++) {
      const check = run.checks[i];
      if(check.script !== CHECKS[i] || check.command !== `npm run ${CHECKS[i]}` || check.exitCode !== 0 || check.timedOut === true) fail('Missing or failed required check');
      const a=Date.parse(check.startedAt),b=Date.parse(check.finishedAt);
      if(!Number.isFinite(a)||!Number.isFinite(b)||a<begin||b<a||b>end) fail('Invalid check timestamps');
      const logFile=await this.evidence(check.log);
      const logText=await fs.readFile(logFile,'utf8');
      if(!logText.includes(`SHA ${expectedSha}\n`)||!logText.includes(`COMMAND npm run ${CHECKS[i]}\n`)||!logText.includes('EXIT 0\n')) fail('Log must identify exact SHA, command and successful exit');
    }
    return run;
  }
  async request(requestId,builder,runId,scope = '') {
    this.start(); id(requestId); id(builder); id(runId); if(typeof scope!=='string'||scope.length>2000) fail('Invalid scope');
    await this.bus(); await this.writer(builder); await this.clean(); const head = await this.head(); await this.run(runId,head); await this.verifyProtected();
    await immutable(this.root+`/.agent-bus/requests/${requestId}.json`,{id:requestId,builder,sha:head,runId,scope,createdAt:this.now().toISOString()});
  }
  async validateReview(review, request) {
    const allowed = ['requestId','sha','role','reviewer','verdict','summary','evidence','findings','observedBuildSha'];
    if (!review || typeof review !== 'object' || Array.isArray(review) || Object.keys(review).some(k=>!allowed.includes(k))) fail('Review schema: unknown property');
    id(review.requestId); id(review.reviewer);
    if(review.requestId !== request.id || review.sha !== request.sha || !sha(review.sha)) fail('Review SHA/request mismatch');
    if (!ROLES.includes(review.role) || !['PASS','FIX','BLOCKED'].includes(review.verdict) || review.reviewer.length<3 || review.reviewer===request.builder) fail('Invalid role/verdict or self-review');
    if(typeof review.summary!=='string'||review.summary.length<10 || !Array.isArray(review.findings)||review.findings.some(x=>typeof x!=='string') || !Array.isArray(review.evidence)||!review.evidence.length) fail('Review schema invalid');
    if(review.observedBuildSha !== undefined && !sha(review.observedBuildSha)) fail('Invalid observed build SHA');
    if(review.verdict==='PASS' && review.findings.length) fail('PASS cannot have unresolved findings');
    let screenshot = false;
    for(const evidence of review.evidence) {
      const file = await this.evidence(evidence); const buf = await fs.readFile(file);
      if ((/\.png$/i.test(file)&&buf.length>=24&&buf.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))&&buf.toString('ascii',12,16)==='IHDR') || (/\.jpe?g$/i.test(file)&&buf.length>4&&buf[0]===255&&buf[1]===216&&buf[2]===255) || (/\.webp$/i.test(file)&&buf.length>12&&buf.toString('ascii',0,4)==='RIFF'&&buf.toString('ascii',8,12)==='WEBP')) screenshot = true;
    }
    if(review.role==='browser' && review.verdict==='PASS' && (review.observedBuildSha!==request.sha||!screenshot)) fail('Browser PASS requires exact observedBuildSha and actual screenshot signature');
  }
  async review(review) {
    this.start(); await this.bus(); const request=await this.requestRecord(review.requestId);
    if (await this.head() !== request.sha) fail('Stale request SHA'); await this.clean(); await this.validateReview(review,request);
    const lock=await this.read(`.agent-bus/locks/${review.requestId}-${review.role}.json`);
    if(lock.reviewer!==review.reviewer) fail('Review lock required for reviewer');
    await immutable(this.root+`/.agent-bus/reviews/${review.requestId}-${review.role}.json`,review);
  }
  async pending(role) {
    if(!ROLES.includes(role)) fail('Invalid review role'); await this.bus(); const pending=[];
    for(const file of (await fs.readdir(this.root+'/.agent-bus/requests')).sort()) {
      if(!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}\.json$/.test(file)) continue;
      const requestId=file.replace(/\.json$/,'');
      try { await this.read(`.agent-bus/reviews/${requestId}-${role}.json`); } catch(e) { if(e.code==='ENOENT') pending.push(await this.requestRecord(requestId)); else throw e; }
    } return pending;
  }
  async verifyProtected() {
    await this.repository(); const manifestFile=await this.safe('protected-manifest.json',{file:true}); const raw=await fs.readFile(manifestFile,'utf8'); const manifest=JSON.parse(raw);
    if(!manifest||Array.isArray(manifest)||typeof manifest!=='object'||!Object.keys(manifest).length) fail('Nonempty protected manifest required');
    for(const [relative,hash] of Object.entries(manifest)) {
      if(!/^[a-f0-9]{64}$/.test(hash)) fail('Invalid protected hash'); const file=await this.safe(relative,{file:true});
      const actual=createHash('sha256').update(await fs.readFile(file)).digest('hex'); if(actual!==hash) fail('Protected hash mismatch: '+relative);
    }
    const gitDir=git(this.root,'rev-parse','--absolute-git-dir');
    if(gitDir!==this.root+'/.git') fail('Standalone .git directory required');
    try { const st=await fs.lstat(gitDir+'/workflow-baseline.json'); if(st.isSymbolicLink()||!st.isFile()) fail('Unsafe baseline'); if(await fs.readFile(gitDir+'/workflow-baseline.json','utf8')!==raw) fail('Protected baseline mismatch'); } catch(e) { if(e.code!=='ENOENT') throw e; }
    return raw;
  }
  async gate(requestId) {
    this.start(); await this.repository(); await this.clean(); const request=await this.requestRecord(requestId);
    if(await this.head()!==request.sha) fail('Stale gate SHA'); await this.run(request.runId,request.sha); await this.verifyProtected();
    for(const role of ROLES) { const r=await this.read(`.agent-bus/reviews/${requestId}-${role}.json`); await this.validateReview(r,request); if(r.role!==role||r.verdict!=='PASS') fail('Both independent and browser PASS required'); }
    return request;
  }
  async guard(owner) {
    this.start(); await this.repository(); await this.verifyProtected();
    let existingHead=true;try {git(this.root,'rev-parse','--verify','HEAD');}catch {existingHead=false;}
    if(!existingHead) {
      // Bootstrap only: no writer lease can yet reference an initial commit.
      // Only frozen kit contracts may enter M00. Product files must wait for M01.
      git(this.root,'symbolic-ref','--quiet','HEAD');
      const manifest=JSON.parse(await fs.readFile(await this.safe('protected-manifest.json',{file:true}),'utf8'));
      if(!Object.hasOwn(manifest,'kit-inventory.json')) fail('Bootstrap inventory must be protected');
      const inventory=await this.read('kit-inventory.json');
      if(!Array.isArray(inventory)||!inventory.length||inventory.some(name=>typeof name!=='string')) fail('Invalid kit inventory');
      for(const name of inventory) await this.safe(name,{file:true});
      const allowed=new Set([...inventory,'protected-manifest.json','kit-inventory.json']);
      const staged=git(this.root,'diff','--cached','--name-only','--diff-filter=ACDMRTUXB').split('\n').filter(Boolean);
      if(!staged.length||staged.some(name=>!allowed.has(name))) fail('M00 bootstrap permits only initial kit-inventory files');
      if([...allowed].some(name=>!staged.includes(name))) fail('M00 bootstrap requires every initial inventory file staged');
      // Protect the index too: a staged old version must not evade worktree hashes.
      for(const name of staged) {
        const indexed=execFileSync('git',['-C',this.root,'show',':'+name]);
        if(!indexed.equals(await fs.readFile(await this.safe(name,{file:true})))) fail('Staged protected content differs from worktree');
      }
      return;
    }
    await this.writer(owner); await this.verifyProtected();
    const manifest=JSON.parse(await fs.readFile(await this.safe('protected-manifest.json',{file:true}),'utf8'));
    for(const name of [...Object.keys(manifest),'protected-manifest.json']) {
      const indexed=execFileSync('git',['-C',this.root,'show',':'+name]);
      if(!indexed.equals(await fs.readFile(await this.safe(name,{file:true})))) fail('Staged protected content differs from worktree');
    }
  }
  async push(remote, url, input, {authorized = process.env.PUSH_AUTHORIZED} = {}) {
    this.start(); await this.repository(); await this.clean();
    // This is an acknowledgment after actual owner approval, not identity/authentication.
    if(authorized!=='1'||remote!=='origin') fail('Push requires owner approval acknowledgment and origin');
    const approved=git(this.root,'config','--get','workflow.approvedOrigin');
    if(!approved||url!==approved||git(this.root,'remote','get-url','--push','origin')!==approved) fail('Origin not explicitly approved (git config workflow.approvedOrigin URL)');
    const head=await this.head(); const branch=git(this.root,'symbolic-ref','--quiet','HEAD');
    const lines=input.trim().split('\n').filter(Boolean); if(lines.length!==1) fail('Exactly one reviewed branch HEAD update required');
    const fields=lines[0].trim().split(/\s+/); if(fields.length!==4) fail('Invalid pre-push ref input');
    const [localRef,localSha,remoteRef,remoteSha]=fields;
    if(!sha(remoteSha)||localRef!==branch||!localRef.startsWith('refs/heads/')||remoteRef!==localRef||localSha!==head) fail('No deletions, tags, or non-HEAD branch updates');
    if(remoteSha!=='0'.repeat(40)) { try { git(this.root,'merge-base','--is-ancestor',remoteSha,head); } catch { fail('Non-fast-forward or unknown remote SHA rejected'); } }
    let accepted=false;
    for(const file of await fs.readdir(this.root+'/.agent-bus/requests')) {
      if(!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}\.json$/.test(file)) continue;
      try { await this.gate(file.replace(/\.json$/,'')); accepted=true; break; } catch { /* only a fully valid current gate counts */ }
    }
    if(!accepted) fail('No valid two-lane gate for HEAD'); return head;
  }
}
export async function main(args=process.argv.slice(2)) {
  const w=new Workflow(decodeURIComponent(new URL('../',import.meta.url).pathname).replace(/\/$/,''));
  const [command,...rest]=args;
  switch(command) {
    case 'claim': await w.claim(...rest); break;
    case 'release': await w.release(...rest); break;
    case 'lock': await w.lock(...rest); break;
    case 'unlock': await w.unlock(...rest); break;
    case 'pending': console.log(JSON.stringify(await w.pending(...rest),null,2)); break;
    case 'request': await w.request(...rest); break;
    case 'review': if(rest.length!==1) fail('review requires one JSON file'); await w.review(JSON.parse(await fs.readFile(rest[0],'utf8'))); break;
    case 'gate': console.log(JSON.stringify(await w.gate(...rest))); break;
    case 'verify-protected': await w.verifyProtected(); break;
    case 'guard': { let owner=rest[0];if(!owner) {try{owner=(await w.read('.agent-bus/locks/writer.json')).owner;}catch(e){if(e.code!=='ENOENT')throw e;}} await w.guard(owner); break; }
    case 'push': { let input=''; for await(const chunk of process.stdin) input+=chunk; await w.push(rest[0],rest[1],input); break; }
    default: fail('Commands: claim owner [tools/planning|build], release owner, lock id role reviewer, unlock id role reviewer, pending role, request id builder runId [scope], review FILE, gate id, verify-protected, guard [owner], push remote URL. Push needs actual owner approval, git config workflow.approvedOrigin URL, then PUSH_AUTHORIZED=1. Local hooks are not a security sandbox.');
  }
}
if(process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(e=>{console.error('BLOCKED:',e.message);process.exitCode=1;});
