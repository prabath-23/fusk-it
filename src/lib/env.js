// Small shared helpers. All storage access is wrapped: private windows and blocked storage must not break the page.
export const reducedMotion = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

export function storeGet(kind, key, fallback = null) {
  try { const v = window[kind].getItem(key); return v === null ? fallback : JSON.parse(v) } catch { return fallback }
}
export function storeSet(kind, key, value) {
  try { window[kind].setItem(key, JSON.stringify(value)) } catch { /* storage unavailable */ }
}

// v-light: adds .is-on the first time an element is mostly in view ("a light turns on").
// Also toggles .in-view so heavy animations can pause off-screen.
export const vLight = {
  mounted(el, binding) {
    const once = binding.value?.once !== false
    const io = new IntersectionObserver(([e]) => {
      el.classList.toggle('in-view', e.isIntersecting)
      if (e.isIntersecting) { el.classList.add('is-on'); if (once && binding.value?.stopAfter) io.disconnect() }
    }, { threshold: binding.value?.threshold ?? 0.3 })
    io.observe(el); el._lightIO = io
  },
  unmounted(el) { el._lightIO && el._lightIO.disconnect() },
}
