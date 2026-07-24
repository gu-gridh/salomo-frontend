<template>
  <div class="test-environment">
    <h1>Audio & Grid Sync Test Node</h1>
    
    <AudioPlayer 
      :audioUrl="audioTrack" 
      :currentTime="sharedTime"
      @position-changed="handleAudioRelease"
      @time-updated="handleTimeTicker"
      @duration-loaded="handleDuration"
    />

    <SquareGrid 
      :currentTime="sharedTime" 
      :duration="totalDuration"
      @square-clicked="handleGridJump"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import AudioPlayer from '@/components/AudioPlayer.vue';
import SquareGrid from '@/components/SquareGrid.vue';

// Dummy track or real backend URL/Blob cache
const audioTrack = ref('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');

const sharedTime = ref(0);
const totalDuration = ref(100); // Sensible fallback until audio file mounts

// 1. Triggered continuous-style as audio naturally plays forward
const handleTimeTicker = (time) => {
  sharedTime.value = time;
};

// 2. Triggered when audio metadata arrives
const handleDuration = (duration) => {
  totalDuration.value = duration;
};

// 3. Catches the slider drag-release event -> alerts the grid
const handleAudioRelease = (releasedTime) => {
  sharedTime.value = releasedTime;
  console.log(`Audio slider released at: ${releasedTime}s. Syncing grid.`);
};

// 4. Catches grid box clicks -> forces audio framework to seek to target spot
const handleGridJump = (calculatedTime) => {
  sharedTime.value = calculatedTime;
  console.log(`Grid clicked. Snapping audio timeline to: ${calculatedTime}s.`);
};
</script>

<style>
.test-environment {
  max-width: 600px;
  margin: 40px auto;
  padding: 20px;
  background: #1e1e1e;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}
h1 {
  color: #fff;
  font-family: sans-serif;
  font-size: 1.5rem;
  margin-bottom: 20px;
}
</style>