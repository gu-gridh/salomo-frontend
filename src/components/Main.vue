<template>
    <div class="main-layout">
        <nav class="tabs">
            <button v-for="item in tabs" :key="item.value" class="tab"
                :class="{ 'tab--active': activeTab === item.value }" type="button" @click="selectTab(item.value)">
                {{ item.label }}
            </button>
        </nav>

        <main class="tab-panel">
            <section v-show="activeTab === 'home'">Home</section>
            <section v-show="activeTab === 'intro'">Introduction</section>
            <Explore v-if="exploreLoaded" v-show="activeTab === 'explore'" />
            <section v-show="activeTab === 'summary'">Summary</section>
            <section v-show="activeTab === 'bibliography'">Bibliography</section>
        </main>
    </div>
</template>

<script setup>
import Explore from '@/views/Explore.vue'
import { ref } from 'vue'
import { useTimingStore } from '@/stores/timing'

const activeTab = ref('home')
const exploreLoaded = ref(false)
const timing = useTimingStore()

const tabs = [
    { label: 'Home', value: 'home' },
    { label: 'Introduction', value: 'intro' },
    { label: 'Explore', value: 'explore' },
    { label: 'Summary', value: 'summary' },
    { label: 'Bibliography', value: 'bibliography' },
]

function selectTab(value) {
    activeTab.value = value

    if (value !== 'explore') {
        timing.isPlaying = false
    }

    if (value === 'explore') {
        exploreLoaded.value = true
    }
}
</script>

<style scoped>
.main-layout {
    display: flex;
    flex-direction: column;
    height: 100vh;
}

.tabs {
    display: flex;
    flex: none;
}

.tab-panel {
    flex: 1;
    min-height: 0;
}

.tab {
    padding: 12px 18px;
    border: 0;
    background: transparent;
    color: #2a2f36;
    cursor: pointer;
    font: inherit;
}

.tab--active {
    border-bottom-color: #1976d2;
    color: #1976d2;
}
</style>
