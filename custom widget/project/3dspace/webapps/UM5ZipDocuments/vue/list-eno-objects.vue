<template>
    <div class='listEnoObjs'>
        <eno-object v-for='(item,i) in items' :key='"enoObj-"+i' :item='item' @remove='$emit("remove-item",i)'>
        </eno-object>
    </div>
</template>

<style scoped>
</style>

<script>
define(["vue", "vueloader!current/vue/eno-object"], function(Vue) {
    return Vue.component("list-eno-objects", {
        template: template,
        props: ["items"],
        data: function() {
            return {
                dragOver: false
            };
        },
        methods: {
            drop: function(event) {
                this.dragOver = false;
                if (event && event.dataTransfer) {
                    let data = event.dataTransfer.getData("text");
                    this.$emit("drop-on", data);
                } else {
                    console.warn("Drop not managed, no dataTransfer found");
                }
            }
        }
    });
});
</script>