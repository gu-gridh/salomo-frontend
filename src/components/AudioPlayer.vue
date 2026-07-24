<template>
  <div class="audio-player">
    <button @click="togglePlay" class="play-btn">
      {{ isPlaying ? 'Pause' : 'Play' }}
    </button>

    <span class="time">{{ formatTime(currentTime) }}</span>

    <input
      type="range"
      min="0"
      :max="duration || 100"
      :value="currentTime"
      @input="onSliderDrag"
      @change="onSliderRelease"
      class="slider"
    />

    <span class="time">{{ formatTime(duration) }}</span>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  audioUrl: {
    type: String,
    required: true,
  },
  // 1. RECEIVE CURRENT TIME FROM PARENT
  currentTime: {
    type: Number,
    default: 0
  }
});

// 2. ADD 'time-updated' TO EMITS
const emit = defineEmits(['position-changed', 'playing-state', 'duration-loaded', 'time-updated']);

const audio = new Audio();
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);
let isDragging = false;

const formatTime = (seconds) => {
  if (isNaN(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// 3. WATCH FOR GRID CLICKS FROM PARENT
// When parent says the time changed (grid click), force native player to jump
watch(() => props.currentTime, (newTime) => {
  if (!isDragging && Math.abs(audio.currentTime - newTime) > 0.5) {
    audio.currentTime = newTime;
    currentTime.value = newTime;
  }
});

const setupAudioListeners = () => {
  audio.addEventListener('loadedmetadata', () => {
    duration.value = audio.duration;
    emit('duration-loaded', audio.duration);
  });

  audio.addEventListener('timeupdate', () => {
    if (!isDragging) {
      currentTime.value = audio.currentTime;
      // 4. EMIT LIVE TICK TO PARENT (Moves the cyan box)
      emit('time-updated', audio.currentTime);
    }
  });

  audio.addEventListener('ended', () => {
    isPlaying.value = false;
    currentTime.value = 0;
    emit('playing-state', false);
    emit('time-updated', 0);
  });
};

const togglePlay = () => {
  if (isPlaying.value) {
    audio.pause();
    isPlaying.value = false;
  } else {
    audio.play().catch(err => console.error("Playback blocked:", err));
    isPlaying.value = true;
  }
  emit('playing-state', isPlaying.value);
};

const onSliderDrag = (event) => {
  isDragging = true;
  currentTime.value = parseFloat(event.target.value);
};

const onSliderRelease = (event) => {
  const targetTime = parseFloat(event.target.value);
  audio.currentTime = targetTime;
  isDragging = false;
  emit('position-changed', targetTime);
};

watch(() => props.audioUrl, (newUrl) => {
  if (!newUrl) return;
  const wasPlaying = isPlaying.value;
  audio.src = newUrl;
  audio.load();
  if (wasPlaying) {
    audio.play().catch(err => console.error("Auto-play failed:", err));
  } else {
    currentTime.value = 0;
  }
});

onMounted(() => {
  setupAudioListeners();
  if (props.audioUrl) {
    audio.src = props.audioUrl;
  }
});

onBeforeUnmount(() => {
  audio.pause();
  audio.src = '';
  audio.load();
});
</script>

<style scoped>
.audio-player {
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: sans-serif;
}
.play-btn {
  padding: 8px 16px;
  cursor: pointer;
}
.slider {
  flex-grow: 1;
  cursor: pointer;
}
.time {
  font-variant-numeric: tabular-nums; /* Prevents text shifting as numbers change */
}
</style>