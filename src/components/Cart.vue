<script setup>
// Hero illustration: the Fusk-it cart, front-on, at night.
// Two stacked SVG layers share one viewBox: a static, heavily-textured base and a light layer
// for the swinging bulbs, so the bulb animation never forces the textured base to re-filter.
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import MarqueeLogo from './MarqueeLogo.vue'
import { SECTIONS, goTo } from '../lib/nav.js'
import framePhoto from '../assets/frame-photo.webp'
import Wheel from './Wheel.vue'
import { TOY } from '../data/toys.js'

const props = defineProps({
  lit: { type: Boolean, default: true },
  powering: { type: Boolean, default: false },
  bake: { type: String, default: '' },
  standees: { type: Boolean, default: false }, // street signs beside the cart (hero only, wide screens) // 'wide' | 'narrow': render only the static scene, for pre-rendering
})
// Regions of the scene baked into images (scene units). Live SVG parts are drawn on top in the same coordinates.
const HERO = {
  wide: { x: -300, y: -60, w: 2200, h: 1300 },
  narrow: { x: 260, y: -60, w: 1080, h: 1300 },
}

function rng(seed) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
function shade(hex, a) {
  const n = parseInt(hex.slice(1), 16)
  const t = a < 0 ? 0 : 255, p = Math.abs(a)
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round((t - v) * p + v))
  return `rgb(${c.join(',')})`
}

const GLASS = ['#F0B3C2', '#F3CF6E', '#EFE4CF', '#C8623A', '#8DB0D6', '#E07890', '#B7C08F']
const glassGrads = GLASS.map((c, i) => ({ id: `gl${i}`, hi: shade(c, 0.45), mid: c, lo: shade(c, -0.5) }))
const NOTES = ['#F6EBA4', '#FFF3A8', '#F1E4AE', '#F6EBA4', '#FFD3E0', '#C8F0E0', '#D6E4FF', '#FBE7B5']

const WIN = { x: 210, y: 210, w: 1160, h: 490 }
const cols = 12, rows = 6
const cw = WIN.w / cols, ch = WIN.h / rows
// Window frame per the daytime photo: thick pine beams, a stained-glass transom row across the
// full width, 2x2 clear panes on each side, and an open centre down to the grass counter.
const BEAM = 20
const F = (() => {
  const L = WIN.x, R = WIN.x + WIN.w, T = WIN.y, B = WIN.y + WIN.h
  const cL = L + 300, cR = R - 300, tB = T + 84, mY = tB + (B - tB) / 2
  return { L, R, T, B, cL, cR, tB, mY }
})()
const lattice = (() => {
  const { L, R, T, B, cL, cR, tB, mY } = F, hb = BEAM / 2
  const v = [L + 150, cL, cR, R - 150].map((x) => ({ x: x - hb, y: T, w: BEAM, h: B - T }))
  v.push({ x: (cL + cR) / 2 - hb, y: T, w: BEAM, h: tB - T })
  const h = [{ x: L, y: tB - hb, w: R - L, h: BEAM }, { x: L, y: mY - hb, w: cL - L, h: BEAM }, { x: cR, y: mY - hb, w: R - cR, h: BEAM }]
  return { v, h }
})()
const transom = (() => {
  const { L, R, T, tB, cL, cR } = F, xs = [L, L + 150, cL, (cL + cR) / 2, cR, R - 150, R]
  return xs.slice(0, -1).map((x, i) => makePane(x + 10, T + 2, xs[i + 1] - x - 20, tB - T - 12, 300 + i, 6, 3))
})()

// Sticky notes: dense on the side panes and along the top, like the real window
const notes = (() => {
  const r = rng(7), out = []
  for (let c = 0; c < cols; c++) for (let rr = 1; rr < rows; rr++) {
    const side = c < 3 || c > 8
    if (!side) continue
    for (let k = 0; k < 7; k++) {
      const s = 20 + r() * 9
      out.push({ x: WIN.x + c * cw + 4 + r() * (cw - s - 8), y: WIN.y + 84 + (rr - 1) * ((WIN.h - 84) / 5) + r() * ((WIN.h - 84) / 5 - s), s,
        rot: (r() - 0.5) * 26, fill: NOTES[Math.floor(r() * NOTES.length)], curl: r() > 0.6, ink: r() > 0.45 })
    }
  }
  return out
})()

const BULBS_WIDE = [ // three a side, all clear of the two chalkboards (x 396-614 and 986-1194)
  { x: 240, len: 205 }, { x: 305, len: 168 }, { x: 370, len: 150 },
  { x: 1230, len: 150 }, { x: 1295, len: 168 }, { x: 1360, len: 205 },
]
// phones: the vertical crop only shows the centre, so each side's three bulbs hang as a cluster beside the TV
const BULBS_NARROW = [ // phones: short drops above the boards, long ones only in the gaps beside the TV
  { x: 525, len: 80 }, { x: 575, len: 92 }, { x: 630, len: 200 },
  { x: 968, len: 200 }, { x: 1028, len: 92 }, { x: 1080, len: 80 },
]
const MQ = '(max-width: 700px), (orientation: portrait) and (max-width: 1100px)'
const startNarrow = props.bake ? props.bake === 'narrow' : typeof matchMedia !== 'undefined' && matchMedia(MQ).matches
const bulbs = ref(startNarrow ? BULBS_NARROW : BULBS_WIDE)
const PIVOT = 186 // ropes hang from the header beam

function makePane(x, y, w, h, seed, nx = 4, ny = 5) {
  const r = rng(seed), gw = w / nx, gh = h / ny
  const P = []
  for (let j = 0; j <= ny; j++) { P.push([])
    for (let i = 0; i <= nx; i++) {
      const edge = i === 0 || j === 0 || i === nx || j === ny
      P[j].push([x + i * gw + (edge ? 0 : (r() - 0.5) * gw * 0.7), y + j * gh + (edge ? 0 : (r() - 0.5) * gh * 0.7)])
    } }
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
  const stones = []
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const c = [P[j][i], P[j][i + 1], P[j + 1][i + 1], P[j + 1][i]]
    const m = c.map((pt, k) => mid(pt, c[(k + 1) % 4]))
    const P2 = (q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`
    // angular shards like real leaded glass: some cells split on a diagonal into two pieces
    if (r() > 0.45) {
      const a = r() > 0.5
      const t1 = a ? [c[0], c[1], c[2]] : [c[1], c[2], c[3]], t2 = a ? [c[2], c[3], c[0]] : [c[3], c[0], c[1]]
      stones.push({ d: `M${P2(t1[0])}L${P2(t1[1])}L${P2(t1[2])}Z`, g: Math.floor(r() * GLASS.length), hx: (t1[0][0] * 2 + t1[1][0]) / 3, hy: (t1[0][1] * 2 + t1[1][1]) / 3 + 2 })
      stones.push({ d: `M${P2(t2[0])}L${P2(t2[1])}L${P2(t2[2])}Z`, g: Math.floor(r() * GLASS.length), hx: (t2[0][0] * 2 + t2[1][0]) / 3, hy: (t2[0][1] * 2 + t2[1][1]) / 3 + 2 })
    } else {
      stones.push({ d: `M${P2(c[0])}L${P2(c[1])}L${P2(c[2])}L${P2(c[3])}Z`, g: Math.floor(r() * GLASS.length), hx: (c[0][0] + m[0][0]) / 2 + 3, hy: (c[0][1] + m[3][1]) / 2 + 3 })
    }
  }
  return { x, y, w, h, stones, id: `pane${seed}` }
}
const panes = []
;[220, 1090].forEach((x0, side) => {
  for (let c = 0; c < 3; c++) for (let rr = 0; rr < 2; rr++)
    panes.push(makePane(x0 + 6 + c * 94, 746 + rr * 108, 78, 92, 100 + side * 10 + c * 3 + rr))
})

// Plush toys as shape lists so each part gets both a fill and a soft shading pass
const toys = [
  { x: 578, kind: 'panda' }, { x: 648, kind: 'teddy' }, { x: 716, kind: 'bunny' }, { x: 790, kind: 'panda', s: 1.1 },
  { x: 872, kind: 'teddy', s: 0.9 }, { x: 942, kind: 'panda', s: 0.95 }, { x: 1012, kind: 'car' },
]

const grassEdge = (() => {
  const r = rng(42), out = []
  for (let i = 0; i < 260; i++) out.push({ x: 522 + r() * 536, y: 552 + r() * 6, h: 5 + r() * 7, a: (r() - 0.5) * 60 })
  return out
})()
const turfEdge = (() => {
  const r = rng(9), out = []
  for (let i = 0; i < 900; i++) out.push({ x: -340 + r() * 2280, y: 978 + r() * 8, h: 6 + r() * 12, a: (r() - 0.5) * 50,
    c: r() > 0.5 ? '#4F8F33' : '#3A7228' })
  return out
})()
// popped kernels: lumpy 3-5 lobe clusters with a little brown hull, piled up in the cabinet
const POP = ['#FFF9EC', '#FDF0CF', '#F8E4B0', '#FFF4DA']
const popcorn = (() => {
  const r = rng(5), out = []
  const add = (x, y, sc) => {
    const n = 3 + Math.floor(r() * 3), lobes = []
    for (let k = 0; k < n; k++) { const a = r() * 6.28, d = r() * 3.6 * sc; lobes.push([Math.cos(a) * d, Math.sin(a) * d, (2.6 + r() * 2.2) * sc]) }
    out.push({ x, y, lobes, c: POP[Math.floor(r() * POP.length)], hull: r() > 0.55, ha: r() * 6.28, depth: y })
  }
  for (let i = 0; i < 230; i++) {
    const x = 242 + r() * 156
    const top = 660 - 46 * Math.max(0, 1 - ((x - 320) / 82) ** 2)
    add(x, top + r() * (690 - top), 1)
  }
  for (let i = 0; i < 22; i++) add(300 + r() * 40, 572 + r() * 14, 0.8) // spilling from kettle
  return out.sort((a, b) => a.depth - b.depth)
})()

// ---- rope physics: each bulb hangs on a verlet rope, so the rope bends and sways fluidly ----
const wrap = ref(null)
const lightSvg = ref(null)
const SEG = 12
let raf = 0, visible = true, io, idle = 0, breeze = 0
const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
const buildRopes = (list) => list.map((b) => {
  const L = WIN.y + b.len - PIVOT
  return { seg: L / SEG, pts: Array.from({ length: SEG + 1 }, (_, k) => ({ x: b.x, y: PIVOT + (L * k) / SEG, px: b.x, py: PIVOT + (L * k) / SEG })) }
})
let ropes = buildRopes(bulbs.value)
const frames = ref(ropes.map(frameOf))
function frameOf(r) {
  const p = r.pts, n = p.length - 1
  let d = `M${p[0].x.toFixed(1)} ${p[0].y.toFixed(1)}`
  for (let k = 1; k < n; k++) {
    const mx = (p[k].x + p[k + 1].x) / 2, my = (p[k].y + p[k + 1].y) / 2
    d += `Q${p[k].x.toFixed(1)} ${p[k].y.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`
  }
  d += `L${p[n].x.toFixed(1)} ${p[n].y.toFixed(1)}`
  const kn = p[Math.round(n * 0.38)], kn2 = p[Math.round(n * 0.38) + 1]
  const end = p[n], pre = p[n - 1]
  const ang = (Math.atan2(end.x - pre.x, end.y - pre.y) * -180) / Math.PI
  const kang = (Math.atan2(kn2.x - kn.x, kn2.y - kn.y) * -180) / Math.PI
  return { d, kx: kn.x, ky: kn.y, kang, ex: end.x, ey: end.y, ang }
}
let wind = null // {x, y, vx} from the cursor
function step() {
  let energy = 0
  for (const r of ropes) {
    const p = r.pts
    for (let k = 1; k < p.length; k++) {
      const q = p[k], vx = (q.x - q.px) * 0.985, vy = (q.y - q.py) * 0.985
      q.px = q.x; q.py = q.y
      let fx = 0
      if (wind) {
        const dist = Math.hypot(q.x - wind.x, q.y - wind.y)
        if (dist < 160) fx = wind.vx * 0.035 * (1 - dist / 160) * (k / p.length)
      }
      q.x += vx + fx; q.y += vy + 0.35 + (k === p.length - 1 ? 0.25 : 0)
      energy += vx * vx + vy * vy
    }
    for (let it = 0; it < 8; it++) {
      p[0].x = p[0].px = r.pts[0].x; // anchor stays put
      for (let k = 0; k < p.length - 1; k++) {
        const a = p[k], c = p[k + 1], dx = c.x - a.x, dy = c.y - a.y, dl = Math.hypot(dx, dy) || 1
        const diff = (dl - r.seg) / dl
        if (k === 0) { c.x -= dx * diff; c.y -= dy * diff }
        else { a.x += dx * diff * 0.5; a.y += dy * diff * 0.5; c.x -= dx * diff * 0.5; c.y -= dy * diff * 0.5 }
      }
    }
  }
  frames.value = ropes.map(frameOf)
  wind = wind && { ...wind, vx: wind.vx * 0.8 }
  idle = energy < 0.002 ? idle + 1 : 0
  raf = idle < 30 && visible ? requestAnimationFrame(step) : 0
}
const kick = () => { idle = 0; if (!raf && !reduced && visible) raf = requestAnimationFrame(step) }
function svgPoint(e) {
  const s = lightSvg.value, pt = s.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY
  return pt.matrixTransform(s.getScreenCTM().inverse())
}
let last = null
function onMove(e) {
  if (reduced || e.pointerType === 'touch') return
  const p = svgPoint(e)
  if (last) wind = { x: p.x, y: p.y, vx: Math.max(-40, Math.min(40, p.x - last.x)) }
  last = p
  kick()
}
function onLeave() { last = null; wind = null }
function tapBulb(i) {
  if (reduced) return
  const end = ropes[i].pts[SEG]
  end.px -= (Math.random() > 0.5 ? 1 : -1) * 9
  kick()
}

let mq
const narrow = ref(startNarrow)
const onMq = (e) => {
  narrow.value = e.matches
  bulbs.value = e.matches ? BULBS_NARROW : BULBS_WIDE
  ropes = buildRopes(bulbs.value)
  frames.value = ropes.map(frameOf)
  kick()
}
onMounted(() => {
  if (props.bake) return
  io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) kick() })
  // a soft night breeze now and then keeps the ropes alive
  if (!reduced) {
    ropes.forEach((r, i) => { r.pts[SEG].px -= (i % 2 ? 4 : -4) })
    kick()
    breeze = setInterval(() => {
      if (!visible || document.hidden) return
      const r = ropes[Math.floor(Math.random() * ropes.length)]
      r.pts[SEG].px += (Math.random() - 0.5) * 6
      kick()
    }, 3200)
  }
  io.observe(wrap.value)
  mq = matchMedia(MQ); narrow.value = mq.matches; mq.addEventListener('change', onMq)
})
onBeforeUnmount(() => { cancelAnimationFrame(raf); clearInterval(breeze); io && io.disconnect(); mq && mq.removeEventListener('change', onMq) })

// axle: wide paddle over each hub, stepping down to a narrower bar between the wheels
const axleD = 'M368 883 H572 Q584 883 590 889 H990 Q996 883 1008 883 H1212 Q1222 883 1222 893 V907 Q1222 917 1212 917 H1008 Q996 917 990 911 H590 Q584 917 572 917 H368 Q358 917 358 907 V893 Q358 883 368 883 Z'
// phones get a tight vertical crop of the cart's centre (the wheels run off the edges); 'meet' + overflow
// visible lets wider phones simply see more of the scene instead of letterboxing
const crop = computed(() => (narrow.value ? HERO.narrow : HERO.wide))
const viewBox = computed(() => {
  if (props.bake) { const c = crop.value; return `${c.x} ${c.y} ${c.w} ${c.h}` }
  return narrow.value ? '495 0 610 1100' : '0 0 1600 1100'
})
const par = 'xMidYMid meet'
const BULB = 'M-7 14 C-20 26 -18 50 0 52 C18 50 20 26 7 14Z'
const FIL = 'M-4 18 L-6 34 Q-3 28 0 36 Q3 28 6 34 L4 18'
</script>

<template>
  <div ref="wrap" class="cart" :class="{ 'is-lit': lit, powering }" @pointermove="onMove" @pointerleave="onLeave">
    <svg class="layer base" :viewBox="viewBox" :preserveAspectRatio="par" role="img"
         aria-label="The Fusk-it cart at night: a wooden cart with spoked wagon wheels, stained-glass panels, hanging bulbs, a window covered in sticky notes and a neon sign reading #Lets Fusk it">
      <defs>
        <filter id="blur-xl" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="28" /></filter>
        <filter id="blur-lg" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14" /></filter>
        <filter id="blur-md" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" /></filter>
        <filter id="blur-sm" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2" /></filter>
        <filter id="blur-xs" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation=".7" /></filter>
        <!-- wood: long streaks + fine speckle multiplied over the base colour -->
        <filter v-for="w in [['woodH', '0.0025 0.11'], ['woodV', '0.11 0.0025']]" :id="w[0]" :key="w[0]"
                x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
          <feTurbulence type="fractalNoise" :baseFrequency="w[1]" numOctaves="3" seed="4" result="n" />
          <feColorMatrix in="n" values="0 0 0 0 .22  0 0 0 0 .11  0 0 0 0 .04  1.6 0 0 0 -.62" result="streak" />
          <feComposite in="streak" in2="SourceGraphic" operator="in" result="s2" />
          <feTurbulence type="fractalNoise" baseFrequency=".7" numOctaves="1" seed="2" result="f" />
          <feColorMatrix in="f" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .22 0" result="sp" />
          <feComposite in="sp" in2="SourceGraphic" operator="in" result="sp2" />
          <feMerge><feMergeNode in="SourceGraphic" /><feMergeNode in="s2" /><feMergeNode in="sp2" /></feMerge>
        </filter>
        <!-- grass / astroturf -->
        <filter id="turfTex" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency=".9 .32" numOctaves="2" seed="11" />
          <feColorMatrix values=".34 0 0 0 .02  .78 0 0 0 .08  .2 0 0 0 .02  0 0 0 0 1" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
        <!-- concrete -->
        <filter id="concrete" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency=".55" numOctaves="3" seed="8" result="n" />
          <feColorMatrix in="n" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .5 -.12" result="d" />
          <feComposite in="d" in2="SourceGraphic" operator="in" result="d2" />
          <feMerge><feMergeNode in="SourceGraphic" /><feMergeNode in="d2" /></feMerge>
        </filter>
        <filter id="chalkTex" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" seed="5" result="n" />
          <feColorMatrix in="n" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .18 -.06" result="d" />
          <feComposite in="d" in2="SourceGraphic" operator="in" result="d2" />
          <feMerge><feMergeNode in="SourceGraphic" /><feMergeNode in="d2" /></feMerge>
        </filter>
        <filter id="chalk" x="-5%" y="-20%" width="110%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="1" seed="3" result="t" />
          <feDisplacementMap in="SourceGraphic" in2="t" scale="1.8" result="d" />
          <feComposite in="d" in2="t" operator="arithmetic" k1="0" k2="1" k3="-.25" k4="0" />
        </filter>
        <filter id="fur" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="6" result="t" />
          <feDisplacementMap in="SourceGraphic" in2="t" scale="3.2" />
        </filter>
        <filter id="noteShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="1.2" dy="2.4" stdDeviation="1.4" flood-color="#000" flood-opacity=".45" />
        </filter>

        <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#E9DDC6" /><stop offset=".55" stop-color="#C9B08A" /><stop offset="1" stop-color="#8E7352" />
        </linearGradient>
        <radialGradient id="pool"><stop offset="0" stop-color="#FFC66B" stop-opacity=".28" /><stop offset="1" stop-color="#FFC66B" stop-opacity="0" /></radialGradient>
        <linearGradient id="bevelH" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#FFE2B0" stop-opacity=".45" /><stop offset=".18" stop-color="#FFE2B0" stop-opacity="0" />
          <stop offset=".75" stop-color="#000" stop-opacity="0" /><stop offset="1" stop-color="#000" stop-opacity=".45" />
        </linearGradient>
        <linearGradient id="bevelV" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#FFE2B0" stop-opacity=".35" /><stop offset=".25" stop-color="#FFE2B0" stop-opacity="0" />
          <stop offset=".7" stop-color="#000" stop-opacity="0" /><stop offset="1" stop-color="#000" stop-opacity=".5" />
        </linearGradient>
        <linearGradient id="bodyLight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#000" stop-opacity=".05" /><stop offset="1" stop-color="#000" stop-opacity=".55" />
        </linearGradient>
        <linearGradient id="ledSpillDown" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#FFB547" stop-opacity=".28" /><stop offset="1" stop-color="#FFB547" stop-opacity="0" />
        </linearGradient>
        <linearGradient id="ledSpillL" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stop-color="#FFB547" stop-opacity=".5" /><stop offset="1" stop-color="#FFB547" stop-opacity="0" />
        </linearGradient>
        <linearGradient id="ledSpillR" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#FFB547" stop-opacity=".5" /><stop offset="1" stop-color="#FFB547" stop-opacity="0" />
        </linearGradient>
        <linearGradient id="slat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#6A6C70" /><stop offset=".35" stop-color="#4A4C50" /><stop offset=".85" stop-color="#2A2B2E" /><stop offset="1" stop-color="#0E0E10" />
        </linearGradient>
        <pattern id="shutterSlats" width="40" height="22" patternUnits="userSpaceOnUse">
          <rect width="40" height="22" fill="url(#slat)" /><rect y="3" width="40" height="1.2" fill="#9A9CA0" opacity=".5" />
        </pattern>
        <linearGradient id="shutterFall" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#FFB547" stop-opacity=".28" /><stop offset=".35" stop-color="#000" stop-opacity=".15" /><stop offset="1" stop-color="#000" stop-opacity=".75" />
        </linearGradient>
        <linearGradient id="noteSheen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#fff" stop-opacity=".35" /><stop offset=".5" stop-color="#fff" stop-opacity="0" /><stop offset="1" stop-color="#5a3a10" stop-opacity=".2" />
        </linearGradient>
        <radialGradient v-for="g in glassGrads" :id="g.id" :key="g.id" cx=".45" cy=".42" r=".7">
          <stop offset="0" :stop-color="g.hi" /><stop offset=".5" :stop-color="g.mid" /><stop offset="1" :stop-color="g.lo" />
        </radialGradient>
        <radialGradient id="plush" cx=".35" cy=".3" r=".85">
          <stop offset="0" stop-color="#fff" stop-opacity=".28" /><stop offset=".45" stop-color="#fff" stop-opacity="0" />
          <stop offset=".8" stop-color="#000" stop-opacity=".18" /><stop offset="1" stop-color="#000" stop-opacity=".45" />
        </radialGradient>
        <radialGradient id="lobeShade" cx=".38" cy=".32" r=".75">
          <stop offset="0" stop-color="#fff" stop-opacity=".55" /><stop offset=".55" stop-color="#fff" stop-opacity="0" /><stop offset="1" stop-color="#A86A2A" stop-opacity=".45" />
        </radialGradient>
        <linearGradient id="pileShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A1A0E" stop-opacity="0" /><stop offset="1" stop-color="#3A1A0E" stop-opacity=".45" /></linearGradient>
        <linearGradient id="cabinetLight" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFC774" stop-opacity=".55" /><stop offset="1" stop-color="#FFC774" stop-opacity="0" /></linearGradient>
        <radialGradient id="kernel" cx=".4" cy=".35" r=".7">
          <stop offset="0" stop-color="#FFFBEF" /><stop offset=".6" stop-color="#F6E3B4" /><stop offset="1" stop-color="#C9954D" />
        </radialGradient>
        <linearGradient id="redMetal" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#7E140C" /><stop offset=".3" stop-color="#E0402C" /><stop offset=".45" stop-color="#FF8A70" />
          <stop offset=".6" stop-color="#D33522" /><stop offset="1" stop-color="#6E110A" />
        </linearGradient>
        <linearGradient id="glassReflect" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#fff" stop-opacity="0" /><stop offset=".45" stop-color="#fff" stop-opacity=".16" />
          <stop offset=".55" stop-color="#fff" stop-opacity=".02" /><stop offset="1" stop-color="#fff" stop-opacity="0" />
        </linearGradient>
        <linearGradient id="steel" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#5b5d61" /><stop offset=".4" stop-color="#d9dbe0" /><stop offset="1" stop-color="#47494d" />
        </linearGradient>
        <linearGradient id="screen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#14304D" /><stop offset="1" stop-color="#071422" />
        </linearGradient>
        <linearGradient id="glare" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#fff" stop-opacity=".14" /><stop offset=".5" stop-color="#fff" stop-opacity="0" />
        </linearGradient>
        <linearGradient id="bezel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#2a2a2c" /><stop offset="1" stop-color="#050505" />
        </linearGradient>
        <!-- wheel shading (fixed light) -->
        <linearGradient id="rimShade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#FFD9A0" stop-opacity=".35" /><stop offset=".45" stop-color="#000" stop-opacity="0" /><stop offset="1" stop-color="#000" stop-opacity=".55" />
        </linearGradient>
        <radialGradient id="hubShade" cx=".35" cy=".3" r=".8">
          <stop offset="0" stop-color="#FFD9A0" stop-opacity=".3" /><stop offset=".6" stop-color="#000" stop-opacity="0" /><stop offset="1" stop-color="#000" stop-opacity=".5" />
        </radialGradient>
        <radialGradient id="hubCap" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#d8c6a8" /><stop offset="1" stop-color="#3b2a18" /></radialGradient>
        <linearGradient id="spokeShade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#000" stop-opacity=".35" /><stop offset=".4" stop-color="#FFD9A0" stop-opacity=".25" /><stop offset="1" stop-color="#000" stop-opacity=".45" />
        </linearGradient>
        <linearGradient id="turfLight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#000" stop-opacity="0" /><stop offset="1" stop-color="#000" stop-opacity=".6" />
        </linearGradient>
        <radialGradient id="turfGlow" cx=".5" cy="0" r=".7">
          <stop offset="0" stop-color="#FFB547" stop-opacity=".22" /><stop offset="1" stop-color="#FFB547" stop-opacity="0" />
        </radialGradient>
        <pattern id="check" width="16" height="16" patternUnits="userSpaceOnUse">
          <rect width="16" height="16" fill="#5E6B78" /><rect width="8" height="16" fill="#3A434D" opacity=".7" />
          <rect width="16" height="8" fill="#2B323A" opacity=".55" /><rect x="3" width="1.2" height="16" fill="#C9D0D6" opacity=".45" />
          <rect y="11" width="16" height="1.2" fill="#C9D0D6" opacity=".35" />
        </pattern>
        <linearGradient id="clothFold" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#000" stop-opacity=".35" /><stop offset=".25" stop-color="#fff" stop-opacity=".08" />
          <stop offset=".45" stop-color="#000" stop-opacity=".25" /><stop offset=".7" stop-color="#fff" stop-opacity=".1" /><stop offset="1" stop-color="#000" stop-opacity=".4" />
        </linearGradient>
        <clipPath id="winClip"><rect :x="WIN.x" :y="WIN.y" :width="WIN.w" :height="WIN.h" /></clipPath>
        <!-- light coming through the glass: brightest in the middle of each pane -->
        <radialGradient id="nightIn" cx=".5" cy=".62" r=".72"><stop offset="0" stop-color="#000" stop-opacity="0" /><stop offset=".55" stop-color="#000" stop-opacity=".28" /><stop offset="1" stop-color="#000" stop-opacity=".72" /></radialGradient>
        <linearGradient id="nightTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".55" /><stop offset="1" stop-color="#000" stop-opacity="0" /></linearGradient>
        <linearGradient id="nightLow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0" /><stop offset=".35" stop-color="#000" stop-opacity=".25" /><stop offset="1" stop-color="#000" stop-opacity=".6" /></linearGradient>
        <radialGradient id="paneGlow" cx=".5" cy=".45" r=".7"><stop offset="0" stop-color="#FFE7B0" stop-opacity=".9" /><stop offset=".6" stop-color="#FFC06A" stop-opacity=".25" /><stop offset="1" stop-color="#FFC06A" stop-opacity="0" /></radialGradient>
        <clipPath v-for="p in panes" :id="p.id" :key="p.id"><rect :x="p.x" :y="p.y" :width="p.w" :height="p.h" /></clipPath>
      </defs>

      <template v-if="!bake">
        <!-- the static scene is the baked .poster image in index.html (npm run bake), sitting right behind this SVG -->
      </template>
      <template v-if="bake">
      <!-- ===== street, pillars, shutter ===== -->
      <rect x="-600" y="-500" width="2800" height="2200" fill="#0B0A09" />
      <rect x="-300" y="-300" width="2200" height="510" fill="#141110" filter="url(#concrete)" />
      <g aria-hidden="true">
        <rect x="1430" y="-300" width="600" height="1370" fill="url(#shutterSlats)" />
        <rect x="1430" y="0" width="6" height="1070" fill="#000" opacity=".6" />
        <!-- the neighbouring shop on the left is shut too -->
        <rect x="-600" y="-300" width="700" height="1370" fill="url(#shutterSlats)" />
        <rect x="94" y="0" width="6" height="1070" fill="#000" opacity=".6" />
      </g>
      <rect x="100" y="0" width="80" height="1070" fill="#2A2520" filter="url(#concrete)" />
      <rect x="1390" y="0" width="42" height="1070" fill="#2A2520" filter="url(#concrete)" />
      <!-- rolling-shutter housing across the top -->
      <rect x="-600" y="-500" width="2800" height="686" fill="#2B2C2F" filter="url(#concrete)" />
      <g opacity=".55"><rect v-for="i in 9" :key="'hs' + i" x="-600" :y="186 - i * 20" width="2800" height="2" fill="#0E0E10" /></g>
      <rect x="-600" y="176" width="2800" height="10" fill="#000" opacity=".5" />
      <g class="glow"><ellipse cx="820" cy="110" rx="420" ry="110" fill="#E8432A" opacity=".08" filter="url(#blur-xl)" /></g>


      </template>
      <template v-if="!bake">
      <!-- ===== marquee logo ===== -->
      <svg :x="narrow ? 520 : 500" :y="narrow ? 50 : 34" :width="narrow ? 560 : 640" :height="narrow ? 124 : 141" viewBox="0 0 680 150" overflow="visible">
        <MarqueeLogo :lit="lit" />
      </svg>

      </template>
      <template v-if="bake">
      <!-- ===== interior behind the window ===== -->
      <g clip-path="url(#winClip)">
        <rect :x="WIN.x" :y="WIN.y" :width="WIN.w" :height="WIN.h" fill="url(#wall)" />
        <!-- night: the room behind the window falls off into darkness at the corners and the ceiling
             (light sources - glass, TV, signs, neon, bulbs - are all drawn on top of this, so they stay bright) -->
        <rect :x="WIN.x" :y="WIN.y" :width="WIN.w" :height="WIN.h" fill="url(#nightIn)" />
        <rect :x="WIN.x" :y="WIN.y" :width="WIN.w" height="160" fill="url(#nightTop)" />
        <!-- back cabinets, poster lightboxes, jars -->
        <g aria-hidden="true">
          <rect x="640" y="440" width="320" height="120" fill="#C79B66" filter="url(#woodH)" />
          <rect x="640" y="440" width="320" height="120" fill="url(#bevelH)" />
          <g stroke="#7A5530" stroke-width="2" fill="none"><rect x="648" y="448" width="96" height="104" /><rect x="752" y="448" width="96" height="104" /><rect x="856" y="448" width="96" height="104" /></g>
          <!-- framed photo on the back wall -->
          <rect x="558" y="452" width="66" height="84" rx="2" fill="#2A1A0E" /><rect x="560" y="454" width="62" height="80" fill="#C08546" filter="url(#woodV)" />
          <rect x="565" y="459" width="52" height="70" fill="#F4EEE2" />
          <image :href="framePhoto" x="568" y="462" width="46" height="56" preserveAspectRatio="xMidYMid slice" />
          <rect x="565" y="459" width="52" height="70" fill="none" stroke="#000" stroke-opacity=".25" />
          <rect x="1000" y="452" width="58" height="80" rx="2" fill="#2A1E14" /><rect x="1005" y="457" width="48" height="70" fill="#E8D7B5" />
          <circle cx="1029" cy="482" r="14" fill="#C9954D" /><circle cx="1029" cy="482" r="9" fill="#F6E3B4" />
          <g v-for="i in 7" :key="'jar' + i">
            <rect :x="660 + i * 38" y="420" width="22" height="22" rx="3" fill="#E8DCC8" opacity=".55" />
            <rect :x="660 + i * 38" y="416" width="22" height="6" rx="2" :fill="['#C8301C','#2F5BD8','#F7C531','#13A89A'][i % 4]" />
          </g>
        </g>
        <!-- warm light pools from the bulbs -->
        <g class="glow" aria-hidden="true">
          <ellipse v-for="(b, i) in bulbs" :key="'pool' + i" :cx="b.x" :cy="WIN.y + b.len + 60" rx="190" ry="170" fill="url(#pool)" />
          <ellipse cx="800" cy="410" rx="220" ry="90" fill="#9FC8FF" opacity=".12" filter="url(#blur-lg)" />
        </g>
      </g>

      <!-- ===== sticky notes ===== -->
      <g aria-hidden="true" filter="url(#noteShadow)">
        <g v-for="(n, i) in notes" :key="i" :transform="`rotate(${n.rot} ${n.x + n.s / 2} ${n.y + n.s / 2})`">
          <rect :x="n.x" :y="n.y" :width="n.s" :height="n.s" :fill="n.fill" />
          <rect :x="n.x" :y="n.y" :width="n.s" :height="n.s" fill="url(#noteSheen)" />
          <g v-if="n.ink" stroke="#5B6FA8" stroke-width=".9" opacity=".55">
            <line :x1="n.x + 4" :y1="n.y + n.s * .35" :x2="n.x + n.s - 6" :y2="n.y + n.s * .35" />
            <line :x1="n.x + 4" :y1="n.y + n.s * .58" :x2="n.x + n.s * .7" :y2="n.y + n.s * .58" />
          </g>
          <path v-if="n.curl" :d="`M${n.x + n.s - 7} ${n.y + n.s} L${n.x + n.s} ${n.y + n.s - 7} L${n.x + n.s - 5} ${n.y + n.s - 5}Z`" fill="#000" opacity=".18" />
        </g>
      </g>

      <!-- ===== lattice: cast shadow, then wood ===== -->
      <g aria-hidden="true">
        <!-- stained-glass transom row -->
        <g v-for="p in transom" :key="p.id" class="glass">
          <clipPath :id="p.id"><rect :x="p.x" :y="p.y" :width="p.w" :height="p.h" /></clipPath>
          <g :clip-path="`url(#${p.id})`">
            <rect :x="p.x" :y="p.y" :width="p.w" :height="p.h" fill="#0D0907" />
            <path v-for="(st, k) in p.stones" :key="k" :d="st.d" :fill="`url(#gl${st.g})`" stroke="#0D0907" stroke-width="3.6" stroke-linejoin="miter" />
            <rect :x="p.x" :y="p.y" :width="p.w" :height="p.h" fill="url(#paneGlow)" class="glass-light" />
          </g>
        </g>
        <g fill="#000" opacity=".5" filter="url(#blur-sm)" transform="translate(4 6)" clip-path="url(#winClip)">
          <rect v-for="(m, i) in [...lattice.v, ...lattice.h]" :key="'s' + i" :x="m.x" :y="m.y" :width="m.w" :height="m.h" />
        </g>
        <g filter="url(#woodV)">
          <rect v-for="(m, i) in lattice.v" :key="'v' + i" :x="m.x" :y="m.y" :width="m.w" :height="m.h" fill="#B97C3E" />
        </g>
        <rect v-for="(m, i) in lattice.v" :key="'bv' + i" :x="m.x" :y="m.y" :width="m.w" :height="m.h" fill="url(#bevelV)" />
        <g filter="url(#woodH)">
          <rect v-for="(m, i) in lattice.h" :key="'h' + i" :x="m.x" :y="m.y" :width="m.w" :height="m.h" fill="#BE8242" />
        </g>
        <rect v-for="(m, i) in lattice.h" :key="'bh' + i" :x="m.x" :y="m.y" :width="m.w" :height="m.h" fill="url(#bevelH)" />
        <!-- outer frame -->
        <g filter="url(#woodV)">
          <rect :x="WIN.x - 18" :y="WIN.y - 20" width="22" :height="WIN.h + 20" fill="#C08546" />
          <rect :x="WIN.x + WIN.w - 4" :y="WIN.y - 20" width="22" :height="WIN.h + 20" fill="#C08546" />
        </g>
        <rect :x="WIN.x - 18" :y="WIN.y - 20" width="22" :height="WIN.h + 20" fill="url(#bevelV)" />
        <rect :x="WIN.x + WIN.w - 4" :y="WIN.y - 20" width="22" :height="WIN.h + 20" fill="url(#bevelV)" />
        <rect :x="WIN.x - 18" :y="WIN.y - 24" :width="WIN.w + 36" height="24" fill="#C08546" filter="url(#woodH)" />
        <rect :x="WIN.x - 18" :y="WIN.y - 24" :width="WIN.w + 36" height="24" fill="url(#bevelH)" />
      </g>

      <!-- ===== TV menu board ===== -->
      <g aria-hidden="true">
        <rect x="642" y="221" width="320" height="170" rx="6" fill="#000" opacity=".5" filter="url(#blur-md)" />
        <rect x="640" y="215" width="320" height="170" rx="6" fill="url(#bezel)" />
        <rect x="648" y="223" width="304" height="154" rx="2" fill="url(#screen)" />
        <g class="tv-content">
          <text x="800" y="248" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="20" fill="#FFD58A">Fusk-it</text>
          <g font-family="Fredoka" font-weight="600" font-size="13">
            <rect x="666" y="262" width="122" height="22" rx="11" fill="#F57C21" /><text x="727" y="277" text-anchor="middle" fill="#fff">Fusk Popcorn</text>
            <rect x="812" y="262" width="122" height="22" rx="11" fill="#F57C21" /><text x="873" y="277" text-anchor="middle" fill="#fff">Hot Drinks</text>
            <rect x="666" y="300" width="122" height="22" rx="11" fill="#F57C21" /><text x="727" y="315" text-anchor="middle" fill="#fff">Soft-serve</text>
            <rect x="812" y="300" width="122" height="22" rx="11" fill="#F57C21" /><text x="873" y="315" text-anchor="middle" fill="#fff">Paal Punch</text>
          </g>
          <g font-family="Fredoka" font-weight="600" font-size="13">
            <rect x="666" y="338" width="122" height="22" rx="11" fill="#F57C21" /><text x="727" y="353" text-anchor="middle" fill="#fff">Malaysian Milo</text>
            <rect x="812" y="338" width="122" height="22" rx="11" fill="#F57C21" /><text x="873" y="353" text-anchor="middle" fill="#fff">Gulab Jamun Bun</text>
          </g>
        </g>
        <polygon points="648,223 790,223 700,377 648,377" fill="url(#glare)" />
      </g>

      <!-- ===== chalkboards ===== -->
      <g aria-hidden="true">
        <g v-for="cb in [[400, 335, 210, 62], [990, 335, 200, 62], [745, 395, 110, 50]]" :key="cb[0]">
          <rect :x="cb[0] + 3" :y="cb[1] + 5" :width="cb[2]" :height="cb[3]" fill="#000" opacity=".45" filter="url(#blur-sm)" />
          <rect :x="cb[0] - 4" :y="cb[1] - 4" :width="cb[2] + 8" :height="cb[3] + 8" rx="2" fill="#6E4220" filter="url(#woodH)" />
          <rect :x="cb[0]" :y="cb[1]" :width="cb[2]" :height="cb[3]" fill="#1C1F1D" filter="url(#chalkTex)" />
        </g>
        <g filter="url(#chalk)" fill="#FFFDF6">
          <text x="505" y="360" text-anchor="middle" font-family="Caveat" font-weight="600" font-size="18">If You can't buy Food</text>
          <text x="505" y="384" text-anchor="middle" font-family="Caveat" font-weight="600" font-size="18">It's For FREE</text>
          <text x="1090" y="353" text-anchor="middle" font-family="Noto Sans Tamil" font-weight="500" font-size="11">உணவு வாங்க</text>
          <text x="1090" y="370" text-anchor="middle" font-family="Noto Sans Tamil" font-weight="500" font-size="11">முடியவில்லையா?</text>
          <text x="1090" y="388" text-anchor="middle" font-family="Noto Sans Tamil" font-weight="700" font-size="12">இலவசம்!</text>
          <text x="800" y="415" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="14">EAT</text>
          <text x="800" y="434" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="11">DESSERT FIRST</text>
        </g>
      </g>

      <!-- ===== popcorn machine ===== -->
      <g aria-hidden="true">
        <ellipse cx="320" cy="702" rx="118" ry="9" fill="#000" opacity=".6" filter="url(#blur-sm)" />
        <!-- dome + sign -->
        <path d="M220 500 Q222 462 320 452 Q418 462 420 500 Z" fill="url(#redMetal)" />
        <path d="M250 478 Q320 458 392 478" fill="none" stroke="#fff" stroke-width="3" opacity=".35" stroke-linecap="round" />
        <rect x="216" y="498" width="208" height="12" fill="#8E1A12" />
        <rect x="246" y="512" width="148" height="26" rx="3" fill="#F3ECE2" />
        <rect x="246" y="512" width="148" height="26" rx="3" fill="url(#bevelH)" />
        <text x="320" y="531" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="17" fill="#C3271B">Fusk-it</text>
        <!-- glass cabinet interior -->
        <rect x="234" y="540" width="172" height="152" fill="#3A1A0E" />
        <rect x="234" y="540" width="172" height="152" fill="url(#cabinetLight)" />
        <g class="glow"><ellipse cx="320" cy="556" rx="80" ry="30" fill="#FFD28A" opacity=".6" filter="url(#blur-lg)" /></g>
        <!-- kettle -->
        <rect x="318" y="540" width="4" height="12" fill="#9a9a9a" />
        <path d="M290 552 H350 L344 578 Q320 586 296 578 Z" fill="url(#steel)" />
        <path d="M290 552 H350" stroke="#fff" stroke-width="1.5" opacity=".6" />
        <!-- popcorn -->
        <g v-for="(k, i) in popcorn" :key="'k' + i" :transform="`translate(${k.x} ${k.y})`">
          <circle v-for="(l, j) in k.lobes" :key="j" :cx="l[0]" :cy="l[1]" :r="l[2]" :fill="k.c" />
          <circle v-for="(l, j) in k.lobes" :key="'s' + j" :cx="l[0]" :cy="l[1]" :r="l[2]" fill="url(#lobeShade)" />
          <ellipse v-if="k.hull" :cx="Math.cos(k.ha) * 2.5" :cy="Math.sin(k.ha) * 2.5" rx="1.6" ry="1.1" fill="#8A4E1E" />
        </g>
        <rect x="234" y="660" width="172" height="32" fill="url(#pileShade)" />
        <!-- glass reflections + red posts -->
        <rect x="234" y="540" width="172" height="152" fill="url(#glassReflect)" />
        <polygon points="250,540 268,540 238,692 234,692 234,600" fill="#fff" opacity=".07" />
        <g fill="url(#redMetal)"><rect x="222" y="508" width="13" height="194" /><rect x="405" y="508" width="13" height="194" /></g>
        <rect x="222" y="688" width="196" height="12" fill="#A3211A" />
        <rect x="222" y="688" width="196" height="12" fill="url(#bevelH)" />
      </g>

      <!-- ===== grass-wall counter + neon ===== -->
      <rect x="520" y="552" width="540" height="146" fill="#fff" filter="url(#turfTex)" />
      <rect x="520" y="552" width="540" height="146" fill="#000" opacity=".25" />
      <rect x="520" y="552" width="540" height="146" fill="none" stroke="#2C1A0C" stroke-width="5" />
      <g aria-hidden="true" stroke="#5E9E3E" stroke-width="2" stroke-linecap="round">
        <line v-for="(g, i) in grassEdge" :key="i" :x1="g.x" :y1="g.y" :x2="g.x" :y2="g.y - g.h" :transform="`rotate(${g.a} ${g.x} ${g.y})`" />
      </g>
      <g aria-hidden="true">
        <!-- the cart's red collection box, sitting on the grass counter -->
        <ellipse cx="575" cy="692" rx="46" ry="6" fill="#000" opacity=".55" filter="url(#blur-sm)" />
        <path d="M538 620 L552 604 H618 L604 620Z" fill="#E8573F" />
        <path d="M604 620 L618 604 V672 L604 688Z" fill="#8E1A12" />
        <rect x="538" y="620" width="66" height="68" fill="#C8301C" />
        <path d="M562 614 L568 608 H594 L588 614Z" fill="#2a0a06" />
        <rect x="546" y="636" width="50" height="30" rx="2" fill="#F3ECE2" />
        <text x="571" y="649" text-anchor="middle" font-family="Caveat" font-weight="700" font-size="11" fill="#C3271B">Pay it</text>
        <text x="571" y="661" text-anchor="middle" font-family="Caveat" font-weight="700" font-size="11" fill="#C3271B">forward</text>
      </g>
      </template>
      <template v-if="!bake">
      <g class="neon" aria-hidden="true" font-family="Yellowtail" font-size="56" text-anchor="middle">
        <g class="glow">
          <ellipse cx="840" cy="628" rx="230" ry="66" fill="#FFC27A" opacity=".14" filter="url(#blur-xl)" />
          <text x="845" y="652" fill="#000" opacity=".45" filter="url(#blur-sm)">#Lets Fusk it</text>
          <text x="840" y="645" fill="#FF9F3A" opacity=".3" filter="url(#blur-lg)">#Lets Fusk it</text>
          <text x="840" y="645" fill="#FFD9A0" opacity=".9" filter="url(#blur-sm)">#Lets Fusk it</text>
        </g>
        <text x="840" y="645" class="neon-core" filter="url(#blur-xs)">#Lets Fusk it</text>
      </g>

      </template>
      <template v-if="bake">
      <!-- ===== lower cart body ===== -->
      <rect x="200" y="722" width="1180" height="250" fill="#A9682F" filter="url(#woodH)" />
      <rect x="200" y="722" width="1180" height="250" fill="url(#bodyLight)" />
      <rect x="200" y="722" width="1180" height="40" fill="#000" opacity=".35" filter="url(#blur-md)" />
      <rect x="192" y="698" width="1196" height="26" fill="#C1813F" filter="url(#woodH)" />
      <rect x="192" y="698" width="1196" height="26" fill="url(#bevelH)" />
      <!-- LED strip under the ledge -->
      <g aria-hidden="true">
        <rect x="200" y="722" width="1180" height="4" class="led-core" />
        <g class="glow">
          <rect x="200" y="726" width="1180" height="110" fill="url(#ledSpillDown)" />
          <rect x="200" y="716" width="1180" height="14" fill="#FFC56A" opacity=".6" filter="url(#blur-md)" />
          <rect x="200" y="710" width="1180" height="50" fill="#FFA93A" opacity=".15" filter="url(#blur-lg)" />
        </g>
      </g>

      <!-- stained glass panes -->
      <g v-for="p in panes" :key="p.id" class="glass">
        <rect :x="p.x - 9" :y="p.y - 9" :width="p.w + 18" :height="p.h + 18" fill="#B57638" filter="url(#woodV)" />
        <rect :x="p.x - 9" :y="p.y - 9" :width="p.w + 18" :height="p.h + 18" fill="url(#bevelH)" />
        <g :clip-path="`url(#${p.id})`">
          <rect :x="p.x" :y="p.y" :width="p.w" :height="p.h" fill="#120C08" />
          <path v-for="(st, k) in p.stones" :key="k" :d="st.d" :fill="`url(#gl${st.g})`" stroke="#0D0907" stroke-width="4" stroke-linejoin="miter" />
          <rect :x="p.x" :y="p.y" :width="p.w" :height="p.h" fill="#000" class="glass-dim" />
          <rect :x="p.x" :y="p.y" :width="p.w" :height="p.h" fill="url(#paneGlow)" class="glass-light" />
        </g>
        <rect :x="p.x" :y="p.y" :width="p.w" :height="6" fill="#000" opacity=".35" />
      </g>

      <rect x="200" y="722" width="1180" height="250" fill="url(#nightLow)" />
      <!-- toy shelf -->
      <rect x="520" y="735" width="545" height="112" fill="#D6AF7C" filter="url(#woodH)" />
      <rect x="520" y="735" width="545" height="112" fill="url(#bodyLight)" opacity=".6" />
      <rect x="520" y="735" width="545" height="16" fill="#000" opacity=".35" filter="url(#blur-sm)" />
      <g aria-hidden="true">
        <g v-for="(t, i) in toys" :key="i" :transform="`translate(${t.x} 838) scale(${t.s || 1})`">
          <ellipse cx="2" cy="0" rx="26" ry="5" fill="#000" opacity=".45" filter="url(#blur-sm)" />
          <g :filter="t.kind === 'car' ? null : 'url(#fur)'">
            <template v-for="(s, k) in TOY[t.kind]" :key="k">
              <ellipse v-if="s[0] === 'e'" :cx="s[1]" :cy="s[2]" :rx="s[3]" :ry="s[4]" :fill="s[5]" />
              <circle v-else-if="s[0] === 'c'" :cx="s[1]" :cy="s[2]" :r="s[3]" :fill="s[4]" />
              <rect v-else :x="s[1]" :y="s[2]" :width="s[3]" :height="s[4]" rx="5" :fill="s[5]" />
            </template>
            <template v-for="(s, k) in TOY[t.kind]" :key="'sh' + k">
              <ellipse v-if="s[0] === 'e' && s[3] > 4" :cx="s[1]" :cy="s[2]" :rx="s[3]" :ry="s[4]" fill="url(#plush)" />
              <circle v-else-if="s[0] === 'c' && s[3] > 4" :cx="s[1]" :cy="s[2]" :r="s[3]" fill="url(#plush)" />
              <rect v-else-if="s[0] === 'r'" :x="s[1]" :y="s[2]" :width="s[3]" :height="s[4]" rx="5" fill="url(#plush)" />
            </template>
          </g>
        </g>
      </g>
      <rect x="518" y="845" width="549" height="8" fill="#7A4A20" />
      <!-- lower panels -->
      <g aria-hidden="true">
        <g v-for="i in 4" :key="i">
          <rect :x="540 + (i - 1) * 128" y="866" width="112" height="92" rx="3" fill="none" stroke="#3E220C" stroke-width="3.5" />
          <rect :x="542 + (i - 1) * 128" y="868.5" width="108" height="87" rx="2" fill="none" stroke="#FFD9A0" stroke-width="1" opacity=".22" />
          <circle :cx="560 + (i - 1) * 128 + (i * 37) % 70" :cy="880 + (i * 23) % 60" r="3" fill="#6E3F18" opacity=".6" />
        </g>
      </g>

      <!-- ===== ground: astroturf + curb ===== -->
      <rect x="-600" y="1068" width="2800" height="500" fill="#3A3632" filter="url(#concrete)" /><rect x="-600" y="1068" width="2800" height="500" fill="url(#turfLight)" />
      <rect x="-300" y="1068" width="2200" height="3" fill="#8A8278" opacity=".35" />
      <rect x="-600" y="978" width="2800" height="92" fill="#fff" filter="url(#turfTex)" />
      <rect x="-600" y="978" width="2800" height="92" fill="url(#turfLight)" />
      <g class="glow"><rect x="40" y="978" width="1520" height="92" fill="url(#turfGlow)" /></g>
      <g aria-hidden="true" stroke-width="2.2" stroke-linecap="round">
        <line v-for="(g, i) in turfEdge" :key="i" :x1="g.x" :y1="g.y" :x2="g.x" :y2="g.y - g.h" :stroke="g.c"
              :transform="`rotate(${g.a} ${g.x} ${g.y})`" />
      </g>
      <rect x="200" y="972" width="1180" height="26" fill="#000" opacity=".55" filter="url(#blur-md)" />
      <ellipse cx="400" cy="1046" rx="150" ry="14" fill="#000" opacity=".6" filter="url(#blur-md)" />
      <ellipse cx="1180" cy="1046" rx="150" ry="14" fill="#000" opacity=".6" filter="url(#blur-md)" />

      </template>
      <template v-if="!bake">
      <!-- ===== axle + wheels ===== -->
      <g transform="translate(400 900)"><Wheel :r="148" /></g>
      <g transform="translate(1180 900)"><Wheel :r="148" /></g>
      <path :d="axleD" fill="#000" opacity=".5" filter="url(#blur-md)" transform="translate(4 10)" />
      <path :d="axleD" fill="#B07038" filter="url(#woodH)" />
      <path :d="axleD" fill="url(#bevelH)" />
      <path :d="axleD" fill="none" stroke="#4A2A10" stroke-width="1.5" opacity=".7" />

      </template>
      <!-- cool blue spill from the TV onto the frame around it -->
      <g v-if="!bake" class="glow tvspill" aria-hidden="true">
        <rect x="610" y="190" width="380" height="230" rx="40" fill="#5AA8FF" opacity=".22" filter="url(#blur-lg)" />
      </g>
      <!-- ===== street standees (wide screens): an A-frame saying what they sell, and a wooden menu board that navigates ===== -->
      <g v-if="standees && !narrow && !bake" class="standees">
        <defs>
          <linearGradient id="sd-wood" x1="0" x2="1"><stop offset="0" stop-color="#6E4220" /><stop offset=".5" stop-color="#A86A32" /><stop offset="1" stop-color="#5E3818" /></linearGradient>
          <linearGradient id="sd-spillR" x1="1" x2="0"><stop offset="0" stop-color="#FFB547" stop-opacity=".2" /><stop offset=".6" stop-color="#FFB547" stop-opacity="0" /></linearGradient>
          <linearGradient id="sd-spillL" x1="0" x2="1"><stop offset="0" stop-color="#FFB547" stop-opacity=".2" /><stop offset=".6" stop-color="#FFB547" stop-opacity="0" /></linearGradient>
        </defs>
        <!-- left: A-frame chalkboard -->
        <g aria-label="Popcorn, soft-serve and Milo, open till 6 AM" role="img">
          <ellipse cx="130" cy="1064" rx="128" ry="12" fill="#000" opacity=".6" filter="url(#blur-sm)" />
          <path d="M74 1062 L92 652 H100 L88 1062Z" fill="#3e2410" />
          <path d="M186 1062 L168 652 H160 L172 1062Z" fill="#3e2410" />
          <path d="M50 1060 L66 640 H194 L210 1060Z" fill="url(#sd-wood)" filter="url(#woodV)" />
          <path d="M64 1042 L78 660 H182 L196 1042Z" fill="#1C1F1D" filter="url(#chalkTex)" />
          <rect x="88" y="630" width="84" height="16" rx="4" fill="#5E3818" />
          <g filter="url(#chalk)" fill="#FFFFFF" font-family="Caveat" font-weight="700" text-anchor="middle">
            <text x="130" y="708" font-size="28" fill="#FFD58A">Fusk-it</text>
            <text x="130" y="762" font-size="26">Popcorn</text>
            <text x="130" y="802" font-size="25" textLength="92" lengthAdjust="spacingAndGlyphs">Soft-serve</text>
            <text x="130" y="842" font-size="26">Milo</text>
            <path d="M96 866 Q130 876 164 864" fill="none" stroke="#F6F2E8" stroke-width="3" stroke-linecap="round" />
            <text x="130" y="906" font-size="24">open till</text>
            <text x="130" y="954" font-size="44" fill="#FFD58A">6 AM</text>
            <text x="130" y="996" font-size="14" font-family="Noto Sans Tamil" font-weight="700" fill="#FFE9C2" textLength="104" lengthAdjust="spacingAndGlyphs" lang="ta">காலை 6 மணி வரை</text>
          </g>
          <path d="M50 1060 L66 640 H194 L210 1060Z" fill="url(#sd-spillR)" class="spill" />
        </g>
        <!-- right: the menu board; every chalked line jumps to that part of the page -->
        <g class="navboard" transform="translate(0 -32)">
          <ellipse cx="1478" cy="1096" rx="124" ry="12" fill="#000" opacity=".6" filter="url(#blur-sm)" />
          <rect x="1408" y="680" width="12" height="416" fill="#4a2c12" /><rect x="1536" y="680" width="12" height="416" fill="#4a2c12" />
          <rect x="1376" y="672" width="204" height="320" rx="6" fill="url(#sd-wood)" filter="url(#woodH)" />
          <rect x="1390" y="686" width="176" height="292" rx="3" fill="#1C1F1D" filter="url(#chalkTex)" />
          <text x="1478" y="720" text-anchor="middle" font-family="Caveat" font-weight="700" font-size="28" fill="#FFD58A" filter="url(#chalk)">This way →</text>
          <a v-for="(sec, i) in SECTIONS.slice(1)" :key="sec.id" :href="`#${sec.id}`" class="navline" @click.prevent="goTo(sec.id)">
            <rect x="1396" :y="734 + i * 38" width="164" height="34" rx="4" class="hit" />
            <text x="1408" :y="758 + i * 38" font-family="Caveat" font-weight="700" font-size="25" fill="#FFFFFF" filter="url(#chalk)">{{ sec.label }}</text>
            <path :d="`M1408 ${763 + i * 38} q60 4 124 -1`" class="uline" fill="none" stroke="#FFD58A" stroke-width="2.5" stroke-linecap="round" />
            <text x="1532" :y="758 + i * 38" class="arrow" font-family="Caveat" font-weight="700" font-size="24" fill="#FFD58A">→</text>
          </a>
          <rect x="1376" y="672" width="204" height="320" rx="6" fill="url(#sd-spillL)" class="spill" pointer-events="none" />
        </g>
      </g>

      <!-- unlit: the whole scene sinks into the night -->
      <rect v-if="!bake" x="-600" y="-500" width="2800" height="2200" fill="#040306" class="dark" pointer-events="none" />
    </svg>

    <!-- ===== light layer: hanging Edison bulbs ===== -->
    <svg v-if="!bake" ref="lightSvg" class="layer lights" :viewBox="viewBox" :preserveAspectRatio="par" aria-hidden="true">
      <defs>
        <radialGradient id="edisonOn" cx=".5" cy=".58" r=".6">
          <stop offset="0" stop-color="#FFF1C9" /><stop offset=".35" stop-color="#FFD98A" />
          <stop offset=".8" stop-color="#F3A945" stop-opacity=".9" /><stop offset="1" stop-color="#B86A1C" stop-opacity=".85" />
        </radialGradient>
        <radialGradient id="edisonOff" cx=".4" cy=".4" r=".7">
          <stop offset="0" stop-color="#5a4a36" stop-opacity=".7" /><stop offset="1" stop-color="#1c1510" stop-opacity=".9" />
        </radialGradient>
        <linearGradient id="socket" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#1a1410" /><stop offset=".45" stop-color="#6b5a44" /><stop offset="1" stop-color="#120e0a" />
        </linearGradient>
        <filter id="bloom-xl" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="30" /></filter>
        <filter id="bloom-md" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="9" /></filter>
        <filter id="bloom-sm" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="2" /></filter>
      </defs>
      <g v-for="(b, i) in bulbs" :key="i" class="edison-bulb" @pointerdown="tapBulb(i)">
        <circle :cx="b.x" :cy="PIVOT" r="5" fill="#151515" />
        <path :d="frames[i].d" fill="none" stroke="#0c0a08" stroke-width="2.2" stroke-linecap="round" />
        <g :transform="`translate(${frames[i].ex} ${frames[i].ey}) rotate(${frames[i].ang})`">
          <rect x="-7" y="0" width="14" height="16" rx="2" fill="url(#socket)" />
          <g fill="none" stroke="#000" stroke-width="1" opacity=".6"><line x1="-7" y1="5" x2="7" y2="5" /><line x1="-7" y1="10" x2="7" y2="10" /></g>
          <g class="glow breathe" :style="{ animationDelay: powering ? `${0.25 + i * 0.32}s` : `${-i * 1.7}s` }">
            <circle cy="60" r="190" fill="#FF9A2A" opacity=".13" filter="url(#bloom-xl)" /><circle cy="32" r="105" fill="#FF9A2A" opacity=".16" filter="url(#bloom-xl)" />
            <circle cy="32" r="48" fill="#FFB24A" opacity=".3" filter="url(#bloom-xl)" />
            <circle cy="32" r="24" fill="#FFCF7A" opacity=".5" filter="url(#bloom-md)" />
          </g>
          <path :d="BULB" class="glass-on" fill="url(#edisonOn)" stroke="#FFE7B0" stroke-opacity=".6" stroke-width="1" />
          <path :d="BULB" class="glass-off" fill="url(#edisonOff)" stroke="#6b5638" stroke-opacity=".6" stroke-width="1" />
          <path :d="FIL" class="fil-glow" fill="none" stroke="#FFFFFF" stroke-width="3" filter="url(#bloom-sm)" />
          <path :d="FIL" class="fil" fill="none" stroke-width="1.3" />
          <ellipse cx="-8" cy="26" rx="2.5" ry="7" fill="#fff" opacity=".35" />
          <circle cy="32" r="30" fill="transparent" class="hit" />
        </g>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.cart { position: relative; width: 100%; height: 100%; touch-action: pan-y; }
.layer { position: absolute; inset: 0; width: 100%; height: 100%; display: block; overflow: visible; }
.lights { pointer-events: none; }
.lights .edison-bulb { pointer-events: auto; cursor: pointer; }

.glow { opacity: 0; transition: opacity .6s; }
/* animated glow: each bulb breathes on its own cycle with a rare filament stutter */
.is-lit .breathe { animation: breathe 6.8s ease-in-out infinite; }
@keyframes breathe { 0%,100% { opacity: 1 } 40% { opacity: .78 } 62% { opacity: .95 } 63% { opacity: .55 } 64% { opacity: .92 } }
.is-lit .led-glow-anim { animation: ledhum 5s ease-in-out infinite; }
@keyframes ledhum { 0%,100% { opacity: 1 } 50% { opacity: .85 } }
.powering .glow, .powering .glass-on, .powering .fil-glow { animation: poweron 1.1s steps(1) both; }
@keyframes poweron { 0% { opacity: 0 } 12% { opacity: .9 } 18% { opacity: .1 } 30% { opacity: 1 } 36% { opacity: .3 } 52% { opacity: 1 } 100% { opacity: 1 } }
.is-lit .glow { opacity: 1; }
.dark { opacity: .8; transition: opacity .6s; }
.is-lit .dark { opacity: 0; }
.led-core { fill: #5d4526; } .is-lit .led-core { fill: #FFF1CC; }
.screen-on { opacity: .2; } .is-lit .screen-on { opacity: .9; }
.tv-content { opacity: .15; } .is-lit .tv-content { opacity: 1; }
.tvspill { mix-blend-mode: screen; }

.glass-on { opacity: 0; } .is-lit .glass-on { opacity: 1; }
.is-lit .glass-off { opacity: 0; }
.fil { stroke: #4a3a28; } .is-lit .fil { stroke: #FFFDF6; }
.fil-glow { opacity: 0; } .is-lit .fil-glow { opacity: .55; }

.neon-core { fill: #4e4a42; } .is-lit .neon-core { fill: #FFFCF4; }
.is-lit .neon { animation: buzz 9s steps(1) infinite; }
@keyframes buzz { 0%, 91%, 93%, 95%, 100% { opacity: 1 } 92% { opacity: .55 } 94% { opacity: .82 } }

.glass-dim { opacity: .35; transition: opacity .35s; } .is-lit .glass-dim { opacity: 0; }
.glass-light { opacity: 0; mix-blend-mode: screen; transition: opacity .35s; }
.is-lit .glass-light { opacity: .55; }
.standees .spill { opacity: .2; transition: opacity .8s; } .is-lit .standees .spill { opacity: 1; }
.navline { cursor: pointer; }
.navline .hit { fill: transparent; transition: fill .15s; }
.navline .uline { stroke-dasharray: 130; stroke-dashoffset: 130; transition: stroke-dashoffset .35s ease; }
.navline .arrow { opacity: 0; transform: translateX(-10px); transition: opacity .2s, transform .25s ease; }
.navline:hover .uline, .navline:focus-visible .uline { stroke-dashoffset: 0; }
.navline:hover .arrow, .navline:focus-visible .arrow { opacity: 1; transform: none; }
.navline:hover .hit, .navline:focus-visible .hit { fill: rgba(255,213,138,.14); }
.navline:focus-visible { outline: none; }
.navline:focus-visible .hit { stroke: #FFB547; stroke-width: 2; }
.glass-hover { opacity: 0; mix-blend-mode: screen; transition: opacity .35s; cursor: crosshair; }
.is-lit .glass-hover:hover { opacity: .38; }
@media (prefers-reduced-motion: reduce) { .is-lit .neon, .is-lit .breathe, .is-lit .led-glow-anim, .powering .glow, .powering .glass-on, .powering .fil-glow { animation: none; } }
</style>
