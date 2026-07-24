<template>
    <div class="audio-player">
        <button type="button" class="audio-player__button" @click="togglePlayback">
            {{ timing.isPlaying ? 'Pause' : 'Play' }}
        </button>
        <div class="audio-player__meta">
            <span class="audio-player__time">{{ formatTime(timing.time) }} / {{ formatTime(timing.totalDuration) }}</span>
            <span class="audio-player__sonata">{{ timing.currentSonata.title }}</span>
        </div>
        <div ref="waveformEl" class="audio-player__waveform">
            <canvas ref="canvasEl" class="audio-player__canvas" @pointerdown="onPointerDown"
                @pointermove="onPointerMove" @pointerup="onPointerUp" @pointercancel="onPointerCancel"></canvas>
        </div>
    </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { timeline, totalDuration } from '@/settings/timeline'
import { useTimingStore } from '@/stores/timing'

const timing = useTimingStore()
const waveformEl = ref(null)
const canvasEl = ref(null)

const HEIGHT = 96
const COLORS = {
    base: '#d8dce3',
    baseActive: '#b9c0cb',
    played: '#ffc966',
    playedActive: '#ffa600',
    activeBand: 'rgba(255, 166, 0, 0.10)',
    silent: '#e9ebef',
    cursor: '#2a2f36',
    label: '#8a919c',
}

//---------------------------------------------------------------- audio engine
//timing.time (global clock over all sonatas) is the single source of truth.
//While playing, the active sonata's <audio> element drives the clock; the
//silent sonata (6, no recording) is driven by requestAnimationFrame instead.
const audioElements = new Map()
let activeSonata = null
let rafId = null
let lastTick = null

function sonataAt(time) {
    return timeline.find((sonata) => time < sonata.offset + sonata.duration) ?? timeline.at(-1)
}

function ensureAudio(sonata) {
    if (!sonata?.audio) return null

    let el = audioElements.get(sonata.id)
    if (!el) {
        el = new Audio(sonata.audio)
        el.preload = 'auto'
        el.addEventListener('loadedmetadata', () => {
            if (el._pendingSeek != null) {
                el.currentTime = el._pendingSeek
                el._pendingSeek = null
            }
        })
        audioElements.set(sonata.id, el)
    }

    return el
}

function setAudioTime(el, time) {
    if (el.readyState >= 1) el.currentTime = time
    else el._pendingSeek = time
}

function pauseAllExcept(sonata) {
    for (const [id, el] of audioElements) {
        if (id !== sonata?.id) el.pause()
    }
}

//Position the engine at timing.time and honour timing.isPlaying.
function syncEngine() {
    activeSonata = sonataAt(timing.time)
    pauseAllExcept(activeSonata)
    lastTick = null

    const el = ensureAudio(activeSonata)
    if (el) {
        const local = timing.time - activeSonata.offset
        if (Math.abs((el.currentTime || 0) - local) > 0.05) setAudioTime(el, local)
        if (timing.isPlaying) el.play().catch(() => {})
        else el.pause()
    }
}

function advanceToNext() {
    const next = timeline[timeline.indexOf(activeSonata) + 1]

    if (!next) {
        timing.time = totalDuration
        timing.isPlaying = false
        return
    }

    timing.time = next.offset
    activeSonata = next
    lastTick = null
    pauseAllExcept(next)

    const el = ensureAudio(next)
    if (el) {
        setAudioTime(el, 0)
        el.play().catch(() => {})
    }
}

function tick(now) {
    if (!timing.isPlaying || !activeSonata) return

    if (activeSonata.audio) {
        const el = audioElements.get(activeSonata.id)
        const local = el.ended ? activeSonata.duration : el.currentTime

        timing.time = activeSonata.offset + local
        if (el.ended || local >= activeSonata.duration - 0.02) advanceToNext()
        else if (activeSonata.duration - local < 15) {
            //warm up the next sonata's audio shortly before the boundary
            ensureAudio(timeline[timeline.indexOf(activeSonata) + 1])
        }
    } else {
        //silent segment: advance the clock manually
        if (lastTick != null) timing.time += (now - lastTick) / 1000
        if (timing.time >= activeSonata.offset + activeSonata.duration - 0.001) advanceToNext()
    }

    lastTick = now
    rafId = requestAnimationFrame(tick)
}

function startLoop() {
    cancelAnimationFrame(rafId)
    lastTick = null
    rafId = requestAnimationFrame(tick)
}

function togglePlayback() {
    timing.isPlaying = !timing.isPlaying
}

//sync watchers keep play() inside the user-gesture call stack (autoplay policies)
watch(() => timing.isPlaying, (isPlaying) => {
    if (isPlaying) {
        if (timing.time >= totalDuration - 0.01) timing.time = 0
        syncEngine()
        startLoop()
    } else {
        cancelAnimationFrame(rafId)
        pauseAllExcept(null)
    }
}, { flush: 'sync' })

watch(() => timing.seekVersion, () => {
    syncEngine()
    if (timing.isPlaying) startLoop()
}, { flush: 'sync' })

//---------------------------------------------------------------- waveform
let peaksData = null
let resizeObserver
const scrubbing = ref(false)
let scrubTime = null

function timeAtEvent(event) {
    const rect = canvasEl.value.getBoundingClientRect()
    const ratio = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1)

    return ratio * totalDuration
}

function onPointerDown(event) {
    scrubbing.value = true
    scrubTime = timeAtEvent(event)
    canvasEl.value.setPointerCapture(event.pointerId)
    draw()
}

function onPointerMove(event) {
    if (!scrubbing.value) return

    scrubTime = timeAtEvent(event)
    draw()
}

function onPointerUp(event) {
    if (!scrubbing.value) return

    scrubbing.value = false
    timing.seek(timeAtEvent(event)) //everything (audio included) syncs on release
    scrubTime = null
}

function onPointerCancel() {
    scrubbing.value = false
    scrubTime = null
    draw()
}

function draw() {
    const canvas = canvasEl.value
    if (!canvas || !waveformEl.value) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const width = waveformEl.value.clientWidth
    const height = HEIGHT

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr
        canvas.height = height * dpr
        canvas.style.height = `${height}px`
    }

    const context = canvas.getContext('2d')
    context.setTransform(dpr, 0, 0, dpr, 0, 0)
    context.clearRect(0, 0, width, height)

    const mid = height / 2
    const active = timing.currentSonata

    for (const sonata of timeline) {
        const x0 = (sonata.offset / totalDuration) * width
        const segmentWidth = (sonata.duration / totalDuration) * width
        const isActive = sonata.id === active.id

        if (isActive) {
            context.fillStyle = COLORS.activeBand
            context.fillRect(x0, 0, segmentWidth, height)
        }

        if (sonata.silent || !peaksData?.[sonata.id]) {
            //silent sonata: dashed centre line instead of a waveform
            context.strokeStyle = isActive ? COLORS.baseActive : COLORS.silent
            context.lineWidth = 2
            context.setLineDash([4, 4])
            context.beginPath()
            context.moveTo(x0 + 2, mid)
            context.lineTo(x0 + segmentWidth - 2, mid)
            context.stroke()
            context.setLineDash([])
        } else {
            const { peaks } = peaksData[sonata.id]

            for (let x = Math.ceil(x0); x < x0 + segmentWidth; x += 1) {
                const localRatio = (x - x0) / segmentWidth
                const bucket = Math.min(peaks.length - 1, Math.floor(localRatio * peaks.length))
                const amplitude = Math.max(peaks[bucket], 0.02)
                const barHeight = amplitude * (height * 0.92)
                const pixelTime = (x / width) * totalDuration
                const played = pixelTime <= timing.time

                context.fillStyle = played
                    ? (isActive ? COLORS.playedActive : COLORS.played)
                    : (isActive ? COLORS.baseActive : COLORS.base)
                context.fillRect(x, mid - barHeight / 2, 1, barHeight)
            }
        }

        //sonata boundary + label
        if (sonata.offset > 0) {
            context.fillStyle = '#ffffff'
            context.fillRect(x0 - 1, 0, 2, height)
        }
        context.fillStyle = COLORS.label
        context.font = '10px sans-serif'
        context.fillText(sonata.silent ? `${sonata.id} · no audio` : `${sonata.id}`, x0 + 4, 11)
    }

    //cursor (scrub position while dragging, playhead otherwise)
    const cursorTime = scrubbing.value && scrubTime != null ? scrubTime : timing.time
    const cursorX = (cursorTime / totalDuration) * width
    context.fillStyle = COLORS.cursor
    context.fillRect(cursorX - 1, 0, 2, height)
}

watch(() => [timing.time, timing.currentSonata.id], () => draw())

onMounted(async () => {
    resizeObserver = new ResizeObserver(() => draw())
    resizeObserver.observe(waveformEl.value)

    try {
        const response = await fetch('/peaks.json')
        peaksData = await response.json()
    } catch (error) {
        console.error('Failed to load waveform peaks', error)
    }

    draw()
})

onBeforeUnmount(() => {
    cancelAnimationFrame(rafId)
    resizeObserver?.disconnect()

    for (const el of audioElements.values()) {
        el.pause()
        el.src = ''
    }
    audioElements.clear()
})

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, '0')

    return `${minutes}:${remainingSeconds}`
}
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

.audio-player__meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
    width: 130px;
    flex: none;
}

.audio-player__time {
    color: #2a2f36;
    font-variant-numeric: tabular-nums;
}

.audio-player__sonata {
    color: #8a919c;
    font-size: 0.8em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.audio-player__waveform {
    flex: 1;
    min-width: 0;
}

.audio-player__canvas {
    display: block;
    width: 100%;
    cursor: pointer;
    touch-action: none;
}
</style>
