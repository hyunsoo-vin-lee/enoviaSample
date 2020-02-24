/*
 * BT WW Competencies Center - Fast Prototypes Team
 * @author UM5
 */

function executeWidgetCode() {
    require(["UWA/Drivers/jQuery", "UM5Modules/Connector3DSpace", "BTWWSemanticUI/SemanticUIMessage_ES5_UM5_v1/SemanticUIMessage"], function(
        $,
        Connector3DSpace,
        SemanticUIMessage
    ) {
        var myWidget = {
            myRequests: [],

            // Widget Events
            onLoadWidget: function() {
                var wdgUrl = widget.getUrl();
                wdgUrl = wdgUrl.substring(0, wdgUrl.lastIndexOf("/"));

                widget.setIcon(wdgUrl + "/../UM5Modules/assets/icons/custom-widget-icon.png");

                var wdgTitlePref = widget.getValue("wdgTitle");
                if (wdgTitlePref) {
                    widget.setTitle(wdgTitlePref);
                }

                var $wdgBody = $(widget.body);
                $wdgBody.empty();

                $wdgBody.append("<div id='myRequests'>My Requests, loading...</div>");
                $wdgBody.append("<div id='detailsPanel' class='hidden'>Details Panel</div>");
                $wdgBody.append("<div id='overlayPanel' class='hidden'>Overlay Panel</div>");

                myWidget.addBottomButtons();

                //Init Notification UI
                SemanticUIMessage.initContainer({ parent: widget.body });

                myWidget.loadMyRequests();
            },

            addBottomButtons: function() {
                var $wdgBody = $(widget.body);

                var $botToolbar = $("<div id='botToolbar'></div>");

                var $btnCreateRequest = $("<button class='ui button basic blue'><i class='icon plus'></i>New Request</button>");
                $btnCreateRequest.click(myWidget.showCreateRequestPanel);
                $botToolbar.append($btnCreateRequest);

                $wdgBody.append($botToolbar);
            },

            showCreateRequestPanel: function() {
                var $divOverlay = $("#overlayPanel");

                $divOverlay.empty();

                var $btnClose = $("<div id='closeBtn'><i class='ui icon close'></i></div>");
                $btnClose.click(myWidget.closeOverlayPanel);
                $divOverlay.append($btnClose);

                $divOverlay.append("<h1 class='ui header'>New Request</h1>");
                $divOverlay.append("<h3 class='ui header'>Title :</h3>");
                $divOverlay.append("<div class='ui input'><input id='newReqTitle' type='test' placeholder='Object of the Request' value=''/></div>");
                $divOverlay.append("<h3 class='ui header'>Description :</h3>");
                $divOverlay.append("<textarea id='newReqDescription' type='test' class='ui' placeholder='Description of the Request' rows='5'></textarea>");

                var $btnDone = $("<button class='ui button basic green'><i class='icon checkmark'></i>Done</button>");
                $btnDone.click(myWidget.createRequest);
                $divOverlay.append($btnDone);

                $divOverlay.removeClass("hidden");
            },

            closeOverlayPanel: function() {
                var $divOverlay = $("#overlayPanel");
                $divOverlay.addClass("hidden");
            },

            createRequest: function() {
                var title = $("input#newReqTitle").val();
                var description = $("textarea#newReqDescription").val();

                //Add Loader in the display
                var $divOverlay = $("#overlayPanel");
                $divOverlay.append("<div class='ui active inverted dimmer'><div class='ui text loader'>Creating Request</div></div>");

                //Launch the Call
                var myRequestsUrl = "/UM5AdminForms/myRequests/create";
                var method = "POST";
                var dataRequest = { title: title, description: description };

                var whenDone = function() {
                    myWidget.closeOverlayPanel();
                    myWidget.loadMyRequests();
                };

                var whenError = function() {
                    $("#overlayPanel .ui.active.dimmer").remove();
                };

                Connector3DSpace.call3DSpace({
                    url: myRequestsUrl,
                    method: method,
                    type: "json",
                    data: dataRequest,
                    forceReload: true,
                    onComplete: function(dataResp /*, headerResp, callbackData*/) {
                        if (dataResp.msg === "OK") {
                            whenDone(dataResp.data);
                        } else {
                            var errorType = "Error in Web Service Response";
                            var errorMsg = JSON.stringify(dataResp);
                            SemanticUIMessage.addNotif({
                                level: "error",
                                title: errorType,
                                message: errorMsg,
                                sticky: false
                            });
                            whenError();
                        }
                    },
                    onFailure: function(error) {
                        var errorType = "WebService Call Faillure";
                        var errorMsg = JSON.stringify(error);
                        SemanticUIMessage.addNotif({
                            level: "error",
                            title: errorType,
                            message: errorMsg,
                            sticky: false
                        });
                        whenError();
                    }
                });
            },

            loadMyRequests: function() {
                var myRequestsUrl = "/UM5AdminForms/myRequests/list";
                var method = "POST";
                var dataRequest = {};

                var whenDone = function(data) {
                    myWidget.myRequests = data;
                    myWidget.displayMyRequests();
                };

                Connector3DSpace.call3DSpace({
                    url: myRequestsUrl,
                    method: method,
                    type: "json",
                    data: dataRequest,
                    forceReload: true,
                    onComplete: function(dataResp /*, headerResp, callbackData*/) {
                        if (dataResp.msg === "OK") {
                            whenDone(dataResp.data);
                        } else {
                            var errorType = "Error in Web Service Response";
                            var errorMsg = JSON.stringify(dataResp);
                            SemanticUIMessage.addNotif({
                                level: "error",
                                title: errorType,
                                message: errorMsg,
                                sticky: false
                            });
                        }
                    },
                    onFailure: function(error) {
                        var errorType = "WebService Call Faillure";
                        var errorMsg = JSON.stringify(error);
                        SemanticUIMessage.addNotif({
                            level: "error",
                            title: errorType,
                            message: errorMsg,
                            sticky: false
                        });
                    }
                });
            },

            deleteRequest: function(requestOid) {
                var myRequestsUrl = "/UM5AdminForms/myRequests/" + requestOid;
                var method = "DELETE";
                var dataRequest = {};

                var whenDone = function() {
                    myWidget.closeDetailsPanel();
                    myWidget.loadMyRequests();
                };

                Connector3DSpace.call3DSpace({
                    url: myRequestsUrl,
                    method: method,
                    type: "json",
                    data: dataRequest,
                    forceReload: true,
                    onComplete: function(dataResp /*, headerResp, callbackData*/) {
                        if (dataResp.msg === "OK") {
                            whenDone();
                        } else {
                            var errorType = "Error in Web Service Response";
                            var errorMsg = JSON.stringify(dataResp);
                            SemanticUIMessage.addNotif({
                                level: "error",
                                title: errorType,
                                message: errorMsg,
                                sticky: false
                            });
                        }
                    },
                    onFailure: function(error) {
                        var errorType = "WebService Call Faillure";
                        var errorMsg = JSON.stringify(error);
                        SemanticUIMessage.addNotif({
                            level: "error",
                            title: errorType,
                            message: errorMsg,
                            sticky: false
                        });
                    }
                });
            },

            displayMyRequests: function() {
                var $divContent = $("#myRequests");
                $divContent.empty();

                if (myWidget.myRequests.length <= 0) {
                    $divContent.append("No Requests to display");
                }

                for (var i = 0; i < myWidget.myRequests.length; i++) {
                    var requestObj = myWidget.myRequests[i];

                    var $divReqObj = myWidget.getDivRequestObj(requestObj);
                    $divContent.append($divReqObj);
                }
            },
            getDivRequestObj: function(requestObj) {
                var $divReqObj = $("<div class='request'></div>");
                $divReqObj.append("<div class='name'>" + requestObj.name + "</div>");

                $divReqObj.append(myWidget.getDivStepsRequestObj(requestObj));

                $divReqObj.click(function() {
                    myWidget.displayDetailsPanel(requestObj);
                });

                return $divReqObj;
            },

            getDivStepsRequestObj: function(requestObj) {
                var $divSteps = $("<div class='ui mini steps unstackable'></div>");

                var $divStepCreated = $(
                    "<div class='step'><i class='icon flag'></i><div class='content'><div class='title'>Created</div><div class='description'>" +
                        requestObj.originated +
                        "</div></div></div>"
                );
                var $divStepPending = $(
                    "<div class='step'><i class='icon settings'></i><div class='content'><div class='title'>Pending</div><div class='description'>" +
                        (requestObj["state[Assign].actual"] || "") +
                        "</div></div></div>"
                );
                var $divStepDone = $(
                    "<div class='step'><i class='icon checkmark'></i><div class='content'><div class='title'>Done</div><div class='description'>" +
                        (requestObj["state[Complete].actual"] || "") +
                        "</div></div></div>"
                );

                if (requestObj.current === "Create") {
                    $divStepCreated.addClass("active");
                } else if (requestObj.current === "Complete") {
                    $divStepDone.addClass("active");
                } else {
                    $divStepPending.addClass("active");
                }

                $divSteps.append($divStepCreated);
                $divSteps.append($divStepPending);
                $divSteps.append($divStepDone);

                return $divSteps;
            },

            displayDetailsPanel: function(requestObj) {
                var $divDetails = $("#detailsPanel");

                $divDetails.removeClass("hidden");

                $divDetails.empty();

                var $btnClose = $("<div id='closeBtn'><i class='ui icon close'></i></div>");
                $btnClose.click(myWidget.closeDetailsPanel);

                $divDetails.append($btnClose);

                var $nameHeader = $("<h2 class='ui header'>" + requestObj.name + "</h2>");

                var $btnDelete = $("<div id='deleteBtn'><i class='icon trash'></i></div>");
                var requestOid = requestObj.id;
                $btnDelete.click(function() {
                    myWidget.deleteRequest(requestOid);
                });
                $nameHeader.append($btnDelete);

                $divDetails.append($nameHeader);

                $divDetails.append(myWidget.getDivStepsRequestObj(requestObj));

                $divDetails.append("<h4 class='ui header'>Description :</h4><p>" + requestObj.description.replace(/\n/g, "<br/>") + "</p>");
                $divDetails.append("<h4 class='ui header'>Attachments :</h4>");

                var valTitleDocs = requestObj["from[Reference Document].to.attribute[Title].value"];
                if (valTitleDocs) {
                    var arrTitles = valTitleDocs.split("\u0007");
                    for (var i = 0; i < arrTitles.length; i++) {
                        var $divTitleDoc = $("<div>" + arrTitles[i] + "</div>");
                        $divDetails.append($divTitleDoc);
                    }
                } else {
                    $divDetails.append("<div>No attachment found.</div>");
                }
            },
            closeDetailsPanel: function() {
                var $divDetails = $("#detailsPanel");
                $divDetails.addClass("hidden");
            }
        };

        widget.addEvent("onLoad", myWidget.onLoadWidget);
    });
}
