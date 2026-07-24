import { defineStore } from 'pinia'
import { sheetTimeline } from '@/settings/sheetTimeline'

export const useTimingStore = defineStore('timing', {
    state: () => ({
        time: 0.0,
        isPlaying: false,
    }),
    getters: {
        currentSheet: (state) => {
            let endTime = 0

            return sheetTimeline.find((sheet) => {
                endTime += sheet.duration
                return state.time < endTime
            }) ?? sheetTimeline.at(-1)
        },
    },
})
