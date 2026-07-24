<template>
    <div class="iiif-viewer">
        <div ref="viewerElement" class="iiif-viewer__canvas"></div>
    </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import OpenSeadragon from 'openseadragon'
import { useTimingStore } from '@/stores/timing'

const viewerElement = ref(null)
const timing = useTimingStore()
let viewer

onMounted(() => {
    viewer = OpenSeadragon({
        element: viewerElement.value,
        tileSources: {
            type: 'image',
            url: timing.currentPage.image,
        },
        showNavigationControl: false,
    })
})

//turn the displayed sheet-music page whenever the timeline reaches the next one
watch(
    () => timing.currentPage.image,
    (image) => {
        viewer?.open({ type: 'image', url: image })
    }
)

onBeforeUnmount(() => {
    viewer?.destroy()
})
</script>

<style scoped>
.iiif-viewer {
    position: relative;
    width: 100%;
    height: 100%;
    background: #f3f3f3;
}

.iiif-viewer__canvas {
    width: 100%;
    height: 100%;
}
</style>
