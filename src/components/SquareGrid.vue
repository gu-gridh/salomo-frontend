<template>
  <div class="grid-container">
    <h3>Audio Timeline Sync Grid (90 Steps)</h3>
    <div class="grid">
      <button
        v-for="index in 90"
        :key="index"
        :class="['square', { active: activeSquare === index }]"
        @click="selectSquare(index)"
      >
        {{ index }}
      </button>
    </div>
    <p v-if="activeSquare">Selected Step: <strong>{{ activeSquare }} / 90</strong></p>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  currentTime: {
    type: Number,
    default: 0
  },
  duration: {
    type: Number,
    default: 100 // Fallback if audio metadata hasn't loaded yet
  }
});

const emit = defineEmits(['square-clicked']);

// Math: Map current audio time into a square index between 1 and 90
const activeSquare = computed(() => {
  if (!props.duration) return 1;
  
  // Calculate percentage of song played (0 to 1)
  const progressPercentage = props.currentTime / props.duration;
  
  // Distribute across 90 steps, bound between 1 and 90
  const calculatedSquare = Math.ceil(progressPercentage * 90);
  return Math.max(1, Math.min(90, calculatedSquare));
});

// When user clicks a square, calculate what timestamp that represents
const selectSquare = (index) => {
  // Convert square index (1-90) back into a percentage fraction
  const targetPercentage = (index - 0.5) / 90; // Uses the midpoint of the square for smoother jumping
  const targetTime = targetPercentage * props.duration;
  
  emit('square-clicked', targetTime);
};
</script>

<style scoped>
.grid-container {
  margin: 20px 0;
  padding: 15px;
  background: #2a2a2a;
  border-radius: 8px;
  color: #fff;
}
.grid {
  display: grid;
  grid-template-columns: repeat(10, 1fr); /* 10x9 clean grid layout */
  gap: 6px;
  margin-bottom: 15px;
}
.square {
  aspect-ratio: 1;
  background: #444;
  border: 1px solid #555;
  color: #ccc;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
}
.square:hover {
  background: #555;
  color: #fff;
}
.square.active {
  background: #00adb5;
  color: #fff;
  font-weight: bold;
  box-shadow: 0 0 8px #00adb5;
  border-color: #00fff2;
}
</style>