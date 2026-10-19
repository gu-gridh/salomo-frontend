<template>
    <section class="page-view">
        <h1>Introduction</h1>

        <!-- Add the Kircher Cipher -->
         <KircherCipher />
    </section>
</template>

<script>
import KircherCipher from '@/components/KircherCipher.vue';

export default {
    components: {
        KircherCipher
    }
}
</script>

<style scoped>

</style>