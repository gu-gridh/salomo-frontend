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
    min-height: 100vh;
}

.top-content {
    padding: 0 32px;
}

.model-section {
    height: 33vh;
    min-height: 220px;
    margin-bottom: 24px;
}
</style>
