/**
 * BT WW Competencies Center - Fast Prototypes Team
 * @author UM5
 */

function executeWidgetCode() {
    require(["UWA/Drivers/jQuery", "DS/PlatformAPI/PlatformAPI"], function($, PlatformAPI) {
        var myWidget = {
            dataFull: [],

            initDisplay: function() {
                //Display data in Table
                var inHTML = "<div id='divContent' style='height:100%;overflow:auto;'></div>";

                widget.body.innerHTML = inHTML;

                var $content = $("#divContent");

                var $sendEvent = $("<div class='txtBtn'>Send Event</div>");
                $sendEvent.click(function(ev) {
                    myWidget.doPublish();
                });
                $content.append($sendEvent);

                $sendEvent = $("<div class='txtBtn'>Clear</div>");
                $sendEvent.click(function(ev) {
                    myWidget.initDisplay();
                });
                $content.append($sendEvent);

                var $divText = $("<div id='txtDiv'>Events Received :<br/></div>");
                $content.append($divText);
            },

            eventReceived: function(data, eventObj) {
                var $divText = $("#txtDiv");
                //console.log(arguments);
                $divText.append(eventObj.topic + ":<br/>" + JSON.stringify(data) + "<br/>");
            },

            arrSubscribtions: [],

            doSubscritions: function() {
                var txtEventsNames = widget.getValue("listenEventsNames");
                var arrEventsNames = txtEventsNames.split(",");
                var i;
                for (i = 0; i < myWidget.arrSubscribtions.length; i++) {
                    var sub = myWidget.arrSubscribtions[i].sub;
                    PlatformAPI.unsubscribe(sub);
                }
                myWidget.arrSubscribtions = [];

                for (i = 0; i < arrEventsNames.length; i++) {
                    var evName = arrEventsNames[i];
                    myWidget.arrSubscribtions.push({
                        evName: evName,
                        sub: PlatformAPI.subscribe(evName, myWidget.eventReceived)
                    });
                }
                //console.log(myWidget.arrSubscribtions);
            },

            doPublish: function() {
                var sendEventName = widget.getValue("sendEventName");
                var sendEventData = {};
                try {
                    sendEventData = JSON.parse(widget.getValue("sendEventData"));
                } catch (err) {
                    console.error(err);
                    sendEventData = {};

                    var $divText = $("#txtDiv");
                    $divText.append("Issue will parsing the data to send, check that your are using a well formatted JSON.<br/>");
                }
                PlatformAPI.publish(sendEventName, sendEventData);
            },

            onLoadWidget: function() {
                var wdgUrl = widget.getUrl();
                wdgUrl = wdgUrl.substring(0, wdgUrl.lastIndexOf("/"));

                widget.setIcon(wdgUrl + "/../UM5Modules/assets/icons/custom-widget-icon.png");

                widget.setTitle("Wdg Com' Tester");

                myWidget.initDisplay();
                myWidget.doSubscritions();
            }
        };

        widget.addEvent("onLoad", myWidget.onLoadWidget);
        widget.addEvent("onRefresh", myWidget.onLoadWidget);
    });
}
