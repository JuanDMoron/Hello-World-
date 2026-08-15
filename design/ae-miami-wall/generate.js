/*
 * AE of Miami — graffiti wall background generator.
 *
 * Emits a self-contained HTML file holding one full-bleed SVG:
 *   - a black, heavily textured concrete wall (layered fractal-noise filters)
 *   - many AE monograms sprayed over it in four depth layers
 *
 * Everything is procedural and seeded, so the same seed always rebuilds the
 * exact same wall. Render it with render.sh.
 */

const fs = require('fs');
const path = require('path');

const W = 2160;
const H = 3840;

// ---------------------------------------------------------------- rng

function makeRng(seed) {
  let s = seed >>> 0;
  return function rng() {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

const rng = makeRng(20260815);
const rand = (a, b) => a + rng() * (b - a);
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
const chance = (p) => rng() < p;

// Walks a shuffled palette so neighbouring pieces never land on the same can.
function makeCycler(arr) {
  let bag = [];
  return function next() {
    if (!bag.length) bag = [...arr].sort(() => rng() - 0.5);
    return bag.pop();
  };
}

// ---------------------------------------------------------- monogram

// The AE monogram lives in a 220 x 150 box: an A whose right leg runs into the
// spine of the E. Letterforms are strokes, so weight is a single knob.
const A_PATH = 'M20 138 L70 12 L120 138';
const A_BAR = 'M42 96 L98 96';
const E_PATH = 'M212 12 L142 12 L142 138 L212 138';
const E_BAR = 'M142 75 L198 75';

const STROKES = [A_PATH, A_BAR, E_PATH, E_BAR];

// Where paint can run off the bottom of the letterforms.
const DRIP_ORIGINS = [28, 62, 112, 150, 178, 206];

const MIAMI = [
  '#FF2D95', // hot pink
  '#00E5FF', // cyan
  '#14E0B0', // teal
  '#FF7A18', // sunset orange
  '#FFD400', // yellow
  '#A855F7', // purple
  '#FF4D6D', // coral
  '#B6FF3A', // acid lime
  '#2E7BFF', // electric blue
];

function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const v = amount > 0 ? c + (255 - c) * amount : c * (1 + amount);
    return Math.max(0, Math.min(255, Math.round(v)));
  });
  return '#' + ch.map((c) => c.toString(16).padStart(2, '0')).join('');
}

// ------------------------------------------------------------- pieces

/**
 * One sprayed AE. `style` drives the paint treatment:
 *   ghost   – old coat, bled into the wall, barely there
 *   throwie – two-tone fill + keyline, the workhorse
 *   bubble  – fat rounded caps
 *   block   – hard offset shadow behind the letters
 *   tag     – thin marker scrawl
 */
function piece(o) {
  const {
    x, y, scale, rot, color, style,
    weight, opacity, wordmark, drips, halo, roughId, skew = 0,
  } = o;

  const keyline = weight + Math.max(10, weight * 0.55);
  const dark = shade(color, -0.62);
  const light = shade(color, 0.5);
  const out = [];

  const strokeAttrs = (w, c, extra = '') =>
    `stroke="${c}" stroke-width="${w}" fill="none" stroke-linejoin="${
      style === 'bubble' ? 'round' : 'miter'
    }" stroke-linecap="${style === 'bubble' || style === 'tag' ? 'round' : 'square'}" ${extra}`;

  const paths = (attrs) => STROKES.map((d) => `<path d="${d}" ${attrs}/>`).join('');

  // Overspray haze — the soft cloud of aerosol that misses the letters.
  if (halo) {
    out.push(
      `<g filter="url(#overspray)" opacity="0.5">${paths(strokeAttrs(weight, color))}</g>`
    );
  }

  // Hard block shadow, offset down-right.
  if (style === 'block') {
    for (let i = 6; i >= 1; i--) {
      const d = i * 3.2;
      out.push(
        `<g transform="translate(${d} ${d})" opacity="${0.9 - i * 0.06}">${paths(
          strokeAttrs(weight, '#06070a')
        )}</g>`
      );
    }
  }

  // Drips run first so the letterform sits on top of them. Each run tapers as
  // it falls and beads up at the tip, the way a loaded cap actually behaves.
  if (drips) {
    const origins = [...DRIP_ORIGINS].sort(() => rng() - 0.5).slice(0, 2 + Math.floor(rng() * 3));
    const runs = origins.map((ox) => ({
      ox,
      len: rand(16, 74),
      wob: rand(-4, 4),
      w: Math.max(3, weight * rand(0.16, 0.3)),
    }));
    const runPath = ({ ox, len, wob }) =>
      `M${ox} 130 Q${ox + wob / 2} ${130 + len * 0.62} ${ox + wob} ${130 + len}`;

    if (style !== 'tag') {
      out.push(
        runs
          .map(
            (r) =>
              `<path d="${runPath(r)}" stroke="#06070a" stroke-width="${
                r.w + 7
              }" fill="none" stroke-linecap="round"/>`
          )
          .join('')
      );
    }
    out.push(
      runs
        .map(
          (r) =>
            `<path d="${runPath(r)}" stroke="${color}" stroke-width="${
              r.w
            }" fill="none" stroke-linecap="round"/>` +
            `<circle cx="${r.ox + r.wob}" cy="${130 + r.len}" r="${(r.w * 0.72).toFixed(
              1
            )}" fill="${color}"/>`
        )
        .join('')
    );
  }

  // Keyline, body, highlight.
  if (style !== 'tag' && style !== 'ghost') {
    out.push(paths(strokeAttrs(keyline, '#06070a')));
  }
  out.push(paths(strokeAttrs(weight, color)));

  // Inner highlight / shade only pays off at a size where it can be read.
  if (scale > 1.5 && (style === 'throwie' || style === 'block' || style === 'bubble')) {
    out.push(
      `<g transform="translate(-${weight * 0.16} -${weight * 0.16})" opacity="0.55">${paths(
        strokeAttrs(weight * 0.22, light)
      )}</g>`
    );
    out.push(
      `<g transform="translate(${weight * 0.2} ${weight * 0.2})" opacity="0.4">${paths(
        strokeAttrs(weight * 0.18, dark)
      )}</g>`
    );
  }

  if (wordmark) {
    const fs2 = style === 'tag' ? 17 : 21;
    out.push(
      `<text x="116" y="${170 + (drips ? 12 : 0)}" font-family="DejaVu Sans, sans-serif" ` +
        `font-weight="bold" font-size="${fs2}" letter-spacing="${fs2 * 0.42}" ` +
        `text-anchor="middle" fill="${color}" stroke="#06070a" stroke-width="${fs2 * 0.3}" ` +
        `paint-order="stroke" >OF MIAMI</text>`
    );
  }

  const inner = `<g transform="translate(-110 -75) ">${out.join('')}</g>`;
  const tf = `translate(${x} ${y}) rotate(${rot}) scale(${scale}) skewX(${skew})`;

  return `<g transform="${tf}" opacity="${opacity}" filter="url(#${roughId})" ${
    style === 'ghost' ? 'style="mix-blend-mode:soft-light"' : ''
  }>${inner}</g>`;
}

const ROUGH = ['rough1', 'rough2', 'rough3'];

// ------------------------------------------------------- composition

const layers = { streak: [], ghost: [], mid: [], hero: [], tag: [] };
const nextColor = makeCycler(MIAMI);

// Old coats: huge, washed out, painted over long ago.
for (let i = 0; i < 6; i++) {
  layers.ghost.push(
    piece({
      x: rand(120, W - 120),
      y: rand(200, H - 200),
      scale: rand(3.6, 6.0),
      rot: rand(-16, 16),
      color: pick(['#9aa4b2', '#8b7f74', '#6f7c8a', '#a3907d']),
      style: 'ghost',
      weight: rand(18, 28),
      opacity: rand(0.08, 0.16),
      wordmark: false,
      drips: false,
      halo: false,
      roughId: pick(ROUGH),
    })
  );
}

// Rain streaks: dirt washed down the wall from ledges and cracks. Tapered,
// soft-edged vertical smears — what actually stains an outdoor wall.
for (let i = 0; i < 15; i++) {
  const sx = rand(-40, W + 40);
  const sy = rand(-200, H * 0.72);
  const sh = rand(340, 1500);
  const sw = rand(24, 150);
  layers.streak.push(
    `<path d="M${(sx - sw / 2).toFixed(0)} ${sy.toFixed(0)} L${(sx + sw / 2).toFixed(0)} ${sy.toFixed(
      0
    )} L${(sx + sw * 0.2).toFixed(0)} ${(sy + sh).toFixed(0)} L${(sx - sw * 0.2).toFixed(0)} ${(
      sy + sh
    ).toFixed(0)} Z" fill="${pick(['#000000', '#04050a', '#0e1015'])}" opacity="${rand(
      0.18,
      0.45
    ).toFixed(2)}" filter="url(#streakBlur)"/>`
  );
}

// Mid field: a jittered grid so the wall reads as covered, not clumped.
const COLS = 4;
const ROWS = 9;
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    if (chance(0.12)) continue; // leave some bare wall
    const cw = W / COLS;
    const chh = H / ROWS;
    const style = pick(['throwie', 'throwie', 'bubble', 'block']);
    const scale = rand(1.05, 1.85);
    layers.mid.push(
      piece({
        x: c * cw + cw / 2 + rand(-cw * 0.34, cw * 0.34),
        y: r * chh + chh / 2 + rand(-chh * 0.3, chh * 0.3),
        scale,
        rot: rand(-15, 15),
        color: nextColor(),
        style,
        weight: style === 'bubble' ? rand(34, 42) : rand(24, 32),
        opacity: rand(0.6, 0.92),
        wordmark: scale > 1.5 && chance(0.5),
        drips: chance(0.45),
        halo: chance(0.35),
        roughId: pick(ROUGH),
        skew: style === 'block' ? rand(-9, 0) : 0,
      })
    );
  }
}

// Fresh pieces: the loudest coat, sitting on top of everything.
const heroSpots = [
  { x: W * 0.5, y: H * 0.14 },
  { x: W * 0.31, y: H * 0.42 },
  { x: W * 0.7, y: H * 0.63 },
  { x: W * 0.44, y: H * 0.86 },
];
heroSpots.forEach((spot, i) => {
  const style = i % 2 === 0 ? 'block' : 'bubble';
  layers.hero.push(
    piece({
      x: spot.x + rand(-80, 80),
      y: spot.y + rand(-80, 80),
      scale: rand(2.4, 3.1),
      rot: rand(-10, 10),
      color: nextColor(),
      style,
      weight: style === 'bubble' ? rand(38, 46) : rand(28, 34),
      opacity: rand(0.94, 1),
      wordmark: true,
      drips: true,
      halo: true,
      roughId: pick(ROUGH),
      skew: style === 'block' ? rand(-10, -2) : 0,
    })
  );
});

// Marker tags squeezed into the gaps.
for (let i = 0; i < 32; i++) {
  layers.tag.push(
    piece({
      x: rand(40, W - 40),
      y: rand(60, H - 60),
      scale: rand(0.5, 1.05),
      rot: rand(-28, 28),
      color: pick([...MIAMI, '#f2f2f2', '#e8e8e8', '#c9ccd2']),
      style: 'tag',
      weight: rand(9, 16),
      opacity: rand(0.4, 0.8),
      wordmark: chance(0.25),
      drips: chance(0.35),
      halo: false,
      roughId: pick(ROUGH),
      skew: rand(-14, 6),
    })
  );
}

// ------------------------------------------------------------- cracks

const cracks = [];
for (let i = 0; i < 9; i++) {
  const x = rand(0, W);
  const y = rand(0, H);
  const a = rand(0, Math.PI * 2);
  const pts = [[x, y]];
  let cx = x;
  let cy = y;
  let ang = a;
  const steps = Math.floor(rand(6, 22));
  for (let s = 0; s < steps; s++) {
    ang += rand(-0.6, 0.6);
    cx += Math.cos(ang) * rand(20, 46);
    cy += Math.sin(ang) * rand(20, 46);
    pts.push([cx, cy]);
  }
  const d = 'M' + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L');
  cracks.push(
    `<path d="${d}" stroke="#1b1d22" stroke-width="${rand(2, 6).toFixed(
      1
    )}" fill="none" opacity="${rand(0.35, 0.7).toFixed(2)}"/>` +
      `<path d="${d}" stroke="#4a4f58" stroke-width="1.2" fill="none" opacity="0.22" transform="translate(1.5 1.5)"/>`
  );
}

// --------------------------------------------------------------- svg

const defs = `
<defs>
  <linearGradient id="wallGrad" x1="0" y1="0" x2="0.6" y2="1">
    <stop offset="0%" stop-color="#101114"/>
    <stop offset="38%" stop-color="#08080a"/>
    <stop offset="72%" stop-color="#0a0a0d"/>
    <stop offset="100%" stop-color="#050506"/>
  </linearGradient>

  <radialGradient id="keyLight" cx="0.3" cy="0.16" r="0.9">
    <stop offset="0%" stop-color="#7c828e" stop-opacity="0.13"/>
    <stop offset="55%" stop-color="#2b2e35" stop-opacity="0.07"/>
    <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
  </radialGradient>

  <radialGradient id="vignette" cx="0.5" cy="0.46" r="0.82">
    <stop offset="62%" stop-color="#000000" stop-opacity="0"/>
    <stop offset="100%" stop-color="#000000" stop-opacity="0.62"/>
  </radialGradient>

  <!-- Large-scale mottling: damp patches, old render, uneven pour. -->
  <filter id="blotch" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.0035 0.0048" numOctaves="6" seed="41"/>
    <feColorMatrix type="saturate" values="0"/>
    <feComponentTransfer>
      <feFuncR type="gamma" amplitude="1.5" exponent="1.7" offset="-0.25"/>
      <feFuncG type="gamma" amplitude="1.5" exponent="1.7" offset="-0.25"/>
      <feFuncB type="gamma" amplitude="1.5" exponent="1.7" offset="-0.25"/>
      <feFuncA type="table" tableValues="1 1"/>
    </feComponentTransfer>
  </filter>

  <!-- Relief passes. Each is a lit bump map crushed down to near-black with
       bright peaks, so screening it over the wall lights only the high points
       of the aggregate — the readable half of concrete texture on black. -->
  ${[
    { id: 'reliefFine', bf: 0.05, oct: 5, seed: 9, ss: 2.4, az: 225, el: 48, exp: 6.2, amp: 1.0 },
    { id: 'reliefMid', bf: 0.014, oct: 5, seed: 77, ss: 4.0, az: 215, el: 42, exp: 6.4, amp: 1.0 },
  ]
    .map(
      (r) => `<filter id="${r.id}" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="${r.bf}" numOctaves="${r.oct}" seed="${r.seed}" result="n"/>
    <feDiffuseLighting in="n" surfaceScale="${r.ss}" diffuseConstant="1" lighting-color="#ffffff" result="l">
      <feDistantLight azimuth="${r.az}" elevation="${r.el}"/>
    </feDiffuseLighting>
    <feColorMatrix in="l" type="saturate" values="0"/>
    <feComponentTransfer>
      <feFuncR type="gamma" amplitude="${r.amp}" exponent="${r.exp}" offset="0"/>
      <feFuncG type="gamma" amplitude="${r.amp}" exponent="${r.exp}" offset="0"/>
      <feFuncB type="gamma" amplitude="${r.amp}" exponent="${r.exp}" offset="0"/>
      <feFuncA type="table" tableValues="1 1"/>
    </feComponentTransfer>
  </filter>`
    )
    .join('\n  ')}

  <!-- Pores and grit: pure black carried on a noisy alpha, so it bites into
       the wall AND into the paint without depending on a blend mode. -->
  ${[
    { id: 'poresCoarse', bf: '0.05', oct: 4, seed: 31, k: 1.15, off: -0.42 },
    { id: 'poresFine', bf: '0.42', oct: 3, seed: 53, k: 1.0, off: -0.4 },
    { id: 'grit', bf: '0.9', oct: 2, seed: 23, k: 0.9, off: -0.36 },
  ]
    .map(
      (p) => `<filter id="${p.id}" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="${p.bf}" numOctaves="${p.oct}" seed="${p.seed}" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${p.k} 0 0 0 ${p.off}"/>
  </filter>`
    )
    .join('\n  ')}

  <!-- Chipped specks: hard-edged flecks of exposed aggregate. -->
  <filter id="pits" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="turbulence" baseFrequency="0.22" numOctaves="2" seed="61" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.62  0 0 0 0 0.60  0 0 0 0 0.58  1.6 0 0 0 -1.18"/>
  </filter>

  <!-- Paint edges: aerosol never lays down clean. -->
  ${[
    { id: 'rough1', bf: 0.028, sc: 7, seed: 3 },
    { id: 'rough2', bf: 0.041, sc: 9, seed: 17 },
    { id: 'rough3', bf: 0.019, sc: 6, seed: 88 },
  ]
    .map(
      (r) => `<filter id="${r.id}" x="-25%" y="-25%" width="150%" height="150%">
    <feTurbulence type="fractalNoise" baseFrequency="${r.bf}" numOctaves="3" seed="${r.seed}" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="${r.sc}" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feGaussianBlur in="d" stdDeviation="0.55"/>
  </filter>`
    )
    .join('\n  ')}

  <!-- Wash-down streaks: heavy vertical blur, light horizontal. -->
  <filter id="streakBlur" x="-60%" y="-20%" width="220%" height="140%">
    <feGaussianBlur stdDeviation="26 55"/>
  </filter>

  <!-- Overspray halo around a piece. -->
  <filter id="overspray" x="-45%" y="-45%" width="190%" height="190%">
    <feGaussianBlur in="SourceGraphic" stdDeviation="13" result="b"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.4" numOctaves="2" seed="5" result="n"/>
    <feDisplacementMap in="b" in2="n" scale="26" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
</defs>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
${defs}
  <!-- The wall itself: stains, then relief, then the holes in it. -->
  <rect width="${W}" height="${H}" fill="url(#wallGrad)"/>
  <rect width="${W}" height="${H}" filter="url(#blotch)" opacity="0.62" style="mix-blend-mode:soft-light"/>
  <rect width="${W}" height="${H}" filter="url(#reliefMid)" opacity="0.26" style="mix-blend-mode:screen"/>
  <rect width="${W}" height="${H}" filter="url(#reliefFine)" opacity="0.42" style="mix-blend-mode:screen"/>
  <rect width="${W}" height="${H}" filter="url(#pits)" opacity="0.16" style="mix-blend-mode:screen"/>
  <rect width="${W}" height="${H}" filter="url(#poresCoarse)" opacity="0.8"/>
  <rect width="${W}" height="${H}" fill="url(#keyLight)" style="mix-blend-mode:screen"/>
  <g>${cracks.join('')}</g>

  <g id="streaks">${layers.streak.join('')}</g>
  <g id="ghosts">${layers.ghost.join('')}</g>
  <g id="mid">${layers.mid.join('')}</g>
  <g id="hero">${layers.hero.join('')}</g>
  <g id="tags">${layers.tag.join('')}</g>

  <!-- Wall re-asserted over the paint: aerosol sits in the pores, so the
       texture has to cut back through every colour on the wall. -->
  <rect width="${W}" height="${H}" filter="url(#poresCoarse)" opacity="0.34"/>
  <rect width="${W}" height="${H}" filter="url(#poresFine)" opacity="0.42"/>
  <rect width="${W}" height="${H}" filter="url(#grit)" opacity="0.3"/>
  <rect width="${W}" height="${H}" filter="url(#reliefFine)" opacity="0.14" style="mix-blend-mode:screen"/>
  <rect width="${W}" height="${H}" fill="url(#vignette)"/>
</svg>`;

const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>AE of Miami — graffiti wall</title>
<style>
  html,body{margin:0;padding:0;background:#000;}
  svg{display:block;}
  /* SVG filters default to linearRGB, which turns every gamma curve and
     lighting pass into a washout on a near-black wall. Work in sRGB. */
  filter{color-interpolation-filters:sRGB;}
</style></head>
<body>${svg}</body></html>`;

const outDir = __dirname;
fs.writeFileSync(path.join(outDir, 'wall.html'), html);
console.log(
  `wrote wall.html — ghosts:${layers.ghost.length} mid:${layers.mid.length} hero:${layers.hero.length} tags:${layers.tag.length}`
);
