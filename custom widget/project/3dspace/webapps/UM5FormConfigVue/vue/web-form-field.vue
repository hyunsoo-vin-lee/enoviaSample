<template>
    <div :class='getClasses()' @dragenter.stop="dragOver=true" @dragleave.stop="dragOver=false;dragOverAfter=false;dragOverBefore=false;" @dragover.stop="dragOver=true">
        <div :class='["label",(isMandatory()?"mandatory":""),(isDisabled()?"disabled":"")]' @click.stop='selectMe' :title='getHint()'>{{item.label}}</div>
        <v-checkbox v-if='item.display.type==="checkbox"' color='primary' hide-details class='shrink mt-0 pt-0' :readonly='isReadOnly()' :disabled='isDisabled()' v-model='dataObject[item.target]'></v-checkbox>
        <v-switch v-else-if='item.display.type==="switch"' color='primary' hide-details class='shrink mt-0 pt-0' :readonly='isReadOnly()' :disabled='isDisabled()' v-model='dataObject[item.target]'></v-switch>
        <v-text-field v-else-if='item.display.type==="text"' color='primary' placeholder=' ' hide-details class='mt-0 pt-0' :readonly='isReadOnly()' :disabled='isDisabled()' v-model='dataObject[item.target]' :title='dataObject[item.target]'></v-text-field>
        <v-select v-else-if='item.display.type==="select"' color='primary' placeholder=' ' hide-details class='mt-0 pt-0' :items='["abc","def","ijk"]' :readonly='isReadOnly()' :disabled='isDisabled()' v-model='dataObject[item.target]'></v-select>
        <ul v-else-if='item.display.type==="list"' class='listBlock pl-0'>
            <li v-for='(obj,i) in getList()' :key="i">{{obj}}</li>
        </ul>
        <v-textarea v-else-if='item.display.type==="textarea"' :rows='item.display.lines || 2' auto-grow color='primary' hide-details class='mt-0 pt-0' :readonly='isReadOnly()' :disabled='isDisabled()' v-model='dataObject[item.target]'></v-textarea>
        <div v-if='inFormCreator' :class='["dropZoneField", "before", (dragOverBefore ? "dragOver":"")]' @dragenter.prevent="dragOverBefore=true" @dragleave="dragOverBefore=false" @dragover.prevent="dragOverBefore=true" @drop.prevent.stop='drop("before")'>
            <v-icon>chevron_left</v-icon>
        </div>
        <div v-if='inFormCreator' :class='["dropZoneField", "after", (dragOverAfter ? "dragOver":"")]' @dragenter.prevent="dragOverAfter=true" @dragleave="dragOverAfter=false" @dragover.prevent="dragOverAfter=true" @drop.prevent.stop='drop("after")'>
            <v-icon>chevron_right</v-icon>
        </div>
    </div>
</template>

<style scoped>
.hoverField:hover {
    background-color: rgb(217, 237, 255);
}
.label {
    font-size: 1.1em;
    /*background-color: #f0f0f0;*/
    font-weight: bold;
    /*border-bottom: 1px solid #e4e4e4;*/
    padding-right: 1.25em;
}

.selected .label {
    color: blue;
}
.label.mandatory {
    color: red;
}
.label.disabled {
    font-weight: normal;
}
.flexibleContent {
    display: flex;
}
.flexibleContent .label {
    flex: initial;
}
.flexibleContent .v-text-field {
    flex: auto;
}
.flexibleContent .v-text-field input {
    padding: 0px;
}
.flexibleContent .v-text-field > .v-input__control > .v-input__slot::before {
    border-style: none; /*remove the underline*/
}
ul.listBlock {
    display: block;
}

.formField {
    position: relative;
}
.formField .dropZoneField {
    display: none;
}
.formField.dragOverField .dropZoneField {
    display: block;
    position: absolute;
    top: 0%;
    bottom: 0%;
    width: 49%;
    z-index: 1;
}
.formField .dropZoneField.dragOver {
    background-color: rgb(204, 231, 255, 0.5);
    border: 1px dotted rgb(86, 176, 255);
    border-radius: 0.1em;
}
.formField .dropZoneField.before {
    left: 0px;
    text-align: left;
}
.formField .dropZoneField.after {
    right: 0px;
    text-align: right;
}

.formField .dropZoneField .v-icon {
    display: none;
}
.formField .dropZoneField.dragOver .v-icon {
    display: inline-block;
}
.v-text-field input[type="text"] {
    text-overflow: ellipsis;
}
</style>

<script>
define(["vue"], function(Vue) {
    return Vue.component("web-form-field", {
        template: template,
        props: ["item", "selectedItem", "editMode", "dataObject", "inFormCreator"],
        data: function() {
            return {
                dragOver: false,
                dragOverBefore: false,
                dragOverAfter: false
            };
        },
        methods: {
            getClasses: function() {
                let cssClasses = ["hoverField", "flexibleContent", "formField"];
                if (this.editMode === 1 && this.item.editHidden && !this.item.isEditable) {
                    return ["hidden"];
                }
                if (this.item.display.mode == "flex") {
                    cssClasses.push("flex");
                    cssClasses.push("xs" + this.item.display.size);
                } else if (this.item.display.mode == "block") {
                    cssClasses.push("flex");
                    cssClasses.push("xs12");
                }

                if (this.item === this.selectedItem) {
                    cssClasses.push("selected");
                }

                if (this.dragOver) {
                    cssClasses.push("dragOverField");
                }
                return cssClasses;
            },
            selectMe: function() {
                this.$emit("select-item", this.item);
            },
            drop: function(where) {
                this.dragOver = false;
                this.dragOverBefore = false;
                this.dragOverAfter = false;

                this.$emit("item-drop", where, this.item);
            },
            isReadOnly: function() {
                //return this.editMode !== 1 || (this.editMode === 1 && !this.item.isEditable);//ok but not short enough :p
                return !(this.editMode === 1 && this.item.isEditable);
            },
            isDisabled: function() {
                return !this.item.isEditable && this.editMode === 1;
            },
            isMandatory: function() {
                return this.item.isEditable && this.editMode === 1 && this.item.mandatory;
            },
            getHint: function() {
                return this.item.hint;
            },
            getList: function() {
                let res = [];
                let info = this.dataObject[this.item.target];
                if (info) {
                    if (info.indexOf("\u0007")) {
                        res = this.dataObject[this.item.target].split("\u0007");
                    } else {
                        res = this.dataObject[this.item.target].split("|");
                    }
                }
                return res;
            }
        }
    });
});
</script>