/**
 * BT WW Competencies Center - Fast Prototypes Team
 * @author UM5
 */

function executeWidgetCode() {
    require(["UWA/Drivers/jQuery"], function($) {
        var myWidget = {
            listOfTexts: [],

            webSocket: null,
            wsReady: false,

            onLoadWidget: function() {
                var wdgUrl = widget.getUrl();
                wdgUrl = wdgUrl.substring(0, wdgUrl.lastIndexOf("/"));

                widget.setIcon(wdgUrl + "/../UM5Modules/assets/icons/custom-widget-icon.png");

                if (!myWidget.webSocket || (myWidget.webSocket.readyState !== WebSocket.OPEN && myWidget.webSocket.readyState !== WebSocket.CONNECTING)) {
                    myWidget.webSocket = new WebSocket("wss://3dexp.17xfd04.ds/UM5WSCollabText"); //Going through reverse proxy
                    myWidget.webSocket.onopen = myWidget.onWebSocketReady;
                    myWidget.webSocket.onmessage = myWidget.onWebSocketMessage;
                }
                myWidget.refreshDisplay();
            },

            onWebSocketReady: function() {
                myWidget.wsReady = true;
                //console.log("WebSocket is Ready");
            },

            onWebSocketMessage: function(event) {
                var dataMsg = JSON.parse(event.data);
                //console.log("Web Socket says : ", dataMsg);
                var i, textHere;
                var action = dataMsg.action || "";
                if ("add" === action) {
                    var newText = {
                        id: dataMsg.id,
                        text: dataMsg.text || ""
                    };
                    myWidget.listOfTexts.push(newText);
                    myWidget.refreshDisplay();
                } else if ("remove" === action) {
                    for (i = 0; i < myWidget.listOfTexts.length; i++) {
                        textHere = myWidget.listOfTexts[i];
                        if (textHere.id === dataMsg.id) {
                            myWidget.listOfTexts.splice(i, 1);
                            i--;
                        }
                    }
                    myWidget.refreshDisplay();
                } else if ("modify" === action) {
                    for (i = 0; i < myWidget.listOfTexts.length; i++) {
                        textHere = myWidget.listOfTexts[i];
                        if (textHere.id === dataMsg.id) {
                            textHere.text = dataMsg.text;
                        }
                    }
                    $("textarea[text-id='" + dataMsg.id + "']").val(dataMsg.text);
                }
            },

            onChangeText: function(event) {
                //event.preventDefault();
                //event.stopPropagation();
                var textId = $(event.target).attr("text-id");
                var newText = $(event.target).val();

                var jsonMsg = {
                    action: "modify",
                    id: textId,
                    text: newText
                };
                if (myWidget.wsReady) {
                    myWidget.webSocket.send(JSON.stringify(jsonMsg));
                } else {
                    alert("Web Socket not Ready");
                }

                myWidget.textIdToFocus = textId; // To set back the focus after Web Socket message and refresh of the display

                //$(event.target).focus();
                return false; //Avoid losing the focus
            },

            onRemoveText: function(event) {
                var jsonMsg = {
                    action: "remove",
                    id: $(event.target).attr("text-id")
                };
                if (myWidget.wsReady) {
                    myWidget.webSocket.send(JSON.stringify(jsonMsg));
                } else {
                    alert("Web Socket not Ready");
                }
            },

            addText: function() {
                var jsonMsg = {
                    action: "add",
                    id: "text-" + myWidget.listOfTexts.length
                };
                if (myWidget.wsReady) {
                    myWidget.webSocket.send(JSON.stringify(jsonMsg));
                } else {
                    alert("Web Socket not Ready");
                }
            },

            refreshDisplay: function() {
                var $wdgBody = $(widget.body);

                $wdgBody.html(""); //Clear

                for (var i = 0; i < myWidget.listOfTexts.length; i++) {
                    var $textArea = $("<textarea text-id='" + myWidget.listOfTexts[i].id + "'>" + myWidget.listOfTexts[i].text + "</textarea>");
                    $textArea.on("change", myWidget.onChangeText);
                    $textArea.on("cut paste input", myWidget.onChangeText);
                    $wdgBody.append($textArea);

                    var $removeBtn = $("<div class='btn' title='Remove the text above' text-id='" + myWidget.listOfTexts[i].id + "'>Remove</div>");
                    $removeBtn.on("click", myWidget.onRemoveText);
                    $wdgBody.append($removeBtn);
                }

                var $addBtn = $("<div class='btn' title='Add a New text bellow'>Add New Text</div>");
                $addBtn.on("click", myWidget.addText);
                $wdgBody.append($addBtn);
            }
        };

        widget.addEvent("onLoad", myWidget.onLoadWidget);
    });
}
