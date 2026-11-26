<script setup>
// Red marquee letters "Fusk-it", each studded with individually addressable bulbs.
import { computed, ref } from 'vue'

const props = defineProps({
  lit: { type: Boolean, default: true },
  label: { type: String, default: 'Fusk-it' },
})

const SW = 34 // letter stroke width
const SPACING = 19 // bulb spacing along the stroke

// Letter skeletons: line [x1,y1,x2,y2] or arc {c:[cx,cy], r, a0, a1} (degrees, SVG y-down)
const L = (x1, y1, x2, y2, n) => ({ t: 'l', p: [x1, y1, x2, y2], n })
const A = (cx, cy, r, a0, a1, n) => ({ t: 'a', c: [cx, cy], r, a0, a1, n })
// Bulb counts match the real sign: F 6-stem/5-top/3-mid, dash 4, i-dot 5, etc.
const glyphs = [
  { w: 64, segs: [L(0, 22, 0, 122, 6), L(0, 22, 64, 22, 4), L(0, 70, 48, 70, 3)] },
  // lowercase u: two stems joined by a round bowl, the right stem running down to the baseline
  { w: 56, segs: [L(0, 58, 0, 94, 2), A(28, 94, 28, 180, 0, 4), L(56, 58, 56, 122, 4)] },
  // lowercase s: two stacked round bowls that meet in the middle, open on opposite sides
  { w: 50, segs: [A(25, 73, 17, -35, -270, 5), A(25, 105, 17, -90, 145, 5)] },
  { w: 52, segs: [L(0, 16, 0, 122, 7), L(48, 56, 6, 92, 3), L(20, 84, 52, 122, 3)] },
  { w: 40, segs: [L(0, 90, 40, 90, 3)], dash: true },
  { w: 0, segs: [L(0, 64, 0, 122, 4)], dot: [0, 26] },
  { w: 34, segs: [L(0, 22, 0, 104, 5), A(16, 104, 16, 180, 60, 2), L(-18, 60, 30, 60, 3)] },
]
const GAP = 50

const rad = (d) => (d * Math.PI) / 180
function segPath(s, ox) {
  if (s.t === 'l') return `M${s.p[0] + ox} ${s.p[1]}L${s.p[2] + ox} ${s.p[3]}`
  const [cx, cy] = s.c
  const p0 = [cx + ox + s.r * Math.cos(rad(s.a0)), cy + s.r * Math.sin(rad(s.a0))]
  const p1 = [cx + ox + s.r * Math.cos(rad(s.a1)), cy + s.r * Math.sin(rad(s.a1))]
  const large = Math.abs(s.a1 - s.a0) > 180 ? 1 : 0
  const sweep = s.a1 > s.a0 ? 1 : 0
  return `M${p0[0]} ${p0[1]}A${s.r} ${s.r} 0 ${large} ${sweep} ${p1[0]} ${p1[1]}`
}
function segPoints(s, ox) {
  const pts = []
  if (s.t === 'l') {
    const [x1, y1, x2, y2] = s.p
    const len = Math.hypot(x2 - x1, y2 - y1)
    const n = s.n || Math.max(1, Math.round(len / SPACING))
    for (let i = 0; i <= n; i++) pts.push([x1 + ox + ((x2 - x1) * i) / n, y1 + ((y2 - y1) * i) / n])
  } else {
    const len = (Math.abs(s.a1 - s.a0) * Math.PI * s.r) / 180
    const n = s.n || Math.max(1, Math.round(len / SPACING))
    for (let i = 0; i <= n; i++) {
      const a = rad(s.a0 + ((s.a1 - s.a0) * i) / n)
      pts.push([s.c[0] + ox + s.r * Math.cos(a), s.c[1] + s.r * Math.sin(a)])
    }
  }
  return pts
}

const layout = computed(() => {
  let ox = SW / 2 + 16
  const letters = []
  const bulbs = []
  glyphs.forEach((g, li) => {
    if (g.segs.some((s) => s.t === 'l' && s.p[0] < 0)) ox += 14
    const d = g.segs.map((s) => segPath(s, ox)).join('')
    const pts = []
    g.segs.forEach((s) => segPoints(s, ox).forEach((p) => {
      if (!pts.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < SPACING * 0.6)) pts.push(p)
    }))
    if (g.dot) [[0, 0], [-11, 0], [11, 0], [0, -11], [0, 11]].forEach(([dx, dy]) => pts.push([g.dot[0] + ox + dx, g.dot[1] + dy]))
    pts.forEach((p) => bulbs.push({ x: +p[0].toFixed(1), y: +p[1].toFixed(1), letter: li }))
    letters.push({ d, dot: g.dot ? [g.dot[0] + ox, g.dot[1]] : null })
    ox += g.w + GAP
  })
  return { letters, bulbs, width: ox - GAP + SW / 2 + 16 }
})

const root = ref(null)
// Expose bulb elements so GSAP timelines (intro chase) can address them one by one.
defineExpose({
  bulbEls: () => (root.value ? [...root.value.querySelectorAll('.mq-bulb')] : []),
  root,
})
const uid = `mq${Math.random().toString(36).slice(2, 7)}`
const allD = computed(() => layout.value.letters.map((l) => l.d).join(''))
const onFill = `url(#${uid}-bulbOn)`
const offFill = `url(#${uid}-bulbOff)`
</script>

<template>
  <svg ref="root" class="marquee" :class="{ 'is-lit': lit }" :viewBox="`0 0 ${layout.width} 150`" width="100%" height="100%" preserveAspectRatio="xMidYMid meet"
       role="img" :aria-label="label">
    <defs>
      <filter :id="`${uid}-b8`" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="9" /></filter>
      <filter :id="`${uid}-b18`" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="18" /></filter>
      <filter :id="`${uid}-b3`" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" /></filter>
      <linearGradient :id="`${uid}-face`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#FF6B48" /><stop offset=".45" stop-color="#F23A22" /><stop offset="1" stop-color="#C21F10" />
      </linearGradient>
      <radialGradient :id="`${uid}-bulbOn`" cx=".42" cy=".38" r=".6">
        <stop offset="0" stop-color="#FFFFFF" /><stop offset=".4" stop-color="#FFF4C8" /><stop offset=".85" stop-color="#FFC861" /><stop offset="1" stop-color="#E89A2E" />
      </radialGradient>
      <radialGradient :id="`${uid}-bulbOff`" cx=".4" cy=".35" r=".65">
        <stop offset="0" stop-color="#C9A58A" /><stop offset=".5" stop-color="#6E3A2A" /><stop offset="1" stop-color="#341510" />
      </radialGradient>
      <mask :id="`${uid}-inside`" maskUnits="userSpaceOnUse" x="-50" y="-50" :width="layout.width + 100" height="250">
        <path :d="allD" fill="none" stroke="#fff" :stroke-width="SW - 7" stroke-linecap="round" stroke-linejoin="round" />
      </mask>
    </defs>
    <!-- extruded depth: the letters are metal boxes standing off the wall -->
    <g class="mq-depth" aria-hidden="true">
      <path v-for="(n, k) in 7" :key="'x' + k" :d="allD" fill="none" stroke="#4A0F08" :stroke-width="SW + 2"
            stroke-linecap="round" stroke-linejoin="round" :transform="`translate(${k * 0.7} ${k * 1.1})`" />
      <path :d="allD" fill="none" stroke="#000" :stroke-width="SW + 6" stroke-linecap="round" stroke-linejoin="round"
            opacity=".55" transform="translate(9 14)" :filter="`url(#${uid}-b3)`" />
    </g>
    <g class="mq-halo" :filter="`url(#${uid}-b8)`" aria-hidden="true">
      <path :d="allD" fill="none" stroke="#FF5A36" :stroke-width="SW + 16" stroke-linecap="round" stroke-linejoin="round" />
    </g>
    <g class="mq-body">
      <path :d="allD" fill="none" stroke="#8E1E10" :stroke-width="SW + 1" stroke-linecap="round" stroke-linejoin="round" />
      <path :d="allD" fill="none" :stroke="`url(#${uid}-face)`" :stroke-width="SW - 5" stroke-linecap="round" stroke-linejoin="round" />
      <!-- glossy enamel: a soft light catch along the upper edge of each tube, kept inside the letter by a mask -->
      <path :d="allD" fill="none" stroke="#FFC2A8" :stroke-width="SW * 0.42" stroke-linecap="round" stroke-linejoin="round"
            opacity=".22" transform="translate(-1.5 -5)" :mask="`url(#${uid}-inside)`" />
      <template v-for="(l, i) in layout.letters" :key="'d' + i">
        <circle v-if="l.dot" :cx="l.dot[0]" :cy="l.dot[1]" :r="SW / 2 + 10" fill="#8E1E10" />
        <circle v-if="l.dot" :cx="l.dot[0]" :cy="l.dot[1]" :r="SW / 2 + 6" :fill="`url(#${uid}-face)`" />
      </template>
    </g>
    <!-- bulb sockets -->
    <g aria-hidden="true">
      <circle v-for="(b, i) in layout.bulbs" :key="'s' + i" :cx="b.x" :cy="b.y" r="5.6" fill="#2A0C07" stroke="#E7C9B2" stroke-width="1" stroke-opacity=".5" />
    </g>
    <g class="mq-bulb-glow" :filter="`url(#${uid}-b18)`" aria-hidden="true">
      <circle v-for="(b, i) in layout.bulbs" :key="'w' + i" :cx="b.x" :cy="b.y" r="8.5" fill="#FF9A3C" opacity=".28" :style="{ animationDelay: `${i * 45}ms`, transitionDelay: `${i * 28}ms` }" class="tw" />
    </g>
    <g class="mq-bulb-glow" :filter="`url(#${uid}-b8)`" aria-hidden="true">
      <circle v-for="(b, i) in layout.bulbs" :key="'g' + i" :cx="b.x" :cy="b.y" r="5.6" fill="#FFD27A" opacity=".75" :style="{ animationDelay: `${i * 45}ms`, transitionDelay: `${i * 28}ms` }" class="tw" />
    </g>
    <g class="mq-bulbs" aria-hidden="true">
      <circle v-for="(b, i) in layout.bulbs" :key="'c' + i" class="mq-bulb" :data-i="i" :data-letter="b.letter"
              :cx="b.x" :cy="b.y" r="4.4" :style="{ transitionDelay: `${i * 28}ms` }" />
    </g>
    <g class="mq-core" aria-hidden="true" fill="#FFFFFF">
      <circle v-for="(b, i) in layout.bulbs" :key="'h' + i" :cx="b.x" :cy="b.y" r="2.1" class="tw" :style="{ animationDelay: `${i * 45}ms`, transitionDelay: `${i * 28}ms` }" />
    </g>
    <g class="mq-spec" aria-hidden="true" fill="#fff">
      <circle v-for="(b, i) in layout.bulbs" :key="'p' + i" :cx="b.x - 1.2" :cy="b.y - 1.4" r="0.9" />
    </g>
  </svg>
</template>

<style scoped>
.marquee { display: block; overflow: visible; }
.mq-halo, .mq-bulb-glow { opacity: 0; transition: opacity .4s; }
.mq-bulb { fill: v-bind(offFill); transition: fill .18s; }
.tw { transition: opacity .18s; }
/* idle chase: a soft brightness wave runs through the bulbs */
.is-lit .mq-core .tw { animation: chase 3.2s ease-in-out infinite; }
@keyframes chase { 0%, 100% { opacity: 1 } 50% { opacity: .45 } }
@media (prefers-reduced-motion: reduce) { .is-lit .tw { animation: none; } }
.mq-spec { opacity: .55; }
.mq-core { opacity: 0; transition: opacity .25s; } .is-lit .mq-core { opacity: .95; }
.is-lit .mq-halo { opacity: .28; }
.is-lit .mq-bulb-glow { opacity: 1; }
.is-lit .mq-bulb { fill: v-bind(onFill); }
.is-lit .mq-spec { opacity: .9; }
</style>
