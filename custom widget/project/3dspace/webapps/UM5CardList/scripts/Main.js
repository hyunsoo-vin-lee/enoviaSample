/**
 * BT WW Competencies Center - Fast Prototypes Team
 * @author UM5
 */

function executeWidgetCode() {
    require([
        "UWA/Drivers/jQuery",
        "DS/PlatformAPI/PlatformAPI",
        "DS/DataDragAndDrop/DataDragAndDrop",
        "UM5Modules/Connector3DSpace",
        "UM5Modules/FiltersMechanisms",
        "UM5Modules/UM5ToolsWS",
        "UM5CentralizedNLS/UM5CentralizedNLS",
        "DS/TagNavigatorProxy/TagNavigatorProxy",
        "BTWWSemanticUI/SemanticUIMessage_ES5_UM5_v1/SemanticUIMessage"
    ], function($, PlatformAPI, DataDragAndDrop, Connector3DSpace, FiltersMechanisms, UM5ToolsWS, UM5CentralizedNLS, TagNavigatorProxy, SemanticUIMessage) {
        var myWidget = {
            dataFull: [],

            _selectedIds: [],

            getFindParameters: function() {
                return {
                    type: "Issue",
                    where: "",
                    selects: myWidget.getSelects().join(",")
                };
            },

            getToolbarButtons: function() {
                return [
                    {
                        id: "createIssueBtn",
                        classCss: "",
                        label: "Create Issue",
                        events: {
                            click: myWidget.onClickCreateIssueBtn
                        }
                    },
                    {
                        id: "createMarkupsBtn",
                        classCss: "",
                        label: "Create Markup",
                        events: {
                            click: myWidget.onClickCreateMarkupsBtn
                        }
                    }
                ];
            },

            getDisplayParameters: function() {
                return [
                    {
                        type: "renderFunction",
                        select: ["attribute[Actual End Date].generic", "attribute[Estimated End Date].generic"],
                        render: function(objectRow) {
                            var valStatus = "";

                            var tsActualEnd = myWidget._getTSConversionFromDate(objectRow["attribute[Actual End Date].generic"]);
                            if (tsActualEnd === 0) {
                                //Issue not finished
                                var tsEstEnd = myWidget._getTSConversionFromDate(objectRow["attribute[Estimated End Date].generic"]);
                                var tsToday = new Date().getTime();

                                if (tsEstEnd > 0 && tsToday < tsEstEnd) {
                                    valStatus =
                                        "<div style='width: 12px;height: 12px;background-color: green;border-radius: 4px;border: 1px solid grey;' title='On time'></div>";
                                } else if (tsEstEnd > 0 && tsToday > tsEstEnd) {
                                    valStatus =
                                        "<div style='width: 12px;height: 12px;background-color: rgb(234, 56, 56);border-radius: 4px;border: 1px solid grey;' title='Late'></div>";
                                }
                            }

                            return "<div class='inlineInfo'><div class='inlineLabel'>Status:</div><div class='inlineValue'>" + valStatus + "</div></div>";
                        }
                    },
                    { type: "value", select: "revision", label: "Rev" },
                    { type: "value", select: "current", label: "State" },
                    { type: "value", select: "owner", label: "Owner" },
                    { type: "value", select: "attribute[Priority]", label: "Priority" },
                    { type: "value", select: "attribute[Escalation Required]", label: "Escalation Req." },
                    { type: "breakline" },
                    { type: "block", select: "description", label: "" },
                    { type: "separator" },
                    { type: "date", select: "attribute[Estimated Start Date].generic", label: "Est. Start" },
                    { type: "date", select: "attribute[Estimated End Date].generic", label: "Est. Finish" },
                    { type: "breakline" },
                    { type: "date", select: "attribute[Actual Start Date].generic", label: "Actual Start" },
                    { type: "date", select: "attribute[Actual End Date].generic", label: "Actual End" },
                    { type: "separator" },
                    { type: "link3DSpace", select: "from[Issue].to.name", selectId: "from[Issue].to.id", label: "Reported Against" },
                    //{type:"breakline"},
                    {
                        type: "link3DSpace",
                        select: "from[Reference Document].to.name",
                        selectId: "from[Reference Document].to.id",
                        label: "Reference Document"
                    },
                    { type: "separator" }
                ];
            },

            getSelects: function() {
                var selectsArray = ["id", "physicalid", "name", "type"];

                var arrDispInfos = myWidget.getDisplayParameters();
                for (var i = 0; i < arrDispInfos.length; i++) {
                    var dispInfos = arrDispInfos[i];
                    if (
                        dispInfos.type === "value" ||
                        dispInfos.type === "block" ||
                        dispInfos.type === "date" ||
                        dispInfos.type === "link3DSpace" ||
                        dispInfos.type === "action" ||
                        dispInfos.type === "renderFunction"
                    ) {
                        var selectInfo = dispInfos.select;
                        if (typeof selectInfo === "string") {
                            selectsArray.push(selectInfo);
                        } else if (selectInfo && selectInfo.length > 0) {
                            for (var j = 0; j < selectInfo.length; j++) {
                                selectsArray.push(selectInfo[j]);
                            }
                        }

                        if (dispInfos.type === "link3DSpace") {
                            selectsArray.push(dispInfos.selectId);
                        }
                    }
                }

                return selectsArray;
            },

            displayData: function(arrData) {
                //Sort data
                var sortByKey = function(array, key) {
                    return array.sort(function(a, b) {
                        var x = a[key];
                        var y = b[key];

                        if (typeof x == "string") {
                            x = x.toLowerCase();
                        }
                        if (typeof y == "string") {
                            y = y.toLowerCase();
                        }

                        return x < y ? -1 : x > y ? 1 : 0;
                    });
                };

                var arrSortingKeys = widget.getValue("sortKeys").split(",");
                var i;
                for (i = arrSortingKeys.length - 1; i >= 0; i--) {
                    arrData = sortByKey(arrData, arrSortingKeys[i].trim());
                }

                //Display data in Table
                var tableHTML = "";

                tableHTML = "<div class='topToolbar'>";

                var arrToolbarBtns = myWidget.getToolbarButtons();

                for (i = 0; i < arrToolbarBtns.length; i++) {
                    var btnInfo = arrToolbarBtns[i];
                    tableHTML =
                        tableHTML +
                        "<div id='" +
                        btnInfo.id +
                        "' class='toolbarButton " +
                        (btnInfo.classCss ? btnInfo.classCss : "") +
                        "'>" +
                        btnInfo.label +
                        "</div>";
                }

                tableHTML =
                    tableHTML +
                    "</div>" +
                    "<table style='width:100%;'><thead><tr style='border: none;'>" +
                    "<th style='width:48px;'></th><th></th>" +
                    "</tr></thead><tbody>";

                var arrInfosToDisp = myWidget.getDisplayParameters();

                for (i = 0; i < arrData.length; i++) {
                    var classRow = i % 2 === 0 ? "roweven" : "rowodd";
                    var objectRow = arrData[i];

                    var dataDnD = {
                        sourceDnD: "AdvTable",
                        widgetId: widget.id,
                        objectId: objectRow.id,
                        pid: objectRow.physicalid,
                        name: objectRow.name,
                        type: objectRow.type
                    };

                    var inRowHTML = "";

                    inRowHTML =
                        inRowHTML +
                        "<td class='imgTD DnD' data-dnd='" +
                        JSON.stringify(dataDnD) +
                        "'><a href='" +
                        Connector3DSpace._Url3DSpace +
                        "/common/emxNavigator.jsp?objectId=" +
                        objectRow.id +
                        "' title='Open " +
                        objectRow.name +
                        " in 3DSpace'><div class='divImageBlock'><img class='typeIcon' src='" +
                        Connector3DSpace._Url3DSpace +
                        objectRow.iconType +
                        "'/></div></a></td>";
                    inRowHTML = inRowHTML + "<td>";
                    inRowHTML = inRowHTML + "<div class='inlineInfo' style='font-size: 1.25em;'>" + objectRow["name"] + "</div>";

                    for (var j = 0; j < arrInfosToDisp.length; j++) {
                        var typeInfo = arrInfosToDisp[j].type;
                        var selectInfo = arrInfosToDisp[j].select;
                        var labelInfo = arrInfosToDisp[j].label;
                        var valDisp = objectRow[selectInfo];

                        if (typeInfo === "value") {
                            if (!valDisp) valDisp = "";
                            if (valDisp.indexOf("") !== -1) {
                                var arrValuesObj = valDisp.split("");
                                var newValDisp = "";
                                for (var k = 0; k < arrValuesObj.length; k++) {
                                    var singleValue = arrValuesObj[k];
                                    var singleValueNLS = UM5CentralizedNLS.getTranslatedValueWithSelect(selectInfo, singleValue);

                                    var addClassInCell = "";

                                    newValDisp += "<div class='inCellValue" + addClassInCell + "' rawValue='" + singleValue + "'>" + singleValueNLS + "</div>";
                                    valDisp = newValDisp;
                                }
                            } else {
                                var valueObjNls = objectRow["nls!" + selectInfo];
                                if (null !== valueObjNls && typeof valueObjNls !== "undefined" && valueObjNls !== "") {
                                    valDisp = valueObjNls;
                                }
                                valDisp = UM5CentralizedNLS.getTranslatedValueWithSelect(selectInfo, valDisp);
                            }

                            inRowHTML =
                                inRowHTML +
                                "<div class='inlineInfo'><div class='inlineLabel'>" +
                                labelInfo +
                                ":</div><div class='inlineValue'>" +
                                valDisp +
                                "</div></div>";
                        } else if (typeInfo === "separator") {
                            inRowHTML = inRowHTML + "<div class='separator'></div>";
                        } else if (typeInfo === "breakline") {
                            inRowHTML = inRowHTML + "<br>";
                        } else if (typeInfo === "date") {
                            if (!valDisp) {
                                valDisp = "-";
                            } else {
                                //Convert Date Generic to Display.
                                //var displayDate = new Date(myWidget._getTSConversionFromDate(valDisp));

                                valDisp = valDisp.split("@")[0];
                            }
                            inRowHTML =
                                inRowHTML +
                                "<div class='inlineInfo'><div class='inlineLabel'>" +
                                labelInfo +
                                ":</div><div class='inlineValue'>" +
                                valDisp +
                                "</div></div>";
                        } else if (typeInfo === "block") {
                            inRowHTML = inRowHTML + "<div class='blockInfo'>";
                            var avoidLeftMargin = true;
                            if (labelInfo && labelInfo !== "") {
                                inRowHTML = inRowHTML + "<div class='inlineLabel'>" + labelInfo + ":</div>";
                                avoidLeftMargin = true;
                            }
                            inRowHTML =
                                inRowHTML +
                                (objectRow[selectInfo]
                                    ? "<div class='inlineValue' style='" + (avoidLeftMargin ? "margin-left:0px;" : "") + "'>" + objectRow[selectInfo] + "</div>"
                                    : "") +
                                "</div>";
                        } else if (typeInfo === "renderFunction") {
                            var objDispInfos = arrInfosToDisp[j];
                            var htmlToAdd = objDispInfos.render(objectRow);
                            inRowHTML = inRowHTML + htmlToAdd;
                        } else if (typeInfo === "link3DSpace") {
                            var selectId = arrInfosToDisp[j].selectId;
                            var id4Links = objectRow[selectId];
                            if (!valDisp) valDisp = "";
                            if (valDisp.indexOf("") !== -1) {
                                var arrValuesObj2 = valDisp.split("");
                                var arrIdsObj = id4Links.split("");
                                var newValDisp2 = "";
                                for (var k2 = 0; k2 < arrValuesObj2.length; k2++) {
                                    var singleValue2 = arrValuesObj2[k2];
                                    var singleValueNLS2 = UM5CentralizedNLS.getTranslatedValueWithSelect(selectInfo, singleValue2);

                                    var oidForLink = arrIdsObj[k2];
                                    newValDisp2 =
                                        newValDisp2 +
                                        "<div class='inCellValue" +
                                        "' rawValue='" +
                                        singleValue2 +
                                        "'>" +
                                        "<a href='" +
                                        Connector3DSpace._Url3DSpace +
                                        "/common/emxNavigator.jsp?objectId=" +
                                        oidForLink +
                                        "' title='Open " +
                                        singleValueNLS2 +
                                        " in 3DSpace'>" +
                                        singleValueNLS2 +
                                        "</a></div>";
                                    valDisp = newValDisp2;
                                }
                            } else {
                                var valueObjNls2 = objectRow["nls!" + selectInfo];
                                if (null !== valueObjNls2 && typeof valueObjNls2 !== "undefined" && valueObjNls2 !== "") {
                                    valDisp = valueObjNls2;
                                }
                                valDisp = UM5CentralizedNLS.getTranslatedValueWithSelect(selectInfo, valDisp);
                                var newValDisp3 =
                                    "<a href='" +
                                    Connector3DSpace._Url3DSpace +
                                    "/common/emxNavigator.jsp?objectId=" +
                                    id4Links +
                                    "' title='Open " +
                                    valDisp +
                                    " in 3DSpace'>" +
                                    valDisp +
                                    "</a>";
                                valDisp = newValDisp3;
                            }

                            inRowHTML =
                                inRowHTML +
                                "<div class='inlineInfo'><div class='inlineLabel'>" +
                                labelInfo +
                                ":</div><div class='inlineValue'>" +
                                valDisp +
                                "</div></div>";
                        }
                    }
                    inRowHTML = inRowHTML + "</td>";

                    tableHTML = tableHTML + "<tr class='" + classRow + " selectableLine' o='" + objectRow.id + "'>";
                    tableHTML = tableHTML + inRowHTML + "</tr>";
                }

                tableHTML += "</tbody></table>";

                //Save Scroll Position
                var $divTable = $("#divTable");
                var scrollX = 0;
                var scrollY = 0;
                if ($divTable.length > 0) {
                    scrollX = $divTable.get(0).scrollLeft;
                    scrollY = $divTable.get(0).scrollTop;
                }

                //Set Content
                $divTable.html(tableHTML);

                //Set Scroll Position back
                try {
                    $divTable.get(0).scrollLeft = scrollX;
                    $divTable.get(0).scrollTop = scrollY;
                } catch (error) {
                    console.warn("Issue will trying to set back position of Scroll", error);
                }

                myWidget.setDnD();

                myWidget.setSelectableLines();

                myWidget.setToolbarButtons();
            },

            _getTSConversionFromDate: function(enoDateGeneric) {
                var tsModified = 0;
                //enoDateGeneric example of format : 2016/09/14@15:30:41:GMT
                try {
                    if (!enoDateGeneric) return 0;
                    var arrDay = enoDateGeneric.split("@")[0].split("/");

                    var arrHours = enoDateGeneric.split("@")[1].split(":");

                    tsModified = new Date(
                        parseInt(arrDay[0]),
                        parseInt(arrDay[1]) - 1,
                        parseInt(arrDay[2]),
                        parseInt(arrHours[0]),
                        parseInt(arrHours[1]),
                        parseInt(arrHours[2])
                    ).getTime();
                } catch (err) {
                    console.error(err);
                }
                return tsModified;
            },

            setDnD: function() {
                //var elemsDnD=widget.getElementsByClassName("DnD");
                $(".DnD").each(function() {
                    var elem = this;
                    var dataDnD = elem.getAttribute("data-dnd");

                    var shortdata = "";
                    if (dataDnD && dataDnD !== "") {
                        var dataJson = JSON.parse(dataDnD);
                        var data3DXContent = {
                            protocol: "3DXContent",
                            version: "1.1",
                            source: "UM5Wdg_" + dataJson.sourceDnD,
                            widgetId: dataJson.widgetId,
                            data: {
                                items: [
                                    {
                                        envId: "OnPremise",
                                        contextId: "",
                                        objectId: dataJson.pid,
                                        objectType: dataJson.type,
                                        displayName: dataJson.name,
                                        displayType: dataJson.type,
                                        serviceId: "3DSpace"
                                    }
                                ]
                            }
                        };
                        var objNames = [dataJson.name];
                        dataDnD = JSON.stringify(data3DXContent);
                        shortdata = JSON.stringify(objNames);
                    }
                    DataDragAndDrop.draggable(elem, {
                        data: dataDnD, //Will be added as text type in dataTransfer
                        start: function(elemDragged, event) {
                            event.dataTransfer.setData("text/plain", dataDnD);
                            event.dataTransfer.setData("text/searchitems", dataDnD);
                            event.dataTransfer.setData("shortdata", shortdata);
                        }
                    });
                });
            },

            setSelectableLines: function() {
                $(".selectableLine").each(function() {
                    var elem = this;

                    $(elem).click(function(event) {
                        var $elem = $(elem);
                        var isSelected = $elem.hasClass("selected");
                        var strOid = elem.getAttribute("o");

                        if (isSelected) {
                            $elem.removeClass("selected");
                            var idxOid = myWidget._selectedIds.indexOf(strOid);
                            if (idxOid !== -1) {
                                myWidget._selectedIds.splice(idxOid, 1);
                            }
                        } else {
                            $elem.addClass("selected");
                            if (myWidget._selectedIds.indexOf(strOid) === -1) {
                                myWidget._selectedIds.push(strOid);
                            }
                        }

                        var dataSelect = {
                            sourceDnD: "Table",
                            widgetId: widget.id,
                            objectId: strOid,
                            isSelected: !isSelected
                        };
                        PlatformAPI.publish("Select_Object", dataSelect);

                        //START - New Cross Filter Events
                        var sendFilterKeysPref = widget.getValue("sendFilterKeys"); //Format should be EventName1|KeySelect1,EventName2|KeySelect2,...
                        if (sendFilterKeysPref && sendFilterKeysPref !== "") {
                            var currentObject = null;
                            var arrToSearch = myWidget.dataFull;
                            var i;
                            for (i = 0; i < arrToSearch.length; i++) {
                                var objToTest = arrToSearch[i];
                                var idObj = objToTest.id;
                                if (strOid === idObj) {
                                    currentObject = objToTest;
                                    break;
                                }
                            }

                            if (currentObject) {
                                var arrEventsPairs = sendFilterKeysPref.split(",");
                                for (i = 0; i < arrEventsPairs.length; i++) {
                                    var arrPair = arrEventsPairs[i].split("|");
                                    var evName = arrPair[0];
                                    var evKey = arrPair[1];
                                    if (evName && evKey) {
                                        var objValue = currentObject[evKey];
                                        var dataFilterEvent = {
                                            eventName: evName,
                                            objectId: strOid,
                                            objValue: objValue,
                                            isSelected: !isSelected
                                        };

                                        PlatformAPI.publish("Cross_Filter", dataFilterEvent);
                                    }
                                }
                            } else {
                                console.error("Cross Filter Defined but impossible to find the selected Object.");
                            }
                        }
                        //END - New Cross Filter Events
                    });
                });
            },

            setToolbarButtons: function() {
                var arrToolbarBtns = myWidget.getToolbarButtons();
                for (var i = 0; i < arrToolbarBtns.length; i++) {
                    var btnInfos = arrToolbarBtns[i];
                    var $btn = $("#" + btnInfos.id);
                    $btn.click(btnInfos.events.click);
                }
            },

            onClickCreateIssueBtn: function(ev) {
                var $wdgBody = $(widget.body);
                myWidget.repAgainstOids = [];

                var $divCreateIssue = $("<div id='divCreateIssue'></div>");

                var $tableForm = $("<table></table>");

                var $tBodyForm = $("<tbody></tbody>");
                $tableForm.append($tBodyForm);

                //Issue Name + Autoname

                var $trName = $("<tr></tr>");
                $tBodyForm.append($trName);
                var $tdNameLabel = $("<td class='issueLabel'>Name </td>");
                $trName.append($tdNameLabel);
                var $tdNameVal = $("<td class='issueValue'></td>");
                $trName.append($tdNameVal);

                var $inAutoName = $("<input type='checkbox' id='inAutoName' name='inAutoName' checked='checked'/>");
                $inAutoName.on("change", function(ev) {
                    var isSelected = this.checked;
                    if (!isSelected) {
                        $tdNameVal.append("&nbsp;<input type='text' id='inObjName' name='inObjName' placeholder='name' value=''/>");
                    } else {
                        $("#inObjName").remove();
                    }
                });
                $tdNameVal.append("Autoname: ").append($inAutoName);

                //Issue Description

                var $trDescription = $("<tr></tr>");
                $tBodyForm.append($trDescription);
                var $tdDescriptionLabel = $("<td class='issueLabel'>Description </td>");
                $trDescription.append($tdDescriptionLabel);
                var $tdDescriptionVal = $("<td class='issueValue'></td>");
                $trDescription.append($tdDescriptionVal);

                $tdDescriptionVal.append(
                    "<textarea id='inDescription' name='inDescription' placeholder='Type the description here' rows='3' cols='50'></textarea>"
                );

                //Reported Against

                var $trRepAgainst = $("<tr></tr>");
                $tBodyForm.append($trRepAgainst);
                var $tdRepAgainstLabel = $("<td class='issueLabel'>Reported Against </td>");
                $trRepAgainst.append($tdRepAgainstLabel);
                var $tdRepAgainstVal = $("<td class='issueValue'></td>");
                $trRepAgainst.append($tdRepAgainstVal);

                var $divDrop = $("<div id='dropRepAgainst'> - Drop Items Here - </div>");
                $tdRepAgainstVal.append($divDrop);

                var htmlDropElem = $divDrop.get(0);
                DataDragAndDrop.droppable(htmlDropElem, {
                    drop: function(data) {
                        var dataDnD = JSON.parse(data);
                        var oidDropped;
                        if (widget.id !== dataDnD.widgetId && dataDnD.sourceDnD === "Table") {
                            oidDropped = dataDnD.objectId;
                            if (myWidget.repAgainstOids.indexOf(oidDropped) === -1) {
                                myWidget.repAgainstOids.push(oidDropped);
                                myWidget.loadRepAgainstItems();
                            } else {
                                alert("The Object is already added as a reported against item");
                            }
                        } else if (dataDnD.protocol === "3DXContent") {
                            try {
                                oidDropped = dataDnD.data.items[0].objectId;
                                if (myWidget.repAgainstOids.indexOf(oidDropped) === -1) {
                                    myWidget.repAgainstOids.push(oidDropped);
                                    myWidget.loadRepAgainstItems();
                                } else {
                                    alert("The Object is already added as a reported against item");
                                }
                            } catch (err) {
                                console.error(err);
                            }
                        }
                    }
                });

                //Buttons Done & Cancel

                var $bottomBar = $("<div class='botBar'></div>");
                var $btnDone = $("<div class='toolbarButton'>Done</div>");
                $bottomBar.append($btnDone);
                var $btnCancel = $("<div class='toolbarButton'>Cancel</div>");
                $bottomBar.append($btnCancel);

                $btnDone.click(function(ev) {
                    var autoName = $("#inAutoName").get(0).checked;
                    var name = "";
                    if (!autoName) {
                        name = $("#inObjName").val();
                    }
                    var description = $("#inDescription").val();

                    myWidget.createIssue({
                        autoName: autoName,
                        name: name,
                        description: description,
                        reportedAgainst: myWidget.repAgainstOids
                    });

                    $("#divCreateIssue").html("Creating Issue...");
                });
                $btnCancel.click(function(ev) {
                    $("#divCreateIssue").remove();
                });

                //Append to display
                $divCreateIssue.append($tableForm);
                $divCreateIssue.append($bottomBar);
                $wdgBody.append($divCreateIssue);
            },

            onClickCreateMarkupsBtn: function(ev) {
                var $wdgBody = $(widget.body);
                myWidget.repAgainstOids = [];

                var $divCreateIssue = $("<div id='divCreateIssue'></div>");

                var $tableForm = $("<table></table>");

                var $tBodyForm = $("<tbody></tbody>");
                $tableForm.append($tBodyForm);

                //Issue Name + Autoname

                var $trName = $("<tr></tr>");
                $tBodyForm.append($trName);
                var $tdNameLabel = $("<td class='issueLabel'>Name </td>");
                $trName.append($tdNameLabel);
                var $tdNameVal = $("<td class='issueValue'></td>");
                $trName.append($tdNameVal);

                var $inAutoName = $("<input type='checkbox' id='inAutoName' name='inAutoName' checked='checked'/>");
                $inAutoName.on("change", function(ev) {
                    var isSelected = this.checked;
                    if (!isSelected) {
                        $tdNameVal.append("&nbsp;<input type='text' id='inObjName' name='inObjName' placeholder='name' value=''/>");
                    } else {
                        $("#inObjName").remove();
                    }
                });
                $tdNameVal.append("Autoname: ").append($inAutoName);

                //Markup Type

                var $trMarkupType = $("<tr></tr>");
                $tBodyForm.append($trMarkupType);
                var $tdMarkupTypeLabel = $("<td class='issueLabel'>Markup Type </td>");
                $trMarkupType.append($tdMarkupTypeLabel);
                var $tdMarkupTypeVal = $("<td class='issueValue'></td>");
                $trMarkupType.append($tdMarkupTypeVal);

                var $inMarkupType = $(
                    "<select id='inMarkupType' name='inMarkupType'>" +
                        "<option value='1D'>1D</option>" +
                        "<option value='2D'>2D</option>" +
                        "<option value='3D' selected>3D</option>" +
                        "<option value='LaserScan'>Laser Scan</option>" +
                        "</select>"
                );

                $tdMarkupTypeVal.append($inMarkupType);

                //Issue Description

                var $trDescription = $("<tr></tr>");
                $tBodyForm.append($trDescription);
                var $tdDescriptionLabel = $("<td class='issueLabel'>Description </td>");
                $trDescription.append($tdDescriptionLabel);
                var $tdDescriptionVal = $("<td class='issueValue'></td>");
                $trDescription.append($tdDescriptionVal);

                $tdDescriptionVal.append(
                    "<textarea id='inDescription' name='inDescription' placeholder='Type the description here' rows='3' cols='50'></textarea>"
                );

                //Reported Against

                var $trRepAgainst = $("<tr></tr>");
                $tBodyForm.append($trRepAgainst);
                var $tdRepAgainstLabel = $("<td class='issueLabel'>Reported Against </td>");
                $trRepAgainst.append($tdRepAgainstLabel);
                var $tdRepAgainstVal = $("<td class='issueValue'></td>");
                $trRepAgainst.append($tdRepAgainstVal);

                var $divDrop = $("<div id='dropRepAgainst'> - Drop Items Here - </div>");
                $tdRepAgainstVal.append($divDrop);

                var htmlDropElem = $divDrop.get(0);
                DataDragAndDrop.droppable(htmlDropElem, {
                    drop: function(data) {
                        var dataDnD = JSON.parse(data);
                        var oidDropped;
                        if (widget.id !== dataDnD.widgetId && dataDnD.sourceDnD === "Table") {
                            oidDropped = dataDnD.objectId;
                            if (myWidget.repAgainstOids.indexOf(oidDropped) === -1) {
                                myWidget.repAgainstOids.push(oidDropped);
                                myWidget.loadRepAgainstItems();
                            } else {
                                alert("The Object is already added as a reported against item");
                            }
                        } else if (dataDnD.protocol === "3DXContent") {
                            try {
                                oidDropped = dataDnD.data.items[0].objectId;
                                if (myWidget.repAgainstOids.indexOf(oidDropped) === -1) {
                                    myWidget.repAgainstOids.push(oidDropped);
                                    myWidget.loadRepAgainstItems();
                                } else {
                                    alert("The Object is already added as a reported against item");
                                }
                            } catch (err) {
                                console.error(err);
                            }
                        }
                    }
                });

                //Buttons Done & Cancel

                var $bottomBar = $("<div class='botBar'></div>");
                var $btnDone = $("<div class='toolbarButton'>Done</div>");
                $bottomBar.append($btnDone);
                var $btnCancel = $("<div class='toolbarButton'>Cancel</div>");
                $bottomBar.append($btnCancel);

                $btnDone.click(function(ev) {
                    var autoName = $("#inAutoName").get(0).checked;
                    var name = "";
                    if (!autoName) {
                        name = $("#inObjName").val();
                    }
                    var description = $("#inDescription").val();

                    var markupType = $("#inMarkupType").val();

                    myWidget.createMarkups({
                        autoName: autoName,
                        name: name,
                        description: description,
                        markupType: markupType,
                        reportedAgainst: myWidget.repAgainstOids
                    });

                    $("#divCreateIssue").html("Creating Markup...");
                });
                $btnCancel.click(function(ev) {
                    $("#divCreateIssue").remove();
                });

                //Append to display
                $divCreateIssue.append($tableForm);
                $divCreateIssue.append($bottomBar);
                $wdgBody.append($divCreateIssue);
            },

            loadRepAgainstItems: function() {
                //myWidget.repAgainstOids
                if (!myWidget.repAgainstOids) return;

                UM5ToolsWS.objInfo({
                    data: {
                        action: "getInfos",
                        objectIds: myWidget.repAgainstOids.join(","),
                        selects: "name,type,id,physicalid"
                    },
                    onOk: function(data, callbackData) {
                        var arrDataObjs = data;

                        var $divRepAgainst = $("#dropRepAgainst");

                        $divRepAgainst.html(""); //Clear

                        for (var i = 0; i < arrDataObjs.length; i++) {
                            var objDropped = arrDataObjs[i];

                            if (myWidget.repAgainstOids.indexOf(objDropped.id) !== -1) {
                                //It's the id that is saved replace it by physicalid
                                var idx = myWidget.repAgainstOids.indexOf(objDropped.id);
                                myWidget.repAgainstOids.splice(idx, 1, objDropped.physicalid);
                            }

                            var valDisp = objDropped.name;
                            var $divObj = $(
                                "<div><a href='" +
                                    Connector3DSpace._Url3DSpace +
                                    "/common/emxNavigator.jsp?objectId=" +
                                    objDropped.physicalid +
                                    "' title='Open " +
                                    valDisp +
                                    " in 3DSpace'><img class='typeIcon' src='" +
                                    Connector3DSpace._Url3DSpace +
                                    objDropped.iconType +
                                    "'/>&nbsp;" +
                                    valDisp +
                                    "</a></div>"
                            );
                            var $divRemove = $("<div class='removeRepAgainst' data-pid='" + objDropped.physicalid + "'></div>");
                            $divRemove.click(function(ev) {
                                var pidToRemove = $(this).attr("data-pid");
                                var idxToRemove = myWidget.repAgainstOids.indexOf(pidToRemove);
                                if (idxToRemove !== -1) {
                                    myWidget.repAgainstOids.splice(idxToRemove, 1);
                                    myWidget.loadRepAgainstItems();
                                }
                            });
                            $divObj.append($divRemove);
                            $divRepAgainst.append($divObj);
                        }
                    },
                    onError: function(errorType, errorMsg) {
                        console.error(errorType + errorMsg);
                        SemanticUIMessage.addNotif({
                            level: "error",
                            title: errorType,
                            message: errorMsg,
                            sticky: false
                        });
                    }
                });
            },

            createIssue: function(options) {
                Connector3DSpace.call3DSpace({
                    url: "/UM5IssueModeler/UM5IssueServices/create",
                    method: "POST",
                    type: "json",
                    data: {
                        autoName: options.autoName,
                        name: options.name,
                        description: options.description,
                        reportedAgainst: options.reportedAgainst.join(",")
                    },
                    onComplete: function(dataResp) {
                        //console.log("Call Data On Complete");
                        if (dataResp.msg === "OK") {
                            //var infoIssue = dataResp.data;

                            $("#divCreateIssue").append("<br>Issue Created OK / KO");
                            myWidget.onLoadWidget(); //Refresh the Issue List once Issue is correctly created
                        } else {
                            console.error("Error in WebService Response : " + JSON.stringify(dataResp));
                            SemanticUIMessage.addNotif({
                                level: "error",
                                title: "Error in WebService Response",
                                message: JSON.stringify(dataResp),
                                sticky: false
                            });
                            $("#divCreateIssue").append("<br>Issue Created KO<br>" + JSON.stringify(dataResp));
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
                        $("#divCreateIssue").append("<br>Issue Created KO<br>Call Faillure: " + JSON.stringify(error));
                    }
                });
            },

            createMarkups: function(options) {
                Connector3DSpace.call3DSpace({
                    url: "/UM5IssueModeler/UM5MarkupsServices/create",
                    method: "POST",
                    type: "json",
                    data: {
                        autoName: options.autoName,
                        name: options.name,
                        description: options.description,
                        markupType: options.markupType,
                        reportedAgainst: options.reportedAgainst.join(",")
                    },
                    onComplete: function(dataResp) {
                        //console.log("Call Data On Complete");
                        if (dataResp.msg === "OK") {
                            //var infoIssue = dataResp.data;

                            $("#divCreateIssue").append("<br>Issue Created OK / KO");
                            myWidget.onLoadWidget(); //Refresh the Issue List once Issue is correctly created
                        } else {
                            console.error("Error in WebService Response : " + JSON.stringify(dataResp));
                            SemanticUIMessage.addNotif({
                                level: "error",
                                title: "Error in WebService Response",
                                message: JSON.stringify(dataResp),
                                sticky: false
                            });
                            $("#divCreateIssue").append("<br>Issue Created KO<br>" + JSON.stringify(dataResp));
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
                        $("#divCreateIssue").append("<br>Issue Created KO<br>Call Faillure: " + JSON.stringify(error));
                    }
                });
            },

            selectIds: function(dataSelect) {
                var wdgId = dataSelect.widgetId;
                if (widget.id === wdgId) return; //Ignore event when it's coming from the widget itself

                //console.log("selectIds...");
                var arrIds = dataSelect.ids;
                //console.log(arrIds);
                var arrToFilter;
                if (arrIds.length >= 1) {
                    arrToFilter = myWidget.dataFull;

                    FiltersMechanisms.addToFilters("id", arrIds);

                    FiltersMechanisms.filterRecursively(arrToFilter);

                    myWidget.displayData(arrToFilter);
                } else {
                    //console.log("displayData Full");
                    arrToFilter = myWidget.dataFull;

                    FiltersMechanisms.clearAllFilters(); //Clear Filters

                    FiltersMechanisms.resetFilterRecursively(arrToFilter);

                    myWidget.displayData(myWidget.dataFull);
                }
            },

            selectObject: function(dataSelect) {
                var wdgId = dataSelect.widgetId;
                if (widget.id === wdgId) return; //Ignore event when it's coming from the widget itself

                var strOid = dataSelect.objectId;
                var isSelected = dataSelect.isSelected;

                if (!isSelected) {
                    var idxOid = myWidget._selectedIds.indexOf(strOid);
                    if (idxOid !== -1) {
                        myWidget._selectedIds.splice(idxOid, 1);
                    }
                } else {
                    if (myWidget._selectedIds.indexOf(strOid) === -1) {
                        myWidget._selectedIds.push(strOid);
                    }
                }

                $(".selectableLine[o='" + strOid + "']").each(function() {
                    var elem = this;
                    if (isSelected) {
                        $(elem).addClass("selected");
                    } else {
                        $(elem).removeClass("selected");
                    }
                });
            },

            crossFilterEvents: function(dataFilterEvent) {
                /*
			var dataFilterEvent = {
				eventName : evName,
				objectId: strOid,
				objValue : objValue,
				isSelected: !isSelected
			};*/

                var receiveFilterKeysPref = widget.getValue("receiveFilterKeys");
                if (receiveFilterKeysPref && receiveFilterKeysPref !== "") {
                    var arrFilterPairs = receiveFilterKeysPref.split(",");
                    for (var i = 0; i < arrFilterPairs.length; i++) {
                        var arrPair = arrFilterPairs[i].split("|");
                        var evName = arrPair[0];
                        var evKeyForFiltering = arrPair[1];

                        if (evName === dataFilterEvent.eventName) {
                            //Same name of Event => do something, else ignore
                            if (dataFilterEvent.isSelected) {
                                //Do Filter
                                var valuesToKeep = dataFilterEvent.objValue.split("");

                                FiltersMechanisms.addToFilters(evKeyForFiltering, valuesToKeep);

                                FiltersMechanisms.filterRecursively(myWidget.dataFull);

                                myWidget.displayData(myWidget.dataFull);
                            } else {
                                //Unfilter
                                //Remove from filters
                                var valuesToRemove = dataFilterEvent.objValue.split("");
                                FiltersMechanisms.removeFromFilters(evKeyForFiltering, valuesToRemove);

                                FiltersMechanisms.filterRecursively(myWidget.dataFull);

                                myWidget.displayData(myWidget.dataFull);
                            }
                        }
                    }
                }
            },

            //6W Tags

            taggerProxy: null,
            tagsData: {
                "myTags/Name": [],
                "myTags/FullName": []
            },

            _initTagger: function() {
                if (!myWidget.taggerProxy) {
                    var options = {
                        widgetId: widget.id,
                        filteringMode: "WithFilteringServices"
                    };
                    myWidget.taggerProxy = TagNavigatorProxy.createProxy(options);
                    myWidget.taggerProxy.addEvent("onFilterSubjectsChange", myWidget.onFilterSubjectsChange);
                }
            },

            setTags: function(dataResp) {
                var tags = myWidget.tagsData; //Shortcut for script

                tags = {}; //Clear

                var tagData = dataResp.widgets[0];

                //console.log("***UM5 tagData:");
                //console.log(tagData);

                var tagsMap = {};
                var arrTagsSelect = [];
                var tagsMappingArray = tagData.widgets[0].widgets;
                var i;
                for (i = 0; i < tagsMappingArray.length; i++) {
                    var tagInfo = tagsMappingArray[i];
                    var tagName = tagInfo.name;
                    var tag6W = tagInfo.selectable.sixw;
                    tagsMap[tagName] = tag6W;
                    arrTagsSelect.push(tagName);
                }

                var allObjsTags = tagData.datarecords.datagroups;
                for (i = 0; i < allObjsTags.length; i++) {
                    var objWithTag = allObjsTags[i];
                    var tagsObj = [];
                    for (var j = 0; j < arrTagsSelect.length; j++) {
                        var tagSelect = arrTagsSelect[j];

                        if (!objWithTag.dataelements) continue;
                        var objDataElements = objWithTag.dataelements[tagSelect];
                        var valuesTag = objDataElements ? objDataElements.value : null;
                        if (!valuesTag) continue; //Go to next possible tag
                        for (var k = 0; k < valuesTag.length; k++) {
                            var singleValueTag = valuesTag[k];
                            var label = singleValueTag.actualValue;
                            var tagVal = singleValueTag.value;

                            var tag = {
                                object: tagVal,
                                dispValue: label,
                                sixw: tagsMap[tagSelect],
                                field: tagSelect
                            };
                            tagsObj.push(tag);
                        }
                    }
                    var objPidSubject = "pid://" + objWithTag["physicalId"];
                    tags[objPidSubject] = tagsObj;
                }

                myWidget.taggerProxy.setSubjectsTags(tags);
            },

            onFilterSubjectsChange: function(eventFilter) {
                //console.log("***UM5 eventFilter:");
                //console.log(eventFilter);

                var filtersKeys = Object.keys(eventFilter.allfilters);
                //console.log(filtersKeys);

                if (filtersKeys.length === 0) {
                    //Clear Tags
                    FiltersMechanisms.clearFilter("physicalid"); //Reset only the physicalid list of values
                    //FiltersMechanisms.resetFilterRecursively(myWidget.dataFull);
                    FiltersMechanisms.filterRecursively(myWidget.dataFull);
                    myWidget.displayData(myWidget.dataFull);
                    return;
                }

                var arrSubjects = eventFilter.filteredSubjectList;

                var valuesToKeep = [];

                for (var i = 0; i < arrSubjects.length; i++) {
                    var valSubject = arrSubjects[i];
                    if (valSubject.indexOf("pid://") === 0) {
                        var pid = valSubject.substring(6);
                        valuesToKeep.push(pid);
                    }
                }

                FiltersMechanisms.clearFilter("physicalid"); //Reset only the physicalid list of values

                FiltersMechanisms.addToFilters("physicalid", valuesToKeep);
                //FiltersMechanisms.resetFilterRecursively(myWidget.dataFull);
                FiltersMechanisms.filterRecursively(myWidget.dataFull);
                myWidget.displayData(myWidget.dataFull);
            },

            //Widget Events

            onLoadWidget: function() {
                var $wdgBody = $(widget.body);
                $wdgBody.html("<div id='divTable' style='height:100%;overflow:auto;'></div>");

                //Init Notification UI
                SemanticUIMessage.initContainer({ parent: widget.body });

                var wdgUrl = widget.getUrl();
                wdgUrl = wdgUrl.substring(0, wdgUrl.lastIndexOf("/"));
                widget.setIcon(wdgUrl + "/assets/icons/CardList.png");

                var wdgTitlePref = widget.getValue("wdgTitle");
                if (wdgTitlePref) {
                    widget.setTitle(wdgTitlePref);
                }

                PlatformAPI.subscribe("Select_Ids", myWidget.selectIds);
                PlatformAPI.subscribe("Select_Object", myWidget.selectObject);
                PlatformAPI.subscribe("Cross_Filter", myWidget.crossFilterEvents); //New Cross Filter

                myWidget._initTagger();

                myWidget.callData();

                myWidget.displayData(myWidget.dataFull);
            },

            onSearchWidget: function(searchQuery) {
                searchQuery = searchQuery.replace(/([[\]|{}:<>$^+?])/g, /\\$1/); //Escape []|{}:<>$^+?

                var regExpPattern = "^" + searchQuery.replace(/\*/g, "[\\w\\s0-9\\-\\(\\)]*") + "$"; //Search with * to RegExp "*" can be any letter or number or "_" or "-" or "(" or ")"
                var regExp = new RegExp(regExpPattern, "i"); //case insensitive

                FiltersMechanisms.addToFilters("search", regExp);

                FiltersMechanisms.filterRecursively(myWidget.dataFull);

                myWidget.displayData(myWidget.dataFull);
            },

            onResetSearchWidget: function() {
                //Remove search from filters
                FiltersMechanisms.removeFromFilters("search", []);
                FiltersMechanisms.filterRecursively(myWidget.dataFull);

                myWidget.displayData(myWidget.dataFull);
            },

            // Data Gathering

            callData: function() {
                var infoFind = myWidget.getFindParameters();
                UM5ToolsWS.find({
                    data: {
                        type: infoFind.type,
                        selects: infoFind.selects,
                        findProgram: widget.getValue("findProgram"),
                        findFunction: widget.getValue("findFunction"),
                        findParams: widget.getValue("findParams"),
                        where: infoFind.where
                    },
                    onOk: function(data, callbackData) {
                        myWidget.dataFull = data;
                        myWidget.displayData(myWidget.dataFull);

                        myWidget.call6WTags(myWidget.dataFull);
                    },
                    onError: function(errorType, errorMsg) {
                        console.error(errorType + errorMsg);
                        SemanticUIMessage.addNotif({
                            level: "error",
                            title: errorType,
                            message: errorMsg,
                            sticky: false
                        });
                    }
                });
            },

            call6WTags: function(arrData) {
                var arrPids = [];

                for (var i = 0; i < arrData.length; i++) {
                    var obj = arrData[i];
                    var pidObj = obj["physicalid"];
                    if (pidObj && pidObj !== "") {
                        arrPids.push(pidObj);
                    }
                }
                var strCtx = widget.getValue("ctx");
                if (typeof strCtx === "object") {
                    strCtx = strCtx.value;
                }
                Connector3DSpace.call3DSpace({
                    url:
                        "/resources/e6w/servicetagdata?tenant=OnPremise&e6w-objLimit=100&e6w-lang=en&e6w-timezone=-60&SecurityContext=ctx%3A%3A" +
                        encodeURIComponent(strCtx),
                    method: "POST",
                    type: "json",
                    data: {
                        oid_list: arrPids.join(","),
                        isPhysicalIds: "true"
                    },
                    onComplete: function(dataResp) {
                        //console.log("Call Data On Complete");
                        myWidget.data6WTags = dataResp;
                        myWidget.setTags(dataResp);
                        //console.log(myWidget.dataFull);
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
        widget.addEvent("onRefresh", myWidget.onLoadWidget);
        widget.addEvent("onSearch", myWidget.onSearchWidget);
        widget.addEvent("onResetSearch", myWidget.onResetSearchWidget);
    });
}
