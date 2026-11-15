import { execFileSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import path from 'node:path';

function sameDirectory(left, right) {
  try {
    return realpathSync(left) === realpathSync(right);
  } catch {
    return path.resolve(left) === path.resolve(right);
  }
}

export function gitOutput(args, cwd) {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

/**
 * Use git HEAD only when this directory is the git root. An exported archive nested inside
 * another repository must not inherit that outer HEAD.
 */
export function resolveBuildSha(root, env = process.env, git = gitOutput) {
  const toplevel = git(['rev-parse', '--show-toplevel'], root);
  const head = git(['rev-parse', 'HEAD'], root);
  const ownsRepo = toplevel != null && sameDirectory(toplevel, root);
  if (ownsRepo && head && /^[a-f0-9]{40}$/.test(head)) return head;
  const fromEnv = env.GITHUB_SHA;
  if (typeof fromEnv === 'string' && /^[a-f0-9]{40}$/.test(fromEnv)) return fromEnv;
  return 'unknown';
}
