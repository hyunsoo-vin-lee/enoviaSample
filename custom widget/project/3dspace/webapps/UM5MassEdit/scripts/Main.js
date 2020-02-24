/**
 * BT WW Competencies Center - Fast Prototypes Team
 * @author UM5
 */

function executeWidgetCode() {
    require([
        "UWA/Drivers/jQuery",
        "DS/PlatformAPI/PlatformAPI",
        "DS/DataDragAndDrop/DataDragAndDrop",
        "DS/TagNavigatorProxy/TagNavigatorProxy",
        "UM5Modules/Connector3DSpace",
        "UM5Modules/PreferencesSetManager",
        "UM5Modules/FiltersMechanisms",
        "UM5Modules/UM5ToolsWS",
        "UM5CentralizedNLS/UM5CentralizedNLS",
        "BTWWSemanticUI/SemanticUITable_ES5_UM5_v1/SemanticUITable",
        "BTWWSemanticUI/SemanticUIMessage_ES5_UM5_v1/SemanticUIMessage",
        "UM5Modules/EnoTableUtils"
    ], function(
        $,
        PlatformAPI,
        DataDragAndDrop,
        TagNavigatorProxy,
        Connector3DSpace,
        PreferencesSetManager,
        FiltersMechanisms,
        UM5ToolsWS,
        UM5CentralizedNLS,
        SemanticUITable,
        SemanticUIMessage,
        EnoTableUtils
    ) {
        var myWidget = {
            dataFull: [],

            _selectedIds: [],

            oidsRoots: [],

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
                //Data Sorted!

                //Define display functions
                var defaultCellDisplay = EnoTableUtils.defaultCellDisplay;

                var linkCellDisplay = EnoTableUtils.linkCellDisplay;

                var firstColumnCellDisplay = EnoTableUtils.firstColumnWithExpandCellDisplay;

                var cellHtml = EnoTableUtils.cellHtmlHighlight;

                var rowsFunction = EnoTableUtils.rowsFunction;

                var headersFunction = EnoTableUtils.headersFunction;

                var cellRemoveRoot = function(rowObject /*, columnDef*/) {
                    if (rowObject.level === 0) {
                        return (
                            "<div class='removeRoot' o='" + rowObject.id + "' pid='" + rowObject.physicalid + "' title='Remove this Object from table'></div>"
                        );
                    }
                };

                //Generate Columns Definitions for Table
                var columnsDef = [];

                var arrColumnKeys = [];
                try {
                    arrColumnKeys = JSON.parse("[" + widget.getValue("columnKeys") + "]");
                } catch (err) {
                    arrColumnKeys = widget.getValue("columnKeys").split(",");
                    console.error(
                        'Issue will trying to parse Columns Keys preference, the new format should be like so :\n"name","current",...\nFallback using the old format.'
                    );
                }
                var arrColumnHeaders = widget.getValue("columnDisp").split(",");

                for (i = 0; i < arrColumnHeaders.length; i++) {
                    var colHeader = arrColumnHeaders[i];
                    var colKey = arrColumnKeys[i];
                    var keyObj = colKey;
                    var cellFct = defaultCellDisplay;
                    var colDef = {
                        header: colHeader,
                        cell: cellFct,
                        html: cellHtml,
                        enoSelect: keyObj
                    };
                    if (typeof colKey === "object") {
                        colDef.enoSelect = colKey.select;
                        if (colKey.type === "linkOid") {
                            colDef.enoSelectOid = colKey.selectOid;
                            colDef.cell = linkCellDisplay;
                        }
                    }
                    if (i === 0) {
                        colDef.cell = firstColumnCellDisplay;
                    }
                    columnsDef.push(colDef);
                }

                //Remove Roots columns
                columnsDef.push({ header: "", cell: cellRemoveRoot, width: "12px" });

                //Create the table Object
                var tableUI = new SemanticUITable({
                    id: "um5AdvTable",
                    config: {
                        columns: columnsDef,
                        rowsFunction: rowsFunction,
                        headersFunction: headersFunction,
                        onSelectLine: myWidget.onSelectLine
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

                //Add all events
                myWidget.setDnD();
                myWidget.setRemoveButtons();

                EnoTableUtils.showOpenedHeadersOptions();

                if (FiltersMechanisms.isFilterApplied()) {
                    //Add Filter Icon
                    var $divFilter = $("<div id='divFilter'></div>");
                    $divFilter.attr("title", "Data displayed in this table is being filtered\nClick here to reset filters");
                    var $imgFilter = $("<div class='imgFilter'></div>");
                    $divFilter.append($imgFilter);
                    $("#divTable").append($divFilter);

                    $divFilter.on("click", function() {
                        PlatformAPI.publish("Select_Ids", { ids: [] });
                    });
                }
            },

            setToolbar: function() {
                var $divTopbar = $("#topbar");
                $divTopbar.empty();

                var $attrSelect = $("<select id='attrSelect' class='ui dropdown'><option value=''>Select an Attribute</option></select>");

                var arrColumnHeaders = widget.getValue("columnDisp").split(",");
                var arrColumnKeys = JSON.parse("[" + widget.getValue("columnKeys") + "]");

                //Append the editable attributes
                var arrEditableAttr = widget.getValue("editableAttrs").split(",");
                for (var i = 0; i < arrEditableAttr.length; i++) {
                    var attr = arrEditableAttr[i];
                    if (attr.indexOf("attribute[") === 0) {
                        //Add it to the select
                        var indexAttrInHeaders = arrColumnKeys.indexOf(attr);
                        if (indexAttrInHeaders !== -1) {
                            var attrHead = arrColumnHeaders[indexAttrInHeaders];
                            $attrSelect.append("<option value='" + attr + "'>" + attrHead + "</option>");
                        }
                    } //else ignore it
                }

                $divTopbar.append($attrSelect);

                $attrSelect.dropdown({
                    action: "activate",
                    onChange: function(value /*,text, $selectedItem*/) {
                        myWidget.setEditAttribute(value);
                    }
                });

                $divTopbar.append("<div id='attrEdit' class='inline'></div>");
            },

            setEditAttribute: function(attrSelected) {
                $("div#attrEdit").empty();

                var $divText = $("<div class='ui input'><input id='inAttrVal' placeholder='New Value Here' type='text'></div>");

                $("div#attrEdit").append($divText);

                var $applyBtn = $("<button class='ui primary button'>Apply to Selected</button>");
                $applyBtn.click(function() {
                    var newVal = $("input#inAttrVal").val();
                    var arrOids = [];
                    var $selectedLines = $(".selectableLine.selected");
                    $selectedLines.each(function() {
                        var $this = $(this);
                        var oid = $this.attr("o");
                        if (oid !== "") {
                            arrOids.push(oid);
                        }
                    });
                    myWidget.updateAttribute(arrOids, attrSelected, newVal);
                });

                $("div#attrEdit").append($applyBtn);
            },

            setDnD: function() {
                var $divTable = $("#divTable");
                if ($divTable.length > 0) {
                    var elemDivTable = $divTable.get(0);
                    DataDragAndDrop.droppable(elemDivTable, {
                        drop: function(data) {
                            var dataDnD = JSON.parse(data);
                            var oidDropped;
                            if (widget.id !== dataDnD.widgetId && dataDnD.sourceDnD === "Table") {
                                oidDropped = dataDnD.objectId;
                                if (myWidget.oidsRoots.indexOf(oidDropped) === -1) {
                                    myWidget.loadRootData([oidDropped]);
                                    myWidget.oidsRoots.push(oidDropped);
                                    widget.setValue("oidsLoaded", myWidget.oidsRoots.join(","));
                                } else {
                                    alert("The Object is already added as a root in this table");
                                }
                            } else if (dataDnD.protocol === "3DXContent") {
                                try {
                                    var arrOids = dataDnD.data.items;
                                    for (var i = 0; i < arrOids.length; i++) {
                                        var item = arrOids[i];
                                        oidDropped = item.objectId;
                                        if (myWidget.oidsRoots.indexOf(oidDropped) === -1) {
                                            myWidget.loadRootData([oidDropped]);
                                            myWidget.oidsRoots.push(oidDropped);
                                            widget.setValue("oidsLoaded", myWidget.oidsRoots.join(","));
                                        } else {
                                            //alert("The Object is already added as a root in this table");
                                            console.warn("The Object is already added as a root in this table");
                                        }
                                    }
                                } catch (err) {
                                    console.error(err);
                                }
                            }
                        }
                    });
                }
            },

            onSelectLine: function(ev) {
                var elem = this;
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

                var strPath = elem.getAttribute("p");

                var dataSelect = {
                    sourceDnD: "Table",
                    widgetId: widget.id,
                    objectId: strOid,
                    path: strPath,
                    isSelected: !isSelected
                };
                PlatformAPI.publish("Select_Object", dataSelect);

                PlatformAPI.publish("Select_Path", {
                    sourceDnD: "Table",
                    widgetId: widget.id,
                    path: strPath,
                    isSelected: !isSelected,
                    doExpand: false
                });

                //START - New Cross Filter Events

                var sendFilterKeysPref = widget.getValue("sendFilterKeys"); //Format should be EventName1|KeySelect1,EventName2|KeySelect2,...
                if (sendFilterKeysPref && sendFilterKeysPref !== "") {
                    var currentObject = null;
                    var arrToSearch = myWidget.dataFull;

                    var findRecurs = function(pathObjId, arrSearchIn, searchPath) {
                        for (var i = 0; i < arrSearchIn.length; i++) {
                            var objTest = arrSearchIn[i];
                            var idRelOrObj = objTest["id[connection]"] || objTest.id;
                            var currentPath = searchPath + (searchPath !== "" ? "/" : "") + idRelOrObj;
                            if (currentPath === pathObjId) {
                                currentObject = objTest;
                            } else {
                                if (objTest.childs && pathObjId.indexOf(currentPath) === 0) {
                                    //Keep going down the right path
                                    findRecurs(pathObjId, objTest.childs, currentPath);
                                }
                            }
                        }
                    };
                    findRecurs(strPath, arrToSearch, "");

                    if (currentObject) {
                        var arrEventsPairs = sendFilterKeysPref.split(",");
                        for (var i = 0; i < arrEventsPairs.length; i++) {
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
            },

            setRemoveButtons: function() {
                //var elemsDnD=widget.getElementsByClassName("DnD");
                $(".removeRoot").each(function() {
                    var elem = this;
                    $(elem).on("click", function(event) {
                        var oid = event.target.getAttribute("o");
                        myWidget.removeRootId(oid);
                        //Try also to remove it with the pid in case it was dropped from the search
                        var pid = event.target.getAttribute("pid");
                        myWidget.removeRootId(pid);
                    });
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

                if (typeof strOid === "string") {
                    $(".selectableLine[o='" + strOid + "']").each(function() {
                        var elem = this;
                        if (isSelected) {
                            $(elem).addClass("selected");
                        } else {
                            $(elem).removeClass("selected");
                        }
                    });
                } else {
                    var toggleSelectFct = function() {
                        var elem = this;
                        if (isSelectedHere) {
                            $(elem).addClass("selected");
                        } else {
                            $(elem).removeClass("selected");
                        }
                    };
                    for (var i = 0; i < strOid.length; i++) {
                        var strOidHere = strOid[i];
                        var isSelectedHere = isSelected[i];
                        $(".selectableLine[o='" + strOidHere + "']").each(toggleSelectFct);
                    }
                }
            },

            selectPath: function(dataSelect) {
                var wdgId = dataSelect.widgetId;
                if (widget.id === wdgId) return; //Ignore event when it's coming from the widget itself

                var doExpand = dataSelect.doExpand; //Do an expand Partial of only the Path(s) indicated if set to true.

                var strPath = dataSelect.path;
                var isSelected = dataSelect.isSelected;

                //Use a function in case we want to call a partial expand before selecting in view
                var doSelectInView = function(strPath, isSelected) {
                    $(".selectableLine[p='" + strPath + "']").each(function() {
                        var elem = this;
                        if (isSelected) {
                            $(elem).addClass("selected");
                        } else {
                            $(elem).removeClass("selected");
                        }
                    });
                };

                if (typeof strPath === "string") {
                    if (doExpand) {
                        myWidget.expandAlongPath(strPath, doSelectInView, [strPath, isSelected]);
                    } else {
                        doSelectInView(strPath, isSelected);
                    }
                } else {
                    for (var i = 0; i < strPath.length; i++) {
                        var strPathHere = strPath[i];
                        var isSelectedHere = isSelected[i];
                        if (doExpand) {
                            myWidget.expandAlongPath(strPath, doSelectInView, [strPathHere, isSelectedHere]);
                        } else {
                            doSelectInView(strPathHere, isSelectedHere);
                        }
                    }
                }
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

                                // Remove from filters

                                var valuesToRemove = dataFilterEvent.objValue.split("");
                                FiltersMechanisms.removeFromFilters(evKeyForFiltering, valuesToRemove);

                                FiltersMechanisms.filterRecursively(myWidget.dataFull);

                                myWidget.displayData(myWidget.dataFull);
                            }
                        }
                    }
                }
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

            removeRootId: function(oidToRemove) {
                var idxArrRoots = myWidget.oidsRoots.indexOf(oidToRemove);
                if (idxArrRoots !== -1) {
                    myWidget.oidsRoots.splice(idxArrRoots, 1);
                    widget.setValue("oidsLoaded", myWidget.oidsRoots.join(","));
                    for (var i = 0; i < myWidget.dataFull.length; i++) {
                        var objTest = myWidget.dataFull[i];
                        if (objTest.id === oidToRemove || objTest.physicalid === oidToRemove) {
                            myWidget.dataFull.splice(i, 1);
                            i--;
                        }
                    }
                }
                myWidget.displayData(myWidget.dataFull);
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

            // Widget Events

            onLoadWidget: function() {
                var $wdgBody = $(widget.body);
                $wdgBody.html("<div id='topbar' style='height: 3em;'>TopBar</div><div id='divTable' style='height:calc(100% - 3em);overflow:auto;'></div>");

                //Init Notification UI
                SemanticUIMessage.initContainer({ parent: widget.body });

                //Init EnoTableUtils
                EnoTableUtils.myWidget = myWidget;

                //Init toolbar
                myWidget.setToolbar();

                var wdgUrl = widget.getUrl();
                wdgUrl = wdgUrl.substring(0, wdgUrl.lastIndexOf("/"));
                widget.setIcon(wdgUrl + "/assets/icons/Table.png");

                var wdgTitlePref = widget.getValue("wdgTitle");
                if (wdgTitlePref) {
                    widget.setTitle(wdgTitlePref);
                }

                myWidget._initTagger();

                PlatformAPI.subscribe("Select_Ids", myWidget.selectIds);
                PlatformAPI.subscribe("Select_Object", myWidget.selectObject);
                PlatformAPI.subscribe("Select_Path", myWidget.selectPath);
                PlatformAPI.subscribe("Cross_Filter", myWidget.crossFilterEvents); //New Cross Filter

                //myWidget.displayData(myWidget.dataFull);
                myWidget._prefSetExpand = new PreferencesSetManager(widget);
                myWidget._prefSetDisplay = new PreferencesSetManager(widget);

                myWidget._prefSetExpand.setupPrefsNames("configExpand", "configNameExpand");
                myWidget._prefSetDisplay.setupPrefsNames("configDisplay", "configNameDisplay");

                myWidget._prefSetExpand.setupConfig("UM5ExpandPrefSet", [
                    { name: "configNameExpand", noSave: true },
                    "typeObjExp",
                    "whereExpObjExp",
                    "typeRel",
                    "whereExpRelExp",
                    "expandProg",
                    "expandFunc",
                    "expandParams"
                ]);
                myWidget._prefSetDisplay.setupConfig("UM5DisplayPrefSet", [
                    { name: "configNameDisplay", noSave: true },
                    "selects",
                    "selectsRel",
                    "columnKeys",
                    "columnDisp",
                    "sortKeys",
                    "searchKeys"
                ]);

                myWidget._prefSetExpand.loadPrefConfigs();
                myWidget._prefSetDisplay.loadPrefConfigs();

                var strOids = widget.getValue("oidsLoaded");
                //console.log("strOids="+strOids);
                if (strOids !== "") {
                    var arrOids = strOids.split(",");
                    myWidget.oidsRoots = arrOids;
                    myWidget.loadRootData(arrOids);
                } else {
                    myWidget.displayData(myWidget.dataFull); //Display empty table for a start
                }
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

            onConfigChange: function(namePref, valuePref) {
                //PreferencesSetManager.onConfigChange(namePref, valuePref);
                myWidget._prefSetExpand.onConfigChange(namePref, valuePref);
                myWidget._prefSetDisplay.onConfigChange(namePref, valuePref);
            },

            onPrefEnd: function() {
                myWidget._prefSetExpand.saveCustomPrefs();
                myWidget._prefSetDisplay.saveCustomPrefs();
            },

            loadRootData: function(oids) {
                if (typeof oids === "undefined") return;

                UM5ToolsWS.objInfo({
                    data: {
                        action: "getInfos",
                        objectIds: oids.join(","),
                        selects: widget.getValue("selects")
                    },
                    onOk: function(data, callbackData) {
                        var arrDataObjs = data;

                        for (var i = 0; i < arrDataObjs.length; i++) {
                            var doAdd = true;
                            var inObj = arrDataObjs[i];
                            for (var j = 0; j < myWidget.dataFull.length; j++) {
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
                                if (FiltersMechanisms.isFilterApplied()) {
                                    FiltersMechanisms.filterRecursively(myWidget.dataFull);
                                }
                            }
                        }

                        myWidget.displayData(myWidget.dataFull);
                        //console.log(myWidget.dataFull);

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
                        expandTypes: widget.getValue("typeObjExp"),
                        expandRels: widget.getValue("typeRel"),
                        expandLevel: "1",

                        selects: widget.getValue("selects"),
                        relSelects: widget.getValue("selectsRel"),

                        whereObj: widget.getValue("whereExpObjExp"),
                        whereRel: widget.getValue("whereExpRelExp"),

                        expandProgram: widget.getValue("expandProg"),
                        expandFunction: widget.getValue("expandFunc"),
                        expandParams: widget.getValue("expandParams")
                    },
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
                                    if (FiltersMechanisms.isFilterApplied()) {
                                        FiltersMechanisms.filterRecursively(objTest.childs);
                                    }
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
                        //console.log(myWidget.dataFull);

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

            expandAlongPath: function(strPath, callback, callBackData) {
                //First check in the structure to see what is already being expanded
                //If needed expand along the indicated Path only the rels not already loaded
                var arrRoots = myWidget.dataFull;
                var arrRelIdsToGet = [];

                var exploreRecurs = function(arrObjs, arrPathRels) {
                    var idFound = false;
                    var idToFind = arrPathRels[0];
                    var arrSubPath = arrPathRels.slice(1); //Copy without the first element

                    for (var i = 0; i < arrObjs.length; i++) {
                        var objTest = arrObjs[i];
                        var idObj = objTest["id[connection]"];
                        var pidObj = objTest["physicalid[connection]"];
                        if (idObj === idToFind || pidObj === idToFind) {
                            idFound = true;
                            if (objTest.childs && arrSubPath.length > 0) {
                                objTest.expanded = true;
                                return exploreRecurs(objTest.childs, arrSubPath);
                            } else if (arrSubPath.length > 0) {
                                //Rel found but no childs and the Path still have rels
                                arrRelIdsToGet = arrSubPath;
                                return true;
                            }
                            break;
                        }
                    }
                    if (!idFound) {
                        arrRelIdsToGet = arrPathRels;
                        return true;
                    } else {
                        return false;
                    }
                };

                var arrPath = strPath.split("/");
                var rootId = arrPath[0];

                var expandNeeded = false;
                for (var i = 0; i < arrRoots.length; i++) {
                    var objTest = arrRoots[i];
                    if ((objTest.id && objTest.id === rootId) || (objTest.physicalid && objTest.physicalid === rootId)) {
                        if (objTest.childs && arrPath.length > 1) {
                            expandNeeded = exploreRecurs(objTest.childs, arrPath.slice(1));
                        } else {
                            if (arrPath.length > 1) {
                                expandNeeded = true;
                                arrRelIdsToGet = arrPath.slice(1);
                            }
                        }
                        objTest.expanded = true;
                        break;
                    }
                }
                if (expandNeeded) {
                    //Do the Call
                    UM5ToolsWS.relInfo({
                        data: {
                            relIds: arrRelIdsToGet.join(","),
                            selects: widget.getValue("selectsRel")
                        },
                        callbackData: {
                            inputPath: strPath,
                            arrRelIds: arrRelIdsToGet,
                            callBackFct: callback,
                            callBackDt: callBackData
                        },
                        onOk: function(data, callbackData) {
                            var arrRelsInfos = data;

                            var inPath = callbackData.inputPath;
                            var arrRelIds = callbackData.arrRelIds;
                            var arrInPath = inPath.split("/");
                            var arrPathExisting = arrInPath.slice(0, arrInPath.length - arrRelIds.length);

                            var doWhenLoaded = function(arrRelsInfos, arrObjectsInfos, objToUpdate, callBackFct, callBackDt) {
                                var arrExpand = [];
                                //Merge Objects infos and Rels Infos
                                var idOrigin = objToUpdate.id;
                                var currentId = idOrigin;
                                var nextId = "";
                                var lastObj = null;
                                for (var i = 0; i < arrRelsInfos.length; i++) {
                                    var relInfo = arrRelsInfos[i];
                                    var idFrom = relInfo["from.id"];
                                    var idTo = relInfo["to.id"];
                                    if (currentId === idFrom) {
                                        nextId = idTo;
                                        relInfo.relDirection = "from";
                                    } else if (currentId === idTo) {
                                        nextId = idFrom;
                                        relInfo.relDirection = "to";
                                    } else {
                                        //ERROR
                                        console.error("Error will loading Partial Path");
                                        break;
                                    }
                                    for (var j = 0; j < arrObjectsInfos.length; j++) {
                                        var objInfo = arrObjectsInfos[j];
                                        if (objInfo.id === nextId) {
                                            for (var key in objInfo) {
                                                relInfo[key] = objInfo[key];
                                            }
                                            break;
                                        }
                                    }
                                    if (lastObj) {
                                        lastObj.childs = [relInfo];
                                        lastObj.expanded = true;
                                        lastObj.expandPartial = true;
                                        lastObj = relInfo;
                                    } else {
                                        arrExpand.push(relInfo);
                                        lastObj = relInfo;
                                    }
                                    currentId = nextId;
                                }

                                //Update Object
                                objToUpdate.childs = myWidget._mergeTreesChilds(objToUpdate.childs, arrExpand);
                                objToUpdate.expanded = true;
                                objToUpdate.expandPartial = true;

                                if (FiltersMechanisms.isFilterApplied()) {
                                    FiltersMechanisms.filterRecursively(objToUpdate.childs);
                                }

                                myWidget.displayData(myWidget.dataFull);

                                myWidget.call6WTags(myWidget.dataFull);

                                if (typeof callBackFct === "function") {
                                    callBackFct.apply(myWidget, callBackDt);
                                }
                            };

                            var findRecurs = function(pathObjId, arrSearchIn, searchPath) {
                                for (var i = 0; i < arrSearchIn.length; i++) {
                                    var objTest = arrSearchIn[i];
                                    var idRelOrObj = objTest["id[connection]"] || objTest.id;
                                    var pidRelOrObj = objTest["physicalid[connection]"] || objTest.physicalid;
                                    var currentPath = searchPath + (searchPath !== "" ? "/" : "") + idRelOrObj;
                                    var currentPathPID = searchPath + (searchPath !== "" ? "/" : "") + pidRelOrObj;

                                    if (currentPath === pathObjId || currentPathPID === pathObjId) {
                                        //Get also Objects infos
                                        var oids = [];
                                        for (var r = 0; r < arrRelsInfos.length; r++) {
                                            var relInfo = arrRelsInfos[r];
                                            var objFrom = relInfo["from.id"];
                                            var objTo = relInfo["to.id"];
                                            if (oids.indexOf(objFrom) === -1) oids.push(objFrom);
                                            if (oids.indexOf(objTo) === -1) oids.push(objTo);
                                        }

                                        UM5ToolsWS.objInfo({
                                            data: {
                                                action: "getInfos",
                                                objectIds: oids.join(","),
                                                selects: widget.getValue("selects")
                                            },
                                            callbackData: {
                                                inputPath: strPath,
                                                arrRelIds: arrRelIdsToGet,
                                                callBackFct: callbackData.callBackFct,
                                                callBackDt: callbackData.callBackDt,
                                                objTest: objTest,
                                                arrRelsInfos: arrRelsInfos
                                            },
                                            onOk: function(data, callbackData) {
                                                var arrObjectsInfos = data;
                                                doWhenLoaded(
                                                    callbackData.arrRelsInfos,
                                                    arrObjectsInfos,
                                                    callbackData.objTest,
                                                    callbackData.callBackFct,
                                                    callbackData.callBackDt
                                                );
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
                                    } else {
                                        if (objTest.childs && pathObjId.indexOf(currentPath) === 0) {
                                            //Keep going down the right path
                                            objTest.expanded = true;
                                            findRecurs(pathObjId, objTest.childs, currentPath);
                                        } else if (objTest.childs && pathObjId.indexOf(currentPathPID) === 0) {
                                            //Keep going down the right path
                                            objTest.expanded = true;
                                            findRecurs(pathObjId, objTest.childs, currentPathPID);
                                        }
                                    }
                                }
                            };
                            findRecurs(arrPathExisting.join("/"), myWidget.dataFull, "");
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
                } else {
                    myWidget.displayData(myWidget.dataFull);
                    if (typeof callback === "function") {
                        callback.apply(myWidget, callBackData);
                    }
                }
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
            },

            updateAttribute: function(arrOids, attrSelected, newVal) {
                Connector3DSpace.call3DSpace({
                    url: "/UM5Tools/UpdateAttributes",
                    method: "POST",
                    type: "json",
                    data: {
                        oids: arrOids.join(","),
                        attrSelect: attrSelected,
                        newValue: newVal
                    },
                    forceReload: true,
                    onComplete: function(dataResp) {
                        if (dataResp.msg === "OK") {
                            //Refresh display
                            var updateRecurs = function(array, key, newVal) {
                                if (!array) {
                                    return;
                                }
                                for (var i = 0; i < array.length; i++) {
                                    var objInfos = array[i];
                                    if (arrOids.indexOf(objInfos.id) !== -1) {
                                        objInfos[key] = newVal;
                                    }
                                    updateRecurs(objInfos.childs, attrSelected, newVal);
                                }
                            };
                            updateRecurs(myWidget.dataFull, attrSelected, newVal);

                            myWidget.displayData(myWidget.dataFull);

                            //Display feedback
                            SemanticUIMessage.addNotif({
                                level: "success",
                                title: "Attributes Updated",
                                message: dataResp.data.length + " objects updated",
                                sticky: false
                            });
                        } else {
                            console.error("Error in Web Service Response : " + JSON.stringify(dataResp.msg));
                            SemanticUIMessage.addNotif({
                                level: "error",
                                title: "Error in Web Service Response : ",
                                message: JSON.stringify(dataResp.msg),
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
        widget.addEvent("onRefresh", myWidget.onLoadWidget);
        widget.addEvent("onSearch", myWidget.onSearchWidget);
        widget.addEvent("onResetSearch", myWidget.onResetSearchWidget);

        widget.addEvent("endEdit", myWidget.onPrefEnd);
        widget.addEvent("onConfigChange", myWidget.onConfigChange); //For change of Table Config in list
    });
}
