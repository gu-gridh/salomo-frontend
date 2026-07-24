<template>
    <section class="bottom-interface">
        <ViewerMode v-model="activeMode" />
        <IIIFViewer v-if="activeMode !== 'comment'" />
        <CommentView v-else />
    </section>
</template>

<script setup>
import { ref } from 'vue'
import CommentView from '@/components/CommentView.vue'
import IIIFViewer from '@/components/IIIFViewer.vue'
import ViewerMode from '@/components/ViewerMode.vue'

const activeMode = ref('note')
</script>

<style scoped>
.bottom-interface {
    position: relative;
    height: 100%;
}
</style>
