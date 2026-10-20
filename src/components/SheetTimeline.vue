<template>
    <div class="sheet-timeline">
        <div class="sheet-timeline__groups">
            <div v-for="sonata in timeline" :key="sonata.id" class="sheet-timeline__group"
                :style="{ left: `${sonataStartPercent(sonata)}%`, width: `${sonataWidthPercent(sonata)}%` }">
                <span class="sheet-timeline__group-name">{{ sonata.title }}</span>
                <span class="sheet-timeline__group-bracket"></span>
            </div>
        </div>
        <div class="sheet-timeline__track">
            <div v-for="page in pages" :key="page.snapIndex" class="sheet-timeline__item"
                @mouseenter="hoveredPage = page.snapIndex" @mouseleave="hoveredPage = null">
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
import { pages, timeline } from '@/settings/timeline'
import { useTimingStore } from '@/stores/timing'

const timing = useTimingStore()
const hoveredPage = ref(null)
const totalPages = pages.length

function sonataStartPercent(sonata) {
    return (sonata.pageStartIndex / totalPages) * 100
}

function sonataWidthPercent(sonata) {
    return (sonata.pages.length / totalPages) * 100
}

//playhead position within the currently active page (exact despite flex gaps)
const pageProgressPercent = computed(() => {
    const page = timing.currentPage
    const ratio = (timing.time - page.start) / page.duration

    return Math.min(Math.max(ratio, 0), 1) * 100
})
</script>

<style scoped>
.sheet-timeline {
    --sheet-timeline-min-width: 640px;
    position: relative;
    width: 100%;
    padding-top: 0;
}

.sheet-timeline__groups {
    position: relative;
    height: 28px;
    margin-bottom: 8px;
}

.sheet-timeline__group {
    position: absolute;
    top: 0;
    bottom: 0;
    min-width: 0;
}

.sheet-timeline__group-name {
    display: block;
    padding: 0 4px;
    color: #6b7280;
    font-size: 10px;
    letter-spacing: 0.3px;
    line-height: 1;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.sheet-timeline__group-bracket {
    position: absolute;
    right: 2px;
    bottom: 0;
    left: 2px;
    height: 12px;
    border-top: 1px solid #9ca3af;
    border-right: 1px solid #9ca3af;
    border-left: 1px solid #9ca3af;
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
    flex: 1 1 0;
    min-width: 6px;
    height: 100%;
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
    bottom: 28px;
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

@media (max-width: 1024px) {
    .sheet-timeline {
        overflow-x: auto;
        padding-bottom: 8px;
    }

    .sheet-timeline__groups {
        min-width: var(--sheet-timeline-min-width);
    }

    .sheet-timeline__track {
        min-width: var(--sheet-timeline-min-width);
    }

    .sheet-timeline__preview {
        display: none;
    }
}
</style>
