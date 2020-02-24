/**
 * BT WW Competencies Center - Fast Prototypes Team
 * @author UM5
 */

function executeWidgetCode() {
    require([
        "UWA/Drivers/jQuery",
        "BTWWHighcharts/BTWWHighcharts",
        "DS/PlatformAPI/PlatformAPI",
        "DS/TagNavigatorProxy/TagNavigatorProxy",
        "UM5Modules/Connector3DSpace",
        "UM5Modules/PreferencesSetManager",
        "UM5Modules/UM5ToolsWS",
        "UM5CentralizedNLS/UM5CentralizedNLS",
        "BTWWSemanticUI/SemanticUIMessage_ES5_UM5_v1/SemanticUIMessage"
    ], function ($, Highcharts, PlatformAPI, TagNavigatorProxy, Connector3DSpace, PreferencesSetManager, UM5ToolsWS, UM5CentralizedNLS, SemanticUIMessage) {
        var myWidget = {
            dataFull: [],

            displayData: function (arrData) {
                var showData = widget.getValue("showData");
                var tableHTML = "";
                var i;
                if (showData == "true") {
                    tableHTML += "<div style='height:50%;overflow:auto;'><table><thead><tr>";

                    var obj1 = arrData[0];
                    var keyObj;
                    for (keyObj in obj1) {
                        tableHTML = tableHTML + "<th>" + keyObj + "</th>";
                    }
                    tableHTML = tableHTML + "</tr></thead><tbody>";

                    for (i = 0; i < arrData.length; i++) {
                        tableHTML = tableHTML + "<tr>";
                        for (keyObj in obj1) {
                            tableHTML = tableHTML + "<td>" + arrData[i][keyObj] + "</td>";
                        }
                        tableHTML = tableHTML + "</tr>";
                    }

                    tableHTML += "</tbody></table></div><div id='chart' style='height:50%;overflow:auto;'></div>";
                } else {
                    tableHTML += "<div id='chart' style='height:100%;overflow:auto;'></div>";
                }

                widget.body.innerHTML = tableHTML;

                var chartMode = widget.getValue("chartMode");

                var catColors = widget.getValue("catColors");
                var catColorMap = {};

                if (typeof catColors !== "undefined" && catColors !== "") {
                    var arrCatColors = catColors.split(",");
                    for (var c = 0; c < arrCatColors.length; c++) {
                        var arrPair = arrCatColors[c].split(":");
                        if (arrPair.length >= 2) {
                            catColorMap[arrPair[0]] = arrPair[1];
                        }
                    }
                }

                var catOrder = widget.getValue("catOrder");
                var arrCatOrder = [];
                if (typeof catOrder !== "undefined" && catOrder !== "") {
                    arrCatOrder = catOrder.split(",");
                }

                var resMapCategoriesCountersAndList = {};

                var fctRecursBuildCategoriesOfObject = function (obj, arrKeysNext, currentValCategorie) {
                    var keyCatHere = arrKeysNext[0];

                    var valueObj = obj[keyCatHere] ? obj[keyCatHere] : "Not Defined";
                    //Apply NLS from server
                    var valueObjNls = obj["nls!" + keyCatHere];
                    if (null !== valueObjNls && typeof valueObjNls !== "undefined" && valueObjNls !== "") {
                        valueObj = valueObjNls;
                    }

                    var arrValuesObj = valueObj.split("");
                    for (var i = 0; i < arrValuesObj.length; i++) {
                        //Apply NLS
                        var singleValueObj = UM5CentralizedNLS.getTranslatedValueWithSelect(keyCatHere, arrValuesObj[i]);

                        var newCurrentValCategorie = currentValCategorie + (currentValCategorie.length >= 1 ? ", " : "") + singleValueObj;

                        if (arrKeysNext.length > 1) {
                            fctRecursBuildCategoriesOfObject(obj, arrKeysNext.slice(1), newCurrentValCategorie);
                        } else {
                            //End of categories combination => Add to result Map
                            var objCat = resMapCategoriesCountersAndList[newCurrentValCategorie];
                            if (typeof objCat === "undefined") {
                                objCat = {
                                    nbInCat: 1,
                                    arrIds: [obj.id]
                                };
                            } else {
                                objCat.nbInCat = objCat.nbInCat + 1;
                                objCat.arrIds.push(obj.id);
                            }
                            resMapCategoriesCountersAndList[newCurrentValCategorie] = objCat;
                        }
                    }
                };

                var keyToUse = widget.getValue("catKey");
                var arrKeys = keyToUse.split(",");
                for (i = 0; i < arrData.length; i++) {
                    var obj = arrData[i];
                    fctRecursBuildCategoriesOfObject(obj, arrKeys, "");
                }

                if (chartMode === "pie") {
                    var resMap = resMapCategoriesCountersAndList;

                    var outSeriesDataOrdered = [];
                    var outSeriesDataEnd = [];

                    var fctSelectInPie = function () {
                        //console.log("Select Data");
                        var filterExcludeModePref = widget.getValue("filterExcludeMode");
                        var i;
                        if (filterExcludeModePref && filterExcludeModePref === "true") {
                            var arrForExcludeMode = [];
                            for (obj in resMap) {
                                //Copy Array without doubles (doubles are due to multi-categories classification of some objects
                                var arrIdsHere = resMap[obj].arrIds;
                                for (i = 0; i < arrIdsHere.length; i++) {
                                    var idHere = arrIdsHere[i];
                                    if (arrForExcludeMode.indexOf(idHere) === -1) {
                                        arrForExcludeMode.push(idHere);
                                    }
                                }
                            }
                            for (i = 0; i < this.arrIdsCat.length; i++) {
                                arrForExcludeMode.splice(arrForExcludeMode.indexOf(this.arrIdsCat[i]), 1);
                            }
                            PlatformAPI.publish("Select_Ids", {
                                widgetId: null,
                                ids: arrForExcludeMode
                            });
                        } else {
                            PlatformAPI.publish("Select_Ids", {
                                widgetId: null,
                                ids: this.arrIdsCat
                            });
                        }
                    };
                    var fctUnselectPie = function () {
                        //console.log("Unselect Data");
                        PlatformAPI.publish("Select_Ids", {
                            ids: []
                        });
                    };

                    for (var keyCat in resMap) {
                        var valCat = resMap[keyCat].nbInCat;
                        var categorie = {
                            name: keyCat,
                            y: valCat,
                            arrIdsCat: resMap[keyCat].arrIds,
                            events: {
                                select: fctSelectInPie,
                                unselect: fctUnselectPie
                            }
                        };

                        if (typeof catColorMap[keyCat] !== "undefined") {
                            categorie.color = catColorMap[keyCat];
                        }

                        var indexOrder = arrCatOrder.indexOf(keyCat);
                        if (indexOrder !== -1) {
                            outSeriesDataOrdered[indexOrder] = categorie;
                        } else {
                            outSeriesDataEnd.push(categorie);
                        }
                    }
                    //console.log(outSeriesData);
                    var outSeriesData = [];
                    var catHere;
                    for (var i1 = 0; i1 < outSeriesDataOrdered.length; i1++) {
                        catHere = outSeriesDataOrdered[i1];
                        if (catHere) {
                            outSeriesData.push(catHere);
                        }
                    }
                    for (var i2 = 0; i2 < outSeriesDataEnd.length; i2++) {
                        catHere = outSeriesDataEnd[i2];
                        if (catHere) {
                            outSeriesData.push(catHere);
                        }
                    }

                    var chartTitle = widget.getValue("chartTitle");
                    widget.setTitle(chartTitle);
                    var objTitle4Chart = {
                        text: ""
                    };
                    if (widget.getValue("dispChartTitle") === "true") {
                        objTitle4Chart = {
                            text: chartTitle
                        };
                    }

                    new Highcharts.Chart({
                        chart: {
                            renderTo: "chart",
                            plotBackgroundColor: null,
                            plotBorderWidth: null,
                            plotShadow: false,
                            type: "pie"
                        },
                        credits: {
                            enabled: true,
                            text: "3DSpace Data",
                            href: "#"
                        },
                        exporting: {
                            enabled: false
                        },
                        navigation: {
                            enabled: false
                        },
                        title: objTitle4Chart,
                        tooltip: {
                            pointFormat: "{series.name}: <b>{point.percentage:.1f}%</b> - {point.y} objects"
                        },
                        plotOptions: {
                            pie: {
                                allowPointSelect: true,
                                cursor: "pointer",
                                dataLabels: {
                                    enabled: true,
                                    format: "<b>{point.name}</b>: {point.percentage:.1f} % ({point.y})",
                                    style: {
                                        color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || "black"
                                    }
                                },
                                size: "85%"
                                /*startAngle : -120,
			                endAngle : 120*/
                            }
                        },
                        series: [{
                            name: "Categories",
                            colorByPoint: true,
                            data: outSeriesData
                        }]
                    });
                } else if (chartMode === "bar" || chartMode === "column") {
                    var resMap2 = resMapCategoriesCountersAndList;

                    var catData = [];
                    var outSeriesData2 = [];

                    for (var keyCat2 in resMap2) {
                        var valCat2 = resMap2[keyCat2].nbInCat;
                        catData.push(keyCat2);
                        //outSeriesData.push(categorie);
                        outSeriesData2.push(valCat2);
                    }
                    //console.log(outSeriesData);

                    var chartTitle2 = widget.getValue("chartTitle");
                    widget.setTitle(chartTitle2);
                    var objTitle4Chart2 = {
                        text: ""
                    };
                    if (widget.getValue("dispChartTitle") === "true") {
                        objTitle4Chart2 = {
                            text: chartTitle
                        };
                    }

                    new Highcharts.Chart({
                        chart: {
                            renderTo: "chart",
                            plotBackgroundColor: null,
                            plotBorderWidth: null,
                            plotShadow: false,
                            type: chartMode
                        },
                        credits: {
                            enabled: true,
                            text: "3DSpace Data",
                            href: "#"
                        },
                        exporting: {
                            enabled: false
                        },
                        navigation: {
                            enabled: false
                        },
                        title: objTitle4Chart2,
                        tooltip: {
                            pointFormat: "{point.y} objects"
                        },
                        legend: {
                            enabled: false //Hide series filtering which display Categories
                        },
                        plotOptions: {
                            series: {
                                cursor: "pointer",
                                point: {
                                    events: {
                                        click: function () {
                                            //console.log("Select Data");
                                            var categoryClicked = this.category;
                                            var arrIdsCat = resMap2[categoryClicked].arrIds;

                                            var filterExcludeModePref = widget.getValue("filterExcludeMode");
                                            if (filterExcludeModePref && filterExcludeModePref === "true") {
                                                var arrForExcludeMode = [];
                                                var i;
                                                for (obj in resMap2) {
                                                    //Copy Array without doubles (doubles are due to multi-categories classification of some objects
                                                    var arrIdsHere = resMap2[obj].arrIds;
                                                    for (i = 0; i < arrIdsHere.length; i++) {
                                                        var idHere = arrIdsHere[i];
                                                        if (arrForExcludeMode.indexOf(idHere) === -1) {
                                                            arrForExcludeMode.push(idHere);
                                                        }
                                                    }
                                                }
                                                for (i = 0; i < arrIdsCat.length; i++) {
                                                    arrForExcludeMode.splice(arrForExcludeMode.indexOf(arrIdsCat[i]), 1);
                                                }
                                                PlatformAPI.publish("Select_Ids", {
                                                    widgetId: null,
                                                    ids: arrForExcludeMode
                                                });
                                            } else {
                                                PlatformAPI.publish("Select_Ids", {
                                                    widgetId: null,
                                                    ids: arrIdsCat
                                                });
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        xAxis: {
                            categories: catData,
                            title: {
                                text: null
                            }
                        },
                        yAxis: {
                            title: {
                                text: "Number of Objects"
                            }
                            /*,
			        	tickInterval: 1*/
                        },
                        series: [{
                            name: "Categories",
                            colorByPoint: true,
                            data: outSeriesData2
                        }]
                    });
                }
            },

            selectIds: function (dataSelect) {
                var wdgId = dataSelect.widgetId;
                if (widget.id === wdgId) return; //Ignore event when it's coming from the widget itself

                //console.log("selectIds...");
                var arrIds = dataSelect.ids;
                //console.log(arrIds);

                if (arrIds.length >= 1) {
                    var arrFiltered = [];
                    var arrToFilter = myWidget.dataFull;

                    var bFilterModeAND = widget.getValue("filterMode") === "AND";

                    myWidget._addToFilters("id", arrIds, bFilterModeAND);

                    arrFiltered = myWidget.filterLoop(arrToFilter);
                    myWidget.displayData(arrFiltered);

                    //Add Filter Icon
                    var $divFilter = $("<div id='divFilter'></div>");
                    $divFilter.attr("title", "Data displayed in this table is being filtered\nClick here to reset filters");
                    var $imgFilter = $("<div class='imgFilter'></div>");
                    $divFilter.append($imgFilter);
                    $("#chart").append($divFilter);

                    $divFilter.on("click", function () {
                        PlatformAPI.publish("Select_Ids", {
                            ids: []
                        });
                    });
                } else {
                    //console.log("displayData Full");
                    myWidget._appliedFilters = []; //Clear Filters
                    myWidget.displayData(myWidget.dataFull);
                }
            },

            _appliedFilters: [], //Format to use : [{select:"id", values : [...]}, ... ]

            _addToFilters: function (select, values, clearValues) {
                //Search if select already there or not then update or add filter info
                var filterInfoToUpdate = null;
                var i;
                for (i = 0; i < myWidget._appliedFilters.length; i++) {
                    var filterInfo = myWidget._appliedFilters[i];
                    if (filterInfo.select === select) {
                        filterInfoToUpdate = filterInfo;
                        break;
                    }
                }
                if (!filterInfoToUpdate) {
                    filterInfoToUpdate = {
                        select: select,
                        values: []
                    };
                    myWidget._appliedFilters.push(filterInfoToUpdate);
                }
                var valuesToPush = [];
                if (typeof values === "string") {
                    valuesToPush.push(values);
                } else {
                    valuesToPush = values;
                }
                if (clearValues) {
                    filterInfoToUpdate.values = valuesToPush;
                } else {
                    for (i = 0; i < valuesToPush.length; i++) {
                        var val = valuesToPush[i];
                        if (filterInfoToUpdate.values.indexOf(val) === -1) {
                            filterInfoToUpdate.values.push(val);
                        } //else already in filters
                    }
                }
            },

            filterLoop: function (arrSearchIn) {
                var resultArr = [];

                for (var i = 0; i < arrSearchIn.length; i++) {
                    var objTest = arrSearchIn[i];
                    var isFiltered = true;

                    for (var j = 0; j < myWidget._appliedFilters.length; j++) {
                        var filterInfo = myWidget._appliedFilters[j];
                        var selectFilter = filterInfo.select;
                        var valuesFilter = filterInfo.values;

                        var objValues = objTest[selectFilter].split("");
                        var oneValuesIsOK = false;
                        for (var k = 0; k < objValues.length; k++) {
                            var singleVal = objValues[k];
                            if (valuesFilter.indexOf(singleVal) !== -1) {
                                oneValuesIsOK = true;
                                break;
                            }
                        }
                        if (oneValuesIsOK) {
                            isFiltered = false;
                            break;
                        }
                    }

                    if (!isFiltered) {
                        resultArr.push(objTest);
                    }
                }
                return resultArr;
            },

            crossFilterEvents: function (dataFilterEvent) {
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

                                myWidget._addToFilters(evKeyForFiltering, valuesToKeep);

                                var arrFiltered = myWidget.filterLoop(myWidget.dataFull);

                                myWidget.displayData(arrFiltered);

                                //Add Filter Icon
                                //TODO Move the adding of this icon to this display
                                var $divFilter = $("<div id='divFilter'></div>");
                                $divFilter.attr("title", "Data displayed in this table is being filtered\nClick here to reset filters");
                                var $imgFilter = $("<div class='imgFilter'></div>");
                                $divFilter.append($imgFilter);
                                $("#chart").append($divFilter);

                                $divFilter.on("click", function () {
                                    PlatformAPI.publish("Select_Ids", {
                                        ids: []
                                    });
                                });
                            } else {
                                //Unfilter
                                var arrToFilter = myWidget.dataFull;

                                //TODO Remove from filters or clear filters ?
                                myWidget._appliedFilters = [];

                                myWidget.displayData(arrToFilter);
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

            _initTagger: function () {
                if (!myWidget.taggerProxy) {
                    var options = {
                        widgetId: widget.id,
                        filteringMode: "WithFilteringServices"
                    };
                    myWidget.taggerProxy = TagNavigatorProxy.createProxy(options);
                    myWidget.taggerProxy.addEvent("onFilterSubjectsChange", myWidget.onFilterSubjectsChange);
                }
            },

            setTags: function (dataResp) {
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

            onFilterSubjectsChange: function (eventFilter) {
                //console.log("*** UM5 eventFilter:");
                //console.log(eventFilter);

                var filtersKeys = Object.keys(eventFilter.allfilters);
                //console.log(filtersKeys);

                if (filtersKeys.length === 0) {
                    //Clear Tags
                    myWidget._appliedFilters = []; //TODO Reset only the physicalid list of values
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

                myWidget._appliedFilters = []; //TODO Reset only the physicalid list of values

                myWidget._addToFilters("physicalid", valuesToKeep);

                var arrFiltered = myWidget.filterLoop(myWidget.dataFull);

                myWidget.displayData(arrFiltered);

                //Add Filter Icon
                //TODO Move the adding of this icon to this display
                var $divFilter = $("<div id='divFilter'></div>");
                $divFilter.attr("title", "Data displayed in this table is being filtered\nClick here to reset filters");
                var $imgFilter = $("<div class='imgFilter'></div>");
                $divFilter.append($imgFilter);
                $("#chart").append($divFilter);

                $divFilter.on("click", function () {
                    PlatformAPI.publish("Select_Ids", {
                        ids: []
                    });
                });
            },

            //Widget Events

            onLoadWidget: function () {
                //Init Notification UI
                SemanticUIMessage.initContainer({
                    parent: widget.body
                });

                var wdgUrl = widget.getUrl();
                wdgUrl = wdgUrl.substring(0, wdgUrl.lastIndexOf("/"));
                widget.setIcon(wdgUrl + "/assets/icons/Chart.png");

                PlatformAPI.subscribe("Select_Ids", myWidget.selectIds);
                PlatformAPI.subscribe("Cross_Filter", myWidget.crossFilterEvents); //New Cross Filter

                //PreferencesSetManager.setupConfig("UM5Chart", [{name:"configName", nosave:true}, "typeObj", "selects", "whereExp", "catKey", {name:"showData", type:"boolean"}, {name:"chartTitle", keepVisible:true}, {name:"dispChartTitle", type:"boolean"}, "searchKeys", "catOrder", "catColors"]);
                //PreferencesSetManager.loadPrefConfigs();

                myWidget._prefSetFind = new PreferencesSetManager(widget);

                myWidget._prefSetFind.setupPrefsNames("configFind", "configNameFind");

                myWidget._prefSetFind.setupConfig("UM5FindPrefSet", [{
                        name: "configNameFind",
                        noSave: true
                    },
                    "typeObjRoot",
                    "whereExpRoot",
                    "findProgram",
                    "findFunction",
                    "findParams"
                ]);

                myWidget._prefSetFind.loadPrefConfigs();

                myWidget._initTagger();

                myWidget.callData();

                myWidget.displayData(myWidget.dataFull);
            },

            onSearchWidget: function (searchQuery) {
                var arrResult = [];
                var searchKeys = widget.getValue("searchKeys").split(",");

                searchQuery = searchQuery.replace(/([[\]|{}:<>$^+?])/g, /\\$1/); //Escape []|{}:<>$^+?

                var regExpPattern = "^" + searchQuery.replace(/\*/g, "[\\w\\s0-9\\-\\(\\)]*") + "$"; //Search with * to RegExp "*" can be any letter or number or "_" or "-" or "(" or ")"
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

            onResetSearchWidget: function () {
                myWidget.displayData(myWidget.dataFull);
            },

            onPrefEnd: function () {
                myWidget._prefSetFind.saveCustomPrefs();
            },

            onConfigChange: function (namePref, valuePref) {
                //PreferencesSetManager.onConfigChange(namePref, valuePref);
                myWidget._prefSetFind.onConfigChange(namePref, valuePref);
            },

            callData: function () {
                UM5ToolsWS.find({
                    data: {
                        type: widget.getValue("typeObjRoot"),
                        selects: widget.getValue("selects"),
                        findProgram: widget.getValue("findProgram"),
                        findFunction: widget.getValue("findFunction"),
                        findParams: widget.getValue("findParams"),
                        where: widget.getValue("whereExpRoot")
                    },
                    onOk: function (data, callbackData) {
                        myWidget.dataFull = data;
                        myWidget.displayData(myWidget.dataFull);

                        myWidget.call6WTags(myWidget.dataFull);
                    },
                    onError: function (errorType, errorMsg) {
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

            call6WTags: function (arrData) {
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
                    url: "/resources/e6w/servicetagdata?tenant=OnPremise&e6w-objLimit=100&e6w-lang=en&e6w-timezone=-60&SecurityContext=ctx%3A%3A" +
                        encodeURIComponent(strCtx),
                    method: "POST",
                    type: "json",
                    data: {
                        oid_list: arrPids.join(","),
                        isPhysicalIds: "true"
                    },
                    onComplete: function (dataResp) {
                        //console.log("Call Data On Complete");
                        myWidget.data6WTags = dataResp;
                        myWidget.setTags(dataResp);
                        //console.log(myWidget.dataFull);
                    },
                    onFailure: function (error) {
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
        widget.addEvent("onConfigChange", myWidget.onConfigChange); //For the change of Preference Set
    });
}