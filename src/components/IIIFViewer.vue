<template>
    <div class="iiif-viewer">
        <div ref="viewerElement" class="iiif-viewer__canvas"></div>
        <ViewerMode v-model="activeMode" />
    </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import OpenSeadragon from 'openseadragon'
import ViewerMode from '@/components/ViewerMode.vue'

const viewerElement = ref(null)
const activeMode = ref('note')
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
