<script setup>
// Visit: the flagship ECR cart up top, then every Fusk-it outlet as a little lit shopfront card.
import { branches, brand, visit } from '../data/content.js'
import { vLight } from '../lib/env.js'
import heroWide from '../assets/hero-wide.webp'
const show = (v) => v || 'To be confirmed'
const flagship = branches.find((b) => b.flagship)
const others = branches.filter((b) => !b.flagship)
</script>

<template>
  <section id="visit" class="visit" v-light aria-labelledby="visit-title">
    <header class="head">
      <span class="eyebrow" aria-hidden="true">open late</span>
      <h2 id="visit-title" class="display">Come say hi</h2>
      <p class="sub">{{ branches.length }} carts and counting, across Tamil Nadu and Bengaluru.</p>
    </header>

    <div class="layout">
      <!-- flagship: a big lit shopfront card -->
      <article class="flag">
        <!-- the real cart, in miniature: the same pre-rendered scene as the hero -->
        <div class="mini" aria-hidden="true"><img :src="heroWide" alt="" loading="lazy" /></div>
        <div class="flag-body">
          <p class="tag">The original · {{ flagship.area }}, {{ flagship.city }}</p>
          <dl>
            <div><dt>Where</dt><dd><address>{{ show(visit.address) }}</address></dd></div>
            <div><dt>When</dt><dd>{{ show(visit.hours) }}</dd></div>
            <div v-if="visit.rating"><dt>Rated</dt>
              <dd><a :href="visit.reviewsUrl" target="_blank" rel="noopener">★ {{ visit.rating.score }} on {{ visit.rating.source }}</a>
</dd></div>
          </dl>
          <div class="btns">
            <a class="btn amber" :href="visit.mapsUrl" target="_blank" rel="noopener">Directions</a>
            <a v-if="visit.instagram" class="btn ghost" :href="visit.instagram" target="_blank" rel="noopener">@fusk.it</a>
          </div>
        </div>
      </article>

      <!-- every other outlet -->
      <ul class="branches" aria-label="Other Fusk-it outlets">
        <li v-for="(b, i) in others" :key="b.name" :style="{ '--d': i * 90 + 'ms' }">
          <svg class="pin" viewBox="0 0 24 32" aria-hidden="true"><path d="M12 0C5.4 0 0 5.2 0 11.7 0 20.5 12 32 12 32s12-11.5 12-20.3C24 5.2 18.6 0 12 0z" fill="#E8432A" /><circle cx="12" cy="11.5" r="4.6" fill="#FFF1C4" /></svg>
          <div class="bi">
            <p class="bn">{{ b.name }}</p>
            <p class="bc">{{ b.area === b.name ? '' : b.area + ', ' }}{{ b.city }}</p>
          </div>
          <div class="bl">
            <a :href="b.maps" target="_blank" rel="noopener" :aria-label="`Directions to Fusk-it ${b.name}`">Directions</a>
            <a :href="`https://www.instagram.com/${b.ig}/`" target="_blank" rel="noopener" :aria-label="`Fusk-it ${b.name} on Instagram`">@{{ b.ig }}</a>
          </div>
        </li>
      </ul>
    </div>
    <!-- TODO: owner to confirm each outlet's address, hours and exact Maps link (content.js → branches) -->
  </section>
</template>

<style scoped>
.visit { max-width: 1120px; margin: 0 auto; padding-left: 16px; padding-right: 16px; }
.head { text-align: center; margin-bottom: clamp(14px, 3vh, 30px); }
.sub { color: var(--ink-dim); margin: .4rem 0 0; }
.layout { display: grid; gap: clamp(14px, 2.4vh, 24px); }
@media (min-width: 900px) { .layout { grid-template-columns: 1.35fr 1fr; align-items: stretch; } }
.flag { display: grid; border-radius: 18px; overflow: hidden; background: linear-gradient(160deg, #241a12, #120d09);
  border: 1px solid rgba(255,213,138,.18); box-shadow: 0 24px 50px rgba(0,0,0,.45); }
.mini { aspect-ratio: 16 / 8; overflow: hidden; position: relative; background: #0b0a09; }
.mini img { position: absolute; width: 150%; left: -25%; top: -4%; height: auto; filter: brightness(.55) saturate(.9); transition: filter 1.2s; }
.is-on .mini img { filter: none; }
.mini::after { content: ''; position: absolute; inset: 0; background: radial-gradient(80% 90% at 50% 40%, transparent 55%, rgba(18,13,9,.9)); }
.flag-body { padding: clamp(14px, 2.4vh, 22px) clamp(16px, 3vw, 26px) clamp(16px, 2.6vh, 24px); }
.tag { font: 600 .8rem var(--f-body); letter-spacing: .14em; text-transform: uppercase; color: var(--amber-2); margin: 0 0 10px; }
dl { margin: 0 0 16px; display: grid; gap: 10px; }
dl div { display: grid; grid-template-columns: 64px 1fr; gap: 12px; }
dt { font: 600 .75rem var(--f-body); text-transform: uppercase; letter-spacing: .12em; color: var(--ink-dim); padding-top: .2rem; }
dd { margin: 0; font-size: 1rem; } address { font-style: normal; }
dd a { color: var(--ink); text-decoration-color: var(--amber); text-underline-offset: 3px; }
.muted { color: var(--ink-dim); }
.btns { display: flex; flex-wrap: wrap; gap: 10px; }
.branches { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; grid-auto-rows: 1fr; }
@media (min-width: 600px) and (max-width: 899px) { .branches { grid-template-columns: 1fr 1fr; } }
.branches li { display: grid; grid-template-columns: 24px 1fr auto; align-items: center; column-gap: 14px; padding: 14px 18px; border-radius: 14px;
  background: rgba(255,255,255,.04); border: 1px solid rgba(255,213,138,.16); }
.pin { width: 22px; filter: drop-shadow(0 3px 4px rgba(0,0,0,.4)); }
.bi p { margin: 0; } .bn { font: 700 1.15rem var(--f-display); } .bc { color: var(--ink-dim); font-size: .88rem; }
.bl { display: grid; justify-items: end; gap: 4px; }
.bl a { color: var(--amber-2); font-size: .85rem; text-decoration: none; border-bottom: 1px solid rgba(255,181,71,.35); }
.bl a:hover { color: #fff; border-color: var(--amber); }
.bl a:focus-visible { outline: 2px solid var(--amber); outline-offset: 2px; }
.is-on .branches li { animation: rise .5s var(--d) ease-out both; }
@keyframes rise { from { opacity: 0; transform: translateY(10px) } }
@media (prefers-reduced-motion: reduce) { .is-on .branches li { animation: none; } }
</style>
