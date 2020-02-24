/*
 * BT WW Competencies Center - Fast Prototypes Team
 * @author UM5
 */

function executeWidgetCode() {
    require([
        "UWA/Drivers/jQuery",
        "UM5Modules/Connector3DSpace",
        "BTWWSemanticUI/SemanticUIMessage_ES5_UM5_v1/SemanticUIMessage",
        "BTWWSemanticUI/SemanticUITable_ES5_UM5_v1/SemanticUITable"
    ], function($, Connector3DSpace, SemanticUIMessage, SemanticUITable) {
        var myWidget = {
            dataFull: [],

            // Widget Events
            onLoadWidget: function() {
                var wdgUrl = widget.getUrl();
                wdgUrl = wdgUrl.substring(0, wdgUrl.lastIndexOf("/"));

                widget.setIcon(wdgUrl + "/../UM5Modules/assets/icons/custom-widget-icon.png");

                var $wdgBody = $(widget.body);
                $wdgBody.html(
                    "<div id='content'><div id='divTopbar' style='height:3em;overflow:none;'></div><div id='divTable' style='height:calc(100% - 3em);overflow:auto;'></div></div>"
                );

                myWidget.displayTopbar();

                //Init Notification UI
                SemanticUIMessage.initContainer({ parent: widget.body });

                myWidget.getPolicies();
            },

            displayTopbar: function() {
                var $divTopbar = $("#divTopbar");
                $divTopbar.empty();

                var $inText = $("<div class='ui labeled input'><div class='ui label'>Policy Name</div><input id='namePattern' type='text' value='*'/></div>");
                $divTopbar.append($inText);

                var $btnRefresh = $("<button id='refreshBtn' class='ui primary button'>Refresh</button>");
                $btnRefresh.click(function(ev) {
                    var namePattern = $("#namePattern").val();
                    myWidget.getPolicies(namePattern);
                });
                $divTopbar.append($btnRefresh);

                //Bind Enter Key to Refresh button
                $inText.keyup(function(event) {
                    if (event.keyCode === 13) {
                        $("#refreshBtn").click();
                    }
                });

                //<div class="ui blue ribbon label"> <i class="spoon icon"></i> Food </div>
                $divTopbar.append("<div id='nbObjects' class='ui blue right basic label'>?? policies</div>");
            },

            displayPolicies: function(arrData) {
                var nbObjs = arrData.length;
                $("#nbObjects").html(nbObjs + " polic" + (nbObjs > 1 ? "ies" : "y"));

                var defaultCellDisplay = function(rowObject, columnDef) {
                    var keyObj = columnDef.enoSelect;
                    var valDisp = rowObject[keyObj] ? rowObject[keyObj] : "";
                    return valDisp;
                };

                var rowsFunction = function(rowObject, trElement) {
                    var $tr = $(trElement);
                    $tr.attr("policyName", rowObject.name);
                    $tr.click(function(ev) {
                        var policyName = $(this).attr("policyName");
                        myWidget.getPolicyInfos(policyName);
                    });
                };

                var columnsDef = [
                    {
                        header: "Name",
                        cell: defaultCellDisplay,
                        enoSelect: "name"
                    },
                    {
                        header: "minorsequence",
                        cell: defaultCellDisplay,
                        enoSelect: "minorsequence"
                    },
                    {
                        header: "majorsequence",
                        cell: defaultCellDisplay,
                        enoSelect: "majorsequence"
                    },
                    {
                        header: "delimiter",
                        cell: defaultCellDisplay,
                        enoSelect: "delimiter"
                    }
                ];

                //Create the table Object
                var tableUI = new SemanticUITable({
                    id: "um5AdvTable",
                    config: {
                        columns: columnsDef,
                        rowsFunction: rowsFunction /*,
                        headersFunction: headersFunction */
                    },
                    style: {
                        table: "unstackable striped compact"
                    }
                });

                //Save Scroll Position
                var $divTable = $("#divTable");
                var scrollX = 0;
                var scrollY = 0;
                if ($divTable.length > 0) {
                    scrollX = $divTable.get(0).scrollLeft;
                    scrollY = $divTable.get(0).scrollTop;
                }

                // Refresh / Generate display with data

                $divTable.empty();

                tableUI.addRows(arrData);

                tableUI.injectIn($divTable.get(0));

                //Set Scroll Position back
                try {
                    $divTable.get(0).scrollLeft = scrollX;
                    $divTable.get(0).scrollTop = scrollY;
                } catch (error) {
                    console.warn("Issue will trying to set back position of Scroll");
                }
            },

            displayPolicy: function(policyName, data) {
                var $content = $("#content");
                $content.empty();

                var $divName = $("<div class='policyName'><h3 class='ui header'>" + policyName + "</h3></div>");

                var $prevButton = $("<div id='previousDisplay'><i class='icon chevron left'></i></div>");
                $prevButton.click(function() {
                    myWidget.onLoadWidget();
                });
                $divName.append($prevButton);

                var $divHeadTypes = $("<div><div class='category'>Governed Types :</div></div>");

                var $inTextType = $(
                    "<div class='ui mini labeled input'><div class='ui label'>Search Type</div><input id='typePattern' type='text' placeholder='all' value=''/></div>"
                );
                $inTextType.css("margin-left", "0.5em");

                var $btnRefresh = $("<button id='refreshTypesBtn' class='ui tiny primary button'>Refine</button>");
                $btnRefresh.click(function(ev) {
                    var typePattern = $("#typePattern").val();
                    var $divTypes = $("div.policyTypes");
                    $divTypes.empty();
                    var i;
                    for (i = 0; i < data.types.length; i++) {
                        var type = data.types[i];
                        if (type.indexOf(typePattern) !== -1) {
                            $divTypes.append("<div class='type'>" + type + "</div>");
                        }
                    }
                });
                $inTextType.append($btnRefresh);

                $divHeadTypes.append($inTextType);

                //Bind Enter Key to Refresh button
                $inTextType.keyup(function(event) {
                    if (event.keyCode === 13) {
                        $("#refreshTypesBtn").click();
                    }
                });

                var $divTypes = $("<div class='policyTypes'></div>");
                var i;
                for (i = 0; i < data.types.length; i++) {
                    var type = data.types[i];
                    $divTypes.append("<div class='type'>" + type + "</div>");
                }

                var $divHeadStates = $("<div><div class='category'>States :</div></div>");

                var $inTextAccess = $(
                    "<div class='ui mini labeled input'><div class='ui label'>Focus on accesses</div><input id='accessesTxt' type='text' placeholder='all' value=''/></div>"
                );
                $inTextAccess.css("margin-left", "0.5em");

                var $btnRefreshAccess = $("<button id='refreshAccessesBtn' class='ui tiny primary button'>Filter</button>");
                $btnRefreshAccess.click(function(ev) {
                    var $currentState = $(".state.selected");
                    if ($currentState.length > 0) {
                        var currentState = $currentState.attr("stateName");
                        myWidget.displayPolicyStateTable(states[currentState]);
                    }
                });
                $inTextAccess.append($btnRefreshAccess);

                $divHeadStates.append($inTextAccess);

                //Bind Enter Key to Refresh button
                $inTextAccess.keyup(function(event) {
                    if (event.keyCode === 13) {
                        $("#refreshAccessesBtn").click();
                    }
                });

                var $divStates = $("<div id='policyStates'></div>");

                var states = {};
                states["All"] = data.allstate;

                $divStates.append("<div class='state' stateName='All'>All</div>");

                for (i = 0; i < data.states.length; i++) {
                    var stateObj = data.states[i];
                    states[stateObj.name] = stateObj.data;
                    $divStates.append("<div class='state' stateName='" + stateObj.name + "'>" + stateObj.name + "</div>");
                }

                var $divTable = $("<div id='policyTable'></div>");

                $content.append($divName);
                $content.append($divHeadTypes);
                $content.append($divTypes);
                $content.append($divHeadStates);
                $content.append($divStates);
                $content.append($divTable);

                $(".state").click(function(ev) {
                    var $this = $(this);
                    $(".state.selected").removeClass("selected");
                    $this.addClass("selected");
                    myWidget.displayPolicyStateTable(states[$this.attr("stateName")]);
                });
            },

            displayPolicyStateTable: function(arrData) {
                //Sort
                var sortByUser = function(a, b) {
                    var x = a["user"];
                    var y = b["user"];

                    if (x === "" && (a.public || a.owner)) {
                        return -1;
                    } else if (y === "" && (a.public || a.owner)) {
                        return 1;
                    }

                    if (typeof x == "string") {
                        x = x.toLowerCase();
                    }
                    if (typeof y == "string") {
                        y = y.toLowerCase();
                    }

                    if (x === y) {
                        x = a["key"];
                        y = b["key"];
                    }

                    return x < y ? -1 : x > y ? 1 : 0;
                };
                arrData.sort(sortByUser);

                //Display
                var defaultCellDisplay = function(rowObject, columnDef) {
                    var keyObj = columnDef.enoSelect;
                    var valDisp = rowObject[keyObj] ? rowObject[keyObj] : "";
                    return valDisp;
                };

                var userCellDisplay = function(rowObject, columnDef) {
                    var keyObj = columnDef.enoSelect;
                    var valDisp = rowObject[keyObj] ? rowObject[keyObj] : "";
                    if (valDisp === "" && rowObject.public) {
                        valDisp = "*Public*";
                    } else if (valDisp === "" && rowObject.owner) {
                        valDisp = "*Owner*";
                    }
                    return valDisp;
                };

                var keyCellDisplay = function(rowObject, columnDef) {
                    var keyObj = columnDef.enoSelect;
                    var valDisp = rowObject[keyObj] ? rowObject[keyObj] : "";
                    if (valDisp === "FALSE") {
                        valDisp = "";
                    }
                    return valDisp;
                };

                var booleanTrueCellDisplay = function(rowObject, columnDef) {
                    var keyObj = columnDef.enoSelect;
                    var valDisp = rowObject[keyObj] ? rowObject[keyObj] : "";
                    if (valDisp === "TRUE") {
                        valDisp = "<i class='large green checkmark icon' title='" + columnDef.header + " " + valDisp + "'></i>";
                    } else if (valDisp === "FALSE") {
                        valDisp = "";
                    }
                    return valDisp;
                };

                var accessCellDisplay = function(rowObject, columnDef) {
                    var keyObj = columnDef.enoSelect;
                    var access = columnDef.accessKey;
                    var valAccess = rowObject[keyObj] ? rowObject[keyObj] : "";
                    var valDisp = "";
                    if (valAccess.indexOf(access) != -1 || (valAccess === "all" && access !== "none")) {
                        if (rowObject.revoke === "FALSE") {
                            valDisp = "<i class='large green checkmark icon' title='Add " + columnDef.header + "'></i>";
                        } else {
                            valDisp = "<i class='medium red close icon' title='Revoke " + columnDef.header + "'></i>";
                        }
                    }
                    return valDisp;
                };

                var columnsDef = [
                    {
                        header: "User",
                        cell: userCellDisplay,
                        enoSelect: "user"
                    },
                    {
                        header: "key",
                        cell: keyCellDisplay,
                        enoSelect: "key"
                    },
                    {
                        header: "filter",
                        cell: defaultCellDisplay,
                        enoSelect: "filter"
                    },
                    {
                        header: "revoke",
                        cell: booleanTrueCellDisplay,
                        enoSelect: "revoke"
                    },
                    {
                        header: "Org.",
                        cell: defaultCellDisplay,
                        enoSelect: "organization"
                    },
                    {
                        header: "Proj.",
                        cell: defaultCellDisplay,
                        enoSelect: "project"
                    }
                ];

                var arrAccesses = [
                    "none",
                    "show",
                    "read",
                    "create",
                    "modify",
                    "delete",
                    "fromconnect",
                    "toconnect",
                    "fromdisconnect",
                    "todisconnect",
                    "revise",
                    "majorrevise",
                    "minorrevise",
                    "promote",
                    "demote",
                    "reserve",
                    "unreserve",
                    "lock",
                    "unlock",
                    "freeze",
                    "thaw",
                    "enable",
                    "disable",
                    "approve",
                    "reject",
                    "ignore",
                    "checkout",
                    "checkin",
                    "schedule",
                    "grant",
                    "revoke",
                    "override",
                    "changename",
                    "changetype",
                    "changeowner",
                    "changepolicy",
                    "changevault",
                    "changesov"
                ];

                var accessesTxt = $("#accessesTxt").val();
                var bHideEmptyCol = widget.getValue("hideEmptyColumns") === "true";

                var i;
                if (accessesTxt === "" || accessesTxt === "all") {
                    if (bHideEmptyCol) {
                        var arrColAccesses = [];
                        for (i = 0; i < arrData.length; i++) {
                            var data = arrData[i];
                            var arrLocalAccess = data.access.split(",");
                            for (var j = 0; j < arrLocalAccess.length; j++) {
                                if (arrColAccesses.indexOf(arrLocalAccess[j]) === -1) {
                                    arrColAccesses.push(arrLocalAccess[j]);
                                }
                            }
                        }
                        //Then gen the display in the same order for all the Tables
                        for (i = 0; i < arrAccesses.length; i++) {
                            if (arrColAccesses.indexOf(arrAccesses[i]) !== -1) {
                                columnsDef.push({
                                    header: arrAccesses[i],
                                    cell: accessCellDisplay,
                                    enoSelect: "access",
                                    accessKey: arrAccesses[i]
                                });
                            }
                        }
                    } else {
                        for (i = 0; i < arrAccesses.length; i++) {
                            columnsDef.push({
                                header: arrAccesses[i],
                                cell: accessCellDisplay,
                                enoSelect: "access",
                                accessKey: arrAccesses[i]
                            });
                        }
                    }
                } else {
                    var arrSelectedAccesses = accessesTxt.split(",");
                    for (i = 0; i < arrSelectedAccesses.length; i++) {
                        var selectedAccess = arrSelectedAccesses[i];
                        if (arrAccesses.indexOf(selectedAccess) !== -1) {
                            columnsDef.push({
                                header: selectedAccess,
                                cell: accessCellDisplay,
                                enoSelect: "access",
                                accessKey: selectedAccess
                            });
                        }
                    }
                }

                columnsDef.push({
                    header: "access",
                    cell: defaultCellDisplay,
                    enoSelect: "access"
                });

                //Create the table Object
                var tableUI = new SemanticUITable({
                    id: "um5Table",
                    config: {
                        columns: columnsDef /*,
                        rowsFunction: rowsFunction ,
                        headersFunction: headersFunction */
                    },
                    style: {
                        table: "unstackable striped compact"
                    }
                });

                var $divTable = $("#policyTable");

                $divTable.empty();

                tableUI.addRows(arrData);

                tableUI.injectIn($divTable.get(0));
            },

            getPolicies: function(namePattern) {
                namePattern = namePattern || "*";
                Connector3DSpace.call3DSpace({
                    url: "/UM5Tools/Policy/list",
                    method: "POST",
                    type: "json",
                    forceReload: true,
                    data: {
                        namePattern: namePattern,
                        where: ""
                    },
                    onComplete: function(dataResp) {
                        if (dataResp.msg === "OK") {
                            myWidget.dataFull = dataResp.data;

                            myWidget.displayPolicies(myWidget.dataFull);
                        } else {
                            console.error("Error in WebService Response : " + JSON.stringify(dataResp));
                            SemanticUIMessage.addNotif({
                                level: "error",
                                title: "Error in WebService Response :",
                                message: JSON.stringify(dataResp),
                                sticky: false
                            });
                        }
                    },
                    onFailure: function(error) {
                        console.error("WebService Call Faillure : " + JSON.stringify(error));
                        SemanticUIMessage.addNotif({
                            level: "error",
                            title: "WebService Call Faillure",
                            message: JSON.stringify(error),
                            sticky: false
                        });
                    }
                });
            },

            getPolicyInfos: function(policyName) {
                Connector3DSpace.call3DSpace({
                    url: "/UM5Tools/Policy/" + policyName + "/infos",
                    method: "POST",
                    type: "json",
                    forceReload: true,
                    data: {},
                    onComplete: function(dataResp) {
                        if (dataResp.msg === "OK") {
                            myWidget.displayPolicy(policyName, dataResp.data);
                        } else {
                            console.error("Error in WebService Response : " + JSON.stringify(dataResp));
                            SemanticUIMessage.addNotif({
                                level: "error",
                                title: "Error in WebService Response :",
                                message: JSON.stringify(dataResp),
                                sticky: false
                            });
                        }
                    },
                    onFailure: function(error) {
                        console.error("WebService Call Faillure : " + JSON.stringify(error));
                        SemanticUIMessage.addNotif({
                            level: "error",
                            title: "WebService Call Faillure",
                            message: JSON.stringify(error),
                            sticky: false
                        });
                    }
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
