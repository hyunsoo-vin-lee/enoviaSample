<template>
    <div class='separatorH'></div>
</template>

<style scoped>
.separatorH {
    display: block;
    height: 1px;
    border-bottom: 1px solid lightgrey;
    box-sizing: border-box;
    width: 100%;
    margin-top: 0.25em;
    margin-bottom: 0.25em;
}
</style>

<script>
define(["vue"], function(Vue) {
    return Vue.component("web-form-separator-h", {
        template: template,
        props: ["item"],
        methods: {}
    });
});
</script>