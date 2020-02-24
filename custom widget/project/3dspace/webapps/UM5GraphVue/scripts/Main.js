/*
 * BT WW Competencies Center - Fast Prototypes Team
 * @author UM5
 */

//Realocate top to be the parent frame (3DD) useful in case we want to iframe 3DDashboard
function executeWidgetCode() {

    require.config({
        paths: {
            vue: "./BTWWLibrairies/vue/vue", //Need this with "vue" all lower case, else Vuetify can't load correctly
            Vuetify: "./BTWWLibrairies/vuetify/vuetify",
            CSSRoboto: "./BTWWLibrairies/fonts/Roboto", //"https://fonts.googleapis.com/css?family=Roboto:300,400,500,700",
            CSSMaterial: "./BTWWLibrairies/MaterialDesign/material-icons",
            vueloader: "./BTWWLibrairies/requirejs-vue", //"https://unpkg.com/requirejs-vue@1.1.5/requirejs-vue",
            current: "./UM5GraphVue"
        }
    });

    let vueApp;

    define("Utils", ["UM5Modules/UM5ToolsWS", "UM5Modules/Connector3DExp"], function (UM5ToolsWS, Connector3DExp) {
        let Utils = {
            getTenant: function () {
                return Connector3DExp._tenant;
            },
            removeRoot: function (obj) {
                vueApp.removeRoot(obj);
            },
            expand: function (that, physicalid) {
                UM5ToolsWS.expand({
                    data: {
                        objectId: physicalid,
                        expandTypes: vueApp.expandTypes,
                        expandRels: vueApp.expandRels,
                        expandLevel: "1",
                        selects: vueApp.selectsType,
                        relSelects: vueApp.selectsRel,
                        whereObj: "",
                        whereRel: ""
                    },
                    onOk: function (data, callbackData) {
                        let arrExpand = data;
                        let childsExpandTree = Utils._expandArrayToTree(arrExpand);

                        Utils.completeObjsInfosRecurs(childsExpandTree);

                        that.$set(that.obj, "expanded", true);
                        that.$set(that.obj, "childs", childsExpandTree);
                    },
                    onError: function (errorType, errorMsg) {
                        console.error(errorType + errorMsg);
                        vueApp.messages.push({
                            level: "error",
                            title: errorType,
                            message: errorMsg,
                            sticky: false
                        });
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

            completeObjsInfosRecurs: function (arrObjsToUpdate) {

                let url3DSpace = Connector3DExp.getCurrentTenantInfo()["3DSpace"];

                let getFirstValidValue = function (obj, arrSelects) {
                    let val = "";
                    for (let i = 0; i < arrSelects.length; i++) {
                        let selectItems = arrSelects[i];
                        let allGood = true;
                        for (let j = 0; j < selectItems.length; j++) {
                            const selectItem = selectItems[j];
                            if (selectItem.type === "select") {
                                const select = selectItem.value;
                                let objVal = obj[select];
                                if (objVal && objVal !== "") {
                                    val += objVal;
                                } else {
                                    allGood = false;
                                    break;
                                }
                            } else {
                                let objVal = selectItem.value;
                                if (objVal && objVal !== "") {
                                    val += objVal;
                                } else {
                                    allGood = false;
                                    break;
                                }
                            }
                        }
                        if (allGood) {
                            break;
                        } else {
                            val = ""; //re-init val for next try loop
                        }

                    }
                    return val;
                };

                let recursTree = (arrObjs) => {
                    if (arrObjs) {
                        for (let i = 0; i < arrObjs.length; i++) {
                            let objToComplete = arrObjs[i];
                            if (objToComplete.iconType) {
                                objToComplete.iconUrl = url3DSpace + objToComplete.iconType;
                            }
                            objToComplete.enoUrl = url3DSpace + "/common/emxNavigator.jsp?objectId=" + objToComplete.physicalid;

                            objToComplete.css = "";
                            objToComplete.cssRel = "";

                            for (let j = 0; j < vueApp.cssTypeRules.length; j++) {
                                const rule = vueApp.cssTypeRules[j];
                                let valOnObj = objToComplete[rule.key];
                                if (rule.values.indexOf(valOnObj) !== -1) {
                                    objToComplete.css += rule.css;
                                }
                            }

                            for (let j = 0; j < vueApp.cssRelRules.length; j++) {
                                const rule = vueApp.cssRelRules[j];
                                let valOnObj = objToComplete[rule.key];
                                if (rule.values.indexOf(valOnObj) !== -1) {
                                    objToComplete.cssRel += rule.css;
                                }
                            }

                            //Calculate middle and bottom display
                            objToComplete.dispMiddle = getFirstValidValue(objToComplete, vueApp.dispMiddle);

                            objToComplete.dispBottom = getFirstValidValue(objToComplete, vueApp.dispBottom); //objToComplete.revision + " - " + objToComplete.current;

                            recursTree(objToComplete.childs);
                        }
                    }
                };

                recursTree(arrObjsToUpdate);
            }
        };

        return Utils;
    });

    require(["UWA/Drivers/jQuery",
        "vue",
        "Vuetify",
        "UM5Modules/UM5ToolsWS",
        "UM5Modules/Connector3DExp",
        "BTWWUtils/PanZoom_ES6_UM5_v1/PanZoom",
        "Utils",
        "css!BTWWLibrairies/vuetify/vuetify.min.css",
        "css!CSSRoboto",
        "css!CSSMaterial",
        "vueloader!current/vue/graph-list",
        "vueloader!current/vue/message-list"
    ], function ($, Vue, Vuetify, UM5ToolsWS, Connector3DExp, PanZoom, Utils) {

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

                fctInitPref("_rootsDnD", "");
                fctInitPref("_rootTypes", "Project*Space*");

                fctInitPref("_selectsType", "type,name,revision,current,physicalid,attribute[Title]");
                fctInitPref("_selectsRel", "physicalid[connection],name[connection]");

                fctInitPref("_dispMiddle", JSON.stringify([
                    [{
                        type: "select",
                        value: "attribute[Title]"
                    }],
                    [{
                        type: "select",
                        value: "name"
                    }]
                ]));
                fctInitPref("_dispBottom", JSON.stringify([
                    [{
                        type: "select",
                        value: "revision"
                    }, {
                        type: "string",
                        value: " - "
                    }, {
                        type: "select",
                        value: "current"
                    }]
                ]));


                fctInitPref("_expandTypes", "*");
                fctInitPref("_expandRels", "*");

                fctInitPref("_cssTypeRules", JSON.stringify([{
                    key: "type",
                    values: ["Gate", "Milestone"],
                    css: "background-color:#fff2cf;"
                }, {
                    key: "type",
                    values: ["Task"],
                    css: "background-color:#cff3ff;"
                }, {
                    key: "type",
                    values: ["Phase"],
                    css: "background-color:rgb(207, 255, 238);"
                }, {
                    key: "type",
                    values: ["Document"],
                    css: "background-color:rgb(255, 254, 226);"
                }]));


                fctInitPref("_cssRelRules", JSON.stringify([{
                    key: "name[connection]",
                    values: ["Dependency"],
                    css: "background-color:#ffcfcf;"
                }, {
                    key: "name[connection]",
                    values: ["Task Deliverable"],
                    css: "background-color:#acffac;"
                }]));

                fctInitPref("_allowFind", "true");
                fctInitPref("_allowDrop", "false");
                fctInitPref("_allowExpand", "true");
                fctInitPref("_arrowDirection", "false");

                //Build Vue App Body
                $(widget.body).html(
                    `<div id='appVue'>
                        <v-app style='height:100%;'>
                            <v-progress-linear v-show='countPendingActions > 0' height='4' style='margin:0em;position:absolute;' :indeterminate='true'></v-progress-linear>
                            <message-list :messages='messages'></message-list>
                            <div class='toolbarTop'>
                                <div v-show='draggingNode' :class='"toolBtn"+(highlightDropDisconnect ? " dropZone" : "")' @drop.prevent='highlightDropDisconnect=false;dropDisconnect();' @dragover.prevent='highlightDropDisconnect=true;' @dragenter.stop='highlightDropDisconnect=true;' @dragleave.stop='highlightDropDisconnect=false;'><v-badge color='red' right bottom overlap><v-icon slot='badge' dark small>close</v-icon><v-icon>link</v-icon></v-badge>Disconnect</div>
                                <div class='toolBtn' @click.stop='zoomOut()' title='Zoom Out'><v-icon>zoom_out</v-icon></div>
                                <div class='toolBtn' @click.stop='resetZoom()' title='Reframe View'><v-icon>zoom_out_map</v-icon></div>
                                <div class='toolBtn' @click.stop='zoomIn()' title='Zoom In'><v-icon>zoom_in</v-icon></div>
                                <div class='toolBtn' @click.stop='showSettingsPanel()' title='Settings'><v-icon>settings</v-icon></div>
                            </div>
                            <div id='main' :class='(highlightDrop ? "dropZone" : "")' @drop.prevent='dropOnMain($event);removeHighlightForDrop();' @dragover.prevent='addHighlightForDrop' @dragenter.stop='addHighlightForDrop' @dragleave.stop='removeHighlightForDrop'>
                                <div id='graphPanel' style='height:100%;'>
                                    <div id='noResult' v-if='roots.length<=0'>No results to display</div>
                                    <graph-list :data='roots' :expandable='allowExpand' :arrow-direction='arrowDirection' @drop-as-child='dropAsChild' @set-dragged-node="setDraggedNode"></graph-list>
                                </div>
                            </div>
                            <div id='settingsPanel' v-if='showSettings'>
                                <div class='toolbarTop'>
                                    <div class='toolBtn' @click.stop='saveSettings()'><v-icon>save</v-icon></div>
                                    <div class='toolBtn' @click.stop='hideSettingsPanel()'><v-icon>close</v-icon></div>
                                </div>
                                <v-container style='height:100%;'>
                                    <v-expansion-panel popout>
                                        <v-expansion-panel-content>
                                            <div slot='header'>Objects Information</div>
                                            <div class='settingsSubPanel'>
                                                <v-text-field label='Selects on Objects' v-model='selectsType' hint='Values got :' persistent-hint></v-text-field>
                                                <v-chip v-for='val,i in chipsSelectsType' :key='"objSelect-"+i'>{{val}}</v-chip>
                                                <v-text-field label='Selects on Relations' v-model='selectsRel' hint='Values got :' persistent-hint></v-text-field>
                                                <v-chip v-for='val,i in chipsSelectsRel' :key='"relSelect-"+i'>{{val}}</v-chip>
                                                <div>
                                                    <div>Objects Display:</div>
                                                    <div>Middle Text <span style='font-size:0.5em;'>(by Priority)</span>:</div>
                                                    <div>
                                                        <div v-for='(itemsSel,i) in dispMiddle'>
                                                            <span style='flex:initial;'>{{i+1}} - <v-btn @click="dispMiddle.splice(i,1)" small><v-icon>close</v-icon>Delete this display rule</v-btn></span>
                                                            <div v-for='(item,j) in itemsSel' style='display:flex;flex-direction:row;'>
                                                                <v-select v-model='item.type' :items='["select","string"]' style='flex:initial;' hide-details class='ma-0 pa-0'></v-select>
                                                                <v-select v-if='item.type==="select"' v-model='item.value' :items='chipsSelectsType' style='flex:auto;' hide-details class='ma-0 pa-0'></v-select>
                                                                <v-text-field v-else  v-model='item.value' style='flex:auto;' hide-details class='ma-0 pa-0'></v-text-field>
                                                                <v-btn @click='itemsSel.splice(j, 1)' style='flex:initial;' small icon><v-icon color='red'>remove</v-icon></v-btn>
                                                            </div>
                                                            <v-btn @click="itemsSel.push({type:'string',value:' - '})" small><v-icon>add</v-icon>Add Item in this display rule</v-btn>
                                                        </div>
                                                        <v-btn @click="dispMiddle.push([{type:'string',value:' - '}])" small><v-icon>add</v-icon>Add a display rule</v-btn>
                                                    </div>
                                                    <div>Bottom Text <span style='font-size:0.5em;'>(by Priority)</span>:</div>
                                                    <div>
                                                        <div v-for='(itemsSel,i) in dispBottom'>
                                                            <span style='flex:initial;'>{{i+1}} - <v-btn @click="dispBottom.splice(i,1)" small><v-icon>close</v-icon>Delete this display rule</v-btn></span>
                                                            <div v-for='(item,j) in itemsSel' style='display:flex;flex-direction:row;'>
                                                                <v-select v-model='item.type' :items='["select","string"]' style='flex:initial;' hide-details class='ma-0 pa-0'></v-select>
                                                                <v-select v-if='item.type==="select"' v-model='item.value' :items='chipsSelectsType' style='flex:auto;' hide-details class='ma-0 pa-0'></v-select>
                                                                <v-text-field v-else  v-model='item.value' style='flex:auto;' hide-details class='ma-0 pa-0'></v-text-field>
                                                                <v-btn @click='itemsSel.splice(j, 1)' style='flex:initial;' small icon><v-icon color='red'>remove</v-icon></v-btn>
                                                            </div>
                                                            <v-btn @click="itemsSel.push({type:'string',value:' - '})" small><v-icon>add</v-icon>Add Item in this display rule</v-btn>
                                                        </div>
                                                        <v-btn @click="dispBottom.push([{type:'string',value:' - '}])" small><v-icon>add</v-icon>Add a display rule</v-btn>
                                                    </div>
                                                </div>
                                            </div>
                                        </v-expansion-panel-content>
                                        <v-expansion-panel-content>
                                            <div slot='header'>Root Objects</div>
                                            <div class='settingsSubPanel'>
                                                <v-switch label='Find Root objects' v-model='allowFind' color='primary'></v-switch>
                                                <div v-show='allowFind'>
                                                    <v-text-field label='Types to get as Root objects' v-model='rootTypes' hint='Type pattern' persistent-hint></v-text-field>
                                                </div>
                                                <v-switch label='Drop Root objects' v-model='allowDrop' color='primary'></v-switch>
                                            </div>
                                        </v-expansion-panel-content>
                                        <v-expansion-panel-content>
                                            <div slot='header'>Expand</div>
                                            <div class='settingsSubPanel'>
                                                <v-switch label='Expand objects' v-model='allowExpand' color='primary'></v-switch>
                                                <div v-show='allowExpand'>
                                                    <v-text-field label='Types to get in Expand' v-model='expandTypes' hint='Values got :' persistent-hint></v-text-field>
                                                    <v-chip v-for='val,i in chipsExpandTypes' :key='"expType-"+i'>{{val}}</v-chip>
                                                    <v-text-field label='Relations to get in Expand' v-model='expandRels' hint='Values got :' persistent-hint></v-text-field>
                                                    <v-chip v-for='val,i in chipsExpandRels' :key='"expRel-"+i'>{{val}}</v-chip>
                                                </div>
                                                <v-switch label='Display Relation direction with arrow' v-model='arrowDirection' color='primary'></v-switch>
                                            </div>
                                        </v-expansion-panel-content>
                                        <v-expansion-panel-content>
                                            <div slot='header'>CSS Rules on Objects</div>
                                            <div class='settingsSubPanel'>
                                                <v-data-table :headers='headersTableCss' :items='cssTypeRules' class='elevation-1' hide-actions :rows-per-page-items='[{text:"$vuetify.dataIterator.rowsPerPageAll", value:-1}]'>
                                                    <template slot='items' slot-scope='propsRow'>
                                                        <td><v-select v-model='propsRow.item.key' label='Select a Key' :items='chipsSelectsType' solo></v-select></td>
                                                        <td>
                                                            <div v-for='val,i in propsRow.item.values' :key='"cssType-"+i'>
                                                                <v-text-field v-model='propsRow.item.values[i]' solo placeholder='Enter a value' style='width:calc(100% - 2.5em);display:inline-block;'></v-text-field>
                                                                <v-btn color='red' flat icon @click='propsRow.item.values.splice(i,1);' style='width:2em;height:2em;margin:0em;'><v-icon>close</v-icon></v-btn>
                                                            </div>
                                                            <v-btn color='primary' flat icon small @click='propsRow.item.values.push("*")' style='margin-left:0px;'><v-icon>add</v-icon></v-btn>
                                                        </td>
                                                        <td><v-text-field v-model='propsRow.item.css' solo placeholder='Enter a value'></v-text-field></td>
                                                        <td><div class='previewCss' :style='propsRow.item.css'>Text</div></td>
                                                        <td><v-btn color='red' flat icon @click='removeCssTypeRules(propsRow.item)' style='width:2em;height:2em;margin:0em;'><v-icon>close</v-icon></v-btn></td>
                                                    </template>
                                                </v-data-table>
                                                <v-btn color='primary' block @click='addCssRuleType'><v-icon>add</v-icon> Add Rule</v-btn>
                                            </div>
                                        </v-expansion-panel-content>
                                        <v-expansion-panel-content>
                                            <div slot='header'>CSS Rules on Relations</div>
                                            <div class='settingsSubPanel'>
                                                <v-data-table :headers='headersTableCss' :items='cssRelRules' class='elevation-1' hide-actions :rows-per-page-items='[{text:"$vuetify.dataIterator.rowsPerPageAll", value:-1}]'>
                                                    <template slot='items' slot-scope='propsRow'>
                                                        <td><v-select v-model='propsRow.item.key' label='Select a Key' :items='chipsSelectsRel' solo></v-select></td>
                                                        <td>
                                                            <div v-for='val,i in propsRow.item.values' :key='"cssRel-"+i'>
                                                                <v-text-field v-model='propsRow.item.values[i]' solo placeholder='Enter a value' style='width:calc(100% - 2.5em);display:inline-block;'></v-text-field>
                                                                <v-btn color='red' flat icon @click='propsRow.item.values.splice(i,1);' style='width:2em;height:2em;margin:0em;'><v-icon>close</v-icon></v-btn>
                                                            </div>
                                                            <v-btn color='primary' flat icon small @click='propsRow.item.values.push("*")' style='margin-left:0px;'><v-icon>add</v-icon></v-btn>
                                                        </td>
                                                        <td><v-text-field v-model='propsRow.item.css' solo placeholder='Enter a value'></v-text-field></td>
                                                        <td><div class='previewCss' :style='propsRow.item.css'>Text</div></td>
                                                        <td><v-btn color='red' flat icon @click='removeCssRelRules(propsRow.item)' style='width:2em;height:2em;margin:0em;'><v-icon>close</v-icon></v-btn></td>
                                                    </template>
                                                </v-data-table>
                                                <v-btn color='primary' block @click='addCssRuleRel'><v-icon>add</v-icon> Add Rule</v-btn>
                                            </div>
                                        </v-expansion-panel-content>
                                    </v-expansion-panel>
                                </v-container>
                            </div>
                            <div id='connectionPanel' v-if='proposeConnections'>
                                <div>Connect 
                                    <graph-node :obj='proposeConnections.objParent' :node-id='proposeConnections.objParent.physicalid' :expandable='false' style='display:inline-block;vertical-align:middle;'></graph-node> 
                                    to 
                                    <graph-list :data='proposeConnections.arrChilds' :expandable='false' style='display:inline-block'></graph-list> 
                                    with relation of type 
                                    <v-select :items='proposeConnections.relTypes' label='Relation Type' v-model='proposeConnections.selectedRelType'></v-select>
                                    ?
                                </div>
                                <div style='text-align:right;'>
                                    <v-btn color='success' @click.stop='doConnect' :disabled='(proposeConnections.selectedRelType?false:true)'>Yes</v-btn>
                                    <v-btn color='error' @click.stop='closeConnect'>No</v-btn>
                                </div>
                            </div>
                        </v-app>
                    </div>`
                );

                //Init vue App
                vueApp = new Vue({
                    el: "#appVue",
                    data: {
                        roots: [],

                        showSettings: false,

                        selectsType: widget.getValue("_selectsType"),
                        selectsRel: widget.getValue("_selectsRel"),

                        dispMiddle: JSON.parse(widget.getValue("_dispMiddle")),
                        dispBottom: JSON.parse(widget.getValue("_dispBottom")),

                        rootTypes: widget.getValue("_rootTypes"),

                        expandTypes: widget.getValue("_expandTypes"),
                        expandRels: widget.getValue("_expandRels"),

                        cssTypeRules: JSON.parse(widget.getValue("_cssTypeRules")),

                        cssRelRules: JSON.parse(widget.getValue("_cssRelRules")),

                        headersTableCss: [ //CSS Settings table
                            {
                                text: "Key",
                                value: "key",
                                width: "15%"
                            }, {
                                text: "Values",
                                value: "values",
                                width: "20%"
                            }, {
                                text: "CSS",
                                value: "css"
                            }, {
                                text: "Preview",
                                value: "css",
                                sortable: false,
                                width: "3em"
                            }, {
                                text: "Actions",
                                value: "css",
                                sortable: false,
                                width: "3em"
                            }
                        ],

                        allowFind: widget.getValue("_allowFind") === "true",
                        allowDrop: widget.getValue("_allowDrop") === "true",
                        allowExpand: widget.getValue("_allowExpand") === "true",

                        arrowDirection: widget.getValue("_arrowDirection") === "true",

                        countPendingActions: 0,

                        messages: [],

                        highlightDrop: false,
                        highlightDropDisconnect: false,

                        proposeConnections: null,

                        draggingNode: false //Dragged node for disconnect
                    },
                    computed: {
                        chipsSelectsType: function () {
                            return this.selectsType.split(",");
                        },
                        chipsSelectsRel: function () {
                            return this.selectsRel.split(",");
                        },
                        chipsExpandTypes: function () {
                            return this.expandTypes.split(",");
                        },
                        chipsExpandRels: function () {
                            return this.expandRels.split(",");
                        }
                    },
                    methods: {
                        zoomOut: function () {
                            myWidget.panZoomGraph.zoomOut();
                        },
                        zoomIn: function () {
                            myWidget.panZoomGraph.zoomIn();
                        },
                        resetZoom: function () {
                            myWidget.panZoomGraph.reset();
                        },
                        showSettingsPanel: function () {
                            if (this.showSettings) {
                                this.showSettings = false;
                            } else {
                                this.showSettings = true;
                            }
                        },
                        hideSettingsPanel: function () {
                            this.showSettings = false;
                        },
                        addCssRuleType: function () {
                            this.cssTypeRules.push({
                                key: "type",
                                values: [""],
                                css: "background-color:#cff3ff;"
                            });
                        },
                        removeCssTypeRules: function (itemToRemove) {
                            let idx = this.cssTypeRules.indexOf(itemToRemove);
                            if (idx !== -1) {
                                this.cssTypeRules.splice(idx, 1);
                            }
                        },
                        addCssRuleRel: function () {
                            this.cssRelRules.push({
                                key: "type",
                                values: [""],
                                css: "background-color:#cff3ff;"
                            });
                        },
                        removeCssRelRules: function (itemToRemove) {
                            let idx = this.cssRelRules.indexOf(itemToRemove);
                            if (idx !== -1) {
                                this.cssRelRules.splice(idx, 1);
                            }
                        },
                        saveSettings: function () {
                            //Refresh display objects infos
                            Utils.completeObjsInfosRecurs(this.roots);

                            //Save all widgets prefs
                            widget.setValue("_rootsDnD", this.getRootsDnD());
                            widget.setValue("_rootTypes", this.rootTypes);
                            widget.setValue("_selectsType", this.selectsType);
                            widget.setValue("_selectsRel", this.selectsRel);
                            widget.setValue("_expandTypes", this.expandTypes);
                            widget.setValue("_expandRels", this.expandRels);
                            widget.setValue("_cssTypeRules", JSON.stringify(this.cssTypeRules));
                            widget.setValue("_cssRelRules", JSON.stringify(this.cssRelRules));
                            widget.setValue("_allowFind", "" + this.allowFind);
                            widget.setValue("_allowDrop", "" + this.allowDrop);
                            widget.setValue("_allowExpand", "" + this.allowExpand);
                            widget.setValue("_arrowDirection", "" + this.arrowDirection);
                        },
                        getRootsDnD: function () {
                            let arrRootsPID = [];
                            for (let i = 0; i < this.roots.length; i++) {
                                const obj = this.roots[i];
                                if (!obj.gotThroughFind) {
                                    arrRootsPID.push(obj.physicalid);
                                }
                            }
                            return arrRootsPID.join(",");
                        },
                        dropOnMain: function (event) {

                            if (!this.allowDrop) {
                                console.warn("Object dropped but Drop Root object is off");
                                return;
                            }

                            if (event && event.dataTransfer) {
                                let data = event.dataTransfer.getData("text");
                                myWidget.dropRoot(data);
                            } else {
                                console.warn("Drop not managed, no dataTransfer found");
                            }
                        },
                        addHighlightForDrop: function () {
                            this.highlightDrop = true;
                        },
                        removeHighlightForDrop: function () {
                            this.highlightDrop = false;
                        },
                        removeRoot: function (objToRemove) {
                            for (let i = this.roots.length - 1; i >= 0; i--) {
                                const objToTest = this.roots[i];
                                if (objToTest.physicalid === objToRemove.physicalid) {
                                    this.roots.splice(i, 1);
                                }
                            }
                        },
                        doConnect: function () {
                            //Code to connect the objects and refresh the tree
                            let that = this;
                            let physicalid = that.proposeConnections.objParent.physicalid;
                            let whenDone = () => {
                                UM5ToolsWS.expand({
                                    data: {
                                        objectId: physicalid,
                                        expandTypes: vueApp.expandTypes,
                                        expandRels: vueApp.expandRels,
                                        expandLevel: "1",
                                        selects: vueApp.selectsType,
                                        relSelects: vueApp.selectsRel,
                                        whereObj: "",
                                        whereRel: ""
                                    },
                                    onOk: function (data, callbackData) {
                                        let arrExpand = data;
                                        let childsExpandTree = Utils._expandArrayToTree(arrExpand);

                                        Utils.completeObjsInfosRecurs(childsExpandTree);
                                        //Update all the instances of the object if expanded
                                        vueApp.updateChildsInStructures(physicalid, childsExpandTree);
                                    },
                                    onError: function (errorType, errorMsg) {
                                        console.error(errorType + errorMsg);
                                        vueApp.messages.push({
                                            level: "error",
                                            title: errorType,
                                            message: errorMsg,
                                            sticky: false
                                        });
                                    }
                                });
                            };
                            myWidget.createConnection(this.proposeConnections.objParent, this.proposeConnections.selectedRelType, this.proposeConnections.arrChilds, whenDone);

                            this.closeConnect();
                        },
                        updateChildsInStructures: function (physicalIdToUpdate, newChilds) {
                            let recursOnTree = function (arrObjs) {
                                for (let i = arrObjs.length - 1; i >= 0; i--) {
                                    let obj = arrObjs[i];
                                    let physicalidObj = obj["physicalid"];
                                    if (physicalidObj === physicalIdToUpdate && obj.expanded) {
                                        obj.childs = newChilds;
                                    } else {
                                        //Recurs on childs
                                        if (obj.childs) {
                                            recursOnTree(obj.childs);
                                        }
                                    }
                                }
                            };
                            recursOnTree(this.roots);
                        },
                        closeConnect: function () {
                            this.proposeConnections = null;
                        },
                        dropDisconnect: function () {
                            let relId = this.draggingNode["id[connection]"];
                            vueApp.countPendingActions++;
                            UM5ToolsWS.removeConnection(relId, {
                                onOk: function ( /*data, callbackData*/ ) {
                                    //Remove connection in the trees
                                    vueApp.removeRelFromStructures(relId);
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
                        removeRelFromStructures: function (relIdToRemove) {
                            let recursOnTree = function (arrObjs) {
                                for (let i = arrObjs.length - 1; i >= 0; i--) {
                                    const obj = arrObjs[i];
                                    let relIdObj = obj["id[connection]"];
                                    if (relIdObj === relIdToRemove) {
                                        arrObjs.splice(i, 1);
                                    } else {
                                        //Recurs on childs
                                        if (obj.childs) {
                                            recursOnTree(obj.childs);
                                        }
                                    }
                                }
                            };
                            recursOnTree(this.roots);
                        },
                        dropAsChild: function (objRef, arrPIDs) {

                            //Display a validation panel + do the connection or else
                            myWidget.processDropAsChild(objRef, arrPIDs);
                        },
                        setDraggedNode: function (obj) {
                            this.draggingNode = obj;
                        }
                    },
                    watch: {
                        roots: function () {
                            widget.setValue("_rootsDnD", this.getRootsDnD());
                        },
                        rootTypes: function (newValue) {
                            widget.setValue("_rootTypes", newValue);
                        },

                        selectsType: function (newValue) {
                            widget.setValue("_selectsType", newValue);
                        },
                        selectsRel: function (newValue) {
                            widget.setValue("_selectsRel", newValue);
                        },

                        dispMiddle: function (newValue) {
                            widget.setValue("_dispMiddle", JSON.stringify(newValue));
                        },
                        dispBottom: function (newValue) {
                            widget.setValue("_dispBottom", JSON.stringify(newValue));
                        },

                        expandTypes: function (newValue) {
                            widget.setValue("_expandTypes", newValue);
                        },
                        expandRels: function (newValue) {
                            widget.setValue("_expandRels", newValue);
                        },

                        cssTypeRules: function (newValue) {
                            widget.setValue("_cssTypeRules", JSON.stringify(newValue));
                        },
                        cssRelRules: function (newValue) {
                            widget.setValue("_cssRelRules", JSON.stringify(newValue));
                        },

                        allowFind: function (newValue) {
                            widget.setValue("_allowFind", "" + newValue);
                            if (newValue === true) {
                                myWidget.doFind();
                            } else {
                                //Remove objects added with Find
                                for (let i = this.roots.length - 1; i >= 0; i--) {
                                    const objToTest = this.roots[i];
                                    if (objToTest.gotThroughFind) {
                                        this.roots.splice(i, 1);
                                    }
                                }
                            }
                        },
                        allowDrop: function (newValue) {
                            widget.setValue("_allowDrop", "" + newValue);
                        },
                        allowExpand: function (newValue) {
                            widget.setValue("_allowExpand", "" + newValue);
                        },
                        arrowDirection: function (newValue) {
                            widget.setValue("_arrowDirection", "" + newValue);
                        },
                    }
                });

                //Add Pan and Zoom
                myWidget.panZoomGraph = new PanZoom($("#main"), $("#graphPanel"), {});

                if (vueApp.allowFind) {
                    myWidget.doFind();
                }

                myWidget.loadRootsDnD(widget.getValue("_rootsDnD"));
            },

            onRefreshWidget: function () {
                //Do nothing ATM
            },

            dropRoot: function (dataTxt) {
                let dataDnD = JSON.parse(dataTxt);
                if (dataDnD.protocol === "3DXContent") {
                    let pidsRoots = [];
                    for (let i = 0; i < vueApp.roots.length; i++) {
                        const objRoot = vueApp.roots[i];
                        pidsRoots.push(objRoot.physicalid);
                    }
                    try {
                        let arrOids = dataDnD.data.items;
                        for (let i = 0; i < arrOids.length; i++) {
                            let item = arrOids[i];
                            let pidDropped = item.objectId;
                            if (pidsRoots.indexOf(pidDropped) === -1) {
                                pidsRoots.push(pidDropped);
                                myWidget.loadRootsDnD(pidDropped);
                            } else {
                                alert("The Object is already added as a root in this table");
                            }
                        }
                    } catch (err) {
                        console.error(err);
                    }
                }
            },

            loadRootsDnD: function (strRoots) {
                vueApp.countPendingActions++;
                UM5ToolsWS.objInfo({
                    data: {
                        action: "getInfos",
                        objectIds: strRoots,
                        selects: vueApp.selectsType
                    },
                    onOk: function (data, callbackData) {
                        let arrDataObjs = data;

                        Utils.completeObjsInfosRecurs(arrDataObjs);

                        for (let i = 0; i < arrDataObjs.length; i++) {
                            let doAdd = true;
                            let inObj = arrDataObjs[i];
                            for (let j = 0; j < vueApp.roots.length; j++) {
                                let testObj = vueApp.roots[j];
                                if (testObj.id === inObj.id) {
                                    //Update already loaded object
                                    for (let keyIn in inObj) {
                                        testObj[keyIn] = inObj[keyIn];
                                    }
                                    doAdd = false;
                                }
                            }
                            if (doAdd) {
                                vueApp.roots.push(inObj);
                            }
                        }
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

            doFind: function () {
                vueApp.countPendingActions++;
                UM5ToolsWS.find({
                    data: {
                        type: vueApp.rootTypes,
                        selects: vueApp.selectsType,
                        where: ""
                    },
                    onOk: function (data, callbackData) {
                        let arrDataObjs = data;

                        Utils.completeObjsInfosRecurs(arrDataObjs);

                        for (let i = 0; i < arrDataObjs.length; i++) {
                            let doAdd = true;
                            let inObj = arrDataObjs[i];
                            for (let j = 0; j < vueApp.roots.length; j++) {
                                let testObj = vueApp.roots[j];
                                if (testObj.id === inObj.id) {
                                    //Update already loaded object
                                    for (let keyIn in inObj) {
                                        testObj[keyIn] = inObj[keyIn];
                                    }
                                    doAdd = false;
                                }
                            }
                            if (doAdd) {
                                inObj.gotThroughFind = true;
                                vueApp.roots.push(inObj);
                            }
                        }

                        //Remove objects of dataFull that do not match the find anymore => Mark them as dropped roots so user can delete them from vue
                        let dataFullCleaned = [];
                        for (let j = 0; j < vueApp.roots.length; j++) {
                            let testObj2 = vueApp.roots[j];
                            let idToCheck = testObj2.id;
                            let foundInFind = false;
                            for (let i = 0; i < arrDataObjs.length; i++) {
                                let inObj2 = arrDataObjs[i];
                                if (inObj2.id === idToCheck) {
                                    dataFullCleaned.push(testObj2);
                                    foundInFind = true;
                                    break;
                                }
                            }
                            if (!foundInFind) {
                                delete testObj2.gotThroughFind;
                                dataFullCleaned.push(testObj2);
                            }
                        }
                        vueApp.roots = dataFullCleaned;

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

            processDropAsChild: function (objParent, arrPIDsChilds) {
                vueApp.countPendingActions++;
                UM5ToolsWS.objInfo({
                    data: {
                        action: "getInfos",
                        objectIds: arrPIDsChilds.join(","),
                        selects: vueApp.selectsType
                    },
                    onOk: function (data) {
                        let arrDataObjs = data;

                        Utils.completeObjsInfosRecurs(arrDataObjs);

                        myWidget.proposeConnections(objParent, arrDataObjs);
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

            hiddenRelTypes: ["DEL3DL_Link", "OntoRootRel", "EQUIVALENT", "VPLMrel/VPMSemanticRelation", "DERIVED_ABSTRACT", "UKConstrained"],

            proposeConnections: function (objParent, arrChildsProposed) {

                let arrDataFromRel = null;
                let arrDataToRel = null;

                let childConnect = arrChildsProposed[0];

                let whenDone = function () {
                    if (arrDataFromRel && arrDataToRel) {
                        //Get the common rel types
                        let arrRelTypes = [];
                        for (let i = 0; i < arrDataFromRel.length; i++) {
                            const relName = arrDataFromRel[i];
                            if (arrDataToRel.indexOf(relName) !== -1 && myWidget.hiddenRelTypes.indexOf(relName) === -1) {
                                arrRelTypes.push(relName);
                            }
                        }

                        vueApp.proposeConnections = {
                            objParent: objParent,
                            arrChilds: arrChildsProposed,
                            relTypes: arrRelTypes,
                            selectedRelType: false
                        };
                    } //else wait for other reply
                };

                vueApp.countPendingActions++;
                UM5ToolsWS.typeFromRel(objParent.type, {
                    onOk: function (data) {
                        arrDataFromRel = data;

                        vueApp.countPendingActions--;
                        whenDone();
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

                vueApp.countPendingActions++;
                UM5ToolsWS.typeToRel(childConnect.type, {
                    onOk: function (data) {
                        arrDataToRel = data;

                        vueApp.countPendingActions--;
                        whenDone();
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

            createConnection: function (objParent, relType, arrChilds, whenDone) {
                //TODO Manage multiple childs drop later on
                let child = arrChilds[0];

                let fromId = objParent.physicalid;
                let toId = child.physicalid;

                vueApp.countPendingActions++;

                UM5ToolsWS.addConnection(fromId, relType, toId, {
                    onOk: function ( /*data*/ ) {
                        vueApp.countPendingActions--;
                        whenDone();
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
            }
        };

        widget.addEvent("onLoad", myWidget.onLoadWidget);
        widget.addEvent("onRefresh", myWidget.onRefreshWidget);
    });
}