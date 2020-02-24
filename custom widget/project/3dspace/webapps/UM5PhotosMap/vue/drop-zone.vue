<template>
    <div :class='["dropZone",(dragOver ? "dragOver" : "")]'
        @dragenter.stop="dragOver=true"
        @dragleave.stop="dragOver=false"
        @dragover.prevent.stop="dragOver=true"
        @drop.prevent.stop='drop($event)'>
        <slot>Drop an object here</slot>
    </div>
</template>

<style scoped>
.dropZone {
    box-sizing: border-box;
    text-align: center;
}

.dropZone.dragOver {
    background-color: rgba(220, 240, 255, 0.5);
    border: 1px dotted rgb(142, 206, 255);
}
</style>

<script>
define(["vue"], function(Vue) {
    return Vue.component("drop-zone", {
        template: template,
        props: [],
        data: function() {
            return {
                dragOver: false
            };
        },
        methods: {
            drop: function(event) {
                this.dragOver = false;
                if (event && event.dataTransfer) {
                    //let data = event.dataTransfer.getData("text");
                    this.$emit("drop-on", event);
                } else {
                    console.warn("Drop not managed, no dataTransfer found");
                }
            }
        }
    });
});
</script>