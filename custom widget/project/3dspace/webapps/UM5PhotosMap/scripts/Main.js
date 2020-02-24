/*
 * BT WW Competencies Center - Fast Prototypes Team
 * @author UM5
 */
/* global EXIF */
function executeWidgetCode() {

    require.config({
        paths: {
            vue: "./BTWWLibrairies/vue/vue", //Need this with "vue" all lower case, else Vuetify can't load correctly
            Vuetify: "./BTWWLibrairies/vuetify/vuetify",
            CSSRoboto: "./BTWWLibrairies/fonts/Roboto", //"https://fonts.googleapis.com/css?family=Roboto:300,400,500,700",
            CSSMaterial: "./BTWWLibrairies/MaterialDesign/material-icons",
            vueloader: "./BTWWLibrairies/requirejs-vue", //"https://unpkg.com/requirejs-vue@1.1.5/requirejs-vue",
            current: "./UM5PhotosMap"
        }
    });

    //let vueApp; //Declare it here so it can be used in some modules defined here

    require(["vue",
        "Vuetify",
        "UM5Modules/Connector3DExp",
        "DS/PlatformAPI/PlatformAPI",
        "BTWWLibrairies/html2canvas/html2canvas",
        "BTWWLibrairies/exifJS/exif",
        "css!BTWWLibrairies/vuetify/vuetify.min.css",
        "css!CSSRoboto",
        "css!CSSMaterial",
        "vueloader!current/vue/drop-zone"
    ], function (Vue, Vuetify, Connector3DExp, PlatformAPI, html2canvas) {

        Vue.use(Vuetify); //To plug vuetify components

        let vueApp;

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
                            <drop-zone style='height:100%;overflow:auto;' @drop-on="manageDrop">
                                <div id="screenshotTool" style="position:absolute;right:0em;top:0em;z-index:10;">
                                    <v-btn @click="screenshot" icon small dark style="background-color:white;"><v-icon style="color:lightgrey;">camera_alt</v-icon></v-btn>
                                </div>
                                <div id="mainMap" style="position:absolute;">
                                    <img id='backImg' :src='backgroundImage.src' style='max-height:100%;max-width:100%'/>
                                    <div v-for="(img, i) in images" :key="'img'+i" :class="['imgBlockPosition', img.show ? 'showImage' : '', i === (images.length - 1)? 'last': '']" :style="getPointCSSStyle(img.gpsPoint)" @click.stop="showImage(i)">
                                        <div class="imgBullet"></div>
                                        <img class="imgDisplay" :src="img.src"/>
                                    </div>
                                </div>
                            </drop-zone>
                        </v-app>
                    </div>`
                );

                let mapName = widget.getValue("map");

                require([`text!current/assets/${mapName}.json`], function (txtMap) {

                    let mapInfos = JSON.parse(txtMap);

                    let backImgSrc = mapInfos.img;
                    let backImgPositions = mapInfos.gps;

                    let defaultImages = mapInfos.defaultImages;

                    //Adjust the back image url
                    if (backImgSrc.indexOf("http://") === -1 && backImgSrc.indexOf("https://") === -1 && backImgSrc.indexOf("data:") !== 0) {
                        backImgSrc = wdgUrl + "/" + backImgSrc;

                        //Now get the image directly as a blob and convert it to Base64 so we don't have any CORS issue with MS Edge mainly...
                        //Aaaaaahhh... MS Edge... ... ...
                        let req = new XMLHttpRequest();
                        req.open("GET", backImgSrc + ((/\?/).test(backImgSrc) ? "&" : "?") + Date.now(), true);
                        req.responseType = "blob";

                        req.onload = function (e) {

                            if (this.status === 200) {

                                //We have the file in the response
                                let fileBlob = new Blob([req.response], {
                                    type: req.getResponseHeader("Content-Type")
                                });

                                //Read the Image for display
                                let fileReader = new FileReader();
                                fileReader.onload = (ev) => {
                                    vueApp.backgroundImage.src = ev.target.result;
                                };
                                fileReader.readAsDataURL(fileBlob);

                            } else {
                                console.error("Error will getting the file from 3DDrive", e);
                            }
                        };

                        req.send(); //Send the XHR
                    }

                    //Adjust the default images urls
                    for (let i = 0; i < defaultImages.length; i++) {
                        let img = defaultImages[i];
                        let originalSrc = img.src;
                        if (originalSrc.indexOf("http://") === -1 && originalSrc.indexOf("https://") === -1 && originalSrc.indexOf("data:") !== 0) {
                            img.src = wdgUrl + "/" + originalSrc;
                        }
                    }


                    //Init vue App
                    vueApp = new Vue({
                        el: "#appVue",
                        data: {
                            backgroundImage: {
                                src: backImgSrc,
                                positions: {
                                    top: backImgPositions.top,
                                    bottom: backImgPositions.bottom,
                                    left: backImgPositions.left,
                                    right: backImgPositions.right
                                }
                            },
                            images: defaultImages
                        },
                        methods: {
                            showImage: function (index) {
                                let newVal = !this.images[index].show;
                                this.$set(this.images[index], "show", newVal);
                            },
                            getPointCSSStyle: function (gpsPoint) {
                                let strCss = "";

                                let imgGPSTop = this.backgroundImage.positions.top;
                                let imgGPSBottom = this.backgroundImage.positions.bottom;

                                let ptTop = (gpsPoint.latitude - imgGPSBottom) / (imgGPSTop - imgGPSBottom) * 100;
                                if (ptTop < 0) {
                                    ptTop = 0;
                                } else if (ptTop > 100) {
                                    ptTop = 100;
                                }


                                let imgGPSLeft = this.backgroundImage.positions.left;
                                let imgGPSRight = this.backgroundImage.positions.right;

                                let ptLeft = (gpsPoint.longitude - imgGPSLeft) / (imgGPSRight - imgGPSLeft) * 100;
                                if (ptLeft < 0) {
                                    ptLeft = 0;
                                } else if (ptLeft > 100) {
                                    ptLeft = 100;
                                }

                                strCss += `top:calc(100% - ${ptTop}% - 5px);left:calc(${ptLeft}% - 5px);`;

                                return strCss;
                            },
                            manageDrop: function (ev) {
                                console.log("manageDrop here !");
                                let preTypesOfInfos = ev.dataTransfer.types;
                                //MS Edge bug with DOMStringList instead of Array, so quick cast here
                                let typesOfInfos = [];
                                for (let i = 0; i < preTypesOfInfos.length; i++) {
                                    const element = preTypesOfInfos[i];
                                    typesOfInfos.push(element);
                                }

                                console.log("manageDrop typesOfInfos = ", typesOfInfos);

                                if (typesOfInfos.indexOf("Files") !== -1) {
                                    //Check if there is some images
                                    let fileList = ev.dataTransfer.files;
                                    for (let i = 0; i < fileList.length; i++) {
                                        const file = fileList[i];
                                        const fType = file.type;

                                        console.debug("mime type :", fType);

                                        if (fType.indexOf("image/") === 0) {

                                            this.readImageFile(file);

                                        } //Else for the files, ignore them, only manage images

                                    }
                                } else if (typesOfInfos.indexOf("text/plain") !== -1) {
                                    let dataTxt = ev.dataTransfer.getData("text/plain");
                                    console.log("manageDrop dataTxt = ", dataTxt);
                                    //Try to see if it's a Platform object:
                                    try {
                                        let dataJson = JSON.parse(dataTxt);
                                        if (dataJson.protocol === "3DXContent") {
                                            //It's a Platform Object !
                                            this.get3DXContent(dataJson);
                                        }
                                    } catch (err) {
                                        //Do nothing try the other drop types
                                    }
                                }
                                console.log("manageDrop done !");
                            },

                            readImageFile: function (fileImg) {
                                let objImg = {
                                    gpsPoint: {
                                        latitude: 0,
                                        longitude: 0
                                    },
                                    src: "./notLoaded.png",
                                    show: false
                                };
                                //Read the Image for display
                                let fileReader = new FileReader();
                                fileReader.onload = (ev) => {
                                    objImg.src = ev.target.result;

                                    EXIF.getData(fileImg, () => {
                                        //console.log("file", fileImg);
                                        let allMetaData = EXIF.getAllTags(fileImg);
                                        //console.log("allMetaData", allMetaData);
                                        let gpsLatArr = allMetaData["GPSLatitude"] || [0, 0, 0];
                                        let gpsLat = gpsLatArr[0] + (gpsLatArr[1] || 0) / 60 + (gpsLatArr[2] || 0) / 3600;
                                        let gpsLatRef = allMetaData["GPSLatitudeRef"] || "N";
                                        if (gpsLatRef === "S") {
                                            gpsLat *= -1;
                                        }
                                        let gpsLongArr = allMetaData["GPSLongitude"] || [0, 0, 0];
                                        let gpsLong = gpsLongArr[0] + (gpsLongArr[1] || 0) / 60 + (gpsLongArr[2] || 0) / 3600;
                                        let gpsLongRef = allMetaData["GPSLongitudeRef"] || "E";
                                        if (gpsLongRef === "W") {
                                            gpsLong *= -1;
                                        }
                                        objImg.gpsPoint = {
                                            latitude: gpsLat,
                                            longitude: gpsLong
                                        };
                                        this.images.push(objImg);
                                        /*PlatformAPI.publish("NewTrackedItem", {
                                            type: "PhotoOnMap",
                                            gps: objImg.gpsPoint,
                                            src: objImg.src
                                        });*/
                                    });
                                };
                                fileReader.readAsDataURL(fileImg);
                            },

                            get3DXContent: function (dataJson) {
                                console.log("get3DXContent start");
                                let itemsList = dataJson.data.items;
                                for (let i = 0; i < itemsList.length; i++) {
                                    const item = itemsList[i];
                                    let serviceId = item.serviceId;
                                    let envId = item.envId;

                                    if (serviceId === "3DDrive") {
                                        //Download the file image
                                        //content.data.displayPreview
                                        this.load3DDriveFile(envId, item);

                                    } //Else ignore other types of 3DXContent for the moment (focus on 3DDrive files for the scenario), add them later on...
                                }
                                console.log("get3DXContent Done");
                            },

                            load3DDriveFile: function (envId, dataObj) {
                                console.log("load3DDriveFile start");
                                let that = this;
                                Connector3DExp.get3DDriveFileUrl({
                                    envId: envId,
                                    fileId: dataObj.objectId,
                                    onComplete: (fileURL) => {
                                        //Download the file now and save it in memory for upload to 3DSwym

                                        console.log("load3DDriveFile fileURL : ", fileURL);

                                        let req = new XMLHttpRequest();
                                        req.open("GET", fileURL, true);
                                        req.responseType = "blob";

                                        req.onload = function (e) {

                                            if (this.status === 200) {

                                                //We have the file in the response
                                                let fileBlob = new Blob([req.response], {
                                                    type: req.getResponseHeader("Content-Type")
                                                });

                                                that.readImageFile(fileBlob);

                                            } else {
                                                console.error("Error will getting the file from 3DDrive", e);
                                            }
                                        };

                                        req.send(); //Send the XHR
                                    },
                                    onFailure: (errorType, errorMsg) => {
                                        console.error(errorType, errorMsg);
                                    }
                                });
                                console.log("load3DDriveFile End");
                            },

                            screenshot() {
                                html2canvas(document.getElementById("mainMap"), {
                                    backgroundColor: "#f9f9f9",
                                    scale: 1,
                                    logging: false,
                                    useCORS: true,
                                }).then(canvas => {
                                    var imgData = canvas.toDataURL();
                                    PlatformAPI.publish("NewTrackedItem", {
                                        type: "PhotoOnMap",
                                        src: imgData
                                    });
                                });
                            }
                        }
                    });

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