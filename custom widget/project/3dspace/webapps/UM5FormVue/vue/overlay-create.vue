<template>
    <div class='overlayCreate'>
        <v-btn class='closeBtn' small dark icon color='error' @click='close()'><v-icon dark>close</v-icon></v-btn>
        <div class='overlayPanel'>
            <slot></slot>
        </div>
    </div>
</template>

<style scoped>
.overlayCreate {
    display: block;
    position: absolute;
    height: 100%;
    width: 100%;
    background-color: rgba(0, 0, 0, 0.25);
}

.overlayCreate > .overlayPanel {
    position: absolute;
    top: 1.5em;
    bottom: 1.5em;
    left: 1.5em;
    right: 1.5em;
    overflow: auto;
    background-color: white;
    border: 1px solid #b1b1b1;
    border-radius: 0.25em;
    padding: 0.25em;
}
.overlayCreate > .closeBtn {
    position: absolute;
    top: 0.5em;
    right: 0.5em;
    z-index: 1;
    border-radius: 1.1em;
    width: 2.2em;
    min-width: unset;
    height: 2.2em;
    min-height: unset;
}
</style>

<script>
define(["vue", "UM5Form/Utils"], function(Vue, Utils) {
    return Vue.component("overlay-create", {
        template: template,
        props: [],
        data: function() {
            return {};
        },
        computed: {},
        methods: {
            close: function() {
                this.$emit("close");
            }
        }
    });
});
</script>