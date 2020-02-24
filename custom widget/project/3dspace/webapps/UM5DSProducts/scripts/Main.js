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

            currentTablePage: 0,

            defaultAppPattern: "*",

            //Render Functions
            displayData: function(arrData) {
                var nbObjs = arrData.length;
                $("#nbObjects").html(nbObjs + " product" + (nbObjs > 1 ? "s" : ""));

                var defaultCellDisplay = function(rowObject, columnDef) {
                    var keyObj = columnDef.enoSelect;
                    var valDisp = rowObject[keyObj] ? rowObject[keyObj] : "";
                    return valDisp;
                };
                var firstCellDisplay = function(rowObject, columnDef) {
                    var valDisp = defaultCellDisplay(rowObject, columnDef);

                    var level = rowObject.level;
                    var arrPath = [];

                    var objForPath = rowObject;
                    while (objForPath) {
                        var idForPath = objForPath["name"];
                        arrPath.splice(0, 0, idForPath);
                        objForPath = objForPath.parentRow;
                    }

                    var newValDisp = level > 0 ? "<div class='lvlSpacer' style='margin-left:" + (6 * level + 12 * (level - 1)) + "px;'></div>" : "";
                    newValDisp +=
                        "<div class='expandRow " +
                        (rowObject.expanded ? "expanded" : "collapsed") +
                        "' title='" +
                        (rowObject.expanded ? "Click to collapse" : "Click to expand") +
                        "' o='" +
                        rowObject.name +
                        "' p='" +
                        arrPath.join("/") +
                        "'><i class='" +
                        (rowObject.expanded ? "minus" : "plus") +
                        " icon small'></i></div>";

                    // (rowObject.expanded ? "minus icon" + (rowObject.expandPartial ? " circle thin icon" : "") : "plus icon") +
                    var dispArrows = widget.getValue("dispArrows");
                    if (dispArrows && dispArrows === "true") {
                        var relType = rowObject.relType || "";
                        if (relType !== "") {
                            var tooltip = "";
                            if (relType === "includedin") {
                                tooltip = rowObject.parentRow.name + " is included in " + rowObject.name;
                            } else if (relType === "derivative") {
                                tooltip = rowObject.parentRow.name + " includes product " + rowObject.name;
                            } else if (relType === "dependency") {
                                tooltip = rowObject.parentRow.name + " requires to have " + rowObject.name;
                            }
                            newValDisp += "<div class='arrow " + relType + "' title='" + tooltip + " (" + relType + ")'></div>";
                        }
                    }
                    newValDisp += "<div style='display:inline-block;white-space:nowrap;'>" + valDisp + "</div>";
                    return "<div style='white-space: nowrap;'>" + newValDisp + "</div>";
                };
                var booleanCellDisplay = function(rowObject, columnDef) {
                    var keyObj = columnDef.enoSelect;
                    var valDisp = rowObject[keyObj] ? rowObject[keyObj] : "";
                    if (valDisp === "TRUE") {
                        valDisp = "<i class='large green checkmark icon' title='" + columnDef.header + " " + valDisp + "'></i>";
                    } else if (valDisp === "FALSE") {
                        valDisp = "<i class='medium red close icon' title='" + columnDef.header + " " + valDisp + "'></i>";
                    }
                    return valDisp;
                };

                var appIconCellDisplay = function(rowObject, columnDef) {
                    var keyObj = columnDef.enoSelect;
                    var valDisp = rowObject[keyObj] ? rowObject[keyObj] : "";
                    if (valDisp !== "") {
                        if (rowObject.name.indexOf("_AP") !== -1) {
                            valDisp = "<img style='max-height:38px;' src='" + Connector3DSpace._Url3DSpace + valDisp + "'/>";
                        } else {
                            valDisp = "<img style='max-height:38px;' src='" + valDisp + "'/>";
                        }
                    }
                    return valDisp;
                };

                var columnsDef = [
                    {
                        header: "Name",
                        cell: firstCellDisplay,
                        enoSelect: "name"
                    },
                    {
                        header: "Title",
                        cell: defaultCellDisplay,
                        enoSelect: "title"
                    },
                    {
                        header: "App Type",
                        cell: defaultCellDisplay,
                        enoSelect: "appType"
                    },
                    {
                        header: "Description",
                        cell: defaultCellDisplay,
                        enoSelect: "description"
                    },
                    {
                        header: "icon",
                        cell: appIconCellDisplay,
                        enoSelect: "appIcon"
                    },
                    {
                        header: "App",
                        cell: booleanCellDisplay,
                        enoSelect: "app"
                    },
                    {
                        header: "Role",
                        cell: booleanCellDisplay,
                        enoSelect: "userexperience"
                    }
                ];

                var bExtendedView = widget.getValue("extendedView") === "true";
                if (bExtendedView) {
                    columnsDef.push({
                        header: "webclient",
                        cell: booleanCellDisplay,
                        enoSelect: "webclient"
                    });
                    columnsDef.push({
                        header: "richclient",
                        cell: booleanCellDisplay,
                        enoSelect: "richclient"
                    });
                    columnsDef.push({
                        header: "technical",
                        cell: booleanCellDisplay,
                        enoSelect: "technical"
                    });
                    columnsDef.push({
                        header: "dynamic",
                        cell: booleanCellDisplay,
                        enoSelect: "dynamic"
                    });
                }

                //Create the table Object
                var tableUI = new SemanticUITable({
                    id: "um5AdvTable",
                    config: {
                        columns: columnsDef /* ,
                        rowsFunction: rowsFunction,
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

                if (myWidget.currentTablePage > 0) {
                    var $divPrevPage = $("<div id='prevPage'>&lt;&lt; Previous Page</div>");
                    $divPrevPage.click(function() {
                        myWidget.currentTablePage--;
                        myWidget.displayData(arrData);
                    });
                    $divTable.append($divPrevPage);
                }

                var arrDisp = arrData.slice(myWidget.currentTablePage * 25, (myWidget.currentTablePage + 1) * 25);
                tableUI.addRows(arrDisp);

                tableUI.injectIn($divTable.get(0));

                if ((myWidget.currentTablePage + 1) * 25 < arrData.length) {
                    var $divNextPage = $("<div id='nextPage'>Next Page &gt;&gt;</div>");
                    $divNextPage.click(function() {
                        myWidget.currentTablePage++;
                        $divTable.get(0).scrollTop = 0;
                        myWidget.displayData(arrData);
                    });
                    $divTable.append($divNextPage);
                }

                //Set Scroll Position back
                try {
                    $divTable.get(0).scrollLeft = scrollX;
                    $divTable.get(0).scrollTop = scrollY;
                } catch (error) {
                    console.warn("Issue will trying to set back position of Scroll");
                }

                myWidget.setExpandButtons();
            },

            displayTopbar: function() {
                var $divTopbar = $("#divTopbar");
                $divTopbar.empty();

                var $inText = $(
                    "<div class='ui labeled input'><div class='ui label'>Product Name</div><input id='appPattern' type='text' value='" +
                        myWidget.defaultAppPattern +
                        "'/></div>"
                );
                $divTopbar.append($inText);

                var $btnRefresh = $("<button id='refreshBtn' class='ui primary button'>Refresh</button>");
                $btnRefresh.click(function(ev) {
                    var appPattern = $("#appPattern").val();
                    myWidget.getProducts(appPattern);
                });
                $divTopbar.append($btnRefresh);

                //Bind Enter Key to Refresh button
                $inText.keyup(function(event) {
                    if (event.keyCode === 13) {
                        $("#refreshBtn").click();
                    }
                });

                var $inTextRefine = $(
                    "<div class='ui labeled input'><div class='ui label'>Look for</div><input id='refinePattern' type='text' value='*'/></div>"
                );
                $divTopbar.append($inTextRefine);

                var $btnRefine = $("<button id='refineBtn' class='ui primary button'>Refine</button>");
                $btnRefine.click(function(ev) {
                    var refinePattern = $("#refinePattern").val();
                    myWidget.currentTablePage = 0;
                    myWidget.refine(refinePattern);
                });
                $divTopbar.append($btnRefine);

                //Bind Enter Key to Refine button
                $inTextRefine.keyup(function(event) {
                    if (event.keyCode === 13) {
                        $("#refineBtn").click();
                    }
                });

                //<div class="ui blue ribbon label"> <i class="spoon icon"></i> Food </div>
                $divTopbar.append("<div id='nbObjects' class='ui blue right basic label'>?? products</div>");
            },

            setExpandButtons: function() {
                //var elemsDnD=widget.getElementsByClassName("DnD");
                $(".expandRow").each(function() {
                    var elem = this;
                    $(elem).on("click", function(event) {
                        event.stopPropagation();
                        event.preventDefault();

                        var targetElem = event.target;
                        if (targetElem.tagName === "I") {
                            targetElem = targetElem.parentNode;
                        }
                        var appName = targetElem.getAttribute("o");
                        var strPath = targetElem.getAttribute("p");

                        var $target = $(targetElem);

                        if ($target.hasClass("collapsed") || ($target.hasClass("expanded") && $target.hasClass("partial"))) {
                            //Do expand
                            $target.addClass("loading");
                            myWidget.expandObject(appName, strPath);
                        } else {
                            //Do collapse
                            var findRecurs = function(pathObjId, arrSearchIn, searchPath) {
                                for (var i = 0; i < arrSearchIn.length; i++) {
                                    var objTest = arrSearchIn[i];
                                    var idRelOrObj = objTest["name"];
                                    var currentPath = searchPath + (searchPath !== "" ? "/" : "") + idRelOrObj;
                                    if (currentPath === pathObjId) {
                                        objTest.expanded = false;
                                        objTest.childs = []; //Clear Childs objects
                                    } else {
                                        if (objTest.childs && pathObjId.indexOf(currentPath) === 0) {
                                            //Keep going down the right path
                                            findRecurs(pathObjId, objTest.childs, currentPath);
                                        }
                                    }
                                }
                            };
                            findRecurs(strPath, myWidget.dataFull, "");

                            var refinePattern = $("#refinePattern").val();
                            myWidget.refine(refinePattern);
                        }
                    });
                });
            },

            refine: function(refinePattern) {
                var arrResult = [];

                var searchKeys = ["title", "description", "name"];
                refinePattern = refinePattern.replace(/([[\]|{}:<>$^+?])/g, /\\$1/); //Escape []|{}:<>$^+?

                var regExpPattern = "^" + refinePattern.replace(/\*/g, "[\\w\\s0-9\\-\\(\\)]*") + "$"; //Search with * to RegExp "*" can be any letter or number or "_" or "-" or "(" or ")"
                var regExp = new RegExp(regExpPattern, "i"); //case insensitive

                for (var i = 0; i < myWidget.dataFull.length; i++) {
                    var objData = myWidget.dataFull[i];
                    for (var j = 0; j < searchKeys.length; j++) {
                        var searchKey = searchKeys[j];
                        if (objData[searchKey] && regExp.test(objData[searchKey])) {
                            arrResult.push(objData);
                            break;
                        }
                    }
                }
                myWidget.displayData(arrResult);
            },

            // Widget Events
            onLoadWidget: function() {
                var wdgUrl = widget.getUrl();
                wdgUrl = wdgUrl.substring(0, wdgUrl.lastIndexOf("/"));

                widget.setIcon(wdgUrl + "/../UM5Modules/assets/icons/custom-widget-icon.png");

                var $wdgBody = $(widget.body);
                $wdgBody.html(
                    "<div id='divTopbar' style='height:3em;overflow:none;'></div><div id='divTable' style='height:calc(100% - 3em);overflow:auto;'></div>"
                );

                myWidget.displayTopbar();

                //Init Notification UI
                SemanticUIMessage.initContainer({ parent: widget.body });

                myWidget.getProducts(myWidget.defaultAppPattern);
            },

            //Call functions
            getProducts: function(appPattern) {
                if (!appPattern || appPattern === "") {
                    appPattern = "*";
                }
                Connector3DSpace.call3DSpace({
                    url: "/UM5Tools/DSProducts/list",
                    method: "POST",
                    type: "json",
                    forceReload: false,
                    data: {
                        appPattern: appPattern,
                        where: ""
                    },
                    onComplete: function(dataResp) {
                        if (dataResp.msg === "OK") {
                            myWidget.dataFull = dataResp.data;
                            //refine
                            var refinePattern = $("#refinePattern").val();

                            myWidget.currentTablePage = 0;
                            myWidget.refine(refinePattern);
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
            expandObject: function(appName, strPath) {
                Connector3DSpace.call3DSpace({
                    url: "/UM5Tools/DSProducts/" + appName + "/derivative",
                    method: "POST",
                    type: "json",
                    forceReload: false,
                    data: {},
                    onComplete: function(dataResp) {
                        if (dataResp.msg === "OK") {
                            var arrData = dataResp.data;

                            for (var i = 0; i < arrData.length; i++) {
                                var objApp = arrData[i];
                                objApp.relType = "derivative";
                            }

                            var findRecurs = function(pathObjId, arrSearchIn, searchPath) {
                                for (var i = 0; i < arrSearchIn.length; i++) {
                                    var objTest = arrSearchIn[i];
                                    var idRelOrObj = objTest["name"];
                                    var currentPath = searchPath + (searchPath !== "" ? "/" : "") + idRelOrObj;
                                    if (currentPath === pathObjId) {
                                        var arrChilds = objTest.childs || [];
                                        for (var j = 0; j < arrData.length; j++) {
                                            var newChild = arrData[j];
                                            //Check if already There
                                            var doExist = false;
                                            for (var k = 0; k < arrChilds.length; k++) {
                                                var existingChild = arrChilds[k];
                                                if (existingChild.name === newChild.name && existingChild.relType === newChild.relType) {
                                                    arrChilds[k] = newChild;
                                                    doExist = true;
                                                }
                                            }
                                            if (!doExist) {
                                                arrChilds.push(newChild);
                                            }
                                        }
                                        objTest.childs = arrChilds;
                                        objTest.expanded = true;
                                        objTest.expandPartial = false;
                                    } else {
                                        if (objTest.childs && pathObjId.indexOf(currentPath) === 0) {
                                            //Keep going down the right path
                                            findRecurs(pathObjId, objTest.childs, currentPath);
                                        }
                                    }
                                }
                            };

                            findRecurs(strPath, myWidget.dataFull, "");

                            var refinePattern = $("#refinePattern").val();
                            myWidget.refine(refinePattern);
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

                Connector3DSpace.call3DSpace({
                    url: "/UM5Tools/DSProducts/" + appName + "/includedin",
                    method: "POST",
                    type: "json",
                    forceReload: false,
                    data: {},
                    onComplete: function(dataResp) {
                        if (dataResp.msg === "OK") {
                            var arrData = dataResp.data;

                            for (var i = 0; i < arrData.length; i++) {
                                var objApp = arrData[i];
                                objApp.relType = "includedin";
                            }

                            var findRecurs = function(pathObjId, arrSearchIn, searchPath) {
                                for (var i = 0; i < arrSearchIn.length; i++) {
                                    var objTest = arrSearchIn[i];
                                    var idRelOrObj = objTest["name"];
                                    var currentPath = searchPath + (searchPath !== "" ? "/" : "") + idRelOrObj;
                                    if (currentPath === pathObjId) {
                                        var arrChilds = objTest.childs || [];
                                        for (var j = 0; j < arrData.length; j++) {
                                            var newChild = arrData[j];
                                            //Check if already There
                                            var doExist = false;
                                            for (var k = 0; k < arrChilds.length; k++) {
                                                var existingChild = arrChilds[k];
                                                if (existingChild.name === newChild.name && existingChild.relType === newChild.relType) {
                                                    arrChilds[k] = newChild;
                                                    doExist = true;
                                                }
                                            }
                                            if (!doExist) {
                                                arrChilds.push(newChild);
                                            }
                                        }
                                        objTest.childs = arrChilds;
                                        objTest.expanded = true;
                                        objTest.expandPartial = false;
                                    } else {
                                        if (objTest.childs && pathObjId.indexOf(currentPath) === 0) {
                                            //Keep going down the right path
                                            findRecurs(pathObjId, objTest.childs, currentPath);
                                        }
                                    }
                                }
                            };

                            findRecurs(strPath, myWidget.dataFull, "");

                            var refinePattern = $("#refinePattern").val();
                            myWidget.refine(refinePattern);
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

                Connector3DSpace.call3DSpace({
                    url: "/UM5Tools/DSProducts/" + appName + "/dependency",
                    method: "POST",
                    type: "json",
                    forceReload: false,
                    data: {},
                    onComplete: function(dataResp) {
                        if (dataResp.msg === "OK") {
                            var arrData = dataResp.data;

                            for (var i = 0; i < arrData.length; i++) {
                                var objApp = arrData[i];
                                objApp.relType = "dependency";
                            }

                            var findRecurs = function(pathObjId, arrSearchIn, searchPath) {
                                for (var i = 0; i < arrSearchIn.length; i++) {
                                    var objTest = arrSearchIn[i];
                                    var idRelOrObj = objTest["name"];
                                    var currentPath = searchPath + (searchPath !== "" ? "/" : "") + idRelOrObj;
                                    if (currentPath === pathObjId) {
                                        var arrChilds = objTest.childs || [];
                                        for (var j = 0; j < arrData.length; j++) {
                                            var newChild = arrData[j];
                                            //Check if already There
                                            var doExist = false;
                                            for (var k = 0; k < arrChilds.length; k++) {
                                                var existingChild = arrChilds[k];
                                                if (existingChild.name === newChild.name && existingChild.relType === newChild.relType) {
                                                    arrChilds[k] = newChild;
                                                    doExist = true;
                                                }
                                            }
                                            if (!doExist) {
                                                arrChilds.push(newChild);
                                            }
                                        }
                                        objTest.childs = arrChilds;
                                        objTest.expanded = true;
                                        objTest.expandPartial = false;
                                    } else {
                                        if (objTest.childs && pathObjId.indexOf(currentPath) === 0) {
                                            //Keep going down the right path
                                            findRecurs(pathObjId, objTest.childs, currentPath);
                                        }
                                    }
                                }
                            };

                            findRecurs(strPath, myWidget.dataFull, "");

                            var refinePattern = $("#refinePattern").val();
                            myWidget.refine(refinePattern);
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
    });
}
