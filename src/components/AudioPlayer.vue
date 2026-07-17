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
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
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
let unwatchTime
let unwatchPlayback

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
        progressColor: '#ffa600',
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

    unwatchTime = watch(
        () => timing.time,
        (time) => {
            if (!wavesurfer || Math.abs(wavesurfer.getCurrentTime() - time) < 0.2) return

            wavesurfer.setTime(time)
        }
    )

    unwatchPlayback = watch(
        () => timing.isPlaying,
        (isPlaying) => {
            if (isPlaying === wavesurfer.isPlaying()) return

            if (isPlaying) wavesurfer.play()
            else wavesurfer.pause()
        }
    )
})

onBeforeUnmount(() => {
    unwatchTime?.()
    unwatchPlayback?.()
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
    width: 104px;
    padding: 14px 22px 15px;
    border: 0;
    border-radius: 8px;
    background: #000000;
    box-shadow: 0 0.1rem 1rem rgba(0, 0, 0, 0.5);
    color: #ffffff;
    cursor: pointer;
    font-family: "Oswald", sans-serif;
    font-size: 1.2em;
    font-weight: 300;
    line-height: 1;
    letter-spacing: 0.5px;
    transition: background-color 150ms ease, transform 150ms ease;
}

.audio-player__button:hover,
.audio-player__button:focus-visible {
    background: #171717;
}

.audio-player__button:hover {
    transform: scale(1.05);
}

.audio-player__button:focus-visible {
    outline: 2px solid #ffffff;
    outline-offset: 2px;
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
