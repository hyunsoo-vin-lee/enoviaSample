/*
 * BT WW Competencies Center - Fast Prototypes Team
 * @author UM5
 */

function executeWidgetCode() {
    require(["UWA/Drivers/jQuery", "DS/PlatformAPI/PlatformAPI"], function ($, PlatformAPI) {
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

                $(widget.body).html("Proxy Loading...");

                //Get the domain in the src url, format https://example.com:8080
                let urlFrame = top.location.href;
                let idxStart = urlFrame.indexOf("://") + 3;
                let idxEnd = urlFrame.indexOf("/", idxStart);
                let domainAndPort = urlFrame.substring(0, idxEnd);
                myWidget.parentFrameTarget = domainAndPort;

                myWidget.targetWindow = top;
                myWidget.targetWindowListen = window.parent;

                myWidget.targetWindowListen.addEventListener("message", myWidget.receivedPostMessage, false);

                //Update display
                $(widget.body).html("Proxy Listening : " + myWidget.parentFrameTarget);

                //Signal parent page that we can receive messages now !
                myWidget.sendPostMessage({
                    type: "proxyReady"
                });
            },

            onRefreshWidget: () => {
                //Do nothing
                console.info("Refresh widget ignored");
            },

            sendPostMessage: function (messageObj) {
                if (myWidget.targetWindow) {
                    myWidget.targetWindow.postMessage(JSON.stringify(messageObj), myWidget.parentFrameTarget);
                    console.debug(new Date().toLocaleTimeString() + " - Post message sent");
                } else {
                    console.debug("Message ignored !");
                }
            },

            receivedPostMessage: function (ev) {
                //console.debug(new Date().toLocaleTimeString() + " - Post Message received : ", ev);
                if (ev.origin != myWidget.parentFrameTarget) {
                    console.debug(new Date().toLocaleTimeString() + " - Message received but not from the right frame : ", ev);
                    return;
                }
                var msg = ev.data;
                //console.debug(new Date().toLocaleTimeString() + " - Message received : ", msg);
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
                            case "uwa-intercom":
                                break; //Ignore them
                            default:
                                console.warn("UM5SmartProxy : Received postMessage unrecognized message type, " + jsonMsg.type + ".");
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
            }
        };

        widget.addEvent("onLoad", myWidget.onLoadWidget);
        //widget.addEvent("onRefresh", myWidget.onLoadWidget);
        //widget.addEvent("onSearch", myWidget.onSearchWidget);
        //widget.addEvent("onResetSearch", myWidget.onResetSearchWidget);

        //widget.addEvent("onConfigChange", myWidget.onConfigChange); //For change of Table Config in list
    });
}