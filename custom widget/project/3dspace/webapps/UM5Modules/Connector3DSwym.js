/**
 * BT WW Competencies Center - Fast Prototypes Team
 * @author UM5
 */

define("UM5Modules/Connector3DSwym", ["DS/i3DXCompassServices/i3DXCompassServices", "DS/WAFData/WAFData", "BTWWUtils/WidgetHub_ES6_II2_v1/WidgetHub"], function (
    i3DXCompassServices,
    WAFData,
    WidgetHub
) {
    var connector3DSwym = widget.connector3DSwym; //Makes it a single object on the widget level
    if (typeof connector3DSwym === "undefined") {
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
        connector3DSwym = {
            _Url3DSwym: "",
            _CSRFTokenLoaded: false,
            _CSRFToken: "",
            _tenant: "",

            _retryGetCSRFToken: false,

            useWidgetHub: true,

            load3DSwymURL: function (callback, args) {
                var dataKey4Hub = "i3DXCompassServices.getServiceUrl.3DSwym";

                var hubDef = {
                    //a key to identify the data
                    dataKey: dataKey4Hub,
                    //the request method, can be anything, async or not
                    request: function () {
                        i3DXCompassServices.getServiceUrl({
                            serviceName: "3DSwym", //'3DSearch' for federated Search URL and fallbcak is to replace 3DSwym to federated (DELWebMfgAssetsDefModelServices/ModelUtils.js)
                            platformId: widget.getValue("x3dPlatformId") || "",
                            onComplete: function (URLResult) {
                                if (connector3DSwym.useWidgetHub) {
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
                                if (connector3DSwym.useWidgetHub) {
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
                            connector3DSwym._Url3DSwym = URLResult;
                            connector3DSwym._tenant = "OnPremise";
                        } else if (typeof URLResult !== "undefined") {
                            connector3DSwym._Url3DSwym = URLResult[0].url;
                            connector3DSwym._tenant = URLResult[0].platformId;
                        } else {
                            console.warn("Fallback to determine 3DSwym URL");
                            connector3DSwym._tenant = "OnPremise";
                            connector3DSwym._Url3DSwym = widget.uwaUrl.substring(0, widget.uwaUrl.lastIndexOf("/")); //Widget Folder
                            connector3DSwym._Url3DSwym = connector3DSwym._Url3DSwym.substring(0, connector3DSwym._Url3DSwym.lastIndexOf("/")); //webappsFolder
                            connector3DSwym._Url3DSwym = connector3DSwym._Url3DSwym.substring(0, connector3DSwym._Url3DSwym.lastIndexOf("/")); //3DSpace root folder
                            connector3DSwym._Url3DSwym = connector3DSwym._Url3DSwym.substring(0, connector3DSwym._Url3DSwym.lastIndexOf("/")) + "/3DSwym"; //Try it like so, but it most case it won't be a valid approach
                        }
                        if (typeof callback === "function") {
                            callback.apply(connector3DSwym, args);
                        }
                    },
                    //data retrieval error function
                    error: function (error) {
                        alert("Impossible to retrieve 3DSwym Service URL" + error);
                    }
                };
                if (connector3DSwym.useWidgetHub) {
                    hub.requestData(hubDef);
                } else {
                    //Fallback call directly
                    hubDef.request();
                }
            },

            loadCSRFToken: function (callback, args) {
                if (connector3DSwym._Url3DSwym.length <= 1) {
                    connector3DSwym.load3DSwymURL(connector3DSwym.loadCSRFToken, args);
                } else {
                    var urlWAF = connector3DSwym._Url3DSwym + "/api/index/tk";
                    var dataWAF = {};
                    var headerWAF = {
                        SecurityContext: ""
                    };
                    var methodWAF = "GET";

                    var dataKey4Hub = urlWAF;

                    var hubDef = {
                        //a key to identify the data
                        dataKey: dataKey4Hub,
                        forceReload: connector3DSwym._retryGetCSRFToken,
                        //the request method, can be anything, async or not
                        request: function () {
                            WAFData.authenticatedRequest(urlWAF, {
                                method: methodWAF,
                                headers: headerWAF,
                                data: dataWAF,
                                type: "json",
                                onComplete: function (dataResp) {
                                    if (connector3DSwym.useWidgetHub) {
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
                                    if (connector3DSwym.useWidgetHub) {
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
                            if (dataResp.result && dataResp.result.ServerToken && dataResp.result.ServerToken !== "" && dataResp.result.tk === "ok") {
                                connector3DSwym._CSRFToken = dataResp.result.ServerToken;
                                connector3DSwym._CSRFTokenLoaded = true;

                                if (typeof callback === "function") {
                                    callback.apply(connector3DSwym, args);
                                }
                            } else {
                                console.error("Error in WebService Response : (no ServerToken for CSRF or tk not === ok)" + JSON.stringify(dataResp));
                            }
                        },
                        //data retrieval error function
                        error: function (error) {
                            console.error("Call Faillure : " + JSON.stringify(error));
                        }
                    };
                    if (connector3DSwym.useWidgetHub) {
                        hub.requestData(hubDef);
                    } else {
                        //Fallback call directly
                        hubDef.request();
                    }
                }
            },

            /**
             * Call 3DSwym sevice
             * The url of 3DSwym will be automatically retrieved and prepend to the url given in the options.
             *
             * @param {Object} options
             */
            call3DSwym: function (options) {
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

                var inputArgs = arguments;
                if (connector3DSwym._Url3DSwym.length <= 1) {
                    connector3DSwym.load3DSwymURL(connector3DSwym.call3DSwym, inputArgs);
                } else if (!connector3DSwym._CSRFTokenLoaded) {
                    connector3DSwym.loadCSRFToken(connector3DSwym.call3DSwym, inputArgs);
                } else {
                    var urlWAF = connector3DSwym._Url3DSwym + options.url;
                    var dataWAF = options.data || {};

                    var headerWAF = options.headers || {};

                    headerWAF["x-ds-swym-csrftoken"] = connector3DSwym._CSRFToken;

                    var methodWAF = options.method || "GET";
                    var typeWAF = options.type;

                    var dataKey4Hub = genDataKey(options);
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

                                    if (connector3DSwym.useWidgetHub) {
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

                                    if (connector3DSwym.useWidgetHub) {
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
                                    throw "Impossible to cast Text to XML in Connector3DSwym.js";
                                }
                                dataResp = xmlDoc;
                            }
                            var headerResp = response.data.headerResp;
                            if (typeof options.onComplete === "function") {
                                options.onComplete(dataResp, headerResp, options.callbackData);
                            }
                            connector3DSwym._retryGetCSRFToken = false;
                        },
                        //data retrieval error function
                        error: function (errorObj) {
                            var error = errorObj.error;
                            var responseDOMString = errorObj.responseDOMString;
                            var headerResp = errorObj.headerResp;
                            if (connector3DSwym._retryGetCSRFToken) {
                                if (typeof options.onFailure === "function") {
                                    options.onFailure(error, responseDOMString, headerResp, options.callbackData);
                                }
                                connector3DSwym._retryGetCSRFToken = false;
                            } else {
                                connector3DSwym._retryGetCSRFToken = true;
                                connector3DSwym.loadCSRFToken(connector3DSwym.call3DSwym, inputArgs);
                            }
                        }
                    };
                    if (connector3DSwym.useWidgetHub) {
                        hub.requestData(hubDef);
                    } else {
                        //Fallback call directly
                        hubDef.request();
                    }
                }
            }
        };
    }
    widget.connector3DSwym = connector3DSwym;
    return connector3DSwym;
});