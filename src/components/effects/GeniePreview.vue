<template>
    <span class="genie-preview" :class="{
        'genie-preview--visible': visible,
        'genie-preview--settled': settledOpen,
    }">
        <canvas ref="canvas" aria-hidden="true"></canvas>
        <img :src="src" :alt="alt" :class="{ 'genie-preview__image--visible': settledOpen }">
    </span>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
    src: { type: String, required: true },
    alt: { type: String, default: '' },
    open: Boolean,
})

const WIDTH = 200
const HEIGHT = 100
const DURATION = 300
const TIMELINE_OFFSET = -19
const NECK_WIDTH = 20
const canvas = ref(null)
const visible = ref(false)
const settledOpen = ref(false)
const image = new Image()
let progress = 0
let frame

function ease(value) {
    return 1 - Math.pow(1 - value, 3)
}

function animationEase(value) {
    return 1 - Math.pow(1 - value, 1.5)
}

function draw() {
    const context = canvas.value?.getContext('2d')
    if (!context || !image.complete) return

    context.clearRect(0, 0, WIDTH, HEIGHT)
    canvas.value.style.transform = `translateY(${TIMELINE_OFFSET * (1 - progress)}px)`

    const imageRatio = image.naturalWidth / image.naturalHeight
    const targetRatio = WIDTH / HEIGHT
    const sourceWidth = imageRatio > targetRatio
        ? image.naturalHeight * targetRatio
        : image.naturalWidth
    const sourceHeight = imageRatio > targetRatio
        ? image.naturalHeight
        : image.naturalWidth / targetRatio
    const sourceX = (image.naturalWidth - sourceWidth) / 2
    const sourceY = (image.naturalHeight - sourceHeight) / 2

    for (let y = 0; y < HEIGHT; y += 1) {
        const row = y / HEIGHT
        const rowProgress = Math.max(0, Math.min(1, (progress - (1 - row) * 0.28) / 0.72))
        const width = NECK_WIDTH + (WIDTH - NECK_WIDTH) * ease(rowProgress)
        const destinationY = progress * y

        context.drawImage(
            image,
            sourceX, sourceY + y * sourceHeight / HEIGHT,
            sourceWidth, sourceHeight / HEIGHT + 1,
            (WIDTH - width) / 2, destinationY,
            width, Math.max(1.5, progress + 1)
        )
    }
}

function animate(open) {
    cancelAnimationFrame(frame)
    visible.value = true
    settledOpen.value = false

    const start = progress
    const target = open ? 1 : 0
    const startedAt = performance.now()
    const duration = DURATION * Math.abs(target - start)

    function tick(now) {
        const elapsed = duration ? Math.min(1, (now - startedAt) / duration) : 1
        progress = start + (target - start) * animationEase(elapsed)
        draw()

        if (elapsed < 1) {
            frame = requestAnimationFrame(tick)
        } else if (open) {
            settledOpen.value = true
        } else {
            visible.value = false
        }
    }

    frame = requestAnimationFrame(tick)
}

onMounted(() => {
    canvas.value.width = WIDTH
    canvas.value.height = HEIGHT
    image.onload = () => props.open && animate(true)
    image.src = props.src
})

watch(() => props.open, (open) => {
    if (image.complete && image.naturalWidth) animate(open)
})

onBeforeUnmount(() => cancelAnimationFrame(frame))
</script>

<style scoped>
.genie-preview {
    visibility: hidden;
}

.genie-preview--visible {
    visibility: visible;
}

.genie-preview--settled {
    background: #ffffff;
    outline: 1px solid #909090;
}

canvas,
img {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
}

img {
    opacity: 0;
}

.genie-preview__image--visible {
    opacity: 1;
}
</style>
