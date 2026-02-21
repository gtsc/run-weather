import sharp from 'sharp';
import { mkdirSync } from 'fs';

const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#22c55e"/>
  <text x="50" y="68" font-family="system-ui,sans-serif" font-size="52"
        font-weight="700" text-anchor="middle" fill="white">R</text>
</svg>`);

mkdirSync('public/icons', { recursive: true });
await sharp(svg).resize(192, 192).png().toFile('public/icons/icon-192.png');
console.log('✓ icon-192.png');
await sharp(svg).resize(512, 512).png().toFile('public/icons/icon-512.png');
console.log('✓ icon-512.png');
