<template>
    <div class="explore-page">
        <div class="top-content">
            <section class="model-section">
                <ModelView />
            </section>

            <AudioPlayer />
            <SheetTimeline />
        </div>
        <div class="bottom-content">
            <BottomInterface />
        </div>
    </div>
</template>

<script setup>
import AudioPlayer from '@/components/AudioPlayer.vue'
import ModelView from '@/components/ModelView.vue'
import SheetTimeline from '@/components/SheetTimeline.vue'
import BottomInterface from '@/views/BottomInterface.vue'
</script>

<style scoped>
.explore-page {
    display: flex;
    flex-direction: column;
    gap: 24px;
    height: 100%;
    overflow: hidden;
}

.top-content {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    padding: 0 32px 100px;
}

.model-section {
    flex: 1;
    min-height: 0;
    margin-bottom: 24px;
}

.bottom-content {
    flex: 1;
    min-height: 0;
}
</style>
