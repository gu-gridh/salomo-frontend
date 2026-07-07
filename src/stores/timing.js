import { defineStore } from 'pinia'

export const useTimingStore = defineStore('timing', {
    state: () => ({
        time: 0.0,
        isPlaying: false,
    }),
})
