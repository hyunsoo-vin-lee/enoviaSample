/**
 * BT WW Competencies Center - Fast Prototypes Team
 * @author UM5
 */

function executeWidgetCode() {
    require([
        "UWA/Drivers/jQuery",
        "DS/PlatformAPI/PlatformAPI",
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

                var recursSort = function(arrayToRecurs, sortingKey) {
                    arrayToRecurs = sortByKey(arrayToRecurs, sortingKey);
                    for (var i = 0; i < arrayToRecurs.length; i++) {
                        if (arrayToRecurs.childs) {
                            recursSort(arrayToRecurs.childs, sortingKey);
                        }
                    }
                };

                var arrSortingKeys = widget.getValue("sortKeys").split(",");
                var i;
                for (i = arrSortingKeys.length - 1; i >= 0; i--) {
                    //arrData = sortByKey(arrData, arrSortingKeys[i].trim());
                    recursSort(arrData, arrSortingKeys[i].trim());
                }
                //Data Sorted!

                //Define display functions
                var defaultCellDisplay = EnoTableUtils.defaultCellDisplay;

                var linkCellDisplay = EnoTableUtils.linkCellDisplay;

                var firstColumnCellDisplay = EnoTableUtils.firstColumnCellDisplay;

                var cellHtml = EnoTableUtils.cellHtmlHighlight;

                var rowsFunction = EnoTableUtils.rowsFunction;

                var headersFunction = EnoTableUtils.headersFunction;

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

                for (var i = 0; i < arrColumnHeaders.length; i++) {
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
                        if (colKey.group) {
                            colDef.group = colKey.group;
                        }
                    }
                    if (i === 0) {
                        colDef.cell = firstColumnCellDisplay;
                    }
                    columnsDef.push(colDef);
                }

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
                    for (var i = 0; i < arrToSearch.length; i++) {
                        var objToTest = arrToSearch[i];
                        var idObj = objToTest.id;
                        if (strOid === idObj) {
                            currentObject = objToTest;
                            break;
                        }
                    }

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

            selectIds: function(dataSelect) {
                var wdgId = dataSelect.widgetId;
                if (widget.id === wdgId) return; //Ignore event when it's coming from the widget itself

                //console.log("selectIds...");
                var arrIds = dataSelect.ids;
                //console.log(arrIds);

                if (arrIds.length >= 1) {
                    var arrToFilter = myWidget.dataFull;

                    FiltersMechanisms.addToFilters("id", arrIds);

                    FiltersMechanisms.filterRecursively(arrToFilter);

                    myWidget.displayData(arrToFilter);
                } else {
                    //console.log("displayData Full");
                    var arrToFilter = myWidget.dataFull;

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

                for (var i = 0; i < tagsMappingArray.length; i++) {
                    var tagInfo = tagsMappingArray[i];
                    var tagName = tagInfo.name;
                    var tag6W = tagInfo.selectable.sixw;
                    tagsMap[tagName] = tag6W;
                    arrTagsSelect.push(tagName);
                }

                var allObjsTags = tagData.datarecords.datagroups;
                /* eslint no-redeclare:"off" */
                for (var i = 0; i < allObjsTags.length; i++) {
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

                //Init EnoTableUtils
                EnoTableUtils.myWidget = myWidget;

                var wdgUrl = widget.getUrl();
                wdgUrl = wdgUrl.substring(0, wdgUrl.lastIndexOf("/"));
                widget.setIcon(wdgUrl + "/assets/icons/Table.png");

                var wdgTitlePref = widget.getValue("wdgTitle");
                if (wdgTitlePref) {
                    widget.setTitle(wdgTitlePref);
                }

                PlatformAPI.subscribe("Select_Ids", myWidget.selectIds);
                PlatformAPI.subscribe("Select_Object", myWidget.selectObject);
                PlatformAPI.subscribe("Cross_Filter", myWidget.crossFilterEvents); //New Cross Filter

                myWidget._prefSetFind = new PreferencesSetManager(widget);
                myWidget._prefSetDisplay = new PreferencesSetManager(widget);

                myWidget._prefSetFind.setupPrefsNames("configFind", "configNameFind");
                myWidget._prefSetDisplay.setupPrefsNames("configDisplay", "configNameDisplay");

                myWidget._prefSetFind.setupConfig("UM5FindPrefSet", [
                    { name: "configNameFind", noSave: true },
                    "typeObjRoot",
                    "whereExpRoot",
                    "findProgram",
                    "findFunction",
                    "findParams"
                ]);
                myWidget._prefSetDisplay.setupConfig("UM5DisplayPrefSet", [
                    { name: "configNameDisplay", noSave: true },
                    "selects",
                    { name: "selectsRel", noSave: true, type: "hidden" },
                    "columnKeys",
                    "columnDisp",
                    "sortKeys",
                    "searchKeys"
                ]);

                myWidget._prefSetFind.loadPrefConfigs();
                myWidget._prefSetDisplay.loadPrefConfigs();

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

            callData: function() {
                UM5ToolsWS.find({
                    data: {
                        type: widget.getValue("typeObjRoot"),
                        selects: widget.getValue("selects"),
                        findProgram: widget.getValue("findProgram"),
                        findFunction: widget.getValue("findFunction"),
                        findParams: widget.getValue("findParams"),
                        where: widget.getValue("whereExpRoot")
                    },
                    onOk: function(data, callbackData) {
                        /* eslint no-unused-vars:"off" */
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

            onConfigChange: function(namePref, valuePref) {
                myWidget._prefSetFind.onConfigChange(namePref, valuePref);
                myWidget._prefSetDisplay.onConfigChange(namePref, valuePref);
            },

            onPrefEnd: function() {
                myWidget._prefSetFind.saveCustomPrefs();
                myWidget._prefSetDisplay.saveCustomPrefs();
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

        widget.addEvent("endEdit", myWidget.onPrefEnd);
        widget.addEvent("onConfigChange", myWidget.onConfigChange); //For change of Table Config in list
    });
}
