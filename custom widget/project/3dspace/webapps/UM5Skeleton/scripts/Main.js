/**
 * BT WW Competencies Center - Fast Prototypes Team
 * @author UM5
 */
/* eslint no-console:"off" */
function executeWidgetCode() {
    require([
        "UWA/Drivers/jQuery",
        "DS/W3DXComponents/Skeleton",
        "UWA/Core",
        "UWA/Class/Model",
        "UWA/Class/Collection",
        "UWA/Class/View",
        "UM5Modules/Connector3DSpace",
        "BTWWSemanticUI/SemanticUIMessage_ES5_UM5_v1/SemanticUIMessage"
    ], function($, Skeleton, UWA, Model, Collection, View, Connector3DSpace, SemanticUIMessage) {
        var NodeModel3DSpace = Model.extend({
            defaults: function() {
                return {
                    id: "",
                    title: "",
                    subtitle: "",
                    date: "",
                    content: "",
                    image: "",
                    icon: "",
                    PID: ""
                };
            }
        });

        var Collection3DSpace = Collection.extend({
            model: NodeModel3DSpace,

            setup: function(els, options) {
                //Do some setup at Collection init
                /* console.log("Collection3DSpace:setup");
                console.log(this);
                console.log(els);
                console.log(options);
                console.log("Collection3DSpace:setup, arguments :");
                console.log(arguments); */
                var that = this;

                if (options && options._modelKey && options._modelKey.id) {
                    that.rootNodeId = options._modelKey.id;
                } else {
                    that.rootNodeId = null;
                }
            },

            fetch: function(opts) {
                //Call to fetch some Objects
                //Dispatch an onSync Event when done
                /* console.log("Collection3DSpace:fetch, opts = ");
                console.log(opts);
                console.log("Collection3DSpace:fetch, this = ");
                console.log(this);
                console.log("Collection3DSpace:fetch, arguments :");
                console.log(arguments); */

                var that = this;
                var onCompleteCB, onFailureCB;

                opts = opts ? UWA.clone(opts, false) : {};
                if (opts.parse === undefined) {
                    opts.parse = true;
                }
                onCompleteCB = opts.onComplete;
                onFailureCB = opts.onFailure;

                if (that.rootNodeId) {
                    //Do Expand
                    Connector3DSpace.call3DSpace({
                        url: "/UM5Tools/ExpandObject",
                        method: "POST",
                        type: "json",
                        data: {
                            objectId: that.rootNodeId,
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
                        onComplete: function(dataResp) {
                            if (dataResp.msg === "OK") {
                                var arrExpand = dataResp.data;

                                var method;
                                method = opts.reset ? "reset" : "set";
                                that[method](arrExpand, opts);

                                if (onCompleteCB) {
                                    onCompleteCB(that, arrExpand, opts);
                                }
                                that.dispatchEvent("onSync", [that, arrExpand, opts]);
                            } else {
                                console.error("Error in WebService Response : " + JSON.stringify(dataResp));
                                SemanticUIMessage.addNotif({
                                    level: "error",
                                    title: "Error in WebService Response",
                                    message: JSON.stringify(dataResp),
                                    sticky: false
                                });

                                if (onFailureCB) {
                                    onFailureCB(that, dataResp, opts);
                                }
                                that.dispatchEvent("onError", [that, dataResp, opts]);
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

                            if (onFailureCB) {
                                onFailureCB(that, error, opts);
                            }
                            that.dispatchEvent("onError", [that, error, opts]);
                        }
                    });
                } else {
                    //Do a Find
                    Connector3DSpace.call3DSpace({
                        url: "/UM5Tools/Find",
                        method: "POST",
                        type: "json",
                        data: {
                            type: widget.getValue("typeObjRoot"),
                            selects: widget.getValue("selects"),
                            findProgram: widget.getValue("findProgram"),
                            findFunction: widget.getValue("findFunction"),
                            findParams: widget.getValue("findParams"),
                            where: widget.getValue("whereExpRoot")
                        },
                        onComplete: function(dataResp) {
                            //console.log("Call Data On Complete, dataResp=");
                            //console.log(dataResp);
                            if (dataResp.msg === "OK") {
                                var arrDataObjs = dataResp.data;

                                var method;
                                method = opts.reset ? "reset" : "set";

                                that[method](arrDataObjs, opts);

                                if (onCompleteCB) {
                                    onCompleteCB(that, arrDataObjs, opts);
                                }
                                that.dispatchEvent("onSync", [that, arrDataObjs, opts]);

                                //Manually Remove the Spinner...
                                $(".spinner").removeClass("spinning");
                                $(".infinitearea").css("display", "none");
                            } else {
                                console.error("Error in WebService Response : " + JSON.stringify(dataResp));
                                SemanticUIMessage.addNotif({
                                    level: "error",
                                    title: "Error in WebService Response",
                                    message: JSON.stringify(dataResp),
                                    sticky: false
                                });

                                if (onFailureCB) {
                                    onFailureCB(that, dataResp, opts);
                                }
                                that.dispatchEvent("onError", [that, dataResp, opts]);
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

                            if (onFailureCB) {
                                onFailureCB(that, error, opts);
                            }
                            that.dispatchEvent("onError", [that, error, opts]);
                        }
                    });
                }
                return that.sync("read", that, opts);
            },

            parse: function(data) {
                //Called after the onSync Event is dispatch to parse the received data before building the Collection to be used
                //Should return the Array of Models
                //console.log("Parse data =");
                //console.log(data);

                var arrResult = [];

                for (var i = 0; i < data.length; i++) {
                    var obj = data[i];

                    obj.title = obj.name;
                    obj.subtitle = obj.name;

                    //attribute[Title],attribute[PLMEntity.V_Name]
                    if (obj["attribute[PLMEntity.V_Name]"] && obj["attribute[PLMEntity.V_Name]"] !== "") {
                        obj.title = obj["attribute[PLMEntity.V_Name]"];
                    } else if (obj["attribute[Title]"] && obj["attribute[Title]"] !== "") {
                        obj.title = obj["attribute[Title]"];
                    }

                    obj.content = obj.description || obj.type;

                    obj.id = obj.physicalid;

                    obj.image = Connector3DSpace._Url3DSpace + obj.iconType;

                    arrResult.push(obj);
                }

                return arrResult;
            }
        });

        var View3DSpaceItem = View.extend({
            tagName: "div",
            className: "generic-detail",
            render: function() {
                var that = this;

                /* console.log("This:");
                console.log(that);
                console.log("Model:");
                console.log(that.model);
                console.log("Collection:");
                console.log(that.collection); */

                var tableHTML = "<table><tbody>";

                for (var key in that.model._attributes) {
                    var val = that.model._attributes[key];

                    tableHTML = tableHTML + "<tr><td>" + key + "</td><td>" + val + "</td></tr>";
                }

                tableHTML = tableHTML + "</tbody></table>";

                var content = [];
                var divTable = widget.createElement("div");
                divTable.innerHTML = tableHTML;
                content.push(divTable);

                this.container.setContent(content);

                return that;
            },
            show: function() {
                //Do nothing
            }
        });

        var myWidget = {
            displayData: function() {
                //var wdgUrl = widget.getUrl();
                //wdgUrl = wdgUrl.substring(0, wdgUrl.lastIndexOf("/")) + "/../"; //We should be at 3DSpace/webapps level here

                if (myWidget.skeleton) {
                    // Destroy Skeleton instance to recreate it
                    myWidget.skeleton.destroy();
                }

                /*var generalViewOpts = {
                    useInfiniteScroll: false,
                    usePullToRefresh: false
                };*/

                myWidget.skeleton = new Skeleton(
                    {
                        //Renderers Map
                        render3DSpace: {
                            collection: Collection3DSpace,
                            // View not defined so it will fallback either to 'DS/W3DXComponents/Views/Item/SkeletonRootView' or to
                            // 'DS/W3DXComponents/Views/Layout/ListView', depending if it's the first panel or not
                            view: null,
                            viewOptions: {
                                useInfiniteScroll: false,
                                usePullToRefresh: false,
                                buttonGroup: {
                                    //Read and used only by 'DS/W3DXComponents/Views/Item/SkeletonRootView'
                                    buttons: [
                                        {
                                            icon: "question-circle",
                                            id: "TestButton01",
                                            name: "TestButtonName01",
                                            value: "Test 01",
                                            className: "primary",
                                            style: "display:inline-block"
                                        },
                                        {
                                            icon: "plus",
                                            id: "TestButton02",
                                            name: "TestButtonName02",
                                            value: "Test 02",
                                            className: "primary",
                                            style: "display:inline-block;"
                                        }
                                    ]
                                },
                                events: {
                                    //Read and used only by 'DS/W3DXComponents/Views/Item/SkeletonRootView'
                                    onClick: function(els, evt) {
                                        console.log("ocClick on button id=" + els.options.id);
                                        console.log("onClick : arguments=");
                                        console.log(arguments);
                                    }
                                }
                            },
                            idCardOptions: {
                                facets: function() {
                                    return [
                                        {
                                            text: "Sub-Components",
                                            icon: "plus",
                                            handler: Skeleton.getRendererHandler("render3DSpace")
                                        },
                                        {
                                            text: "Properties",
                                            icon: "doc-text",
                                            handler: Skeleton.getRendererHandler(View3DSpaceItem)
                                        }
                                    ];
                                }
                            }
                        }
                    },
                    {
                        //Display Options
                        root: "render3DSpace",
                        useRootChannelView: false,
                        events: {
                            onItemSelect: function(model) {
                                UWA.log(model);
                            },
                            onSlide: function(view, model) {
                                UWA.log(view);
                                UWA.log(model);
                            }
                        }
                    }
                );

                widget.body.setContent(myWidget.skeleton.render());
            },

            onLoadWidget: function() {
                //var wdgUrl = widget.getUrl();
                //wdgUrl=wdgUrl.substring(0, wdgUrl.lastIndexOf("/"));
                //widget.setIcon(wdgUrl+"/assets/icons/Table.png");

                widget.setTitle("Skeleton Test");

                myWidget.displayData();
            }
        };

        widget.addEvent("onLoad", myWidget.onLoadWidget);
        widget.addEvent("onRefresh", myWidget.onLoadWidget);
    });
}
