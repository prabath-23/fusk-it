<script setup>
// The cart's TV menu board: a glowing screen set into the wooden frame, cycling categories.
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { menu } from '../data/content.js'
import { reducedMotion, vLight } from '../lib/env.js'

const active = ref(0)
const switching = ref(false)
const paused = ref(false)
const cat = computed(() => menu[active.value])
let timer = 0
const section = ref(null)
let onScreen = false, io

function go(i, user = false) {
  if (i === active.value) return
  if (user) paused.value = true
  switching.value = true
  setTimeout(() => {
    active.value = (i + menu.length) % menu.length; switching.value = false
    // keep the lit tab in view in the swipeable phone tab row, without moving the page
    const t = tabs.value[active.value], row = t?.parentElement
    if (row && row.scrollWidth > row.clientWidth) row.scrollTo({ left: t.offsetLeft - 12, behavior: reducedMotion() ? 'auto' : 'smooth' })
  }, reducedMotion() ? 0 : 160)
}
function onKey(e) {
  if (e.key === 'ArrowRight') { go(active.value + 1, true); focusTab() }
  if (e.key === 'ArrowLeft') { go(active.value - 1, true); focusTab() }
}
const tabs = ref([])
const focusTab = () => setTimeout(() => tabs.value[active.value]?.focus(), 170)
// little illustrated icon per category, drawn like the cart's own menu stickers
const ICON = ['popcorn', 'cone', 'mug', 'glass', 'bun']

onMounted(() => {
  io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting }, { threshold: 0.3 })
  io.observe(section.value)
  if (!reducedMotion()) timer = setInterval(() => { if (onScreen && !paused.value && !document.hidden) go(active.value + 1) }, 4500)
})
onBeforeUnmount(() => { clearInterval(timer); io && io.disconnect() })
</script>

<template>
  <section id="menu" ref="section" class="menu" v-light aria-labelledby="menu-title">
    <header class="head">
      <span class="eyebrow" aria-hidden="true">tonight's menu</span>
      <h2 id="menu-title" class="display">On the screen tonight</h2>
      <p class="ta" lang="ta">இன்றைய மெனு</p>
    </header>

    <div class="wall">
      <div class="wallglow" aria-hidden="true"></div>
      <div class="tv">
        <div class="screen" :class="{ switching }">
          <!-- the cart's own TV board: title bar, small channel tabs, orange price pills -->
          <div class="bar">
            <span class="logo" aria-hidden="true">Fusk-it</span>
            <div class="tablist" role="tablist" aria-label="Menu categories" @keydown="onKey">
              <button v-for="(c, i) in menu" :key="c.category" :ref="(el) => (tabs[i] = el)" role="tab" type="button"
                      :id="`tab-${i}`" :aria-selected="i === active" :aria-controls="'menu-panel'" :tabindex="i === active ? 0 : -1"
                      @click="go(i, true)">{{ c.category }}</button>
            </div>
          </div>
          <div id="menu-panel" class="panel" role="tabpanel" :aria-labelledby="`tab-${active}`" aria-live="polite">
            <div class="cat">
              <svg class="ico" viewBox="0 0 64 64" aria-hidden="true">
                <defs>
                  <linearGradient id="ic-red" x1="0" x2="1"><stop offset="0" stop-color="#8E1A12" /><stop offset=".4" stop-color="#E8432A" /><stop offset=".6" stop-color="#F26A4E" /><stop offset="1" stop-color="#9E2016" /></linearGradient>
                  <linearGradient id="ic-paper" x1="0" x2="1"><stop offset="0" stop-color="#d8cfc0" /><stop offset=".45" stop-color="#FFF8EC" /><stop offset="1" stop-color="#cfc5b4" /></linearGradient>
                  <radialGradient id="ic-pop" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff" /><stop offset=".6" stop-color="#FCEFD0" /><stop offset="1" stop-color="#D9A25E" /></radialGradient>
                  <linearGradient id="ic-cone" x1="0" x2="1"><stop offset="0" stop-color="#A8692A" /><stop offset=".5" stop-color="#E4AE62" /><stop offset="1" stop-color="#9A5E22" /></linearGradient>
                  <radialGradient id="ic-cream" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="#fff" /><stop offset=".7" stop-color="#FBF1E2" /><stop offset="1" stop-color="#D8C3A4" /></radialGradient>
                  <linearGradient id="ic-steel" x1="0" x2="1"><stop offset="0" stop-color="#6b6f75" /><stop offset=".45" stop-color="#EEF1F4" /><stop offset="1" stop-color="#5a5e64" /></linearGradient>
                  <radialGradient id="ic-bun" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="#F4C784" /><stop offset=".6" stop-color="#D58E3E" /><stop offset="1" stop-color="#8E5420" /></radialGradient>
                </defs>
                <ellipse cx="32" cy="60" rx="20" ry="3" fill="#000" opacity=".35" />
                <g v-if="ICON[active] === 'popcorn'">
                  <path d="M14 26 L19 58 H45 L50 26Z" fill="url(#ic-paper)" />
                  <path d="M19 26 L23 58 H27 L26 26Z M32 26 V58 H36 L37 26Z M44 26 L41 58 H45 L49 26Z" fill="url(#ic-red)" />
                  <g fill="url(#ic-pop)"><circle cx="18" cy="24" r="6.5" /><circle cx="27" cy="19" r="7.5" /><circle cx="37" cy="20" r="7" /><circle cx="46" cy="25" r="6" /><circle cx="32" cy="12" r="6" /><circle cx="23" cy="27" r="5" /><circle cx="41" cy="28" r="5" /></g>
                  <g fill="#B97A35" opacity=".55"><circle cx="25" cy="21" r="1.3" /><circle cx="38" cy="17" r="1.2" /><circle cx="31" cy="10" r="1" /></g>
                </g>
                <g v-else-if="ICON[active] === 'cone'">
                  <path d="M21 31 L32 60 L43 31Z" fill="url(#ic-cone)" />
                  <path d="M23 35 L41 35 M25 41 L39 41 M27 47 L37 47 M26 33 L36 53 M38 33 L28 53" stroke="#8A5220" stroke-width="1.2" opacity=".7" />
                  <path d="M18 31 Q18 21 32 19 Q46 21 46 31Z" fill="url(#ic-cream)" />
                  <path d="M22 21 Q32 6 42 21Z" fill="url(#ic-cream)" /><path d="M28 9 Q32 2 36 9 Q34 12 32 12 Q30 12 28 9Z" fill="url(#ic-cream)" />
                </g>
                <g v-else-if="ICON[active] === 'mug'">
                  <path d="M14 26 H44 V52 Q44 58 38 58 H20 Q14 58 14 52Z" fill="url(#ic-red)" />
                  <path d="M44 31 h5 a7 7 0 0 1 0 14 h-5" fill="none" stroke="#B82E1C" stroke-width="5" />
                  <ellipse cx="29" cy="26" rx="15" ry="3.5" fill="#5A2E14" /><ellipse cx="26" cy="25.5" rx="7" ry="1.4" fill="#8A4E28" />
                  <path d="M17 30 V52" stroke="#fff" stroke-width="2.5" opacity=".25" stroke-linecap="round" />
                  <path class="steam" d="M22 19 q-4 -5 0 -10 M30 18 q-4 -5 0 -10 M38 19 q-4 -5 0 -10" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".65" />
                </g>
                <g v-else-if="ICON[active] === 'glass'">
                  <path d="M17 12 H47 L43 58 H21Z" fill="url(#ic-steel)" />
                  <path d="M18.5 22 H45.5 L43 58 H21Z" fill="#FFF6E6" opacity=".9" /><path d="M18.5 22 H45.5" stroke="#E9D9BC" stroke-width="2" />
                  <path d="M21 14 L24 56" stroke="#fff" stroke-width="2" opacity=".45" />
                  <ellipse cx="32" cy="12" rx="15" ry="2.5" fill="none" stroke="#fff" stroke-width="1.2" opacity=".7" />
                </g>
                <g v-else>
                  <ellipse cx="32" cy="50" rx="26" ry="6" fill="url(#ic-steel)" />
                  <ellipse cx="32" cy="40" rx="21" ry="13" fill="url(#ic-bun)" />
                  <path d="M14 42 Q32 50 50 42" fill="none" stroke="#6E3A12" stroke-width="1.5" opacity=".6" />
                  <ellipse cx="25" cy="34" rx="7" ry="3" fill="#FFE1A8" opacity=".55" />
                  <g fill="#FFF3D6"><ellipse cx="22" cy="38" rx="1.2" ry=".7" /><ellipse cx="30" cy="32" rx="1.2" ry=".7" /><ellipse cx="38" cy="36" rx="1.2" ry=".7" /><ellipse cx="34" cy="42" rx="1.2" ry=".7" /></g>
                </g>
              </svg>
              <div><p class="cn">{{ cat.category }}</p><p class="ct" lang="ta">{{ cat.categoryTa }}</p></div>
            </div>
            <ul class="items" :class="{ solo: cat.items.length === 1 }">
              <li v-for="(it, k) in cat.items" :key="it.name" :class="{ best: it.best }" :style="{ '--k': k }">
                <span class="txt"><span class="name">{{ it.name }}<em v-if="it.best" class="badge">Bestseller</em></span>
                  <span v-if="it.desc" class="desc">{{ it.desc }}</span></span>
                <span v-if="it.price != null" class="price">₹{{ it.price }}</span>
              </li>
            </ul>
          </div>
          <span v-if="!paused" :key="'pg' + active" class="progress" aria-hidden="true"></span>
          <div class="scan" aria-hidden="true"></div>
          <div class="static" aria-hidden="true"></div>
        </div>
        <span class="led" aria-hidden="true"></span>
      </div>
      <div class="chalk" aria-hidden="true"><span>EAT</span><span>DESSERT FIRST</span></div>
    </div>
  </section>
</template>

<style scoped>
.menu { max-width: 1100px; margin: 0 auto; padding-left: 16px; padding-right: 16px; }
.head { text-align: center; }
.head p { color: var(--amber-2); margin: .2rem 0 0; }
.wall { position: relative; width: min(100%, 820px, calc((100svh - var(--nav, 0px) - var(--festoon, 0px) - 230px) * 1.6)); margin: 0 auto; }
.wallglow { position: absolute; inset: 8% -6%; border-radius: 50%; background: radial-gradient(closest-side, rgba(70,150,255,.32), transparent);
  filter: blur(20px); opacity: 0; transition: opacity 1s .4s; pointer-events: none; }
.is-on .wallglow { opacity: 1; animation: tvglow 4s ease-in-out infinite; }
@keyframes tvglow { 0%,100% { opacity: .85 } 50% { opacity: 1 } }
.tv { position: relative; padding: clamp(8px, 1.2vw, 12px); border-radius: 14px;
  background: linear-gradient(160deg, #2e2e33, #0a0a0c 50%, #1c1c20); border: 1px solid #000;
  box-shadow: 0 26px 50px rgba(0,0,0,.6), inset 0 1px 0 #48484e; }
.led { position: absolute; right: 22px; bottom: 4px; width: 5px; height: 5px; border-radius: 50%; background: #3a1410; }
.is-on .led { background: #FF4B2B; box-shadow: 0 0 6px #FF4B2B; }
.screen { position: relative; overflow: hidden; border-radius: 6px; display: flex; flex-direction: column;
  aspect-ratio: 16 / 10; width: 100%; contain: size;
  background: radial-gradient(120% 100% at 20% 0%, #1d4a75, #0b1f36 60%, #07121f); color: #F4F7FB;
  opacity: .08; filter: brightness(.3); transition: opacity .2s, filter .2s; }
.is-on .screen { animation: tvon .9s steps(1) both; }
@keyframes tvon { 0% { opacity: .08; filter: brightness(.3) } 20% { opacity: 1; filter: brightness(2) } 28% { opacity: .3 }
  45% { opacity: 1; filter: brightness(1.2) } 100% { opacity: 1; filter: none } }
@keyframes roll { to { background-position: 0 30px } }
.screen::after { content: ''; position: absolute; inset: 0; pointer-events: none; border-radius: inherit;
  background: linear-gradient(115deg, rgba(255,255,255,.1) 0 16%, transparent 30%), radial-gradient(120% 90% at 50% 50%, transparent 60%, rgba(0,0,0,.45)); }
.scan { position: absolute; inset: 0; pointer-events: none; opacity: .16; animation: roll 7s linear infinite; background: repeating-linear-gradient(180deg, rgba(255,255,255,.18) 0 1px, transparent 1px 3px); }
/* title bar with small tabs */
.bar { display: flex; align-items: center; gap: 14px; padding: clamp(8px, 1.6vh, 14px) clamp(12px, 2vw, 22px);
  background: rgba(0,0,0,.28); border-bottom: 1px solid rgba(255,255,255,.08); flex-wrap: wrap; }
.logo { font: 700 clamp(1rem, 2.2vw, 1.35rem) var(--f-display); color: #FFD58A; text-shadow: 0 0 12px rgba(255,181,71,.5); margin-right: auto; }
.tablist { display: flex; gap: 4px; flex-wrap: wrap; background: rgba(255,255,255,.06); padding: 3px; border-radius: 999px; }
.tablist button { font: 600 clamp(.68rem, 1.1vw, .8rem) var(--f-body); color: #C9D6E6; background: transparent; border: 0;
  border-radius: 999px; padding: .34rem .7rem; cursor: pointer; min-height: 28px; transition: background .2s, color .2s; white-space: nowrap; }
.tablist button:hover { color: #fff; }
.tablist button[aria-selected='true'] { background: #F57C21; color: #1A0E04; box-shadow: 0 2px 10px rgba(245,124,33,.45); }
.tablist button:focus-visible { outline: 2px solid #FFD58A; outline-offset: 1px; }
.panel { flex: 1; display: grid; grid-template-columns: auto 1fr; gap: clamp(12px, 3vw, 34px); align-items: center;
  padding: clamp(8px, 2vh, 22px) clamp(14px, 3vw, 34px); transition: opacity .15s, transform .15s; overflow: hidden; min-height: 0; }
.screen.switching .panel { opacity: 0; transform: scaleY(.04); }
.static { position: absolute; inset: 0; pointer-events: none; opacity: 0; mix-blend-mode: screen;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
.screen.switching .static { animation: zap .2s steps(3); }
@keyframes zap { 0% { opacity: .7; background-position: 0 0 } 50% { opacity: .5; background-position: 40px 60px } 100% { opacity: 0; background-position: 90px 20px } }
.cat { display: grid; justify-items: center; text-align: center; gap: 6px; }
.ico { width: clamp(64px, 11vw, 120px); height: auto; filter: drop-shadow(0 6px 10px rgba(0,0,0,.5)); }
.cn { font: 700 clamp(1rem, 2.2vw, 1.5rem) var(--f-display); color: #FFD58A; margin: 0; }
.ct { font: 500 clamp(.7rem, 1.2vw, .85rem) var(--f-ta); color: #9fb4cc; margin: 0; }
.items { list-style: none; margin: 0; padding: 0; display: grid; gap: clamp(6px, 1.2vh, 10px); align-content: center; }
.items li { display: flex; align-items: center; justify-content: space-between; gap: 12px;
  background: rgba(255,255,255,.06); color: #F4F7FB; border: 1px solid rgba(255,255,255,.08); padding: clamp(.4rem, 1vh, .65rem) clamp(.8rem, 1.6vw, 1.1rem);
  font: 600 clamp(.82rem, 1.5vw, 1rem) var(--f-display); border-radius: 12px;
  animation: pill .35s calc(var(--k) * 60ms) ease-out both; }
@keyframes pill { from { opacity: 0; transform: translateX(10px) } }
.items li.best { background: linear-gradient(#F98B32, #EA6E14); color: #fff; border-color: transparent; box-shadow: inset 0 1px 0 rgba(255,255,255,.35), 0 4px 14px rgba(245,124,33,.35); }
/* longer lists stay compact so all of them fit on the fixed-size screen */
.items:not(.solo) li { padding: clamp(.3rem, .8vh, .5rem) clamp(.8rem, 1.6vw, 1.1rem); }
.items:not(.solo) li:not(.best) .desc { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.items:not(.solo) { gap: clamp(4px, .9vh, 8px); }
.items.solo li { padding: clamp(.9rem, 2.4vh, 1.4rem) clamp(1.1rem, 2.4vw, 1.6rem); font-size: clamp(1.1rem, 2.2vw, 1.5rem); border-radius: 18px; }
.items.solo .desc { font-size: clamp(.82rem, 1.4vw, 1rem); }
.items.solo .price { font-size: 1.15em; padding: .2rem .8rem; }
.txt { display: grid; gap: 2px; min-width: 0; }
.desc { font: 400 clamp(.7rem, 1.1vw, .8rem)/1.3 var(--f-body); color: #b9c8da; }
.best .desc { color: rgba(255,255,255,.85); }
.badge { font: 700 .6rem var(--f-body); font-style: normal; letter-spacing: .08em; text-transform: uppercase; background: #FFE2A6; color: #8a3b06;
  border-radius: 999px; padding: .08rem .45rem; margin-left: .5rem; vertical-align: 2px; }
.price { background: rgba(0,0,0,.22); border-radius: 999px; padding: .1rem .6rem; font-size: .92em; white-space: nowrap; }
.progress { position: absolute; left: 0; bottom: 0; height: 3px; width: 100%; background: #F57C21; transform-origin: left; animation: prog 4.5s linear both; }
@keyframes prog { from { transform: scaleX(0) } to { transform: scaleX(1) } }
.chalk { position: absolute; right: -6px; bottom: -30px; transform: rotate(4deg); background: #1C1F1D; border: 5px solid #6E4220; border-radius: 3px;
  padding: 6px 12px; color: #ECE8DE; font: 700 .85rem var(--f-display); display: grid; text-align: center; line-height: 1.15; box-shadow: 0 8px 18px rgba(0,0,0,.5); }
.chalk span:last-child { font-size: .62rem; letter-spacing: .08em; }
.note { text-align: center; color: var(--ink-dim); font-size: .85rem; margin: clamp(30px, 5vh, 46px) 0 0; }
@media (max-width: 600px) {
  .wall { width: 100%; }
  /* phones: one fixed height that fits the longest category (5 items), whatever is showing */
  .screen { aspect-ratio: auto; height: auto; contain: none; }
  .items { min-height: calc(5 * 2.65rem + 4 * 6px); align-content: start; }
  .items li { padding: .42rem .85rem; font-size: .9rem; }
  .tablist { flex-wrap: nowrap; overflow-x: auto; scroll-snap-type: x mandatory; max-width: 100%; scrollbar-width: none; -webkit-mask: linear-gradient(90deg, #000 85%, transparent); }
  .tablist::-webkit-scrollbar { display: none; }
  .tablist button { padding: .3rem .6rem; font-size: .74rem; min-height: 30px; scroll-snap-align: start; flex: none; }
  .desc { display: none; } .items li.best .desc { display: block; }
  .panel { grid-template-columns: 1fr; align-content: start; }
  .cat { grid-template-columns: auto 1fr; justify-items: start; text-align: left; align-items: center; }
  .ico { width: 44px; }
  .panel { padding: 10px 14px 14px; gap: 8px; }
  .chalk { transform: rotate(4deg) scale(.8); bottom: -24px; }
  .head .ta { display: none; }
  .bar { justify-content: center; } .logo { margin: 0 auto; width: 100%; text-align: center; }
}
@media (prefers-reduced-motion: reduce) { .is-on .screen { animation: none; opacity: 1; filter: none; } .items li { animation: none; } }
</style>
