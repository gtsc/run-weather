// Generates the app icons from one SVG source. Run: npm run generate:icons
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';

const TILE = '#166534';
const SUN = '#fde68a';
const CURVE = '#ffffff';

/** @param {{ rounded: boolean, scale?: number, bold?: boolean }} opts */
function icon({ rounded, scale = 1, bold = false }) {
  const t = (32 * (1 - scale)).toFixed(2);
  const sw = bold ? 8 : 5;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="${rounded ? 15 : 0}" fill="${TILE}"/>
  <g transform="translate(${t} ${t}) scale(${scale})">
    <circle cx="40" cy="22" r="${bold ? 9 : 7}" fill="${SUN}"/>
    <path d="M8 46 C 18 46, 22 30, 32 30 S 46 40, 56 34" fill="none" stroke="${CURVE}" stroke-width="${sw}" stroke-linecap="round"/>
  </g>
</svg>`;
}

mkdirSync('public/icons', { recursive: true });
writeFileSync('public/favicon.svg', icon({ rounded: true, bold: true }));

const png = (svg, size, file) =>
  sharp(Buffer.from(svg)).resize(size, size).png().toFile(`public/icons/${file}`);

await png(icon({ rounded: true }), 192, 'icon-192.png');
await png(icon({ rounded: true }), 512, 'icon-512.png');
// Maskable: full-bleed tile, artwork inside the 80% safe zone.
await png(icon({ rounded: false, scale: 0.75 }), 512, 'icon-maskable-512.png');
// iOS rounds the corners itself.
await png(icon({ rounded: false, scale: 0.9 }), 180, 'apple-touch-icon.png');
console.log('✓ favicon.svg, icon-192, icon-512, icon-maskable-512, apple-touch-icon');
