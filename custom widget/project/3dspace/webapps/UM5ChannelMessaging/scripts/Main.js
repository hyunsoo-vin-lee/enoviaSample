/*
 * BT WW Competencies Center - Fast Prototypes Team
 * @author UM5
 */

function executeWidgetCode() {
    require(["UWA/Drivers/jQuery", "DS/PlatformAPI/PlatformAPI", "BTWWSemanticUI/SemanticUIMessage_ES5_UM5_v1/SemanticUIMessage"], function(
        $,
        PlatformAPI,
        SemanticUIMessage
    ) {
        var myWidget = {
            channel: null,
            port1: null,
            port2: null,

            // Widget Events
            onLoadWidget: function() {
                var $wdgBody = $(widget.body);
                $wdgBody.html("<div id='content' style='height:100%;overflow:auto;'></div>");

                var wdgTitlePref = widget.getValue("wdgTitle");
                if (wdgTitlePref) {
                    widget.setTitle(wdgTitlePref);
                }

                //Init Notification UI
                SemanticUIMessage.initContainer({ parent: widget.body });

                //Init Channel Massaging
                myWidget.initChannelMessaging();

                //Gen Buttons display
                myWidget.displayUI();
            },

            initChannelMessaging: function() {
                window.onmessage = myWidget.handleChannelMessage;

                PlatformAPI.subscribe("exchangeFrameId", myWidget.getFrameIdResponse);
                var dataObj = { wdgId: widget.id, frameId: window.frameElement.id };
                PlatformAPI.publish("exchangeFrameId", dataObj);
            },

            getFrameIdResponse: function(data) {
                if (data.wdgId === widget.id) {
                    return; //Avoid own widget messages and get only the ones comming from other widgets
                }

                myWidget.channel = new MessageChannel();

                var otherWindow = null;
                var arrFrames = top.window.frames;
                for (var i = 0; i < arrFrames.length; i++) {
                    var frm = arrFrames[i].frameElement;
                    if (frm.id === data.frameId) {
                        otherWindow = frm.contentWindow;
                        break;
                    }
                }

                myWidget.channel.port1.onmessage = myWidget.handleChannelMessage;

                myWidget.port1 = myWidget.channel.port1;

                otherWindow.postMessage({ type: "SaveChannelPorts" }, "*", [myWidget.channel.port2]);
            },

            handleChannelMessage: function(ev) {
                if (ev.data.type === "SaveChannelPorts") {
                    myWidget.port2 = ev.ports[0];
                    myWidget.port2.onmessage = myWidget.handleChannelMessage;
                } else if (ev.data.type === "Message") {
                    var msg = ev.data.msg;
                    SemanticUIMessage.addNotif({
                        level: "info",
                        title: "Message from Channel Messaging :",
                        message: msg,
                        sticky: false
                    });
                } else {
                    console.warn("Unmanaged Message : ", ev);
                }
            },

            displayUI: function() {
                var $content = $("#content");
                $content.empty(); //Clear it

                var $divText = $("<div class='ui input'><input id='inTxt' placeholder='Text to Send Here...' type='text'></div>");
                var $btnSend = $("<button class='ui primary button'>Send Message</button>");
                $btnSend.click(function() {
                    var valMsg = $("#inTxt").val();
                    var portForMsg = myWidget.port1 || myWidget.port2;
                    if (portForMsg) {
                        portForMsg.postMessage({ type: "Message", msg: valMsg });
                    } else {
                        SemanticUIMessage.addNotif({
                            level: "error",
                            title: "Error",
                            message: "Channel Messaging not Ready, please wait...",
                            sticky: false
                        });
                    }
                });

                $content.append($divText);
                $content.append($btnSend);
            }
        };

        widget.addEvent("onLoad", myWidget.onLoadWidget);
    });
}
