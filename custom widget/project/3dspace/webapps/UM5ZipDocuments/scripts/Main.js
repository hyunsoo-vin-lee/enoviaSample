/*
 * BT WW Competencies Center - Fast Prototypes Team
 * @author UM5
 */

//ZipJS will add the global variable "zip", line bellow for eslint
/* global zip, saveAs */

function executeWidgetCode() {

    require.config({
        paths: {
            vue: "./BTWWLibrairies/vue/vue", //Need this with "vue" all lower case, else Vuetify can't load correctly
            Vuetify: "./BTWWLibrairies/vuetify/vuetify",
            CSSRoboto: "./BTWWLibrairies/fonts/Roboto", //"https://fonts.googleapis.com/css?family=Roboto:300,400,500,700",
            CSSMaterial: "./BTWWLibrairies/MaterialDesign/material-icons",
            vueloader: "./BTWWLibrairies/requirejs-vue", //"https://unpkg.com/requirejs-vue@1.1.5/requirejs-vue",
            current: "./UM5ZipDocuments"
        }
    });

    require(["vue",
        "Vuetify",
        "UM5Modules/DocumentsWS",
        "css!BTWWLibrairies/vuetify/vuetify.min.css",
        "css!CSSRoboto",
        "css!CSSMaterial",
        "vueloader!current/vue/drop-zone",
        "vueloader!current/vue/list-eno-objects",
        "BTWWLibrairies/zipJS/zip", //Will create a global object "zip"
        "BTWWLibrairies/FileSaver/FileSaver" //Will create a global object "saveAs"
    ], function (Vue, Vuetify, DocumentsWS) {

        Vue.use(Vuetify); //To plug vuetify components

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

                widget.setBody(
                    `<div id='appVue'>
                        <v-app style='height:100%;'>
                            <v-progress-linear v-show='actionProgress>=0' height='4' style='margin:0em;position:absolute;' :indeterminate='actionProgress===0' v-model='actionProgress'></v-progress-linear>
                            <drop-zone @drop-on='dropOnWidget' style='height:100%;overflow:auto;width:calc(100% - 2em);'>
                                <div v-if='listOfDocuments.length===0'>Drop some objects here</div>
                                <list-eno-objects v-else :items='listOfDocuments' @remove-item='removeDoc'></list-eno-objects>
                            </drop-zone>
                            <div id="toolbarRight">
                                <v-icon @click='clearList' title='Clear list'>delete</v-icon>
                                <v-icon @click.prevent='downloadAll' title='Download all the documents in a zip'>archive</v-icon>
                            </div>
                        </v-app>
                    </div>`
                );

                //Init vue App
                new Vue({
                    el: "#appVue",
                    data: {
                        listOfDocuments: [],
                        actionProgress: -1
                    },
                    computed: {

                    },
                    methods: {
                        clearList: function () {
                            this.listOfDocuments = [];
                        },
                        removeDoc: function (index) {
                            this.listOfDocuments.splice(index, 1);
                        },
                        dropOnWidget: function (dataTxt) {
                            let listOfPIDs = [];
                            try {
                                //Get the list of documents' physicalid in the dropped data
                                let dataJson = JSON.parse(dataTxt);
                                if (dataJson.protocol === "3DXContent") {
                                    let arrItems = dataJson.data.items;
                                    for (let i = 0; i < arrItems.length; i++) {
                                        const item = arrItems[i];
                                        if (item.objectType === "Document") {
                                            const pid = item.objectId;
                                            listOfPIDs.push(pid);
                                        }
                                    }
                                }
                            } catch (err) {
                                console.trace(err);

                            }

                            let that = this;
                            //Load the Object infos based on there physicalid to find the attached files
                            //Leverage the OOTB Documents Web Services to find the Documents files infos
                            for (let i = 0; i < listOfPIDs.length; i++) {
                                const pidDoc = listOfPIDs[i];
                                DocumentsWS.getDocInfos(pidDoc, {
                                    onOk: (data) => {
                                        for (let j = 0; j < data.length; j++) {
                                            const dataItem = data[j];
                                            let objDoc = {
                                                id: dataItem.id,
                                                type: dataItem.type
                                            };
                                            for (const key in dataItem.dataelements) {
                                                if (dataItem.dataelements.hasOwnProperty(key)) {
                                                    const value = dataItem.dataelements[key];
                                                    objDoc[key] = value;
                                                }
                                            }
                                            objDoc.files = dataItem.relateddata.files;

                                            //Check if not already there in the list, if there remove the old info so we have the updated one
                                            for (let k = 0; k < that.listOfDocuments.length; k++) {
                                                const loadedDoc = that.listOfDocuments[k];
                                                if (loadedDoc.id === objDoc.id) {
                                                    that.listOfDocuments.splice(k, 1);
                                                    k--;
                                                }
                                            }
                                            //Put the documents infos in the list used for the display
                                            that.listOfDocuments.push(objDoc);
                                        }
                                    },
                                    onError: (errType, errMsg) => {
                                        console.error("getDocInfosErr", errType, errMsg);
                                    }
                                });
                            }
                        },
                        downloadAll: function () {
                            let that = this;
                            that.actionProgress = 0; //Display the progress bar to show to the user that something is running

                            //Download all the files, zip them and propose it as download for the user
                            let zipFileName = widget.getValue("zipName") + ".zip";

                            let wdgUrl = widget.getUrl();
                            wdgUrl = wdgUrl.substring(0, wdgUrl.lastIndexOf("/"));
                            zip.workerScriptsPath = wdgUrl + "/../BTWWLibrairies/zipJS/"; //Configure zipJS to point to the right folder with z-worker.js, deflate.js and inflate.js

                            let writer = new zip.BlobWriter();
                            let zipWriter;

                            //https://gildas-lormeau.github.io/zip.js/core-api.html#zip-writing

                            zip.createWriter(writer, (writerZip) => {
                                zipWriter = writerZip;
                                processFiles();
                            }, (err) => {
                                //Error
                                console.error("Impossible to create the zip Writter", err);
                            });

                            //Called when the zipWritter in ok
                            let processFiles = () => {

                                let currentDocIndex = 0;
                                let filesInfosPreDownload = [];

                                //For each Documents get the list of files to download and add in the zip
                                for (let i = 0; i < this.listOfDocuments.length; i++) {
                                    const docItem = this.listOfDocuments[i];
                                    if (docItem.files && docItem.files.length > 0) {
                                        for (let f = 0; f < docItem.files.length; f++) {
                                            const fileItem = docItem.files[f];
                                            let fName = fileItem.dataelements.title;
                                            let docId = docItem.id;
                                            let fileId = fileItem.id;
                                            filesInfosPreDownload.push({
                                                docId: docId,
                                                fileId: fileId,
                                                fileName: fName
                                            });
                                        }
                                    }
                                }

                                let nextFile = () => {
                                    if (currentDocIndex < filesInfosPreDownload.length) {

                                        that.actionProgress = 100 * (currentDocIndex + 1) / filesInfosPreDownload.length;


                                        //Get next file infos for the download
                                        let docObj4Download = filesInfosPreDownload[currentDocIndex];

                                        //Get the FCS Download ticket
                                        DocumentsWS.getDocFileDownloadTicket(docObj4Download.docId, docObj4Download.fileId, {
                                            onOk: (dataFile) => {
                                                let fileURL = dataFile[0].dataelements.ticketURL;

                                                //Download the file as a blob (application-octet/stream) by doing a direct call to the given url that is valid only once
                                                var req = new XMLHttpRequest();
                                                req.open("GET", fileURL, true);
                                                req.responseType = "blob";

                                                req.onload = function (e) {
                                                    if (this.status === 200) {

                                                        //We have the file in the response
                                                        let fileBlob = new Blob([req.response], {
                                                            type: 'octet/stream'
                                                        });

                                                        //Add the file in the zip
                                                        zipWriter.add(docObj4Download.fileName, new zip.BlobReader(fileBlob), () => {
                                                            //When done process the next file
                                                            currentDocIndex++;
                                                            nextFile();
                                                        }, (current, total) => {
                                                            //On Progress
                                                            console.debug("Zip Write progress : ", current, "/", total);
                                                        });

                                                    } else {
                                                        console.error("Error will getting the file from FCS", e);
                                                    }
                                                };

                                                req.send(); //Send the XHR

                                            },
                                            onError: (errType, errMsg) => {
                                                console.error("getDocFileDownloadTicket", errType, errMsg);
                                            }
                                        });
                                    } else {
                                        //All done, download the zip file
                                        zipWriter.close(function (blob) {
                                            //Use FileSaver.js to manage all lot of fallbacks possibilities
                                            saveAs(blob, zipFileName);

                                            setTimeout(() => {
                                                that.actionProgress = -1; //Remove the progress bar
                                            }, 100);

                                            //Clean the reference to zipWriter
                                            zipWriter = null;
                                        });
                                    }
                                };

                                nextFile(); //Process the 1st file

                            };

                        }
                    }
                });
            },
            onRefreshWidget: function () {
                //Do Nothing here
            }
        };

        widget.addEvent("onLoad", myWidget.onLoadWidget);
        widget.addEvent("onRefresh", myWidget.onRefreshWidget);
    });
}