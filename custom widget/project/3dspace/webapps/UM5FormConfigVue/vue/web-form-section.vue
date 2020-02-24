<template>
    <div class='sectionBlock flex xs12'>
        <div :class='["sectionHead",(item===selectedItem ? "selected":"")]' @click.stop="toggleExpand" :title='getHint()' :style='getStyle()'>
            <v-icon v-if='item.expanded' :style='getStyle()'>arrow_drop_up</v-icon>
            <v-icon v-else :style='getStyle()'>arrow_drop_down</v-icon>
            {{item.label}}
        </div>
        <div v-if='item.expanded' class='sectionContent'>
            <web-form-list-fields :items='item.childs' :selected-item="selectedItem" @select-item='selectItem' @item-drop='itemDrop' :edit-mode='editMode' :in-form-creator="inFormCreator" :data-object='dataObject' @error='error' @refresh-vue='refreshVue' @create-attached-object='createAttachedObject'></web-form-list-fields>
        </div>
    <div>
</template>

<style scoped>
.sectionBlock {
    border: 1px solid lightgrey;
    margin-top: 0.25em;
    margin-bottom: 0.5em;
}
.sectionHead {
    border-bottom: 1px solid lightgrey;
    background-color: #e4e4e4;
}
.sectionHead:hover {
    background-color: rgb(217, 237, 255);
}
.sectionHead.selected {
    color: blue;
}
.sectionBlock:hover {
    border-color: rgb(146, 200, 245);
}
</style>

<script>
define(["vue"], function(Vue) {
    return Vue.component("web-form-section", {
        template: template,
        props: ["item", "selectedItem", "editMode", "dataObject", "inFormCreator"],
        methods: {
            toggleExpand: function() {
                this.item.expanded = !this.item.expanded;
                this.selectMe();
            },
            selectMe: function() {
                this.$emit("select-item", this.item);
            },
            selectItem: function(itemSelected) {
                this.$emit("select-item", itemSelected);
            },
            itemDrop: function(where, item) {
                this.$emit("item-drop", where, item);
            },
            getHint: function() {
                return this.item.hint;
            },
            getStyle: function() {
                let res = "";
                if (this.item.display && this.item.display.color) {
                    res += "color:" + this.item.display.color + ";";
                }
                if (this.item.display && this.item.display.background) {
                    res += "background-color:" + this.item.display.background + ";";
                }
                return res;
            },
            error: function() {
                this.$emit("error", ...arguments);
            },
            refreshVue: function() {
                this.$emit("refresh-vue", ...arguments);
            },
            createAttachedObject: function() {
                console.log("emit : create-attached-object");
                this.$emit("create-attached-object", ...arguments);
            }
        }
    });
});
</script>