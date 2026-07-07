<template>
    <div class="explore-page">
        <section class="model-section">
            <ModelView />
        </section>

        <AudioPlayer />
        <SheetTimeline />

        <h1>Explore</h1>
        <p>This is the Explore page.</p>
    </div>
</template>

<script setup>
import AudioPlayer from '@/components/AudioPlayer.vue'
import ModelView from '@/components/ModelView.vue'
import SheetTimeline from '@/components/SheetTimeline.vue'
</script>

<style scoped>
.explore-page {
    min-height: 100vh;
    padding: 0 32px;
}

.model-section {
    height: 33vh;
    min-height: 220px;
    margin-bottom: 24px;
}
</style>
