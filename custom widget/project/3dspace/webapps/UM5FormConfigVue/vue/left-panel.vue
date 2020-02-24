<template>
    <div id="leftContent">
        <v-autocomplete :items='confs' item-text='name' item-value='physicalid' label='Conf' v-model='selectedConf' clearable></v-autocomplete>
        <div>
            <v-text-field v-show='creatingNewConf' color='primary' label='Conf Name' placeholder='Configuration Name' v-model='newConfName'></v-text-field>
            <v-btn icon dark small color='primary' title='Create a New Configuration' @click="newConf"><v-icon small>add</v-icon></v-btn>
            <v-btn v-show='selectedConf' icon dark small color='green' @click='saveConf'><v-icon small>save</v-icon></v-btn>
            <v-btn v-show='selectedConf' :icon='!deletingConf' dark small color='red' @click.stop='deleteConf'><span v-show="deletingConf" @click.stop="false">Are you sure ? </span><v-icon small>delete</v-icon></v-btn><v-icon v-show="deletingConf" small @click.stop="deletingConf=false">cancel</v-icon>
            <v-btn v-show='false' icon dark small color='primary'><v-icon small>share</v-icon></v-btn>
        </div>
        <v-btn-toggle v-model='confMode' dark mandatory>
            <v-btn small color='primary'>Generic Form</v-btn>
            <v-btn small color='primary'>Type Specific</v-btn>
        </v-btn-toggle>
        <v-autocomplete :items='types' label='Type' v-model='selectedType' clearable></v-autocomplete>
        
        <v-expansion-panel id='panels' v-model="expandPanels" expand>
            <v-expansion-panel-content>
                <div slot='header'>Generics</div>
                <div id='generics' class='marked block'>
                    <div v-for='(generic,i) in generics' :key='i' draggable="true" @dragstart="drag($event,'generic',generic)" @dragend="dragEnd">{{generic}}</div>
                </div>
            </v-expansion-panel-content>
            <v-expansion-panel-content>
                <div slot='header'>Attributes</div>
                <div id='attributes' class='marked block' v-show='attributes.length > 0'>
                    <div v-for='(attr,i) in attributes' :key='i' draggable="true" @dragstart="drag($event,'attribute',attr)" @dragend="dragEnd">{{attr}}</div>
                </div>
            </v-expansion-panel-content>
            <v-expansion-panel-content>
                <div slot='header'>Relations</div>
                <div id='relationships' class='marked block' v-show='relationships.length > 0'>
                    <div v-for='(rel,i) in relationships' :key='i' draggable="true" @dragstart="drag($event,'relationship',rel)" @dragend="dragEnd">
                        <v-icon v-if='rel.direction==="to"' small>arrow_back</v-icon>
                        {{rel.name}}
                        <v-icon v-if='rel.direction==="from"' small>arrow_forward</v-icon>
                    </div>
                </div>
            </v-expansion-panel-content>
            <v-expansion-panel-content>
                <div slot='header'>Other</div>
                <div id='others' class='marked block'>
                    <div draggable="true" @dragstart="drag($event,'separatorH')" @dragend="dragEnd">-- Separator</div>
                    <div draggable="true" @dragstart="drag($event,'separatorV')" @dragend="dragEnd">| Separator</div>
                    <div style='border:1px dashed lightgrey' draggable="true" @dragstart="drag($event,'section')" @dragend="dragEnd"><v-icon>arrow_drop_down</v-icon>Section</div>
                </div>
            </v-expansion-panel-content>
        </v-expansion-panel>
    </div>
</template>

<style scoped>
#leftContent {
    overflow: auto;
    height: 100%;
}

#attributes,
#relationships,
#others {
    max-height: 15em;
    overflow: auto;
}
.header.separator {
    color: grey;
    text-decoration: underline;
    font-size: 1em;
}
.marked.block {
    border: 1px solid lightgrey;
}
</style>

<script>
define(["vue", "UM5Form/Utils"], function(Vue, Utils) {
    return Vue.component("left-panel", {
        template: template,
        props: ["confs", "types"],
        data: function() {
            return {
                confMode: 0,
                selectedConf: null,
                newConfName: "",
                creatingNewConf: false,
                deletingConf: false,
                selectedType: null,
                generics: ["type", "name", "revision", "description", "owner", "current", "created", "modified", "organization", "project"],
                attributes: [],
                relationships: [],
                expandPanels: [true, true, true, true]
            };
        },
        methods: {
            newConf: function() {
                if (this.creatingNewConf) {
                    //createConf: function (confName, confContent
                    Utils.createConf(
                        this.newConfName,
                        { generic: [] },
                        data => {
                            let createdConfPID = data; //data contains the physicalid of the Conf

                            //Refresh the list of confs
                            this.$emit("refresh-confs");
                            this.selectedConf = createdConfPID;
                        },
                        (errorType, errorMsg) => {
                            this.$emit("error", errorType, errorMsg);
                        }
                    );
                    this.creatingNewConf = false;
                } else {
                    this.creatingNewConf = true;
                }
            },
            saveConf: function() {
                this.$emit("save-conf");
            },
            deleteConf: function() {
                if (this.deletingConf) {
                    this.$emit("delete-conf", this.selectedConf);
                    this.selectedConf = null;
                    this.deletingConf = false;
                } else {
                    this.deletingConf = true;
                }
            },
            sortAttributes: function() {
                this.attributes.sort();
            },
            sortRelationships: function() {
                this.relationships.sort((a, b) => {
                    let aName = a.name;
                    let bName = b.name;
                    let res = 0;
                    if (bName < aName) {
                        res = 1;
                    } else if (bName === aName) {
                        if (b.direction === a.direction) {
                            res = 0;
                        } else if (a.direction === "from") {
                            res = -1;
                        } else if (b.direction === "from") {
                            res = 1;
                        }
                    } else {
                        res = -1;
                    }
                    return res;
                });
            },
            drag: function(ev, typeItem, item) {
                ev.dataTransfer.setData("text/plain", typeItem);
                this.$emit("set-drag-item", typeItem, item);
            },
            dragEnd: function() {
                this.$emit("unset-drag-item");
            }
        },
        watch: {
            selectedConf: function(newValue) {
                this.$emit("selected-conf", newValue);
            },
            selectedType: function(newValue) {
                //Get the newly selected Type information, possible attributes, existing forms...
                if (newValue) {
                    Utils.getAttributesList(
                        newValue,
                        data => {
                            this.attributes = data;
                            this.sortAttributes();
                        },
                        (errorType, errorMsg) => {
                            this.$emit("error", errorType, errorMsg);
                        }
                    );

                    Utils.getFromRel(
                        newValue,
                        data => {
                            for (let i = 0; i < data.length; i++) {
                                const relName = data[i];
                                this.relationships.push({
                                    name: relName,
                                    direction: "from"
                                });
                            }
                            this.sortRelationships();
                        },
                        (errorType, errorMsg) => {
                            this.$emit("error", errorType, errorMsg);
                        }
                    );
                    Utils.getToRel(
                        newValue,
                        data => {
                            for (let i = 0; i < data.length; i++) {
                                const relName = data[i];
                                this.relationships.push({
                                    name: relName,
                                    direction: "to"
                                });
                            }
                            this.sortRelationships();
                        },
                        (errorType, errorMsg) => {
                            this.$emit("error", errorType, errorMsg);
                        }
                    );
                } else {
                    this.attributes = [];
                    this.relationships = [];
                }
                this.$emit("selected-type", newValue);
            },
            confMode: function(newValue) {
                if (newValue === 1) {
                    //Type Specific Mode
                    this.$emit("set-form-mode", "type");
                } else {
                    //Generic mode
                    this.$emit("set-form-mode", "generic");
                }
            }
        }
    });
});
</script>
