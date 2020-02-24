<template>
    <div class='separatorV'></div>
</template>

<style scoped>
/* divs adjacent siblings will have a left border*/
div.separatorV + div {
    border-left: 1px solid lightgrey;
}
</style>

<script>
define(["vue"], function(Vue) {
    return Vue.component("web-form-separator-v", {
        template: template,
        props: ["item"],
        methods: {}
    });
});
</script>