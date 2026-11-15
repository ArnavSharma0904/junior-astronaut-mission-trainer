import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveBuildSha } from '../../scripts/build-sha.mjs';

const author = {
  GIT_AUTHOR_NAME: 'Build Sha Test',
  GIT_AUTHOR_EMAIL: 'build-sha-test@example.com',
  GIT_COMMITTER_NAME: 'Build Sha Test',
  GIT_COMMITTER_EMAIL: 'build-sha-test@example.com',
};

function git(cwd: string, args: string[]) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', env: { ...process.env, ...author } }).trim();
}

function commitEmpty(cwd: string) {
  git(cwd, ['init']);
  writeFileSync(path.join(cwd, 'package.json'), '{}\n');
  git(cwd, ['add', 'package.json']);
  git(cwd, ['commit', '-m', 'init']);
  return git(cwd, ['rev-parse', 'HEAD']);
}

describe('build identity', () => {
  it('uses this checkout HEAD and ignores a mismatched GITHUB_SHA', () => {
    const root = path.resolve('.');
    const head = git(root, ['rev-parse', 'HEAD']);
    expect(resolveBuildSha(root, { GITHUB_SHA: 'b'.repeat(40) })).toBe(head);
  });

  it('ignores an enclosing repository and uses GITHUB_SHA for a nested archive', () => {
    const outer = mkdtempSync(path.join(tmpdir(), 'jamt-outer-'));
    const outerHead = commitEmpty(outer);
    const inner = path.join(outer, 'app');
    execFileSync('mkdir', ['-p', inner]);
    writeFileSync(path.join(inner, 'package.json'), '{}\n');
    const envSha = 'c'.repeat(40);
    expect(resolveBuildSha(inner, { GITHUB_SHA: envSha })).toBe(envSha);
    expect(resolveBuildSha(inner, {})).toBe('unknown');
    expect(resolveBuildSha(inner, {})).not.toBe(outerHead);
  });

  it('uses GITHUB_SHA for a directory that is not a git root', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'jamt-tarball-'));
    const envSha = 'd'.repeat(40);
    expect(resolveBuildSha(dir, { GITHUB_SHA: envSha })).toBe(envSha);
    expect(resolveBuildSha(dir, { GITHUB_SHA: 'not-a-sha' })).toBe('unknown');
    expect(resolveBuildSha(dir, {})).toBe('unknown');
  });

  it('reports the SHA of a temp directory that is its own git root', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'jamt-root-'));
    const head = commitEmpty(dir);
    expect(resolveBuildSha(dir, { GITHUB_SHA: 'e'.repeat(40) })).toBe(head);
  });
});
