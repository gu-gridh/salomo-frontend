<template>
    <div class="iiif-viewer">
        <div ref="viewerElement" class="iiif-viewer__canvas"></div>
    </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import OpenSeadragon from 'openseadragon'

const viewerElement = ref(null)
let viewer

onMounted(() => {
    viewer = OpenSeadragon({
        element: viewerElement.value,
        tileSources: {
            type: 'image',
            url: `${import.meta.env.BASE_URL}sheet1.jpg`,
        },
        showNavigationControl: false,
    })
})

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
