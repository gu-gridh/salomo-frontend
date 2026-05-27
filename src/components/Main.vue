<template>
    <div>

        <v-tabs v-model="tab" color="primary">
            <v-tab value="one">Home</v-tab>
            <v-tab value="two">Introduction</v-tab>
            <v-tab value="three">Explore</v-tab>
            <v-tab value="four">Summary</v-tab>
            <v-tab value="five">Bibliography</v-tab>
        </v-tabs>  

        <v-divider></v-divider>

        <v-tabs-window v-model="tab">
            <v-tabs-window-item value="one">
            <v-sheet class="pa-5">One</v-sheet> <!-- Components load here-->
            </v-tabs-window-item>
            <v-tabs-window-item value="two">
            <v-sheet class="pa-5">Two</v-sheet>
            </v-tabs-window-item>
            <v-tabs-window-item value="three">
            <v-sheet class="pa-5">Three</v-sheet>
            </v-tabs-window-item>
            <v-tabs-window-item value="four">
            <v-sheet class="pa-5">Four</v-sheet>
            </v-tabs-window-item>
            <v-tabs-window-item value="five">
            <v-sheet class="pa-5">Five</v-sheet>
            </v-tabs-window-item>
        </v-tabs-window>
    </div>
</template>


<script setup>
import { ref } from 'vue'

const tab = ref('one')


</script>