/**
 * BT WW Competencies Center - Fast Prototypes Team
 * @author UM5
 */

define(
    "UM5Modules/Connector3DExp", ["DS/i3DXCompassServices/i3DXCompassServices", "DS/WAFData/WAFData", "BTWWUtils/WidgetHub_ES6_II2_v1/WidgetHub"],
    function (i3DXCompassServices, WAFData, WidgetHub) {
        var connector3DExp = widget.connector3DExp; //Makes it a single object on the widget level
        if (typeof connector3DExp === "undefined") {
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

            connector3DExp = {
                _widgetPref4Tenants: "platformTenant",

                _tenant: "",

                currentUserInfos: null,

                useWidgetHub: true,

                _urlsLoaded: false,

                _platformInfos: [],

                //Common to all calls to retrieve the Services URLs
                load3DExpURLs: function (callback, args) {
                    connector3DExp._tenant = widget.getValue("x3dPlatformId") || "";

                    var dataKey4Hub = "i3DXCompassServices.getPlatformServices.all";
                    var hubDef = {
                        //a key to identify the data
                        dataKey: dataKey4Hub,
                        //the request method, can be anything, async or not
                        request: function () {
                            //Use a timeout, in case of Run Your App unstrusted, i3DXCompassServices.getPlatformServices will fail without calling onFailure,
                            //this timeout will then be called and we will be able to manage this case on the Widget Side.
                            let timeOutCall = setTimeout(() => {
                                let error = "i3DXCompassServices getPlatformServices : Timeout after 10 seconds.";
                                if (connector3DExp.useWidgetHub) {
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
                            }, 10000);
                            i3DXCompassServices.getPlatformServices({
                                onComplete: function (dataResult) {
                                    clearTimeout(timeOutCall);
                                    //mandatory
                                    //hub.onSuccess(dataKey4Hub, URLResult);
                                    if (connector3DExp.useWidgetHub) {
                                        //mandatory
                                        hub.onSuccess(dataKey4Hub, dataResult);
                                    } else {
                                        hubDef.success({
                                            status: "ok",
                                            data: dataResult,
                                            loader: widget.id,
                                            ts: Date.now()
                                        });
                                    }
                                },
                                onFailure: function (error) {
                                    clearTimeout(timeOutCall);
                                    //mandatory
                                    //hub.onError(dataKey4Hub, error);
                                    if (connector3DExp.useWidgetHub) {
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
                            var dataResult = response.data;

                            if (typeof dataResult !== "undefined") {
                                connector3DExp._platformInfos = dataResult;

                                let prefTenants = widget.getPreference(connector3DExp._widgetPref4Tenants);
                                if (typeof prefTenants === "undefined") {
                                    //Create it
                                    widget.addPreference({
                                        name: connector3DExp._widgetPref4Tenants,
                                        type: "hidden",
                                        label: "3DEXPERIENCE Platform",
                                        defaultValue: connector3DExp._tenant
                                    });
                                }

                                let lastTenantSelected = widget.getValue(connector3DExp._widgetPref4Tenants);
                                let bLastSelectedTenantExists = false; //To check if it's still in the list for the currently connected user

                                prefTenants = widget.getPreference(connector3DExp._widgetPref4Tenants);
                                prefTenants.type = "list";

                                prefTenants.options = [];

                                let arrInfos = connector3DExp._platformInfos;

                                for (let i = 0; i < arrInfos.length; i++) {
                                    const platformInfo = arrInfos[i];
                                    let platformId = platformInfo.platformId;
                                    let platformName = platformInfo.displayName;
                                    prefTenants.options.push({
                                        value: platformId,
                                        label: platformName
                                    });
                                    if (platformId === lastTenantSelected) {
                                        bLastSelectedTenantExists = true;
                                    }
                                }

                                if (!bLastSelectedTenantExists) {
                                    prefTenants.defaultValue = arrInfos[0].platformId;
                                } else {
                                    prefTenants.defaultValue = lastTenantSelected;
                                }

                                connector3DExp._tenant = prefTenants.defaultValue;

                                //Add Change Event
                                prefTenants.onchange = "onChangeConnector3DExpTenant";
                                widget.addEvent("onChangeConnector3DExpTenant", connector3DExp.onChangeConnector3DExpTenant); //For change of Table Config in list

                                //Plug or update the Preference
                                widget.addPreference(prefTenants);
                                widget.setValue(connector3DExp._widgetPref4Tenants, prefTenants.defaultValue); //Set the correct selected Value for the tenant (fixed here 13/08/2018)

                                connector3DExp._urlsLoaded = true;

                                connector3DExp.loadSecCtx(); //To load the right Collab Spaces preferences
                            }
                            if (typeof callback === "function") {
                                callback.apply(connector3DExp, args);
                            }
                        },
                        //data retrieval error function
                        error: function (error) {
                            alert("Impossible to retrieve 3DSpace Service URL" + error);
                        }
                    };
                    if (connector3DExp.useWidgetHub) {
                        hub.requestData(hubDef);
                    } else {
                        //Fallback call directly
                        hubDef.request();
                    }
                },

                onChangeConnector3DExpTenant: function (namePref, valuePref) {
                    if (namePref === connector3DExp._widgetPref4Tenants) {
                        connector3DExp._tenant = valuePref;
                        connector3DExp._SecCtxLoaded = false;
                        connector3DExp.loadSecCtx(() => {
                            //Dispatch onEdit to refresh the preference panel
                            widget.dispatchEvent("onEdit");
                        }); //To load the right Collab Spaces preferences
                    }
                },

                getCurrentTenantInfo: function () {
                    return this.getTenantInfoForPlatform(connector3DExp._tenant);
                },

                getTenantInfoForPlatform: function (platformId) {
                    let objTenantInfo = null;
                    for (let i = 0; i < connector3DExp._platformInfos.length; i++) {
                        const platfInfo = connector3DExp._platformInfos[i];
                        if (platfInfo.platformId === platformId) {
                            objTenantInfo = platfInfo;
                            break;
                        }
                    }
                    return objTenantInfo;
                },

                //3DSpace call code

                _widgetPref4Ctx: "ctx",
                _SecCtxLoaded: false,

                loadSecCtx: function (callback, args) {
                    if (!connector3DExp._urlsLoaded) {
                        connector3DExp.load3DExpURLs(connector3DExp.loadSecCtx, args);
                    } else {
                        let url3DSpace = connector3DExp.getCurrentTenantInfo()["3DSpace"];
                        if (typeof url3DSpace === "undefined") {
                            //No 3DSpace url for the currently selected Tenant
                            //Hide the Collab Space pref
                            widget.addPreference({
                                name: connector3DExp._widgetPref4Ctx,
                                type: "hidden",
                                label: "3DSpace Collaborative Space",
                                defaultValue: ""
                            });
                            widget.setValue(connector3DExp._widgetPref4Ctx, "");

                            if (connector3DExp.currentUserInfos) {
                                //Delete the Security context related keys
                                delete connector3DExp.currentUserInfos.preferredcredentials;
                                delete connector3DExp.currentUserInfos.collabspaces;
                            }
                            if (typeof callback === "function") {
                                callback.apply(connector3DExp, args);
                            }
                        } else {
                            //Call 3DSpace and get the Contexts
                            var urlWAF = url3DSpace + "/resources/modeler/pno/person?current=true&select=preferredcredentials&select=collabspaces&select=firstname&select=lastname" + "&tenant=" + connector3DExp._tenant;
                            var dataWAF = {};
                            var headerWAF = {
                                SecurityContext: "" //,
                                //tenant: connector3DExp._tenant
                            };
                            var methodWAF = "GET";

                            var dataKey4Hub = genDataKey({
                                url: urlWAF,
                                method: methodWAF,
                                headers: headerWAF,
                                data: dataWAF,
                                type: "json"
                            });

                            var hubDef = {
                                //a key to identify the data
                                dataKey: dataKey4Hub,
                                //the request method, can be anything, async or not
                                request: function () {
                                    WAFData.authenticatedRequest(urlWAF, {
                                        //WAFData.proxifiedRequest(urlWAF, {
                                        method: methodWAF,
                                        headers: headerWAF,
                                        data: dataWAF,
                                        type: "json",
                                        onComplete: function (dataResp) {
                                            //mandatory
                                            //hub.onSuccess(dataKey4Hub, dataResp);
                                            if (connector3DExp.useWidgetHub) {
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
                                            if (connector3DExp.useWidgetHub) {
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

                                    connector3DExp.currentUserInfos = {
                                        name: dataResp.name,
                                        firstname: dataResp.firstname,
                                        lastname: dataResp.lastname,
                                        preferredcredentials: dataResp.preferredcredentials,
                                        collabspaces: dataResp.collabspaces
                                    };
                                    connector3DExp._SecCtxLoaded = true;


                                    //Check that the preference, used to display the Security Contexts (SC), is existing
                                    var prefCtx = widget.getPreference(connector3DExp._widgetPref4Ctx);
                                    if (typeof prefCtx === "undefined") {
                                        //Create it
                                        widget.addPreference({
                                            name: connector3DExp._widgetPref4Ctx,
                                            type: "hidden",
                                            label: "3DSpace Collaborative Space",
                                            defaultValue: ""
                                        });
                                    }

                                    //Load widget Pref

                                    //Get last Selected SC
                                    var lastCtxSelected = widget.getValue(connector3DExp._widgetPref4Ctx);
                                    var bLastSCExist = false; //To check that it's still in the list

                                    prefCtx = widget.getPreference(connector3DExp._widgetPref4Ctx);
                                    prefCtx.type = "list";

                                    prefCtx.options = [];

                                    //Build the list of Security Contexts available for the user
                                    var arrOfSCs = [];

                                    var arrOfCollabSpace = connector3DExp.currentUserInfos.collabspaces;
                                    for (var i = 0; i < arrOfCollabSpace.length; i++) {
                                        var objCollabSpace = arrOfCollabSpace[i];
                                        var arrCouples = objCollabSpace.couples;
                                        for (var j = 0; j < arrCouples.length; j++) {
                                            var objCouple = arrCouples[j];
                                            var organization = objCouple.organization.name;
                                            var roleSC = objCouple.role.name;
                                            var roleDisp = objCouple.role.nls || roleSC;

                                            var scHere = {
                                                disp: roleDisp + "." + organization + "." + objCollabSpace.name,
                                                value: roleSC + "." + organization + "." + objCollabSpace.name
                                            };
                                            arrOfSCs.push(scHere);
                                            if (lastCtxSelected === scHere.value) {
                                                bLastSCExist = true;
                                            }
                                        }
                                    }

                                    //Fill the pref options list
                                    for (i = 0; i < arrOfSCs.length; i++) {
                                        var arrSec = arrOfSCs[i];
                                        prefCtx.options.push({
                                            value: arrSec.value,
                                            label: arrSec.disp
                                        });
                                    }

                                    if (!bLastSCExist) {
                                        var objPreferredSC = connector3DExp.currentUserInfos.preferredcredentials;
                                        prefCtx.defaultValue = objPreferredSC.role.name + "." + objPreferredSC.organization.name + "." + objPreferredSC.collabspace.name;
                                    } else {
                                        prefCtx.defaultValue = lastCtxSelected;
                                    }

                                    widget.addPreference(prefCtx);
                                    widget.setValue(connector3DExp._widgetPref4Ctx, prefCtx.defaultValue); //Set the correct selected Value

                                    //Done, now call the real Web Service
                                    if (typeof callback === "function") {
                                        callback.apply(connector3DExp, args);
                                    }

                                },
                                //data retrieval error function
                                error: function (error) {
                                    console.error("Call Faillure to retrieve Security Context: ", error);
                                }
                            };
                            if (connector3DExp.useWidgetHub) {
                                hub.requestData(hubDef);
                            } else {
                                //Fallback call directly
                                hubDef.request();
                            }
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

                    if (!connector3DExp._urlsLoaded) {
                        connector3DExp.load3DExpURLs(connector3DExp.call3DSpace, arguments);
                    } else if (!connector3DExp._SecCtxLoaded) {
                        connector3DExp.loadSecCtx(connector3DExp.call3DSpace, arguments);
                    } else {
                        let url3DSpace = connector3DExp.getCurrentTenantInfo()["3DSpace"];
                        var urlWAF = url3DSpace + options.url;
                        if (urlWAF.indexOf("?") === -1) {
                            urlWAF += "?tenant=";
                        } else {
                            urlWAF += "&tenant=";
                        }
                        urlWAF += connector3DExp._tenant;

                        var dataWAF = options.data || {};

                        var strCtx = widget.getValue(connector3DExp._widgetPref4Ctx);
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

                        var dataKey4Hub = genDataKey(options) + "/tenant:" + connector3DExp._tenant + "/sc:" + strCtx;

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
                                    responseType: options.responseType,
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
                                        if (connector3DExp.useWidgetHub) {
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
                                        if (connector3DExp.useWidgetHub) {
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
                                        throw "Impossible to cast Text to XML in connector3DExp.js";
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
                                var responseDOMString = error.responseDOMString; //errorObj to error
                                var headerResp = error.headerResp; //errorObj to error
                                if (typeof options.onFailure === "function") {
                                    options.onFailure(error, responseDOMString, headerResp, options.callbackData);
                                }
                            }
                        };

                        if (connector3DExp.useWidgetHub) {
                            hub.requestData(hubDef);
                        } else {
                            //Fallback call directly
                            hubDef.request();
                        }
                    }
                },


                //3DSwym call Code

                _SwymCSRFTokenLoaded: false,
                _SwymCSRFToken: "",
                _retryGetSwymCSRFToken: false,

                loadCSRFToken: function (callback, args) {
                    if (!connector3DExp._urlsLoaded) {
                        connector3DExp.load3DExpURLs(connector3DExp.loadCSRFToken, args);
                    } else {
                        let url3DSwym = connector3DExp.getCurrentTenantInfo()["3DSwym"];
                        var urlWAF = url3DSwym + "/api/index/tk";
                        var dataWAF = {};
                        var headerWAF = {};
                        var methodWAF = "GET";

                        var dataKey4Hub = urlWAF;

                        var hubDef = {
                            //a key to identify the data
                            dataKey: dataKey4Hub,
                            forceReload: connector3DExp._retryGetSwymCSRFToken,
                            //the request method, can be anything, async or not
                            request: function () {
                                WAFData.authenticatedRequest(urlWAF, {
                                    method: methodWAF,
                                    headers: headerWAF,
                                    data: dataWAF,
                                    type: "json",
                                    onComplete: function (dataResp) {
                                        if (connector3DExp.useWidgetHub) {
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
                                        if (connector3DExp.useWidgetHub) {
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
                                    connector3DExp._SwymCSRFToken = dataResp.result.ServerToken;
                                    connector3DExp._SwymCSRFTokenLoaded = true;

                                    if (typeof callback === "function") {
                                        callback.apply(connector3DExp, args);
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
                        if (connector3DExp.useWidgetHub) {
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
                     * contentType
                     * responseType
                     * callbackData
                     * onComplete
                     * onFailure
                     * forceReload
                     */

                    var inputArgs = arguments;
                    if (!connector3DExp._urlsLoaded) {
                        connector3DExp.load3DExpURLs(connector3DExp.call3DSwym, inputArgs);
                    } else if (!connector3DExp._SwymCSRFTokenLoaded) {
                        connector3DExp.loadCSRFToken(connector3DExp.call3DSwym, inputArgs);
                    } else {
                        let url3DSwym = connector3DExp.getCurrentTenantInfo()["3DSwym"];
                        var urlWAF = url3DSwym + options.url;
                        var dataWAF = options.data || {};

                        var headerWAF = options.headers || {};

                        headerWAF["x-ds-swym-csrftoken"] = connector3DExp._SwymCSRFToken;

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
                                    responseType: options.responseType,
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

                                        if (connector3DExp.useWidgetHub) {
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

                                        if (connector3DExp.useWidgetHub) {
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
                                connector3DExp._retryGetSwymCSRFToken = false;
                            },
                            //data retrieval error function
                            error: function (errorObj) {
                                var error = errorObj.error;
                                var responseDOMString = errorObj.responseDOMString;
                                var headerResp = errorObj.headerResp;
                                if (connector3DExp._retryGetSwymCSRFToken) {
                                    if (typeof options.onFailure === "function") {
                                        options.onFailure(error, responseDOMString, headerResp, options.callbackData);
                                    }
                                    connector3DExp._retryGetSwymCSRFToken = false;
                                } else {
                                    connector3DExp._retryGetSwymCSRFToken = true;
                                    connector3DExp.loadCSRFToken(connector3DExp.call3DSwym, inputArgs);
                                }
                            }
                        };
                        if (connector3DExp.useWidgetHub) {
                            hub.requestData(hubDef);
                        } else {
                            //Fallback call directly
                            hubDef.request();
                        }
                    }
                },

                //3DDrive call code - On Cloud only - fallback with modification of 3DSpace url to get 3DDrive url

                get3DDriveFileUrl: function (options) {
                    /**
                     * options :
                     * envId,
                     * fileId,
                     * onComplete
                     * onFailure
                     */
                    var inputArgs = arguments;
                    if (!connector3DExp._urlsLoaded) {
                        connector3DExp.load3DExpURLs(connector3DExp.get3DDriveFileUrl, inputArgs);
                    } else {
                        let envInfos = connector3DExp.getTenantInfoForPlatform(options.envId);
                        if (!envInfos) {
                            //Call On Error callback indicating that envId isn't valid
                            let failFct = options.onFailure;
                            if (typeof failFct === "function") {
                                failFct("Invalid 3DDrive EnvId", `No Platform info for envId: ${options.envId}`);
                            }
                        } else {
                            let url3DDrive = envInfos["3DDrive"];
                            if (!url3DDrive || url3DDrive === "") {
                                //Try to use 3DSpace url
                                url3DDrive = envInfos["3DSpace"];
                                url3DDrive = url3DDrive.replace("-eu1-space.", "-eu1-drive.");
                            }
                            if (!url3DDrive || url3DDrive === "") {
                                //Call On Error callback indicating that 3DDrive isn't available
                                let failFct = options.onFailure;
                                if (typeof failFct === "function") {
                                    failFct("No 3DDrive Url", `No 3DDrive url found for the envId: ${options.envId}`);
                                }
                            } else {
                                //Call 3DDrive
                                //WAFData.authenticatedRequest(url3DDrive + `/resources/3ddrive/v1/bos/${options.fileId}/fileurl?tenant=${options.envId}`, {
                                WAFData.authenticatedRequest(url3DDrive + `/resources/3ddrive/v1/bos/${options.fileId}/fileurl?tenant=${options.envId}`, {
                                    method: "GET",
                                    headers: {},
                                    data: {},
                                    type: "json",
                                    onComplete: function (dataResp) {
                                        //Got the url, get the file and return it
                                        let urlFile = dataResp.url;
                                        let completeFct = options.onComplete;
                                        if (typeof completeFct === "function") {
                                            completeFct(urlFile, dataResp.extension);
                                        }
                                    },
                                    onFailure: function (error, responseDOMString, headerResp) {
                                        var errorObj = {
                                            error: error,
                                            responseDOMString: responseDOMString,
                                            headerResp: headerResp
                                        };
                                        let failFct = options.onFailure;
                                        if (typeof failFct === "function") {
                                            failFct("Error on 3DDrive Get File Url", errorObj);
                                        }
                                    }
                                });
                            }
                        }
                    }
                }
            };
        }
        widget.connector3DExp = connector3DExp;
        return connector3DExp;
    }
);