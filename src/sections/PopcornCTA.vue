<script setup>
// The red-and-white popcorn machine, gently popping, with the main calls to action.
import { branches, visit } from '../data/content.js'
import { reducedMotion } from '../lib/env.js'
const toVisit = () => document.getElementById('visit')?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth' })
import { vLight } from '../lib/env.js'

function rng(seed) { return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 } }
const r = rng(77)
const POP = ['#FFF9EC', '#FDF0CF', '#F8E4B0', '#FFF4DA']
// each kernel colour gets its own shaded gradient, so a lobe is one circle instead of two
const pile = Array.from({ length: 80 }, () => {
  const x = 40 + r() * 180, top = 290 - 60 * Math.max(0, 1 - ((x - 130) / 95) ** 2)
  return { x, y: top + r() * (318 - top), lobes: Array.from({ length: 3 + Math.floor(r() * 3) }, () => {
    const a = r() * 6.28, d = r() * 4.5; return [Math.cos(a) * d, Math.sin(a) * d, 3.2 + r() * 2.8] }), c: Math.floor(r() * 4), hull: r() > 0.55 }
}).sort((a, b) => a.y - b.y)
const popping = Array.from({ length: 9 }, (_, i) => ({ x: 105 + r() * 50, d: (i * 0.37).toFixed(2), h: 40 + r() * 50, dx: (r() - 0.5) * 70 }))
// chaser bulbs round the dome, and a few kernels that escaped onto the floor
const domeBulbs = Array.from({ length: 11 }, (_, i) => { const t = Math.PI * (0.08 + 0.84 * i / 10); return { x: 130 - Math.cos(t) * 104, y: 66 - Math.sin(t) * 46, d: (i * 0.12).toFixed(2) } })
const spill = Array.from({ length: 12 }, () => ({ x: 20 + r() * 220, y: 406 + r() * 8, s: 0.6 + r() * 0.5 }))
const tel = visit.phone ? `tel:${visit.phone.replace(/\s/g, '')}` : ''
</script>

<template>
  <section class="cta" v-light aria-labelledby="cta-title">
    <svg class="machine" viewBox="0 0 260 420" overflow="visible" role="img" aria-label="A red-and-white Fusk-it popcorn machine, popping">
      <defs>
        <linearGradient id="pc-red" x1="0" x2="1"><stop offset="0" stop-color="#7E140C" /><stop offset=".3" stop-color="#E0402C" /><stop offset=".45" stop-color="#FF8A70" /><stop offset=".6" stop-color="#D33522" /><stop offset="1" stop-color="#6E110A" /></linearGradient>
        <linearGradient id="pc-steel" x1="0" x2="1"><stop offset="0" stop-color="#5b5d61" /><stop offset=".4" stop-color="#e2e4e8" /><stop offset="1" stop-color="#47494d" /></linearGradient>
        <radialGradient v-for="(c, i) in POP" :id="`pc-k${i}`" :key="c" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#FFFFFF" /><stop offset=".55" :stop-color="c" /><stop offset="1" stop-color="#C9955A" /></radialGradient>
        <linearGradient id="pc-glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0" /><stop offset=".45" stop-color="#fff" stop-opacity=".16" /><stop offset=".55" stop-color="#fff" stop-opacity=".02" /><stop offset="1" stop-color="#fff" stop-opacity="0" /></linearGradient>
        <linearGradient id="pc-in" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFC774" stop-opacity=".55" /><stop offset="1" stop-color="#FFC774" stop-opacity="0" /></linearGradient>
        <filter id="pc-blur" x="-60%" y="-80%" width="220%" height="260%"><feGaussianBlur stdDeviation="14" /></filter>
        <clipPath id="pc-cab"><rect x="30" y="112" width="200" height="210" /></clipPath>
      </defs>
      <ellipse class="spot" cx="130" cy="380" rx="160" ry="70" fill="#FFB547" opacity=".18" filter="url(#pc-blur)" />
      <ellipse cx="130" cy="412" rx="125" ry="8" fill="#000" opacity=".6" />
      <path d="M18 70 Q20 22 130 10 Q240 22 242 70Z" fill="url(#pc-red)" />
      <path d="M50 44 Q130 18 212 44" fill="none" stroke="#fff" stroke-width="4" opacity=".35" stroke-linecap="round" />
      <rect x="12" y="68" width="236" height="14" fill="#8E1A12" />
      <rect x="12" y="68" width="236" height="3" fill="#FF9B7E" opacity=".5" />
      <g class="dome-bulbs">
        <circle v-for="(b, i) in domeBulbs" :key="'db' + i" :cx="b.x" :cy="b.y" r="4.2" class="db" :style="{ animationDelay: b.d + 's' }" />
      </g>
      <rect x="44" y="84" width="172" height="26" rx="3" fill="#F3ECE2" />
      <text x="130" y="103" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="18" fill="#C3271B">Fusk-it</text>
      <rect x="30" y="112" width="200" height="210" fill="#3A1A0E" />
      <rect x="30" y="112" width="200" height="210" fill="url(#pc-in)" />
      <ellipse class="heat" cx="130" cy="130" rx="90" ry="34" fill="#FFD28A" opacity=".5" filter="url(#pc-blur)" />
      <rect x="128" y="112" width="4" height="14" fill="#9a9a9a" />
      <path d="M96 126 H164 L157 156 Q130 166 103 156Z" fill="url(#pc-steel)" />
      <g clip-path="url(#pc-cab)">
        <g v-for="(k, i) in popping" :key="'p' + i" class="hop" :style="{ '--d': k.d + 's', '--h': -k.h + 'px', '--dx': k.dx + 'px' }">
          <g :transform="`translate(${k.x} 160)`">
            <circle r="4.5" fill="#FFF9EC" /><circle cx="3.5" cy="-2" r="4" fill="#FDF0CF" /><circle cx="1" cy="3" r="3.6" fill="#F8E4B0" />
          </g>
        </g>
        <g v-for="(k, i) in pile" :key="i" :transform="`translate(${k.x} ${k.y})`">
          <circle v-for="(l, j) in k.lobes" :key="j" :cx="l[0]" :cy="l[1]" :r="l[2]" :fill="`url(#pc-k${k.c})`" />
          <ellipse v-if="k.hull" cx="2" cy="1" rx="2" ry="1.4" fill="#8A4E1E" />
        </g>
      </g>
      <rect x="30" y="112" width="200" height="210" fill="url(#pc-glass)" />
      <rect x="16" y="80" width="16" height="250" fill="url(#pc-red)" /><rect x="228" y="80" width="16" height="250" fill="url(#pc-red)" />
      <rect x="12" y="322" width="236" height="82" rx="4" fill="url(#pc-red)" />
      <rect x="12" y="322" width="236" height="4" fill="#C9CCD1" /><rect x="30" y="110" width="200" height="3" fill="#C9CCD1" opacity=".8" />
      <!-- the scoop leaning in the corner of the cabinet -->
      <g transform="translate(196 296) rotate(-28)"><rect x="-3" y="-30" width="6" height="30" rx="2" fill="#9a9da2" /><path d="M-11 0 H11 L8 14 H-8Z" fill="url(#pc-steel)" /></g>
      <rect x="44" y="336" width="172" height="52" rx="4" fill="#F3ECE2" />
      <g fill="#D8321F"><rect x="54" y="336" width="16" height="52" /><rect x="88" y="336" width="16" height="52" /><rect x="122" y="336" width="16" height="52" /><rect x="156" y="336" width="16" height="52" /><rect x="190" y="336" width="16" height="52" /></g>
      <rect x="70" y="350" width="120" height="24" rx="4" fill="#F3ECE2" />
      <text x="130" y="367" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="14" fill="#C3271B" letter-spacing="2">POPCORN</text>
    </svg>

    <div class="copy">
      <span class="eyebrow" aria-hidden="true">fresh &amp; warm</span>
      <h2 id="cta-title" class="display">Hungry? Find your nearest cart.</h2>
      <p>Popcorn, soft-serve and Milo at {{ branches.length }} carts across Tamil Nadu and Bengaluru.</p>
      <div class="btns">
        <a class="btn amber" href="#visit" @click.prevent="toVisit">See all the carts</a>
        <a v-if="visit.instagram" class="btn ghost" :href="visit.instagram" target="_blank" rel="noopener">Instagram</a>
        <a v-if="tel" class="btn ghost" :href="tel">Call {{ visit.phone }}</a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cta { padding: clamp(72px, 12vw, 140px) 16px; max-width: 1100px; margin: 0 auto; display: grid; gap: 40px;
  grid-template-columns: 1fr; justify-items: center; align-items: center; text-align: center; }
@media (min-width: 820px) { .cta { grid-template-columns: 420px 1fr; text-align: left; justify-items: start; } }
.machine { width: min(400px, 78vw); height: auto; filter: drop-shadow(0 20px 26px rgba(0,0,0,.55)); }
.copy { align-self: center; }
.copy .eyebrow { margin-bottom: .7rem; }
.copy p { color: var(--ink-dim); font-size: 1.15rem; margin: .6rem 0 1.6rem; }
.btns { display: flex; flex-wrap: wrap; gap: 12px; justify-content: inherit; }
@media (max-width: 819px) { .btns { justify-content: center; } }
.heat { opacity: 0; transition: opacity 1s; }
.db { fill: #5a2a18; transition: fill .4s; }
.is-on .db { fill: #FFF1C4; filter: drop-shadow(0 0 4px #FFB547); animation: chase 1.32s steps(1) infinite; }
@keyframes chase { 0%, 60% { fill: #FFF1C4 } 61%, 100% { fill: #E8A04A } }
.spot { opacity: 0; transition: opacity 1s; } .is-on .spot { opacity: .2; }
@media (prefers-reduced-motion: reduce) { .is-on .db { animation: none; } }
.is-on .heat { opacity: .5; }
.hop { opacity: 0; }
.cta.in-view .hop { animation: hop 3.3s var(--d) ease-in-out infinite; }
@keyframes hop { 0% { opacity: 0; transform: translate(0, 0) } 8% { opacity: 1 } 35% { transform: translate(calc(var(--dx) * .6), var(--h)) }
  70% { opacity: 1; transform: translate(var(--dx), 130px) } 80%, 100% { opacity: 0; transform: translate(var(--dx), 140px) } }
@media (prefers-reduced-motion: reduce) { .cta.in-view .hop { animation: none; } }
</style>
