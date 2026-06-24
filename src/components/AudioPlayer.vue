<template>
    <div class="audio-player">
        <button type="button" class="audio-player__button" @click="togglePlayback">
            {{ timing.isPlaying ? 'Pause' : 'Play' }}
        </button>
        <span class="audio-player__time">{{ formatTime(timing.time) }} / {{ formatTime(duration) }}</span>
        <div ref="waveform" class="audio-player__waveform"></div>
    </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import WaveSurfer from 'wavesurfer.js'
import { useTimingStore } from '@/stores/timing'

const props = defineProps({
    src: {
        type: String,
        default: '/chopin.mp3',
    },
})

const timing = useTimingStore()
const duration = ref(0)
const waveform = ref(null)
let wavesurfer

function togglePlayback() {
    wavesurfer?.playPause()
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, '0')

    return `${minutes}:${remainingSeconds}`
}

onMounted(() => {
    wavesurfer = WaveSurfer.create({
        container: waveform.value,
        url: props.src,
        height: 96,
        waveColor: '#d8dce3',
        progressColor: '#1976d2',
        cursorColor: '#2a2f36',
        dragToSeek: true,
    })

    wavesurfer.on('interaction', () => {
        wavesurfer.play()
    })

    wavesurfer.on('timeupdate', (time) => {
        timing.time = time
    })

    wavesurfer.on('ready', (audioDuration) => {
        duration.value = audioDuration
    })

    wavesurfer.on('play', () => {
        timing.isPlaying = true
    })

    wavesurfer.on('pause', () => {
        timing.isPlaying = false
    })
})

onBeforeUnmount(() => {
    wavesurfer?.destroy()
})
</script>

<style scoped>
.audio-player {
    display: flex;
    align-items: center;
    gap: 16px;
    width: 100%;
}

.audio-player__button {
    width: 72px;
    padding: 8px 14px;
    border: 1px solid #c8ced8;
    background: #ffffff;
    color: #2a2f36;
    cursor: pointer;
    font: inherit;
}

.audio-player__time {
    width: 88px;
    color: #2a2f36;
    font-variant-numeric: tabular-nums;
}

.audio-player__waveform {
    flex: 1;
}
</style>
