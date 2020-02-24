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
            current: "./UM5DrawIdea"
        }
    });

    define("DrawIdea/Utils", ["UM5Modules/Connector3DExp"], function (Connector3DExp) {
        return {
            get3DDriveFile(obj, cbDone, cbErr) {
                let dataObj = obj.data;
                let envId = dataObj.envId;
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

                                cbDone(fileBlob);
                            } else {
                                console.error("Error will getting the file from FCS", e);
                                cbErr("Missing 3DDrive File - error will getting media from 3DDrive");
                            }
                        };

                        req.send(); //Send the XHR
                    },
                    onFailure: (errorType, errorMsg) => {
                        console.error(errorType, errorMsg);
                        cbErr("Impossible to get 3DDrive file," + errorType);
                    }
                });
            }
        };
    });

    require([
        "vue",
        "Vuetify",
        "UM5Modules/Connector3DExp",
        "DS/PlatformAPI/PlatformAPI",
        "css!BTWWLibrairies/vuetify/vuetify.min.css",
        "css!CSSRoboto",
        "css!CSSMaterial",
        "vueloader!current/vue/drawing-canvas"
    ], function (Vue, Vuetify, Connector3DExp, PlatformAPI) {

        Vue.use(Vuetify); //To plug vuetify components

        let myWidget = {

            // Widget Events
            onLoadWidget() {

                //Disable iframe.css so we don't have the default widget css stuff that is broken some times
                let styleSheets = document.styleSheets;
                for (let i = 0; i < styleSheets.length; i++) {
                    const sheet = styleSheets.item(i);
                    if (sheet.href && sheet.href.indexOf("UWA/assets/css/iframe.css") !== -1) {
                        sheet.disabled = true;
                    }
                }

                let wdgUrl = widget.getUrl();
                wdgUrl = wdgUrl.substring(0, wdgUrl.lastIndexOf("/"));

                widget.setIcon(wdgUrl + "/../UM5Modules/assets/icons/custom-widget-icon.png");

                let wdgTitlePref = widget.getValue("wdgTitle");
                if (wdgTitlePref) {
                    widget.setTitle(wdgTitlePref);
                }

                widget.setBody(
                    `<div id='appVue'>
                        <v-app style='height:100%;'>
                            <v-progress-linear v-show='progress>=0' height='4' style='margin:0em;position:absolute;' :indeterminate='progress===0' v-model='progress'></v-progress-linear>
                            <div v-if="currentState==='idea'" class="ideaPreview">
                                <div class="ideaToolbar">
                                    <div>
                                        <v-icon
                                            title='Clear Drawings'
                                            @click='clearList'
                                            style='color:#b4b6ba;vertical-align: middle;margin-right:0.25em;'
                                            >delete_sweep</v-icon>
                                        <img v-if="drawings.length>0" title='Save as swym idea' @click='showSwymAdd=true' style='height:1.8em;vertical-align: middle;float:right; margin-top:0.75em;' src="${wdgUrl}/assets/SwymAdd.png" />
                                    </div>
                                </div>
                                <div>
                                    <div class="drawingPreview" v-for="(draw,i) in drawings" :key="'draw-'+i" @click='loadDrawing(i);'>
                                        <img :src="draw.preview"/>
                                        <div class="drawingName">{{draw.name}}</div>
                                    </div>
                                    <div class="drawingPreview" @click="addDrawing" style="text-align:center;line-height:8em;"><v-icon>add</v-icon></div>
                                </div>
                            </div>
                            <div v-if="currentState==='drawing'" style="height:100%;position:relative;">
                                <drawing-canvas
                                    :content="drawings[currentDrawingIndex].content"
                                    :preview="drawings[currentDrawingIndex].preview"
                                    :board-name="drawings[currentDrawingIndex].name"
                                    @add-drawing="addDrawing()"
                                    @back="backWithImg"
                                    @name-changed="updateName"
                                    @screenshot="screenshot">
                                </drawing-canvas>
                            </div>

                            <div v-if="showSwymAdd" style="position:absolute;top:0em;left:0em;bottom:0em;right:0em;background-color:rgba(192,192,192,0.5);">
                                <div style="position:absolute;top:1em;left:1em;right:1em;background-color:white;box-shadow: 0.25em 0.25em 0.5em grey;text-align: right;">
                                    <v-select 
                                        :items='listOfCommunities'
                                        item-text='title'
                                        item-value='id'
                                        v-model='selectedCommunity'
                                        label='Select a Community'
                                        dense single-line hide-details
                                    ></v-select>
                                    <v-btn :disabled="selectedCommunity===''" @click='createIdea' color="primary" title='Save as swym idea' ><v-icon>add</v-icon>Add</v-btn>
                                    <v-btn @click='showSwymAdd=false;' title='Cancel Save as swym idea' ><v-icon>close</v-icon>Cancel</v-btn>
                                </div>
                            </div>
                        </v-app>
                    </div>`
                );

                //Init vue App
                let vueApp = new Vue({
                    el: "#appVue",
                    data: {
                        currentState: "idea", //posible : "idea", "drawing"
                        currentDrawingIndex: -1,
                        drawings: [],

                        selectedCommunity: "",
                        listOfCommunities: [],

                        progress: -1,
                        messages: [],

                        showSwymAdd: false
                    },
                    methods: {
                        addDrawing() {
                            this.drawings.push({
                                name: "Drawing " + (this.drawings.length + 1),
                                content: [],
                                preview: ""
                            });
                            this.currentDrawingIndex = this.drawings.length - 1;
                            this.currentState = "drawing";
                        },
                        loadDrawing(index) {
                            this.currentDrawingIndex = index;
                            this.currentState = "drawing";
                        },
                        backWithImg(imgB64) {
                            this.drawings[this.currentDrawingIndex].preview = imgB64;
                            this.currentState = "idea";
                        },
                        updateName(newName) {
                            this.drawings[this.currentDrawingIndex].name = newName;
                        },

                        clearList: function () {
                            this.$set(this, "drawings", []);
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

                        createIdea() {
                            this.showSwymAdd = false;
                            let that = this;

                            let currentDate = new Date();
                            let offsetUTCHour = -1 * currentDate.getTimezoneOffset() / 60;

                            vueApp.progress = 0;

                            //myWidget.dataURIToBlob(srcImgDataURI)
                            this.getListFormattedFor3DSwym(this.drawings, (htmlResults) => {

                                let swymPostContent = `<h1>Idea from Drawings</h1>
                                    <h2>Drawings Date</h2>
                                    <p>${currentDate.toLocaleDateString()} ${currentDate.toLocaleTimeString()} UTC:${offsetUTCHour>=0?"+":""}${offsetUTCHour}</p>
                                    ${htmlResults}`;

                                Connector3DExp.call3DSwym({
                                    url: "/api/idea/add",
                                    method: "POST",
                                    type: "json",
                                    headers: {
                                        "Content-Type": "application/json"
                                    },
                                    data: JSON.stringify({
                                        params: {
                                            title: "Idea from Drawings - " + currentDate.toLocaleDateString() + " " + currentDate.toLocaleTimeString(),
                                            community_id: this.selectedCommunity,
                                            published: 1,
                                            message: swymPostContent
                                        }
                                    }),
                                    callbackData: {},
                                    forceReload: true,
                                    onComplete: function (dataResp /*, headerResp, callbackData*/ ) {
                                        //console.log("Done !!");
                                        that.selectedCommunity = "";

                                        vueApp.progress = 100;
                                        setTimeout(() => {
                                            vueApp.progress = -1;
                                        }, 100);

                                        let ideaCreated = dataResp.result;

                                        let current3DSwym = Connector3DExp.getCurrentTenantInfo()["3DSwym"];

                                        PlatformAPI.publish("NewTrackedItem", {
                                            "protocol": "3DXContent",
                                            "version": "1.0",
                                            "source": "UM5DrawIdea",
                                            "widgetId": widget.id,
                                            "data": {
                                                "items": [{
                                                    "envId": Connector3DExp._tenant,
                                                    "serviceId": "3DSwym",
                                                    "contextId": "",
                                                    "objectId": ideaCreated.id,
                                                    "objectType": "idea",
                                                    "displayName": ideaCreated.title,
                                                    "displayType": "idea",
                                                    "displayIcon": current3DSwym + "/webapps/SwymUIComponents/assets/content-icon/idea.png",
                                                    "defaultApp": "X3DMCTY_AP",
                                                    "urlContent": {
                                                        "3DSwym": current3DSwym + `/#community:${ideaCreated.community_id}/idea:${ideaCreated.id}`
                                                    }
                                                }]
                                            }
                                        });

                                        //Message feedback to the user
                                        vueApp.messages.push({
                                            level: "success",
                                            title: "Idea Created ",
                                            message: "Idea Created Successfully in the selected community",
                                            sticky: false
                                        });
                                    },
                                    onFailure: function (error) {
                                        var errorType = "WebService Call Faillure";
                                        var errorMsg = JSON.stringify(error);
                                        console.error(errorType + errorMsg);
                                        vueApp.messages.push({
                                            level: "error",
                                            title: "Idea Not Created ",
                                            message: "An error happened will creating the Idea in the selected community",
                                            sticky: false
                                        });
                                    }
                                });
                            });
                        },

                        getListFormattedFor3DSwym(listObjs, cbAllDone) {
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
                                            title: "Idea Created with missing content",
                                            message: "The Idea is created but some content might be missing in it, consider reviewing the Idea in 3DSwym.",
                                            sticky: false
                                        });
                                    }
                                }
                            };
                            doNext(); //Launch the first one
                        },

                        formatObjectFor3DSwym(obj, cbDone, cbErr) {
                            //Convert img as Base64 to Blob File
                            let srcImgDataURI = obj.preview;
                            let fileBlob = myWidget.dataURIToBlob(srcImgDataURI);

                            //Upload the file as 3DSwym media
                            let formData = new FormData(); //ref : https://developer.mozilla.org/en-US/docs/Web/API/FormData/Using_FormData_Objects
                            //data.append("myfile", myBlob, "filename.txt"); if File name isn't in the value / blob parameter

                            formData.append("community_id", this.selectedCommunity);
                            formData.append("published", 1);
                            formData.append("is_illustration", 1); //1 = not appearing in the main thread
                            formData.append("download_original_file", 1); //1 = can be downloaded from UI
                            formData.append("title", "Image-" + obj.name);
                            //The file :
                            formData.append("userFile", fileBlob, obj.name + ".png");

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

                                    cbDone(`Drawing : "${obj.name}"<br>
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
                                    cbErr("Missing Image - upload media issue");
                                }
                            });
                        },

                        screenshot(imgB64) {
                            PlatformAPI.publish("NewTrackedItem", {
                                type: "ImageBase64",
                                src: imgB64
                            });
                        }
                    }
                });

                vueApp.loadListOfCommunities();
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

                return new Blob([ia], {
                    type: mimeString
                });
            }

        };

        widget.addEvent("onLoad", myWidget.onLoadWidget, myWidget);
        //widget.addEvent("onRefresh", myWidget.refreshDisplay, myWidget);
        //widget.addEvent("onSearch", myWidget.onSearchWidget);
        //widget.addEvent("onResetSearch", myWidget.onResetSearchWidget);

        //widget.addEvent("onConfigChange", myWidget.onConfigChange); //For change of Table Config in list
    });
}