<script setup>
import { RouterView } from 'vue-router'

</script>

<template>
  <v-app>
    <RouterView />
  </v-app>
</template>

<style>
@font-face {
  font-family: 'Barlow Condensed';
  src: url('/Barlow_Condensed/BarlowCondensed-Light.ttf') format('truetype');
  font-weight: 300;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Barlow Condensed';
  src: url('/Barlow_Condensed/BarlowCondensed-Regular.ttf') format('truetype');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

:root {
  --v-font-body: 'Barlow Condensed', sans-serif;
  --v-font-heading: 'Barlow Condensed', sans-serif;
}

html,
body,
button,
input,
select,
textarea {
  font-family: 'Barlow Condensed', sans-serif;
}
</style>
