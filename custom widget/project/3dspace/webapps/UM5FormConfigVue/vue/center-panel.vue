<template>
    <div id='centerContent'>
        <div style='text-align: right;'>
            <v-btn icon title='Copy Form' @click='doCopy'><v-icon>archive</v-icon></v-btn>
            <v-btn icon title='Paste Form' @click='doPaste' :disabled='clipboard===null'><v-icon>create</v-icon></v-btn>
            <v-btn-toggle v-model='editMode' dark mandatory>
                <v-btn small color='primary'>View</v-btn>
                <v-btn small color='primary'>Edit</v-btn>
            </v-btn-toggle>
        </div>
        <div style='max-height: calc(100% - 2em);overflow: auto;'>
            <web-form-list-fields :items='treeFormDefinition' :selected-item="selectedItem" :edit-mode='editMode' :in-form-creator="true" :data-object='dataObj' @select-item='selectItem' @item-drop='itemDrop'></web-form-list-fields>
        </div>
    </div>
</template>

<style scoped>
#centerContent {
    height: 100%;
}
</style>

<script>
define(["vue"], function(Vue) {
    return Vue.component("center-panel", {
        template: template,
        props: ["treeFormDefinition", "selectedItem"],
        data: function() {
            return {
                editMode: 0,
                dataObj: {},
                clipboard: null
            };
        },
        methods: {
            selectItem: function(itemSelected) {
                this.$emit("select-item", itemSelected);
            },
            itemDrop: function(where, itemDropped) {
                this.$emit("item-drop", where, itemDropped);
            },
            doCopy: function() {
                this.clipboard = this.treeFormDefinition;
            },
            doPaste: function() {
                this.$emit("set-form-content", this.clipboard);
            }
        }
    });
});
</script>
