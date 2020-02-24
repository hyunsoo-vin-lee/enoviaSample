<template>
    <div :class="['rootList', 'layout', 'row', 'wrap', (dragOver ? 'dragOverField':'')]" @dragenter.stop="dragOver=true" @dragleave.stop="dragOver=false;dragOverAfter=false;dragOverBefore=false;" @dragover.stop="dragOver=true">
        <div v-if="inFormCreator" :class='["flex", "xs12", "dropZone", "before", (dragOverBefore ? "dragOver":"")]' @dragenter.prevent="dragOverBefore=true;dragOverAfter=false;" @dragleave="dragOverBefore=false" @dragover.prevent="dragOverBefore=true" @drop.prevent.stop='drop("before")'>
            <v-icon>arrow_upward</v-icon>
        </div>
        <div v-for='(item,i) in items' :key='i' :is='getItemType(item)' :item='item' :selected-item="selectedItem" :edit-mode='editMode' :in-form-creator="inFormCreator" :data-object='dataObject' @select-item='selectItem' @item-drop='itemDrop' @error='error' @refresh-vue='refreshVue' @create-attached-object='createAttachedObject'>
        </div>
        <div v-if='items.length===0' class='emptyList flex xs12'>Empty</div>
        <div v-if="inFormCreator" :class='["flex", "xs12", "dropZone", "after", (dragOverAfter ? "dragOver":"")]' @dragenter.prevent="dragOverAfter=true;dragOverBefore=false;" @dragleave="dragOverAfter=false" @dragover.prevent="dragOverAfter=true" @drop.prevent.stop='drop("after")'>
            <v-icon>arrow_downward</v-icon>
        </div>
    </div>
</template>

<style scoped>
.rootList {
    position: relative;
    height: 100%;
    padding: 0.25em;
}

.emptyList {
    text-align: center;
}

.rootList > .dropZone {
    display: none;
}
.rootList.dragOverField > .dropZone {
    display: block;
    position: absolute;
    left: 0%;
    right: 0%;
    width: 100%;
    height: 2em;
    max-height: 45%;
    /*height: 40%;*/
    /*max-height: 2em;*/
    text-align: center;
    z-index: 1;
}
.rootList.dragOverField > .dropZone.dragOver {
    background-color: rgb(204, 231, 255, 0.5);
    border: 1px dotted rgb(86, 176, 255);
    border-radius: 0.1em;
    position: relative;
}
.rootList > .dropZone.before {
    /*top: -0.25em;*/
    top: 0em;
}
.rootList > .dropZone.after {
    /*bottom: -0.25em;*/
    bottom: 0em;
}

.rootList > .dropZone .v-icon {
    display: none;
}
.rootList > .dropZone.dragOver .v-icon {
    display: inline-block;
}
</style>

<script>
define(["vue"], function(Vue) {
    return Vue.component("web-form-list-fields", {
        template: template,
        props: ["items", "selectedItem", "editMode", "dataObject", "inFormCreator"],
        data: function() {
            return {
                dragOver: false,
                dragOverBefore: false,
                dragOverAfter: false
            };
        },
        methods: {
            getItemType: function(item) {
                let componentType = "";
                switch (item.type) {
                    case "field":
                        componentType = "web-form-field";
                        break;
                    case "rel":
                        componentType = "web-form-rel";
                        break;
                    case "separatorH":
                        componentType = "web-form-separator-h";
                        break;
                    case "separatorV":
                        componentType = "web-form-separator-v";
                        break;
                    case "section":
                        componentType = "web-form-section";
                        break;
                    default:
                        break;
                }
                return componentType;
            },
            selectItem: function(itemSelected) {
                this.$emit("select-item", itemSelected);
            },
            itemDrop: function(where, itemDropped) {
                console.log("itemDrop in fields list");
                this.$emit("item-drop", where, itemDropped);

                //Also reset the dragOver so all the drop zones are hidden when drop happens in a sub-component and if we still are showing some drop zone,
                // it can happen when dragleave isn't triggered when drop zones are overlapping each others
                this.dragOver = false;
                this.dragOverBefore = false;
                this.dragOverAfter = false;
            },
            drop: function(where) {
                //Reset for drop zones
                this.dragOver = false;
                this.dragOverBefore = false;
                this.dragOverAfter = false;

                let itemToUse;
                if (this.items.length === 0) {
                    itemToUse = { type: "tempToBeReplaced" };
                    this.items.push(itemToUse);
                    where = "replace";
                } else {
                    itemToUse = this.items[0];
                    if (where === "after") {
                        itemToUse = this.items[this.items.length - 1];
                    }
                }

                this.$emit("item-drop", where, itemToUse);
            },
            error: function() {
                this.$emit("error", ...arguments);
            },
            refreshVue: function() {
                this.$emit("refresh-vue", ...arguments);
            },
            createAttachedObject: function() {
                this.$emit("create-attached-object", ...arguments);
            }
        }
    });
});
</script>