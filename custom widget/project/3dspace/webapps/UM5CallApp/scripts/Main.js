/**
 * BT WW Competencies Center - Fast Prototypes Team
 * @author UM5
 */

function executeWidgetCode() {
    require(["UWA/Drivers/jQuery", "DS/i3DXCompassServices/i3DXCompassPubSub"], function($, i3DXCompassPubSub) {
        var myWidget = {
            onLoadWidget: function() {
                var $wdgBody = $(widget.body);

                $wdgBody.html(""); //Clear

                var $btnSendEvent = $("<div class='btn'>Call App</div>");
                $btnSendEvent.click(myWidget.callApp);

                $wdgBody.append($btnSendEvent);

                var $txtArea = $("<textarea id='txt'></textarea>");

                $wdgBody.append($txtArea);

                i3DXCompassPubSub.subscribe("launchAppCallback", myWidget.callBackLaunchApp);
            },

            callApp: function(ev) {
                var $txtArea = $("#txt");

                var txtToSend = $txtArea.val();
                var appId = widget.getValue("appID");

                var paramsApp = {
                    widgetId: widget.id,
                    appId: appId,
                    fileName: "-UM5ParamFile",
                    fileContent: txtToSend
                };

                i3DXCompassPubSub.publish("launchApp", paramsApp);
            },

            callBackLaunchApp: function (data) {
                console.log('data=', data);
            }
        };

        widget.addEvent("onLoad", myWidget.onLoadWidget);
    });
}
