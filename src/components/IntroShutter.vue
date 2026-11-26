<script setup>
// "Shutter up": a closed rolling shutter ratchets open (pure CSS keyframes, no animation library needed
// at startup), then the cart's lights come on.
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { rattle } from '../lib/sound.js'

const emit = defineEmits(['lights', 'done'])
const skipBtn = ref(null)
const run = ref(false)
let timers = [], finished = false

function finish() {
  if (finished) return
  finished = true
  timers.forEach(clearTimeout)
  emit('lights'); emit('done')
}
const skip = () => finish()

onMounted(() => {
  skipBtn.value?.focus({ preventScroll: true })
  timers.push(setTimeout(() => (run.value = true), 16)) // not rAF: rAF can stall in background tabs
  timers.push(
    setTimeout(() => rattle(1.3), 350),
    setTimeout(() => emit('lights'), 1000), // lights start flickering as the shutter clears the window
    setTimeout(finish, 2700),
  )
})
onBeforeUnmount(() => timers.forEach(clearTimeout))
</script>

<template>
  <div class="intro" role="dialog" aria-label="Opening the cart">
    <div class="shutter" :class="{ run }" aria-hidden="true">
      <div class="slats"></div>
      <div class="bar"><span class="lock"></span></div>
    </div>
    <button ref="skipBtn" class="skip" type="button" @click="skip">Skip intro</button>
  </div>
</template>

<style scoped>
/* the shutter hangs below the cart's sign housing and rolls up into it; the sign stays in view above */
.intro { position: fixed; inset: var(--nav, 0px) 0 0; z-index: 50; pointer-events: none; overflow: hidden; }
.shutter { position: absolute; inset: 0 0 -2px; will-change: transform; pointer-events: auto;
  box-shadow: 0 30px 60px rgba(0,0,0,.6), inset 0 10px 14px -6px rgba(0,0,0,.7); }
/* ratchety rise: two short lifts that catch and drop back a little, then a run to the top */
.shutter.run { animation: shutter-up 1.85s .35s both; }
@keyframes shutter-up {
  0%   { transform: translateY(0);       animation-timing-function: cubic-bezier(.2,.8,.3,1) }
  10%  { transform: translateY(-7%);     animation-timing-function: ease-in }
  14%  { transform: translateY(-5.5%);   animation-timing-function: cubic-bezier(.2,.8,.3,1) }
  25%  { transform: translateY(-19%);    animation-timing-function: ease-in }
  29%  { transform: translateY(-17.5%);  animation-timing-function: cubic-bezier(.55,0,.85,.35) }
  100% { transform: translateY(-101%) }
}
.slats { position: absolute; inset: 0;
  background:
    linear-gradient(90deg, rgba(0,0,0,.55), transparent 12%, transparent 88%, rgba(0,0,0,.55)),
    repeating-linear-gradient(180deg, #8C8F94 0 2px, #6B6E73 2px 9px, #45484C 9px 20px, #1C1D20 20px 23px, #0B0B0C 23px 24px); }
.slats::after { content: ''; position: absolute; inset: 0; opacity: .25; mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9 .05' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
.bar { position: absolute; left: 0; right: 0; bottom: 0; height: 38px;
  background: linear-gradient(#9A9DA2, #5A5D61 45%, #2A2B2E); border-top: 1px solid #c9ccd1; }
.lock { position: absolute; left: 50%; top: 9px; width: 46px; height: 20px; margin-left: -23px; border-radius: 4px;
  background: linear-gradient(#D7B46A, #8A6A26); box-shadow: inset 0 1px 0 #f3dfa8, 0 2px 4px rgba(0,0,0,.6); }
.skip { position: absolute; right: 16px; bottom: 56px; pointer-events: auto; font: 600 .9rem var(--f-body);
  color: var(--ink); background: rgba(11,10,9,.7); border: 1px solid rgba(255,213,138,.5); border-radius: 999px;
  padding: .55rem 1rem; cursor: pointer; }
.skip:focus-visible { outline: 2px solid var(--amber); outline-offset: 2px; }
</style>
