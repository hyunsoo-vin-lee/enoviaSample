/**
 * BT WW Competencies Center - Fast Prototypes Team
 * @author UM5
 */

define(
    "UM5Modules/Connector3DSpace", ["DS/i3DXCompassServices/i3DXCompassServices", "DS/WAFData/WAFData", "BTWWUtils/WidgetHub_ES6_II2_v1/WidgetHub"],
    function (i3DXCompassServices, WAFData, WidgetHub) {
        var connector3DSpace = widget.connector3DSpace; //Makes it a single object on the widget level
        if (typeof connector3DSpace === "undefined") {
            var hub = new WidgetHub();
            var genDataKey = function (options) {
                //Use a hash to avoid having a string too long for the publish subscribe use in WidgetHub
                var str = JSON.stringify(options);
                var hash = 0,
                    i,
                    chr;
                if (str.length === 0) return hash;
                for (i = 0; i < str.length; i++) {
                    chr = str.charCodeAt(i);
                    hash = (hash << 5) - hash + chr;
                    hash |= 0; // Convert to 32bit integer
                }
                return "" + hash;
            };

            connector3DSpace = {
                _Url3DSpace: "",
                _SecCtxLoaded: false,
                _arrSecCtxs: [],
                _widgetPref4Ctx: "ctx",
                _tenant: "",

                useWidgetHub: true,

                load3DSpaceURL: function (callback, args) {
                    var dataKey4Hub = "i3DXCompassServices.getServiceUrl.3DSpace";
                    var hubDef = {
                        //a key to identify the data
                        dataKey: dataKey4Hub,
                        //the request method, can be anything, async or not
                        request: function () {
                            i3DXCompassServices.getServiceUrl({
                                serviceName: "3DSpace", //'3DSearch' for federated Search URL and fallbcak is to replace 3DSpace to federated (DELWebMfgAssetsDefModelServices/ModelUtils.js)
                                platformId: widget.getValue("x3dPlatformId") || "",
                                onComplete: function (URLResult) {
                                    //mandatory
                                    //hub.onSuccess(dataKey4Hub, URLResult);
                                    if (connector3DSpace.useWidgetHub) {
                                        //mandatory
                                        hub.onSuccess(dataKey4Hub, URLResult);
                                    } else {
                                        hubDef.success({
                                            status: "ok",
                                            data: URLResult,
                                            loader: widget.id,
                                            ts: Date.now()
                                        });
                                    }
                                },
                                onFailure: function (error) {
                                    //mandatory
                                    //hub.onError(dataKey4Hub, error);
                                    if (connector3DSpace.useWidgetHub) {
                                        //mandatory
                                        hub.onError(dataKey4Hub, error);
                                    } else {
                                        hubDef.error({
                                            status: "error",
                                            error: error,
                                            data: {},
                                            loader: widget.id,
                                            ts: Date.now()
                                        });
                                    }
                                }
                            });
                        },
                        //data retrieval success function
                        success: function (response) {
                            var URLResult = response.data;

                            if (typeof URLResult === "string") {
                                connector3DSpace._Url3DSpace = URLResult;
                                connector3DSpace._tenant = "OnPremise";
                            } else if (typeof URLResult !== "undefined") {
                                connector3DSpace._Url3DSpace = URLResult[0].url;
                                connector3DSpace._tenant = URLResult[0].platformId;
                            } else {
                                console.warn("Fallback to determine 3DSpace URL");
                                connector3DSpace._tenant = "OnPremise";
                                connector3DSpace._Url3DSpace = widget.uwaUrl.substring(0, widget.uwaUrl.lastIndexOf("/")); //Widget Folder
                                connector3DSpace._Url3DSpace = connector3DSpace._Url3DSpace.substring(0, connector3DSpace._Url3DSpace.lastIndexOf("/")); //webappsFolder
                                connector3DSpace._Url3DSpace = connector3DSpace._Url3DSpace.substring(0, connector3DSpace._Url3DSpace.lastIndexOf("/")); //3DSpace root folder
                            }
                            if (typeof callback === "function") {
                                callback.apply(connector3DSpace, args);
                            }
                        },
                        //data retrieval error function
                        error: function (error) {
                            alert("Impossible to retrieve 3DSpace Service URL" + error);
                        }
                    };
                    if (connector3DSpace.useWidgetHub) {
                        hub.requestData(hubDef);
                    } else {
                        //Fallback call directly
                        hubDef.request();
                    }
                },

                loadSecCtx: function (callback, args) {
                    if (connector3DSpace._Url3DSpace.length <= 1) {
                        connector3DSpace.load3DSpaceURL(connector3DSpace.loadSecCtx, args);
                    } else {
                        var urlWAF = connector3DSpace._Url3DSpace + "/UM5Tools/UserInfo/getSecurityContexts";
                        var dataWAF = {};
                        var headerWAF = {
                            SecurityContext: ""
                        };
                        var methodWAF = "GET";

                        var dataKey4Hub = urlWAF;

                        var hubDef = {
                            //a key to identify the data
                            dataKey: dataKey4Hub,
                            //the request method, can be anything, async or not
                            request: function () {
                                WAFData.authenticatedRequest(urlWAF, {
                                    method: methodWAF,
                                    headers: headerWAF,
                                    data: dataWAF,
                                    type: "json",
                                    onComplete: function (dataResp) {
                                        //mandatory
                                        //hub.onSuccess(dataKey4Hub, dataResp);
                                        if (connector3DSpace.useWidgetHub) {
                                            //mandatory
                                            hub.onSuccess(dataKey4Hub, dataResp);
                                        } else {
                                            hubDef.success({
                                                status: "ok",
                                                data: dataResp,
                                                loader: widget.id,
                                                ts: Date.now()
                                            });
                                        }
                                    },
                                    onFailure: function (error) {
                                        //mandatory
                                        //hub.onError(dataKey4Hub, error);
                                        if (connector3DSpace.useWidgetHub) {
                                            //mandatory
                                            hub.onError(dataKey4Hub, error);
                                        } else {
                                            hubDef.error({
                                                status: "error",
                                                error: error,
                                                data: {},
                                                loader: widget.id,
                                                ts: Date.now()
                                            });
                                        }
                                    }
                                });
                            },
                            //data retrieval success function
                            success: function (response) {
                                var dataResp = response.data;
                                if (dataResp.msg === "OK") {
                                    connector3DSpace._arrSecCtxs = dataResp.data;
                                    connector3DSpace._SecCtxLoaded = true;

                                    //Check that the preference is existing
                                    var prefCtx = widget.getPreference(connector3DSpace._widgetPref4Ctx);
                                    if (typeof prefCtx === "undefined") {
                                        widget.addPreference({
                                            name: connector3DSpace._widgetPref4Ctx,
                                            type: "hidden",
                                            label: "3DSpace Context",
                                            defaultValue: ""
                                        });
                                    }

                                    //Load widget Pref
                                    var lastCtxSelected = widget.getValue(connector3DSpace._widgetPref4Ctx);
                                    //console.log("lastCtxSelected:"+lastCtxSelected);
                                    if (connector3DSpace._arrSecCtxs.indexOf(lastCtxSelected) === -1) {
                                        //In case of removed Context / Widget is shared...
                                        lastCtxSelected = "";
                                    }

                                    prefCtx = widget.getPreference(connector3DSpace._widgetPref4Ctx);
                                    prefCtx.type = "list";

                                    //prefCtx.options=connector3DSpace._arrSecCtxs;
                                    prefCtx.options = [];

                                    for (var i = 0; i < connector3DSpace._arrSecCtxs.length; i++) {
                                        var arrSec = connector3DSpace._arrSecCtxs[i];
                                        prefCtx.options.push({
                                            value: arrSec,
                                            label: arrSec
                                        });
                                    }

                                    if (typeof lastCtxSelected.value === "undefined" || lastCtxSelected.value === "") {
                                        prefCtx.defaultValue = prefCtx.options[0].value;
                                    } else {
                                        prefCtx.defaultValue = lastCtxSelected;
                                    }

                                    widget.addPreference(prefCtx);
                                    widget.setValue(connector3DSpace._widgetPref4Ctx, prefCtx.defaultValue); //Set the correct selected Value

                                    //console.log(prefManager._arrSecCtxs);
                                    if (typeof callback === "function") {
                                        callback.apply(connector3DSpace, args);
                                    }
                                } else {
                                    console.error("Error in WebService Response : " + JSON.stringify(dataResp));
                                }
                            },
                            //data retrieval error function
                            error: function (error) {
                                console.error("Call Faillure : " + JSON.stringify(error));
                            }
                        };
                        if (connector3DSpace.useWidgetHub) {
                            hub.requestData(hubDef);
                        } else {
                            //Fallback call directly
                            hubDef.request();
                        }
                    }
                },

                /**
                 * Call 3DSpace sevice
                 * The url of 3DSpace will be automatically retrieved and prepend to the url given in the options.
                 *
                 * @param {Object} options
                 */
                call3DSpace: function (options) {
                    /*
                     * options :
                     * url
                     * method
                     * data
                     * type
                     * callbackData
                     * onComplete
                     * onFailure
                     * forceReload
                     */

                    if (connector3DSpace._Url3DSpace.length <= 1) {
                        connector3DSpace.load3DSpaceURL(connector3DSpace.call3DSpace, arguments);
                    } else if (!connector3DSpace._SecCtxLoaded) {
                        connector3DSpace.loadSecCtx(connector3DSpace.call3DSpace, arguments);
                    } else {
                        var urlWAF = connector3DSpace._Url3DSpace + options.url;
                        var dataWAF = options.data || {};

                        var strCtx = widget.getValue(connector3DSpace._widgetPref4Ctx);
                        if (typeof strCtx === "object") {
                            strCtx = strCtx.value;
                        }
                        if (strCtx && strCtx.length > 0 && strCtx.indexOf("ctx::") !== 0) {
                            strCtx = "ctx::" + strCtx;
                        }
                        var headerWAF = options.headers || {};

                        headerWAF["SecurityContext"] = strCtx;

                        var methodWAF = options.method || "GET";
                        var typeWAF = options.type;

                        var dataKey4Hub = genDataKey(options) + "/sc:" + strCtx;

                        var hubDef = {
                            //a key to identify the data
                            dataKey: dataKey4Hub,
                            forceReload: options.forceReload,
                            //the request method, can be anything, async or not
                            request: function () {
                                WAFData.authenticatedRequest(urlWAF, {
                                    method: methodWAF,
                                    headers: headerWAF,
                                    data: dataWAF,
                                    type: typeWAF,
                                    contentType: options.contentType,
                                    onComplete: function (dataResp, headerResp) {
                                        var responseObj = {
                                            dataResp: dataResp,
                                            header: headerResp
                                        };
                                        if (typeWAF === "xml") {
                                            //XML Document going throught JSON.stringify of PlatformAPI.publish (in WidgetHub) will be modified to "{"location":null}", losing all xml infos
                                            //To solve this issue we cast XML to Text and Text to XML later On.
                                            responseObj.dataResp = new XMLSerializer().serializeToString(dataResp);
                                        }
                                        //mandatory
                                        //hub.onSuccess(dataKey4Hub, responseObj);
                                        if (connector3DSpace.useWidgetHub) {
                                            //mandatory
                                            hub.onSuccess(dataKey4Hub, responseObj);
                                        } else {
                                            hubDef.success({
                                                status: "ok",
                                                data: responseObj,
                                                loader: widget.id,
                                                ts: Date.now()
                                            });
                                        }
                                    },
                                    onFailure: function (error, responseDOMString, headerResp) {
                                        var errorObj = {
                                            error: error,
                                            responseDOMString: responseDOMString,
                                            headerResp: headerResp
                                        };
                                        //mandatory
                                        //hub.onError(dataKey4Hub, errorObj);
                                        if (connector3DSpace.useWidgetHub) {
                                            //mandatory
                                            hub.onError(dataKey4Hub, errorObj);
                                        } else {
                                            hubDef.error({
                                                status: "error",
                                                error: errorObj,
                                                data: {},
                                                loader: widget.id,
                                                ts: Date.now()
                                            });
                                        }
                                    }
                                });
                            },
                            //data retrieval success function
                            success: function (response) {
                                var dataResp = response.data.dataResp;
                                if (typeWAF === "xml") {
                                    var xmlDoc = null;
                                    if (window.DOMParser) {
                                        var parser = new DOMParser();
                                        xmlDoc = parser.parseFromString(dataResp, "text/xml");
                                    } else if (window.ActiveXObject) {
                                        // Internet Explorer
                                        xmlDoc = new window.ActiveXObject("Microsoft.XMLDOM");
                                        xmlDoc.async = "false";
                                        xmlDoc.loadXML(dataResp);
                                    } else {
                                        throw "Impossible to cast Text to XML in Connector3DSpace.js";
                                    }
                                    dataResp = xmlDoc;
                                }
                                var headerResp = response.data.headerResp;
                                if (typeof options.onComplete === "function") {
                                    options.onComplete(dataResp, headerResp, options.callbackData);
                                }
                            },
                            //data retrieval error function
                            error: function (errorObj) {
                                var error = errorObj.error;
                                var responseDOMString = errorObj.responseDOMString;
                                var headerResp = errorObj.headerResp;
                                if (typeof options.onFailure === "function") {
                                    options.onFailure(error, responseDOMString, headerResp, options.callbackData);
                                }
                            }
                        };

                        if (connector3DSpace.useWidgetHub) {
                            hub.requestData(hubDef);
                        } else {
                            //Fallback call directly
                            hubDef.request();
                        }
                    }
                }
            };
        }
        widget.connector3DSpace = connector3DSpace;
        return connector3DSpace;
    }
);