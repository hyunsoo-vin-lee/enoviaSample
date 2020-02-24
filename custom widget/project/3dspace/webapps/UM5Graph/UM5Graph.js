/*
 * Dassault Systemes
 * 2016 - All right reserved
 * 
 * author : UM5
 * 
 */

define(
    "UM5Graph/UM5Graph",
    ["DS/egraph/core", "DS/egraph/views", "DS/egraph/iact", "UM5Graph/UM5GraphView", "UM5Modules/Connector3DSpace", "css!UM5Graph/UM5Graph"],
    function(GraphCore, GraphViews, GraphIACT, UM5GraphView, Connector3DSpace, cssUM5Graph) {
        var UM5Graph = {
            _body: null,
            _parentWidget: null,
            _graph: null,
            _edges: [],
            _expandLevel: 0,
            _arrRoots: [],
            _currentFilteredIds: [], //Used with Chart Filtering Capability
            _sortKeys: [],

            _enoSelects: "id,physicalid,type,name,revision,current",
            _enoRelSelects: "id[connection],name[connection]",

            setParentWidget: function(parentWidget) {
                this._parentWidget = parentWidget;
            },

            setBody: function(bodyDiv) {
                if (!bodyDiv) {
                    throw "UM5 Graph - setBody : invalid element.";
                }
                this._body = bodyDiv;
                $(this._body).addClass("um5-body-graph");
                this._initGraph();
            },

            addRoots: function(arrOids) {
                this._loadRootData(arrOids);
            },

            _removeRoot: function(oidToRemove) {
                if (UM5Graph._parentWidget) {
                    try {
                        var idxArrRoots = UM5Graph._parentWidget.oidsRoots.indexOf(oidToRemove);
                        if (idxArrRoots !== -1) {
                            UM5Graph._parentWidget.oidsRoots.splice(idxArrRoots, 1);
                            widget.setValue("oidsLoaded", UM5Graph._parentWidget.oidsRoots.join(","));
                        }
                    } catch (err) {} //Do nothing
                }
                for (var i = 0; i < UM5Graph._arrRoots.length; i++) {
                    var objTest = UM5Graph._arrRoots[i];
                    if (objTest.id === oidToRemove) {
                        if (objTest.nodeObj) {
                            //remove Node from Graph
                            UM5Graph._graph.withLockedUpdate(function modifygraph() {
                                //Clean all edges
                                for (var e = 0; e < UM5Graph._edges.length; e++) {
                                    UM5Graph._graph.removeEdge(UM5Graph._edges[e]);
                                }
                                UM5Graph._edges = [];
                                //remove Node from Graph
                                var removeChildsNodesFromGraphRecurs = function(objData) {
                                    var arrChildsObjs = objData.childs;
                                    if (arrChildsObjs) {
                                        for (var i = 0; i < arrChildsObjs.length; i++) {
                                            var childObj = arrChildsObjs[i];
                                            removeChildsNodesFromGraphRecurs(childObj);
                                            if (childObj.nodeObj) {
                                                UM5Graph._graph.removeNode(childObj.nodeObj.n);
                                                childObj.nodeObj = null;
                                            }
                                        }
                                    }
                                };
                                removeChildsNodesFromGraphRecurs(objTest);
                                UM5Graph._graph.removeNode(objTest.nodeObj.n);
                            });
                        }
                        UM5Graph._arrRoots.splice(i, 1);
                        i--;
                    }
                }
                UM5Graph.asyncRefresh();
            },

            setSortKeys: function(arrSortKeys) {
                this._sortKeys = arrSortKeys;
            },

            _sortByKey: function(array, key) {
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
            },

            _initGraph: function() {
                this._body.innerHTML = "";
                this._graph = new GraphCore.EGraph();
                this._graph.addView("main", new GraphViews.HTMLGraphView(this._body)); //Add the view to the graph
                new GraphIACT.StateMachine(this._graph, undefined, undefined, this._graph.views.main); //Mouse & touch interactions controller
                this._edges = [];
                //Clean all the data
                this._arrRoots = [];
            },

            _createNode: function(x, y, data) {
                if (data.nodeObj) {
                    data.nodeObj.n.multiset("left", x, "top", y);
                    return data.nodeObj;
                } else {
                    var n = new GraphCore.Node();
                    //n.views.main = new GraphViews.HTMLNodeView();
                    n.views.main = new UM5GraphView.NodeView();
                    n.multiset("left", x, "top", y, "width", 140, "height", 60);
                    n.data = data;
                    n.data.UM5Graph = UM5Graph;

                    var c1 = new GraphCore.Connector();
                    //c.views.main = new GraphViews.SVGConnView();
                    c1.views.main = new UM5GraphView.ConnectorGenericView();
                    c1.multiset(["cstr", "attach"], GraphCore.BorderCstr.LEFT, ["cstr", "offset"], 30);
                    n.appendConnector(c1);

                    var c2 = new GraphCore.Connector();
                    c2.views.main = new UM5GraphView.ConnectorExpandView();
                    c2.multiset(["cstr", "attach"], GraphCore.BorderCstr.RIGHT, ["cstr", "offset"], 30);
                    n.appendConnector(c2);

                    var that = UM5Graph;
                    that._graph.addNode(n);

                    var nodeObj = {
                        n: n,
                        cIn: c1,
                        cOut: c2
                    };
                    n.data.nodeObj = nodeObj;
                    return nodeObj;
                }
            },

            _createEdge: function(classCss) {
                var e = new GraphCore.Edge();
                if (!classCss) {
                    classCss = "um5-edge-view";
                }
                e.views.main = new GraphViews.SVGEdgeView(classCss);

                var edgeGeometry = new GraphCore.AutoBezierGeometry();
                e.set("geometry", edgeGeometry);

                return e;
            },

            _asyncTimeout: null,
            asyncRefresh: function() {
                //Use a timeout to limit the number of refresh done (not a refresh at each reply of a WS)
                if (this._asyncTimeout) {
                    try {
                        clearTimeout(this._asyncTimeout);
                    } catch (err) {} //Timeout id probably expired
                }
                this._asyncTimeout = setTimeout(this._draw, 250);
            },

            _draw: function() {
                console.log("UM5 Graph - _draw : START");
                console.log(UM5Graph);
                var that = UM5Graph;

                //that._initGraph();
                //Clean all edges
                for (var e = 0; e < that._edges.length; e++) {
                    try {
                        that._graph.removeEdge(that._edges[e]);
                    } catch (err) {
                        console.error(err);
                    }
                }
                that._edges = [];

                var currentX = 10;
                var currentY = 10;

                var offsetX = 200;
                var offsetY = 80;

                var buildRecursively = function(objData, localOffsetX) {
                    var nodeObj = that._createNode(currentX + localOffsetX, currentY, objData);

                    //Update filtered status of nodes
                    var nodeElem = nodeObj.n.views.main.display.elt;
                    if (nodeElem) {
                        if (objData.filtered) {
                            var currentClasses = nodeElem.className.split(" ");
                            if (currentClasses.indexOf("um5-node-filtered") === -1) {
                                nodeElem.className += " um5-node-filtered";
                            }
                        } else {
                            var currentClasses = nodeElem.className.split(" ");
                            if (currentClasses.indexOf("um5-node-filtered") !== -1) {
                                currentClasses.splice(currentClasses.indexOf("um5-node-filtered"), 1);
                                nodeElem.className = currentClasses.join(" ");
                            }
                        }
                    }

                    //Display childs if expanded or remove childs if just collapsed
                    var arrChildsObjs = objData.childs;
                    if (objData.expand) {
                        for (var i = that._sortKeys.length - 1; i >= 0; i--) {
                            arrChildsObjs = that._sortByKey(arrChildsObjs, that._sortKeys[i].trim());
                        }
                        for (var i = 0; i < arrChildsObjs.length; i++) {
                            var childObj = arrChildsObjs[i];
                            var nodeChildObj = buildRecursively(childObj, localOffsetX + offsetX);
                            //Add Edge
                            var newEdge = that._createEdge("um5-edge-view");
                            that._edges.push(newEdge);
                            that._graph.addEdge(nodeObj.cOut, nodeChildObj.cIn, newEdge);
                            //Increase Y position for next Nodes
                            if (i < arrChildsObjs.length - 1) {
                                currentY += offsetY;
                            }
                        }
                    } else {
                        var removeChildsNodesFromGraphRecurs = function(objData) {
                            var arrChildsObjs = objData.childs;
                            if (arrChildsObjs) {
                                for (var i = 0; i < arrChildsObjs.length; i++) {
                                    var childObj = arrChildsObjs[i];
                                    removeChildsNodesFromGraphRecurs(childObj);
                                    if (childObj.nodeObj) {
                                        that._graph.removeNode(childObj.nodeObj.n);
                                        childObj.nodeObj = null;
                                    }
                                }
                            }
                        };
                        removeChildsNodesFromGraphRecurs(objData);
                    }

                    return nodeObj;
                };

                that._graph.withLockedUpdate(function modifygraph() {
                    var arrData = that._arrRoots;
                    for (var r = 0; r < arrData.length; r++) {
                        rootObjData = arrData[r];
                        rootObjData.isRoot = true;
                        buildRecursively(rootObjData, 0);
                        currentY += offsetY;
                    }
                });
                console.log("UM5 Graph - _draw : END");
            },

            setFilteredData: function(arrData) {
                this._currentFilteredIds = arrData;

                if (arrData.length >= 1) {
                    this.filterRecursively(arrData, this._arrRoots);
                    this.asyncRefresh();
                } else {
                    this._currentFilteredIds = [];
                    this.resetFilterRecursively(this._arrRoots);
                    this.asyncRefresh();
                }
            },

            filterRecursively: function(oidsSearched, arrSearchIn) {
                for (var i = 0; i < arrSearchIn.length; i++) {
                    var objTest = arrSearchIn[i];
                    var oidObj = objTest.id;
                    if (oidsSearched.indexOf(oidObj) !== -1) {
                        objTest.filtered = false;
                    } else {
                        objTest.filtered = true;
                    }
                    if (objTest.childs) {
                        this.filterRecursively(oidsSearched, objTest.childs);
                    }
                }
            },
            resetFilterRecursively: function(arrToRecurse) {
                for (var i = 0; i < arrToRecurse.length; i++) {
                    var objTest = arrToRecurse[i];
                    objTest.filtered = false; //Reset Filter to false
                    if (objTest.childs) {
                        this.resetFilterRecursively(objTest.childs);
                    }
                }
            },

            modifySelection: function(strOid, isSelected) {
                var that = this;
                //console.log("Modify selection : "+strOid + " - "+ isSelected);
                var nodeSelect = null;
                var findRecurs = function(objToCheck, strOid) {
                    //console.log("findRecurs : "+objToCheck + " - "+ strOid);
                    if (objToCheck.id === strOid && objToCheck.nodeObj) {
                        if (isSelected) {
                            that._graph.addToSelection(objToCheck.nodeObj.n);
                            //console.log("Node Selected");
                        } else {
                            that._graph.removeFromSelection(objToCheck.nodeObj.n);
                            //console.log("Node Unselected");
                        }
                    }

                    var arrChilds = objToCheck.childs;
                    if (arrChilds) {
                        for (var j = 0; j < arrChilds.length; j++) {
                            findRecurs(arrChilds[j], strOid);
                        }
                    }
                };
                for (var i = 0; i < that._arrRoots.length; i++) {
                    var rootObj = that._arrRoots[i];
                    findRecurs(rootObj, strOid);
                }
            },

            _loadRootData: function(oids) {
                if (typeof oids === "undefined") return;

                var that = this;
                Connector3DSpace.call3DSpace({
                    url: "/UM5Tools/ObjectInfo",
                    method: "POST",
                    type: "json",
                    data: {
                        action: "getInfos",
                        objectIds: oids.join(","),
                        selects: that._enoSelects
                    },
                    callbackData: { that: that },
                    onComplete: function(dataResp, headerResp, callbackData) {
                        if (dataResp.msg === "OK") {
                            var arrDataObjs = dataResp.data;

                            for (var i = 0; i < arrDataObjs.length; i++) {
                                var doAdd = true;
                                var inObj = arrDataObjs[i];
                                inObj.path = inObj.id;
                                for (var j = 0; j < callbackData.that._arrRoots.length; j++) {
                                    var testObj = callbackData.that._arrRoots[j];
                                    if (testObj.id === inObj.id) {
                                        //Update already loaded object
                                        for (var keyIn in inObj) {
                                            testObj[keyIn] = inObj[keyIn];
                                        }
                                        doAdd = false;
                                    }
                                }
                                if (doAdd) {
                                    callbackData.that._arrRoots.push(inObj);
                                    if (callbackData.that._currentFilteredIds.length > 0) {
                                        callbackData.that.filterRecursively(callbackData.that._currentFilteredIds, callbackData.that._arrRoots);
                                    }
                                }
                            }

                            callbackData.that.asyncRefresh();
                            //console.log(callbackData.that._arrRoots);
                        } else {
                            widget.body.innerHTML += "<p>Error in WebService Response</p>";
                            widget.body.innerHTML += "<p>" + JSON.stringify(dataResp) + "</p>";
                            console.error("Call Faillure : " + JSON.stringify(dataResp));
                        }
                    },
                    onFailure: function(error) {
                        widget.body.innerHTML += "<p>Call Faillure</p>";
                        widget.body.innerHTML += "<p>" + JSON.stringify(error) + "</p>";
                        console.error("Call Faillure : " + JSON.stringify(error));
                    }
                });
            },

            _expandObject: function(oid, strPath, expandLevel) {
                var that = this;

                if (typeof expandLevel === "undefined") {
                    expandLevel = that._expandLevel;
                }
                //console.log("_expandObject : "+oid+" - "+strPath+" - "+expandLevel);

                Connector3DSpace.call3DSpace({
                    url: "/UM5Tools/ExpandObject",
                    method: "POST",
                    type: "json",
                    data: {
                        objectId: oid,
                        expandTypes: widget.getValue("typeObj"),
                        expandRels: widget.getValue("typeRel"),
                        expandParams: widget.getValue("expandParams"),
                        selects: that._enoSelects,
                        relSelects: that._enoRelSelects,
                        expandProgram: widget.getValue("expandProg"),
                        expandFunction: widget.getValue("expandFunc")
                    },
                    callbackData: {
                        that: that,
                        expandLevel: expandLevel
                    },
                    onComplete: function(dataResp, headerResp, callbackData) {
                        if (dataResp.msg === "OK") {
                            var arrExpand = dataResp.data;
                            if (callbackData.expandLevel > 0) {
                                callbackData.expandLevel--;
                            }

                            var findRecurs = function(pathObjId, arrSearchIn, searchPath) {
                                for (var i = 0; i < arrSearchIn.length; i++) {
                                    var objTest = arrSearchIn[i];
                                    var currentPath = searchPath + (searchPath !== "" ? "/" : "") + objTest.id;
                                    if (currentPath === pathObjId) {
                                        if (objTest.childs) {
                                            //Update the childs and keep other properties like nodeObj...
                                            for (var idxNew = 0; idxNew < arrExpand.length; idxNew++) {
                                                var newObj = arrExpand[idxNew];
                                                var doAdd = true;
                                                for (var idxOld = 0; idxOld < objTest.childs.length; idxOld++) {
                                                    var oldObj = objTest.childs[idxOld];
                                                    if (oldObj.id === newObj.id) {
                                                        //Update already loaded object
                                                        for (var keyIn in newObj) {
                                                            oldObj[keyIn] = newObj[keyIn];
                                                        }
                                                        doAdd = false;
                                                    }
                                                }
                                                if (doAdd) {
                                                    objTest.childs.push(newObj);
                                                }
                                            }
                                        } else {
                                            objTest.childs = arrExpand;
                                        }
                                        for (var c = 0; c < objTest.childs.length; c++) {
                                            var objChild = objTest.childs[c];
                                            objChild.path = currentPath + "/" + objChild.id;
                                            if (callbackData.expandLevel !== 0) {
                                                //-1 is expand All and 0 is expand Done other is the number of expand wanted
                                                callbackData.that._expandObject(objChild.id, objChild.path, callbackData.expandLevel);
                                            }
                                        }
                                        objTest.expand = true;
                                        objTest.expanded = true; //To be used for filters to know if data is loaded
                                        if (callbackData.that._currentFilteredIds.length > 0) {
                                            callbackData.that.filterRecursively(callbackData.that._currentFilteredIds, objTest.childs);
                                        }
                                    } else {
                                        if (objTest.childs && pathObjId.indexOf(currentPath) === 0) {
                                            //Keep going down the right path
                                            findRecurs(pathObjId, objTest.childs, currentPath);
                                        }
                                    }
                                }
                            };
                            findRecurs(strPath, callbackData.that._arrRoots, "");

                            callbackData.that.asyncRefresh();
                            //console.log(callbackData.that._arrRoots);
                        } else {
                            widget.body.innerHTML += "<p>Error in WebService Response</p>";
                            widget.body.innerHTML += "<p>" + JSON.stringify(dataResp) + "</p>";
                            console.error("Call Faillure : " + JSON.stringify(dataResp));
                        }
                    },
                    onFailure: function(error) {
                        widget.body.innerHTML += "<p>Call Faillure</p>";
                        widget.body.innerHTML += "<p>" + JSON.stringify(error) + "</p>";
                        console.error("Call Faillure : " + JSON.stringify(error));
                    }
                });
            }
        };
        return UM5Graph;
    }
);

define(
    "UM5Graph/UM5GraphView",
    ["DS/egraph/core", "DS/egraph/views", "DS/egraph/iact", "DS/egraph/utils", "WebappsUtils/WebappsUtils", "css!UM5Graph/UM5Graph"],
    function(GraphCore, GraphViews, GraphIACT, GraphUtils, WebappsUtils, cssUM5Graph) {
        var UM5GraphView = {};

        //Custom NodeView
        UM5GraphView.NodeView = function k() {
            GraphViews.HTMLNodeView.call(this);
        };
        GraphUtils.inherit(UM5GraphView.NodeView, GraphViews.HTMLNodeView);

        UM5GraphView.NodeView.prototype.buildNodeElement = function bne(node) {
            var wdgUrl = widget.getUrl();
            wdgUrl = wdgUrl.substring(0, wdgUrl.lastIndexOf("/")) + "/../"; //We should be at 3DSpace/webapps level here

            var divNode = UWA.createElement("div");

            var nodeClass = "um5-node-view";

            if (node.data.filtered) {
                nodeClass += " um5-node-filtered";
            }

            divNode.className = nodeClass;

            divNode.setAttribute("title", node.data["attribute[Title]"] + " " + node.data["revision"]);
            var nodeHTML = "";

            nodeHTML +=
                "<div class='um5-node-top'><div class='um5-node-inline um5-node-type' title='" + node.data["type"] + "'>" + node.data["type"] + "</div></div>";

            nodeHTML +=
                "<div class='um5-node-middle'><div class='um5-node-inline um5-node-name' title='" +
                node.data["name"] +
                "'>" +
                node.data["name"] +
                "</div></div>";

            nodeHTML +=
                "<div class='um5-node-bottom'><div class='um5-node-inline um5-node-rev' title='" +
                node.data["revision"] +
                "'>" +
                node.data["revision"] +
                "</div></div>";

            nodeHTML += "<div class='um5-node-typeIcon'><img class='typeIcon' src='" + wdgUrl + "../" + node.data.iconType + "'/></div>";

            divNode.innerHTML = nodeHTML;

            divNode.onmousedown = function(ev) {
                var UM5Graph = node.data.UM5Graph;
                if (UM5Graph && typeof UM5Graph.onNodeMouseDown === "function") {
                    UM5Graph.onNodeMouseDown(node, ev);
                }
            };

            divNode.oncontextmenu = function(ev) {
                //Display
                var divCtxMenu = UWA.createElement("div");
                divCtxMenu.className = "um5-node-ctx-menu";

                var divCtxCmdExpAll = UWA.createElement("div");
                divCtxCmdExpAll.className = "um5-node-ctx-command";
                divCtxCmdExpAll.innerHTML = "Expand All";
                divCtxCmdExpAll.setAttribute("title", "Expand All");
                divCtxMenu.appendChild(divCtxCmdExpAll);

                //Events
                var UM5Graph = node.data.UM5Graph;
                var currentID = node.data["id"];

                divCtxCmdExpAll.addEventListener("click", function(ev) {
                    ev.stopPropagation();
                    ev.preventDefault();
                    UM5Graph._expandLevel = -1;
                    UM5Graph._expandObject(currentID, node.data.path);
                });

                if (node.data.isRoot) {
                    var divCtxCmdRemoveRoot = UWA.createElement("div");
                    divCtxCmdRemoveRoot.className = "um5-node-ctx-command";
                    divCtxCmdRemoveRoot.innerHTML = "Remove Root";
                    divCtxCmdRemoveRoot.setAttribute("title", "Remove current Root");
                    divCtxMenu.appendChild(divCtxCmdRemoveRoot);

                    divCtxCmdRemoveRoot.addEventListener("click", function(ev) {
                        UM5Graph._removeRoot(currentID);
                    });
                }

                //Menu destruction
                var fctDestroyMenuHandler = function(ev) {
                    //Destroy/Detach Menu
                    divNode.removeChild(divCtxMenu);
                    //Remove handler
                    divNode.removeEventListener("mouseleave", fctDestroyMenuHandler);
                };

                divNode.appendChild(divCtxMenu);
                divNode.addEventListener("mouseleave", fctDestroyMenuHandler);

                return false;
            };

            return divNode;
        };

        //Custom Generic Connector
        UM5GraphView.ConnectorGenericView = function k() {
            GraphViews.SVGConnView.call(this);
        };
        GraphUtils.inherit(UM5GraphView.ConnectorGenericView, GraphViews.SVGConnView);

        UM5GraphView.ConnectorGenericView.prototype.buildConnElement = function bce(connector) {
            var urlIcons = WebappsUtils.getWebappsBaseUrl() + "UM5Graph/assets/icons/";

            var svgElem = document.createElementNS("http://www.w3.org/2000/svg", "g");

            if (connector.children.first) {
                //There is at least an edge connected
                var svgCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                svgCircle.setAttribute("class", "um5-connector-generic");
                svgCircle.setAttribute("r", "3.5");
                svgCircle.setAttribute("cx", "0");
                svgCircle.setAttribute("cy", "0");

                svgElem.appendChild(svgCircle);
            }
            return svgElem;
        };

        //Custom Connector Expand
        UM5GraphView.ConnectorExpandView = function k() {
            GraphViews.SVGConnView.call(this);
        };
        GraphUtils.inherit(UM5GraphView.ConnectorExpandView, GraphViews.SVGConnView);

        UM5GraphView.ConnectorExpandView.prototype.buildConnElement = function bce(connector) {
            var urlIcons = WebappsUtils.getWebappsBaseUrl() + "UM5Graph/assets/icons/";

            var svgElem = document.createElementNS("http://www.w3.org/2000/svg", "g");

            var svgPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
            svgPath.setAttribute("class", "um5-connector-expand");
            svgPath.setAttribute("d", "M 0 -10 L 20 -10 L 22 0 L 20 10 L 0 10");

            var expandIcon = "utilTreeLineNodeClosedSB.gif"; //Plus icon
            if (connector.node.data.expand) {
                expandIcon = "utilTreeLineNodeOpenSB.gif";
            }

            svgElem.appendChild(svgPath);

            var svgImg = document.createElementNS("http://www.w3.org/2000/svg", "image");
            svgImg.setAttribute("height", "16");
            svgImg.setAttribute("width", "16");
            svgImg.setAttribute("x", "2");
            svgImg.setAttribute("y", "-8");
            svgImg.setAttributeNS("http://www.w3.org/1999/xlink", "href", urlIcons + expandIcon);

            svgElem.appendChild(svgImg);

            svgElem.addEventListener("click", function(ev) {
                //console.log("Expand connector clicked");
                //console.log(connector);
                var node = connector.node;
                var UM5Graph = node.data.UM5Graph;
                UM5Graph._expandLevel = 1;

                var nodeId = node.data["id"];
                if (!node.data.expand && nodeId && nodeId !== "") {
                    UM5Graph._expandObject(nodeId, node.data.path);
                    node.data.expand = true;
                } else {
                    node.data.expand = false;
                    UM5Graph.asyncRefresh();
                }
                //node.data.expand = true;
                svgImg.setAttributeNS("http://www.w3.org/1999/xlink", "href", urlIcons + "iconSmallLoading.gif");
            });

            return svgElem;
        };

        UM5GraphView.ConnectorExpandView.prototype.onmodifyDisplay = function onmodifyDisplay(connector, changes) {
            GraphViews.SVGConnView.prototype.onmodifyDisplay.apply(this, arguments); //Parent proto function call
            var svgElem = this.display.elt;
            var node = connector.node;

            var urlIcons = WebappsUtils.getWebappsBaseUrl() + "UM5Graph/assets/icons/";

            var expandIcon = "utilTreeLineNodeClosedSB.gif"; //Plus icon
            if (node.data.expand) {
                expandIcon = "utilTreeLineNodeOpenSB.gif";
            }

            //Get Image to update;
            for (var i = 0; i < svgElem.children.length; i++) {
                svgChild = svgElem.children[i];
                if (svgChild.tagName === "image") {
                    svgChild.setAttributeNS("http://www.w3.org/1999/xlink", "href", urlIcons + expandIcon);
                }
            }
        };

        return UM5GraphView;
    }
);
