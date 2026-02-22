import sharp from 'sharp';
import { mkdirSync } from 'fs';

const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#22c55e"/>
  <circle cx="64" cy="17" r="7.5" fill="white"/>
  <g stroke="white" stroke-linecap="round" stroke-linejoin="round" stroke-width="5.5" fill="none">
    <line x1="62" y1="25" x2="48" y2="50"/>
    <line x1="57" y1="36" x2="73" y2="26"/>
    <line x1="57" y1="36" x2="42" y2="46"/>
    <line x1="48" y1="50" x2="62" y2="68"/>
    <line x1="62" y1="68" x2="72" y2="64"/>
    <line x1="48" y1="50" x2="37" y2="62"/>
    <line x1="37" y1="62" x2="30" y2="53"/>
  </g>
  <text x="50" y="92" font-family="system-ui,Arial,sans-serif" font-size="21" font-weight="800" text-anchor="middle" fill="white">RW</text>
</svg>`);

mkdirSync('public/icons', { recursive: true });
await sharp(svg).resize(192, 192).png().toFile('public/icons/icon-192.png');
console.log('✓ icon-192.png');
await sharp(svg).resize(512, 512).png().toFile('public/icons/icon-512.png');
console.log('✓ icon-512.png');
