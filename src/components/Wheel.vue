<script setup>
// Wagon wheel. The inner group rotates (scroll-driven later); the shading overlay stays fixed,
// so light keeps coming from the same direction while the wheel rolls.
const props = defineProps({ r: { type: Number, default: 150 }, spokes: { type: Number, default: 16 } })
const R = props.r
const rimW = R * 0.2
const hub = R * 0.2
const spoke = `${-R * 0.06},${-hub + 2} ${R * 0.06},${-hub + 2} ${R * 0.038},${-(R - rimW * 0.55)} ${-R * 0.038},${-(R - rimW * 0.55)}`
</script>

<template>
  <g class="wheel">
    <g class="wheel-rot">
      <!-- spokes -->
      <g v-for="i in spokes" :key="i" :transform="`rotate(${(360 / spokes) * i})`">
        <polygon :points="spoke" fill="#A86A33" />
        <polygon :points="spoke" fill="url(#spokeShade)" />
      </g>
      <!-- felloe (rim) -->
      <circle :r="R" fill="none" stroke="#B07038" :stroke-width="rimW" />
      <circle :r="R + rimW / 2" fill="none" stroke="#3B220E" stroke-width="2.5" />
      <circle :r="R - rimW / 2" fill="none" stroke="#3B220E" stroke-width="2.5" />
      <!-- hub -->
      <circle :r="hub" fill="#7A4720" />
      <circle :r="hub" fill="none" stroke="#3A220F" stroke-width="4" />
      <circle v-for="i in 6" :key="'b' + i" :cx="0" :cy="-hub * 0.62" r="3.2" fill="#2A1A10" :transform="`rotate(${60 * i})`" />
      <circle :r="hub * 0.38" fill="url(#hubCap)" />
    </g>
    <!-- fixed lighting overlay -->
    <circle :r="R" fill="none" stroke="url(#rimShade)" :stroke-width="rimW + 2" />
    <circle :r="hub" fill="url(#hubShade)" />
  </g>
</template>
