<script setup>
// Sound on/off as a little vintage wooden speaker cabinet: pine box, woven grille, brass cone.
// On: the cone pulses and sound waves drift out. Muted: the cone is still and a chalk cross sits beside it.
import { soundOn, rattle } from '../lib/sound.js'
function toggle() { soundOn.value = !soundOn.value; if (soundOn.value) rattle(0.35, 8) }
</script>

<template>
  <button class="sound" :class="{ on: soundOn }" type="button" :aria-pressed="soundOn" @click="toggle">
    <svg viewBox="0 0 84 72" width="78" height="67" aria-hidden="true">
      <defs>
        <linearGradient id="spk-wood" x1="0" x2="1"><stop offset="0" stop-color="#8A5527" /><stop offset=".45" stop-color="#C68A4C" /><stop offset="1" stop-color="#7A4A20" /></linearGradient>
        <pattern id="spk-weave" width="3" height="3" patternUnits="userSpaceOnUse"><rect width="3" height="3" fill="#3a2a1c" /><path d="M0 0h3M0 0v3" stroke="#5a4532" stroke-width=".8" /></pattern>
        <radialGradient id="spk-cone" cx=".45" cy=".4" r=".6"><stop offset="0" stop-color="#F3DFA8" /><stop offset=".5" stop-color="#C99A55" /><stop offset="1" stop-color="#6E4A18" /></radialGradient>
        <filter id="spk-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency=".5 .03" numOctaves="2" seed="4" result="n" />
          <feColorMatrix in="n" values="0 0 0 0 .3  0 0 0 0 .15  0 0 0 0 .04  0 0 0 .45 0" result="g" />
          <feComposite in="g" in2="SourceGraphic" operator="in" result="g2" />
          <feMerge><feMergeNode in="SourceGraphic" /><feMergeNode in="g2" /></feMerge>
        </filter>
      </defs>
      <!-- cabinet -->
      <rect x="6" y="6" width="46" height="60" rx="5" fill="url(#spk-wood)" filter="url(#spk-grain)" />
      <rect x="6" y="6" width="46" height="60" rx="5" fill="none" stroke="#3e2410" stroke-width="1.5" />
      <rect x="7" y="7" width="44" height="3" rx="1.5" fill="#E8B678" opacity=".55" />
      <!-- woven grille with the cone showing through -->
      <rect x="12" y="13" width="34" height="38" rx="3" fill="url(#spk-weave)" stroke="#2a1608" stroke-width="1" />
      <g class="cone">
        <circle cx="29" cy="32" r="12" fill="url(#spk-cone)" opacity=".9" />
        <circle cx="29" cy="32" r="12" fill="none" stroke="#2a1608" stroke-width="1" opacity=".6" />
        <circle cx="29" cy="32" r="4.5" fill="#3a2410" />
      </g>
      <!-- brass knob and feet -->
      <circle cx="29" cy="58" r="3" fill="url(#spk-cone)" stroke="#3e2410" stroke-width=".8" />
      <rect x="10" y="66" width="8" height="3" rx="1" fill="#3e2410" /><rect x="40" y="66" width="8" height="3" rx="1" fill="#3e2410" />
      <!-- sound waves when on, a chalk cross when muted -->
      <g v-if="soundOn" class="waves" fill="none" stroke="#FFD58A" stroke-width="2.6" stroke-linecap="round">
        <path d="M60 26a9 9 0 0 1 0 12" /><path d="M66 21a16 16 0 0 1 0 22" /><path d="M72 16a23 23 0 0 1 0 32" />
      </g>
      <g v-else stroke="#F6EBDD" stroke-width="2.8" stroke-linecap="round">
        <path d="M60 26l11 12M71 26l-11 12" />
      </g>
    </svg>
    <span class="sr-only">{{ soundOn ? 'Mute sound' : 'Turn sound on' }}</span>
  </button>
</template>

<style scoped>
.sound { position: fixed; bottom: 14px; left: 14px; z-index: 60; padding: 0; border: 0; background: none; cursor: pointer;
  filter: drop-shadow(0 6px 8px rgba(0,0,0,.6)); transition: transform .15s; }
.sound:hover { transform: translateY(-2px); }
.sound:active { transform: translateY(1px); }
.sound:focus-visible { outline: 2px solid var(--amber); outline-offset: 3px; border-radius: 6px; }
.cone { transform-box: fill-box; transform-origin: center; }
.on .cone { animation: thump .5s ease-in-out infinite alternate; }
@keyframes thump { to { transform: scale(1.06) } }
.waves path { animation: wave 1.4s ease-out infinite; }
.waves path:nth-child(2) { animation-delay: .2s; } .waves path:nth-child(3) { animation-delay: .4s; }
@keyframes wave { 0% { opacity: .2 } 40% { opacity: 1 } 100% { opacity: .2 } }
@media (prefers-reduced-motion: reduce) { .on .cone, .waves path { animation: none; } }
</style>
