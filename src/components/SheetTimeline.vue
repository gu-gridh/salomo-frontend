<template>
    <div class="sheet-timeline" aria-label="Music sheet timeline">
        <div class="sheet-timeline__track">
            <div
                v-for="sheet in sheetsWithStart"
                :key="sheet.id"
                class="sheet-timeline__item"
                :style="{ flex: `${sheet.duration} 1 0` }"
            >
                <button
                    type="button"
                    class="sheet-timeline__sheet"
                    @click="seekToSheet(sheet)"
                ></button>
                <span class="sheet-timeline__preview">
                    <img class="sheet-timeline__preview-image" :src="sheet.image" :alt="`Sheet ${sheet.id}`">
                </span>
            </div>
            <div class="sheet-timeline__playhead" :style="{ left: `${progressPercent}%` }"></div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { sheetTimeline } from '@/sheetTimeline'
import { useTimingStore } from '@/stores/timing'

const timing = useTimingStore()
const timelineDuration = computed(() => sheetTimeline.reduce((total, sheet) => total + sheet.duration, 0))
const totalDuration = computed(() => timelineDuration.value || 1)
const sheetsWithStart = computed(() => {
    let start = 0

    return sheetTimeline.map((sheet) => {
        const sheetWithStart = { ...sheet, start }
        start += sheet.duration

        return sheetWithStart
    })
})
const progressPercent = computed(() => {
    const currentTime = Math.min(Math.max(timing.time, 0), totalDuration.value)

    return (currentTime / totalDuration.value) * 100
})

function seekToSheet(sheet) {
    timing.time = sheet.start
}
</script>

<style scoped>
.sheet-timeline {
    width: 100%;
    padding-top: 10px;
}

.sheet-timeline__track {
    position: relative;
    display: flex;
    gap: 3px;
    width: 100%;
    height: 18px;
    overflow: visible;
}

.sheet-timeline__item {
    position: relative;
    min-width: 12px;
    height: 100%;
}

.sheet-timeline__sheet {
    display: block;
    width: 100%;
    height: 100%;
    border: 2px solid #909090;
    background: #ffffff;
    cursor: pointer;
    padding: 0;
}

.sheet-timeline__sheet:hover {
    border-color: #707070;
}

.sheet-timeline__preview {
    position: absolute;
    top: 28px;
    left: 50%;
    display: none;
    width: 180px;
    height: 90px;
    max-width: min(180px, 80vw);
    overflow: hidden;
    border: 1px solid #909090;
    background: #ffffff;
    pointer-events: none;
    transform: translateX(-50%);
    z-index: 2;
}

.sheet-timeline__preview-image {
    display: block;
    width: 100%;
}

.sheet-timeline__item:hover .sheet-timeline__preview {
    display: block;
}

.sheet-timeline__playhead {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 14px;
    background: #ffa600;
    pointer-events: none;
    transform: translateX(-50%);
    z-index: 1;
}
</style>
