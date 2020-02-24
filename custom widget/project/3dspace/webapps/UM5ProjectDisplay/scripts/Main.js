/*
 * BT WW Competencies Center - Fast Prototypes Team
 * @author UM5
 */

function executeWidgetCode() {
    require([
        "UWA/Drivers/jQuery",
        "UM5Modules/Connector3DSpace",
        "UM5Modules/UM5ToolsWS",
        "BTWWSemanticUI/SemanticUIMessage_ES5_UM5_v1/SemanticUIMessage",
        "DS/PlatformAPI/PlatformAPI",
        "DS/TagNavigatorProxy/TagNavigatorProxy",
        "UM5Modules/FiltersMechanisms"
    ], function($, Connector3DSpace, UM5ToolsWS, SemanticUIMessage, PlatformAPI, TagNavigatorProxy, FiltersMechanisms) {
        var myWidget = {
            typeOfRoots: "Project Space",
            objSelects:
                "name,revision,current,type,description," +
                "to[Dependency].from.id,from[Dependency].to.id," +
                "attribute[Task Estimated Start Date].generic,attribute[Task Estimated Finish Date].generic," +
                "attribute[Task Actual Start Date].generic,attribute[Task Actual Finish Date].generic," +
                "attribute[Percent Complete].value",
            relSelects: "id[connection],name[connection],attribute[Sequence Order]",
            childsRel: "Subtask",
            childsTypes: "*",

            timeOffsetMillis: new Date().getTimezoneOffset() * 60000, //If UTC+2 then = -120 minutes * 60 000 to have it in ms

            dataFull: [],
            _selectedIds: [],

            mapTypeToColor: {},
            leafTypes: [],

            displayData: function(arrData) {
                var i;
                //Update Type to Color Map
                myWidget.mapTypeToColor = {};
                var strTypeToColor = widget.getValue("typeToColor");
                var arrPairsTypesToColors = strTypeToColor.split(",");
                for (i = 0; i < arrPairsTypesToColors.length; i++) {
                    var pairTypeToColor = arrPairsTypesToColors[i];
                    var arrPairTypeToColor = pairTypeToColor.split("=");
                    if (arrPairTypeToColor.length >= 2) {
                        myWidget.mapTypeToColor[arrPairTypeToColor[0]] = arrPairTypeToColor[1];
                    }
                }
                //Update Leaf Types
                var strLeafTypes = widget.getValue("leafTypes");
                if (strLeafTypes) {
                    var arrLeafTypes = strLeafTypes.split(",");
                    myWidget.leafTypes = arrLeafTypes;
                }

                var $divContainer = $("#container");

                //Save scroll
                var scrollX = $divContainer.get(0).scrollLeft;
                var scrollY = widget.body.scrollTop;

                $divContainer.empty();
                $divContainer.css("overflow-x", "auto");
                $divContainer.css("overflow-y", "hidden"); //scroll bar for widget.body

                var minTsStart = Number.MAX_SAFE_INTEGER;
                var maxTsEnd = 0;
                //$wdgBody.html(JSON.stringify(arrData));
                var objBlock;
                for (i = 0; i < arrData.length; i++) {
                    objBlock = arrData[i];
                    var tsStart = myWidget.enoDateToTs(objBlock["attribute[Task Estimated Start Date].generic"], "dayStart");
                    minTsStart = Math.min(minTsStart, tsStart);
                    var tsEnd = myWidget.enoDateToTs(objBlock["attribute[Task Estimated Finish Date].generic"], "dayEnd");
                    maxTsEnd = Math.max(maxTsEnd, tsEnd);
                }

                //Get prefered Start and End Date
                var prefStart = widget.getValue("dispStart");
                var prefEnd = widget.getValue("dispEnd");

                if (prefStart && prefStart !== "") {
                    var arrDateStart = prefStart.split("/");
                    if (arrDateStart.length === 3) {
                        //Do it
                        var tsPrefStart = Date.UTC(parseInt(arrDateStart[0]), parseInt(arrDateStart[1]) - 1, parseInt(arrDateStart[2]));
                        minTsStart = tsPrefStart;
                    } else {
                        //Display a message to indicate it's not the right format
                        SemanticUIMessage.addNotif({
                            level: "warning",
                            title: "Date format issue",
                            message: "Please check the format of the start date for the display in the widgets preferences.",
                            sticky: false
                        });
                        console.warn("Date format issue : Please check the format of the start date for the display in the widgets preferences.");
                    }
                }

                if (prefEnd && prefEnd !== "") {
                    var arrDateEnd = prefEnd.split("/");
                    if (arrDateEnd.length === 3) {
                        //Do it
                        var tsPrefEnd = Date.UTC(parseInt(arrDateEnd[0]), parseInt(arrDateEnd[1]) - 1, parseInt(arrDateEnd[2]));
                        maxTsEnd = tsPrefEnd;
                        $divContainer.css("overflow-x", "hidden");
                    } else {
                        //Display a message to indicate it's not the right format
                        SemanticUIMessage.addNotif({
                            level: "warning",
                            title: "Date format issue",
                            message: "Please check the format of the end date for the display in the widgets preferences.",
                            sticky: false
                        });
                        console.warn("Date format issue : Please check the format of the end date for the display in the widgets preferences.");
                    }
                }

                //Add Lines for the Days, or Weeks or Months depending of the time span
                var displayMode = "eachDay";
                var tsCurrentDay = minTsStart;
                var tsSpan = maxTsEnd - minTsStart;
                var OneDay = 86400000;
                var OneWeek = OneDay * 7;
                var FourWeeks = 4 * OneWeek;
                var timeSeparation = OneDay;
                var displayWidth = $divContainer.width();
                var spanSize = displayWidth / (tsSpan / OneDay);

                if (spanSize < 80) {
                    displayMode = "eachWeek";
                    timeSeparation = OneWeek;
                    //Check if wee need to go to monthly display
                    spanSize = displayWidth / (tsSpan / OneWeek);
                    if (spanSize < 75) {
                        displayMode = "eachMonth";
                        timeSeparation = FourWeeks; //Will be recalculated anyway for each Month
                    }
                }
                var dayWeekStart = 1; //Monday start the week

                //Adjustment for the offset day start / week start
                if (displayMode === "eachWeek") {
                    //Calculate the first week day and offset the minTsStart if needed
                    var dateCurrentMin = new Date(minTsStart);
                    var dayTsMin = dateCurrentMin.getUTCDay();
                    var offsetDays = dayTsMin - dayWeekStart;
                    if (offsetDays < 0) {
                        offsetDays += 7;
                    }
                    //Update the values used
                    minTsStart = minTsStart - offsetDays * OneDay;
                    tsCurrentDay = minTsStart;
                    tsSpan = maxTsEnd - minTsStart;
                }

                while (tsCurrentDay <= maxTsEnd) {
                    var dateCurrent = new Date(tsCurrentDay);

                    //Adjust timeSeparation if needed
                    if (displayMode === "eachMonth") {
                        var yearNextMonth = dateCurrent.getUTCFullYear();
                        var nextMonth = dateCurrent.getUTCMonth();
                        if (++nextMonth > 12) {
                            yearNextMonth++;
                        }
                        var tsNextMonth = Date.UTC(yearNextMonth, nextMonth, 1);
                        timeSeparation = tsNextMonth - tsCurrentDay;
                    }

                    var $divDay = $("<div class='dayLine'></div>");
                    var leftPos = (tsCurrentDay - minTsStart) * 100 / tsSpan;
                    var rightPos = (maxTsEnd - tsCurrentDay - timeSeparation) * 100 / tsSpan;
                    $divDay.css("left", leftPos + "%");
                    $divContainer.append($divDay);

                    var strDate = dateCurrent.toLocaleDateString();
                    var $divDayTxt;
                    if (displayMode === "eachDay") {
                        strDate = dateCurrent.toLocaleDateString();
                        $divDayTxt = $("<div class='dayTxt'>" + strDate + "</div>");
                    } else if (displayMode === "eachWeek") {
                        var weekInfo = myWidget.getWeekInfo(tsCurrentDay, dayWeekStart);
                        var nbWeek = weekInfo.week;
                        var year = weekInfo.year;
                        strDate = year + " W" + nbWeek;

                        var titleDate = strDate + " starting on " + dateCurrent.toLocaleDateString();
                        $divDayTxt = $("<div class='dayTxt' title='" + titleDate + "'>" + strDate + "</div>");
                    } else if (displayMode === "eachMonth") {
                        strDate = dateCurrent.getUTCFullYear() + " M" + (dateCurrent.getUTCMonth() + 1);

                        var titleDateYear = strDate + " starting on " + dateCurrent.toLocaleDateString();
                        $divDayTxt = $("<div class='dayTxt' title='" + titleDateYear + "'>" + strDate + "</div>");
                    }
                    $divDayTxt.css("left", leftPos + "%");
                    $divDayTxt.css("right", rightPos + "%");
                    $divContainer.append($divDayTxt);

                    var dayUTC = dateCurrent.getUTCDay();
                    if (displayMode === "eachDay" && (dayUTC === 0 || dayUTC === 6)) {
                        //Sunday or Saturday
                        var $divOffWork = $("<div class='dayOffWork'></div>");
                        $divOffWork.css("left", leftPos + "%");
                        $divOffWork.css("right", rightPos + "%");
                        $divContainer.append($divOffWork);
                    } else if (displayMode === "eachWeek") {
                        //Display for the 2 week-end days
                        var $divWeekEnd = $("<div class='dayOffWork'></div>");
                        var leftWeekEnd = (tsCurrentDay + 5 * OneDay - minTsStart) * 100 / tsSpan;
                        var rightWeekEnd = rightPos;
                        $divWeekEnd.css("left", leftWeekEnd + "%");
                        $divWeekEnd.css("right", rightWeekEnd + "%");
                        $divContainer.append($divWeekEnd);
                    }

                    tsCurrentDay += timeSeparation;
                }

                var now = Date.now(); //+ myWidget.timeOffsetMillis;
                if (now >= minTsStart && now <= maxTsEnd) {
                    var $divToday = $("<div class='dayLine today'></div>");
                    var leftPosToday = (now - minTsStart) * 100 / tsSpan;
                    $divToday.css("left", leftPosToday + "%");
                    $divContainer.append($divToday);
                }

                //Sort by Estimated Start Date
                arrData.sort(myWidget.sortByEstStartDate);

                //Add Projects Blocks
                for (i = 0; i < arrData.length; i++) {
                    objBlock = arrData[i];
                    var $divBlock = myWidget.genExpandableBlock(
                        objBlock,
                        myWidget.expandObject,
                        [],
                        minTsStart,
                        maxTsEnd,
                        minTsStart,
                        maxTsEnd,
                        myWidget.onSelect
                    );
                    $divContainer.append($divBlock);
                }

                //Set back scroll
                $divContainer.get(0).scrollLeft = scrollX;
                widget.body.scrollTop = scrollY;
            },

            genExpandableBlock: function(objBlock, callbackExpand, arrPathParent, tsStart, tsEnd, tsDisplayStart, tsDisplayEnd, callbackSelect) {
                var $divBlock = $("<div class='expandableBlock'></div>");

                if (objBlock.filtered) {
                    $divBlock.addClass("filtered");
                    if (myWidget.leafTypes.indexOf(objBlock.type) !== -1) {
                        $divBlock.addClass("leafType");
                    }
                }

                var attrEstStart = objBlock["attribute[Task Estimated Start Date].generic"];
                var attrEstEnd = objBlock["attribute[Task Estimated Finish Date].generic"];

                var percentComplete = parseFloat(objBlock["attribute[Percent Complete].value"]);

                var tsEstStartBlock = myWidget.enoDateToTs(attrEstStart);
                var tsEstEndBlock = myWidget.enoDateToTs(attrEstEnd);

                //Check that the block is visible at least partially
                if (tsEstStartBlock > tsDisplayEnd || tsEstEndBlock < tsDisplayStart) {
                    return "";
                }

                var totalTime = tsEnd - tsStart;
                var leftSide = (tsEstStartBlock - tsStart) * 100 / totalTime;
                var rightSide = (tsEnd - tsEstEndBlock) * 100 / totalTime;
                var widthBlock = 100 - leftSide - rightSide;

                $divBlock.css("margin-left", leftSide + "%");
                $divBlock.css("margin-right", rightSide + "%");
                $divBlock.css("width", widthBlock + "%");

                objBlock.path = arrPathParent.slice(0, arrPathParent.length);
                var idPath = objBlock["id[connection]"] || objBlock.id;
                objBlock.path.push(idPath);

                var attrActStart = objBlock["attribute[Task Actual Start Date].generic"];
                var attrActEnd = objBlock["attribute[Task Actual Finish Date].generic"];
                var tsActStartBlock = myWidget.enoDateToTs(attrActStart);
                var tsActEndBlock = myWidget.enoDateToTs(attrActEnd);

                var lateDelay = 28800000; //8 hours of delay max

                var arrClassStatus = myWidget.getStatusTask(tsEstStartBlock, tsEstEndBlock, tsActStartBlock, tsActEndBlock, percentComplete, lateDelay);

                var dateEstStart = new Date(tsEstStartBlock);
                var dateEstEnd = new Date(tsEstEndBlock);
                var strTooltip =
                    objBlock.name +
                    "\nEst.Start: " +
                    dateEstStart.toLocaleDateString() +
                    " " +
                    dateEstStart.toLocaleTimeString() +
                    "\nEst.End: " +
                    dateEstEnd.toLocaleDateString() +
                    " " +
                    dateEstEnd.toLocaleTimeString();

                if (arrClassStatus.indexOf("late") !== -1) {
                    strTooltip += "\nLate";
                } else if (arrClassStatus.indexOf("lateForStart") !== -1) {
                    strTooltip += "\nLate and not Started";
                } else if (arrClassStatus.indexOf("complete") !== -1) {
                    strTooltip += "\nCompleted";
                }

                if (tsActStartBlock > 0) {
                    var dateActStart = new Date(tsActStartBlock);
                    strTooltip += "\nAct.Start: " + dateActStart.toLocaleDateString() + " " + dateActStart.toLocaleTimeString();
                    if (tsActEndBlock > 0) {
                        var dateActEnd = new Date(tsActEndBlock);
                        strTooltip += "\nAct.End: " + dateActEnd.toLocaleDateString() + " " + dateActEnd.toLocaleTimeString();
                    }
                }

                var $divTitle = $("<div class='title' title='" + strTooltip + "'></div>");
                $divTitle.addClass(arrClassStatus.join(" "));
                $divTitle.click(function(ev) {
                    callbackSelect(objBlock, ev);
                });

                var colorForType = myWidget.mapTypeToColor[objBlock.type];
                if (colorForType) {
                    $divTitle.css("background-color", colorForType);
                }

                // Add Name with some offset if needed
                var $divDispName = $("<div class='name'>" + objBlock.name + "</div>");
                var marginLeftDisp = 0;
                if (leftSide < 0) {
                    marginLeftDisp = -1 * leftSide * 100 / widthBlock;
                    $divDispName.css("margin-left", marginLeftDisp + "%");
                } else if (tsEstStartBlock < tsDisplayStart) {
                    marginLeftDisp = (tsDisplayStart - tsEstStartBlock) * 100 / (tsEstEndBlock - tsEstStartBlock);
                    $divDispName.css("margin-left", marginLeftDisp + "%");
                }
                $divTitle.append($divDispName);

                var iconClass = "plus";
                var iconCallback = function(ev) {
                    ev.stopPropagation(); //Avoid the select when we only want to expand
                    callbackExpand(objBlock.id, objBlock.path.join("/"), ev);
                };
                if (objBlock.expanded) {
                    iconClass = "minus";
                    iconCallback = function() {
                        objBlock.expanded = false;
                        myWidget.displayData(myWidget.dataFull);
                    };
                }
                var $iExpand = $("<i class='expandIcon icon " + iconClass + "'></i>");
                $iExpand.click(iconCallback);
                $divTitle.append($iExpand);

                if (objBlock.type === "Gate") {
                    var $divGate = $("<div class='gate'></div>");
                    $divGate.addClass(arrClassStatus.join(" "));
                    $divTitle.prepend($divGate);
                }
                if (objBlock.type === "Milestone") {
                    var $divMilestone = $("<div class='milestone'></div>");
                    $divMilestone.addClass(arrClassStatus.join(" "));
                    $divTitle.prepend($divMilestone);
                }

                $divBlock.append($divTitle);

                var bDispCompletion = widget.getValue("dispCompletion") === "true";
                //Completion percentage
                if (bDispCompletion) {
                    var $divCompletion = $("<div class='completion' title='Completion=" + percentComplete + "%'></div>");
                    var $divCompletionPercent = $("<div>&nbsp;" + percentComplete + "%</div>");
                    $divCompletionPercent.css("width", percentComplete + "%");
                    $divCompletion.append($divCompletionPercent);
                    $divBlock.append($divCompletion);
                }

                var bDispActual = widget.getValue("dispActual") === "true";
                //Actual Start and End bar
                if (tsActStartBlock > 0 && bDispActual) {
                    var totalEstTimeBlock = tsEstEndBlock - tsEstStartBlock;
                    var $divActTime = $("<div class='actualTime' title='Actual Time'></div>");

                    var leftOffsetActTime = (tsActStartBlock - tsEstStartBlock) * 100 / totalEstTimeBlock;

                    var tsEndTime = tsActEndBlock;
                    if (tsEndTime <= 0) {
                        tsEndTime = Date.now();
                    }
                    var widthActTime = (tsEndTime - tsActStartBlock) * 100 / totalEstTimeBlock;
                    $divActTime.css("left", leftOffsetActTime + "%");
                    $divActTime.css("width", widthActTime + "%");

                    if (leftOffsetActTime > 100) {
                        var $divDashedLine = $("<div class='dashedLine'></div>");
                        $divDashedLine.css("left", "100%");
                        $divDashedLine.css("width", leftOffsetActTime - 100 + "%");
                        $divBlock.append($divDashedLine);
                    } else {
                        var calcRight = leftOffsetActTime + widthActTime;
                        if (tsActStartBlock < tsEstStartBlock && calcRight < 0) {
                            var $divDashedLineRight = $("<div class='dashedLine'></div>");
                            $divDashedLineRight.css("left", calcRight + "%");
                            $divDashedLineRight.css("width", -1 * calcRight + "%");
                            $divBlock.append($divDashedLineRight);
                        }
                    }

                    $divBlock.append($divActTime);
                }

                var $divContentChilds = $("<div class='contentChilds'></div>");

                var arrChilds = objBlock.childs;
                if (arrChilds && objBlock.expanded) {
                    var bSortbyEstStart = widget.getValue("sortByStartDate") === "true";

                    if (bSortbyEstStart) {
                        arrChilds.sort(myWidget.sortByEstStartDate);
                    } else {
                        arrChilds.sort(function(a, b) {
                            var aSeq = parseInt(a["attribute[Sequence Order]"]);
                            var bSeq = parseInt(b["attribute[Sequence Order]"]);
                            return aSeq < bSeq ? -1 : aSeq > bSeq ? 1 : 0;
                        });
                    }

                    for (var i = 0; i < arrChilds.length; i++) {
                        var objChild = arrChilds[i];
                        var $divChild = myWidget.genExpandableBlock(
                            objChild,
                            callbackExpand,
                            objBlock.path,
                            tsEstStartBlock,
                            tsEstEndBlock,
                            tsDisplayStart,
                            tsDisplayEnd,
                            callbackSelect
                        );
                        objChild.$div = $divChild;

                        var $divLineChild = $("<div class='lineContent'></div>");
                        $divLineChild.append($divChild);
                        $divContentChilds.append($divLineChild);
                    }
                }

                $divBlock.append($divContentChilds);

                objBlock.$divBlock = $divBlock;

                if (myWidget._selectedIds.indexOf(objBlock.id) !== -1) {
                    objBlock.selected = true;
                } else {
                    objBlock.selected = false;
                }

                if (objBlock.selected) {
                    $divBlock.addClass("selected");
                }
                return $divBlock;
            },

            enoDateToTs: function(enoDateGeneric, roundTo) {
                var tsModified = 0;
                //enoDateGeneric example of format : 2016/09/14@15:30:41:GMT
                try {
                    if (!enoDateGeneric || enoDateGeneric === "") return 0;
                    var arrDay = enoDateGeneric.split("@")[0].split("/");

                    var arrHours = enoDateGeneric.split("@")[1].split(":");

                    if (roundTo === "dayStart") {
                        tsModified = Date.UTC(parseInt(arrDay[0]), parseInt(arrDay[1]) - 1, parseInt(arrDay[2]));
                    } else if (roundTo === "dayEnd") {
                        tsModified = Date.UTC(parseInt(arrDay[0]), parseInt(arrDay[1]) - 1, parseInt(arrDay[2]), 23, 59, 59);
                    } else {
                        tsModified = Date.UTC(
                            parseInt(arrDay[0]),
                            parseInt(arrDay[1]) - 1,
                            parseInt(arrDay[2]),
                            parseInt(arrHours[0]),
                            parseInt(arrHours[1]),
                            parseInt(arrHours[2])
                        );
                    }
                } catch (err) {
                    console.error(err);
                }
                return tsModified;
            },

            sortByEstStartDate: function(objA, objB) {
                var tsEstStartA = myWidget.enoDateToTs(objA["attribute[Task Estimated Start Date].generic"]);
                var tsEstStartB = myWidget.enoDateToTs(objB["attribute[Task Estimated Start Date].generic"]);
                return tsEstStartA - tsEstStartB;
            },

            //TO Check if correct in the futur
            getWeekInfo: function(tsDay, dayWeekStart) {
                var dayNb = 0;
                var weekNb = 0;
                var year = 2042;

                var OneDay = 86400000;

                var dateHere = new Date(tsDay);
                year = dateHere.getUTCFullYear();

                //Get the number of days offset for the current year to the first week start
                var dateYear = new Date(Date.UTC(year, 0, 1));
                var daysOffset = dateYear.getUTCDay() - dayWeekStart;

                dayNb = Math.floor((tsDay - dateYear.getTime()) / OneDay);
                weekNb = Math.floor((dayNb + daysOffset) / 7) + 1;

                //console.log("getWeekInfo", { day: dayNb, week: weekNb, year: year }, "daysOffset", daysOffset);
                return { day: dayNb, week: weekNb, year: year };
            },

            getStatusTask: function(tsEstStartBlock, tsEstEndBlock, tsActStartBlock, tsActEndBlock, percentComplete, lateDelay) {
                var arrStatus = [];

                var tsNow = Date.now();

                if (percentComplete >= 100) {
                    arrStatus.push("complete");
                } else if (tsActStartBlock === 0) {
                    arrStatus.push("notStarted");
                } else {
                    arrStatus.push("started");
                }

                if (tsActStartBlock > 0 && tsActStartBlock > tsEstStartBlock + lateDelay) {
                    arrStatus.push("startedLate");
                }

                if (tsActEndBlock > 0 && tsActEndBlock > tsEstEndBlock + lateDelay) {
                    arrStatus.push("endedLate");
                }

                if (percentComplete < 100 && tsNow > tsEstEndBlock) {
                    arrStatus.push("late");
                }

                if (tsActStartBlock === 0 && tsNow > tsEstStartBlock) {
                    arrStatus.push("lateForStart");
                }

                return arrStatus;
            },

            onSelect: function(objBlock, ev) {
                //Selected Block
                var strOid = objBlock.id;
                var strPath = objBlock.path.join("/");
                var isSelected = (objBlock.selected = !objBlock.selected);

                if (isSelected) {
                    objBlock.$divBlock.addClass("selected");

                    if (myWidget._selectedIds.indexOf(strOid) === -1) {
                        myWidget._selectedIds.push(strOid);
                    }
                } else {
                    objBlock.$divBlock.removeClass("selected");

                    var idxOid = myWidget._selectedIds.indexOf(strOid);
                    if (idxOid !== -1) {
                        myWidget._selectedIds.splice(idxOid, 1);
                    }
                }

                var dataSelect = {
                    sourceDnD: "Project",
                    widgetId: widget.id,
                    objectId: strOid,
                    path: strPath,
                    isSelected: isSelected
                };
                PlatformAPI.publish("Select_Object", dataSelect);
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

                myWidget.displayData(myWidget.dataFull);
            },

            displayDayLineAt: function(xPosition) {
                var $lineMarker = $("#lineMarker");
                if ($lineMarker.length <= 0) {
                    $lineMarker = $("<div id='lineMarker' class='dayLine'></div>");
                    var $divContainer = $("#container");
                    $divContainer.append($lineMarker);
                }
                $lineMarker.css("left", xPosition + "px");
            },

            //6W Tags

            taggerProxy: null,
            tagsData: {},

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
                var filtersKeys = Object.keys(eventFilter.allfilters);

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

            onLoadWidget: function() {
                var wdgUrl = widget.getUrl();
                wdgUrl = wdgUrl.substring(0, wdgUrl.lastIndexOf("/"));

                widget.setIcon(wdgUrl + "/../UM5Modules/assets/icons/custom-widget-icon.png");

                var $wdgBody = $(widget.body);

                $wdgBody.empty();
                $wdgBody.css("overflow-x", "none");
                $wdgBody.css("overflow-y", "auto");

                var $divContainer = $("<div id='container'></div>");
                $divContainer.click(function(ev) {
                    var mouseX = ev.pageX - this.offsetLeft;
                    //var mouseY = ev.pageY - this.offsetTop;
                    myWidget.displayDayLineAt(mouseX);
                });
                $wdgBody.append($divContainer);

                myWidget._initTagger();

                //Init Notification UI
                SemanticUIMessage.initContainer({ parent: widget.body });

                PlatformAPI.subscribe("Select_Object", myWidget.selectObject);

                myWidget.loadRootData();
            },
            loadRootData: function() {
                UM5ToolsWS.find({
                    data: {
                        type: myWidget.typeOfRoots,
                        selects: myWidget.objSelects,
                        where: "name ~= `" + widget.getValue("projectName") + "`"
                    },
                    forceReload: true,
                    onOk: function(data, callbackData) {
                        var arrDataObjs = data;
                        var i, j;
                        for (i = 0; i < arrDataObjs.length; i++) {
                            var doAdd = true;
                            var inObj = arrDataObjs[i];
                            for (j = 0; j < myWidget.dataFull.length; j++) {
                                var testObj = myWidget.dataFull[j];
                                if (testObj.id === inObj.id) {
                                    //Update already loaded object
                                    for (var keyIn in inObj) {
                                        testObj[keyIn] = inObj[keyIn];
                                    }
                                    doAdd = false;
                                }
                            }
                            if (doAdd) {
                                myWidget.dataFull.push(inObj);
                            }
                        }

                        //Remove objects of dataFull that do not match the find anymore
                        var dataFullCleaned = [];
                        for (j = 0; j < myWidget.dataFull.length; j++) {
                            var testObj2 = myWidget.dataFull[j];
                            var idToCheck = testObj2.id;
                            for (i = 0; i < arrDataObjs.length; i++) {
                                var inObj2 = arrDataObjs[i];
                                if (inObj2.id === idToCheck) {
                                    dataFullCleaned.push(testObj2);
                                    break;
                                }
                            }
                        }
                        myWidget.dataFull = dataFullCleaned;

                        //Update display
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

            expandObject: function(oid, strPath) {
                UM5ToolsWS.expand({
                    data: {
                        objectId: oid,
                        expandTypes: myWidget.childsTypes,
                        expandRels: myWidget.childsRel,
                        expandLevel: "1",
                        selects: myWidget.objSelects,
                        relSelects: myWidget.relSelects
                    },
                    forceReload: true,
                    onOk: function(data, callbackData) {
                        var arrExpand = data;

                        var childsExpandTree = myWidget._expandArrayToTree(arrExpand);

                        var findRecurs = function(pathObjId, arrSearchIn, searchPath) {
                            for (var i = 0; i < arrSearchIn.length; i++) {
                                var objTest = arrSearchIn[i];
                                var idRelOrObj = objTest["id[connection]"] || objTest.id;
                                var currentPath = searchPath + (searchPath !== "" ? "/" : "") + idRelOrObj;
                                if (currentPath === pathObjId) {
                                    objTest.childs = childsExpandTree;
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
            _expandArrayToTree: function(arrExpand) {
                // Code to transform array to Tree based on level, relDirection and from.id or to.id
                // Used for multi-level expand

                var resultTree = [];

                var currentList = arrExpand;
                var previousLevelList = [];
                var currentLevelList = [];
                var nextLevelsList = [];
                var currentLevel = 1;

                var loopWithoutAction = false;
                while (currentList.length > 0 && !loopWithoutAction) {
                    loopWithoutAction = true; // Safety net to avoid being stuck in the loop in case of missing level or incorrect input data
                    currentLevelList = [];
                    for (var i = 0; i < currentList.length; i++) {
                        var objInfo = currentList[i];
                        var objLevel = parseInt(objInfo["level"]);
                        if (objLevel <= currentLevel) {
                            currentLevelList.push(objInfo);
                            if (currentLevel === 1) {
                                resultTree.push(objInfo);
                                loopWithoutAction = false;
                            } else {
                                //Push it it the right parent in previousLevelList...
                                var idFrom = objInfo["from.id"];
                                var idTo = objInfo["to.id"];
                                var relDir = objInfo["relDirection"];
                                for (var j = 0; j < previousLevelList.length; j++) {
                                    var objParentTest = previousLevelList[j];
                                    var idParentTest = objParentTest["id"];
                                    if (
                                        (relDir === "from" && idFrom === idParentTest) ||
                                        (relDir === "to" && idTo === idParentTest) ||
                                        (!relDir && idFrom === idParentTest)
                                    ) {
                                        if (typeof objParentTest.childs === "undefined") {
                                            objParentTest.childs = [];
                                        }
                                        objParentTest.childs.push(objInfo);
                                        objParentTest.expanded = true;
                                        objParentTest.expandPartial = false;
                                        loopWithoutAction = false;
                                        break;
                                    }
                                }
                            }
                        } else {
                            nextLevelsList.push(objInfo);
                        }
                    }
                    currentLevel++;
                    previousLevelList = currentLevelList;
                    currentList = nextLevelsList;
                    nextLevelsList = [];
                }

                return resultTree;
            },

            call6WTags: function(arrData) {
                var arrPids = [];

                var getPidsRecurs = function(arrDataToGoThrough) {
                    for (var i = 0; i < arrDataToGoThrough.length; i++) {
                        var obj = arrDataToGoThrough[i];
                        var pidObj = obj["physicalid"];
                        if (pidObj && pidObj !== "") {
                            arrPids.push(pidObj);
                        }
                        if (obj.childs) {
                            getPidsRecurs(obj.childs);
                        }
                    }
                };

                getPidsRecurs(arrData);

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
                        myWidget.data6WTags = dataResp;
                        myWidget.setTags(dataResp);
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
