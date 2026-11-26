<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import Cart from './components/Cart.vue'
import IntroShutter from './components/IntroShutter.vue'
import SoundToggle from './components/SoundToggle.vue'
import WheelBadge from './components/WheelBadge.vue'
import MarqueeLogo from './components/MarqueeLogo.vue'
import heroWide from './assets/hero-wide.webp'
import heroNarrow from './assets/hero-narrow.webp'
import LazySection from './components/LazySection.vue'
import { brand } from './data/content.js'
import { reducedMotion, storeGet, storeSet } from './lib/env.js'

const params = new URLSearchParams(location.search)
const bakeMode = ['wide', 'narrow'].includes(params.get('bake')) ? params.get('bake') : '' // used by `npm run bake`
const forceDark = params.get('lit') === '0'
// review aid: ?intro=0&shot=.toys#x scrolls a section into view once everything has mounted (used for headless screenshots)
const shot = params.get('shot')
if (shot) { const st = document.createElement('style'); st.textContent = `.poster, footer, main > section:not(${shot}), main > .lazy-ph { display: none !important }`; document.head.append(st)
  setInterval(() => document.querySelectorAll('main > section').forEach((e) => e.classList.add('is-on', 'in-view')), 500) }
const playIntro = ref(!bakeMode && !reducedMotion() && !forceDark && params.get('intro') !== '0' && !storeGet('sessionStorage', 'fuskit:intro', false))
const lit = ref(!playIntro.value && !forceDark)
const powering = ref(false)

function lightsOn() {
  if (lit.value) return
  powering.value = true
  lit.value = true
  setTimeout(() => (powering.value = false), 2600)
}
function introDone() { playIntro.value = false; storeSet('sessionStorage', 'fuskit:intro', true) }

// The wheels roll with scroll: scroll distance (and so scroll velocity) drives their rotation.
const hero = ref(null)
// #menu is inside a lazily-mounted section; wait for it to exist before jumping there
async function openMenu(e) {
  if (document.getElementById('menu')) return
  e.preventDefault()
  window.scrollBy({ top: window.innerHeight, behavior: 'instant' })
  for (let i = 0; i < 40 && !document.getElementById('menu'); i++) await new Promise((r) => setTimeout(r, 25))
  document.getElementById('menu')?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth' })
  history.replaceState(null, '', '#menu')
}
const pastHero = ref(false)
// the marquee sign docks at the top once the cart's own sign has scrolled away
const docked = ref(false)
const festoonEl = ref(null)
// The navbar IS the hero's shop top: the same baked image and the same live sign, cropped to the
// shutter housing (scene y 0-186) and placed exactly where the hero draws it, so it just stays put.
const band = ref(0)
const NARROW_MQ = '(max-width: 700px), (orientation: portrait) and (max-width: 1100px)'
const narrowNav = ref(false)
function measureBand() {
  const W = window.innerWidth, H = Math.max(window.innerHeight, 560)
  narrowNav.value = matchMedia(NARROW_MQ).matches
  const s = Math.min(W / (narrowNav.value ? 610 : 1600), H / 1100)
  band.value = Math.round((H - s * 1100) / 2 + 186 * s)
  document.documentElement.style.setProperty("--nav", band.value + "px")
}
const toTop = () => window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' })
if (!bakeMode) measureBand() // before first paint, so the intro shutter starts below the sign
const onDock = () => {
  const d = window.scrollY > 0; if (d !== docked.value) docked.value = d }
let raf = 0, lastY = 0, angle = 0, io
function onScroll() { if (!raf) raf = requestAnimationFrame(roll) }
function roll() {
  raf = 0
  const y = window.scrollY
  angle += (y - lastY) * 0.45
  lastY = y
  for (const el of document.querySelectorAll('.wheel-rot')) el.style.transform = `rotate(${angle.toFixed(1)}deg)`
}
onMounted(() => {
  lastY = window.scrollY
  measureBand(); window.addEventListener('resize', measureBand)
  const armSnap = () => { document.documentElement.classList.add('snap'); ['wheel', 'touchstart', 'keydown'].forEach((t) => window.removeEventListener(t, armSnap)) }
  ;['wheel', 'touchstart', 'keydown'].forEach((t) => window.addEventListener(t, armSnap, { passive: true }))
  onDock(); window.addEventListener('scroll', onDock, { passive: true })
  if (!reducedMotion()) window.addEventListener('scroll', onScroll, { passive: true })
  io = new IntersectionObserver(([e]) => (pastHero.value = !e.isIntersecting && e.boundingClientRect.top < 0))
  if (hero.value) io.observe(hero.value)
})
onBeforeUnmount(() => { window.removeEventListener('scroll', onScroll); window.removeEventListener('scroll', onDock); window.removeEventListener('resize', measureBand); io && io.disconnect() })
</script>

<template>
  <div v-if="bakeMode" class="bake"><Cart :lit="true" :bake="bakeMode" /></div>
  <template v-else>
  <a class="skip-link" href="#menu" @click="openMenu">Skip to the menu</a>
  <SoundToggle />
  <div ref="festoonEl" class="festoon" :class="{ on: docked }" aria-hidden="true"></div>
  <a class="dock" :class="{ on: docked }" :style="{ height: band + 'px' }" href="#" aria-label="Fusk-it, back to the top"
     :tabindex="docked ? 0 : -1" @click.prevent="toTop">
    <picture aria-hidden="true">
      <source :media="NARROW_MQ" :srcset="heroNarrow" />
      <img class="dock-img" :src="heroWide" alt="" />
    </picture>
    <svg class="dock-sign" :viewBox="narrowNav ? '495 0 610 1100' : '0 0 1600 1100'" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <svg :x="narrowNav ? 520 : 500" :y="narrowNav ? 50 : 34" :width="narrowNav ? 560 : 640" :height="narrowNav ? 124 : 141" viewBox="0 0 680 150" overflow="visible">
        <MarqueeLogo :lit="lit" />
      </svg>
    </svg>
  </a>
  <IntroShutter v-if="playIntro" @lights="lightsOn" @done="introDone" />
  <main>
    <section ref="hero" class="hero" aria-labelledby="hero-title">
      <h1 id="hero-title" class="sr-only">{{ brand.name }} — {{ brand.nameTa }}: a wooden dessert cart on East Coast Road, Chennai</h1>
      <div class="hero-art"><Cart :lit="lit" :powering="powering" :standees="true" /></div>
      <div class="hero-vignette" aria-hidden="true"></div>
      <div class="hero-line">
        <p class="en">Popcorn · Soft-serve · Milo — open till 6 AM</p>
        <p class="ta" lang="ta">பாப்கார்ன் · சாஃப்ட் சர்வ் · மைலோ — காலை 6 மணி வரை</p>
        <!-- TODO: owner to confirm the Tamil line -->
      </div>
      <div class="hero-grain" aria-hidden="true"></div>
      <a class="scroll-cue" href="#menu" @click="openMenu" aria-label="Scroll to the menu"><span aria-hidden="true"></span></a>
    </section>
    <LazySection :load="() => import('./sections/MenuTV.vue')" />
    <LazySection :load="() => import('./sections/FreeFood.vue')" min-height="80vh" />
    <LazySection :load="() => import('./sections/NoteWall.vue')" />
    <LazySection :load="() => import('./sections/ToyShelf.vue')" min-height="60vh" />
    <LazySection :load="() => import('./sections/PopcornCTA.vue')" min-height="80vh" />
    <LazySection :load="() => import('./sections/Visit.vue')" min-height="80vh" />
  </main>
  <LazySection :load="() => import('./sections/FooterShutter.vue')" min-height="150vh" />
  <WheelBadge :show="!playIntro && (docked || narrowNav)" />
  </template>
</template>

<style>
.dock { position: fixed; top: 0; left: 0; right: 0; z-index: 30; overflow: hidden; display: block; visibility: hidden;
  box-shadow: 0 8px 22px rgba(0,0,0,.6); }
.dock.on { visibility: visible; }
/* same geometry as .poster img in index.html, and the same viewBox/meet as the hero SVG */
.dock-img { position: absolute; display: block; height: auto; --s: min(calc(100vw / 1600), calc(max(100svh, 560px) / 1100));
  width: calc(var(--s) * 2200); left: calc((100vw - var(--s) * 1600) / 2 - var(--s) * 300);
  top: calc((max(100svh, 560px) - var(--s) * 1100) / 2 - var(--s) * 60); }
@media (max-width: 700px), (orientation: portrait) and (max-width: 1100px) {
  .dock-img { --s: min(calc(100vw / 610), calc(max(100svh, 560px) / 1100)); width: calc(var(--s) * 1080);
    left: calc((100vw - var(--s) * 610) / 2 - var(--s) * 235); } }
.dock-sign { position: absolute; top: 0; left: 0; width: 100vw; height: max(100svh, 560px); overflow: visible; }
.dock:focus-visible { outline: 2px solid var(--amber); outline-offset: 2px; }
.bake { position: fixed; inset: 0; z-index: 2; background: #0B0A09; }
.hero { position: relative; height: 100svh; min-height: 560px; overflow: hidden; }
.hero-art { position: absolute; inset: 0; }
.hero-vignette { position: absolute; inset: 0; pointer-events: none;
  /* night: corners and edges fall into shadow, the lit window and sign stay bright */
  background:
    radial-gradient(ellipse 72% 100% at 50% 22%, transparent 45%, rgba(4,3,2,.45) 78%, rgba(4,3,2,.7) 100%); }
/* phones only: on wider screens the A-frame standee carries this line */
.hero-line { display: none; }
@media (max-width: 700px), (orientation: portrait) and (max-width: 1100px) { .hero-line { display: block; } }
.hero-line { position: absolute; left: 50%; bottom: 46px; transform: translateX(-50%); z-index: 3; text-align: center; pointer-events: none;
  width: max-content; max-width: calc(100vw - 32px); padding: 14px 40px 12px; text-shadow: 0 1px 3px rgba(0,0,0,.9); }
/* a soft pool of shadow on the ground, so the line reads as text on the pavement, not on the wheel */
.hero-line::before { content: ''; position: absolute; inset: -6px -30px; z-index: -1; border-radius: 50%;
  background: radial-gradient(closest-side, rgba(6,4,3,.92), rgba(6,4,3,.75) 55%, transparent); }
.hero-line .en { margin: 0; font: 600 clamp(.72rem, 1.4vw, .9rem) var(--f-body); letter-spacing: .24em; text-transform: uppercase; color: #FFE2A6; }
.hero-line .ta { margin: .2rem 0 0; font: 500 clamp(.72rem, 1.3vw, .86rem) var(--f-ta); color: rgba(246,235,221,.85); }
.hero-grain { position: absolute; inset: -50%; pointer-events: none; opacity: .14; mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
.scroll-cue { position: absolute; left: 50%; bottom: 14px; width: 44px; height: 44px; margin-left: -22px; display: grid; place-items: center; z-index: 3; }
.scroll-cue span { width: 14px; height: 14px; border-right: 2px solid var(--amber-2); border-bottom: 2px solid var(--amber-2); transform: rotate(45deg); animation: cue 2.4s ease-in-out infinite; }
@keyframes cue { 0%, 100% { transform: translateY(-3px) rotate(45deg); opacity: .5 } 50% { transform: translateY(3px) rotate(45deg); opacity: 1 } }
@media (prefers-reduced-motion: reduce) { .scroll-cue span { animation: none; } }
</style>
