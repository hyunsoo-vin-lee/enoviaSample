/*
 * BT WW Competencies Center - Fast Prototypes Team
 * @author UM5
 */

define(
    "UM5Modules/EnoTableUtils", [
        "css!UM5Modules/EnoTableUtils",
        "UM5CentralizedNLS/UM5CentralizedNLS",
        "UM5Modules/Connector3DSpace",
        "UWA/Drivers/jQuery",
        "DS/DataDragAndDrop/DataDragAndDrop"
    ],
    function (cssEnoTableUtils, UM5CentralizedNLS, Connector3DSpace, $, DataDragAndDrop) {
        var utils = {
            myWidget: null,
            defaultCellDisplay: function (rowObject, columnDef) {
                var keyObj = columnDef.enoSelect;

                var valDisp = rowObject[keyObj] ? rowObject[keyObj] : "";

                if (valDisp.indexOf("") !== -1) {
                    var arrValuesObj = valDisp.split("");
                    var newValDisp = "";
                    for (var k = 0; k < arrValuesObj.length; k++) {
                        var singleValue = arrValuesObj[k];
                        var singleValueNLS = UM5CentralizedNLS.getTranslatedValueWithSelect(keyObj, singleValue);

                        var addClassInCell = "";
                        var arrHL = utils._mapHighlights[keyObj];
                        if (arrHL && arrHL.length > 0) {
                            if (arrHL.indexOf(singleValue) !== -1) {
                                addClassInCell = " highlighted";
                                rowObject.isSomethingHighlighted = true;
                            }
                        }

                        newValDisp += "<div class='inCellValue" + addClassInCell + "' rawValue='" + singleValue + "'>" + singleValueNLS + "</div>";
                    }
                    valDisp = newValDisp;
                } else {
                    var valueObjNls = rowObject["nls!" + keyObj];
                    if (null !== valueObjNls && typeof valueObjNls !== "undefined" && valueObjNls !== "") {
                        valDisp = valueObjNls;
                    }
                    valDisp = UM5CentralizedNLS.getTranslatedValueWithSelect(keyObj, valDisp);
                }

                return valDisp;
            },
            linkCellDisplay: function (rowObject, columnDef) {
                var valDisp = utils.defaultCellDisplay(rowObject, columnDef);
                var oidForLink = rowObject[columnDef.enoSelectOid] || "";
                var newValDisp =
                    "<a href='" +
                    Connector3DSpace._Url3DSpace +
                    "/common/emxNavigator.jsp?objectId=" +
                    oidForLink +
                    "' title='Open " +
                    valDisp +
                    " in 3DSpace'>";
                newValDisp += valDisp + "</a>";
                return newValDisp;
            },
            firstColumnCellDisplay: function (rowObject, columnDef) {
                var valDisp = utils.defaultCellDisplay(rowObject, columnDef);

                var newValDisp =
                    "<div style='display:inline-block;white-space:nowrap;'><a href='" +
                    Connector3DSpace._Url3DSpace +
                    "/common/emxNavigator.jsp?objectId=" +
                    rowObject.id +
                    "' title='Open " +
                    valDisp +
                    " in 3DSpace'>";
                if (rowObject.iconType && rowObject.iconType !== "") {
                    newValDisp += "<img class='typeIcon' src='" + Connector3DSpace._Url3DSpace + rowObject.iconType + "'/>&nbsp;";
                }
                newValDisp += valDisp + "</a></div>";

                return newValDisp;
            },
            firstColumnWithExpandCellDisplay: function (rowObject, columnDef) {
                var valDisp = utils.defaultCellDisplay(rowObject, columnDef);

                var level = rowObject.level;
                var arrPath = [],
                    arrPathPID = [];

                var objForPath = rowObject;
                while (objForPath) {
                    var idForPath = objForPath["id[connection]"] || objForPath.id;
                    arrPath.splice(0, 0, idForPath);
                    var pidForPath = objForPath["physicalid[connection]"] || objForPath.physicalid;
                    arrPathPID.splice(0, 0, pidForPath);
                    objForPath = objForPath.parentRow;
                }

                var $cellDisp = $("<div style='white-space: nowrap;'></div>");

                if (level > 0) {
                    //Add Level Spacer
                    $cellDisp.append("<div class='lvlSpacer' style='margin-left:" + (6 * level + 12 * (level - 1)) + "px;'></div>");
                }

                //Add Expand Row Icon
                var $expRow = $(
                    "<div class='expandRow " +
                    (rowObject.expanded ? "expanded" + (rowObject.expandPartial ? " partial" : "") : "collapsed") +
                    "' title='" +
                    (rowObject.expanded ?
                        rowObject.expandPartial ? "Click to expand (expand partial is done, not all objects are shown)" : "Click to collapse" :
                        "Click to expand") +
                    "' o='" +
                    rowObject.id +
                    "' pid='" +
                    rowObject.physicalid +
                    "' p='" +
                    arrPath.join("/") +
                    "' pPID='" +
                    arrPathPID.join("/") +
                    "'><i class='" +
                    (rowObject.expanded ? (rowObject.expandPartial ? " circle thin" : "minus") : "plus") +
                    " icon small'></i></div>"
                );
                $expRow.click(utils.expandClick);
                $cellDisp.append($expRow);

                //Add Rel Direction Arrow Display
                var dispArrows = widget.getValue("dispArrows");
                if (dispArrows && dispArrows === "true") {
                    $cellDisp.append(
                        "<div class='arrow" +
                        (rowObject.relDirection === "to" ? "Left" : "Right") +
                        "' title='" +
                        (rowObject.relDirection === "to" ? "Parent" : "Child") +
                        " object'></div>"
                    );
                }

                var $valDiv = $("<div style='display:inline-block;white-space:nowrap;'></div>");
                var $valA = $(
                    "<a href='" +
                    Connector3DSpace._Url3DSpace +
                    "/common/emxNavigator.jsp?objectId=" +
                    rowObject.id +
                    "' title='Open " +
                    valDisp +
                    " in 3DSpace'></a>"
                );
                if (rowObject.iconType && rowObject.iconType !== "") {
                    //Add Icon Type
                    $valA.append("<img class='typeIcon' src='" + Connector3DSpace._Url3DSpace + rowObject.iconType + "'/>&nbsp;");
                }

                //Add Value
                $valA.append(valDisp);

                $valDiv.append($valA);
                $cellDisp.append($valDiv);

                return $cellDisp;
            },
            cellHtmlHighlight: function (rowObject, tdElement, columnDef) {
                var keyObj = columnDef.enoSelect;
                var arrHL = utils._mapHighlights[keyObj];
                if (arrHL && arrHL.length > 0) {
                    if (arrHL.indexOf(rowObject[keyObj]) !== -1) {
                        $(tdElement).addClass("highlighted");
                    }
                }
            },
            rowsFunction: function (rowObject, trElement) {
                var $tr = $(trElement);
                var strOid = rowObject.id;
                $tr.attr("o", strOid);
                $tr.addClass("selectableLine");
                $tr.attr("pid", rowObject.physicalid);
                if (rowObject.filtered) {
                    $tr.addClass("filtered");
                    if (utils.hideFilteredRows) {
                        $tr.addClass("filteredHidden");
                    }
                }
                if (utils.myWidget._selectedIds.indexOf(strOid) !== -1) {
                    $tr.addClass("selected");
                }

                //Calculate Path
                var arrPath = [],
                    arrPathPID = [];
                var objForPath = rowObject;
                while (objForPath) {
                    var idForPath = objForPath["id[connection]"] || objForPath.id;
                    arrPath.splice(0, 0, idForPath);
                    var pidForPath = objForPath["physicalid[connection]"] || objForPath.physicalid;
                    arrPathPID.splice(0, 0, pidForPath);
                    objForPath = objForPath.parentRow;
                }

                $tr.attr("p", arrPath.join("/"));
                $tr.attr("pPID", arrPathPID.join("/"));

                //Set DnD on the line
                var data3DXContent = {
                    protocol: "3DXContent",
                    version: "1.1",
                    source: "UM5Wdg_Table",
                    widgetId: widget.id,
                    data: {
                        items: [{
                            envId: "OnPremise",
                            contextId: "",
                            objectId: rowObject.physicalid,
                            objectType: rowObject.type,
                            displayName: rowObject.name,
                            displayType: rowObject.type,
                            serviceId: "3DSpace"
                        }]
                    }
                };
                var dataDnD = JSON.stringify(data3DXContent);

                var objNames = [rowObject.name];
                var shortdata = JSON.stringify(objNames);

                DataDragAndDrop.draggable(trElement, {
                    data: dataDnD, //Will be added as text type in dataTransfer
                    start: function (elemDragged, event) {
                        event.dataTransfer.setData("text/plain", dataDnD);
                        event.dataTransfer.setData("text/searchitems", dataDnD);
                        event.dataTransfer.setData("shortdata", shortdata);
                    }
                });
            },
            rowsFunctionV2: function (rowObject, trElement) {
                var $tr = $(trElement);
                var strOid = rowObject.id;
                $tr.attr("o", strOid);
                $tr.addClass("selectableLine");
                $tr.attr("pid", rowObject.physicalid);
                if (rowObject.filtered) {
                    $tr.addClass("filtered");
                    if (utils.hideFilteredRows) {
                        $tr.addClass("filteredHidden");
                    }
                }
                /*
                 * Managed in SemanticUITableV2
                if (utils.myWidget._selectedIds.indexOf(strOid) !== -1) {
                    $tr.addClass("selected");
                }*/

                //Calculate Path
                var arrPath = [],
                    arrPathPID = [];
                var objForPath = rowObject;
                while (objForPath) {
                    var idForPath = objForPath["id[connection]"] || objForPath.id;
                    arrPath.splice(0, 0, idForPath);
                    var pidForPath = objForPath["physicalid[connection]"] || objForPath.physicalid;
                    arrPathPID.splice(0, 0, pidForPath);
                    objForPath = objForPath.parentRow;
                }

                $tr.attr("p", arrPath.join("/"));
                $tr.attr("pPID", arrPathPID.join("/"));

                //Set DnD on the line
                var data3DXContent = {
                    protocol: "3DXContent",
                    version: "1.1",
                    source: "UM5Wdg_Table",
                    widgetId: widget.id,
                    data: {
                        items: [{
                            envId: "OnPremise",
                            contextId: "",
                            objectId: rowObject.physicalid,
                            objectType: rowObject.type,
                            displayName: rowObject.name,
                            displayType: rowObject.type,
                            serviceId: "3DSpace"
                        }]
                    }
                };
                var dataDnD = JSON.stringify(data3DXContent);

                var objNames = [rowObject.name];
                var shortdata = JSON.stringify(objNames);

                DataDragAndDrop.draggable(trElement, {
                    data: dataDnD, //Will be added as text type in dataTransfer
                    start: function (elemDragged, event) {
                        event.dataTransfer.setData("text/plain", dataDnD);
                        event.dataTransfer.setData("text/searchitems", dataDnD);
                        event.dataTransfer.setData("shortdata", shortdata);
                    }
                });
            },
            headersFunction: function (index, thElement) {
                var $th = $(thElement);
                $th.attr("col-index", index);
                $th.on("click", function (event) {
                    event.stopPropagation();
                    event.preventDefault();

                    var targetElem = this;

                    var indexColumn = targetElem.getAttribute("col-index");
                    if (typeof indexColumn !== "undefined") {
                        var i = parseInt(indexColumn);
                        if (utils._headerExtended.indexOf(i) === -1) {
                            utils._headerExtended.push(i);
                            utils.showColumnOptions(i);
                        } else {
                            utils._headerExtended.splice(utils._headerExtended.indexOf(i), 1);
                            utils.hideColumnOptions(i);
                        }
                    }
                });
                $th.append("<div id='headerOptions_" + index + "'></div>");
            },
            expandClick: function (event) {
                event.stopPropagation();
                event.preventDefault();

                var targetElem = this;

                var oid = targetElem.getAttribute("o");
                var strPath = targetElem.getAttribute("p");

                var $target = $(targetElem);

                if ($target.hasClass("collapsed") || ($target.hasClass("expanded") && $target.hasClass("partial"))) {
                    //Do expand
                    $target.addClass("loading");
                    utils.myWidget.expandObject(oid, strPath);
                } else {
                    //Do collapse
                    var findRecurs = function (pathObjId, arrSearchIn, searchPath) {
                        for (var i = 0; i < arrSearchIn.length; i++) {
                            var objTest = arrSearchIn[i];
                            var idRelOrObj = objTest["id[connection]"] || objTest.id;
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
                    findRecurs(strPath, utils.myWidget.dataFull, "");

                    utils.myWidget.displayData(utils.myWidget.dataFull);
                }
            },
            _headerExtended: [],
            _mapHighlights: {},

            showOpenedHeadersOptions: function () {
                //Display back the activated columns headers
                for (var i = 0; i < utils._headerExtended.length; i++) {
                    utils.showColumnOptions(utils._headerExtended[i]);
                }
            },

            showColumnOptions: function (iColumn) {
                //var arrColumnKeys=widget.getValue("columnKeys").split(",");
                var arrColumnKeys = [];
                try {
                    arrColumnKeys = JSON.parse("[" + widget.getValue("columnKeys") + "]");
                } catch (err) {
                    arrColumnKeys = widget.getValue("columnKeys").split(",");
                    console.error(
                        'Issue will trying to parse Columns Keys preference, the new format should be like so :\n"name","curren",...\nFallback using the old format.'
                    );
                }

                var keyColumn = arrColumnKeys[iColumn];
                if (typeof keyColumn === "object") {
                    keyColumn = keyColumn.select;
                }

                var arrValuesColumn = [];

                var getValuesRecurs = function (obj, key) {
                    var val = obj[key];
                    if (typeof val !== "undefined" && val !== null) {
                        if (val.indexOf("") !== -1) {
                            var arrValuesObj = val.split("");
                            for (var k = 0; k < arrValuesObj.length; k++) {
                                var singleValue = arrValuesObj[k];
                                if (singleValue !== null && arrValuesColumn.indexOf(singleValue) === -1) {
                                    arrValuesColumn.push(singleValue);
                                }
                            }
                        } else if (arrValuesColumn.indexOf(val) === -1) {
                            arrValuesColumn.push(val);
                        }
                    }
                    var childs = obj.childs;
                    if (childs) {
                        for (var j = 0; j < childs.length; j++) {
                            getValuesRecurs(childs[j], key);
                        }
                    }
                };
                var i;
                for (i = 0; i < utils.myWidget.dataFull.length; i++) {
                    getValuesRecurs(utils.myWidget.dataFull[i], keyColumn);
                }

                $("div#headerOptions_" + iColumn).html("");

                var $filterHtml = $(
                    "<div style='max-height: 50px;overflow-y: auto;overflow-x: hidden;color: black; background-color: white;padding: 2px;border: 2px solid lightgrey;font-size:0.75em;line-height: 1em;font-weight: normal;'></div>"
                );

                var clickOnFilterVal = function (event) {
                    var arrHL = utils._mapHighlights[keyColumn];
                    if (!arrHL) {
                        utils._mapHighlights[keyColumn] = [];
                        arrHL = utils._mapHighlights[keyColumn];
                    }
                    var filterVal = this.getAttribute("filterVal");
                    if (arrHL.indexOf(filterVal) === -1) {
                        //Add to list
                        arrHL.push(filterVal);
                    } else {
                        //Remove from list
                        arrHL.splice(arrHL.indexOf(filterVal), 1);
                    }
                    utils.myWidget.displayData(utils.myWidget.dataFull);
                };

                for (i = 0; i < arrValuesColumn.length; i++) {
                    var filterVal = arrValuesColumn[i];
                    var filterValDisp = UM5CentralizedNLS.getTranslatedValueWithSelect(keyColumn, filterVal);
                    var $filterVal = $("<div style='cursor:pointer' filterVal='" + filterVal + "'>" + filterValDisp + "</div>");
                    var arrHL = utils._mapHighlights[keyColumn];

                    $filterVal.on("click", clickOnFilterVal);

                    if (arrHL && arrHL.length > 0 && arrHL.indexOf(filterVal) !== -1) {
                        $filterVal.addClass("selectedFilter");
                        $filterHtml.prepend($filterVal);
                    } else {
                        $filterHtml.append($filterVal);
                    }
                }

                $("div#headerOptions_" + iColumn).append($filterHtml);
            },

            hideColumnOptions: function (iColumn) {
                $("div#headerOptions_" + iColumn).html("");
            }
        };
        return utils;
    }
);