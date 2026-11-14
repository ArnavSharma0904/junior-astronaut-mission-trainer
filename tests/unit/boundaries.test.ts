import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function files(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? files(full) : [full];
  });
}

describe('architecture boundaries', () => {
  it('keeps the game engine free of DOM, network, storage, clocks and randomness', () => {
    const forbidden = /\b(window|document|fetch|localStorage|sessionStorage|Math\.random|Date\.now|new Date|setTimeout|requestAnimationFrame)\b|from 'react/;
    const offenders = files('src/game').filter((file) => forbidden.test(readFileSync(file, 'utf8')));
    expect(offenders).toEqual([]);
  });

  it('never calls the network or exposes a NASA key from application source', () => {
    const offenders = files('src').filter((file) => /\.(ts|tsx)$/.test(file) && /\bfetch\(|XMLHttpRequest|VITE_NASA|api_key/i.test(readFileSync(file, 'utf8')));
    expect(offenders).toEqual([]);
  });
});
