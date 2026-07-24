<template>
    <div class="sheet-timeline">
        <div class="sheet-timeline__track">
            <div v-for="page in pages" :key="page.snapIndex" class="sheet-timeline__item" :class="{
                'sheet-timeline__item--sonata-start': page.pageInSonata === 1 && page.snapIndex !== 0,
            }" :style="{ flex: `${page.duration} 1 0` }" @mouseenter="hoveredPage = page.snapIndex"
                @mouseleave="hoveredPage = null">
                <button type="button" class="sheet-timeline__sheet" :class="{
                    'sheet-timeline__sheet--active': timing.currentPage.snapIndex === page.snapIndex,
                    'sheet-timeline__sheet--silent': page.silent,
                }" :title="`${page.sonataTitle} – page ${page.pageInSonata}`" @click="timing.seekToPage(page)"
                    @focus="hoveredPage = page.snapIndex" @blur="hoveredPage = null"></button>
                <div v-if="timing.currentPage.snapIndex === page.snapIndex" class="sheet-timeline__playhead"
                    :style="{ left: `${pageProgressPercent}%` }"></div>
                <GeniePreview class="sheet-timeline__preview" :src="page.image"
                    :alt="`${page.sonataTitle} page ${page.pageInSonata}`" :open="hoveredPage === page.snapIndex" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import GeniePreview from '@/components/effects/GeniePreview.vue'
import { pages } from '@/settings/timeline'
import { useTimingStore } from '@/stores/timing'

const timing = useTimingStore()
const hoveredPage = ref(null)

//playhead position within the currently active page (exact despite flex gaps)
const pageProgressPercent = computed(() => {
    const page = timing.currentPage
    const ratio = (timing.time - page.start) / page.duration

    return Math.min(Math.max(ratio, 0), 1) * 100
})
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
    min-width: 6px;
    height: 100%;
}

.sheet-timeline__item--sonata-start {
    margin-left: 8px;
}

.sheet-timeline__sheet {
    display: block;
    width: 100%;
    height: 100%;
    border: 2px solid #d0cfcf;
    background: #ffffff;
    cursor: pointer;
    padding: 0;
}

.sheet-timeline__sheet:hover {
    border-color: #9f9e9e;
}

.sheet-timeline__sheet--active {
    border-color: #ffa600;
    background: #fff3dd;
}

.sheet-timeline__sheet--silent {
    border-style: dashed;
    background: #f6f6f6;
}

.sheet-timeline__preview {
    position: absolute;
    top: 28px;
    left: 50%;
    width: 180px;
    height: 90px;
    max-width: min(180px, 80vw);
    overflow: visible;
    pointer-events: none;
    transform: translateX(-50%);
    z-index: 2;
}

.sheet-timeline__playhead {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 4px;
    background: #ffa600;
    pointer-events: none;
    transform: translateX(-50%);
    z-index: 1;
}
</style>
