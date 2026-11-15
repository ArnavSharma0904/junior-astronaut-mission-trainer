// Extra evidence after `npm run build`. Not one of the five canonical checks.
// Measures the built entry JavaScript with gzip. This is not a phone or frame-rate result.
import { readdirSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const files = readdirSync('dist/assets').filter((name) => name.startsWith('index-') && name.endsWith('.js'));
if (files.length !== 1) {
  console.error(`Expected one critical JS file, found ${files.join(', ') || 'none'}`);
  process.exit(1);
}
const assets = readdirSync('dist/assets');
const jsBytes = assets.filter((name) => name.endsWith('.js')).reduce((total, name) => total + gzipSync(readFileSync(`dist/assets/${name}`)).length, 0);
const cssBytes = assets.filter((name) => name.endsWith('.css')).reduce((total, name) => total + gzipSync(readFileSync(`dist/assets/${name}`)).length, 0);
const fontBytes = assets.filter((name) => /\.(woff2|woff|ttf|otf)$/.test(name)).reduce((total, name) => total + readFileSync(`dist/assets/${name}`).length, 0);
const bytes = gzipSync(readFileSync(`dist/assets/${files[0]}`)).length;
const limit = 300 * 1024;
console.log(`critical JS ${files[0]} gzip ${bytes} bytes (limit ${limit})`);
console.log(`js gzip total ${jsBytes} bytes; css gzip total ${cssBytes} bytes; font files ${fontBytes} bytes`);
console.log('Interaction time was not measured. This is a file-size gate, not a phone, Safari, or frame-rate result.');
if (bytes > limit || jsBytes > limit) process.exit(1);
