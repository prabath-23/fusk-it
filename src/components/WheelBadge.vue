<script setup>
// The cart's wheel stays with you: it rolls as you scroll, and tapping it opens the cart's wooden menu
// board (the same board that stands beside the cart on wide screens), with the section you're on ticked.
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Wheel from './Wheel.vue'
import { SECTIONS, goTo } from '../lib/nav.js'
const props = defineProps({ show: Boolean })

const open = ref(false) // always starts tucked away behind the wheel
const current = ref('hero')
const root = ref(null)
const firstItem = ref(null)

function go(id) { open.value = false; goTo(id) }
function toggle() { hold(); open.value = !open.value }
watch(open, (o) => { if (o && !peeking.value) setTimeout(() => firstItem.value?.focus(), 30) })
// the first time the wheel rolls in, it opens its board for a few seconds so people see what it is
let introduced = false, peek = 0, touched = false
watch(() => props.show, (s) => {
  if (!s) { open.value = false; return }
  if (introduced) return
  introduced = true
  setTimeout(() => { if (!touched) { peeking.value = true; open.value = true; peek = setTimeout(() => { if (!touched) { open.value = false; peeking.value = false } }, 3500) } }, 600)
}, { immediate: true })
const peeking = ref(false)
const hold = () => { touched = true; clearTimeout(peek); peeking.value = false }
const onKey = (e) => { if (e.key === 'Escape' && open.value) { open.value = false; root.value?.querySelector('.badge')?.focus() } }
const onDoc = (e) => { if (open.value && root.value && !root.value.contains(e.target)) open.value = false }

let raf = 0
function track() {
  raf = 0
  const line = window.innerHeight * 0.4
  let best = 'hero'
  for (const l of SECTIONS.slice(1)) { const el = document.querySelector(`main > section.${l.id}`); if (el && el.getBoundingClientRect().top <= line) best = l.id }
  current.value = best
}
const onScroll = () => { if (!raf) raf = requestAnimationFrame(track) }
onMounted(() => { addEventListener('keydown', onKey); addEventListener('pointerdown', onDoc); addEventListener('scroll', onScroll, { passive: true }); track() })
onBeforeUnmount(() => { removeEventListener('keydown', onKey); removeEventListener('pointerdown', onDoc); removeEventListener('scroll', onScroll) })
</script>

<template>
  <div ref="root" class="dock-nav" :class="{ show }">
    <nav v-show="open" id="quick-nav" class="board" aria-label="Jump to" @pointerenter="hold" @focusin="hold">
      <p class="head" aria-hidden="true">This way →</p>
      <ul>
        <li v-for="(l, i) in SECTIONS" :key="l.id">
          <button :ref="(el) => { if (i === 0) firstItem = el }" type="button" class="item" :class="{ on: current === l.id }"
                  :aria-current="current === l.id ? 'true' : undefined" @click="go(l.id)">
            <span class="tick" aria-hidden="true">{{ current === l.id ? '✓' : '' }}</span>{{ l.label }}
          </button>
        </li>
      </ul>
    </nav>
    <button class="badge" type="button" :tabindex="show ? 0 : -1" :aria-expanded="open" aria-controls="quick-nav" @click="toggle">
      <svg viewBox="-60 -60 120 120" width="64" height="64" aria-hidden="true">
        <Wheel :r="46" :spokes="16" />
      </svg>
      <span class="sr-only">{{ open ? 'Close the menu board' : 'Open the menu board' }}</span>
    </button>
  </div>
</template>

<style scoped>
.dock-nav { position: fixed; right: 14px; bottom: 14px; z-index: 40; display: grid; justify-items: end; gap: 10px;
  opacity: 0; transform: translateX(120%); pointer-events: none; transition: opacity .4s, transform .6s cubic-bezier(.2,.8,.2,1); }
.dock-nav.show { opacity: 1; transform: none; pointer-events: auto; }
.badge { padding: 0; border: 0; background: none; cursor: pointer; border-radius: 50%; filter: drop-shadow(0 6px 10px rgba(0,0,0,.6)); }
.badge:focus-visible { outline: 2px solid var(--amber); outline-offset: 3px; }
/* the cart's wooden menu board: pine frame, chalkboard face, chalk handwriting */
.board { min-width: 220px; padding: 12px 10px 10px; border-radius: 8px; transform-origin: bottom right; animation: pop .22s cubic-bezier(.2,1.3,.4,1);
  border: 10px solid #A86A32; box-shadow: inset 0 0 0 1px rgba(0,0,0,.6), 0 18px 40px rgba(0,0,0,.6), inset 0 0 30px rgba(0,0,0,.5);
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .08 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"), #1C1F1D; }
@keyframes pop { from { opacity: 0; transform: scale(.85) translateY(8px) } }
.head { margin: 0 8px 4px; font: 700 1.35rem var(--f-hand); color: #FFD58A; }
.board ul { list-style: none; margin: 0; padding: 0; display: grid; }
.item { width: 100%; display: flex; align-items: center; gap: 8px; padding: .28rem .6rem; min-height: 40px; border: 0; border-radius: 6px;
  background: none; color: #F6F2E8; font: 700 1.3rem/1 var(--f-hand); text-align: left; cursor: pointer; white-space: nowrap; }
.tick { width: 1em; color: #FFB547; }
.item:hover, .item:focus-visible { background: rgba(255,213,138,.1); outline: none; }
.item.on { color: #FFE2A6; }
/* phones: a plainer chalk hand so the links stay easy to read at this size */
@media (max-width: 700px) { .item { font: 600 1.02rem/1.1 var(--f-display); letter-spacing: .01em; } }
@media (prefers-reduced-motion: reduce) { .dock-nav { transition: opacity .2s; transform: none; } .board { animation: none; } }
</style>
