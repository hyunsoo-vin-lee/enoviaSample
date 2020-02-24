/*
 * BT WW Competencies Center - Fast Prototypes Team
 * @author UM5
 */

function executeWidgetCode() {
    require(["UWA/Drivers/jQuery", "BTWWSemanticUI/SemanticUIMessage_ES5_UM5_v1/SemanticUIMessage", "DS/PlatformAPI/PlatformAPI"], function (
        $,
        SemanticUIMessage,
        PlatformAPI
    ) {
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

                var $wdgBody = $(widget.body);
                $wdgBody.empty();

                $wdgBody.append("<div class='camera'><video id='video'>Video Stream not available</video></div>");
                $wdgBody.append("<canvas id='canvas4Picture'></canvas>");

                var $btnPicture = $("<i id='btnPicture' class='icon camera'></i>");
                $btnPicture.click(myWidget.takePicture);
                $wdgBody.append($btnPicture);

                var $btnNextCamera = $("<i id='btnNextCamera' class='icons'><i class='icon camera'></i><i class='icon bottom right corner arrow'></i></i>");
                $btnNextCamera.click(myWidget.nextVideoSource);
                $wdgBody.append($btnNextCamera);

                //Init Notification UI
                SemanticUIMessage.initContainer({
                    parent: widget.body
                });

                myWidget.startVideo();
            },

            streaming: false,

            startVideo: function (constraints) {
                var $video = $("#video");
                if (navigator.mediaDevices) {
                    navigator.mediaDevices
                        .getUserMedia({
                            video: constraints || true,
                            audio: false
                        })
                        .then(function (stream) {
                            var videoHTML = $video.get(0);
                            videoHTML.srcObject = stream;
                            videoHTML.play();
                            myWidget.seakOtherSources();
                        })
                        .catch(function (err) {
                            console.error(err);
                            SemanticUIMessage.addNotif({
                                level: "error",
                                title: "navigator.mediaDevices.getUserMedia",
                                message: err.message,
                                sticky: true
                            });
                        });
                } else {
                    //Old Browsers fallback
                    navigator.getMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

                    if (!navigator.getMedia) {
                        SemanticUIMessage.addNotif({
                            level: "error",
                            title: "Web Browser",
                            message: "Your Web Browser doesn't support camera stream capabilities, try to use a recent Web Browser.",
                            sticky: true
                        });
                    } else {
                        var successCallback = function (stream) {
                            var videoHTML = $video.get(0);
                            if (navigator.mozGetUserMedia) {
                                videoHTML.mozSrcObject = stream;
                            } else {
                                //Chrome or IE
                                var vendorURL = window.URL || window.webkitURL;
                                videoHTML.src = vendorURL.createObjectURL(stream);
                            }
                            videoHTML.play();
                            myWidget.seakOtherSources();
                        };
                        var errorCallback = function (err) {
                            console.error(err);
                            SemanticUIMessage.addNotif({
                                level: "error",
                                title: "navigator.mediaDevices.getUserMedia",
                                message: err.message,
                                sticky: true
                            });
                        };
                        try {
                            navigator.getMedia( //..
                                {
                                    video: true,
                                    audio: false
                                },
                                successCallback,
                                errorCallback
                            );
                        } catch (err) {
                            //The Options Object isn't supported let's try string
                            try {
                                navigator.getMedia("video", successCallback, errorCallback);
                            } catch (err2) {
                                SemanticUIMessage.addNotif({
                                    level: "error",
                                    title: "Impossible to load Camera",
                                    message: err2.message,
                                    sticky: true
                                });
                            }
                        }
                    }
                }
                $video.on("canplay", function () {
                    //TODO the code
                    if (!myWidget.streaming) {
                        //Update Video size
                    }
                });
            },

            deviceList: [],
            seakOtherSources: function () {
                try {
                    navigator.mediaDevices
                        .enumerateDevices()
                        .then(function (devices) {
                            myWidget.deviceList = devices;
                            myWidget.updateDevicesDisplay();
                            try {
                                var prefCam = parseInt(widget.getValue("preferedCamera"));
                                if (prefCam !== myWidget.currentVideoSrc) {
                                    if (prefCam < myWidget.videoSources.length) {
                                        myWidget.currentVideoSrc = prefCam;
                                        myWidget.startVideo({
                                            deviceId: myWidget.videoSources[myWidget.currentVideoSrc].deviceId
                                        });
                                    }
                                }
                            } catch (err) {
                                console.error(err);
                            }
                        })
                        .catch(function (err) {
                            console.error(err);
                        });
                } catch (err) {
                    console.error(err);
                }
            },

            currentVideoSrc: 0,
            videoSources: [],

            updateDevicesDisplay: function () {
                var videoSources = [];
                for (var i = 0; i < myWidget.deviceList.length; i++) {
                    var deviceSource = myWidget.deviceList[i];
                    if (deviceSource.kind === "video" || deviceSource.kind === "videoinput") {
                        videoSources.push(deviceSource);
                    }
                }

                myWidget.videoSources = videoSources;
                if (videoSources.length > 1) {
                    $("#btnNextCamera").addClass("show");
                }
            },

            nextVideoSource: function () {
                myWidget.currentVideoSrc++;
                if (myWidget.currentVideoSrc >= myWidget.videoSources.length) {
                    myWidget.currentVideoSrc = 0;
                }
                widget.setValue("preferedCamera", myWidget.currentVideoSrc);
                myWidget.startVideo({
                    deviceId: myWidget.videoSources[myWidget.currentVideoSrc].deviceId
                });
            },

            takePicture: function () {
                var $canvas = $("#canvas4Picture");
                var canvas = $canvas.get(0);
                var ctx2D = canvas.getContext("2d");

                var $video = $("#video");
                var video = $video.get(0);
                canvas.width = $video.width();
                canvas.height = $video.height();

                ctx2D.drawImage(video, 0, 0, $video.width(), $video.height());
                var dataPng = canvas.toDataURL("image/png");

                PlatformAPI.publish("newImage", {
                    source: "UM5Camera",
                    data: dataPng
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