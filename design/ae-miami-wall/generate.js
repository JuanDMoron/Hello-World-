/*
 * AE of Miami — graffiti on a photographed wall.
 *
 * The wall is a real photograph (Adobe Stock 285565957, licensed). Everything
 * procedural noise could not give us — scratches that go somewhere, stains with
 * history, non-uniform structure, real camera grain and falloff — comes from
 * the plate. See generate-synthetic.js for the fully-procedural predecessor and
 * why it hit a ceiling: noise is statistically uniform, and real surfaces are
 * emphatically not.
 *
 * The one thing that makes paint look painted ON a wall rather than pasted
 * OVER it: the photo is composited back over the letters through a mask of
 * their own alpha, in multiply. Every scratch, pit and shadow in the plate then
 * runs through the white exactly as it runs through the wall around it.
 *
 * Render it with render.sh.
 */

const fs = require('fs');
const path = require('path');

const W = 2160;
const H = 3840;

// The plate, and the transform that turns it into a 9:16 portrait wall.
// 5184x3456 landscape, rotated upright and scaled to cover: rotating means the
// output is DOWNsampled rather than upscaled, which keeps the grain crisp.
const PLATE = { file: 'wall-source.jpg', w: 5184, h: 3456 };
const PLATE_SCALE = Math.max(W / PLATE.h, H / PLATE.w); // cover
const PLATE_X = (W - PLATE.h * PLATE_SCALE) / 2;
const PLATE_TF =
  `translate(${PLATE_X.toFixed(2)} 0) scale(${PLATE_SCALE.toFixed(5)}) ` +
  `translate(${PLATE.h} 0) rotate(90)`;

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
const f = (n) => Number(n).toFixed(1);

// ---------------------------------------------------------- monogram

// The AE monogram: an A whose right leg runs into the spine of the E.
const GLYPH = [
  [[20, 138], [70, 12], [120, 138]], // A
  [[42, 96], [98, 96]], // A crossbar
  [[212, 12], [142, 12], [142, 138], [212, 138]], // E
  [[142, 75], [198, 75]], // E middle bar
];

// Resample a polyline into short segments and push each interior point off the
// line. A can held at arm's length wanders; perfectly straight strokes are the
// single biggest tell that letters were drawn by a machine.
function strokePaths(jitter) {
  return GLYPH.map((pts) => {
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[i + 1];
      const len = Math.hypot(x1 - x0, y1 - y0);
      const steps = Math.max(2, Math.round(len / 22));
      const nx = -(y1 - y0) / len;
      const ny = (x1 - x0) / len;
      for (let s = i === 0 ? 0 : 1; s <= steps; s++) {
        const t = s / steps;
        const swing = Math.sin(t * Math.PI) * jitter + jitter * 0.35;
        out.push([
          x0 + (x1 - x0) * t + nx * rand(-swing, swing) + rand(-0.6, 0.6),
          y0 + (y1 - y0) * t + ny * rand(-swing, swing) + rand(-0.6, 0.6),
        ]);
      }
    }
    return 'M' + out.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L');
  });
}

const DRIP_ORIGINS = [28, 62, 112, 150, 178, 206];

// Aerosol white is never paper white, and it chalks as it ages. These read
// bright because the plate underneath is genuinely dark.
const WHITES = {
  fresh: ['#f2efe9', '#eae7e0', '#f5f2ec'],
  weathered: ['#c6c2b9', '#bab6ad', '#cecac1'],
  faded: ['#8e8b83', '#84817a', '#97938b'],
};

// ------------------------------------------------------------- pieces

function piece(o) {
  const {
    x, y, scale, rot, color, style,
    weight, opacity, wordmark, drips, halo, wear, skew = 0,
  } = o;

  const jitter = style === 'tag' ? 2.6 : 1.7;
  const out = [];

  const strokeAttrs = (w, c) =>
    `stroke="${c}" stroke-width="${f(w)}" fill="none" stroke-linejoin="round" ` +
    `stroke-linecap="${style === 'bubble' || style === 'tag' ? 'round' : 'square'}"`;

  // Two overlapping passes with independent wobble: the union gives the uneven
  // edge a second pass of the can leaves.
  const paths = (w, c) =>
    [1, 0.94]
      .map((k) =>
        strokePaths(jitter)
          .map((d) => `<path d="${d}" ${strokeAttrs(w * k * rand(0.95, 1.05), c)}/>`)
          .join('')
      )
      .join('');

  if (halo) {
    out.push(
      `<g filter="url(#overspray)" opacity="${f(rand(0.06, 0.14))}">${paths(weight, color)}</g>`
    );
  }

  if (drips) {
    const origins = [...DRIP_ORIGINS].sort(() => rng() - 0.5).slice(0, 2 + Math.floor(rng() * 3));
    const runs = origins.map((ox) => ({
      ox,
      len: rand(14, 78),
      wob: rand(-4, 4),
      w: Math.max(2.5, weight * rand(0.13, 0.26)),
    }));
    out.push(
      runs
        .map(
          (r) =>
            `<path d="M${r.ox} 130 Q${f(r.ox + r.wob / 2)} ${f(130 + r.len * 0.62)} ${f(
              r.ox + r.wob
            )} ${f(130 + r.len)}" stroke="${color}" stroke-width="${f(
              r.w
            )}" fill="none" stroke-linecap="round" opacity="0.92"/>` +
            `<circle cx="${f(r.ox + r.wob)}" cy="${f(130 + r.len)}" r="${f(
              r.w * 0.7
            )}" fill="${color}" opacity="0.92"/>`
        )
        .join('')
    );
  }

  out.push(paths(weight, color));

  if (wordmark) {
    const fs2 = style === 'tag' ? 17 : 21;
    out.push(
      `<text x="116" y="${168 + (drips ? 10 : 0)}" font-family="DejaVu Sans, sans-serif" ` +
        `font-weight="bold" font-size="${fs2}" letter-spacing="${f(fs2 * 0.42)}" ` +
        `text-anchor="middle" fill="${color}" opacity="0.95">OF MIAMI</text>`
    );
  }

  const inner = `<g transform="translate(-110 -75)">${out.join('')}</g>`;
  const tf = `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(scale)}) skewX(${f(skew)})`;

  return `<g transform="${tf}" opacity="${f(opacity)}" filter="url(#${wear})">${inner}</g>`;
}

// wear0 barely touched, wear2 half gone. Pick a level, then one of its three
// seeds so two pieces of the same age still erode differently.
const wearFilter = (level) => `wear${level}_${Math.floor(rng() * 3)}`;

// ------------------------------------------------------- composition

const layers = { ghost: [], mid: [], hero: [], tag: [], grime: [] };

// Old coats: what survives is still solid paint, there is just less of it.
for (let i = 0; i < 5; i++) {
  layers.ghost.push(
    piece({
      x: rand(100, W - 100),
      y: rand(180, H - 180),
      scale: rand(2.0, 3.6),
      rot: rand(-16, 16),
      color: pick(WHITES.faded),
      style: 'ghost',
      weight: rand(18, 30),
      opacity: rand(0.2, 0.32),
      wordmark: false,
      drips: false,
      halo: chance(0.25),
      wear: wearFilter(2),
    })
  );
}

// Mid field: a jittered grid so the wall reads as covered, not clumped.
const COLS = 4;
const ROWS = 9;
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    if (chance(0.14)) continue; // leave some bare wall
    const cw = W / COLS;
    const chh = H / ROWS;
    const style = pick(['throwie', 'throwie', 'throwie', 'bubble']);
    const scale = rand(1.05, 1.85);
    const aged = chance(0.45);
    layers.mid.push(
      piece({
        x: c * cw + cw / 2 + rand(-cw * 0.34, cw * 0.34),
        y: r * chh + chh / 2 + rand(-chh * 0.3, chh * 0.3),
        scale,
        rot: rand(-15, 15),
        color: pick(aged ? WHITES.weathered : WHITES.fresh),
        style,
        weight: style === 'bubble' ? rand(34, 42) : rand(24, 32),
        opacity: aged ? rand(0.82, 0.94) : rand(0.94, 1),
        wordmark: scale > 1.5 && chance(0.5),
        drips: chance(0.5),
        halo: chance(0.55),
        wear: wearFilter(aged ? 1 : 0),
        skew: rand(-6, 2),
      })
    );
  }
}

// Fresh pieces: the newest coat on the wall.
const heroSpots = [
  { x: W * 0.5, y: H * 0.15 },
  { x: W * 0.32, y: H * 0.43 },
  { x: W * 0.7, y: H * 0.64 },
  { x: W * 0.45, y: H * 0.87 },
];
heroSpots.forEach((spot, i) => {
  const style = i % 2 === 0 ? 'throwie' : 'bubble';
  layers.hero.push(
    piece({
      x: spot.x + rand(-80, 80),
      y: spot.y + rand(-80, 80),
      scale: rand(2.4, 3.1),
      rot: rand(-10, 10),
      color: pick(WHITES.fresh),
      style,
      weight: style === 'bubble' ? rand(38, 46) : rand(28, 34),
      opacity: 1,
      wordmark: true,
      drips: true,
      halo: true,
      wear: wearFilter(0),
      skew: rand(-7, 1),
    })
  );
});

// Marker tags squeezed into the gaps.
for (let i = 0; i < 34; i++) {
  const aged = chance(0.5);
  layers.tag.push(
    piece({
      x: rand(40, W - 40),
      y: rand(60, H - 60),
      scale: rand(0.5, 1.05),
      rot: rand(-28, 28),
      color: pick(aged ? WHITES.faded : WHITES.weathered),
      style: 'tag',
      weight: rand(8, 15),
      opacity: rand(0.78, 0.96),
      wordmark: chance(0.25),
      drips: chance(0.3),
      halo: false,
      wear: wearFilter(aged ? 2 : 0),
      skew: rand(-14, 6),
    })
  );
}

// Grime over the paint. Dirt does not respect what was sprayed before it.
for (let i = 0; i < 14; i++) {
  const sx = rand(-60, W + 60);
  const sy = rand(-300, H * 0.85);
  const sh = rand(300, 1700);
  const sw = rand(30, 220);
  layers.grime.push(
    `<path d="M${f(sx - sw / 2)} ${f(sy)} L${f(sx + sw / 2)} ${f(sy)} L${f(sx + sw * 0.18)} ${f(
      sy + sh
    )} L${f(sx - sw * 0.18)} ${f(sy + sh)} Z" fill="${pick([
      '#000000',
      '#0a0b0f',
      '#1a1c22',
    ])}" opacity="${f(rand(0.1, 0.26))}" filter="url(#streakBlur)"/>`
  );
}

// --------------------------------------------------------------- svg

const wearFilters = [0, 1, 2]
  .flatMap((level) =>
    [0, 1, 2].map((v) => {
      const t = [0.28, 0.385, 0.46][level]; // fraction of the coat lost
      const chalk = [0.1, 0.17, 0.25][level];
      const dsp = [6, 8, 10][level];
      const seed = 3 + level * 31 + v * 7;
      return `<filter id="wear${level}_${v}" x="-30%" y="-30%" width="160%" height="160%">
    <feTurbulence type="fractalNoise" baseFrequency="${0.02 + v * 0.008}" numOctaves="3" seed="${seed}" result="dn"/>
    <feDisplacementMap in="SourceGraphic" in2="dn" scale="${dsp}" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.021" numOctaves="4" seed="${seed + 101}" result="fn"/>
    <feColorMatrix in="fn" type="matrix"
      values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  6 0 0 0 ${(0.5 - 6 * t).toFixed(2)}" result="flake"/>
    <feComposite in="d" in2="flake" operator="in" result="e1"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.11" numOctaves="2" seed="${seed + 211}" result="cn"/>
    <feColorMatrix in="cn" type="matrix"
      values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  4 0 0 0 ${(0.5 - 4 * chalk).toFixed(2)}" result="chalk"/>
    <feComposite in="e1" in2="chalk" operator="in" result="e2"/>
    <feGaussianBlur in="e2" stdDeviation="0.35"/>
  </filter>`;
    })
  )
  .join('\n  ');

const defs = `
<defs>
  <!--
    Paint wear. Old paint does not fade, it comes off: broad flake patches on a
    steep alpha ramp plus a sparser chalking speckle, so what survives stays
    fully opaque. Three levels x three seeds.
  -->
  ${wearFilters}

  <!-- Overspray halo: blurred paint punched through by noise, which is what
       turns a soft glow into visible aerosol dust. -->
  <filter id="overspray" x="-50%" y="-50%" width="200%" height="200%">
    <feGaussianBlur in="SourceGraphic" stdDeviation="11"/>
  </filter>

  <filter id="streakBlur" x="-60%" y="-20%" width="220%" height="140%">
    <feGaussianBlur stdDeviation="26 55"/>
  </filter>

  <!--
    The plate re-levelled for use as a multiplier. Straight multiply by a photo
    this dark would crush the paint to nothing; this maps the wall's tonal range
    onto roughly [0.45, 1.15] so it modulates the white instead of killing it.
  -->
  <filter id="asModulator" x="0" y="0" width="100%" height="100%">
    <feComponentTransfer>
      <feFuncR type="linear" slope="1.9" intercept="0.55"/>
      <feFuncG type="linear" slope="1.9" intercept="0.55"/>
      <feFuncB type="linear" slope="1.9" intercept="0.55"/>
    </feComponentTransfer>
  </filter>

  <!-- Paint alpha as a white silhouette, for use as a luminance mask. -->
  <filter id="silhouette" x="-10%" y="-10%" width="120%" height="120%">
    <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0"/>
  </filter>

  <radialGradient id="vignette" cx="0.5" cy="0.45" r="0.78">
    <stop offset="58%" stop-color="#000000" stop-opacity="0"/>
    <stop offset="100%" stop-color="#000000" stop-opacity="0.42"/>
  </radialGradient>

  <g id="plate">
    <image href="${PLATE.file}" x="0" y="0" width="${PLATE.w}" height="${PLATE.h}"
           preserveAspectRatio="none" transform="${PLATE_TF}"/>
  </g>

  <mask id="paintMask" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">
    <use href="#paintArt" filter="url(#silhouette)"/>
  </mask>
</defs>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
${defs}
  <!-- The wall, as photographed. -->
  <use href="#plate"/>

  <!-- The paint. -->
  <g id="paintArt">
    <g id="ghosts">${layers.ghost.join('')}</g>
    <g id="mid">${layers.mid.join('')}</g>
    <g id="hero">${layers.hero.join('')}</g>
    <g id="tags">${layers.tag.join('')}</g>
  </g>

  <!--
    The plate again, masked to the paint and multiplied over it. This is the
    step that makes the letters belong to the wall: every scratch, pit and
    shadow in the photograph now runs through the white exactly as it runs
    through the concrete around it.
  -->
  <g mask="url(#paintMask)" style="mix-blend-mode:multiply">
    <use href="#plate" filter="url(#asModulator)"/>
  </g>

  <!-- Dirt, laid over everything. -->
  <g id="grime">${layers.grime.join('')}</g>
  <rect width="${W}" height="${H}" fill="url(#vignette)"/>
</svg>`;

const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>AE of Miami — graffiti wall</title>
<style>
  html,body{margin:0;padding:0;background:#000;}
  svg{display:block;}
  /* SVG filters default to linearRGB, which turns every gamma curve into a
     washout on a near-black plate. Work in sRGB. */
  filter{color-interpolation-filters:sRGB;}
</style></head>
<body>${svg}</body></html>`;

fs.writeFileSync(path.join(__dirname, 'wall.html'), html);
console.log(
  `wrote wall.html — plate ${PLATE.w}x${PLATE.h} @ ${PLATE_SCALE.toFixed(3)} | ` +
    `ghosts:${layers.ghost.length} mid:${layers.mid.length} ` +
    `hero:${layers.hero.length} tags:${layers.tag.length}`
);
