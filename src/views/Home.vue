<template>
    <section class="home-page">
        <div class="home-copy">
            <h1>Salomo</h1>
            <h2>A project by Joel Speerstra</h2>
        </div>
    </section>
</template>

<style scoped>
.home-page {
    min-height: 100%;
    padding: 14px 5vw 60px;
    color: #24282d;
}

.home-copy {
    max-width: 900px;
}

h1,
h2 {
    margin: 0;
    font-family: 'Antic Didone', serif;
    font-style: normal;
    font-weight: 400;
}

h1 {
    width: 550px;
    font-size: 150px;
    line-height: 0.86;
    letter-spacing: -5px;
}

h2 {
    font-size: 65px;
    line-height: .85;
    letter-spacing: 0;
}

.home-subtitle {
    margin: 0;
    font-size: 64px;
    line-height: 0.78;
    letter-spacing: -2px;
}

@media (max-width: 760px) {
    .home-page {
        padding: 24px 24px 48px;
    }

    h1 {
        width: auto;
        font-size: clamp(76px, 22vw, 120px);
        letter-spacing: -3px;
    }

    .home-subtitle {
        font-size: clamp(36px, 10vw, 54px);
        line-height: 0.88;
        letter-spacing: -1px;
    }
}
</style>
