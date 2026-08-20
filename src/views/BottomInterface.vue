<template>
    <section class="bottom-interface">
        <ViewerMode v-model="activeMode" />
        <button v-if="showReset && activeMode !== 'comment'" type="button" class="reset-button"
            title="Reset to the standard split" @click="$emit('reset')">
            Reset
        </button>
        <ImageViewer v-if="activeMode !== 'comment'" />
        <CommentView v-else />
    </section>
</template>

<script setup>
import { ref } from 'vue'
import CommentView from '@/components/CommentView.vue'
import ImageViewer from '@/components/ImageViewer.vue'
import ViewerMode from '@/components/ViewerMode.vue'

defineProps({
    showReset: { type: Boolean, default: false },
})

defineEmits(['reset'])

const activeMode = ref('note')
</script>

<style scoped>
.bottom-interface {
    position: relative;
    height: 100%;
}

.reset-button {
    position: absolute;
    top: 16px;
    right: 24px;
    z-index: 10;
    padding: 3px 12px 4px;
    border: 0;
    border-radius: 8px;
    background: rgb(0 0 0 / 80%);
    color: #ffffff;
    cursor: pointer;
    font-family: "Oswald", sans-serif;
    font-size: 0.8em;
    font-weight: 300;
    letter-spacing: 0.5px;
}

.reset-button:hover {
    background: #171717;
}
</style>
