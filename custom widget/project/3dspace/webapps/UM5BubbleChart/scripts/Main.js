/*
 * BT WW Competencies Center - Fast Prototypes Team
 * @author UM5
 */

function executeWidgetCode() {
    require([
        "UWA/Drivers/jQuery",
        "DS/WAFData/WAFData",
        "BTWWSemanticUI/SemanticUIMessage_ES5_UM5_v1/SemanticUIMessage",
        "DS/DataDragAndDrop/DataDragAndDrop",
        "DS/PlatformAPI/PlatformAPI",
        "DS/TagNavigatorProxy/TagNavigatorProxy"
    ], function($, WAFData, SemanticUIMessage, DataDragAndDrop, PlatformAPI, TagNavigatorProxy) {
        var myWidget = {
            //Params
            splitChar: "\t",
            maxBubbleWidth: 100, //px

            dataFullRaw: [],
            dataFull: [],
            mapIssueNameToIndexesFull: {},

            // Widget Events
            onLoadWidget: function() {
                var wdgUrl = widget.getUrl();
                wdgUrl = wdgUrl.substring(0, wdgUrl.lastIndexOf("/"));

                widget.setIcon(wdgUrl + "/../UM5Modules/assets/icons/custom-widget-icon.png");

                var wdgTitlePref = widget.getValue("wdgTitle");
                if (wdgTitlePref) {
                    widget.setTitle(wdgTitlePref);
                }

                //Issue with DnD : try to prevent Scroll ontouchemove
                widget.body.addEventListener(
                    "touchmove",
                    function(event) {
                        event.preventDefault();
                    },
                    false
                );

                var $divContent = $("<div id='content'></div>");
                var $divBubbleInfos = $("<div id='bubbleInfos'></div>");

                var $wdgBody = $(widget.body);
                $wdgBody.empty();

                $wdgBody.append($divContent);
                $wdgBody.append($divBubbleInfos);

                //Init Notification UI
                SemanticUIMessage.initContainer({ parent: widget.body });

                myWidget.getFile();

                myWidget.initTagger();
            },

            getFile: function() {
                //Load CSV
                var urlWAF = widget.getValue("filePath");

                if (!urlWAF || urlWAF === "") {
                    $("#content").append("<p>Please specify a file path</p>");
                    return;
                }

                var dataWAF = {};
                var methodWAF = "GET";
                var typeWAF = "text";

                WAFData.request(urlWAF, {
                    method: methodWAF,
                    data: dataWAF,
                    type: typeWAF,
                    onComplete: function(dataResp) {
                        $("#content").append("<p>Loading file OK... </p>");
                        var arrRes = dataResp.split("\n");
                        myWidget.dataFullRaw = arrRes;
                        myWidget.prepareData(myWidget.dataFullRaw);
                    },
                    onFailure: function(error, responseDOMString, headerResp) {
                        widget.body.innerHTML += "<p>Loading file Failure : " + error + " - " + responseDOMString + " - " + headerResp + "</p>";
                    }
                });
            },

            prepareData: function(rawData) {
                if (rawData.length <= 1) {
                    myWidget.displayData([], {});
                    return;
                }

                var headers = rawData[0];
                //TODO Add headers order check
                //Should be : Name-Cost-Rating-Numbers
                var iName = 0,
                    iCost = 1,
                    iRating = 2,
                    iNumbers = 3,
                    iModel = 4,
                    iYear = 5;

                var arrBubbles = [];
                var mapIssueNameToIndexes = {};
                var bubbleObj = null;

                var allTags = {};

                var i;
                for (i = 1; i < rawData.length; i++) {
                    if (!rawData[i] || rawData[i] === "") continue;
                    var line = rawData[i].split(myWidget.splitChar);
                    bubbleObj = {
                        name: line[iName],
                        cost: parseFloat(line[iCost]),
                        rating: parseFloat(line[iRating]),
                        count: parseInt(line[iNumbers]),
                        model: line[iModel],
                        year: line[iYear]
                    };

                    var tagSubject = bubbleObj.name + "|" + bubbleObj.model + "|" + bubbleObj.year;
                    allTags[tagSubject] = [];
                    var tagModel = {
                        object: bubbleObj.model,
                        sixw: "ds6w:what/Model",
                        dispValue: bubbleObj.model
                    };
                    allTags[tagSubject].push(tagModel);
                    var tagYear = {
                        object: bubbleObj.year,
                        sixw: "ds6w:when/Year",
                        dispValue: bubbleObj.year
                    };
                    allTags[tagSubject].push(tagYear);

                    arrBubbles.push(bubbleObj);
                    var arrToUpdate = mapIssueNameToIndexes[bubbleObj.name] || [];
                    arrToUpdate.push(i - 1); //Correct for line 0 = Headers
                    mapIssueNameToIndexes[bubbleObj.name] = arrToUpdate;
                }

                myWidget.updateAllTags(allTags);

                myWidget.dataFull = arrBubbles;
                myWidget.mapIssueNameToIndexesFull = mapIssueNameToIndexes;

                myWidget.displayData(arrBubbles, mapIssueNameToIndexes);
            },

            displayData: function(arrData, mapIssueNameToIndexes) {
                var wdgUrl = widget.getUrl();
                wdgUrl = wdgUrl.substring(0, wdgUrl.lastIndexOf("/"));

                var $divContent = $("#content");

                $divContent.empty(); //Clear

                if (arrData.length <= 0) {
                    //No Data to display
                    $divContent.append("No data to Display");
                    return;
                }

                var arrBubbles = arrData;

                var bGroupIssueName = widget.getValue("groupIssues") === "true";

                if (bGroupIssueName) {
                    var arrGroupedBubbles = [];
                    for (var issueName in mapIssueNameToIndexes) {
                        var arrIndexes = mapIssueNameToIndexes[issueName];
                        var sumWeightedCosts = 0,
                            sumWeightedRatings = 0;
                        var sumWeights = 0;
                        var arrModels = [];
                        var arrYears = [];
                        for (var j = 0; j < arrIndexes.length; j++) {
                            var indexIssue = arrIndexes[j];
                            var bubbleObj = arrData[indexIssue];
                            sumWeights += bubbleObj.count;
                            sumWeightedCosts = sumWeightedCosts + bubbleObj.cost * bubbleObj.count;
                            sumWeightedRatings = sumWeightedRatings + bubbleObj.rating * bubbleObj.count;
                            arrModels.push(bubbleObj.model);
                            arrYears.push(bubbleObj.year);
                        }
                        var weightedAvgCost = sumWeightedCosts / sumWeights;
                        var weightedAvgRating = sumWeightedRatings / sumWeights;
                        var newBubbleObj = {
                            name: issueName,
                            cost: Math.round(weightedAvgCost),
                            rating: Math.round(weightedAvgRating * 10) / 10,
                            count: sumWeights,
                            model: arrModels.join(","),
                            year: arrYears.join(",")
                        };
                        arrGroupedBubbles.push(newBubbleObj);
                    }
                    arrBubbles = arrGroupedBubbles;
                }

                //Get mins and maxs
                var minNumbers = Number.MAX_SAFE_INTEGER,
                    minRating = Number.MAX_SAFE_INTEGER,
                    minCost = Number.MAX_SAFE_INTEGER;
                var maxNumbers = 0,
                    maxRating = 0,
                    maxCost = 0;

                var i = 0;
                for (i = 0; i < arrBubbles.length; i++) {
                    bubbleObj = arrBubbles[i];
                    minCost = Math.min(minCost, bubbleObj.cost);
                    minRating = Math.min(minRating, bubbleObj.rating);
                    minNumbers = Math.min(minNumbers, bubbleObj.count);

                    maxCost = Math.max(maxCost, bubbleObj.cost);
                    maxRating = Math.max(maxRating, bubbleObj.rating);
                    maxNumbers = Math.max(maxNumbers, bubbleObj.count);
                }

                //Here we know the mins and max values
                var rangeCost = maxCost - minCost;
                var rangeNumbers = maxNumbers - minNumbers;
                var rangeRating = maxRating - minRating;

                var $divGraph = $("<div id='graph'></div>");

                for (i = 0; i < arrBubbles.length; i++) {
                    var bubble = arrBubbles[i];
                    //Calculate Bubbles positions
                    var $divBubble = $("<div class='bubble' data-bubble='" + JSON.stringify(bubble) + "'></div>");
                    var size = myWidget.maxBubbleWidth * bubble.count / rangeNumbers;
                    $divBubble.css("width", size + "px");
                    $divBubble.css("height", size + "px");

                    $divBubble.css("top", "calc(" + (95 - 90 * (bubble.cost - minCost) / rangeCost + "% - " + size / 2) + "px)");
                    $divBubble.css("left", "calc(" + (100 - 95 * (bubble.rating - minRating) / rangeRating + "% - " + size / 2) + "px)"); //Inverted Rating Axis

                    $divBubble.attr(
                        "title",
                        bubble.name +
                            "\nCount: " +
                            bubble.count +
                            "\nCost: " +
                            bubble.cost +
                            "\nRating: " +
                            bubble.rating +
                            "\nModel: " +
                            bubbleObj.model +
                            "\nYear: " +
                            bubbleObj.year
                    );

                    $divBubble.click(function(ev) {
                        ev.stopPropagation();
                        $(".bubble.selected").removeClass("selected");
                        $(this).addClass("selected");
                        myWidget.showBubbleInfos(JSON.parse($(this).attr("data-bubble")));
                    });

                    $divGraph.append($divBubble);

                    DataDragAndDrop.draggable($divBubble.get(0), {
                        data: JSON.stringify(bubble) //Will be added as text type in dataTransfer
                    });
                }

                $divGraph.click(function() {
                    $(".bubble.selected").removeClass("selected");
                    myWidget.hideBubbleInfos();
                });

                $divContent.append($divGraph);

                //Add Customer Statisfact icons
                var $iconSad = $("<div id='sadIcon' class='icon satisfaction'><img class='' src='" + wdgUrl + "/assets/icons/Sad.png'/></div>");
                var $iconMedium = $("<div id='mediumIcon' class='icon satisfaction'><img class='' src='" + wdgUrl + "/assets/icons/Meh.png'/></div>");
                var $iconSmile = $("<div id='smileIcon' class='icon satisfaction'><img class='' src='" + wdgUrl + "/assets/icons/Happy.png'/></div>");

                $divContent.append($iconSad);
                $divContent.append($iconMedium);
                $divContent.append($iconSmile);

                //Add arrows
                var $divArrowX = $("<div class='graph arrow xAxis'></div>");
                var $divArrowY = $("<div class='graph arrow yAxis'></div>");

                $divGraph.append($divArrowX);
                $divGraph.append($divArrowY);

                //Legends
                var $divLegendeY = $("<div class='graph legend yAxis'>Repair Cost</div>");
                $divContent.append($divLegendeY);

                //Y Scale
                var $divMinY = $("<div class='yScale min'>" + minCost + " -</div>");
                var $divMaxY = $("<div class='yScale max'>" + maxCost + " -</div>");

                $divGraph.append($divMinY);
                $divGraph.append($divMaxY);
            },

            showBubbleInfos: function(bubbleinfos) {
                var $divInfos = $("#bubbleInfos");
                $divInfos.empty();

                $divInfos.append("<b>" + bubbleinfos.name + " : </b>" + bubbleinfos.count + "<br/>");
                $divInfos.append("<i>Cost : </i>" + bubbleinfos.cost + "<br/>");
                $divInfos.append("<i>Rating : </i>" + bubbleinfos.rating + "<br/>");
                $divInfos.append("<i>Model : </i>" + bubbleinfos.model + "<br/>");
                $divInfos.append("<i>Year : </i>" + bubbleinfos.year + "<br/>");

                $divInfos.addClass("show");

                PlatformAPI.publish("bubbleSelected", bubbleinfos);
            },

            hideBubbleInfos: function() {
                $("#bubbleInfos").removeClass("show");
                PlatformAPI.publish("bubbleSelected", {});
            },

            taggerProxy: null,

            initTagger: function() {
                if (!myWidget.taggerProxy) {
                    var options = {
                        widgetId: widget.id,
                        filteringMode: "WithFilteringServices"
                    };
                    myWidget.taggerProxy = TagNavigatorProxy.createProxy(options);
                    myWidget.taggerProxy.addEvent("onFilterSubjectsChange", myWidget.onFilterSubjectsChange);
                }
            },

            updateAllTags: function(allTags) {
                myWidget.taggerProxy.setSubjectsTags(allTags);
            },

            onFilterSubjectsChange: function(eventFilter) {
                //console.log(eventFilter);

                var filteredSubjectList = eventFilter.filteredSubjectList;

                var arrFiltered = [];
                var mapIssueNameToIndexesFiltered = {};

                for (var i = 0; i < myWidget.dataFull.length; i++) {
                    var bubbleObj = myWidget.dataFull[i];
                    var bubbleSubject = bubbleObj.name + "|" + bubbleObj.model + "|" + bubbleObj.year;
                    if (filteredSubjectList.indexOf(bubbleSubject) !== -1) {
                        arrFiltered.push(bubbleObj);
                        var arrToUpdate = mapIssueNameToIndexesFiltered[bubbleObj.name] || [];
                        arrToUpdate.push(arrFiltered.length - 1);
                        mapIssueNameToIndexesFiltered[bubbleObj.name] = arrToUpdate;
                    }
                }

                //console.log(arrFiltered);

                myWidget.displayData(arrFiltered, mapIssueNameToIndexesFiltered);
            }
        };

        widget.addEvent("onLoad", myWidget.onLoadWidget);
        //widget.addEvent("onRefresh", myWidget.onLoadWidget);
        //widget.addEvent("onSearch", myWidget.onSearchWidget);
        //widget.addEvent("onResetSearch", myWidget.onResetSearchWidget);

        //widget.addEvent("onConfigChange", myWidget.onConfigChange); //For change of Table Config in list
    });
}
