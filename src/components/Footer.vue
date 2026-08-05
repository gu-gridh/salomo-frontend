<template>
    <footer class="app-footer">
        <span>Högskolan för scen och musik</span>
        <span class="app-footer__divider"></span>
        <span>GU / GRIDH</span>
    </footer>
</template>

<style scoped>
.app-footer {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: flex-end;
    gap: 38px;
    height: 70px;
    padding: 0 64px;
    border-radius: 0 0 28px 28px;
    background: #eeeeee;
    color: #3b3b3b;
    font-size: 1.75rem;
    font-weight: 100;
}

.app-footer__divider {
    width: 1px;
    height: 40px;
    background: #999999;
}

@media (max-width: 1024px) {
    .app-footer {
        display: none;
    }
}
</style>
