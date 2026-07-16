<template>
    <nav class="viewer-mode-nav" aria-label="Viewer mode">
        <button v-for="item in items" :key="item.value" type="button" class="viewer-mode-nav__item"
            :class="{ 'viewer-mode-nav__item--active': modelValue === item.value }"
            :aria-pressed="modelValue === item.value" @click="$emit('update:modelValue', item.value)">
            {{ item.label }}
        </button>
    </nav>
</template>

<script setup>
defineProps({
    modelValue: { type: String, default: 'note' },
})

defineEmits(['update:modelValue'])

const items = [
    { label: 'Note', value: 'note' },
    { label: 'Annotation', value: 'annotation' },
    { label: 'Comment', value: 'comment' },
]
</script>

<style scoped>
.viewer-mode-nav {
    position: absolute;
    top: 28px;
    left: 50%;
    z-index: 10;
    display: flex;
    padding: 0 6px;
    border-radius: 8px;
    background: #000000;
    box-shadow: 0 0.1rem 1rem rgba(0, 0, 0, 0.5);
    transform: translateX(-50%);
    font-family: "Oswald", sans-serif;
    font-size: 1.0em;
    font-weight: 300;
    line-height: 1;
}

.viewer-mode-nav__item {
    margin: 5px;
    padding: 5px 10px 6px 10px;
    border: 0;
    background: transparent;
    color: #a7a7a7;
    font: inherit;
    letter-spacing: 0.5px;
    white-space: nowrap;
}

.viewer-mode-nav__item:hover,
.viewer-mode-nav__item:focus-visible,
.viewer-mode-nav__item--active {
    color: #ffffff;
}
</style>
