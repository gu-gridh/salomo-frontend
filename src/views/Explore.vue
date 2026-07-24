<template>
    <div ref="page" class="explore-page" :class="{ 'explore-page--resizing': resizing }">
        <div class="top-content" :style="{ flexGrow: splitRatio }">
            <section class="model-section">
                <ModelView />
            </section>

            <AudioPlayer />
            <SheetTimeline />
        </div>

        <div class="split-divider" title="Drag to resize · double-click to reset" @pointerdown="startResize"
            @dblclick="resetSplit">
            <span class="split-divider__grip"></span>
            <button v-if="splitRatio !== DEFAULT_SPLIT" type="button" class="split-divider__reset"
                title="Reset to the standard split" @pointerdown.stop @click="resetSplit">
                Reset
            </button>
        </div>

        <div class="bottom-content" :style="{ flexGrow: 1 - splitRatio }">
            <BottomInterface />
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import AudioPlayer from '@/components/AudioPlayer.vue'
import ModelView from '@/components/ModelView.vue'
import SheetTimeline from '@/components/SheetTimeline.vue'
import BottomInterface from '@/views/BottomInterface.vue'

const DEFAULT_SPLIT = 0.5
const page = ref(null)
const splitRatio = ref(DEFAULT_SPLIT)
const resizing = ref(false)

function resetSplit() {
    splitRatio.value = DEFAULT_SPLIT
}

function startResize(event) {
    const divider = event.currentTarget
    resizing.value = true
    divider.setPointerCapture(event.pointerId)

    function onMove(moveEvent) {
        const rect = page.value.getBoundingClientRect()
        //pixel clamps: the top section must fit model + audio + timeline,
        //the bottom section keeps enough room for the sheet music
        const minTop = Math.min(380, rect.height / 2)
        const maxTop = Math.max(rect.height - 240, minTop)
        const top = Math.min(Math.max(moveEvent.clientY - rect.top, minTop), maxTop)

        splitRatio.value = top / rect.height
    }

    function onUp() {
        resizing.value = false
        divider.removeEventListener('pointermove', onMove)
        divider.removeEventListener('pointerup', onUp)
        divider.removeEventListener('pointercancel', onUp)
    }

    divider.addEventListener('pointermove', onMove)
    divider.addEventListener('pointerup', onUp)
    divider.addEventListener('pointercancel', onUp)
}
</script>

<style scoped>
.explore-page {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
}

.explore-page--resizing {
    cursor: row-resize;
    user-select: none;
}

.top-content {
    position: relative;
    z-index: 2;
    display: flex;
    flex: 1 1 0;
    flex-direction: column;
    min-height: 0;
    overflow: visible;
    padding: 0 32px;
}

.model-section {
    flex: 1;
    min-height: 0;
    margin-bottom: 24px;
}

/* the audio player and sheet timeline keep their natural height */
.top-content > :not(.model-section) {
    flex: none;
}

.split-divider {
    position: relative;
    z-index: 3;
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    height: 18px;
    margin-top: 6px;
    cursor: row-resize;
    touch-action: none;
}

.split-divider:hover .split-divider__grip,
.explore-page--resizing .split-divider__grip {
    background: #9f9e9e;
}

.split-divider__grip {
    width: 64px;
    height: 5px;
    border-radius: 3px;
    background: #d0cfcf;
    transition: background-color 150ms ease;
}

.split-divider__reset {
    position: absolute;
    right: 32px;
    padding: 3px 12px 4px;
    border: 0;
    border-radius: 8px;
    background: #000000;
    color: #ffffff;
    cursor: pointer;
    font-family: "Oswald", sans-serif;
    font-size: 0.8em;
    font-weight: 300;
    letter-spacing: 0.5px;
}

.split-divider__reset:hover {
    background: #171717;
}

.bottom-content {
    position: relative;
    z-index: 1;
    flex: 1 1 0;
    min-height: 0;
}
</style>
