/*
 * BT WW Competencies Center - Fast Prototypes Team
 * @author UM5
 */

function executeWidgetCode() {

    let vueApp;

    require.config({
        paths: {
            vue: "./BTWWLibrairies/vue/vue", //Need this with "vue" all lower case, else Vuetify can't load correctly
            Vuetify: "./BTWWLibrairies/vuetify/vuetify",
            CSSRoboto: "./BTWWLibrairies/fonts/Roboto", //"https://fonts.googleapis.com/css?family=Roboto:300,400,500,700",
            CSSMaterial: "./BTWWLibrairies/MaterialDesign/material-icons",
            vueloader: "./BTWWLibrairies/requirejs-vue", //"https://unpkg.com/requirejs-vue@1.1.5/requirejs-vue",
            current: "./UM5FormConfigVue"
        }
    });

    //Utils functions also used in the sub components
    //Defined here, it will also display the loading bar when a Web Service call will be done
    define("UM5Form/Utils", [
        "UM5Modules/UM5ToolsWS"
    ], function (UM5ToolsWS) {
        let utils = {
            getConfList: function (cbDone, cbErr) {
                vueApp.countPendingActions++;
                UM5ToolsWS.uiConfList("form", {
                    onOk: function (data /*, callbackData*/ ) {
                        cbDone(data);
                        vueApp.countPendingActions--;
                    },
                    onError: function (errorType, errorMsg) {
                        cbErr(errorType, errorMsg);
                        vueApp.countPendingActions--;
                    }
                });
            },
            createConf: function (confName, confContent, cbDone, cbErr) {
                vueApp.countPendingActions++;
                UM5ToolsWS.uiConfCreate("form", confName, confContent, {
                    onOk: function (data /*, callbackData*/ ) {
                        cbDone(data);
                        vueApp.countPendingActions--;
                    },
                    onError: function (errorType, errorMsg) {
                        cbErr(errorType, errorMsg);
                        vueApp.countPendingActions--;
                    }
                });
            },
            updateConf: function (confPID, confContent, cbDone, cbErr) {
                vueApp.countPendingActions++;
                UM5ToolsWS.uiConfUpdate(confPID, confContent, {
                    onOk: function ( /*data , callbackData*/ ) {
                        cbDone();
                        vueApp.countPendingActions--;
                    },
                    onError: function (errorType, errorMsg) {
                        cbErr(errorType, errorMsg);
                        vueApp.countPendingActions--;
                    }
                });
            },
            deleteConf: function (confPID, cbDone, cbErr) {
                vueApp.countPendingActions++;
                UM5ToolsWS.uiConfDelete(confPID, {
                    onOk: function ( /*data , callbackData*/ ) {
                        cbDone();
                        vueApp.countPendingActions--;
                    },
                    onError: function (errorType, errorMsg) {
                        cbErr(errorType, errorMsg);
                        vueApp.countPendingActions--;
                    }
                });
            },
            getConf: function (confPID, cbDone, cbErr) {
                vueApp.countPendingActions++;
                UM5ToolsWS.uiConfContent(confPID, {
                    onOk: function (data /*, callbackData*/ ) {
                        cbDone(JSON.parse(data));
                        vueApp.countPendingActions--;
                    },
                    onError: function (errorType, errorMsg) {
                        cbErr(errorType, errorMsg);
                        vueApp.countPendingActions--;
                    }
                });
            },
            getTypesList: function (typePattern, cbDone, cbErr) {
                vueApp.countPendingActions++;
                UM5ToolsWS.listTypes(typePattern, {
                    onOk: function (data /*, callbackData*/ ) {
                        cbDone(data);
                        vueApp.countPendingActions--;
                    },
                    onError: function (errorType, errorMsg) {
                        cbErr(errorType, errorMsg);
                        vueApp.countPendingActions--;
                    }
                });
            },
            getAttributesList: function (type, cbDone, cbErr) {
                vueApp.countPendingActions++;
                UM5ToolsWS.typeAttributes(type, {
                    onOk: function (data /*, callbackData*/ ) {
                        cbDone(data);
                        vueApp.countPendingActions--;
                    },
                    onError: function (errorType, errorMsg) {
                        cbErr(errorType, errorMsg);
                        vueApp.countPendingActions--;
                    }
                });
            },
            getFromRel: function (type, cbDone, cbErr) {
                vueApp.countPendingActions++;
                UM5ToolsWS.typeFromRel(type, {
                    onOk: function (data /*, callbackData*/ ) {
                        cbDone(data);
                        vueApp.countPendingActions--;
                    },
                    onError: function (errorType, errorMsg) {
                        cbErr(errorType, errorMsg);
                        vueApp.countPendingActions--;
                    }
                });
            },
            getToRel: function (type, cbDone, cbErr) {
                vueApp.countPendingActions++;
                UM5ToolsWS.typeToRel(type, {
                    onOk: function (data /*, callbackData*/ ) {
                        cbDone(data);
                        vueApp.countPendingActions--;
                    },
                    onError: function (errorType, errorMsg) {
                        cbErr(errorType, errorMsg);
                        vueApp.countPendingActions--;
                    }
                });
            }
        };
        return utils;
    });

    require(["UWA/Drivers/jQuery",
        "vue",
        "Vuetify",
        "UM5Modules/Connector3DExp",
        "UM5Form/Utils",
        "css!BTWWLibrairies/vuetify/vuetify.min.css",
        "css!CSSRoboto",
        "css!CSSMaterial",
        "vueloader!current/vue/message-list",
        "vueloader!current/vue/message-block",
        "vueloader!current/vue/left-panel",
        "vueloader!current/vue/center-panel",
        "vueloader!current/vue/right-panel",
        //Move all the sub-components in the *.vue components using them ???
        //At the moment everything is loaded here
        "vueloader!current/vue/web-form-list-fields",
        "vueloader!current/vue/web-form-field",
        "vueloader!current/vue/web-form-rel",
        "vueloader!current/vue/web-form-section",
        "vueloader!current/vue/web-form-separator-h",
        "vueloader!current/vue/web-form-separator-v"
    ], function ($, Vue, Vuetify, Connector3DExp, Utils) {

        Vue.use(Vuetify); //To plug vuetify components


        let myWidget = {
            // Widget Events
            onLoadWidget: function () {
                Connector3DExp.useWidgetHub = false; //Pass it to false if you want to avoid having a cache on the 3DDashboard side.

                let wdgUrl = widget.getUrl();
                wdgUrl = wdgUrl.substring(0, wdgUrl.lastIndexOf("/"));

                widget.setIcon(wdgUrl + "/../UM5Modules/assets/icons/custom-widget-icon.png");

                let wdgTitlePref = widget.getValue("wdgTitle");
                if (wdgTitlePref) {
                    widget.setTitle(wdgTitlePref);
                }

                //Build Vue App Body
                $(widget.body).html(
                    `<div id='appVue'>
                        <v-app style='height:100%;'>
                            <v-progress-linear v-show='countPendingActions > 0' height='4' style='margin:0em;position:absolute;' :indeterminate='true'></v-progress-linear>
                            <message-list :messages='messages'></message-list>
                            <div id='left' :style='(leftOpened?"width:20%;":"width:0em;")'>
                                <div id='toggleLeftPanel' @click='toggleLeftPanel'>
                                    <v-icon v-if='leftOpened'>chevron_left</v-icon><v-icon v-else>chevron_right</v-icon>
                                </div>
                                <left-panel :confs='confs' :types='types' @error='errorMessage' @refresh-confs='loadConfs' @selected-conf='selectedConfChanged' @save-conf='saveConf' @delete-conf='deleteConf' @set-form-mode='setFormMode' @selected-type='selectedTypeChanged' @set-drag-item='setDragItem' @unset-drag-item='unsetDragItem'></left-panel>
                            </div>
                            <div id='main' :style='(leftOpened?"left:20%;":"left:0em;")+(rightOpened?"right:20%;":"right:0em;")' @click='unselectItems'>
                                <center-panel @error='errorMessage' :tree-form-definition='treeFormDefinition' :selected-item="selectedItem" @select-item='selectItem' @item-drop='itemDrop' @set-form-content='pasteFormDefinition'></center-panel>
                            </div>
                            <div id='right' :style='(rightOpened?"width:20%;":"width:0em;")'>
                                <div id='toggleRightPanel' @click='toggleRightPanel'>
                                    <v-icon v-if='rightOpened'>chevron_right</v-icon><v-icon v-else>chevron_left</v-icon>
                                </div>
                                <right-panel :is-opened='rightOpened' :selected-item="selectedItem" @error='errorMessage' @delete-selected-item='deleteSelectedItem'></right-panel>
                            </div>
                        </v-app>
                    </div>`);

                //Init vue App
                vueApp = new Vue({
                    el: "#appVue",
                    data: {
                        messages: [], //To display messages that appears at the top right
                        countPendingActions: 0, //Tod display loading bar
                        leftOpened: true, //Collapsable Left panel
                        rightOpened: true, //Collapsable Right panel
                        confs: [], //List of configuration Templates available, list is filled by a Web Service Call
                        types: [], //List of Types available on the server, list is filled by a Web Service Call
                        selectedConf: null, //Conf currently being working on
                        loadedConfDef: { //To save the configuration, generic template or type specific template of the Forms
                            "generic": []
                        },
                        selectedType: null, //Type selected, selectedTypeChanged function to update the list of attributes and rels of the type, type is selected in the left-panel.vue component
                        formMode: "generic", //Form mode : generic or type specific
                        treeFormDefinition: [], //The Form Definition currently being working on, will be pushed in loadedConfDef under the right type key or generic key depending on the formMode
                        selectedItem: null, //Selected item in the form to be passed to sub components and to the right panel
                        draggedItem: null //dragged Item with the definition of the item the will be added in the treeFormDefinition when item-drop is emitted in one of the form component
                    },
                    methods: {
                        toggleLeftPanel: function () {
                            this.leftOpened = !this.leftOpened;
                        },
                        toggleRightPanel: function () {
                            this.rightOpened = !this.rightOpened;
                        },
                        errorMessage: function (errorType, errorMsg) {
                            this.messages.push({
                                level: "error",
                                title: errorType,
                                message: errorMsg,
                                sticky: false
                            });
                        },
                        loadConfs: function () {
                            Utils.getConfList((data) => {
                                this.confs = data;
                            }, (errorType, errorMsg) => {
                                console.error(errorType + errorMsg);
                                this.errorMessage(errorType, errorMsg);
                            });
                        },
                        updateLoadedConf: function () {
                            if (this.formMode === "generic") {
                                this.loadedConfDef.generic = this.treeFormDefinition.slice(); //Make a copy for safe measures
                            } else if (this.formMode === "type" && this.selectedType && this.treeFormDefinition.length > 0) {
                                this.loadedConfDef[this.selectedType] = this.treeFormDefinition.slice(); //Make a copy for safe measures
                            }
                        },
                        updateTreeFormDefDisplayed: function () {
                            if (this.formMode === "generic") {
                                this.treeFormDefinition = this.loadedConfDef.generic.slice(); //Make a copy for safe measures
                            } else if (this.formMode === "type" && this.selectedType) {
                                if (this.loadedConfDef[this.selectedType]) {
                                    this.treeFormDefinition = this.loadedConfDef[this.selectedType].slice(); //Make a copy for safe measures
                                } else {
                                    this.treeFormDefinition = []; //Empty new array
                                }
                            } else {
                                this.treeFormDefinition = []; //Empty new array
                            }
                        },
                        saveConf: function () {
                            this.updateLoadedConf();
                            Utils.updateConf(this.selectedConf, this.loadedConfDef, () => {
                                this.messages.push({
                                    level: "success",
                                    title: "Config Saved",
                                    message: "Configuration correctly saved ",
                                    sticky: false
                                });
                            }, (errorType, errorMsg) => {
                                console.error(errorType + errorMsg);
                                this.errorMessage(errorType, errorMsg);
                            });
                        },
                        deleteConf: function (confPID) {
                            Utils.deleteConf(confPID, () => {
                                this.messages.push({
                                    level: "success",
                                    title: "Config Delete",
                                    message: "Configuration correctly deleted ",
                                    sticky: false
                                });
                                this.loadConfs();
                            }, (errorType, errorMsg) => {
                                console.error(errorType + errorMsg);
                                this.errorMessage(errorType, errorMsg);
                            });
                        },
                        selectedConfChanged: function (newValue) {
                            this.selectedConf = newValue;
                            //Load the existing Conf
                            if (newValue) {
                                Utils.getConf(newValue, (data) => {
                                    this.loadedConfDef = data;
                                    this.updateTreeFormDefDisplayed();
                                }, (errorType, errorMsg) => {
                                    console.error(errorType + errorMsg);
                                    this.errorMessage(errorType, errorMsg);
                                });
                            } else {
                                this.loadedConfDef = {
                                    "generic": []
                                };
                                this.treeFormDefinition = [];
                            }

                        },
                        setFormMode: function (mode) {
                            this.updateLoadedConf(); //To save current result if any
                            this.formMode = mode;
                            this.updateTreeFormDefDisplayed(); //To update the display
                        },
                        selectedTypeChanged: function (newValue) {
                            //Find the associated Form and display it on the preview Panel by loading info in treeFormDefinition
                            this.updateLoadedConf(); //To save current result if any
                            this.selectedType = newValue;
                            this.updateTreeFormDefDisplayed(); //To update the display
                        },
                        selectItem: function (itemSelected) {
                            this.selectedItem = itemSelected;
                        },
                        unselectItems: function () {
                            this.selectedItem = null;
                        },
                        deleteSelectedItem: function () {
                            //Find the selected item in the tree and delete it
                            this.recursInTree(this.treeFormDefinition, this.selectedItem, (item, parentArray, indexInParentArray) => {
                                console.debug("Deleting the item :", item);
                                parentArray.splice(indexInParentArray, 1);
                                this.selectedItem = null;
                            });
                        },
                        recursInTree: function (arrToGoThrough, itemToFind, actionToDoWithItem) {
                            if (arrToGoThrough) {
                                for (let i = 0; i < arrToGoThrough.length; i++) {
                                    const item = arrToGoThrough[i];
                                    if (item === itemToFind) {
                                        actionToDoWithItem(item, arrToGoThrough, i);
                                        break;
                                    } else {
                                        this.recursInTree(item.childs, itemToFind, actionToDoWithItem);
                                    }
                                }
                            }
                        },
                        setDragItem: function (typeItem, item) {
                            this.draggedItem = null;
                            switch (typeItem) {
                                case "separatorH":
                                    this.draggedItem = {
                                        type: "separatorH"
                                    };
                                    break;
                                case "separatorV":
                                    this.draggedItem = {
                                        type: "separatorV"
                                    };
                                    break;
                                case "section":
                                    this.draggedItem = {
                                        type: "section",
                                        label: "New Section",
                                        expanded: true,
                                        childs: [],
                                        display: {
                                            color: 'black',
                                            background: '#e4e4e4'
                                        }
                                    };
                                    break;
                                case "generic":
                                    this.draggedItem = {
                                        type: "field",
                                        label: item,
                                        target: item,
                                        display: {
                                            type: "text",
                                            mode: "flex",
                                            size: 6,
                                            lines: 2
                                        }
                                    };
                                    break;
                                case "attribute":
                                    this.draggedItem = {
                                        type: "field",
                                        label: item,
                                        target: "attribute[" + item + "]",
                                        display: {
                                            type: "text",
                                            mode: "flex",
                                            size: 6,
                                            lines: 2
                                        }
                                    };
                                    break;
                                case "relationship":
                                    let relName = item.name;
                                    let relDir = item.direction;
                                    let relTarget = "";
                                    if (relDir === "from") {
                                        relTarget = "from[" + relName + "].to";
                                    } else {
                                        relTarget = "to[" + relName + "].from";
                                    }
                                    this.draggedItem = {
                                        type: "rel",
                                        label: relName,
                                        target: relTarget,
                                        display: {
                                            type: "list",
                                            mode: "flex",
                                            size: 6
                                        }
                                    };
                                    break;

                                default:
                                    break;
                            }
                        },
                        unsetDragItem: function () {
                            this.draggedItem = null;
                        },
                        itemDrop: function (where, itemDropped) {
                            //Find the item by looking to the treeFormDefinition that is stored the Form Definition, then put the dragged item at the right place
                            this.recursInTree(this.treeFormDefinition, itemDropped, (item, parentArray, indexInParentArray) => {
                                console.debug("Item dropped " + where + " : ", item);
                                let position = indexInParentArray;
                                if (where === "after") position++;
                                let itemToAdd = this.draggedItem;
                                if (where === "replace") {
                                    parentArray.splice(position, 1, itemToAdd);
                                } else {
                                    parentArray.splice(position, 0, itemToAdd);
                                }
                            });
                        },
                        pasteFormDefinition: function (clipboard) {
                            this.treeFormDefinition = clipboard;
                        }
                    }
                });

                //Call Web Service to load the available confs
                vueApp.loadConfs();

                //Call Web Service to load the available types
                Utils.getTypesList("*", (data) => {
                    vueApp.types = data.sort();
                }, (errorType, errorMsg) => {
                    console.error(errorType + errorMsg);
                    vueApp.errorMessage(errorType, errorMsg);
                });
            },
            onRefreshWidget: function () {
                //Do nothing at the moment
            }
        };



        widget.addEvent("onLoad", myWidget.onLoadWidget);
        widget.addEvent("onRefresh", myWidget.onRefreshWidget);
        //widget.addEvent("onSearch", myWidget.onSearchWidget);
        //widget.addEvent("onResetSearch", myWidget.onResetSearchWidget);

        //widget.addEvent("onConfigChange", myWidget.onConfigChange); //For change of Table Config in list
    });
}