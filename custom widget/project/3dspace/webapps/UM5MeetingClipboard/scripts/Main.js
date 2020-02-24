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
            current: "./UM5MeetingClipboard"
        }
    });

    let vueApp; //Declare it here so it can be used in some modules defined here

    require(["vue",
        "Vuetify",
        "UM5Modules/Connector3DExp",
        "DS/PlatformAPI/PlatformAPI",
        "css!BTWWLibrairies/vuetify/vuetify.min.css",
        "css!CSSRoboto",
        "css!CSSMaterial",
        "vueloader!current/vue/drop-zone",
        "vueloader!current/vue/list-clipboard-items",
        "vueloader!current/vue/message-list"
    ], function (Vue, Vuetify, Connector3DExp, PlatformAPI) {

        Vue.use(Vuetify); //To plug vuetify components

        var myWidget = {
            pAPISubs: {},
            // Widget Events
            onLoadWidget: function () {

                //Disable iframe.css so we don't have the default widget css stuff that is broken some times
                let styleSheets = document.styleSheets;
                for (let i = 0; i < styleSheets.length; i++) {
                    const sheet = styleSheets.item(i);
                    if (sheet.href && sheet.href.indexOf("UWA/assets/css/iframe.css") !== -1) {
                        sheet.disabled = true;
                    }
                }

                Connector3DExp.useWidgetHub = false; //Issues to load communities list
                Connector3DExp.loadSecCtx();

                var wdgUrl = widget.getUrl();
                wdgUrl = wdgUrl.substring(0, wdgUrl.lastIndexOf("/"));

                widget.setIcon(wdgUrl + "/../UM5Modules/assets/icons/custom-widget-icon.png");

                var wdgTitlePref = widget.getValue("wdgTitle");
                if (wdgTitlePref) {
                    widget.setTitle(wdgTitlePref);
                }

                widget.setBody(
                    `<div id='appVue'>
                        <v-app style='height:100%;font-size:16px;'>
                            <v-progress-linear v-show='progress>=0' height='4' style='margin:0em;position:absolute;' :indeterminate='progress===0' v-model='progress'></v-progress-linear>
                            <message-list :messages='messages'></message-list>
                            
                            <div style='height:50px;border-bottom:1px solid lightgrey;color:#b4b6ba;line-height: 40px;'>
                                <v-icon title='Add Text' @click='addNewText' style='color:#b4b6ba;vertical-align: middle;margin-right:0.25em;'>note_add</v-icon>
                                <v-icon title='Clear Clipboard' @click='clearList' style='color:#b4b6ba;vertical-align: middle;margin-right:0.25em;'>delete_sweep</v-icon>
                                <div style='display:inline-block;position:absolute;right:0em;width:50%;text-align:right;vertical-align: middle;'>
                                    <img title='Save as swym post' @click='showSwymAdd=true' style='height:1.8em;vertical-align: middle;' src="${wdgUrl}/assets/SwymAdd.png" />
                                </div>
                            </div>

                            <drop-zone style='height:calc(100% - 50px);' @drop-on='droppedObject'>
                                <list-clipboard-items :items='listOfObjects' style='height:100%;overflow-y:auto;padding:1em;' @remove-item='removeItem'></list-clipboard-items>
                            </drop-zone>

                            <div v-if="showSwymAdd" style="position:absolute;top:0em;left:0em;right:0em;bottom:0em;background-color:rgba(192,192,192,0.5);">
                                <div style="position:absolute;top:1em;left:1em;right:1em;background-color:white;box-shadow: 0.25em 0.25em 0.5em grey;text-align: right;">
                                    <v-select :items='listOfCommunities' item-text='title' item-value='id' v-model='selectedCommunity' label='Select a Community' dense single-line hide-details></v-select>
                                    <v-btn :disabled="selectedCommunity===''" @click='saveToSwym' color="primary" title='Save as swym post' ><v-icon>add</v-icon>Add</v-btn>
                                    <v-btn @click='showSwymAdd=false;' title='Cancel Save as swym post'><v-icon>close</v-icon>Cancel</v-btn>
                                </div>
                            </div>
                        </v-app>
                    </div>`
                );

                let broadCastChannel;
                try {
                    //broadCastChannel = new BroadcastChannel("um5MeetingClipboard");//Commented to deactivate the Synchro mecanism
                } catch (error) {
                    console.warn(error);
                }

                let initialListOfObjects = [];
                try {
                    if (!top.um5MeetingClipboard) {
                        //Init storing object if not already there
                        top.um5MeetingClipboard = {
                            listOfObjects: []
                        };
                    } else {
                        initialListOfObjects = myWidget.deepCopy(top.um5MeetingClipboard.listOfObjects); //To save a copy
                    }
                } catch (err) {
                    //Fail silently
                    console.warn("Top not accessible for storage");
                }

                if (initialListOfObjects.length === 0) {
                    //Still empty list then add initial Text if specified in the Preferences
                    let initTxt = widget.getValue("initText");
                    if (initTxt && initTxt !== "") {
                        initialListOfObjects.push({
                            type: "HTML",
                            category: "inData",
                            data: initTxt
                        });
                    }
                }

                //Init vue App
                vueApp = new Vue({
                    el: "#appVue",
                    data: {
                        progress: -1,
                        messages: [],

                        showSwymAdd: false,

                        listOfObjects: initialListOfObjects,
                        listOfCommunities: [],
                        selectedCommunity: "",
                        syncLockUpdate: false,
                        syncLockTimeout: undefined
                    },
                    computed: {},
                    watch: {
                        listOfObjects: {
                            deep: true,
                            handler: function (newValue) {

                                console.log(widget.id + " - listOfObjects Modified - syncLock:", this.syncLockUpdate, "newValue", JSON.stringify(newValue));

                                if (!this.syncLockUpdate) {
                                    try {
                                        //Save on top because localstorage or sessionstorage authorize only Strings to be stored in them :/
                                        top.um5MeetingClipboard.listOfObjects = newValue.slice(); //Save a copy to avoid having another vue instance redefining the setters and getters
                                        //Notify the other Meeting clipboard widget that the content as been updated.
                                        let notifObj = {
                                            action: "refresh",
                                            widgetId: widget.id
                                        };

                                        console.log(widget.id + " - Broadcast the update", JSON.stringify(top.um5MeetingClipboard.listOfObjects));
                                        if (broadCastChannel) {
                                            broadCastChannel.postMessage(notifObj);
                                        }

                                    } catch (err) {
                                        console.error(err);
                                    }
                                } else {
                                    //Unlock here because this watch function is called after the end of the onMessage fonction called when receicving update from Broadcast channel
                                    console.log(widget.id + " - Unlock Sync");
                                    this.syncLockUpdate = false;
                                    this.syncLockTimeout = undefined;
                                }
                                console.log(widget.id + " - listOfObjects Modified End - new Value :", JSON.stringify(newValue), " - current - ", JSON.stringify(this.listOfObjects));
                            }
                        }
                    },
                    methods: {
                        addNewText: function () {
                            this.listOfObjects.push({
                                type: "Text",
                                category: "outData",
                                data: ""
                            });
                        },
                        removeItem: function (index) {
                            this.listOfObjects.splice(index, 1);
                        },
                        clearList: function () {
                            this.$set(this, "listOfObjects", []);
                        },
                        droppedObject: function (ev) {

                            let preTypesOfInfos = ev.dataTransfer.types;
                            //MS Edge bug with DOMStringList instead of Array, so quick cast here
                            let typesOfInfos = [];
                            for (let i = 0; i < preTypesOfInfos.length; i++) {
                                const element = preTypesOfInfos[i];
                                typesOfInfos.push(element);
                            }
                            console.debug("typesOfInfos", typesOfInfos);

                            for (let i = 0; i < typesOfInfos.length; i++) {
                                const typeDrop = typesOfInfos[i];
                                console.debug("type: ", typeDrop, "data: ", ev.dataTransfer.getData(typeDrop));
                            }

                            let bObjectExtracted = false;

                            if (typesOfInfos.indexOf("text/searchitems") !== -1) {
                                //Probably an object dropped from another widget, 3DSearch, Bookmark Editor, UM5AdvancedTableV2, ...
                                let dataTxt = ev.dataTransfer.getData("text/searchitems");
                                try {
                                    let dataJson = JSON.parse(dataTxt);
                                    if (dataJson.protocol === "3DXContent") {
                                        //It's a Platform Object !
                                        this.addPlatformObject(dataJson);
                                        bObjectExtracted = true;
                                    }
                                } catch (err) {
                                    console.trace(err);
                                }
                            }
                            if (!bObjectExtracted && typesOfInfos.indexOf("text/plain") !== -1) {
                                let dataTxt = ev.dataTransfer.getData("text/plain");
                                //Try to see if it's a Platform object:
                                try {
                                    let dataJson = JSON.parse(dataTxt);
                                    if (dataJson.protocol === "3DXContent") {
                                        //It's a Platform Object !
                                        this.addPlatformObject(dataJson);
                                        bObjectExtracted = true;
                                    } else if (dataJson && dataJson.type && dataJson.type === "peopleCard") {
                                        this.addPersonFromDirectory(dataJson);
                                        bObjectExtracted = true;
                                    } else if (dataJson && dataJson.type && dataJson.type === "PhotoOnMap") {
                                        this.addJSONObject({
                                            gps: dataJson.gps
                                        });
                                        bObjectExtracted = true;
                                    }
                                } catch (err) {
                                    //Try to see if it's a link in the Text, if we are in MS Edge...
                                    //Else Do nothing try the other drop types
                                    if (dataTxt.indexOf("https://") === 0 || dataTxt.indexOf("http://") === 0) {
                                        //The text is a link ! (We are probbably in MS Edge here...)
                                        this.addURIObject(dataTxt);
                                        bObjectExtracted = true;
                                    }
                                }
                            }
                            if (!bObjectExtracted && typesOfInfos.indexOf("text/uri-list") !== -1) {
                                //URL dropped
                                let dataURI = ev.dataTransfer.getData("text/uri-list");
                                this.addURIObject(dataURI);
                                bObjectExtracted = true;
                            }
                            if (!bObjectExtracted && typesOfInfos.indexOf("text/html") !== -1) {
                                //URL dropped
                                let dataHtml = ev.dataTransfer.getData("text/html");
                                this.addHtmlObject(dataHtml);
                                bObjectExtracted = true;
                            }
                            if (!bObjectExtracted && typesOfInfos.indexOf("Files") !== -1) {
                                let fileList = ev.dataTransfer.files;
                                this.addFiles(fileList);
                                bObjectExtracted = true;
                            }

                            //Fallback option take the text or if possible JSON object
                            if (!bObjectExtracted && typesOfInfos.indexOf("text/plain") !== -1) {
                                let dataTxt = ev.dataTransfer.getData("text/plain");
                                try {
                                    let dataJson = JSON.parse(dataTxt);
                                    this.addJSONObject(dataJson);
                                } catch (err) {
                                    this.addTextObject(dataTxt);
                                }
                                bObjectExtracted = true;
                            } else if (!bObjectExtracted) {
                                console.warn("Unmanaged drop type... ", typesOfInfos);
                            }
                        },

                        addPlatformObject: function (dataJson) {
                            console.debug("addPlatformObject dataJson", dataJson);
                            //Split the items in data.items to add them separately in the list of objects to display
                            let itemsList = dataJson.data.items;
                            for (let i = 0; i < itemsList.length; i++) {
                                const item = itemsList[i];
                                let serviceId = item.serviceId;
                                let envId = item.envId;
                                let itemToPush = {
                                    type: "3DXContent",
                                    category: "inData",
                                    data: item
                                };
                                if (serviceId === "3DSpace") {
                                    let url3DSpace = Connector3DExp.getTenantInfoForPlatform(envId)[serviceId];
                                    let urlObj = url3DSpace + "/common/emxNavigator.jsp?objectId=" + item.objectId + "&tenant=" + envId;
                                    itemToPush.url = urlObj;
                                }

                                this.listOfObjects.push(itemToPush);

                            }
                        },
                        addURIObject: function (dataURI) {
                            console.debug("dataURI", dataURI);
                            /**
                             * Data URI format :
                             * http://example.com/link
                             * #Link to Example.com
                             * http://3ds.com
                             * #3DS.com
                             */
                            let arrURIs = [];
                            let arrLines = dataURI.split("\n");
                            for (let i = 0; i < arrLines.length; i++) {
                                const line = arrLines[i];
                                if (line.indexOf("#") === 0) {
                                    //It's a comment
                                    if (arrURIs.length > 0) {
                                        arrURIs[arrURIs.length - 1].comment = line;
                                    }
                                } else {
                                    //It's an URI
                                    arrURIs.push({
                                        uri: line
                                    });
                                }
                            }
                            for (let i = 0; i < arrURIs.length; i++) {
                                const uriItem = arrURIs[i];
                                this.listOfObjects.push({
                                    type: "URI",
                                    category: "inData",
                                    data: uriItem
                                });
                            }
                        },
                        addHtmlObject: function (dataHtml) {
                            console.debug("dataHtml", dataHtml);
                            this.listOfObjects.push({
                                type: "HTML",
                                category: "inData",
                                data: dataHtml
                            });
                        },
                        addTextObject: function (dataTxt) {
                            console.debug("dataTxt", dataTxt);
                            this.listOfObjects.push({
                                type: "Text",
                                category: "inData",
                                data: dataTxt
                            });
                        },
                        addFiles: function (fileList) {
                            for (let i = 0; i < fileList.length; i++) {
                                const file = fileList[i];

                                this.addFile(file);
                            }
                        },
                        addFile: function (file, fileName) {
                            const fType = file.type;

                            console.debug("mime type :", fType);

                            if (fType.indexOf("image/") === 0) {
                                let objImg = {
                                    type: "Image",
                                    category: "inData",
                                    data: file,
                                    fileName: fileName
                                };
                                //Read the Image for display
                                let fileReader = new FileReader();
                                fileReader.onload = (ev) => {
                                    objImg.imgUrl = ev.target.result;
                                    this.listOfObjects.push(objImg);
                                };
                                fileReader.readAsDataURL(file);
                            } else {
                                this.listOfObjects.push({
                                    type: "File",
                                    category: "inData",
                                    data: file,
                                    fileName: fileName
                                });
                            }
                        },
                        addPersonFromDirectory: function (dataJson) {
                            this.listOfObjects.push({
                                type: "Person",
                                category: "attendee",
                                data: dataJson
                            });
                        },
                        addJSONObject: function (dataJson) {
                            this.listOfObjects.push({
                                type: "JSON",
                                category: "inData",
                                data: dataJson,
                                html: this.buildTableFromJson(dataJson)
                            });
                        },

                        buildTableFromJson: function (data) {
                            let result = "<table><tbody>";
                            for (const key in data) {
                                if (data.hasOwnProperty(key)) {
                                    const value = data[key];
                                    if (typeof value === "object") {
                                        result += `<tr><td class="key">${key}</td><td>${this.buildTableFromJson(value)}</td></tr>`;
                                    } else {
                                        result += `<tr><td class="key">${key}</td><td>${value}</td></tr>`;
                                    }
                                }
                            }
                            result += "</tbody></table>";
                            return result;
                        },

                        loadListOfCommunities: function (page) {
                            let limit = 25;
                            page = page || 1;

                            if (page === 1) {
                                vueApp.progress = 0;
                            }

                            Connector3DExp.call3DSwym({
                                url: "/api/community/listmycommunities/limit/" + limit + "/page/" + page,
                                method: "GET",
                                type: "json",
                                headers: {
                                    "Content-Type": "application/json"
                                },
                                data: null,
                                callbackData: {},
                                forceReload: true,
                                onComplete: function (dataResp /*, headerResp, callbackData*/ ) {

                                    var arrResult = dataResp.result;
                                    vueApp.memorizeCommunities(arrResult);

                                    var nb_result = dataResp.nb_result;

                                    var nbLoaded = (page - 1) * limit + arrResult.length;
                                    if (nbLoaded < nb_result) {
                                        vueApp.progress = 100 * (nb_result - nbLoaded) / nb_result;
                                        vueApp.loadListOfCommunities(page + 1);
                                    } else {
                                        //All loaded
                                        vueApp.progress = 100;
                                        setTimeout(() => {
                                            vueApp.progress = -1;
                                        }, 100);
                                    }

                                },
                                onFailure: function (error) {
                                    var errorType = "WebService Call Faillure";
                                    var errorMsg = JSON.stringify(error);
                                    console.error(errorType + errorMsg);
                                }
                            });
                        },
                        memorizeCommunities: function (arrResult) {
                            for (let i = 0; i < arrResult.length; i++) {
                                const community = arrResult[i];
                                const idCommunity = community.id;
                                let doAdd = true;
                                for (let j = 0; j < vueApp.listOfCommunities.length; j++) {
                                    const existingCommunity = vueApp.listOfCommunities[j];
                                    if (existingCommunity.id === idCommunity) {
                                        vueApp.listOfCommunities[j] = community;
                                        doAdd = false;
                                        break;
                                    }
                                }
                                if (doAdd) {
                                    vueApp.listOfCommunities.push(community);
                                }
                            }
                        },
                        saveToSwym: function () {
                            this.showSwymAdd = false;
                            let currentDate = new Date();
                            let offsetUTCHour = -1 * currentDate.getTimezoneOffset() / 60;
                            let that = this;

                            vueApp.progress = 0;

                            let listAttendees = this.listOfObjects.filter((obj) => obj.category === "attendee" || obj.category === "ctxData");
                            let listInputs = this.listOfObjects.filter((obj) => obj.category === "inData" || obj.category === "person");
                            let listOuputs = this.listOfObjects.filter((obj) => obj.category === "outData");

                            this.getListFormattedFor3DSwym(listAttendees, (contentAttendees) => {
                                this.getListFormattedFor3DSwym(listInputs, (contentIn) => {
                                    this.getListFormattedFor3DSwym(listOuputs, (contentOut) => {
                                        let swymPostContent = `
                                                <h1>Meeting Information</h1>
                                                <h2>Meeting Date</h2>
                                                <p>${currentDate.toLocaleDateString()} ${currentDate.toLocaleTimeString()} UTC:${offsetUTCHour>=0?"+":""}${offsetUTCHour}</p>
                                                <h2>Meeting Attendees</h2>
                                                ${contentAttendees}
                                                <h1>References</h1>
                                                ${contentIn}
                                                <h1>Content</h1>
                                                ${contentOut}
                                            `;
                                        Connector3DExp.call3DSwym({
                                            url: "/api/post/add",
                                            method: "POST",
                                            type: "json",
                                            headers: {
                                                "Content-Type": "application/json"
                                            },
                                            data: JSON.stringify({
                                                params: {
                                                    title: "Meeting Note of " + currentDate.toLocaleDateString() + " " + currentDate.toLocaleTimeString(),
                                                    community_id: this.selectedCommunity,
                                                    published: 1,
                                                    message: swymPostContent
                                                }
                                            }),
                                            callbackData: {},
                                            forceReload: true,
                                            onComplete: function ( /*dataResp , headerResp, callbackData*/ ) {
                                                //console.log("Done !!");
                                                that.selectedCommunity = "";

                                                vueApp.progress = 100;
                                                setTimeout(() => {
                                                    vueApp.progress = -1;
                                                }, 100);

                                                //Message feedback to the user
                                                vueApp.messages.push({
                                                    level: "success",
                                                    title: "Post Created ",
                                                    message: "Post Created Successfully in the selected community",
                                                    sticky: false
                                                });
                                            },
                                            onFailure: function (error) {
                                                var errorType = "WebService Call Faillure";
                                                var errorMsg = JSON.stringify(error);
                                                console.error(errorType + errorMsg);
                                                vueApp.messages.push({
                                                    level: "error",
                                                    title: "Post Not Created ",
                                                    message: "An error happened will creating the post in the selected community",
                                                    sticky: false
                                                });
                                            }
                                        });
                                    });
                                });
                            });
                        },

                        getListFormattedFor3DSwym: function (listObjs, cbAllDone) {
                            let htmlResults = [];
                            let i = -1;
                            let errCount = 0;
                            let doNext = () => {
                                i++;
                                vueApp.progress = 100 * (i + 1) / listObjs.length;
                                if (i < listObjs.length) {
                                    const obj = listObjs[i];
                                    this.formatObjectFor3DSwym(obj, (htmlContent) => {
                                        htmlResults.push(htmlContent);
                                        doNext();
                                    }, (err) => {
                                        htmlResults.push(err);
                                        errCount++;
                                        doNext();
                                    });
                                } else {
                                    cbAllDone(htmlResults.join(""));
                                    if (errCount > 0) {
                                        vueApp.messages.push({
                                            level: "warn",
                                            title: "Post Created with missing content",
                                            message: "The post is created but some content might be missing in it, consider reviewing the Post in 3DSwym.",
                                            sticky: false
                                        });
                                    }
                                }
                            };
                            doNext(); //Launch the first one
                        },
                        formatObjectFor3DSwym: function (obj, cbDone, cbErr) {
                            //Manage the different kind of content: text, links, upload the images, files and generate their display...

                            if (obj.type === "Text" || obj.type === "HTML") {
                                cbDone("<p>" + obj.data + "</p>");
                                return;
                            } else if (obj.type === "URI") {
                                let txt = obj.data.comment || obj.data.uri;
                                cbDone(`<a data-type="external" href="${obj.data.uri}">${txt}</a><br>`);
                                return;
                            } else if (obj.type === "3DXContent") {
                                let dataObj = obj.data;
                                let serviceId = dataObj.serviceId;
                                let envId = dataObj.envId;
                                if (serviceId === "3DSpace") {
                                    //Generate the url for the 3DSpace object
                                    let url3DSpace = Connector3DExp.getTenantInfoForPlatform(envId)[serviceId];
                                    let urlObj = url3DSpace + "/common/emxNavigator.jsp?objectId=" + dataObj.objectId + "&tenant=" + envId;
                                    let txt = "3DSpace : " + dataObj.displayType + " - " + dataObj.displayName;
                                    cbDone(`<a data-type="external" href="${urlObj}">${txt}</a><br>`);
                                    return;
                                } else if (serviceId === "3DSwym") {
                                    //Treat 3DSwym content like external URL, this way we don't need to manage the case where the post is from another tenant :)
                                    let urlObj = dataObj.urlContent["3DSwym"] || dataObj.urlContent["3DD"];
                                    let txt = "3DSwym : " + dataObj.objectType + " - " + dataObj.displayName;
                                    cbDone(`<a data-type="external" href="${urlObj}">${txt}</a><br>`);
                                    return;
                                } else if (serviceId === "3DDrive") {
                                    let that = this;
                                    //Get the 3DDrive file before pushing to the list of Objects to display
                                    Connector3DExp.get3DDriveFileUrl({
                                        envId: envId,
                                        fileId: dataObj.objectId,
                                        onComplete: (fileURL) => {
                                            //Download the file now and save it in memory for upload to 3DSwym

                                            let req = new XMLHttpRequest();
                                            req.open("GET", fileURL, true);
                                            req.responseType = "blob";

                                            req.onload = function (e) {
                                                if (this.status === 200) {

                                                    //We have the file in the response
                                                    let fileBlob = new Blob([req.response]);

                                                    //Upload the file as 3DSwym media
                                                    let formData = new FormData(); //ref : https://developer.mozilla.org/en-US/docs/Web/API/FormData/Using_FormData_Objects
                                                    //data.append("myfile", myBlob, "filename.txt"); if File name isn't in the value / blob parameter

                                                    formData.append("community_id", that.selectedCommunity);
                                                    formData.append("published", 1);
                                                    formData.append("is_illustration", 1); //1 = not appearing in the main thread
                                                    formData.append("download_original_file", 1); //1 = can be downloaded from UI
                                                    formData.append("title", "File-" + dataObj.displayName);
                                                    //The file :
                                                    formData.append("userFile", fileBlob, dataObj.displayName);

                                                    //Example here :http://dsdoc/devdoccaa/3DEXPERIENCER2019x/en/English/CAASwymInfraRESTRef/CAA3DSwymQrAddMediaV2.htm
                                                    Connector3DExp.call3DSwym({
                                                        url: "/api/media/add",
                                                        method: "POST",
                                                        type: "json",
                                                        headers: {
                                                            //"Content-Type": "multipart/form-data"//auto set by browser and indicates properly the boundary parameter like so.
                                                        },
                                                        data: formData,
                                                        callbackData: {},
                                                        forceReload: true,
                                                        onComplete: function (dataResp /*, headerResp, callbackData*/ ) {
                                                            let mediaUploadedInfo = dataResp.result.mediaUploaded;

                                                            cbDone(`File: "${dataObj.displayName}"<br>
                                                                <img 
                                                                    data-source="swym"
                                                                    data-size="small"
                                                                    data-position="center"
                                                                    data-media-type="${mediaUploadedInfo.media_type}"
                                                                    data-media-id="${mediaUploadedInfo.id_media}"
                                                                    data-media-title="${dataResp.result.title}"
                                                                    data-community-id="${mediaUploadedInfo.community_id}"
                                                                    alt="File"
                                                                />`); //Link is automatically added by 3DSwym content display code
                                                        },
                                                        onFailure: function (error) {
                                                            var errorType = "WebService Call Faillure";
                                                            var errorMsg = JSON.stringify(error);
                                                            console.error(errorType + errorMsg);
                                                            cbErr("Missing 3DDrive File - upload media issue");
                                                        }
                                                    });

                                                } else {
                                                    console.error("Error will getting the file from FCS", e);
                                                    cbErr("Missing 3DDrive File - error will getting media from 3DDrive");
                                                }
                                            };

                                            req.onprogress = () => {
                                                //Do nothing for Edge
                                                //console.log("onProgress Download 3DDrive file", arguments);
                                            };
                                            req.onerror = () => {
                                                console.error("Get 3DDrive File error", arguments);
                                                cbErr("Missing 3DDrive File - error will getting media from 3DDrive");
                                            };

                                            req.send(); //Send the XHR
                                        },
                                        onFailure: (errorType, errorMsg) => {
                                            console.error(errorType, errorMsg);
                                            cbErr("Impossible to get 3DDrive file," + errorType);
                                        }
                                    });
                                    return;
                                }
                            } else if (obj.type === "Image") {

                                let fileName = obj.data.name;
                                if (!fileName || fileName === "") {
                                    fileName = obj.fileName;
                                }

                                //Upload the image as a media
                                //Callback to do the next things, before creating the Post
                                let formData = new FormData(); //ref : https://developer.mozilla.org/en-US/docs/Web/API/FormData/Using_FormData_Objects
                                //data.append("myfile", myBlob, "filename.txt"); if File name isn't in the value / blob parameter

                                formData.append("community_id", this.selectedCommunity);
                                formData.append("published", 1);
                                formData.append("is_illustration", 1); //1 = not appearing in the main thread
                                formData.append("download_original_file", 1); //1 = can be downloaded from UI
                                formData.append("title", "Image-" + fileName);
                                //The file :
                                formData.append("userFile", obj.data, fileName);

                                //Example here :http://dsdoc/devdoccaa/3DEXPERIENCER2019x/en/English/CAASwymInfraRESTRef/CAA3DSwymQrAddMediaV2.htm
                                Connector3DExp.call3DSwym({
                                    url: "/api/media/add",
                                    method: "POST",
                                    type: "json",
                                    headers: {
                                        //"Content-Type": "multipart/form-data"//auto set by browser and indicates properly the boundary parameter like so.
                                    },
                                    data: formData,
                                    callbackData: {},
                                    forceReload: true,
                                    onComplete: function (dataResp /*, headerResp, callbackData*/ ) {
                                        let mediaUploadedInfo = dataResp.result.mediaUploaded;

                                        cbDone(`<img 
                                                data-source="swym"
                                                data-size="large"
                                                data-position="center"
                                                data-media-type="${mediaUploadedInfo.media_type}"
                                                data-media-id="${mediaUploadedInfo.id_media}"
                                                data-media-title="${dataResp.result.title}"
                                                data-community-id="${mediaUploadedInfo.community_id}"
                                                alt="Image"
                                                />`);
                                    },
                                    onFailure: function (error) {
                                        var errorType = "WebService Call Faillure";
                                        var errorMsg = JSON.stringify(error);
                                        console.error(errorType + errorMsg);
                                        cbErr("Missing image - upload media issue");
                                    }
                                });
                                return;
                            } else if (obj.type === "File") {

                                let fileName = obj.data.name;
                                if (!fileName || fileName === "") {
                                    fileName = obj.fileName;
                                }

                                //Upload the file as a media
                                //Callback to do the next things, before creating the Post
                                let formData = new FormData(); //ref : https://developer.mozilla.org/en-US/docs/Web/API/FormData/Using_FormData_Objects
                                //data.append("myfile", myBlob, "filename.txt"); if File name isn't in the value / blob parameter

                                formData.append("community_id", this.selectedCommunity);
                                formData.append("published", 1);
                                formData.append("is_illustration", 1); //1 = not appearing in the main thread
                                formData.append("download_original_file", 1); //1 = can be downloaded from UI
                                formData.append("title", "File-" + fileName);
                                //The file :
                                formData.append("userFile", obj.data, fileName);

                                //Example here :http://dsdoc/devdoccaa/3DEXPERIENCER2019x/en/English/CAASwymInfraRESTRef/CAA3DSwymQrAddMediaV2.htm
                                Connector3DExp.call3DSwym({
                                    url: "/api/media/add",
                                    method: "POST",
                                    type: "json",
                                    headers: {
                                        //"Content-Type": "multipart/form-data"//auto set by browser and indicates properly the boundary parameter like so.
                                    },
                                    data: formData,
                                    callbackData: {},
                                    forceReload: true,
                                    onComplete: function (dataResp /*, headerResp, callbackData*/ ) {
                                        let mediaUploadedInfo = dataResp.result.mediaUploaded;

                                        cbDone(`File: "${obj.data.name}"<br>
                                                <img 
                                                    data-source="swym"
                                                    data-size="small"
                                                    data-position="center"
                                                    data-media-type="${mediaUploadedInfo.media_type}"
                                                    data-media-id="${mediaUploadedInfo.id_media}"
                                                    data-media-title="${dataResp.result.title}"
                                                    data-community-id="${mediaUploadedInfo.community_id}"
                                                    alt="File"
                                                />`); //Link is automatically added by 3DSwym content display code
                                    },
                                    onFailure: function (error) {
                                        var errorType = "WebService Call Faillure";
                                        var errorMsg = JSON.stringify(error);
                                        console.error(errorType + errorMsg);
                                        cbErr("Missing image - upload media issue");
                                    }
                                });
                                return;
                            } else if (obj.type === "Person") {
                                let that = this;
                                let dataPerson = obj.data.data;
                                let imgUrlPerson = obj.data.imgUrl;

                                //Get the File of the image behind he Url
                                //Then upload it at 3DSwym Media
                                //Send back the 3DSwym Formatted Result

                                let reqImg = new XMLHttpRequest();
                                reqImg.open("GET", imgUrlPerson + ((/\?/).test(imgUrlPerson) ? "&" : "?") + Date.now(), true); //Adding Date to avoid cache issues
                                reqImg.responseType = "blob";

                                reqImg.onload = function (e) {
                                    if (this.status === 200) {
                                        let fileBlob = new Blob([reqImg.response]);

                                        //Upload the file as 3DSwym media
                                        let formData = new FormData(); //ref : https://developer.mozilla.org/en-US/docs/Web/API/FormData/Using_FormData_Objects
                                        //data.append("myfile", myBlob, "filename.txt"); if File name isn't in the value / blob parameter

                                        formData.append("community_id", that.selectedCommunity);
                                        formData.append("published", 1);
                                        formData.append("is_illustration", 1); //1 = not appearing in the main thread
                                        formData.append("download_original_file", 1); //1 = can be downloaded from UI
                                        formData.append("title", "Photo-" + dataPerson.cn + "-" + Date.now());
                                        //The file :
                                        formData.append("userFile", fileBlob, dataPerson.cn + ".jpg");

                                        //Example here :http://dsdoc/devdoccaa/3DEXPERIENCER2019x/en/English/CAASwymInfraRESTRef/CAA3DSwymQrAddMediaV2.htm
                                        Connector3DExp.call3DSwym({
                                            url: "/api/media/add",
                                            method: "POST",
                                            type: "json",
                                            headers: {
                                                //"Content-Type": "multipart/form-data"//auto set by browser and indicates properly the boundary parameter like so.
                                            },
                                            data: formData,
                                            callbackData: {},
                                            forceReload: true,
                                            onComplete: function (dataResp) {
                                                let mediaUploadedInfo = dataResp.result.mediaUploaded;

                                                cbDone(`<table style="width:100%;border:0;"><tbody><tr>
                                                    <td>
                                                        <img 
                                                            data-content-thumbnail="false"
                                                            data-source="swym"
                                                            data-size="large"
                                                            data-position="center"
                                                            data-media-type="${mediaUploadedInfo.media_type}"
                                                            data-media-id="${mediaUploadedInfo.id_media}"
                                                            data-media-title="${dataResp.result.title}"
                                                            data-community-id="${mediaUploadedInfo.community_id}"
                                                            alt="File"
                                                        />
                                                    </td><td style="vertical-align:bottom;">
                                                        ${dataPerson.givenName} ${dataPerson.sn}<br>
                                                        ${dataPerson.title}<br>
                                                        <a data-type="external" href="mailto:${dataPerson.mail}">✉ ${dataPerson.mail}</a>
                                                    </td>
                                                </tr></tbody></table>`);
                                            },
                                            onFailure: function (error) {
                                                var errorType = "WebService Call Faillure";
                                                var errorMsg = JSON.stringify(error);
                                                console.error(errorType + errorMsg);
                                                cbDone(`<p>
                                                    ${dataPerson.givenName} ${dataPerson.sn}<br>
                                                    ${dataPerson.title}<br>
                                                    <a data-type="external" href="mailto:${dataPerson.mail}">✉ ${dataPerson.mail}</a>
                                                </p>`);
                                            }
                                        });
                                    } else {
                                        console.error("Impossible to get the Person Image as a file.", arguments);
                                        cbDone(`<p>
                                            ${dataPerson.givenName} ${dataPerson.sn}<br>
                                            ${dataPerson.title}<br>
                                            <a data-type="external" href="mailto:${dataPerson.mail}">✉ ${dataPerson.mail}</a>
                                        </p>`);
                                    }
                                };

                                let failFct = function () {
                                    console.error("Impossible to get the Person Image as a file. Call Error:", arguments);
                                    cbDone(`<p>
                                            ${dataPerson.givenName} ${dataPerson.sn}<br>
                                            ${dataPerson.title}<br>
                                            <a data-type="external" href="mailto:${dataPerson.mail}">✉ ${dataPerson.mail}</a>
                                        </p>`);
                                };
                                reqImg.onerror = failFct;
                                reqImg.ontimeout = failFct;

                                reqImg.onprogress = () => {
                                    //Do nothing
                                    //console.log("onProgress get person Image", arguments);
                                };

                                reqImg.send();
                                return;
                            } else if (obj.type === "JSON") {
                                cbDone(obj.html);
                                return;
                            }

                            //Fallback : Text of the object
                            cbDone("<p>" + obj.replace(/\n/g, "<br>") + "</p>");
                            return;
                        },
                        onBroadCastMessage: function (ev) {
                            let message = ev.data;
                            console.log(widget.id + "-" + Date.now() + " - onBroadCastMessage syncLock", this.syncLockUpdate, "message", message);

                            try {
                                if (message && message.widgetId !== widget.id) {
                                    let fctUpdate = () => {
                                        console.log(widget.id + "-" + Date.now() + " - fctUpdate executed");
                                        let copyOfListOfObjects = myWidget.deepCopy(top.um5MeetingClipboard.listOfObjects);
                                        this.$set(this, "listOfObjects", copyOfListOfObjects); //Save a copy
                                        this.$forceUpdate();
                                    };
                                    if (this.syncLockUpdate) {
                                        clearTimeout(this.syncLockTimeout);
                                        this.syncLockTimeout = setTimeout(fctUpdate, 200);
                                    } else {
                                        this.syncLockUpdate = true;
                                        this.syncLockTimeout = setTimeout(fctUpdate, 200);
                                    }
                                }
                            } catch (err) {
                                //Ignore, fail silently
                                console.error(err);
                            }
                        }
                    }
                });

                vueApp.loadListOfCommunities();
                if (broadCastChannel) {
                    broadCastChannel.onmessage = vueApp.onBroadCastMessage;
                    //TODO fallback when no broadcastChannel (IE or Edge)
                }

                //Listen for PlatformAPI.publish("NewTrackedItem", {...});
                //Don't do the same subscribe twice
                if (!myWidget.pAPISubs["NewTrackedItem"]) {
                    myWidget.pAPISubs["NewTrackedItem"] = PlatformAPI.subscribe("NewTrackedItem",
                        (dataIn) => {
                            if (typeof dataIn === "string") {
                                try {
                                    let dataJson = JSON.parse(dataIn);
                                    if (dataJson.protocol === "3DXContent") {
                                        //It's a Platform Object !
                                        vueApp.addPlatformObject(dataJson);
                                    } else if (dataJson && dataJson.type && dataJson.type === "peopleCard") {
                                        vueApp.addPersonFromDirectory(dataJson);
                                    } else if (dataJson && dataJson.type && dataJson.type === "PhotoOnMap" || dataJson.type === "ImageBase64") {
                                        let srcImgDataURI = dataIn.src;
                                        let fileInfos = myWidget.dataURIToBlob(srcImgDataURI);
                                        vueApp.addFile(fileInfos.blob, fileInfos.fileName);
                                        /*vueApp.addJSONObject({
                                            gps: dataJson.gps
                                        });Don't add GPS Coord*/
                                    } else {
                                        vueApp.addJSONObject(dataJson);
                                    }
                                } catch (err) {
                                    vueApp.addTextObject(dataIn);
                                }
                            } else {
                                if (dataIn.protocol === "3DXContent") {
                                    //It's a Platform Object !
                                    vueApp.addPlatformObject(dataIn);
                                } else if (dataIn && dataIn.type && dataIn.type === "peopleCard") {
                                    vueApp.addPersonFromDirectory(dataIn);
                                } else if (dataIn && dataIn.type && dataIn.type === "PhotoOnMap" || dataIn.type === "ImageBase64") {
                                    let srcImgDataURI = dataIn.src;
                                    let fileInfos = myWidget.dataURIToBlob(srcImgDataURI);
                                    vueApp.addFile(fileInfos.blob, fileInfos.fileName);
                                    /*vueApp.addJSONObject({
                                        gps: dataIn.gps
                                    });Don't add GPS Coord*/
                                } else {
                                    vueApp.addJSONObject(dataIn);
                                }
                            }
                        }
                    );
                }
            },
            deepCopy: function (obj) {
                let copy = null;
                let stringType = Object.prototype.toString.call(obj);
                if (stringType === "[object Array]") {
                    copy = [];
                    for (let i = 0; i < obj.length; i++) {
                        const element = obj[i];
                        copy.push(myWidget.deepCopy(element));
                    }
                } else if (typeof obj === "object" && !(obj instanceof File) && !(obj instanceof Blob) && stringType != "[object Blob]" && stringType != "[object File]") {
                    //Use StringType [object Blob] and [object File] check for MS Edge Bug... once again...
                    copy = {};
                    for (const key in obj) {
                        if (obj.hasOwnProperty(key)) {
                            const element = obj[key];
                            copy[key] = myWidget.deepCopy(element);
                        }
                    }
                } else {
                    copy = obj;
                }
                return copy;
            },
            dataURIToBlob: function (dataURI) {
                //Shamelessly copied from : https://stackoverflow.com/questions/4998908/convert-data-uri-to-file-then-append-to-formdata

                // convert base64/URLEncoded data component to raw binary data held in a string
                var byteString;
                if (dataURI.split(',')[0].indexOf('base64') >= 0)
                    byteString = atob(dataURI.split(',')[1]);
                else
                    byteString = unescape(dataURI.split(',')[1]);

                // separate out the mime component
                var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

                // write the bytes of the string to a typed array
                var ia = new Uint8Array(byteString.length);
                for (var i = 0; i < byteString.length; i++) {
                    ia[i] = byteString.charCodeAt(i);
                }

                let arrMime = mimeString.split("/");

                return {
                    blob: new Blob([ia], {
                        type: mimeString
                    }),
                    fileName: arrMime[0] + "-" + Date.now() + "." + arrMime[1]
                };
                /*
                 * Edge doesn't support File Constructor ... ... ...
                 * return new File([ia], arrMime[0] + "-" + Date.now() + "." + arrMime[1], {
                 *   type: mimeString
                 * });
                 */
            },
            onRefreshWidget: function () {
                var wdgTitlePref = widget.getValue("wdgTitle");
                if (wdgTitlePref) {
                    widget.setTitle(wdgTitlePref);
                }

                vueApp.listOfCommunities = []; //Clear the list
                vueApp.loadListOfCommunities();
                vueApp.listOfObjects = top.um5MeetingClipboard.listOfObjects.slice(); //Save a copy
            }
        };

        widget.addEvent("onLoad", myWidget.onLoadWidget);
        widget.addEvent("onRefresh", myWidget.onRefreshWidget);
    });
}