<script setup>
// The soul of the place. Calm and sincere: the board writes itself in chalk once, nothing more.
import { freeFood } from '../data/content.js'
import { vLight } from '../lib/env.js'
import { onBeforeUnmount, onMounted, ref } from 'vue'
// phones get a tall board with the line broken into three, so the chalk stays big enough to read
const narrow = ref(false)
let mq
const sync = () => (narrow.value = mq.matches)
onMounted(() => { mq = matchMedia('(max-width: 640px)'); sync(); mq.addEventListener('change', sync) })
onBeforeUnmount(() => mq && mq.removeEventListener('change', sync))
const taParts = freeFood.ta.includes('? ') ? freeFood.ta.split('? ').map((p, i, a) => (i < a.length - 1 ? p + '?' : p)) : [freeFood.ta]
</script>

<template>
  <section class="free" v-light="{ threshold: 0.45 }" aria-labelledby="free-title">
    <h2 id="free-title" class="sr-only">{{ freeFood.en }}</h2>
    <div class="figwrap">
    <!-- a brass pendant lamp hangs over the board and throws a cone of warm light on it -->
    <svg class="lamp" viewBox="0 0 400 300" overflow="visible" aria-hidden="true">
      <defs>
        <radialGradient id="ff-cone" cx=".5" cy="0" r="1"><stop offset="0" stop-color="#FFD58A" stop-opacity=".55" /><stop offset=".45" stop-color="#FFC874" stop-opacity=".18" /><stop offset="1" stop-color="#FFC874" stop-opacity="0" /></radialGradient>
        <linearGradient id="ff-brass" x1="0" x2="1"><stop offset="0" stop-color="#5a3a12" /><stop offset=".4" stop-color="#E2B462" /><stop offset=".6" stop-color="#C89440" /><stop offset="1" stop-color="#4a2e0c" /></linearGradient>
      </defs>
      <ellipse class="cone" cx="200" cy="82" rx="300" ry="230" fill="url(#ff-cone)" />
      <line x1="200" y1="-900" x2="200" y2="44" stroke="#1a1410" stroke-width="3" />
      <path d="M200 44 C176 44 166 62 160 80 H240 C234 62 224 44 200 44Z" fill="url(#ff-brass)" />
      <rect x="194" y="38" width="12" height="10" rx="2" fill="#3a2a18" />
      <ellipse class="glow-bulb" cx="200" cy="82" rx="16" ry="8" fill="#FFF4D0" />
    </svg>
    <figure class="board-wrap">
      <svg class="board" :viewBox="narrow ? '0 0 600 660' : '0 0 900 420'" role="img" :aria-label="`Chalkboard: ${freeFood.en}`">
        <defs>
          <filter id="ff-chalkTex" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="2" seed="9" result="n" />
            <feColorMatrix in="n" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .14 -.04" result="d" />
            <feComposite in="d" in2="SourceGraphic" operator="in" result="d2" />
            <feMerge><feMergeNode in="SourceGraphic" /><feMergeNode in="d2" /></feMerge>
          </filter>
          <filter id="ff-chalk" x="-2%" y="-10%" width="104%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="1.3" numOctaves="1" seed="4" result="t" />
            <feDisplacementMap in="SourceGraphic" in2="t" scale="2.4" result="d" />
            <feComposite in="d" in2="t" operator="arithmetic" k2="1" k3="-.3" />
          </filter>
          <filter id="ff-wood" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency=".003 .12" numOctaves="3" seed="2" result="n" />
            <feColorMatrix in="n" values="0 0 0 0 .2  0 0 0 0 .1  0 0 0 0 .04  1.6 0 0 0 -.6" result="s" />
            <feComposite in="s" in2="SourceGraphic" operator="in" result="s2" />
            <feMerge><feMergeNode in="SourceGraphic" /><feMergeNode in="s2" /></feMerge>
          </filter>
          <radialGradient id="ff-smudge" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#fff" stop-opacity=".05" /><stop offset="1" stop-color="#fff" stop-opacity="0" /></radialGradient>
        </defs>
        <rect x="0" y="0" :width="narrow ? 600 : 900" :height="narrow ? 660 : 420" rx="8" fill="#7A4A22" filter="url(#ff-wood)" />
        <rect x="22" y="22" :width="narrow ? 556 : 856" :height="narrow ? 616 : 376" fill="#1B1E1C" filter="url(#ff-chalkTex)" />
        <ellipse :cx="narrow ? 300 : 380" :cy="narrow ? 300 : 200" :rx="narrow ? 260 : 360" :ry="narrow ? 240 : 140" fill="url(#ff-smudge)" />
        <g filter="url(#ff-chalk)" font-family="Caveat" font-weight="600" text-anchor="middle">
          <template v-if="narrow">
            <text class="chalk-line l1" x="300" y="150" font-size="84">If you can't</text>
            <text class="chalk-line l1b" x="300" y="245" font-size="84">buy food,</text>
            <text class="chalk-line l2" x="300" y="360" font-size="100">it's for FREE</text>
          </template>
          <template v-else>
            <text class="chalk-line l1" x="450" y="150" font-size="68">If you can't buy food,</text>
            <text class="chalk-line l2" x="450" y="236" font-size="78">it's for FREE</text>
          </template>
        </g>
        <path class="underline" :d="narrow ? 'M110 390 Q300 410 495 384' : 'M300 262 Q450 278 610 258'" fill="none" stroke="#ECE8DE" stroke-width="4" stroke-linecap="round" opacity=".85" />
        <text class="ta-line" :x="narrow ? 300 : 450" :y="narrow ? 470 : 326" text-anchor="middle" font-family="Noto Sans Tamil" font-weight="700" :font-size="narrow ? 30 : 30" fill="#ECE8DE" filter="url(#ff-chalk)" lang="ta">
          <template v-if="narrow"><tspan v-for="(p, i) in taParts" :key="i" x="300" :dy="i ? 50 : 0">{{ p }}</tspan></template>
          <template v-else>{{ freeFood.ta }}</template>
        </text>
        <g :transform="narrow ? 'translate(-150 240)' : ''">
        <rect x="172" y="388" width="556" height="16" fill="#5E3818" v-if="narrow" />
        <rect x="22" y="388" width="856" height="16" fill="#5E3818" v-else />
        <rect x="520" y="379" width="58" height="11" rx="5" fill="#F3EFE6" /><rect x="590" y="381" width="34" height="9" rx="4" fill="#F7C9D6" />
        <rect x="636" y="381" width="26" height="9" rx="4" fill="#BFE3F2" />
        </g>
        <g :transform="narrow ? 'translate(80 606)' : 'translate(250 366)'"><rect width="96" height="24" rx="3" fill="#3C2A1A" /><rect y="16" width="96" height="8" rx="2" fill="#B9B3A8" /></g>
        <g v-if="!narrow" class="doodle" fill="none" stroke="#ECE8DE" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" filter="url(#ff-chalk)" opacity=".7">
          <path d="M92 92 l9 18 20 3 -15 13 4 20 -18 -10 -18 10 4 -20 -15 -13 20 -3z" />
          <path d="M812 76 c-12 -16 -36 -4 -24 14 l24 22 24 -22 c12 -18 -12 -30 -24 -14z" />
        </g>
      </svg>
    </figure>
    </div>
    <!-- on the ledge: a filter-coffee tumbler and dabara, and a bun on a steel plate -->
    <svg class="ledge" viewBox="0 0 260 104" aria-hidden="true">
      <defs><linearGradient id="ff-steel" x1="0" x2="1"><stop offset="0" stop-color="#6b6f75" /><stop offset=".45" stop-color="#EEF1F4" /><stop offset="1" stop-color="#5a5e64" /></linearGradient>
        <radialGradient id="ff-bun" cx=".4" cy=".3" r=".85"><stop offset="0" stop-color="#F6CB86" /><stop offset=".55" stop-color="#D88F3E" /><stop offset="1" stop-color="#8E5420" /></radialGradient>
        <linearGradient id="ff-plank" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A86A32" /><stop offset="1" stop-color="#5E3818" /></linearGradient></defs>
      <rect x="0" y="84" width="260" height="12" rx="2" fill="url(#ff-plank)" /><rect x="0" y="84" width="260" height="2" fill="#E0A869" opacity=".6" />
      <path d="M30 96 l10 8 h6 l-6 -8 M230 96 l-10 8 h-6 l6 -8" fill="#4a2c12" />
      <path d="M20 84 Q22 64 40 62 H76 Q94 64 96 84Z" fill="url(#ff-steel)" /><path d="M42 66 L36 20 H80 L74 66Z" fill="url(#ff-steel)" /><path d="M36 20 H80" stroke="#fff" stroke-width="1.5" opacity=".7" />
      <ellipse cx="58" cy="22" rx="18" ry="4" fill="#7B4A26" /><path class="steam" d="M50 16 q-6 -8 0 -16 M60 14 q-6 -8 0 -16 M70 16 q-6 -8 0 -16" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".6" />
      <ellipse cx="190" cy="80" rx="58" ry="6" fill="url(#ff-steel)" /><ellipse cx="190" cy="78" rx="48" ry="3" fill="#000" opacity=".25" />
      <path d="M152 76 Q150 46 190 44 Q230 46 228 76 Q190 82 152 76Z" fill="url(#ff-bun)" />
      <path d="M160 66 Q190 74 220 66" fill="none" stroke="#7A4417" stroke-width="1.4" opacity=".5" />
      <ellipse cx="178" cy="54" rx="12" ry="4" fill="#FFE3AE" opacity=".55" />
      <g fill="#FFF4DC"><ellipse cx="174" cy="60" rx="1.6" ry=".9" transform="rotate(-20 174 60)" /><ellipse cx="190" cy="52" rx="1.6" ry=".9" /><ellipse cx="204" cy="58" rx="1.6" ry=".9" transform="rotate(25 204 58)" /><ellipse cx="196" cy="64" rx="1.6" ry=".9" /></g>
    </svg>
    <p class="how">{{ freeFood.how }}</p>
    <p v-if="freeFood.paragraph" class="para">{{ freeFood.paragraph }}</p>
    <!-- TODO: owner's words — set freeFood.paragraph in content.js -->
  </section>
</template>

<style scoped>
.free { padding: clamp(80px, 14vw, 160px) 16px; display: grid; justify-items: center; gap: 28px;
  background: radial-gradient(60% 50% at 50% 45%, rgba(255,181,71,.07), transparent 70%); }
.free { position: relative; overflow: visible clip; } /* the lamp cord stops at this section's top edge */
.figwrap { position: relative; width: 100%; display: grid; justify-items: center; padding-top: calc(min(420px, 80vw) * .2); }
.lamp { position: absolute; left: 50%; top: 0; width: min(420px, 80vw); transform: translateX(-50%); pointer-events: none; z-index: 2; overflow: visible; }
.lamp .cone { opacity: 0; transition: opacity 1.4s .2s; mix-blend-mode: soft-light; } .is-on .lamp .cone { opacity: 1; }
.lamp .glow-bulb { fill: #6b5a40; transition: fill .6s; } .is-on .lamp .glow-bulb { fill: #FFF4D0; filter: drop-shadow(0 0 10px #FFC56A); }
.ledge { width: min(300px, 60vw); margin-top: -18px; justify-self: center; position: relative; z-index: 3; }
.how { margin: 0; font: 600 clamp(1rem, 2.2vw, 1.25rem) var(--f-hand); color: var(--amber-2); text-align: center; }
.steam { animation: steam 3s ease-in-out infinite; } @keyframes steam { 0%,100% { opacity: .2; transform: translateY(2px) } 50% { opacity: .7; transform: translateY(-3px) } }
@media (prefers-reduced-motion: reduce) { .steam { animation: none; } }
.board-wrap { margin: 0; margin-top: 0; position: relative; z-index: 1; width: min(900px, 100%); filter: drop-shadow(0 22px 30px rgba(0,0,0,.6)); }
.board { display: block; width: 100%; height: auto; }
@media (max-width: 640px) { .board-wrap { width: min(440px, 100%); } }
.chalk-line { fill: transparent; stroke: #ECE8DE; stroke-width: 1.3; stroke-dasharray: 1400; stroke-dashoffset: 1400; }
.ta-line, .underline { opacity: 0; transition: opacity 1.2s 2.6s; }
.underline { stroke-dasharray: 340; stroke-dashoffset: 340; }
.is-on .chalk-line { animation: write 1.9s ease-in-out forwards, fill .8s ease forwards; }
.is-on .l1 { animation-delay: 0s, 1.5s; }
.is-on .l2 { animation-delay: 1.1s, 2.6s; }
.is-on .l1b { animation-delay: .6s, 2s; }
.is-on .ta-line { opacity: .95; }
.is-on .underline { opacity: .85; transition: stroke-dashoffset .8s 2.8s ease, opacity .1s 2.8s; stroke-dashoffset: 0; }
@keyframes write { to { stroke-dashoffset: 0 } }
@keyframes fill { to { fill: #ECE8DE } }
.doodle { opacity: 0; transition: opacity 1s 3.2s; } .is-on .doodle { opacity: .7; }
.para { max-width: 60ch; text-align: center; color: var(--ink); font-size: 1.1rem; line-height: 1.7; margin: 0; }
@media (prefers-reduced-motion: reduce) {
  .chalk-line { fill: #ECE8DE; stroke: none; } .is-on .chalk-line { animation: none; }
  .ta-line, .underline { opacity: .9; transition: none; stroke-dashoffset: 0; }
}
</style>
