<script setup>
// "Shutter down": as you reach the bottom, the rolling shutter is pulled down over the cart, scrubbed to scroll.
import { onBeforeUnmount, onMounted, ref } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { branches, brand, visit } from '../data/content.js'
import { reducedMotion } from '../lib/env.js'
import { rattle } from '../lib/sound.js'
import Wheel from '../components/Wheel.vue'
import heroWide from '../assets/hero-wide.webp'
import heroNarrow from '../assets/hero-narrow.webp'
const NARROW_MQ = '(max-width: 700px), (orientation: portrait) and (max-width: 1100px)'
const narrow = ref(typeof matchMedia !== 'undefined' && matchMedia(NARROW_MQ).matches)
const AXLE = 'M368 883 H572 Q584 883 590 889 H990 Q996 883 1008 883 H1212 Q1222 883 1222 893 V907 Q1222 917 1212 917 H1008 Q996 917 990 911 H590 Q584 917 572 917 H368 Q358 917 358 907 V893 Q358 883 368 883 Z'
// once the shutter is down, the cart's lights dim out for the night
const setClosed = (on) => document.documentElement.classList.toggle('closing', on)

gsap.registerPlugin(ScrollTrigger)
const root = ref(null)
const shutter = ref(null)
let st
const year = new Date().getFullYear()

onMounted(() => {
  if (reducedMotion()) { gsap.set(shutter.value, { yPercent: 0 }); ScrollTrigger.create({ trigger: root.value, start: 'bottom bottom+=2', onToggle: (s) => setClosed(s.isActive) }); return }
  let rattled = false
  st = gsap.fromTo(shutter.value, { yPercent: -100 }, {
    yPercent: 0, ease: 'none',
    scrollTrigger: { trigger: root.value, start: 'top bottom', end: 'bottom bottom', scrub: 0.4,
      onUpdate: (self) => { if (self.progress > 0.6 && !rattled) { rattled = true; rattle(0.8, 16) } if (self.progress < 0.2) rattled = false
        setClosed(self.progress > 0.94); document.documentElement.classList.toggle('footer-on', self.progress > 0.02) } },
  })
})
onBeforeUnmount(() => { st?.scrollTrigger?.kill(); st?.kill(); setClosed(false); document.documentElement.classList.remove('footer-on') })
</script>

<template>
  <footer ref="root" class="foot">
    <div class="stage">
      <!-- the lit outlet itself, carrying on exactly below the pinned shop top, as the shutter comes down over it -->
      <picture class="store" aria-hidden="true">
        <source :media="NARROW_MQ" :srcset="heroNarrow" />
        <img :src="heroWide" alt="" loading="lazy" />
      </picture>
      <!-- the wheels and axle are live on the hero, so they are drawn here too, in the same place -->
      <svg class="store-wheels" :viewBox="narrow ? '260 -60 1080 1300' : '-300 -60 2200 1300'" aria-hidden="true">
        <g transform="translate(400 900)"><Wheel :r="148" /></g>
        <g transform="translate(1180 900)"><Wheel :r="148" /></g>
        <path :d="AXLE" fill="#000" opacity=".5" transform="translate(4 10)" />
        <path :d="AXLE" fill="#B07038" filter="url(#woodH)" />
        <path :d="AXLE" fill="url(#bevelH)" />
      </svg>
      <div class="store-dim" aria-hidden="true"></div>
      <div ref="shutter" class="shutter">
        <div class="slats" aria-hidden="true"></div>
        <div class="painted">
          <p class="see">See you tonight</p>
          <p class="ta" lang="ta">இன்றிரவு சந்திப்போம்</p>
          <!-- TODO: verify Tamil sign-off with owner -->
        </div>
        <div class="bar" aria-hidden="true"><span class="lock"></span></div>
      </div>
    </div>
    <div class="base">
      <p class="who"><strong>{{ brand.name }}</strong> · <span lang="ta">{{ brand.nameTa }}</span> · {{ brand.motto }}</p>
      <nav class="links" aria-label="Fusk-it elsewhere">
        <a :href="visit.instagram" target="_blank" rel="noopener">Instagram @fusk.it</a>
        <a v-if="visit.phone" :href="`tel:${visit.phone.replace(/\s/g, '')}`">Call {{ visit.phone }}</a>
        <a href="#visit">All {{ branches.length }} carts</a>
      </nav>
      <p class="muted">© {{ year }} Fusk-it · Site by 7°N</p>
    </div>
  </footer>
</template>

<style scoped>
.foot { position: relative; height: 150vh; }
.stage { position: sticky; top: var(--nav, 0px); height: calc(100svh - var(--nav, 0px) - 128px); overflow: hidden;
  background: radial-gradient(70% 60% at 50% 60%, #2a1c10, var(--night) 75%); }
.store img, .store-wheels { position: absolute; display: block; height: auto; --s: min(calc(100vw / 1600), calc(max(100svh, 560px) / 1100));
  width: calc(var(--s) * 2200); left: calc((100vw - var(--s) * 1600) / 2 - var(--s) * 300);
  top: calc((max(100svh, 560px) - var(--s) * 1100) / 2 - var(--s) * 60 - var(--nav, 0px)); }
@media (max-width: 700px), (orientation: portrait) and (max-width: 1100px) {
  .store img, .store-wheels { --s: min(calc(100vw / 610), calc(max(100svh, 560px) / 1100)); width: calc(var(--s) * 1080);
    left: calc((100vw - var(--s) * 610) / 2 - var(--s) * 235); } }
.store-dim { position: absolute; inset: 0; background: #050304; opacity: 0; transition: opacity 1.4s ease; }
.shutter { position: absolute; inset: 0; will-change: transform; display: grid; place-items: center; }
.slats { position: absolute; inset: 0;
  background: linear-gradient(90deg, rgba(0,0,0,.6), transparent 14%, transparent 86%, rgba(0,0,0,.6)),
    repeating-linear-gradient(180deg, #8C8F94 0 2px, #6B6E73 2px 9px, #45484C 9px 20px, #1C1D20 20px 23px, #0B0B0C 23px 24px); }
.painted { position: relative; text-align: center; padding: 18px 28px; transform: rotate(-2deg);
  background: rgba(240,232,214,.9); color: #2A2018; border-radius: 4px; box-shadow: 0 6px 18px rgba(0,0,0,.5);
  -webkit-mask: radial-gradient(circle at 20% 30%, #000 60%, rgba(0,0,0,.85) 61%) ; }
.see { font: 700 clamp(2rem, 7vw, 3.6rem) var(--f-hand); margin: 0; color: #B8301E; }
.painted .ta { font-size: clamp(1rem, 3vw, 1.4rem); margin: .2rem 0 0; font-weight: 700; }
.bar { position: absolute; left: 0; right: 0; bottom: 0; height: 36px; background: linear-gradient(#9A9DA2, #5A5D61 45%, #2A2B2E); }
.lock { position: absolute; left: 50%; top: 8px; width: 46px; height: 20px; margin-left: -23px; border-radius: 4px; background: linear-gradient(#D7B46A, #8A6A26); }
.base { position: absolute; left: 0; right: 0; bottom: 0; height: 128px; gap: 6px; display: grid; place-content: center; text-align: center;
  padding: 0 16px; background: #070605; border-top: 1px solid rgba(255,213,138,.12); }
.base p { margin: .15rem 0; }
.muted { color: var(--ink-dim); font-size: .82rem; }
.who { font-size: .95rem; }
.links { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px 18px; }
.links a { color: var(--amber-2); text-decoration: none; font-size: .9rem; border-bottom: 1px solid rgba(255,181,71,.35); }
.links a:hover { color: #fff; } .links a:focus-visible { outline: 2px solid var(--amber); outline-offset: 2px; }
</style>
