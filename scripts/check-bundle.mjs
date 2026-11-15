// Extra evidence after `npm run build`. Not one of the five canonical checks.
// Measures the built entry JavaScript with gzip. This is not a phone or frame-rate result.
import { readdirSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const files = readdirSync('dist/assets').filter((name) => name.startsWith('index-') && name.endsWith('.js'));
if (files.length !== 1) {
  console.error(`Expected one critical JS file, found ${files.join(', ') || 'none'}`);
  process.exit(1);
}
const bytes = gzipSync(readFileSync(`dist/assets/${files[0]}`)).length;
const limit = 300 * 1024;
console.log(`critical JS ${files[0]} gzip ${bytes} bytes (limit ${limit})`);
if (bytes > limit) process.exit(1);
