/*
 * BT WW Competencies Center - Fast Prototypes Team
 * @author UM5
 */

/*
 * Dev Note : Now using VueJS to quickly build the UI and have nice UI Reactivity.
 * VueJS has the same Reactive principles as ReactJS but code is written in a different manner.
 */
function executeWidgetCode() {
    require([
        "UWA/Drivers/jQuery",
        "BTWWLibrairies/vue/vue",
        "BTWWLibrairies/vuetify/vuetify",
        "css!BTWWLibrairies/vuetify/vuetify.min.css",
        "css!BTWWLibrairies/MaterialDesign/material-icons.css"
    ], function ($, Vue, Vuetify) {

        Vue.use(Vuetify); //To plug vuetify components

        //Init global Vue components
        const mappingQType2CType = {
            "YesNo": null,
            "OneChoice": "question-choices-list",
            "MultiChoice": "question-choices-list",
            "MultiLevelChoice": "question-choices-tree",
            "Evaluate": "question-evaluate",
            "FreeText": null
        };

        let qCount4Id = 0;
        const getDefaultQuestion = () => {
            return {
                id: "q" + ++qCount4Id,
                type: "YesNo",
                question: ""
            };
        };

        Vue.component("questions-table", {
            template: "<tbody>\
                            <tr v-for='question,i in questions' :key='question.id'>\
                                <td v-for='col in columns' :key='col.id' :is='getQuestionCellDisp(col, question)' :column='col' :question='question' @remove-question='removeQuestion(i)' @add-question='addQuestion(i)'></td>\
                            </tr>\
                            <tr v-if='questions.length<=0'>\
                                <td :colspan='columns.length' style='text-align:center;'>\
                                    <v-btn @click='addQuestion(columns.length-1)'>Add Question</v-btn>\
                                </td>\
                            </tr>\
                        </tbody>",
            props: ["questions", "columns"],
            methods: {
                getQuestionCellDisp: function (column, question) {
                    let componentType = "question-text";
                    if (column.key === "question") {
                        componentType = "question-asked";
                    } else if (column.key === "type") {
                        componentType = "question-type";
                    } else if (column.key === "options") {
                        componentType = mappingQType2CType[question.type] || componentType;
                    } else if (column.key === "showIf") {
                        componentType = "question-show-if";
                    } else if (column.key === "actions") {
                        componentType = "question-actions";
                    }
                    return componentType;
                },
                removeQuestion: function (index) {
                    this.questions.splice(index, 1);
                },
                addQuestion: function (index) {
                    this.questions.splice(index + 1, 0, getDefaultQuestion());
                }
            }
        });

        Vue.component("question-text", {
            template: "<td>{{question[column.key]}}</td>",
            props: ["column", "question"]
        });

        Vue.component("question-asked", {
            template: "<td><input type='text' v-model='question.question' class='questionInput'/></td>",
            props: ["column", "question"]
        });

        Vue.component("question-type", {
            template: "<td><v-select v-model='question.type' :items='options'></v-select></td>",
            props: ["column", "question"],
            data: () => { //for components, data has to be a function
                return {
                    options: ["YesNo",
                        "OneChoice",
                        "MultiChoice",
                        "MultiLevelChoice",
                        "Evaluate",
                        "FreeText"
                    ]
                };
            }
        });

        Vue.component("question-choices-list", {
            template: "<td>\
                            <question-choices-list-item v-for='choice,i in question.choices' :key='\"qcli-\"+question.id+\"-\"+i' :choice='choice' v-model='question.choices[i]' :isFirst='i===0' :isLast='i===(question.choices.length-1)' @remove-choice='removeChoice(i)' @move-up='moveUp(i)' @move-down='moveDown(i)'></question-choices-list-item>\
                            <div><v-btn small @click='addChoice()'>+</v-btn></div>\
                            <div v-if='question.type===\"MultiChoice\"'>\
                            <div>Min number of choices: <input type='text' v-model.number='question.min'/></div>\
                            <div>Max number of choices: <input type='text' v-model.number='question.max'/></div>\
                            </div>\
                        </td>",
            props: ["column", "question"],
            methods: {
                addChoice: function () {
                    if (this.question.choices) {
                        this.question.choices.push("...");
                    } else {
                        this.$set(this.question, "choices", ["..."]);
                    }
                },
                removeChoice: function (index) {
                    this.question.choices.splice(index, 1);
                },
                moveUp: function (index) {
                    if (index === 0) {
                        return;
                    }
                    let arrRemoved = this.question.choices.splice(index, 1);
                    this.question.choices.splice(index - 1, 0, arrRemoved[0]);
                },
                moveDown: function (index) {
                    if (index >= this.question.choices.length - 1) {
                        return;
                    }
                    let arrRemoved = this.question.choices.splice(index, 1);
                    this.question.choices.splice(index + 1, 0, arrRemoved[0]);
                }
            }
        });
        Vue.component("question-choices-list-item", {
            template: "<div>\
                            <input type='text' :value='choice' @input='$emit(\"input\",$event.target.value)' placeholder='Enter a value...'/>\
                            <v-btn small @click='$emit(\"remove-choice\")'>-</v-btn>\
                            <v-btn small v-if='!isFirst' @click='$emit(\"move-up\")'>/\\</v-btn>\
                            <v-btn small v-if='!isLast' @click='$emit(\"move-down\")'>\\/</v-btn>\
                        </div>",
            props: ["choice", "isFirst", "isLast"]
        });

        Vue.component("question-choices-tree", {
            template: "<td>\
                            <question-choices-tree-item v-for='choice,i in question.choices' :choice='choice' :key='\"item-\"+i' :isFirst='i===0' :isLast='i===(question.choices.length-1)' @remove-choice='removeChoice(i)' @move-up='moveUp(i)' @move-down='moveDown(i)'></question-choices-tree-item>\
                            <v-btn small @click='addRootItem()'>+</v-btn>\
                        </td>",
            props: ["column", "question"],
            methods: {
                addRootItem: function () {
                    this.question.choices.push({
                        value: "..."
                    });
                },
                removeChoice: function (index) {
                    this.question.choices.splice(index, 1);
                },
                moveUp: function (index) {
                    if (index === 0) {
                        return;
                    }
                    let arrRemoved = this.question.choices.splice(index, 1);
                    this.question.choices.splice(index - 1, 0, arrRemoved[0]);
                },
                moveDown: function (index) {
                    if (index >= this.question.choices.length - 1) {
                        return;
                    }
                    let arrRemoved = this.question.choices.splice(index, 1);
                    this.question.choices.splice(index + 1, 0, arrRemoved[0]);
                }
            }
        });
        Vue.component("question-choices-tree-item", {
            template: "<div class='choicesTreeItem'>\
                            <input type='text' v-model='choice.value'/>\
                            <v-btn small @click='$emit(\"remove-choice\")'>-</v-btn>\
                            <v-btn small v-if='!isFirst' @click='$emit(\"move-up\")'>/\\</v-btn>\
                            <v-btn small v-if='!isLast' @click='$emit(\"move-down\")'>\\/</v-btn>\
                            <v-btn small @click='addChoice()'>&gt;+</v-btn>\
                            <question-choices-tree-item v-if='choice.childs' v-for='childItem,i in choice.childs' :choice='childItem' :key='\"item-\"+i' :isFirst='i===0' :isLast='i===(choice.childs.length-1)' @remove-choice='removeChoice(i)' @move-up='moveUp(i)' @move-down='moveDown(i)'></question-choices-tree-item>\
                        </div>",
            props: ["choice", "isFirst", "isLast"],
            methods: {
                addChoice: function () {
                    if (this.choice.childs) {
                        this.choice.childs.push({
                            value: "..."
                        });
                    } else {
                        this.$set(this.choice, "childs", [{
                            value: "..."
                        }]);
                    }
                },
                removeChoice: function (index) {
                    this.choice.childs.splice(index, 1);
                },
                moveUp: function (index) {
                    if (index === 0) {
                        return;
                    }
                    let arrRemoved = this.choice.childs.splice(index, 1);
                    this.choice.childs.splice(index - 1, 0, arrRemoved[0]);
                },
                moveDown: function (index) {
                    if (index >= this.choice.childs.length - 1) {
                        return;
                    }
                    let arrRemoved = this.choice.childs.splice(index, 1);
                    this.choice.childs.splice(index + 1, 0, arrRemoved[0]);
                }
            }
        });

        Vue.component("question-evaluate", {
            template: "<td>\
                        <div>Min: <input type='text' v-model.number='question.min'/> Label: <input type='text' v-model='question.labelMin'/></div>\
                        <div>Max: <input type='text' v-model.number='question.max'/> Label: <input type='text' v-model='question.labelMax'/></div>\
                        <div>Step: <input type='text' v-model.number='question.step' placeholder='1'/></div>\
                        <div>Display N/A: <input type='checkbox' v-model.number='question[\"dispN/A\"]'/></div>\
                    </td>",
            props: ["column", "question"]
        });

        Vue.component("question-show-if", {
            template: "<td>\
                            <input type='checkbox' @change='changed'/>\
                            <div v-if='typeof question.showIf!==\"undefined\"'>\
                                Question to Check: <select v-model.number='question.showIf.questionIndex'><option v-for='qobj,i in getQuestionsFiltered' :value='qobj.value'>{{qobj.label}}</option></select><br>\
                                Condition: <select v-model='question.showIf.condition'><option value='equals'>Equals</option></select><br>\
                                Value to check: <input type='text' v-model='question.showIf.value'/>\
                            </div>\
                        </td>",
            props: ["column", "question"],
            methods: {
                changed: function (ev) {
                    if (ev && ev.target && ev.target.checked) {
                        this.$set(this.question, "showIf", {
                            "questionIndex": 7,
                            "condition": "equals",
                            "value": ""
                        });
                    } else {
                        //delete the key and remove the reactivity on it
                        this.$delete(this.question, "showIf");
                    }
                }
            },
            computed: {
                getQuestionsFiltered: function () {
                    vueApp.questions;
                    let res = [];
                    for (let i = 0; i < vueApp.questions.length; i++) {
                        const qObj = vueApp.questions[i];
                        if (qObj.id !== this.question.id) {
                            res.push({
                                label: qObj.id,
                                value: i
                            });
                        } else {
                            //We don't want to be dependent on the result of a question that is asked after the current one !
                            break;
                        }
                    }
                    return res;
                }
            }
        });

        Vue.component("question-actions", {
            template: "<td>\
                            <v-btn small @click='$emit(\"remove-question\")'>Remove</v-btn>\
                            <v-btn small @click='$emit(\"add-question\")'>Add Question</v-btn>\
                        </td>"
        });

        var vueApp;

        var myWidget = {
            // Widget Events
            onLoadWidget: function () {
                var wdgUrl = widget.getUrl();
                wdgUrl = wdgUrl.substring(0, wdgUrl.lastIndexOf("/"));

                widget.setIcon(wdgUrl + "/../UM5Modules/assets/icons/custom-widget-icon.png");

                var wdgTitlePref = widget.getValue("wdgTitle");
                if (wdgTitlePref) {
                    widget.setTitle(wdgTitlePref);
                }

                $(widget.body).html("Loading Configurations...");

                //Init Vue

                $(widget.body).html(
                    "<div id='appVue'>\
                        <v-app style='height:100%;'>\
                            <div id='topBar'>\
                                <v-content>\
                                    <v-select v-model='configName' :items='listConfigs' label='Config Name' style='max-width:50%' hide-details></v-select>\
                                    <div style='position:absolute;top:0%;right:0%;'>\
                                        <v-btn v-if='configName!==\"\"' v-on:click='saveConfig()' dark color='green' :loading='savePending'>Save Config</v-btn>\
                                        <v-btn v-if='configName!==\"\"' v-on:click='deleteConfig()' dark color='red'>Delete Config</v-btn>\
                                        <v-btn v-on:click='addConfig()' color='primary'>New Config</v-btn>\
                                    </div>\
                                </v-content>\
                            </div>\
                            <div v-if='configName!==\"\"' style='height:90%;overflow:auto;background-color: white;'>\
                                <div @click='showQuestionsConfPanel=!showQuestionsConfPanel' class='toggleHeader'>\
                                    <v-icon v-if='showQuestionsConfPanel'>keyboard_arrow_down</v-icon><v-icon v-else>keyboard_arrow_right</v-icon>Questions\
                                </div>\
                                <div v-show='showQuestionsConfPanel'>\
                                    <table>\
                                        <thead>\
                                            <tr>\
                                                <th v-for='col in columns' :key='col.id'>{{col.head}}</th>\
                                            </tr>\
                                        </thead>\
                                        <!-- Not using directly a component by it's name here but using 'is' -->\
                                        <!-- because the web browser expect a tbody and if tag is not recognized it puts it out of the table -->\
                                        <tbody is='questions-table' :questions='questions' :columns='columns'>\
                                        </tbody>\
                                    </table>\
                                </div>\
                                <div @click='showWebSocketConfPanel=!showWebSocketConfPanel' class='toggleHeader'>\
                                    <v-icon v-if='showWebSocketConfPanel'>keyboard_arrow_down</v-icon><v-icon v-else>keyboard_arrow_right</v-icon>WebSocket\
                                </div>\
                                <div v-show='showWebSocketConfPanel'><v-text-field label='WebSocket URL' v-model='urlWebSocket' hide-details></v-text-field></div>\
                                <div @click='showStartPanelConfPanel=!showStartPanelConfPanel' class='toggleHeader'>\
                                    <v-icon v-if='showStartPanelConfPanel'>keyboard_arrow_down</v-icon><v-icon v-else>keyboard_arrow_right</v-icon>Start Page\
                                </div>\
                                <div v-show='showStartPanelConfPanel'>\
                                    <v-text-field label='Img URL' v-model='startPage.img' hide-details></v-text-field>\
                                    <v-text-field label='Img CSS' v-model='startPage.imgCss' hide-details></v-text-field>\
                                    <v-text-field label='Text' v-model='startPage.text' hide-details></v-text-field>\
                                </div>\
                                <div @click='showEndPanelConfPanel=!showEndPanelConfPanel' class='toggleHeader'>\
                                    <v-icon v-if='showEndPanelConfPanel'>keyboard_arrow_down</v-icon><v-icon v-else>keyboard_arrow_right</v-icon>End Page\
                                </div>\
                                <div v-show='showEndPanelConfPanel'>\
                                    <v-text-field label='Img URL' v-model='endPage.img' hide-details></v-text-field>\
                                    <v-text-field label='Img CSS' v-model='endPage.imgCss' hide-details></v-text-field>\
                                    <v-text-field label='Text' v-model='endPage.text' hide-details></v-text-field>\
                                </div>\
                            </div>\
                        </v-app>\
                    </div>"
                );


                //Init vue App
                vueApp = new Vue({
                    el: "#appVue",
                    data: {
                        configName: "",
                        listConfigs: [],
                        //Display of question :
                        columns: [{
                            head: "Id",
                            key: "id"
                        }, {
                            head: "Q?",
                            key: "question"
                        }, {
                            head: "Type",
                            key: "type"
                        }, {
                            head: "Options",
                            key: "options"
                        }, {
                            head: "Show If",
                            key: "showIf"
                        }, {
                            head: "Actions",
                            key: "actions"
                        }],
                        questions: [],
                        startPage: {
                            "img": "https://3dexp.18xfd01.ds/Widgets/UM5Quizz/assets/compass.png",
                            "imgCss": "max-height:4em;",
                            "text": "Please could you spend 1 minute to give your vision about <a href='https://3ds.com/'><b>3D</b>EXPERIENCE Platform</a> usages"
                        },
                        endPage: {
                            "img": "https://3dexp.18xfd01.ds/Widgets/UM5Quizz/assets/compassEnd.png",
                            "imgCss": "max-height:8em;",
                            "text": "Thanks for taking this Quizz !<br/><br/>You are now ready to discover few usages of the <a href='https://3ds.com/'><b>3D</b>EXPERIENCE Platform</a> you may not think about!"
                        },
                        urlWebSocket: "wss://3dexp.18xfd01.ds/UM5QuizzWebSocket",
                        head: "Demo Quizz <b>3D</b>EXPERIENCE",
                        savePending: false,

                        showQuestionsConfPanel: true,
                        showWebSocketConfPanel: false,
                        showStartPanelConfPanel: false,
                        showEndPanelConfPanel: false
                    },
                    methods: {
                        addConfig: () => {
                            let confName = prompt("Please enter a config name :", "newQuizz001");
                            vueApp.listConfigs.push(confName);
                            vueApp.configName = confName;
                            vueApp.startPage = {
                                "img": "",
                                "imgCss": "",
                                "text": ""
                            };
                            vueApp.endPage = {
                                "img": "",
                                "imgCss": "",
                                "text": ""
                            };
                            vueApp.urlWebSocket = "wss://";
                        },
                        saveConfig: () => {
                            let confName = vueApp.configName;
                            vueApp.savePending = true;
                            myWidget.saveConfig(confName, vueApp.getJSON4Questions());
                        },
                        deleteConfig: () => {
                            let confName = vueApp.configName;
                            if (confirm("You are about to delete the Quizz Configuration: " + confName + "\n Are you sure to want to delete it ?")) {
                                myWidget.deleteConfig(confName);
                            }
                        },
                        getJSON4Questions: function () {
                            return JSON.stringify({
                                "urlWebSocket": this.urlWebSocket,
                                "head": this.head,
                                "startPage": this.startPage,
                                "endPage": this.endPage,
                                "questions": this.questions
                            });
                        }
                    },
                    watch: {
                        configName: (newConfName) => {
                            myWidget.getConfig(newConfName);
                        }
                    }
                });

                qCount4Id = vueApp.questions.length;

                myWidget.loadConfigs();
            },

            onRefreshWidget: () => {
                console.debug("Refresh ignored");
            },

            loadConfigs: () => {
                let baseUrl = widget.getValue("baseURL");
                $.ajax({
                    dataType: "json",
                    url: baseUrl + "/UM5QuizzModeler/UM5QuizzWS/listConfigs",
                    method: "GET",
                    data: "",
                    success: function (data) {
                        vueApp.listConfigs.splice(0, vueApp.listConfigs.length); //Replace everything with the new values
                        for (let i = 0; i < data.length; i++) {
                            const confName = data[i];
                            vueApp.listConfigs.push(confName);
                        }
                    },
                    error: function (jqXHR, txtStatus, errorThrown) {
                        console.error("Error will loading config File :" + +txtStatus + "<br>" + errorThrown);
                    }
                });
            },

            saveConfig: (confName, confContent) => {
                //Everything is OK, let's save
                let baseUrl = widget.getValue("baseURL");
                $.ajax({
                    dataType: "json",
                    url: baseUrl + "/UM5QuizzModeler/UM5QuizzWS/config/" + confName,
                    method: "POST",
                    contentType: "text/plain",
                    data: confContent,
                    success: function (data) {
                        console.debug("Save done at " + new Date().toLocaleString(), "data=", data);
                        vueApp.savePending = false;
                    },
                    error: function (jqXHR, txtStatus, errorThrown) {
                        console.error("Error will saving config :" + +txtStatus + "<br>" + errorThrown);
                        vueApp.savePending = false;
                    }
                });
            },

            getConfig: (confName) => {
                let baseUrl = widget.getValue("baseURL");
                $.ajax({
                    dataType: "json",
                    url: baseUrl + "/UM5QuizzModeler/UM5QuizzWS/config/" + confName,
                    method: "GET",
                    data: "",
                    success: function (data) {
                        vueApp.configJSON = JSON.stringify(data);
                        for (let i = 0; i < data.questions.length; i++) {
                            let qObj = data.questions[i];
                            qObj.id = "q" + (i + 1);
                        }
                        vueApp.questions = data.questions;
                        vueApp.startPage = data.startPage || {
                            "img": "",
                            "imgCss": "",
                            "text": ""
                        };
                        vueApp.endPage = data.endPage || {
                            "img": "",
                            "imgCss": "",
                            "text": ""
                        };
                        vueApp.urlWebSocket = data.urlWebSocket || "wss://";

                        qCount4Id = vueApp.questions.length;
                    },
                    error: function (jqXHR, txtStatus, errorThrown) {
                        console.error("Error will loading config JSON :" + txtStatus + "<br>" + errorThrown);
                        vueApp.configJSON = "{}";
                    }
                });
            },

            deleteConfig: (confName) => {
                //Everything is OK, let's save
                let baseUrl = widget.getValue("baseURL");
                $.ajax({
                    dataType: "json",
                    url: baseUrl + "/UM5QuizzModeler/UM5QuizzWS/config/" + confName,
                    method: "DELETE",
                    contentType: "text/plain",
                    data: "",
                    success: function (data) {
                        //Remove it from list of confs
                        vueApp.listConfigs.splice(vueApp.listConfigs.indexOf(confName), 1);
                        console.debug("Delete done at " + new Date().toLocaleString(), "data=", data);
                    },
                    error: function (jqXHR, txtStatus, errorThrown) {
                        console.error("Error will loading Deleteing config :" + +txtStatus + "<br>" + errorThrown);
                    }
                });
            }
        };

        widget.addEvent("onLoad", myWidget.onLoadWidget);
        widget.addEvent("onRefresh", myWidget.onRefreshWidget);
        //widget.addEvent("onSearch", myWidget.onSearchWidget);
        //widget.addEvent("onResetSearch", myWidget.onResetSearchWidget);

        //widget.addEvent("onConfigChange", myWidget.onConfigChange); //For change of Table Config in list
    });
}