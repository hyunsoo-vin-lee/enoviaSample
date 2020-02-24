/**
 * BT WW Competencies Center - Fast Prototypes Team
 * @author UM5
 */

function executeWidgetCode() {
    require(["UWA/Drivers/jQuery", "DS/PlatformAPI/PlatformAPI"], function ($, PlatformAPI) {
        var myWidget = {
            subFrame: null,
            subFrameTarget: "*",

            display: function () {
                var urlFrame = widget.getValue("url");

                var $body = $(widget.body);
                $body.empty();
                var $divMain;

                if (!urlFrame || urlFrame.length <= 0) {
                    $divMain = $("<div id='main'>Please specify an url in the preferences</div>");
                    myWidget.subFrame = null;
                } else if (urlFrame.indexOf("https://") !== 0) {
                    $divMain = $("<div id='main'>Please use an https url</div>");
                    myWidget.subFrame = null;
                } else {
                    $divMain = $("<div id='main'></div>");
                    var $iFrame = $("<iframe src='" + urlFrame + "'></iframe>");
                    $divMain.append($iFrame);
                    myWidget.subFrame = $iFrame.get(0);

                    //Get the domain in the src url, format https://example.com:8080
                    var idxStart = urlFrame.indexOf("://") + 3;
                    var idxEnd = urlFrame.indexOf("/", idxStart);
                    var domainAndPort = urlFrame.substring(0, idxEnd);
                    myWidget.subFrameTarget = domainAndPort;
                }

                //Add postMessage Capabilities to communicate with the inside frame.

                myWidget.listenPostMessages();

                $body.append($divMain);
            },

            listenPostMessages: function () {
                window.addEventListener("message", myWidget.receivedPostMessage, false);
            },
            sendPostMessage: function (messageObj) {
                if (myWidget.subFrame) {
                    myWidget.subFrame.contentWindow.postMessage(JSON.stringify(messageObj), myWidget.subFrameTarget);
                    console.debug(new Date().toLocaleTimeString() + " - Post message sent");
                } else {
                    console.debug("Message ignored !");
                }
            },
            receivedPostMessage: function (ev) {
                //console.debug(new Date().toLocaleTimeString() + " - Post Message received : ", ev);
                if (ev.origin != myWidget.subFrameTarget) {
                    console.debug(new Date().toLocaleTimeString() + " - Message received but not from the right frame : ", ev);
                    return;
                }
                var msg = ev.data;
                console.debug(new Date().toLocaleTimeString() + " - Message received : ", msg);
                try {
                    var jsonMsg = JSON.parse(msg);
                    if (jsonMsg.type) {
                        switch (jsonMsg.type) {
                            case "doPublish":
                                myWidget.doPublish(jsonMsg);
                                break;
                            case "doSubscribe":
                                myWidget.doSubscribe(jsonMsg);
                                break;
                            default:
                                console.warn("UM5SmartFrame : Received postMessage unrecognized message type.");
                                break;
                        }
                    }
                } catch (error) {
                    console.warn(new Date().toLocaleTimeString() + " - receivedPostMessage error : ", error);
                }
            },

            arrTopicsSub: [],

            doSubscribe: function (jsonMsg) {
                if (myWidget.arrTopicsSub.indexOf(jsonMsg.topic) === -1) {
                    PlatformAPI.subscribe(jsonMsg.topic, myWidget.callbackSub);
                    myWidget.arrTopicsSub.push(jsonMsg.topic);
                } //else already subscribed
            },
            doPublish: function (jsonMsg) {
                PlatformAPI.publish(jsonMsg.topic, jsonMsg.message);
            },

            callbackSub: function (data, eventObj) {
                myWidget.sendPostMessage({
                    type: "publish",
                    topic: eventObj.topic,
                    message: data
                });
            },

            onLoadWidget: function () {
                var wdgTitlePref = widget.getValue("wdgTitle");
                if (wdgTitlePref) {
                    widget.setTitle(wdgTitlePref);
                }

                myWidget.display();
            },

            onRefreshWidget: () => {
                //Do nothing
                console.info("Refresh widget ignored");
            },
        };

        widget.addEvent("onLoad", myWidget.onLoadWidget);
        widget.addEvent("onRefresh", myWidget.onRefreshWidget);
    });
}