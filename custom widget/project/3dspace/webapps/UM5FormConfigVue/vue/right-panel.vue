<template>
    <div v-show="isOpened" id='rightContent'>
        <div v-if='selectedItem'>
            <div id='deleteIcon' title='Delete this item from the Form' @click.stop='deleteItem'><v-icon>delete</v-icon></div>
            <div>Type: {{selectedItem.type}}</div>
            <div>Info targetted: {{selectedItem.target}}</div>
            <div><v-text-field label='Label' v-model="selectedItem.label" hide-details color='primary'></v-text-field></div>
            <div v-if='selectedItem.type==="field" && selectedItem.display'>
                <v-select label='Display Type' v-model="selectedItem.display.type" hide-details color='primary' :items='displayTypes'></v-select>
            </div>
            <div v-if='selectedItem.display && selectedItem.display.type==="textarea"'>
                <v-text-field label='Number of Lines' type='number' v-model="selectedItem.display.lines" hide-details color='primary'></v-text-field>
            </div>
            <div v-if='selectedItem.display && selectedItem.display.mode'>
                <v-select label='Display Mode' v-model="selectedItem.display.mode" hide-details color='primary' :items='displayModes'></v-select>
            </div>
            <div v-if='selectedItem.display && selectedItem.display.mode==="flex"'>
                <v-slider :label='"Display Size ("+selectedItem.display.size+" of 12)"' v-model="selectedItem.display.size" hide-details color='primary' :max='12'></v-slider>
            </div>
            <div v-if='selectedItem.type==="field"'><v-switch label='Is Editable' v-model="selectedItem.isEditable" hide-details color='primary'></v-switch></div>
            <div v-if='selectedItem.type==="field" && selectedItem.isEditable'><v-switch label='Mandatory on Edit' v-model="selectedItem.mandatory" hide-details color='primary'></v-switch></div>
            <div v-if='selectedItem.type==="field" && !selectedItem.isEditable'><v-switch label='Hidden on Edit' v-model="selectedItem.editHidden" hide-details color='primary'></v-switch></div>
            
            <div v-if='selectedItem.type==="rel"'><v-switch label='Can connect Items' v-model="selectedItem.canConnect" hide-details color='primary'></v-switch></div>
            <div v-if='selectedItem.type==="rel"'><v-switch label='Can disconnect Items' v-model="selectedItem.canDisconnect" hide-details color='primary'></v-switch></div>
            <div v-if='selectedItem.type==="rel"'><v-switch label='Can Create Items' v-model="selectedItem.canCreate" hide-details color='primary'></v-switch></div>

            <div><v-textarea label='Hint (Tooltip)' v-model="selectedItem.hint" hide-details color='primary'></v-textarea></div>

            <div v-if='selectedItem.type==="section" && selectedItem.display' class='layout row wrap'><span class='flex xs0'>Text color </span><input class='flex xs4' type='color' v-model='selectedItem.display.color'/></div>
            <div v-if='selectedItem.type==="section" && selectedItem.display' class='layout row wrap'><span class='flex xs0'>Background color </span><input class='flex xs4' type='color' v-model='selectedItem.display.background'/></div>
        </div>
        <div v-else>Select an item...</div>
    </div>
</template>

<style scoped>
#rightContent {
    overflow: auto;
    height: 100%;
    width: 100%;
}
#rightContent #deleteIcon {
    position: absolute;
    top: 0.1em;
    right: 0.1em;
    cursor: pointer;
}
#rightContent #deleteIcon:hover i.v-icon {
    color: red;
}
</style>

<script>
define(["vue"], function(Vue) {
    return Vue.component("right-panel", {
        template: template,
        props: ["selectedItem", "isOpened"],
        data: function() {
            return {
                displayModes: ["block", "flex"],
                displayTypes: ["checkbox", "switch", "text", "textarea", "select", "list"]
            };
        },
        methods: {
            deleteItem: function() {
                this.$emit("delete-selected-item");
            }
        }
    });
});
</script>
