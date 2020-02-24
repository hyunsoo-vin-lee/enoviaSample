/*
 * BT WW Competencies Center - Fast Prototypes Team
 * @author UM5
 */

function executeWidgetCode() {
    require([
        "UWA/Drivers/jQuery",
        "BTWWUtils/SpringyGraph_ES5_UM5_v1/SpringyGraph",
        "BTWWSemanticUI/SemanticUIMessage_ES5_UM5_v1/SemanticUIMessage",
        "UM5Modules/Connector3DSpace",
        "UM5Modules/UM5ToolsWS"
    ], function($, SpringyGraph, SemanticUIMessage, Connector3DSpace, UM5ToolsWS) {
        var myWidget = {
            dataFull: [],
            nodeList: [],
            edgeList: [],
            springyGraph: null,

            onLoadWidget: function() {
                var wdgUrl = widget.getUrl();
                wdgUrl = wdgUrl.substring(0, wdgUrl.lastIndexOf("/"));

                widget.setIcon(wdgUrl + "/../UM5Modules/assets/icons/custom-widget-icon.png");

                var $wdgBody = $(widget.body);
                $wdgBody.empty();

                //Init Notification UI
                SemanticUIMessage.initContainer({ parent: widget.body });

                var $cnv = $("<canvas  id='springyCnv' width='" + $wdgBody.width() + "' height='" + $wdgBody.height() + "' />");
                $wdgBody.append($cnv);

                $wdgBody.append("<div id='nodeSelectedInfos'></div>");
                $wdgBody.append("<div id='legendColors' class='hide'></div>");

                var graph = new SpringyGraph.Graph();

                myWidget.springyGraph = new SpringyGraph({
                    canvas: $cnv.get(0),
                    minEnergyThreshold: 0.1,
                    minSpeedThreshold: 0.2,
                    graph: graph,
                    onRenderStart: function() {
                        $(widget.body).append("<div id='renderIcon'><div>");
                    },
                    onRenderStop: function() {
                        $("#renderIcon").remove();
                    },
                    nodeSelected: function(node) {
                        myWidget.updateSelectedNodeInfos(node);
                    }
                });

                myWidget.loadRootData();
            },

            onRefreshWidget: function() {
                myWidget.onResizeWidget();
            },

            onResizeWidget: function() {
                var $wdgBody = $(widget.body);
                var $canvas = $("#springyCnv");
                $canvas.attr("width", $wdgBody.width());
                $canvas.attr("height", $wdgBody.height());
            },

            colorsMap: {},
            minSat: 35,
            maxSat: 99,
            minLight: 35,
            maxLight: 85,

            hueSpace: 40,
            hueStart: 200,
            satSpace: 10,
            lightSpace: 10,
            nbHueChange: 0,

            getColorFor: function(key) {
                var colorHSV = myWidget.colorsMap[key];
                if (!colorHSV) {
                    //Gen a new Color
                    var nbRotationsDone = Math.floor(myWidget.nbHueChange / (360 / myWidget.hueSpace));
                    var nbHueRotation = Math.floor(myWidget.nbHueChange * myWidget.hueSpace / 360);
                    var hue = (myWidget.hueStart + myWidget.nbHueChange * myWidget.hueSpace + nbHueRotation * myWidget.hueSpace) % 360;
                    var sat = myWidget.maxSat - (nbRotationsDone * myWidget.satSpace) % (myWidget.maxSat - myWidget.minSat);
                    var light = myWidget.maxLight - (nbRotationsDone * myWidget.lightSpace) % (myWidget.maxLight - myWidget.minLight);
                    colorHSV = "hsl(" + hue + "," + sat + "%," + light + "%)";
                    myWidget.colorsMap[key] = colorHSV;
                    myWidget.nbHueChange++;
                    myWidget.updateLegend();
                }
                return colorHSV;
            },

            updateLegend: function() {
                //TODO : display legend of Colors with colorsMap
                var $legendDiv = $("#legendColors");
                $legendDiv.empty();
                var $btnHideShow = $("<div id='btnHideShow'><i class='angle double left icon'></i></div>");
                $btnHideShow.click(function() {
                    var $legendDiv = $("#legendColors");
                    var $icon = $("#btnHideShow i");
                    if ($legendDiv.hasClass("hide")) {
                        $legendDiv.removeClass("hide");
                        $icon.removeClass("right");
                        $icon.addClass("left");
                    } else {
                        $legendDiv.addClass("hide");
                        $icon.removeClass("left");
                        $icon.addClass("right");
                    }
                });
                $legendDiv.append($btnHideShow);

                var $listLegends = $("<div id='listLegends'></div>");
                for (var keyColor in myWidget.colorsMap) {
                    if (myWidget.colorsMap.hasOwnProperty(keyColor)) {
                        var strColor = myWidget.colorsMap[keyColor];
                        $listLegends.append("<div class='legendItem' style='background-color:" + strColor + ";'>" + keyColor + "</div>");
                    }
                }
                $legendDiv.append($listLegends);
            },

            checkAndAddNode: function(inputObj) {
                var node = null;
                //Search existing Nodes
                for (var i = 0; i < myWidget.nodeList.length; i++) {
                    var nodeToTest = myWidget.nodeList[i];
                    if (nodeToTest.data.id === inputObj.id) {
                        node = nodeToTest;
                        break;
                    }
                }

                if (!node) {
                    //inputObj.label = inputObj.type + " " + inputObj.name + " " + inputObj.revision;
                    inputObj.label = inputObj.name;
                    inputObj.ondoubleclick = function(node) {
                        var idToExpand = node.data.id;
                        myWidget.expandObject(idToExpand, node);
                    };
                    node = myWidget.springyGraph.graph.newNode(inputObj);
                    node.data.backcolor = myWidget.getColorFor("Type-" + node.data.type);
                    myWidget.nodeList.push(node);
                }
                return node;
            },

            checkAndAddEdge: function(node1, node2, data) {
                var edge = null;
                //Search existing Nodes
                for (var i = 0; i < myWidget.edgeList.length; i++) {
                    var edgeToTest = myWidget.edgeList[i];
                    if (edgeToTest.source === node1 && edgeToTest.target === node2 && edgeToTest.data.label === data.label) {
                        edge = edgeToTest;
                        break;
                    }
                }

                if (!edge) {
                    edge = myWidget.springyGraph.graph.newEdge(node1, node2, data);
                    myWidget.edgeList.push(edge);
                    edge.data.color = myWidget.getColorFor("Rel-" + edge.data.label);
                }
                return edge;
            },

            updateSelectedNodeInfos: function(node) {
                var text = node.data.type + ", " + node.data.name + ", " + node.data.revision; // + "," + node.data.id;
                $("div#nodeSelectedInfos").html(text);
            },

            //WS functions
            loadRootData: function() {
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
                        var arrDataObjs = data;
                        var i, j;
                        for (i = 0; i < arrDataObjs.length; i++) {
                            var inObj = arrDataObjs[i];
                            myWidget.checkAndAddNode(inObj);
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
            expandObject: function(oid, nodeToAttachTo) {
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

                        nodeToAttachTo.data.borderColor = "#389de7";

                        for (var i = 0; i < arrExpand.length; i++) {
                            var inObj = arrExpand[i];
                            var newNode = myWidget.checkAndAddNode(inObj);

                            var relType = inObj["name[connection]"];

                            if (inObj.relDirection === "to") {
                                myWidget.checkAndAddEdge(newNode, nodeToAttachTo, { color: "#00A0B0", label: relType });
                            } else {
                                myWidget.checkAndAddEdge(nodeToAttachTo, newNode, { color: "#00A0B0", label: relType });
                            }
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
            }
        };

        widget.addEvent("onLoad", myWidget.onLoadWidget);
        widget.addEvent("onRefresh", myWidget.onRefreshWidget);
        widget.addEvent("onResize", myWidget.onResizeWidget);
    });
}
