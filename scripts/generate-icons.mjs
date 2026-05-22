/**
 * Generate Expo app icons from `dosely-icon.svg`.
 *
 *   node scripts/generate-icons.mjs
 *
 * Outputs:
 *   assets/icon.png             — 1024×1024, full design (iOS app icon)
 *   assets/adaptive-icon.png    — 1024×1024, capsule + clock only on
 *                                 transparent (Android adaptive foreground —
 *                                 the OS draws the teal tile via
 *                                 adaptiveIcon.backgroundColor)
 *   assets/splash-icon.png      — 1024×1024, full design (splash screen)
 *   assets/favicon.png          —   48×48, full design (web favicon)
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const svgPath = resolve(root, 'dosely-icon.svg');
const fullSvg = readFileSync(svgPath, 'utf-8');

/**
 * Strip the teal tile (and inner glow) and re-pad the artwork so it sits
 * inside Android's adaptive-icon safe zone. The OS adds the backgroundColor
 * tile and applies the squircle mask itself.
 */
function adaptiveForegroundSvg(svg) {
  // Drop the outer tile rect and the inner-glow circle.
  let stripped = svg
    .replace(/<!--\s*App tile\s*-->[\s\S]*?<rect[^>]*?fill="url\(#tile\)"\s*\/>/, '')
    .replace(/<!--\s*subtle inner glow\s*-->[\s\S]*?<circle[^>]*?opacity="0\.06"\s*\/>/, '');
  // Wrap the inner content in a centered group scaled to ~70% so it fits the
  // adaptive-icon safe zone (66dp of 108dp ≈ 0.611, +slack for visual weight).
  stripped = stripped.replace(
    /(<svg[^>]*>)([\s\S]*?)(<\/svg>)/,
    (_match, open, inner, close) =>
      `${open}<g transform="translate(76 76) scale(0.7)">${inner}</g>${close}`,
  );
  return stripped;
}

function render(svg, size) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
    background: 'rgba(0,0,0,0)',
  });
  return resvg.render().asPng();
}

const targets = [
  { out: 'assets/icon.png', size: 1024, svg: fullSvg },
  { out: 'assets/adaptive-icon.png', size: 1024, svg: adaptiveForegroundSvg(fullSvg) },
  { out: 'assets/splash-icon.png', size: 1024, svg: fullSvg },
  { out: 'assets/favicon.png', size: 48, svg: fullSvg },
];

for (const { out, size, svg } of targets) {
  const png = render(svg, size);
  const outPath = resolve(root, out);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, png);
  console.log(`✓ ${out} (${size}×${size}, ${(png.length / 1024).toFixed(1)} KB)`);
}
