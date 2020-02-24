<template>
    <div class='listItems'>
        <clipboard-item v-for="(item,i) in items" :key='i' :item="item" @remove-item='$emit("remove-item",i,item)'></clipboard-item>
    </div>
</template>

<style scoped>
</style>

<script>
define(["vue", "vueloader!current/vue/clipboard-item"], function(Vue) {
    return Vue.component("list-clipboard-items", {
        template: template,
        props: ["items"],
        data: function() {
            return {};
        },
        methods: {}
    });
});
</script>