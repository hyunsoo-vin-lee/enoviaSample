/*
 * BT WW Competencies Center - Fast Prototypes Team
 * @author UM5
 */

function executeWidgetCode() {
    require.config({
        paths: {
            vue: "./BTWWLibrairies/vue/vue", //Need this with "vue" all lower case, else Vuetify can't load correctly
            Vuetify: "./BTWWLibrairies/vuetify/vuetify",
            CSSRoboto: "./BTWWLibrairies/fonts/Roboto", //"https://fonts.googleapis.com/css?family=Roboto:300,400,500,700",
            CSSMaterial: "./BTWWLibrairies/MaterialDesign/material-icons",
            vueloader: "./BTWWLibrairies/requirejs-vue", //"https://unpkg.com/requirejs-vue@1.1.5/requirejs-vue",
            current: "./UM5Viewer"
        }
    });

    require([
        "UWA/Drivers/jQuery",
        "vue",
        "Vuetify",
        "DS/PlatformAPI/PlatformAPI",
        "UM5Modules/Connector3DExp",
        "DS/DataDragAndDrop/DataDragAndDrop",
        "text!UM5Viewer/vue/App.html",
        "text!UM5Viewer/vue/ViewerRaw.html",
        "text!UM5Viewer/vue/ViewerImg.html",
        "text!UM5Viewer/vue/ViewerVideo.html",
        "text!UM5Viewer/vue/ViewerPDF.html",
        "text!UM5Viewer/vue/ViewerCSV.html",
        "text!UM5Viewer/vue/ViewerXLSX.html",
        "BTWWLibrairies/sheetjs/xlsx.full.min",
        "css!BTWWLibrairies/vuetify/vuetify.min.css",
        "css!BTWWLibrairies/MaterialDesign/material-icons.css"
    ], function ($, Vue, Vuetify, PlatformAPI, Connector3DExp, DataDragAndDrop, appVue, viewerRawVue, viewerImgVue, viewerVideoVue, viewerPDFVue, viewerCSVVue, viewerXlsxVue, XLSX) {

        Vue.use(Vuetify); //To plug vuetify components

        let managedTypes = ["Document", "Service Content"];

        let mapExtensionToViewerType = {
            "json": "viewer-raw",
            "txt": "viewer-raw",
            "csv": "viewer-csv",
            "pdf": "viewer-pdf",
            "jpg": "viewer-img",
            "png": "viewer-img",
            "gif": "viewer-img",
            "mp4": "viewer-video",
            "xlsx": "viewer-xlsx"
        };

        Vue.component("viewer-unsuported", {
            template: "<div>Format not supported, Yet...</div>",
            props: ["object"]
        });

        Vue.component("viewer-raw", {
            template: viewerRawVue,
            props: ["object"]
        });

        Vue.component("viewer-img", {
            template: viewerImgVue,
            props: ["object"],
            methods: {
                getObjectData: function () {
                    console.debug("getObjectData", URL.createObjectURL(this.object.content));
                    //return "data:application/octet-stream;base64," + btoa(this.object.content);//KO
                    return URL.createObjectURL(this.object.content);
                }
            }
        });

        Vue.component("viewer-video", {
            template: viewerVideoVue,
            props: ["object"],
            methods: {
                getObjectData: function () {
                    console.debug("getObjectData", URL.createObjectURL(this.object.content));
                    //return "data:application/octet-stream;base64," + btoa(this.object.content);//KO
                    return URL.createObjectURL(this.object.content);
                }
            }
        });

        Vue.component("viewer-pdf", {
            template: viewerPDFVue,
            props: ["object"],
            methods: {
                getObjectData: function () {
                    console.debug("getObjectData", URL.createObjectURL(this.object.content));
                    //return "data:application/octet-stream;base64," + btoa(this.object.content);//KO
                    return URL.createObjectURL(this.object.content);
                }
            }
        });

        Vue.component("viewer-csv", {
            template: viewerCSVVue,
            props: ["object"],
            methods: {
                tableData: function () {
                    let resTable = [];
                    if (this.object.contentText) {
                        let arrLines = this.object.contentText.split("\n");
                        let splitColumns = ",";
                        //Auto detect if "," or "\t" are used to separate the columns
                        let firstLine = arrLines[0];
                        if (firstLine && firstLine.length !== "") {
                            let arrSplitComma = firstLine.split(",");
                            let arrSplitTab = firstLine.split("\t");
                            if (arrSplitTab.length > arrSplitComma.length) {
                                splitColumns = "\t";
                            }
                        }
                        //Generate and clean the data for the display
                        for (let i = 0; i < arrLines.length; i++) {
                            const line = arrLines[i];
                            let arrCells = line.split(splitColumns);
                            let arrLine = [];
                            for (let j = 0; j < arrCells.length; j++) {
                                let cell = arrCells[j];
                                if (cell.indexOf("\"") === 0 && cell.indexOf("\"") === cell.length - 1 || cell.indexOf("'") === 0 && cell.indexOf("'") === cell.length - 1) {
                                    cell = cell.substring(1, cell.length - 1);
                                } else if (cell.indexOf("\"") === 0 || cell.indexOf("'") === 0) {
                                    let quoteSymbole = cell.charAt(0);
                                    let nextCell;
                                    do {
                                        nextCell = arrCells[j + 1];
                                        cell += nextCell;
                                        j++;
                                    } while (nextCell.indexOf(quoteSymbole) !== nextCell.length - 1);
                                    cell = cell.substring(1, cell.length - 1);
                                }
                                arrLine.push(cell);
                            }
                            resTable.push(arrLine);
                        }
                    }
                    return resTable;
                }
            }
        });

        Vue.component("viewer-xlsx", {
            template: viewerXlsxVue,
            props: ["object"],
            data: function () {
                return {
                    workbook: null,
                    sheet: null
                };
            },
            methods: {
                initWorkbook: function () {
                    var data = new Uint8Array(this.object.arraybuffer);
                    var workbook = XLSX.read(data, {
                        type: "array"
                    });
                    this.workbook = workbook;
                },
                sheetsNames: function () {
                    if (!this.workbook) {
                        this.initWorkbook();
                    }
                    return this.workbook.SheetNames;
                },
                tableData: function () {
                    let resTable = [];
                    if (!this.workbook) {
                        this.initWorkbook();
                    }

                    if (!this.sheet) {
                        this.sheet = this.workbook.SheetNames[0];
                    }

                    let sheet = this.workbook.Sheets[this.sheet];
                    let jsonTable = XLSX.utils.sheet_to_json(sheet, {
                        header: 1 //Not working without that !!
                    });

                    resTable = jsonTable;

                    return resTable;
                }
            }
        });

        let vueApp;

        let myWidget = {
            // Widget Events
            _subSelect: null,

            onLoadWidget: function () {
                let wdgUrl = widget.getUrl();
                wdgUrl = wdgUrl.substring(0, wdgUrl.lastIndexOf("/"));

                widget.setIcon(wdgUrl + "/../UM5Modules/assets/icons/custom-widget-icon.png");

                let wdgTitlePref = widget.getValue("wdgTitle");
                if (wdgTitlePref) {
                    widget.setTitle(wdgTitlePref);
                }

                if (!myWidget._subSelect) {
                    myWidget._subSelect = PlatformAPI.subscribe("Select_Object", myWidget.objectSelected);
                }

                Connector3DExp.useWidgetHub = false;
                //Load the security context and Tenant infos so we have it in the Preferences right away
                Connector3DExp.loadSecCtx();

                $(widget.body).html(appVue);

                vueApp = new Vue({
                    el: "#appVue",
                    data: {
                        object: null,
                        viewerComponent: "viewer-raw"
                    },
                    methods: {
                        setDocument: function (objDoc) {
                            this.object = null; //Reset the view
                            this.viewerComponent = "viewer-raw";

                            if (objDoc.hasFile) {
                                if (objDoc.error) {
                                    objDoc.content = objDoc.error;
                                    this.viewerComponent = "viewer-raw";
                                } else {
                                    let extFile = objDoc.fileName.substring(objDoc.fileName.lastIndexOf(".") + 1);
                                    let viewerType = mapExtensionToViewerType[extFile] || "viewer-unsuported";
                                    this.viewerComponent = viewerType;
                                }
                            } else {
                                objDoc.content = "This Document has no file attached.";
                                this.viewerComponent = "viewer-raw";
                            }
                            this.object = objDoc;
                            if (this.viewerComponent === "viewer-raw" || this.viewerComponent === "viewer-csv") {
                                var reader = new FileReader();
                                reader.addEventListener("loadend", function () {
                                    // reader.result contains the contents of blob as a typed array
                                    vueApp.$set(vueApp.object, "contentText", reader.result);
                                });
                                reader.readAsText(this.object.content);
                            }
                        }
                    },
                    mounted: function () {
                        //Add Drop capability
                        let elementForDrop = this.$el;
                        DataDragAndDrop.droppable(elementForDrop, {
                            drop: function (data) {
                                var dataDnD = JSON.parse(data);
                                if (dataDnD.protocol === "3DXContent") {
                                    let arrOids = dataDnD.data.items;
                                    let item = arrOids[0];
                                    myWidget.objectSelected(item);
                                }
                            }
                        });

                    }
                });
            },

            objectSelected: function (data) {
                console.debug("objectSelected", data);
                if (data.widgetId && data.widgetId === widget.id) {
                    console.debug("objectSelected Avoid self select");
                    return; //Avoid self select
                } else if (data.objectType && data.objectId && managedTypes.indexOf(data.objectType) !== -1) {
                    //It's a type that we should be able to display
                    console.debug("objectSelected It's a type that we should be able to display");
                    myWidget.loadObjectInfo(data);
                }
            },

            loadObjectInfo: function (data) {
                let objDoc = {
                    id: data.objectId,
                    type: data.objectType,
                    name: "Loading",
                    content: "Loading..."
                };

                vueApp.object = null; //Reset the view
                vueApp.viewerComponent = "viewer-raw"; //Reset the view

                Connector3DExp.call3DSpace({
                    url: "/UM5Tools/DocFile/info/" + objDoc.id,
                    method: "GET",
                    type: "json",
                    data: {},
                    forceReload: true,
                    onComplete: (data) => {
                        console.debug("data DocInfo:", data);
                        for (const key in data) {
                            if (data.hasOwnProperty(key)) {
                                const value = data[key];
                                objDoc[key] = value;
                            }
                        }

                        if (objDoc.hasFile) {
                            //Call to get the file and put it in content prop of objDoc

                            let urlToGetFile = Connector3DExp.getCurrentTenantInfo()["3DSpace"] + "/UM5Tools/DocFile/checkout/" + objDoc.id + "/" + objDoc.format + "/" + objDoc.fileName;

                            //https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Sending_and_Receiving_Binary_Data
                            let req = new XMLHttpRequest();
                            req.open("GET", urlToGetFile, true);
                            //req.responseType = "application/octet-stream";
                            //req.responseType = "blob";
                            req.responseType = "arraybuffer";

                            //Manage Security Context of 3DSpace
                            var strCtx = widget.getValue(Connector3DExp._widgetPref4Ctx);
                            if (typeof strCtx === "object") {
                                strCtx = strCtx.value;
                            }
                            if (strCtx && strCtx.length > 0 && strCtx.indexOf("ctx::") !== 0) {
                                strCtx = "ctx::" + strCtx;
                            }
                            req.setRequestHeader("SecurityContext", strCtx);

                            req.withCredentials = true; //For CORS calls, pass the Cookies

                            req.onload = function (e) {
                                if (this.status === 200) {
                                    let objType = "application/octet-stream";
                                    if (objDoc.fileName.indexOf(".pdf") === objDoc.fileName.length - 4) {
                                        objType = "application/pdf";
                                    }
                                    //var data = new Uint8Array(req.response);
                                    var data = req.response;
                                    objDoc.content = new Blob([data], {
                                        type: objType
                                    });

                                    objDoc.arraybuffer = data;

                                    vueApp.setDocument(objDoc);
                                } else {
                                    console.error("Error will getting the file from FCS", e);
                                    objDoc.error = "Impossible to load the Data";
                                    vueApp.setDocument(objDoc);
                                }
                            };

                            req.send(); //Send the XHR
                        } else {
                            vueApp.setDocument(objDoc);
                        }
                    },
                    onFailure: () => {
                        console.debug("Call Failed, /UM5Tools/DocFile/info :'(");
                    }
                });


            }
        };

        widget.addEvent("onLoad", myWidget.onLoadWidget);
        //widget.addEvent("onRefresh", myWidget.onLoadWidget);
        //widget.addEvent("onSearch", myWidget.onSearchWidget);
        //widget.addEvent("onResetSearch", myWidget.onResetSearchWidget);

        //widget.addEvent("onConfigChange", myWidget.onConfigChange); //For change of Table Config in list
    });
}