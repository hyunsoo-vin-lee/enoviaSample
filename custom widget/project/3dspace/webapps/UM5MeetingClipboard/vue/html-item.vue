<template>
    <div class='htmlItem' v-html='content.data'>
    </div>
</template>

<style scoped>
</style>

<script>
define(["vue"], function(Vue) {
    return Vue.component("html-item", {
        template: template,
        props: ["content"],
        data: function() {
            return {};
        },
        methods: {}
    });
});
</script>