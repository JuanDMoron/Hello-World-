/*
 * AE of Miami — photoreal graffiti wall background.
 *
 * Emits a self-contained HTML file holding one full-bleed SVG.
 *
 * The realism comes from treating the image as a material, not a stack of
 * decals. Wall colour and white paint go into a single albedo layer, and ONE
 * shared height field lights all of it at once — so the aerosol sits in the
 * pores of the concrete and catches the same raking light the wall does,
 * instead of floating on top of it. A camera pass (light falloff, bloom,
 * sensor noise, lifted blacks) goes over the result.
 *
 * Everything is procedural and seeded. Render it with render.sh.
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
const f = (n) => Number(n).toFixed(1);

// ---------------------------------------------------------- monogram

// The AE monogram: an A whose right leg runs into the spine of the E. Held as
// point lists so every piece can be re-drawn with its own hand jitter — no two
// sprayed copies of a logo are ever identical.
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
      // unit normal, to push the wobble sideways rather than along the stroke
      const nx = -(y1 - y0) / len;
      const ny = (x1 - x0) / len;
      for (let s = i === 0 ? 0 : 1; s <= steps; s++) {
        const t = s / steps;
        // ends stay put, the middle is free to wander
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

// Where paint can run off the bottom of the letterforms.
const DRIP_ORIGINS = [28, 62, 112, 150, 178, 206];

// Aerosol white is never paper white, and it chalks as it ages. These are the
// flat, dead whites of old spray paint — nothing here glows.
const WHITES = {
  fresh: ['#ddd9d1', '#d5d1c8', '#e2ded5'],
  weathered: ['#aeaaa1', '#a39f97', '#b6b2a9'],
  faded: ['#7c7971', '#726f68', '#858179'],
};

// ------------------------------------------------------------- pieces

/**
 * One sprayed AE. `style` drives the paint treatment:
 *   ghost   – an old coat weathered back down into the wall
 *   throwie – flat fill with a keyline, the workhorse
 *   bubble  – fat rounded caps
 *   block   – hard offset shadow behind the letters
 *   tag     – thin marker scrawl
 */
function piece(o) {
  const {
    x, y, scale, rot, color, style,
    weight, opacity, wordmark, drips, halo, wear, skew = 0,
  } = o;

  const jitter = style === 'tag' ? 2.6 : 1.7;
  const keyline = weight + Math.max(9, weight * 0.5);
  const out = [];

  const strokeAttrs = (w, c) =>
    `stroke="${c}" stroke-width="${f(w)}" fill="none" stroke-linejoin="round" ` +
    `stroke-linecap="${style === 'bubble' || style === 'tag' ? 'round' : 'square'}"`;

  // Two overlapping passes with independent wobble and slightly different
  // weights. The union of the two gives the uneven edge a real second pass of
  // the can leaves — cleaner than trying to vary width along one path.
  const paths = (w, c) =>
    [1, 0.94]
      .map((k) =>
        strokePaths(jitter)
          .map((d) => `<path d="${d}" ${strokeAttrs(w * k * rand(0.95, 1.05), c)}/>`)
          .join('')
      )
      .join('');

  // Overspray — the cone of aerosol that misses the letters and dusts the wall.
  if (halo) {
    out.push(
      `<g filter="url(#overspray)" opacity="${f(rand(0.3, 0.55))}">${paths(weight, color)}</g>`
    );
  }

  // Hard block shadow, offset down-right. Reads as a second, darker can.
  if (style === 'block') {
    for (let i = 5; i >= 1; i--) {
      const d = i * 3.4;
      out.push(
        `<g transform="translate(${f(d)} ${f(d)})" opacity="${f(0.85 - i * 0.07)}">${paths(
          weight,
          '#0b0c0f'
        )}</g>`
      );
    }
  }

  // Drips run before the letterform so the stroke sits on top of them.
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

  // A dark keyline reads as a second pass with a black can — only the loud
  // styles get one, and never the aged coats.
  if (style === 'throwie' || style === 'block') {
    out.push(paths(keyline, '#0a0b0e'));
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

// wear0 barely touched, wear2 half gone. Pick a level, then one of its
// three seeds so two pieces at the same age still erode differently.
const wearFilter = (level) => `wear${level}_${Math.floor(rng() * 3)}`;

// ------------------------------------------------------- composition

const layers = { streak: [], ghost: [], mid: [], hero: [], tag: [], grime: [] };

// Rain streaks: dirt washed down from ledges and cracks. Tapered, soft-edged
// vertical smears — what actually stains an outdoor wall.
for (let i = 0; i < 16; i++) {
  const sx = rand(-40, W + 40);
  const sy = rand(-240, H * 0.7);
  const sh = rand(360, 1600);
  const sw = rand(26, 165);
  layers.streak.push(
    `<path d="M${f(sx - sw / 2)} ${f(sy)} L${f(sx + sw / 2)} ${f(sy)} L${f(sx + sw * 0.2)} ${f(
      sy + sh
    )} L${f(sx - sw * 0.2)} ${f(sy + sh)} Z" fill="${pick([
      '#000000',
      '#04050a',
      '#111318',
    ])}" opacity="${f(rand(0.16, 0.4))}" filter="url(#streakBlur)"/>`
  );
}

// Grime laid over the paint. Dirt does not respect what was sprayed before
// it, and nothing ages a wall faster than filth running across the letters.
for (let i = 0; i < 20; i++) {
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
    ])}" opacity="${f(rand(0.12, 0.34))}" filter="url(#streakBlur)"/>`
  );
}

// Old coats: large, weathered almost back into the concrete.
for (let i = 0; i < 8; i++) {
  layers.ghost.push(
    piece({
      x: rand(100, W - 100),
      y: rand(180, H - 180),
      scale: rand(2.0, 3.6),
      rot: rand(-16, 16),
      color: pick(WHITES.faded),
      style: 'ghost',
      weight: rand(18, 30),
      opacity: rand(0.3, 0.5),
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
    const style = pick(['throwie', 'throwie', 'bubble', 'block']);
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
        wear: wearFilter(aged ? 2 : chance(0.5) ? 1 : 0),
        skew: style === 'block' ? rand(-9, 0) : 0,
      })
    );
  }
}

// Fresh pieces: the newest coat, the brightest white on the wall.
const heroSpots = [
  { x: W * 0.5, y: H * 0.15 },
  { x: W * 0.32, y: H * 0.43 },
  { x: W * 0.7, y: H * 0.64 },
  { x: W * 0.45, y: H * 0.87 },
];
heroSpots.forEach((spot, i) => {
  const style = i % 2 === 0 ? 'block' : 'bubble';
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
      wear: wearFilter(chance(0.5) ? 1 : 0),
      skew: style === 'block' ? rand(-10, -2) : 0,
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
      wear: wearFilter(aged ? 2 : 1),
      skew: rand(-14, 6),
    })
  );
}

// ------------------------------------------------------------- cracks

const cracks = [];
for (let i = 0; i < 18; i++) {
  const pts = [[rand(0, W), rand(0, H)]];
  let ang = rand(0, Math.PI * 2);
  const steps = Math.floor(rand(6, 24));
  for (let s = 0; s < steps; s++) {
    ang += rand(-0.6, 0.6);
    pts.push([
      pts[pts.length - 1][0] + Math.cos(ang) * rand(20, 48),
      pts[pts.length - 1][1] + Math.sin(ang) * rand(20, 48),
    ]);
  }
  const d = 'M' + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join(' L');
  cracks.push(
    `<path d="${d}" stroke="#000000" stroke-width="${f(rand(2, 6))}" fill="none" opacity="${f(
      rand(0.4, 0.8)
    )}" filter="url(#wear0_1)"/>`
  );
}

// Anchor holes and chips: the small hard details a real wall always carries.
const pocks = [];
for (let i = 0; i < 48; i++) {
  const pr = rand(3, 16);
  pocks.push(
    `<ellipse cx="${f(rand(0, W))}" cy="${f(rand(0, H))}" rx="${f(pr)}" ry="${f(
      pr * rand(0.7, 1)
    )}" fill="#000" opacity="${f(rand(0.35, 0.7))}" filter="url(#wear0_2)"/>`
  );
}

// --------------------------------------------------------------- svg

const defs = `
<defs>
  <linearGradient id="wallGrad" x1="0" y1="0" x2="0.5" y2="1">
    <stop offset="0%" stop-color="#232529"/>
    <stop offset="45%" stop-color="#1d1f24"/>
    <stop offset="100%" stop-color="#191b20"/>
  </linearGradient>

  <!-- Photographic light falloff: the lamp is up and to the left. -->
  <linearGradient id="lightFall" x1="0.12" y1="0" x2="0.9" y2="1">
    <stop offset="0%" stop-color="#e0e1e5"/>
    <stop offset="42%" stop-color="#97989e"/>
    <stop offset="100%" stop-color="#5b5c62"/>
  </linearGradient>

  <radialGradient id="vignette" cx="0.5" cy="0.44" r="0.8">
    <stop offset="55%" stop-color="#000000" stop-opacity="0"/>
    <stop offset="100%" stop-color="#000000" stop-opacity="0.55"/>
  </radialGradient>

  <!-- Albedo variation only: damp patches and old washes, no relief. -->
  <filter id="stain" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.0035 0.0048" numOctaves="6" seed="41"/>
    <feColorMatrix type="saturate" values="0"/>
    <feComponentTransfer>
      <feFuncR type="gamma" amplitude="1.4" exponent="1.6" offset="-0.2"/>
      <feFuncG type="gamma" amplitude="1.4" exponent="1.6" offset="-0.2"/>
      <feFuncB type="gamma" amplitude="1.4" exponent="1.6" offset="-0.2"/>
      <feFuncA type="table" tableValues="1 1"/>
    </feComponentTransfer>
  </filter>

  <!--
    THE MATERIAL PASS.
    One height field, built from three octave bands, lights everything the
    filter is given — wall and paint together. Diffuse shading gives the
    concrete its form, a tight specular lobe puts glints back on the exposed
    aggregate, and the height field is reused to darken the pores, so paint
    reads as sitting *in* the surface rather than on top of it.
  -->
  <filter id="material" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.62" numOctaves="4" seed="11" result="hFine"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.055" numOctaves="5" seed="29" result="hMid"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.0075" numOctaves="4" seed="7" result="hCoarse"/>
    <feComposite in="hFine" in2="hMid" operator="arithmetic" k1="0" k2="0.58" k3="0.42" k4="0" result="hA"/>
    <feComposite in="hA" in2="hCoarse" operator="arithmetic" k1="0" k2="0.78" k3="0.22" k4="0" result="h"/>

    <feDiffuseLighting in="h" surfaceScale="3.6" diffuseConstant="1.05" lighting-color="#ffffff" result="diff">
      <feDistantLight azimuth="228" elevation="34"/>
    </feDiffuseLighting>
    <feColorMatrix in="diff" type="saturate" values="0" result="diffG"/>

    <!-- albedo x diffuse -->
    <feComposite in="SourceGraphic" in2="diffG" operator="arithmetic" k1="3.0" k2="0" k3="0" k4="0" result="shaded"/>

    <!-- aggregate glints, added back on top -->
    <feSpecularLighting in="h" surfaceScale="2.2" specularConstant="0.85" specularExponent="12" lighting-color="#b9bcc4" result="spec">
      <feDistantLight azimuth="228" elevation="34"/>
    </feSpecularLighting>
    <feComposite in="spec" in2="SourceAlpha" operator="in" result="specIn"/>
    <feComposite in="specIn" in2="shaded" operator="arithmetic" k1="0" k2="0.6" k3="1" k4="0" result="lit"/>

    <!-- pores: the deep half of the height field bites back through everything -->
    <feColorMatrix in="h" type="matrix"
      values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -0.9 0 0 0 0.52" result="pores"/>
    <feComposite in="pores" in2="lit" operator="over"/>
  </filter>

  <!-- Bloom: bright paint blooming into the lens, as any real camera does. -->
  <filter id="bloom" x="-10%" y="-10%" width="120%" height="120%">
    <feComponentTransfer>
      <feFuncR type="gamma" amplitude="1" exponent="3.4" offset="0"/>
      <feFuncG type="gamma" amplitude="1" exponent="3.4" offset="0"/>
      <feFuncB type="gamma" amplitude="1" exponent="3.4" offset="0"/>
    </feComponentTransfer>
    <feGaussianBlur stdDeviation="22"/>
  </filter>

  <!--
    Grade. Multiplying albedo by diffuse compresses everything toward the
    middle: the wall never gets black and the paint never gets white. Rather
    than fight that with gain (which clips the grain out of the paint), the
    render is graded at the end — one straight line through the two tones that
    matter, mapping wall 0.17 -> 0.12 and paint 0.635 -> 0.88.
  -->
  <filter id="grade" x="0" y="0" width="100%" height="100%">
    <feComponentTransfer>
      <feFuncR type="linear" slope="1.64" intercept="-0.161"/>
      <feFuncG type="linear" slope="1.64" intercept="-0.161"/>
      <feFuncB type="linear" slope="1.64" intercept="-0.161"/>
    </feComponentTransfer>
  </filter>

  <!-- Sensor noise: luminance grain over the whole frame. -->
  <filter id="sensorNoise" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="93" result="n"/>
    <feColorMatrix in="n" type="matrix"
      values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.52  1.1 0 0 0 -0.55"/>
  </filter>

  <!-- Wash-down streaks: heavy vertical blur, light horizontal. -->
  <filter id="streakBlur" x="-60%" y="-20%" width="220%" height="140%">
    <feGaussianBlur stdDeviation="26 55"/>
  </filter>

  <!--
    Paint wear. Aerosol never lays down clean, and old paint does not fade —
    it comes OFF. So each piece gets displaced edges plus two erosion masks
    that punch alpha away entirely: broad patches where the coat has flaked
    off the wall, and a fine speckle for chalking. Steep alpha ramps (k=8)
    keep the surviving paint fully opaque instead of washing the whole piece
    to a translucent grey — transparency is the giveaway that this was never
    real paint.

    Three wear levels x three seeds, so repeated pieces never erode alike.
  -->
  ${[0, 1, 2]
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
    <feGaussianBlur in="e2" stdDeviation="0.45"/>
  </filter>`;
      })
    )
    .join('\n  ')}

  <!-- Overspray halo: blurred paint punched through by high-frequency noise,
       which is what turns a soft glow into visible aerosol dust. -->
  <filter id="overspray" x="-50%" y="-50%" width="200%" height="200%">
    <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="b"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="2" seed="5" result="n"/>
    <feComposite in="b" in2="n" operator="arithmetic" k1="1.7" k2="0" k3="0" k4="0"/>
  </filter>
</defs>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
${defs}
  <!-- Everything the lens sees, graded as one image. -->
  <g filter="url(#grade)">
    <!-- ALBEDO + MATERIAL: wall colour and paint shaded as one surface. -->
    <g id="surface" filter="url(#material)">
      <rect width="${W}" height="${H}" fill="url(#wallGrad)"/>
      <rect width="${W}" height="${H}" filter="url(#stain)" opacity="0.5" style="mix-blend-mode:soft-light"/>
      <g id="streaks">${layers.streak.join('')}</g>
      <g id="pocks">${pocks.join('')}</g>
      <g id="cracks">${cracks.join('')}</g>
      <g id="ghosts">${layers.ghost.join('')}</g>
      <g id="mid">${layers.mid.join('')}</g>
      <g id="hero">${layers.hero.join('')}</g>
      <g id="tags">${layers.tag.join('')}</g>
      <g id="grime">${layers.grime.join('')}</g>
    </g>

    <use href="#surface" filter="url(#bloom)" opacity="0.1" style="mix-blend-mode:screen"/>
    <rect width="${W}" height="${H}" fill="url(#lightFall)" style="mix-blend-mode:multiply"/>
    <rect width="${W}" height="${H}" fill="url(#vignette)"/>
  </g>

  <!-- Sensor grain and black lift land after the grade, as they do in a camera. -->
  <rect width="${W}" height="${H}" filter="url(#sensorNoise)" opacity="0.15" style="mix-blend-mode:overlay"/>
  <rect width="${W}" height="${H}" fill="#12161f" opacity="0.06" style="mix-blend-mode:screen"/>
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

fs.writeFileSync(path.join(__dirname, 'wall.html'), html);
console.log(
  `wrote wall.html — ghosts:${layers.ghost.length} mid:${layers.mid.length} ` +
    `hero:${layers.hero.length} tags:${layers.tag.length}`
);
