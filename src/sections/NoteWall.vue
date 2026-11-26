<script setup>
// The sticky-note wall over the lattice window. Notes drag (mouse + touch). Your own note is saved
// only in this browser (localStorage) — it's a taste of the real wall, not a public board.
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { seedNotes } from '../data/content.js'
import { storeGet, storeSet, vLight } from '../lib/env.js'

const COLORS = ['#FFF3A8', '#FFD3E0', '#C8F0E0', '#D6E4FF', '#FBE7B5']
const KEY = 'fuskit:notes:v1'
const MAX = 80

function rng(seed) { return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 } }
const r = rng(1234)
const seeded = seedNotes.map((text, i) => ({
  id: `s${i}`, text, color: COLORS[i % COLORS.length], x: 0, y: 0, rot: (r() - 0.5) * 12, jx: r(), jy: r(), mine: false, hidden: false, moved: false,
}))
const notes = ref(seeded)
const wall = ref(null)

// Lay the example notes out on a loose grid sized to the wall, so every note's writing stays readable and none
// hangs off the bottom edge. Notes that don't fit on a small screen are left off rather than piled on top.
function layout() {
  const el = wall.value?.querySelector('.notes'); if (!el) return
  const W = el.clientWidth, H = el.clientHeight
  const note = el.querySelector('.note')?.offsetWidth || 110
  const cols = Math.max(2, Math.floor(W / (note * 1.08))), rows = Math.max(1, Math.floor(H / (note * 1.06)))
  const cw = 100 / cols, ch = 100 / rows, nw = (note / W) * 100, nh = (note / H) * 100
  let slot = 0
  for (const n of notes.value) {
    if (n.mine || n.moved) continue
    if (slot >= cols * rows) { n.hidden = true; continue }
    const c = slot % cols, rr = Math.floor(slot / cols)
    n.hidden = false
    n.x = Math.min(100 - nw, c * cw + (cw - nw) * n.jx)
    n.y = Math.min(100 - nh, rr * ch + (ch - nh) * n.jy)
    slot++
  }
}
let ro
const dragging = ref(null)
const fresh = ref(null)
let start = null

onMounted(() => {
  nextTick(layout)
  if ('ResizeObserver' in window) { ro = new ResizeObserver(() => layout()); ro.observe(wall.value) }
  // once a note is picked up on a phone, stop the page from scrolling under the finger
  wall.value.addEventListener('touchmove', (e) => { if (start) e.preventDefault() }, { passive: false })
  const mine = storeGet('localStorage', KEY, [])
  if (Array.isArray(mine)) notes.value = [...notes.value, ...mine.filter((n) => n && typeof n.text === 'string').map((n) => ({ ...n, text: n.text.slice(0, MAX), mine: true }))]
})
onBeforeUnmount(() => ro && ro.disconnect())
const saveMine = () => storeSet('localStorage', KEY, notes.value.filter((n) => n.mine).map(({ id, text, color, x, y, rot }) => ({ id, text, color, x, y, rot })))

let hold = 0
function down(e, n) {
  if (e.button > 0) return
  const target = e.currentTarget
  const begin = () => {
    const rect = wall.value.getBoundingClientRect()
    start = { id: e.pointerId, n, rect, ox: e.clientX, oy: e.clientY, x: n.x, y: n.y }
    dragging.value = n.id; n.moved = true
    try { target.setPointerCapture(e.pointerId) } catch {}
    notes.value = [...notes.value.filter((m) => m !== n), n] // bring to front
  }
  if (e.pointerType === 'touch') { pending = { id: e.pointerId, x: e.clientX, y: e.clientY }; hold = setTimeout(() => { pending = null; begin() }, 320) }
  else begin()
}
let pending = null
function cancelHold(e) {
  if (pending && e.pointerId === pending.id && Math.hypot(e.clientX - pending.x, e.clientY - pending.y) > 8) { clearTimeout(hold); pending = null }
}
function move(e) {
  cancelHold(e)
  if (!start || e.pointerId !== start.id) return
  const { rect, n } = start
  n.x = Math.min(92, Math.max(0, start.x + ((e.clientX - start.ox) / rect.width) * 100))
  n.y = Math.min(90, Math.max(0, start.y + ((e.clientY - start.oy) / rect.height) * 100))
}
function up(e) {
  clearTimeout(hold); pending = null
  if (!start || e.pointerId !== start.id) return
  if (start.n.mine) saveMine()
  start = null; dragging.value = null
}
// keyboard: arrow keys nudge a focused note
function key(e, n) {
  const d = { ArrowLeft: [-2, 0], ArrowRight: [2, 0], ArrowUp: [0, -2], ArrowDown: [0, 2] }[e.key]
  if (!d) return
  e.preventDefault()
  n.x = Math.min(92, Math.max(0, n.x + d[0])); n.y = Math.min(90, Math.max(0, n.y + d[1]))
  if (n.mine) saveMine()
}

// composer
const dlg = ref(null)
const draft = ref('')
const color = ref(COLORS[0])
function openComposer() { draft.value = ''; dlg.value?.showModal?.() }
async function stick() {
  const text = draft.value.trim().slice(0, MAX)
  if (!text) return
  const n = { id: `m${Date.now()}`, text, color: color.value, x: 30 + Math.random() * 30, y: 25 + Math.random() * 40, rot: (Math.random() - 0.5) * 12, mine: true }
  notes.value = [...notes.value, n]
  saveMine()
  dlg.value?.close()
  fresh.value = n.id
  await nextTick()
  setTimeout(() => (fresh.value = null), 900)
}
</script>

<template>
  <section id="notes" class="wallsec" v-light aria-labelledby="notes-title">
    <header class="head">
      <span class="eyebrow" aria-hidden="true">love letters</span>
      <h2 id="notes-title" class="display">The sticky-note wall</h2>
      <p>The cart's real window is covered in notes from people who stopped by. Here are a few like them. Drag them around.</p>
    </header>

    <div ref="wall" class="wall" @pointermove="move" @pointerup="up" @pointercancel="up">
      <div class="lattice" aria-hidden="true"></div>
      <ul class="notes" aria-label="Example notes on the wall">
        <li v-for="(n, i) in notes" v-show="!n.hidden" :key="n.id" class="note" tabindex="0"
            :class="{ lift: dragging === n.id, mine: n.mine, slap: fresh === n.id }"
            :style="{ left: n.x + '%', top: n.y + '%', '--rot': n.rot + 'deg', '--c': n.color, '--d': (i % 12) * 60 + 'ms' }"
            :aria-label="`${n.mine ? 'Your note' : 'Note'}: ${n.text}. Use arrow keys to move.`"
            @pointerdown="down($event, n)" @keydown="key($event, n)">
          <span>{{ n.text }}</span>
        </li>
      </ul>
    </div>

    <div class="actions">
      <button class="btn amber" type="button" @click="openComposer">Add your note</button>
      <p class="fine">Only you can see your note — come leave a real one at the cart.</p>
    </div>

    <dialog ref="dlg" class="composer" aria-labelledby="compose-title">
      <form method="dialog" @submit.prevent="stick">
        <h3 id="compose-title">Write a note</h3>
        <div class="pad" :style="{ '--c': color }">
          <label for="note-text" class="sr-only">Your note (up to {{ MAX }} characters)</label>
          <textarea id="note-text" v-model="draft" :maxlength="MAX" rows="3" placeholder="best popcorn on this street…" required></textarea>
          <span class="count" aria-live="polite">{{ draft.length }}/{{ MAX }}</span>
        </div>
        <fieldset class="swatches">
          <legend class="sr-only">Note colour</legend>
          <label v-for="c in COLORS" :key="c" :style="{ '--c': c }">
            <input v-model="color" type="radio" name="nc" :value="c" /><span class="sr-only">Colour {{ c }}</span>
          </label>
        </fieldset>
        <div class="row">
          <button type="button" class="btn ghost" @click="dlg.close()">Cancel</button>
          <button type="submit" class="btn amber" :disabled="!draft.trim()">Stick it on</button>
        </div>
      </form>
    </dialog>
  </section>
</template>

<style scoped>
.wallsec { padding: clamp(72px, 12vw, 140px) 16px; max-width: 1200px; margin: 0 auto; }
.head { text-align: center; margin-bottom: 30px; }
.head p { color: var(--ink-dim); max-width: 52ch; margin: .6rem auto 0; }
.wall { position: relative; height: clamp(520px, 80vh, 720px); border-radius: 8px; overflow: hidden; touch-action: pan-y;
  background: radial-gradient(70% 80% at 50% 30%, #FFE3A8, #E9C891 55%, #B98A52); border: 16px solid #B97C3E;
  box-shadow: inset 0 0 0 1px rgba(0,0,0,.3), inset 0 10px 30px rgba(120,70,20,.35), 0 20px 50px rgba(0,0,0,.5); }
.lattice { position: absolute; inset: 0; pointer-events: none; z-index: 1;
  background: linear-gradient(90deg, transparent calc(25% - 7px), #B97C3E calc(25% - 7px) calc(25% + 7px), transparent calc(25% + 7px)) 0 0 / 100% 100%,
    linear-gradient(90deg, transparent calc(50% - 7px), #B97C3E calc(50% - 7px) calc(50% + 7px), transparent calc(50% + 7px)),
    linear-gradient(90deg, transparent calc(75% - 7px), #B97C3E calc(75% - 7px) calc(75% + 7px), transparent calc(75% + 7px)),
    linear-gradient(180deg, transparent calc(50% - 6px), #B97C3E calc(50% - 6px) calc(50% + 6px), transparent calc(50% + 6px));
  filter: drop-shadow(0 3px 3px rgba(60,30,8,.35)); }

.notes { list-style: none; margin: 0; padding: 0; position: absolute; inset: 8px; z-index: 3; }
.note { touch-action: pan-y; position: absolute; width: clamp(92px, 14vw, 128px); aspect-ratio: 1; padding: 10px; cursor: grab; user-select: none;
  background: linear-gradient(180deg, rgba(255,255,255,.35), transparent 40%, rgba(90,58,16,.12)), var(--c);
  color: #2A2A3A; font: 600 clamp(1rem, 1.7vw, 1.18rem)/1.1 var(--f-hand); display: flex; align-items: center; justify-content: center;
  text-align: center; transform: rotate(var(--rot)); box-shadow: 1px 3px 4px rgba(0,0,0,.35); transition: box-shadow .2s, transform .2s;
  overflow-wrap: anywhere; }
.note::after { content: ''; position: absolute; right: 0; bottom: 0; border-style: solid; border-width: 0 0 12px 12px;
  border-color: transparent transparent rgba(0,0,0,.12) transparent; }
.note::before { content: ''; position: absolute; top: -9px; left: 50%; width: 46%; height: 18px; transform: translateX(-50%) rotate(-3deg);
  background: repeating-linear-gradient(45deg, rgba(255,255,255,.35) 0 4px, transparent 4px 8px), var(--tape, rgba(232,67,42,.55));
  box-shadow: 0 1px 2px rgba(0,0,0,.15); opacity: .85; }
.note:nth-child(3n+1)::before { --tape: rgba(120,190,220,.6); }
.note:nth-child(3n+2)::before { --tape: rgba(245,200,70,.65); }
.note { border-radius: 1px 1px 6px 1px / 1px 1px 14px 1px; }
/* paper flutter: notes settle onto the glass when the wall comes into view */
.wallsec:not(.is-on) .note { transform: rotate(calc(var(--rot) + 8deg)) translateY(-6px); }
.is-on .note { animation: flutter .7s var(--d) ease-out both; }
@keyframes flutter { 0% { transform: rotate(calc(var(--rot) + 10deg)) translateY(-8px) } 55% { transform: rotate(calc(var(--rot) - 4deg)) } 100% { transform: rotate(var(--rot)) } }
.note.lift { cursor: grabbing; z-index: 10; animation: none; transform: rotate(calc(var(--rot) * .4)) scale(1.08); box-shadow: 6px 16px 22px rgba(0,0,0,.45); }
.note.mine { outline: 2px dashed rgba(42,42,58,.35); outline-offset: -6px; }
.note.slap { animation: slap .55s cubic-bezier(.2,1.6,.4,1) both; }
@keyframes slap { 0% { transform: rotate(var(--rot)) scale(1.6); opacity: 0 } 60% { transform: rotate(var(--rot)) scale(.94); opacity: 1 } 100% { transform: rotate(var(--rot)) scale(1) } }
.note:focus-visible { outline: 3px solid var(--amber); outline-offset: 2px; }
.actions { display: grid; justify-items: center; gap: 10px; margin-top: 26px; }
.fine { color: var(--ink-dim); font-size: .92rem; margin: 0; text-align: center; }
.composer { border: 0; padding: 0; background: transparent; color: var(--ink); }
.composer::backdrop { background: rgba(5,4,3,.7); }
.composer form { background: var(--night-2); border: 1px solid rgba(255,213,138,.25); border-radius: 14px; padding: 22px; width: min(360px, 88vw); }
.composer h3 { font: 700 1.3rem var(--f-display); margin: 0 0 14px; }
.pad { position: relative; background: var(--c); padding: 14px; transform: rotate(-1.5deg); box-shadow: 2px 6px 12px rgba(0,0,0,.4); }
textarea { width: 100%; border: 0; background: transparent; resize: none; color: #2A2A3A; font: 600 1.35rem/1.2 var(--f-hand); outline: none; }
.count { position: absolute; right: 10px; bottom: 6px; font: 500 .75rem var(--f-body); color: #4b4b5e; }
.swatches { border: 0; padding: 0; margin: 16px 0; display: flex; gap: 10px; }
.swatches label { width: 30px; height: 30px; border-radius: 6px; background: var(--c); cursor: pointer; position: relative; }
.swatches input { position: absolute; inset: 0; opacity: 0; margin: 0; cursor: pointer; }
.swatches label:has(input:checked) { outline: 3px solid var(--amber); outline-offset: 2px; }
.swatches label:has(input:focus-visible) { outline: 3px solid #fff; }
.row { display: flex; justify-content: flex-end; gap: 10px; }
@media (prefers-reduced-motion: reduce) { .is-on .note, .note.slap { animation: none; } .wallsec:not(.is-on) .note { transform: rotate(var(--rot)); } }
</style>
