<template>
    <div class="explore-page">
        <div class="top-content">
            <section class="model-section">
                <ModelView />
                <div ref="desktopViewer" class="desktop-viewer"></div>
            </section>

            <AudioPlayer />
            <SheetTimeline />
        </div>

        <div class="bottom-content">
            <Teleport :to="desktopViewer || 'body'" :disabled="!isDesktop || !desktopViewer">
                <BottomInterface />
            </Teleport>
        </div>
    </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import AudioPlayer from '@/components/AudioPlayer.vue'
import ModelView from '@/components/ModelView.vue'
import SheetTimeline from '@/components/SheetTimeline.vue'
import BottomInterface from '@/views/BottomInterface.vue'

const desktopViewer = ref(null)
const desktopQuery = window.matchMedia('(min-width: 1025px)')
const isDesktop = ref(desktopQuery.matches)

function updateDesktop(event) {
    isDesktop.value = event.matches
}

onMounted(() => desktopQuery.addEventListener('change', updateDesktop))
onBeforeUnmount(() => desktopQuery.removeEventListener('change', updateDesktop))
</script>

<style scoped>
.explore-page {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
}

.top-content {
    position: relative;
    z-index: 4;
    display: flex;
    flex: 1 1 0;
    flex-direction: column;
    min-height: 0;
    overflow: visible;
    padding: 0 32px;
}

.model-section {
    display: flex;
    flex: 1;
    min-height: 0;
    margin-bottom: 24px;
}

.model-section > * {
    flex: 1;
    min-width: 0;
}

.desktop-viewer {
    position: relative;
}

.top-content > :not(.model-section) {
    flex: none;
}

.bottom-content {
    display: none;
}

@media (min-width: 1025px) {
    .top-content {
        display: grid;
        grid-template-rows: minmax(0, 1fr) auto auto;
        padding-bottom: 16px;
    }

    .model-section > * {
        min-height: 0;
    }

    .model-section > .desktop-viewer {
        flex: .65;
    }
}

@media (max-width: 1024px) {
    .explore-page {
        height: 100%;
        min-height: 100%;
        overflow-x: hidden;
        overflow-y: auto;
    }

    .top-content {
        display: grid;
        grid-template-rows: minmax(240px, 1fr) auto auto;
        gap: 16px;
        flex: 1 0 45% !important;
        min-height: 470px;
        padding: 0 12px;
    }

    .model-section {
        min-height: 240px;
        height: auto;
        margin-bottom: 0;
    }

    .desktop-viewer {
        display: none;
    }

    .bottom-content {
        display: block;
        position: relative;
        flex: 1 0 55% !important;
        height: auto;
        min-height: 360px;
        margin-top: 20px;
    }
}
</style>
