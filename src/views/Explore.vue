<template>
    <div class="explore-page">
        <div class="top-content">
            <Splitter.Root class="model-section" :disabled="!isDesktop">
                <Splitter.Panel class="model-panel" :default-size="60.6" :min-size="20">
                    <ModelView />
                </Splitter.Panel>
                <Splitter.Handle v-if="isDesktop" class="panel-resizer"
                    title="Drag or use arrow keys to resize panels">
                    <span class="panel-resizer__grip"></span>
                </Splitter.Handle>
                <Splitter.Panel class="sheet-panel" :default-size="39.4" :min-size="20">
                    <div ref="desktopViewer" class="desktop-viewer"></div>
                </Splitter.Panel>
            </Splitter.Root>

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
import { Splitter } from '@vuetify/v0'
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
    gap: 0;
}

.model-section {
    display: flex;
    flex: 1;
    min-height: 0;
    margin-bottom: 0;
}

.model-panel,
.sheet-panel {
    flex-shrink: 1 !important;
    overflow: hidden;
}

.desktop-viewer {
    position: relative;
    height: 100%;
}

.model-section > .panel-resizer {
    flex: 0 0 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    align-self: stretch;
    border: 0;
    background: #e0e0e0;
    cursor: col-resize;
    touch-action: none;
    user-select: none;
}

.panel-resizer:hover,
.panel-resizer:focus-visible,
.panel-resizer[data-state="drag"] {
    background-color: #ccc;
}

.panel-resizer__grip {
    width: 3px;
    height: 48px;
    border-radius: 2px;
    background: #666;
    pointer-events: none;
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

    .model-panel {
        flex: 1 !important;
    }

    .sheet-panel,
    .model-section > .panel-resizer {
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
