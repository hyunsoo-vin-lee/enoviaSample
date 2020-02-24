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
            current: "./UM5Compare"
        }
    });

    require([
        "vue",
        "Vuetify",
        "UM5Modules/Connector3DExp",
        "UM5Modules/UM5ToolsWS",
        "css!BTWWLibrairies/vuetify/vuetify.min.css",
        "css!CSSRoboto",
        "css!CSSMaterial",
        "vueloader!current/vue/message-list",
        "vueloader!current/vue/message-block",
        "vueloader!current/vue/drop-zone",
        "vueloader!current/vue/compare-structure-result",
        "vueloader!current/vue/compare-node-result"
    ], function (Vue, Vuetify, Connector3DExp, UM5ToolsWS) {

        Vue.use(Vuetify); //To plug vuetify components


        var myWidget = {
            // Widget Events
            onLoadWidget: function () {
                Connector3DExp.useWidgetHub = false; //Pass it to false if you want to avoid having a cache on the 3DDashboard side.

                var wdgUrl = widget.getUrl();
                wdgUrl = wdgUrl.substring(0, wdgUrl.lastIndexOf("/"));

                widget.setIcon(wdgUrl + "/../UM5Modules/assets/icons/custom-widget-icon.png");

                var wdgTitlePref = widget.getValue("wdgTitle");
                if (wdgTitlePref) {
                    widget.setTitle(wdgTitlePref);
                }

                //Init preferences
                let fctInitPref = (namePref, defaultValue) => {
                    let wdgPref = widget.getPreference(namePref);
                    if (typeof wdgPref === "undefined") {
                        //Create it
                        widget.addPreference({
                            name: namePref,
                            type: "hidden",
                            label: namePref,
                            defaultValue: defaultValue
                        });
                    }
                };

                fctInitPref("_selectsType", "name,type,revision,physicalid,attribute[Title].value,description,owner,current");
                fctInitPref("_selectsRel", "name[connection]");

                fctInitPref("_expandLevel", "2");

                fctInitPref("_keysToIdentify", "name,type,name[connection]");
                fctInitPref("_keysMajorDifference", "name,attribute[Title].value");
                fctInitPref("_keysNoticeDifference", "description,owner,current");


                //Build Vue App Body
                widget.setBody(
                    `<div id='appVue'>
                        <v-app style='height:100%;'>
                            <message-list :messages='messages'></message-list>
                            <div id='topBar' style='display:flex;flex-direction:row;'>
                                <drop-zone @drop-on='dropOnLeft' style='flex:auto;'>
                                    <span v-if='leftStructure'>{{leftStructure.name}}</span>
                                </drop-zone>
                                <v-icon :class='[countPendingActions>0 ? "loading":""]' style='flex:initial;' @click='refreshStructure()' title='Reload the data of the 2 structures'>refresh</v-icon>
                                <drop-zone @drop-on='dropOnRight' style='flex:auto;'>
                                    <span v-if='rightStructure'>{{rightStructure.name}}</span>
                                </drop-zone>
                            </div>
                            <div id='main'>
                                <compare-structure-result :structure='aggregatedStructure' :level="0"></compare-structure-result>
                            </div>
                            <div class='settingsBtn' @click.stop='showSettingsPanel()' title='Settings'><v-icon>settings</v-icon></div>
                            <div v-if='showSettings' id='settingsPanel'>
                                <v-text-field label='Selects on Objects' v-model='selectsType' hint='Values got :' persistent-hint></v-text-field>
                                <v-chip v-for='val,i in chipsSelectsType' :key='"objSelect-"+i'>{{val}}</v-chip>
                                <v-text-field label='Selects on Relations' v-model='selectsRel' hint='Values got :' persistent-hint></v-text-field>
                                <v-chip v-for='val,i in chipsSelectsRel' :key='"relSelect-"+i'>{{val}}</v-chip>
                                <div>
                                    <div>Keys used to identify and pair the objects :</div>
                                    <div>
                                        <v-chip v-for='val,i in keysToIdentify' :key='"keyId-"+i' color="green" text-color="white" @click.stop='removeIdentifyKey(val)'>{{val}}</v-chip>
                                        <v-chip v-for='val,i in potentialKeysToIdentify' :key='"potKeyId-"+i' @click.stop='addIdentifyKey(val)'>{{val}}</v-chip>
                                    </div>
                                    <div>Keys used to detect major differences on the objects :</div>
                                    <div>
                                        <v-chip v-for='val,i in keysMajorDifference' :key='"keyId-"+i' color="green" text-color="white" @click.stop='removeMajorDiffKey(val)'>{{val}}</v-chip>
                                        <v-chip v-for='val,i in potentialKeysMajorDifference' :key='"potKeyId-"+i' @click.stop='addMajorDiffKey(val)'>{{val}}</v-chip>
                                    </div>
                                    <div>Keys used to notice of some minor differences on the objects :</div>
                                    <div>
                                        <v-chip v-for='val,i in keysNoticeDifference' :key='"keyId-"+i' color="green" text-color="white" @click.stop='removeNoticeDiffKey(val)'>{{val}}</v-chip>
                                        <v-chip v-for='val,i in potentialKeysNoticeDifference' :key='"potKeyId-"+i' @click.stop='addNoticeDiffKey(val)'>{{val}}</v-chip>
                                    </div>
                                </div>
                                <v-text-field label='Number of level to expand' type='number' v-model='expandLevel' hint='-1 to expand all levels' persistent-hint></v-text-field>
                            </div>
                        </v-app>
                    </div>`);

                //Init vue App
                vueApp = new Vue({
                    el: "#appVue",
                    data: {
                        countPendingActions: 0,
                        messages: [],

                        showSettings: false,

                        leftStructure: null,
                        rightStructure: null,

                        selectsType: widget.getValue("_selectsType"),
                        selectsRel: widget.getValue("_selectsRel"),
                        expandLevel: parseInt(widget.getValue("_expandLevel"), 10), //-1 = all

                        keysToIdentify: widget.getValue("_keysToIdentify").split(","),
                        keysMajorDifference: widget.getValue("_keysMajorDifference").split(","),
                        keysNoticeDifference: widget.getValue("_keysNoticeDifference").split(","),

                        aggregatedStructure: {}
                    },
                    computed: {
                        chipsSelectsType: function () {
                            return this.selectsType.split(",");
                        },
                        chipsSelectsRel: function () {
                            return this.selectsRel.split(",");
                        },
                        potentialKeysToIdentify: function () {
                            let keys = [];
                            let selectsTypes = this.chipsSelectsType;
                            let selectsRels = this.chipsSelectsRel;
                            for (let i = 0; i < selectsTypes.length; i++) {
                                const val = selectsTypes[i];
                                if (this.keysToIdentify.indexOf(val) === -1 && keys.indexOf(val) === -1) {
                                    keys.push(val);
                                }
                            }
                            for (let i = 0; i < selectsRels.length; i++) {
                                const val = selectsRels[i];
                                if (this.keysToIdentify.indexOf(val) === -1 && keys.indexOf(val) === -1) {
                                    keys.push(val);
                                }
                            }
                            return keys;
                        },
                        potentialKeysMajorDifference: function () {
                            let keys = [];
                            let selectsTypes = this.chipsSelectsType;
                            let selectsRels = this.chipsSelectsRel;
                            for (let i = 0; i < selectsTypes.length; i++) {
                                const val = selectsTypes[i];
                                if (this.keysMajorDifference.indexOf(val) === -1 && keys.indexOf(val) === -1) {
                                    keys.push(val);
                                }
                            }
                            for (let i = 0; i < selectsRels.length; i++) {
                                const val = selectsRels[i];
                                if (this.keysMajorDifference.indexOf(val) === -1 && keys.indexOf(val) === -1) {
                                    keys.push(val);
                                }
                            }
                            return keys;
                        },
                        potentialKeysNoticeDifference: function () {
                            let keys = [];
                            let selectsTypes = this.chipsSelectsType;
                            let selectsRels = this.chipsSelectsRel;
                            for (let i = 0; i < selectsTypes.length; i++) {
                                const val = selectsTypes[i];
                                if (this.keysNoticeDifference.indexOf(val) === -1 && keys.indexOf(val) === -1) {
                                    keys.push(val);
                                }
                            }
                            for (let i = 0; i < selectsRels.length; i++) {
                                const val = selectsRels[i];
                                if (this.keysNoticeDifference.indexOf(val) === -1 && keys.indexOf(val) === -1) {
                                    keys.push(val);
                                }
                            }
                            return keys;
                        }
                    },
                    methods: {
                        dropOnLeft: function (dataDropped) {
                            let oids = this.extractObjectIds(dataDropped);
                            this.loadStructure(oids[0], "leftStructure");
                        },
                        dropOnRight: function (dataDropped) {
                            let oids = this.extractObjectIds(dataDropped);
                            this.loadStructure(oids[0], "rightStructure");
                        },
                        extractObjectIds: function (dataTxt) {
                            let resOid = [];
                            try {
                                let dataDnD = JSON.parse(dataTxt);
                                if (dataDnD.protocol === "3DXContent") {
                                    let arrItems = dataDnD.data.items;
                                    for (let i = 0; i < arrItems.length; i++) {
                                        const item = arrItems[i];
                                        resOid.push(item.objectId);
                                    }
                                }
                            } catch (err) {
                                console.error(err);
                            }
                            return resOid;
                        },
                        loadStructure: function (pidRoot, attachTo) {
                            vueApp.countPendingActions++;
                            UM5ToolsWS.objInfo({
                                data: {
                                    action: "getInfos",
                                    objectIds: pidRoot,
                                    selects: vueApp.selectsType
                                },
                                onOk: function (data) {
                                    let arrDataObjs = data;
                                    let objStructure = arrDataObjs[0];

                                    vueApp.countPendingActions++;
                                    UM5ToolsWS.expand({
                                        data: {
                                            objectId: arrDataObjs[0].physicalid,
                                            expandTypes: "*",
                                            expandRels: "FROM|*",
                                            expandLevel: vueApp.expandLevel, //-1 = all
                                            selects: vueApp.selectsType,
                                            relSelects: vueApp.selectsRel,
                                            whereObj: "",
                                            whereRel: ""
                                        },
                                        onOk: function (data, callbackData) {
                                            let arrExpand = data;
                                            let childsExpandTree = myWidget._expandArrayToTree(arrExpand);

                                            objStructure.childs = childsExpandTree;

                                            vueApp[attachTo] = objStructure;

                                            vueApp.buildAggregatedStructure();
                                            vueApp.countPendingActions--;
                                        },
                                        onError: function (errorType, errorMsg) {
                                            console.error(errorType + errorMsg);
                                            vueApp.messages.push({
                                                level: "error",
                                                title: errorType,
                                                message: errorMsg,
                                                sticky: false
                                            });
                                            vueApp.countPendingActions--;
                                        }
                                    });
                                    vueApp.countPendingActions--;
                                },
                                onError: function (errorType, errorMsg) {
                                    console.error(errorType + errorMsg);
                                    vueApp.messages.push({
                                        level: "error",
                                        title: errorType,
                                        message: errorMsg,
                                        sticky: false
                                    });
                                    vueApp.countPendingActions--;
                                }
                            });
                        },
                        buildAggregatedStructure: function () {
                            let leftRoot = this.leftStructure;
                            let rightRoot = this.rightStructure;

                            if (!leftRoot || !rightRoot) {
                                return {};
                            }

                            let idKeys = this.keysToIdentify;
                            let majDiffKeys = this.keysMajorDifference;
                            let minDiffKeys = this.keysNoticeDifference;

                            let url3DSpace = Connector3DExp.getCurrentTenantInfo()["3DSpace"];

                            let buildResultStructureRecurs = (leftNode, rightNode, level) => {
                                //Add full url for the icons
                                if (leftNode && leftNode.iconType && leftNode.iconType !== "") {
                                    leftNode.urlIcon = url3DSpace + leftNode.iconType;
                                }
                                if (rightNode && rightNode.iconType && rightNode.iconType !== "") {
                                    rightNode.urlIcon = url3DSpace + rightNode.iconType;
                                }

                                let aggregatedNode = {
                                    _leftNode: leftNode,
                                    _rightNode: rightNode,
                                    majorDiffs: [],
                                    noticeableDiffs: [],
                                    childs: [],
                                    _level: level
                                };

                                //Compare the nodes
                                if (leftNode && rightNode) {
                                    for (let i = 0; i < majDiffKeys.length; i++) {
                                        const key = majDiffKeys[i];
                                        const leftVal = leftNode[key];
                                        const rightVal = rightNode[key];
                                        if (leftVal !== rightVal) {
                                            aggregatedNode.majorDiffs.push(key);
                                        }
                                    }
                                    for (let i = 0; i < minDiffKeys.length; i++) {
                                        const key = minDiffKeys[i];
                                        const leftVal = leftNode[key];
                                        const rightVal = rightNode[key];
                                        if (leftVal !== rightVal) {
                                            aggregatedNode.noticeableDiffs.push(key);
                                        }
                                    }
                                }

                                //Find the childs that goes as similar nodes
                                //Compare the childs similar nodes
                                let leftChilds = (leftNode && leftNode.childs ? leftNode.childs.slice() : []); //Copy
                                let rightChilds = (rightNode && rightNode.childs ? rightNode.childs.slice() : []); //Copy

                                while (leftChilds.length > 0) {
                                    let leftChildNode = leftChilds.splice(0, 1)[0]; //Extract 1 element
                                    let bFoundSimilar = false;
                                    for (let i = 0; i < rightChilds.length; i++) {
                                        const rightNodeToTest = rightChilds[i];
                                        let nbIdKeysOK = 0;
                                        for (let j = 0; j < idKeys.length; j++) {
                                            const keyId = idKeys[j];
                                            const leftVal = leftChildNode[keyId];
                                            const rightVal = rightNodeToTest[keyId];
                                            if (leftVal === rightVal) {
                                                nbIdKeysOK++;
                                            } else {
                                                break; //values are differents so it's different objects
                                            }
                                        }
                                        if (nbIdKeysOK === idKeys.length) {
                                            let rightChildNode = rightChilds.splice(i, 1)[0]; //Extract the corresponding Node
                                            aggregatedNode.childs.push(buildResultStructureRecurs(leftChildNode, rightChildNode, level + 1));
                                            bFoundSimilar = true;
                                            break;
                                        }
                                    }
                                    if (!bFoundSimilar) {
                                        //Add full url for the icons
                                        if (leftChildNode && leftChildNode.iconType && leftChildNode.iconType !== "") {
                                            leftChildNode.urlIcon = url3DSpace + leftChildNode.iconType;
                                        }
                                        aggregatedNode.childs.push(buildResultStructureRecurs(leftChildNode, null, level + 1));
                                    }
                                }

                                //Put all the right childs nodes as right only nodes
                                for (let i = 0; i < rightChilds.length; i++) {
                                    const rightChildNode = rightChilds[i];
                                    //Add full url for the icons
                                    if (rightChildNode && rightChildNode.iconType && rightChildNode.iconType !== "") {
                                        rightChildNode.urlIcon = url3DSpace + rightChildNode.iconType;
                                    }
                                    aggregatedNode.childs.push(buildResultStructureRecurs(null, rightChildNode, level + 1));
                                }

                                return aggregatedNode;
                            };

                            this.aggregatedStructure = buildResultStructureRecurs(leftRoot, rightRoot, 0);
                        },
                        refreshStructure: function () {
                            if (this.leftStructure && this.leftStructure.physicalid) {
                                this.loadStructure(this.leftStructure.physicalid, "leftStructure");
                            }
                            if (this.rightStructure && this.rightStructure.physicalid) {
                                this.loadStructure(this.rightStructure.physicalid, "rightStructure");
                            }
                        },
                        showSettingsPanel: function () {
                            this.showSettings = !this.showSettings;
                            if (!this.showSettings) {
                                //Panel probably closed
                                this.saveSettings();
                                this.buildAggregatedStructure();
                            }
                        },
                        saveSettings: function () {
                            //Save everything in widget preferences
                            widget.setValue("_selectsType", this.selectsType);
                            widget.setValue("_selectsRel", this.selectsRel);
                            widget.setValue("_expandLevel", this.expandLevel);

                            widget.setValue("_keysToIdentify", this.keysToIdentify.join(","));
                            widget.setValue("_keysMajorDifference", this.keysMajorDifference.join(","));
                            widget.setValue("_keysNoticeDifference", this.keysNoticeDifference.join(","));
                        },
                        addIdentifyKey: function (val) {
                            this.keysToIdentify.push(val);
                        },
                        removeIdentifyKey: function (val) {
                            this.keysToIdentify.splice(this.keysToIdentify.indexOf(val), 1);
                        },
                        addMajorDiffKey: function (val) {
                            this.keysMajorDifference.push(val);
                        },
                        removeMajorDiffKey: function (val) {
                            this.keysMajorDifference.splice(this.keysMajorDifference.indexOf(val), 1);
                        },
                        addNoticeDiffKey: function (val) {
                            this.keysNoticeDifference.push(val);
                        },
                        removeNoticeDiffKey: function (val) {
                            this.keysNoticeDifference.splice(this.keysNoticeDifference.indexOf(val), 1);
                        }
                    }
                });
            },
            _expandArrayToTree: function (arrExpand) {
                // Code to transform array to Tree based on level, relDirection and from.id or to.id
                // Used for multi-level expand

                let resultTree = [];

                let currentList = arrExpand;
                let previousLevelList = [];
                let currentLevelList = [];
                let nextLevelsList = [];
                let currentLevel = 1;

                let loopWithoutAction = false;
                while (currentList.length > 0 && !loopWithoutAction) {
                    loopWithoutAction = true; // Safety net to avoid being stuck in the loop in case of missing level or incorrect input data
                    currentLevelList = [];
                    for (let i = 0; i < currentList.length; i++) {
                        let objInfo = currentList[i];
                        let objLevel = parseInt(objInfo["level"]);
                        if (objLevel <= currentLevel) {
                            currentLevelList.push(objInfo);
                            if (currentLevel === 1) {
                                resultTree.push(objInfo);
                                loopWithoutAction = false;
                            } else {
                                //Push it it the right parent in previousLevelList...
                                let idFrom = objInfo["from.id"];
                                let idTo = objInfo["to.id"];
                                let relDir = objInfo["relDirection"];
                                for (let j = 0; j < previousLevelList.length; j++) {
                                    let objParentTest = previousLevelList[j];
                                    let idParentTest = objParentTest["id"];
                                    if (
                                        (relDir === "from" && idFrom === idParentTest) ||
                                        (relDir === "to" && idTo === idParentTest) ||
                                        (!relDir && idFrom === idParentTest)
                                    ) {
                                        if (typeof objParentTest.childs === "undefined") {
                                            objParentTest.childs = [];
                                        }
                                        objParentTest.childs.push(objInfo);
                                        objParentTest.expanded = true;
                                        objParentTest.expandPartial = false;
                                        loopWithoutAction = false;
                                        break;
                                    }
                                }
                            }
                        } else {
                            nextLevelsList.push(objInfo);
                        }
                    }
                    currentLevel++;
                    previousLevelList = currentLevelList;
                    currentList = nextLevelsList;
                    nextLevelsList = [];
                }

                return resultTree;
            },
            onRefreshWidget: function () {
                vueApp.refreshStructure();
            }
        };

        widget.addEvent("onLoad", myWidget.onLoadWidget);
        widget.addEvent("onRefresh", myWidget.onRefreshWidget);
        //widget.addEvent("onSearch", myWidget.onSearchWidget);
        //widget.addEvent("onResetSearch", myWidget.onResetSearchWidget);

        //widget.addEvent("onConfigChange", myWidget.onConfigChange); //For change of Table Config in list
    });
}