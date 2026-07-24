import { defineStore } from 'pinia'
import { pages, timeline, totalDuration } from '@/settings/timeline'

export const useTimingStore = defineStore('timing', {
    state: () => ({
        time: 0.0,
        isPlaying: false,
        seekVersion: 0, //bumped on every explicit seek so the audio engine can reposition
    }),
    getters: {
        totalDuration: () => totalDuration,
        currentSonata: (state) =>
            timeline.find((sonata) => state.time < sonata.offset + sonata.duration) ?? timeline.at(-1),
        currentPage: (state) => {
            let current = pages[0]

            for (const page of pages) {
                if (page.start > state.time) break
                current = page
            }

            return current
        },
    },
    actions: {
        //Single entry point for jumping the whole app (audio, pawn, sheet, waveform) to a time.
        seek(time) {
            this.time = Math.min(Math.max(time, 0), totalDuration)
            this.seekVersion++
        },
        seekToPage(page) {
            this.seek(page.start)
        },
    },
})
