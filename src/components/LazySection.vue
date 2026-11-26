<script setup>
// Mounts a below-the-fold section only when it comes within ~1 screen of the viewport,
// so its code is downloaded and rendered on demand instead of at startup.
import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
const props = defineProps({ load: { type: Function, required: true }, minHeight: { type: String, default: '100vh' } })
const el = ref(null)
const comp = shallowRef(null)
let io
async function mount() { io && io.disconnect(); comp.value = (await props.load()).default }
onMounted(() => {
  window.addEventListener('fuskit:mount-all', mount, { once: true }) // the quick menu needs every section in place
  if (!('IntersectionObserver' in window)) return mount()
  io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) mount() }, { rootMargin: '100% 0px' })
  io.observe(el.value)
  // a link like #menu or #visit must land on real content
  if (location.hash && location.hash !== '#') mount()
})
onBeforeUnmount(() => { io && io.disconnect(); window.removeEventListener('fuskit:mount-all', mount) })
defineExpose({ mount })
</script>

<template>
  <component :is="comp" v-if="comp" />
  <div v-else ref="el" class="lazy-ph" :style="{ minHeight }" aria-hidden="true"></div>
</template>
