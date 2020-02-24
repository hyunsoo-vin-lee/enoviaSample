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
            currentVuePath: "./UM5FormConfigVue", //Pointing to the same vue components as the UM5FormConfigVue Widget
            currentPath: "./UM5FormVue"
        }
    });

    define("UM5Form/Utils", [
        "UM5Modules/UM5ToolsWS",
        "UM5Modules/Connector3DExp"
    ], function (UM5ToolsWS, Connector3DExp) {
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
            getObjectInfos: function (oid, arrSelects, cbDone, cbErr) {
                vueApp.countPendingActions++;
                UM5ToolsWS.objInfo({
                    data: {
                        action: "getInfos",
                        "objectIds": oid,
                        selects: arrSelects.join(",")
                    },
                    onOk: function (data /*, callbackData*/ ) {
                        cbDone(data[0] || {});
                        vueApp.countPendingActions--;
                    },
                    onError: function (errorType, errorMsg) {
                        cbErr(errorType, errorMsg);
                        vueApp.countPendingActions--;
                    }
                });
            },
            updateObjectInfos: function (oid, mapsMods, cbDone, cbErr) {
                vueApp.countPendingActions++;
                UM5ToolsWS.objUpdateAttributes(oid, mapsMods, {
                    onOk: function ( /*data, callbackData*/ ) {
                        cbDone();
                        vueApp.countPendingActions--;
                    },
                    onError: function (errorType, errorMsg) {
                        cbErr(errorType, errorMsg);
                        vueApp.countPendingActions--;
                    }
                });
            },
            addConnection: function (fromId, relType, toId, cbDone, cbErr) {
                vueApp.countPendingActions++;
                UM5ToolsWS.addConnection(fromId, relType, toId, {
                    onOk: function () {
                        cbDone();
                        vueApp.countPendingActions--;
                    },
                    onError: function (errorType, errorMsg) {
                        cbErr(errorType, errorMsg);
                        vueApp.countPendingActions--;
                    }
                });
            },
            removeConnection: function (relId, cbDone, cbErr) {
                vueApp.countPendingActions++;
                UM5ToolsWS.removeConnection(relId, {
                    onOk: function () {
                        cbDone();
                        vueApp.countPendingActions--;
                    },
                    onError: function (errorType, errorMsg) {
                        cbErr(errorType, errorMsg);
                        vueApp.countPendingActions--;
                    }
                });
            },
            get3DSpaceURL: function () {
                return UM5ToolsWS.get3DSpaceURL();
            },
            mapType2IconType: {},
            getIconTypeInfo: function (type, cbDone) {
                let that = this;
                if (this.mapType2IconType[type]) {
                    cbDone(this.mapType2IconType[type]);
                } else {
                    //vueApp.countPendingActions++;//Do not modify countPendingActions has it's making the vue loop on it self while loading icon of Types
                    UM5ToolsWS.typeIcon(type, {
                        onOk: function (data) {
                            that.mapType2IconType[type] = data;
                            cbDone(data);
                            //vueApp.countPendingActions--;
                        },
                        onError: function (errorType, errorMsg) {
                            console.error("Impossible to load iconType of " + type, errorType, errorMsg);
                            //vueApp.countPendingActions--;
                        }
                    });
                }
            },
            getFCSFileURL: function (docId, cbDone, cbErr) {
                vueApp.countPendingActions++;
                Connector3DExp.call3DSpace({
                    url: "/resources/v1/modeler/documents/" + docId,
                    method: "GET",
                    type: "json",
                    data: {},
                    forceReload: true,
                    onComplete: (data) => {
                        console.debug("Call successed ! :D");

                        if (data.success) {
                            let arrData = data.data;

                            let doc0 = arrData[0];
                            let currentCSRF = data.csrf;

                            Connector3DExp.call3DSpace({
                                url: "/resources/v1/modeler/documents/" + doc0.id + "/files/DownloadTicket",
                                method: "PUT",
                                type: "json",
                                contentType: "application/json",
                                data: JSON.stringify({
                                    csrf: currentCSRF
                                }),
                                forceReload: true,
                                onComplete: (data) => {
                                    console.debug("data Download:", data);
                                    let urlFCS = data.data[0].dataelements.ticketURL;
                                    let fName = data.data[0].dataelements.fileName;
                                    cbDone(urlFCS, fName);
                                    vueApp.countPendingActions--;
                                },
                                onFailure: () => {
                                    cbErr("Get Document Info Error", "GET Document FCS Ticket failed, check widget preferences (Tenant, Collab. Space, docPID) and retry.");
                                    vueApp.countPendingActions--;
                                }

                            });
                        } else {
                            cbErr("Get Document Info Error", "GET Document failed, (server available but no success info in response), check widget preferences (Tenant, Collab. Space, docPID) and retry.");
                            vueApp.countPendingActions--;
                        }
                    },
                    onFailure: () => {
                        cbErr("Get Document Info Error", "GET Document failed, check widget preferences (Tenant, Collab. Space, docPID) and retry.");
                        vueApp.countPendingActions--;
                    }

                });
            },
            getTypesForCreateAttach: function (relType, relDir, cbDone, cbErr) {
                vueApp.countPendingActions++;
                let fctToCall = UM5ToolsWS.relToType;
                if (relDir === "to") {
                    fctToCall = UM5ToolsWS.relFromType;
                }
                fctToCall(relType, {
                    onOk: function (data) {
                        cbDone(data);
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
            getTypePolicies: function (type, cbDone, cbErr) {
                vueApp.countPendingActions++;
                UM5ToolsWS.typePolicies(type, {
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
            createNewObject: function (type, name, revision, policy, cbDone, cbErr) {
                vueApp.countPendingActions++;
                UM5ToolsWS.typeCreateObject(type, name, revision, policy, {
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
        "DS/PlatformAPI/PlatformAPI",
        "css!BTWWLibrairies/vuetify/vuetify.min.css",
        "css!CSSRoboto",
        "css!CSSMaterial",
        "vueloader!currentVuePath/vue/message-list",
        "vueloader!currentVuePath/vue/message-block",
        "vueloader!currentVuePath/vue/web-form-list-fields",
        "vueloader!currentVuePath/vue/web-form-field",
        "vueloader!currentVuePath/vue/web-form-rel",
        "vueloader!currentVuePath/vue/web-form-section",
        "vueloader!currentVuePath/vue/web-form-separator-h",
        "vueloader!currentVuePath/vue/web-form-separator-v",
        "vueloader!currentPath/vue/overlay-create"
    ], function ($, Vue, Vuetify, Connector3DExp, Utils, PlatformAPI) {

        Vue.use(Vuetify); //To plug vuetify components


        let myWidget = {
            // Widget Events
            onLoadWidget: function () {
                myWidget.initPrefs();

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
                            <div style='border-bottom: 1px solid #e4e4e4;'>
                                <v-icon v-if='canEdit' @click='editMode=!editMode;' :color='(editMode?"green":"")' title='Edit'>edit</v-icon>
                                <v-badge v-else bottom right overlap color='red' title='You do not have modification rights on the selected objects'><v-icon slot='badge' small dark>block</v-icon><v-icon>edit</v-icon></v-badge>
                                <v-icon v-if='canEdit && editMode'@click='saveForm' title='Save'>save</v-icon>

                                <v-icon @click='showConfChooser=!showConfChooser;' style='float:right;' title='Choose form template configuration'>settings</v-icon>
                            </div>
                            <div v-if="showConfChooser">
                                <v-autocomplete :items='confs' item-text='name' item-value='physicalid' label='Conf' v-model='selectedConf' clearable></v-autocomplete>
                            </div>
                            <div style='max-height: 100%;overflow: auto;'>
                                <web-form-list-fields :items='treeFormDefinition' :edit-mode='canEdit && editMode ? 1 : 0' :data-object='dataObj' @error='errorMessage' @refresh-vue='refreshVue' @create-attached-object='createAttachedObject'></web-form-list-fields>
                            </div>
                            <overlay-create v-if='overlayCreate' @close='overlayCreate=false'>
                                Create a new Object to attach as {{overlayCreateConstraints.relType}}
                                <v-autocomplete :items='overlayCreateConstraints.types' label='Type' v-model='creation.selectedType' clearable hide-details></v-autocomplete>
                                <v-switch label='Autoname' v-model='creation.autoname' hide-details color='primary'></v-switch>
                                <v-text-field v-if='!creation.autoname' label='Name' v-model='creation.name' hide-details></v-text-field>
                                <v-select v-if='creation.policies && creation.policies.length>0' :items='creation.policies' v-model='creation.selectedPolicy' hide-details></v-select>
                                <v-switch label='Autoname Revision' v-model='creation.autoRev' hide-details color='primary'></v-switch>
                                <v-text-field v-if='!creation.autoRev' label='Revision' v-model='creation.revision' hide-details></v-text-field>
                                <div style='text-align:right;'>
                                    <v-btn color='success' @click='createAndAttachNewObject()'>Create and Attach</v-btn>
                                    <v-btn color='error' @click='overlayCreate=false'>Cancel</v-btn>
                                </div>
                            </overlay-create>
                        </v-app>
                    </div>`);


                //Init vue App
                vueApp = new Vue({
                    el: "#appVue",
                    data: {
                        messages: [],
                        countPendingActions: 0,

                        confs: [],
                        selectedConf: null,
                        showConfChooser: false,
                        loadedConfDef: {
                            "generic": []
                        },
                        treeFormDefinition: [],

                        _dataObjInitial: "",
                        dataObj: {},

                        allTargetSelects: [],

                        editMode: false,
                        canEdit: false,

                        overlayCreate: false,
                        overlayCreateConstraints: {},
                        creation: {
                            selectedType: null,
                            policies: [],
                            selectedPolicy: null,
                            name: "",
                            autoname: false,
                            revision: "",
                            autoRev: false
                        }
                    },
                    methods: {
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
                        updateTreeFormDefDisplayed: function (newObject) {
                            let typeForForm = newObject.type;
                            if (this.loadedConfDef[typeForForm]) {
                                this.treeFormDefinition = this.loadedConfDef[typeForForm].slice(); //Make a copy for safe measures
                            } else if (typeForForm) {
                                this.treeFormDefinition = this.loadedConfDef.generic.slice(); //Make a copy for safe measures
                            } else {
                                this.treeFormDefinition = [];
                            }
                        },
                        updateSelectsForType: function (type) {
                            let typeToUse = "generic";
                            if (this.loadedConfDef[type]) {
                                typeToUse = type;
                            }

                            let formDefOfType = this.loadedConfDef[typeToUse];

                            //Update all Target Selects
                            let arrTargets = ["current.access"];
                            this.recursInTree(formDefOfType, (item /*, parentArray, index*/ ) => {
                                let itemType = item.type;
                                if (itemType === "field") {
                                    let target = item.target;
                                    if (arrTargets.indexOf(target) === -1) {
                                        arrTargets.push(target);
                                    }
                                } else if (itemType === "rel") {
                                    let target = item.target;
                                    if (arrTargets.indexOf(target + '.id') === -1) {
                                        arrTargets.push(target + '.id');
                                    }
                                    if (arrTargets.indexOf(target + '.name') === -1) {
                                        arrTargets.push(target + '.name');
                                    }
                                    if (arrTargets.indexOf(target + '.type') === -1) {
                                        arrTargets.push(target + '.type');
                                    }
                                    let strTargetIdConn = target.substring(0, target.lastIndexOf(".")) + ".id[connection]";
                                    if (arrTargets.indexOf(strTargetIdConn) === -1) {
                                        arrTargets.push(strTargetIdConn);
                                    }
                                }
                            });
                            this.allTargetSelects = arrTargets;
                        },
                        recursInTree: function (arrToGoThrough, actionToDoWithItem) {
                            if (arrToGoThrough) {
                                for (let i = 0; i < arrToGoThrough.length; i++) {
                                    const item = arrToGoThrough[i];
                                    actionToDoWithItem(item, arrToGoThrough, i);
                                    this.recursInTree(item.childs, actionToDoWithItem);
                                }
                            }
                        },
                        loadObjectId: function (oid) {
                            Utils.getObjectInfos(oid, this.allTargetSelects, (data) => {
                                this._dataObjInitial = JSON.stringify(data);
                                this.dataObj = data;
                                if (data["current.access"] === "all" || data["current.access"].indexOf("modify") !== -1) {
                                    this.canEdit = true;
                                } else {
                                    this.canEdit = false;
                                }
                            }, (errorType, errorMsg) => {
                                console.error(errorType + errorMsg);
                                this.errorMessage(errorType, errorMsg);
                            });
                        },
                        saveForm: function () {

                            let initialState = JSON.parse(this._dataObjInitial);

                            //Get the differences
                            let mods = {};
                            for (const key in this.dataObj) {
                                if (this.dataObj.hasOwnProperty(key)) {
                                    const val = this.dataObj[key];
                                    const initialVal = initialState[key];
                                    if (val !== initialVal) {
                                        mods[key] = val;
                                    }
                                }
                            }

                            //Do update
                            Utils.updateObjectInfos(this.dataObj.physicalid, mods, () => {
                                this._dataObjInitial = JSON.stringify(this.dataObj);
                                //OK message
                                this.messages.push({
                                    level: "success",
                                    title: "Object Saved",
                                    message: "Object " + this.dataObj.name + " correctly saved ",
                                    sticky: false
                                });
                            }, (errorType, errorMsg) => {
                                console.error(errorType + errorMsg);
                                this.errorMessage(errorType, errorMsg);
                            });

                        },
                        refreshVue: function () {
                            this.updateSelectsForType(this.dataObj.type);
                            this.loadObjectId(this.dataObj.physicalid);
                        },
                        createAttachedObject: function (currentId, target) {
                            //Initialize the Overlay Form to create a New Object and display it

                            let relDir = "from";
                            if (target.indexOf("to[") === 0) {
                                relDir = "to";
                            }

                            let relType = target.substring(target.indexOf("[") + 1, target.indexOf("]"));

                            //Display the Form to create the new Object and then create the connection

                            //Get the possible types that can be used to create a new object
                            Utils.getTypesForCreateAttach(relType, relDir,
                                (dataTypes) => {
                                    if (dataTypes && dataTypes.length === 1) {
                                        let oneType = dataTypes[0];
                                        if (oneType === "all") {
                                            //Call Web Service to load the available types
                                            Utils.getTypesList("*",
                                                (dataAllTypes) => {
                                                    this.overlayCreateConstraints = {
                                                        relType: relType,
                                                        relDirection: relDir,
                                                        currentPID: currentId,
                                                        types: dataAllTypes.sort()
                                                    };
                                                    this.overlayCreate = true; //Will display the Overlay
                                                }, (errorType, errorMsg) => {
                                                    console.error(errorType + errorMsg);
                                                    vueApp.errorMessage(errorType, errorMsg);
                                                }
                                            );
                                            return;
                                        }
                                    }
                                    this.overlayCreateConstraints = {
                                        relType: relType,
                                        relDirection: relDir,
                                        currentPID: currentId,
                                        types: dataTypes
                                    };
                                    this.overlayCreate = true; //Will display the Overlay
                                },
                                (errorType, errorMsg) => {
                                    this.$emit("error", errorType, errorMsg);
                                }
                            );
                        },
                        createAndAttachNewObject: function () {
                            //TODO call to create the object, call to connect the new object, close the overlay panel, refresh the form
                            let type = this.creation.selectedType;
                            let policy = this.creation.selectedPolicy;

                            let name = this.creation.name;
                            if (this.creation.autoname) {
                                name = "";
                            }
                            let revision = this.creation.revision;
                            if (this.creation.autoRev) {
                                revision = "";
                            }
                            let currentPID = this.overlayCreateConstraints.currentPID;
                            let relDir = this.overlayCreateConstraints.relDirection;
                            let relType = this.overlayCreateConstraints.relType;

                            Utils.createNewObject(type, name, revision, policy, (newPID) => {
                                //New object created, connect it now
                                let fromId = relDir === "to" ? newPID : currentPID;
                                let toId = relDir === "to" ? currentPID : newPID;

                                //Try to connect
                                Utils.addConnection(
                                    fromId,
                                    relType,
                                    toId,
                                    () => {
                                        this.overlayCreate = false; //Hide The overlay panel
                                        this.refreshVue(); //Refresh the view
                                    },
                                    (errorType, errorMsg) => {
                                        this.$emit("error", errorType, errorMsg);
                                    }
                                );
                            }, (errorType, errorMsg) => {
                                console.error(errorType + errorMsg);
                                vueApp.errorMessage(errorType, errorMsg);
                            });
                        }
                    },
                    watch: {
                        dataObj: function (newObject) {
                            this.updateTreeFormDefDisplayed(newObject); //To update the display
                        },
                        selectedConf: function (newValue) {
                            //this.selectedConf = newValue;
                            //Load the existing Conf
                            if (newValue) {
                                Utils.getConf(newValue, (data) => {
                                    this.loadedConfDef = data;
                                    this.updateTreeFormDefDisplayed(this.dataObj); //To update the display
                                }, (errorType, errorMsg) => {
                                    console.error(errorType + errorMsg);
                                    this.errorMessage(errorType, errorMsg);
                                });
                            } else {
                                this.loadedConfDef = {
                                    "generic": []
                                };
                                this.treeFormDefinition = [];
                                this.updateTreeFormDefDisplayed(this.dataObj); //To update the display
                            }
                            //Save in widget Prefs
                            widget.setValue("selectedConf", newValue || "");
                        },
                        "creation.selectedType": function (newType) {
                            //Get the right Policies infos
                            if (!newType || newType === "") {
                                this.creation.policies = [];
                                this.creation.selectedPolicy = null;
                            } else {
                                //Load the policies
                                Utils.getTypePolicies(newType, (data) => {
                                    this.creation.policies = data;
                                    this.creation.selectedPolicy = data[0];
                                }, (errorType, errorMsg) => {
                                    console.error(errorType + errorMsg);
                                    this.errorMessage(errorType, errorMsg);
                                });
                            }
                        }
                    }
                });

                vueApp.loadConfs();

                let selectedConfInPref = widget.getValue("selectedConf");
                if (selectedConfInPref === "") {
                    selectedConfInPref = null;
                }
                vueApp.selectedConf = selectedConfInPref; //This way it will trigger the watch function

                PlatformAPI.subscribe("Select_Object", myWidget.selectObject);
            },
            onRefreshWidget: function () {
                //Do nothing at the moment
                vueApp.loadConfs();
            },
            initPrefs: function () {
                var prefSelectedConf = widget.getPreference("selectedConf");
                if (typeof prefSelectedConf === "undefined") {
                    //Create it
                    widget.addPreference({
                        name: "selectedConf",
                        type: "hidden",
                        label: "selectedConf",
                        defaultValue: ""
                    });
                }
            },
            selectObject: function (dataSelect) {
                var wdgId = dataSelect.widgetId;
                if (widget.id === wdgId) return; //Ignore event when it's coming from the widget itself

                var strOid = dataSelect.objectId;
                var type = dataSelect.objectType;
                var isSelected = dataSelect.isSelected;

                //Reset canEdit
                vueApp.canEdit = false;

                if (!isSelected) {
                    vueApp.dataObj = {};
                    vueApp._dataObjInitial = {};
                } else {
                    vueApp.updateSelectsForType(type);
                    vueApp.loadObjectId(strOid);
                }
            }
        };



        widget.addEvent("onLoad", myWidget.onLoadWidget);
        widget.addEvent("onRefresh", myWidget.onRefreshWidget);
        //widget.addEvent("onSearch", myWidget.onSearchWidget);
        //widget.addEvent("onResetSearch", myWidget.onResetSearchWidget);

        //widget.addEvent("onConfigChange", myWidget.onConfigChange); //For change of Table Config in list
    });
}