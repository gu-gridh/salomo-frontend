<template>
    <div class="main-layout" :class="{ 'main-layout--explore': activeTab === 'explore' }">
        <nav class="tabs">
            <button v-for="item in tabs" :key="item.value" class="tab"
                :class="{ 'tab--active': activeTab === item.value }" type="button" @click="selectTab(item.value)">
                {{ item.label }}
            </button>
        </nav>

        <main class="tab-panel">
            <Home v-show="activeTab === 'home'" />
            <Introduction v-show="activeTab === 'intro'" />
            <Explore v-if="exploreLoaded" v-show="activeTab === 'explore'" />
            <Summary v-show="activeTab === 'summary'" />
            <Bibliography v-show="activeTab === 'bibliography'" />
        </main>

        <Footer v-if="activeTab !== 'explore'" />
    </div>
</template>

<script setup>
import Footer from '@/components/Footer.vue'
import Bibliography from '@/views/Bibliography.vue'
import Explore from '@/views/Explore.vue'
import Home from '@/views/Home.vue'
import Introduction from '@/views/Introduction.vue'
import Summary from '@/views/Summary.vue'
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
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100vh;
}

@media (min-width: 1025px) {
    .main-layout--explore > .tabs {
        position: absolute;
        top: 0;
        left: 0;
        z-index: 20;
        background: rgb(255 255 255 / 60%);
        padding-bottom: 0;
        overflow: hidden;
        border-radius: 8px;
    }

    .main-layout--explore .tab--active {
        background: rgb(255 166 0 / 75%);
    }
}

.tabs {
    display: flex;
    flex: none;
    padding: 0 0 10px 40px;
}

.tab-panel {
    flex: 1;
    min-height: 0;
    overflow: auto;
}

.tab {
    padding: 12px 18px;
    border: 0;
    background: transparent;
    color: #2a2f36;
    cursor: pointer;
    font: inherit;
    font-weight: 300;
    font-size: 1.5em;
}

.tab--active {
    background: #ffa600;
    color: #ffffff;
}

@media (max-width: 1024px) {
    .tabs {
        width: 100%;
        padding: 0 0 8px;
    }

    .tab {
        flex: 1 1 0;
        min-width: 0;
        padding: 10px 4px;
        font-size: clamp(0.8rem, 4vw, 1.25rem);
    }
}
</style>
