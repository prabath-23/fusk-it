<script setup>
// The toy shelf inside the cart. Toys wobble and squeak; one of them hides a popcorn surprise.
import { ref } from 'vue'
import gsap from 'gsap'
import { TOY } from '../data/toys.js'
import { reducedMotion, vLight } from '../lib/env.js'
import { beepSound, squeakSound } from '../lib/sound.js'

// one of each resident, crammed together like the real shelf: overlap (dx), tilt and size vary
const shelf = [
  { kind: 'teddy', name: 'Teddy bear', s: 1.1, tilt: -4 }, { kind: 'panda', name: 'Panda', s: 1.15, tilt: 3 },
  { kind: 'duck', name: 'Rubber duck', s: .85, tilt: -6 }, { kind: 'bunny', name: 'Bunny', s: 1.05, tilt: 2 },
  { kind: 'popbox', name: 'Tiny popcorn box', secret: true, s: .8, tilt: 5 }, { kind: 'robot', name: 'Tin robot', s: 1, tilt: -2 },
  { kind: 'car', name: 'Toy car', s: .9, tilt: 0 },
]
const wobbling = ref(-1)
const squeak = ref(-1)
const found = ref(false)
const burstLayer = ref(null)

// every toy has its own trick
// Panda waves, teddy blushes, duck squeaks, bunny hops, car drives, robot dances, popcorn box throws popcorn.
const SAY = { panda: 'hi there!', teddy: 'aww…', duck: 'squeak!', bunny: 'hop hop', car: 'vroom!', robot: 'beep boop', popbox: 'pop pop pop!' }
const DUR = { panda: 1500, teddy: 1600, duck: 800, bunny: 1500, car: 1800, robot: 1700, popbox: 900 }
// which shape in each toy is the moving part (index into TOY[kind])
const PART = { panda: { 4: 'arm' }, robot: { 0: 'body', 1: 'head', 2: 'eye', 3: 'eye', 5: 'antenna' } }
const part = (kind, k) => PART[kind]?.[k] || ''
let origin = null
function poke(i, e) {
  const kind = shelf[i].kind
  if (kind === 'duck') squeakSound()
  if (kind === 'robot') beepSound()
  origin = e?.currentTarget?.getBoundingClientRect?.() || null
  wobbling.value = -1; squeak.value = -1
  setTimeout(() => { wobbling.value = i; squeak.value = i }, 16) // a beat later so a repeat click restarts the animation
  setTimeout(() => { if (squeak.value === i) squeak.value = -1; if (wobbling.value === i) wobbling.value = -1 }, DUR[shelf[i].kind] + 100)
  if (shelf[i].secret) burst()
}

function burst() {
  found.value = true
  if (reducedMotion()) return
  const layer = burstLayer.value
  const W = window.innerWidth, H = window.innerHeight
  for (let k = 0; k < 70; k++) {
    const el = document.createElement('span')
    el.className = 'kernel'
    el.style.setProperty('--s', (0.7 + Math.random() * 0.8).toFixed(2))
    layer.appendChild(el)
    const x0 = origin ? origin.left + origin.width / 2 : W / 2, y0 = origin ? origin.top + origin.height * 0.3 : H * 0.7
    const vx = (Math.random() - 0.5) * W * 1.1, up = H * (0.45 + Math.random() * 0.5)
    gsap.set(el, { x: x0, y: y0, rotation: Math.random() * 360 })
    const tl = gsap.timeline({ onComplete: () => el.remove() })
    tl.to(el, { x: x0 + vx, duration: 1.6, ease: 'none' }, 0)
      .to(el, { y: y0 - up, duration: 0.55, ease: 'power2.out' }, 0)
      .to(el, { y: H + 60, duration: 1.05, ease: 'power2.in' }, 0.55)
      .to(el, { rotation: '+=' + (Math.random() * 720 - 360), duration: 1.6, ease: 'none' }, 0)
  }
}
const shapes = (kind) => TOY[kind]
</script>

<template>
  <section class="toys" v-light aria-labelledby="toys-title">
    <header class="head">
      <span class="eyebrow" aria-hidden="true">meet the crew</span>
      <h2 id="toys-title" class="display">The toy shelf</h2>
      <p>The cart's little residents. Give them a poke.</p>
    </header>
    <!-- one long pine shelf, toys crammed on it shoulder to shoulder -->
    <div class="shelf">
      <ul class="row" aria-label="Toys on the shelf">
        <li v-for="(t, i) in shelf" :key="i" :style="{ '--s': t.s, '--tilt': t.tilt + 'deg', zIndex: 10 - Math.abs(3 - i) }">
          <button type="button" class="toy" :class="[{ secret: t.secret }, wobbling === i ? `act-${t.kind}` : '']"
                  :aria-label="t.secret ? 'A tiny popcorn box hiding on the shelf' : `Poke the ${t.name.toLowerCase()}`" @click="poke(i, $event)">
            <svg viewBox="-42 -82 84 88" aria-hidden="true">
              <g filter="url(#ts-felt)">
                <template v-for="(sh, k) in shapes(t.kind)" :key="k">
                  <ellipse v-if="sh[0] === 'e'" :cx="sh[1]" :cy="sh[2]" :rx="sh[3]" :ry="sh[4]" :fill="sh[5]" :class="part(t.kind, k)" />
                  <circle v-else-if="sh[0] === 'c'" :cx="sh[1]" :cy="sh[2]" :r="sh[3]" :fill="sh[4]" :class="part(t.kind, k)" />
                  <rect v-else :x="sh[1]" :y="sh[2]" :width="sh[3]" :height="sh[4]" rx="6" :fill="sh[5]" :class="part(t.kind, k)" />
                </template>
                <template v-for="(sh, k) in shapes(t.kind)" :key="'h' + k">
                  <ellipse v-if="sh[0] === 'e' && sh[3] > 4" :cx="sh[1]" :cy="sh[2]" :rx="sh[3]" :ry="sh[4]" fill="url(#ts-plush)" :class="part(t.kind, k)" />
                  <circle v-else-if="sh[0] === 'c' && sh[3] > 4" :cx="sh[1]" :cy="sh[2]" :r="sh[3]" fill="url(#ts-plush)" :class="part(t.kind, k)" />
                  <rect v-else-if="sh[0] === 'r' && sh[3] > 8" :x="sh[1]" :y="sh[2]" :width="sh[3]" :height="sh[4]" rx="6" fill="url(#ts-plush)" :class="part(t.kind, k)" />
                </template>
                <g v-if="t.kind === 'teddy'" class="blush"><ellipse cx="-10" cy="-40" rx="4.5" ry="2.6" /><ellipse cx="10" cy="-40" rx="4.5" ry="2.6" /></g>
              </g>
            </svg>
            <span v-if="squeak === i" class="squeak" aria-hidden="true">{{ SAY[t.kind] }}</span>
          </button>
        </li>
      </ul>
      <div class="plank" aria-hidden="true"></div>
      <svg width="0" height="0" aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id="ts-plush" cx=".35" cy=".3" r=".85">
            <stop offset="0" stop-color="#fff" stop-opacity=".35" /><stop offset=".45" stop-color="#fff" stop-opacity="0" />
            <stop offset=".8" stop-color="#000" stop-opacity=".12" /><stop offset="1" stop-color="#000" stop-opacity=".35" />
          </radialGradient>
          <filter id="ts-felt" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="1" seed="3" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" />
          </filter>
        </defs>
      </svg>
    </div>
    <p class="found" aria-live="polite">{{ found ? 'You found the popcorn stash. Free popcorn vibes only.' : '' }}</p>
    <Teleport to="body"><div ref="burstLayer" class="toy-burst" aria-hidden="true"></div></Teleport>
  </section>
</template>

<style scoped>
.toys { max-width: 1100px; margin: 0 auto; padding-left: 16px; padding-right: 16px; }
.head { text-align: center; margin-bottom: clamp(10px, 2.4vh, 24px); }
.head p { color: var(--ink-dim); margin: .4rem 0 0; }
.shelf { position: relative; width: min(100%, 980px); margin: 0 auto; padding: clamp(40px, 7vh, 80px) clamp(18px, 4vw, 48px) 0; border-radius: 14px 14px 0 0;
  background: radial-gradient(70% 90% at 50% 0%, rgba(255,214,150,.28), transparent 70%),
    repeating-linear-gradient(90deg, rgba(0,0,0,.12) 0 2px, transparent 2px 64px), linear-gradient(#2f5c55, #1c3e39);
  box-shadow: inset 0 0 0 6px #6E4220, inset 0 0 40px rgba(0,0,0,.45), 0 24px 50px rgba(0,0,0,.45); }
/* a small brass picture lamp over the shelf */
.shelf::after { content: ''; position: absolute; left: 50%; top: 6px; width: 120px; height: 14px; transform: translateX(-50%); border-radius: 0 0 60px 60px;
  background: linear-gradient(#E2B462, #8a6224); box-shadow: 0 6px 30px 10px rgba(255,200,110,.25); }
.row { list-style: none; margin: 0; padding: 0; display: flex; justify-content: center; align-items: flex-end; position: relative; z-index: 2; }
.row li { position: relative; margin: 0 clamp(-22px, -2.2vw, -8px); transform: rotate(var(--tilt)); transform-origin: 50% 100%; }
.plank { position: relative; z-index: 3; height: clamp(16px, 2.4vw, 24px); margin: -6px clamp(-48px, -4vw, -18px) 0; border-radius: 3px;
  background: linear-gradient(#D49A5A, #A0632C 60%, #6E3F18); box-shadow: 0 2px 0 #FFD9A0 inset, 0 18px 30px rgba(0,0,0,.55); }
.plank::after { content: ''; position: absolute; left: 4%; right: 4%; top: 100%; height: 0; background: linear-gradient(90deg, #5a3412 0 10px, transparent 10px calc(100% - 10px), #5a3412 calc(100% - 10px)); }
.shelf::before { content: ''; position: absolute; left: 10%; right: 10%; bottom: 10px; height: 60%; z-index: 0; pointer-events: none;
  background: radial-gradient(60% 70% at 50% 100%, rgba(255,190,90,.35), transparent 70%); opacity: .4; transition: opacity .8s; }
.is-on .shelf::before { opacity: 1; }
.toy { position: relative; background: none; border: 0; padding: 0; cursor: pointer; display: block; transform-origin: 50% 100%; }
.toy svg { display: block; height: calc(clamp(64px, 14vw, 210px) * var(--s)); width: auto; transition: transform .2s; overflow: visible; }
.toy:hover svg, .toy:focus-visible svg { transform: translateY(-4px); }
.toy:focus-visible { outline: 2px solid var(--amber); outline-offset: 4px; border-radius: 8px; }
.toy svg { overflow: visible; }
/* panda: raises its right paw and waves */
.toy .arm { transform-box: fill-box; transform-origin: 50% 10%; }
.act-panda .arm { animation: wave 1.5s ease-in-out; }
@keyframes wave { 0%,100% { transform: none } 15% { transform: rotate(-150deg) } 30%,60% { transform: rotate(-120deg) } 45%,75% { transform: rotate(-165deg) } 90% { transform: rotate(-130deg) } }
.act-panda svg { animation: lean 1.5s ease-in-out; }
@keyframes lean { 0%,100% { transform: none } 20%,80% { transform: rotate(-4deg) } }
/* teddy: a shy little sway, cheeks go rosy */
.blush ellipse { fill: #FF6F8A; opacity: 0; }
.act-teddy .blush ellipse { animation: blush 1.6s ease both; }
@keyframes blush { 0% { opacity: 0 } 20%,75% { opacity: .9 } 100% { opacity: 0 } }
.act-teddy svg { animation: shy 1.6s ease; }
@keyframes shy { 0%,100% { transform: none } 20% { transform: scale(1.04, .95) rotate(-5deg) } 50% { transform: rotate(5deg) } 75% { transform: rotate(-3deg) } }
/* duck: squeezed, squeaks, bounces back */
.act-duck svg { animation: squish .8s cubic-bezier(.3,1.6,.5,1); }
@keyframes squish { 0% { transform: none } 18% { transform: scale(1.25, .7) } 45% { transform: translateY(-22px) scale(.9, 1.12) } 70% { transform: scale(1.08, .92) } 100% { transform: none } }
/* bunny: hops left and right inside its cubby */
.act-bunny svg { animation: hops 1.5s ease-in-out; }
@keyframes hops { 0%,100% { transform: none } 12% { transform: translate(-18%, -32%) } 24% { transform: translate(-30%, 0) scale(1.06,.92) }
  42% { transform: translate(0, -38%) } 56% { transform: translate(28%, 0) scale(1.06,.92) } 74% { transform: translate(14%, -30%) } 88% { transform: scale(1.05,.94) } }
/* car: drives out of its cubby to the right and comes back in from the left */
.act-car svg { animation: drive 1.8s ease-in-out; }
@keyframes drive { 0% { transform: none } 12% { transform: translateX(-10%) } 50% { transform: translateX(60%) } 62% { transform: translateX(60%) scaleX(-1) } 100% { transform: none } }
/* robot: a jerky mechanical dance; head ticks, eyes flash */
.toy .head, .toy .body, .toy .antenna { transform-box: fill-box; transform-origin: 50% 100%; }
.act-robot svg { animation: robo 1.7s steps(1); }
@keyframes robo { 0%,100% { transform: none } 12% { transform: translateX(-8%) rotate(-6deg) } 25% { transform: translateX(8%) rotate(6deg) }
  37% { transform: translateY(-10%) } 50% { transform: translateX(-8%) rotate(-6deg) } 62% { transform: translateX(8%) rotate(6deg) } 75% { transform: translateY(-10%) } }
.act-robot .head { animation: tick 1.7s steps(1); }
@keyframes tick { 0%,100% { transform: none } 18% { transform: rotate(15deg) } 40% { transform: rotate(-15deg) } 62% { transform: rotate(15deg) } 84% { transform: rotate(-10deg) } }
.act-robot .eye { animation: flash .34s steps(1) 5; }
@keyframes flash { 50% { fill: #FFE45A } }
/* popcorn box: a big shake as it fires popcorn across the screen */
.act-popbox svg { animation: fire .9s ease; }
@keyframes fire { 0%,100% { transform: none } 15% { transform: scale(.85, 1.1) } 30% { transform: translateY(-14%) scale(1.15, .9) rotate(-6deg) } 50% { transform: rotate(6deg) } 70% { transform: rotate(-3deg) } }
.squeak { position: absolute; left: 50%; top: -10px; transform: translateX(-50%); font: 600 1.1rem var(--f-hand); color: var(--amber-2);
  white-space: nowrap; animation: pop .7s ease-out forwards; pointer-events: none; }
@keyframes pop { from { opacity: 0; transform: translate(-50%, 6px) } 30% { opacity: 1 } to { opacity: 0; transform: translate(-50%, -18px) } }
.found { text-align: center; min-height: 1.5em; color: var(--amber-2); margin-top: 16px; }
.toy-burst { position: fixed; inset: 0; pointer-events: none; z-index: 45; overflow: hidden; }
.toy-burst :deep(.kernel) { position: absolute; left: -14px; top: -14px; width: 26px; height: 22px; transform: scale(var(--s));
  background:
    radial-gradient(circle at 30% 35%, #FFFBEF 0 5px, transparent 6px),
    radial-gradient(circle at 65% 30%, #FDF0CF 0 6px, transparent 7px),
    radial-gradient(circle at 50% 65%, #F8E4B0 0 7px, transparent 8px),
    radial-gradient(circle at 52% 62%, #9C5A22 0 2px, transparent 3px);
  filter: drop-shadow(0 2px 2px rgba(0,0,0,.4)); will-change: transform; }
/* phones: a longer shelf you swipe along, toys at a size you can poke */
@media (max-width: 600px) {
  .shelf { overflow-x: auto; overflow-y: hidden; scroll-snap-type: x proximity; padding: 46px 16px 0; margin: 0 -4px; width: auto; scrollbar-width: none; }
  .shelf::-webkit-scrollbar { display: none; }
  .shelf { display: grid; grid-template-columns: max-content; }
  .row { justify-content: flex-start; padding: 0 12px; }
  .row li { scroll-snap-align: center; }
  .toy svg { height: calc(104px * var(--s)); }
}
@media (prefers-reduced-motion: reduce) { .toy svg, .toy svg *, .squeak { animation: none !important; } .act-teddy .blush ellipse { opacity: .9; } }
</style>
