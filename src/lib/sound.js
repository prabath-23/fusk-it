// Optional shutter rattle, synthesised with WebAudio (no audio files). Muted by default.
import { ref } from 'vue'
export const soundOn = ref(false)
let ctx
function ac() {
  if (!ctx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = new C() }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}
export function rattle(duration = 1.2, ticks = 26) {
  if (!soundOn.value) return
  const a = ac(); if (!a) return
  const len = Math.floor(a.sampleRate * 0.03)
  const buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3)
  const t0 = a.currentTime + 0.02
  for (let i = 0; i < ticks; i++) {
    const src = a.createBufferSource(); src.buffer = buf
    const bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800 + Math.random() * 1600; bp.Q.value = 3
    const g = a.createGain(); g.gain.value = 0.18 * (0.6 + Math.random() * 0.4)
    src.connect(bp).connect(g).connect(a.destination)
    src.start(t0 + (duration * i) / ticks + Math.random() * 0.015)
  }
}

// tiny toy sounds (only when sound is on): a rubber squeak and a robot beep
function tone(type, f0, f1, dur, vol = 0.12, at = 0) {
  if (!soundOn.value) return
  const a = ac(); if (!a) return
  const t = a.currentTime + at, o = a.createOscillator(), g = a.createGain()
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur)
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur)
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.02)
}
export const squeakSound = () => { tone('sine', 1400, 2600, 0.12); tone('sine', 2400, 1300, 0.14, 0.1, 0.13) }
export const beepSound = () => { [0, .18, .36, .54].forEach((d, i) => tone('square', i % 2 ? 660 : 880, i % 2 ? 660 : 880, 0.1, 0.05, d)) }
