/*
 * Dassault Systemes
 * 2016 - All right reserved
 * 
 * author : UM5
 * 
 */

/**
 * BT WW Competencies Center - Fast Prototypes Team
 * @author UM5
 */

function executeWidgetCode() {
    require([
        "UWA/Drivers/jQuery",
        "DS/PlatformAPI/PlatformAPI",
        "DS/DataDragAndDrop/DataDragAndDrop",
        //"UM5Modules/PreferencesSetManager",
        "UM5Graph/UM5Graph"
    ], function(
        $,
        PlatformAPI,
        DataDragAndDrop,
        //PreferencesSetManager,
        UM5Graph
    ) {
        var myWidget = {
            oidsRoots: [],

            loadDisplay: function() {
                //Add Toolbar and stuff + div for the Graph
                widget.body.innerHTML = "";
                var $bodyWdg = $(widget.body);

                var $divToolbar = $("<div id ='divToolbar'></div>");
                $divToolbar.addClass("toolbar");
                $bodyWdg.append($divToolbar);

                var $divGraph = $("<div id ='divGraph'>Graph is Loading...</div>");
                $bodyWdg.append($divGraph);

                //Set Graph as a Drop Zone
                if ($divGraph.length > 0) {
                    var elemDivGraph = $divGraph.get(0);
                    DataDragAndDrop.droppable(elemDivGraph, {
                        /*drop: function(data){
						var dataDnD = JSON.parse(data);
						if(widget.id!==dataDnD.widgetId && dataDnD.sourceDnD==="Table"){
							var oidDropped=dataDnD.objectId;
							if(myWidget.oidsRoots.indexOf(oidDropped)===-1){
								myWidget.oidsRoots.push(oidDropped);
								UM5Graph.addRoots([oidDropped]);
								widget.setValue("oidsLoaded", myWidget.oidsRoots.join(","));
							}else{
								alert("The Object is already added as a root in this table");
							}
						}
					}*/
                        drop: function(data) {
                            var dataDnD = JSON.parse(data);
                            if (widget.id !== dataDnD.widgetId && dataDnD.sourceDnD === "Table") {
                                var oidDropped = dataDnD.objectId;
                                if (myWidget.oidsRoots.indexOf(oidDropped) === -1) {
                                    myWidget.oidsRoots.push(oidDropped);
                                    UM5Graph.addRoots([oidDropped]);
                                    widget.setValue("oidsLoaded", myWidget.oidsRoots.join(","));
                                } else {
                                    alert("The Object is already added as a root in this table");
                                }
                            } else if (dataDnD.protocol === "3DXContent") {
                                try {
                                    var oidDropped = dataDnD.data.items[0].objectId;
                                    if (myWidget.oidsRoots.indexOf(oidDropped) === -1) {
                                        myWidget.oidsRoots.push(oidDropped);
                                        UM5Graph.addRoots([oidDropped]);
                                        widget.setValue("oidsLoaded", myWidget.oidsRoots.join(","));
                                    } else {
                                        alert("The Object is already added as a root in this table");
                                    }
                                } catch (err) {
                                    console.error(err);
                                }
                            }
                        }
                    });
                }

                //Add Buttons to toolbar
                var configPref = widget.getValue("config");
                if (configPref === "Custom") {
                    var $saveCustomConfig = $("<div id ='saveCustomConfig' class='toolbarButton'>Save Config</div>");
                    $divToolbar.append($saveCustomConfig);
                    $saveCustomConfig.on("click", function(event) {
                        //PreferencesSetManager.saveCustomPrefs();
                    });
                }
            },

            selectIds: function(dataSelect) {
                var wdgId = dataSelect.widgetId;
                if (widget.id === wdgId) return; //Ignore event when it's coming from the widget itself

                var arrIds = dataSelect.ids;
                UM5Graph.setFilteredData(arrIds);
            },
            selectObject: function(dataSelect) {
                var wdgId = dataSelect.widgetId;
                if (widget.id === wdgId) return; //Ignore event when it's coming from the widget itself

                //console.log("Selection event");
                var strOid = dataSelect.objectId;
                var isSelected = dataSelect.isSelected;
                UM5Graph.modifySelection(strOid, isSelected);
            },

            onLoadWidget: function() {
                var wdgUrl = widget.getUrl();
                wdgUrl = wdgUrl.substring(0, wdgUrl.lastIndexOf("/"));
                widget.setIcon(wdgUrl + "/assets/icons/Graph.png");

                myWidget.loadDisplay();
                var divBodyGraph = $("#divGraph").get(0);
                UM5Graph.setParentWidget(myWidget);
                UM5Graph.setBody(divBodyGraph);

                UM5Graph.onNodeMouseDown = function(node, ev) {
                    ev.stopPropagation();
                    ev.preventDefault();

                    var isSelected = UM5Graph._graph.isSelected(node);
                    if (isSelected) {
                        UM5Graph._graph.removeFromSelection(node);
                    } else {
                        UM5Graph._graph.addToSelection(node);
                    }

                    var strOid = node.data["id"];

                    var dataSelect = {
                        sourceDnD: "Table",
                        widgetId: widget.id,
                        objectId: strOid,
                        isSelected: !isSelected
                    };
                    PlatformAPI.publish("Select_Object", dataSelect);
                };

                var arrSortingKeys = widget.getValue("sortKeys").split(",");
                UM5Graph.setSortKeys(arrSortingKeys);

                var strOids = widget.getValue("oidsLoaded");
                if (strOids !== "") {
                    var arrOids = strOids.split(",");
                    myWidget.oidsRoots = arrOids;
                    UM5Graph.addRoots(arrOids);
                } else {
                    UM5Graph.asyncRefresh();
                }

                PlatformAPI.subscribe("Select_Ids", myWidget.selectIds);
                PlatformAPI.subscribe("Select_Object", myWidget.selectObject);

                //PreferencesSetManager.setupConfig("UM5Graph", [{name: "configName", noSave:true}, "typeObj", "typeRel", "expandProg", "expandFunc", "expandParams", "sortKeys", "searchKeys"]);

                //PreferencesSetManager.loadPrefConfigs();
            },

            onSearchWidget: function(searchQuery) {
                var searchKeys = widget.getValue("searchKeys").split(",");

                //TODO ...
            },

            onResetSearchWidget: function() {
                //TODO ...
            },

            onConfigChange: function(namePref, valuePref) {
                //PreferencesSetManager.onConfigChange(namePref, valuePref);
            }
        };

        widget.addEvent("onLoad", myWidget.onLoadWidget);
        widget.addEvent("onRefresh", myWidget.onLoadWidget);
        widget.addEvent("onSearch", myWidget.onSearchWidget);
        widget.addEvent("onResetSearch", myWidget.onResetSearchWidget);

        //widget.addEvent("onConfigChange", myWidget.onConfigChange);//For change of Table Config in list
    });
}
