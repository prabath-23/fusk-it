// Jump to a part of the page from anywhere (the wooden menu standee, the wheel's menu sheet).
// Sections below the hero load lazily and the page snaps section by section, so a long jump first
// asks every section to mount, pauses snapping, and turns it back on once the scroll has settled.
import { reducedMotion } from './env.js'

export const SECTIONS = [
  { id: 'hero', label: 'The storefront', ta: 'கடை' },
  { id: 'menu', label: "Tonight's menu", ta: 'மெனு' },
  { id: 'free', label: 'Free food', ta: 'இலவச உணவு' },
  { id: 'wallsec', label: 'Leave a note', ta: 'குறிப்பு' },
  { id: 'toys', label: 'The toy shelf', ta: 'பொம்மைகள்' },
  { id: 'cta', label: 'Popcorn', ta: 'பாப்கார்ன்' },
  { id: 'visit', label: 'Find a cart', ta: 'கடைகள்' },
]

export function goTo(id) {
  const html = document.documentElement, smooth = !reducedMotion()
  window.dispatchEvent(new Event('fuskit:mount-all'))
  html.style.scrollSnapType = 'none'
  const done = () => setTimeout(() => { html.style.scrollSnapType = '' }, 150)
  setTimeout(() => {
    const el = id === 'hero' ? null : document.querySelector(`main > section.${id}`)
    const top = el ? el.getBoundingClientRect().top + window.scrollY - (parseFloat(getComputedStyle(html).getPropertyValue('--nav')) || 0) : 0
    let restored = false
    const finish = () => { if (restored) return; restored = true; window.removeEventListener('scrollend', finish); done() }
    window.addEventListener('scrollend', finish)
    setTimeout(finish, 3000)
    window.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' })
    if (Math.abs(window.scrollY - top) < 2) finish()
  }, 120) // give newly mounted sections a moment to lay out
}
