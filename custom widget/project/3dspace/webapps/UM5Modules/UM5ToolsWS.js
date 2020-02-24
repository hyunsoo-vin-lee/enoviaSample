/**
 * BT WW Competencies Center - Fast Prototypes Team
 * @author UM5
 */
define("UM5Modules/UM5ToolsWS", ["UM5Modules/Connector3DExp"], function (Connector3DExp) {
    "use strict";

    var UM5ToolsWS = {
        _do3DSpaceCall: function (optionsin) {
            let options = optionsin;
            Connector3DExp.call3DSpace({
                url: options.url,
                method: options.method || "POST",
                type: options.type || "json",
                headers: options.headers,
                data: options.data,
                callbackData: options.callbackData,
                forceReload: options.forceReload,
                responseType: options.responseType,
                onComplete: function (dataResp, headerResp, callbackData) {
                    if (dataResp.msg === "OK") {
                        options.onOk(dataResp.data, callbackData);
                    } else {
                        var errorType = "Error in Web Service Response " + options.url;
                        var errorMsg = JSON.stringify(dataResp);
                        options.onError(errorType, errorMsg);
                    }
                },
                onFailure: function (error) {
                    var errorType = "WebService Call Faillure " + options.url;
                    var errorMsg = JSON.stringify(error);
                    options.onError(errorType, errorMsg);
                }
            });
        },
        get3DSpaceURL: function () {
            return Connector3DExp.getCurrentTenantInfo()["3DSpace"];
        },

        //Objects Services

        find: function (options) {
            options.url = "/UM5Tools/Find";
            UM5ToolsWS._do3DSpaceCall(options);
        },
        expand: function (options) {
            options.url = "/UM5Tools/ExpandObject";
            UM5ToolsWS._do3DSpaceCall(options);
        },
        objInfo: function (options) {
            options.url = "/UM5Tools/ObjectInfo";
            UM5ToolsWS._do3DSpaceCall(options);
        },
        objUpdateAttributes: function (oid, mapAttrs, options) {
            options.url = "/UM5Tools/UpdateAttributes/" + oid;
            options.data = JSON.stringify(mapAttrs);
            options.headers = {
                "Content-Type": "application/json"
            };
            options.method = "PUT";
            UM5ToolsWS._do3DSpaceCall(options);
        },
        relInfo: function (options) {
            options.url = "/UM5Tools/RelationshipInfo";
            UM5ToolsWS._do3DSpaceCall(options);
        },

        //Types Services

        listTypes: function (typePattern, options) {
            options.url = "/UM5Tools/Type/list/" + typePattern;
            UM5ToolsWS._do3DSpaceCall(options);
        },
        typeFromRel: function (type, options) {
            options.url = "/UM5Tools/Type/" + type + "/fromrel";
            UM5ToolsWS._do3DSpaceCall(options);
        },
        typeToRel: function (type, options) {
            options.url = "/UM5Tools/Type/" + type + "/torel";
            UM5ToolsWS._do3DSpaceCall(options);
        },
        typeIcon: function (type, options) {
            options.url = "/UM5Tools/Type/" + type + "/icon";
            UM5ToolsWS._do3DSpaceCall(options);
        },
        typeAttributes: function (type, options) {
            options.url = "/UM5Tools/Type/" + type + "/attributes";
            UM5ToolsWS._do3DSpaceCall(options);
        },
        typePolicies: function (type, options) {
            options.url = "/UM5Tools/Type/" + type + "/policies";
            UM5ToolsWS._do3DSpaceCall(options);
        },
        typeCreateObject: function (type, name, revision, policy, options) {
            if (!name || name === "") {
                name = "_autoname";
            }
            if (!revision || revision === "") {
                revision = "_autonameRevision";
            }
            options.url = "/UM5Tools/Type/" + type + "/" + name + "/" + revision + "/" + policy;
            options.method = "PUT";
            UM5ToolsWS._do3DSpaceCall(options);
        },

        //Rels Services

        addConnection: function (fromId, relType, toId, options) {
            options.url = "/UM5Tools/Relationship/connect/" + fromId + "/" + relType + "/" + toId;
            UM5ToolsWS._do3DSpaceCall(options);
        },
        removeConnection: function (relId, options) {
            options.url = "/UM5Tools/Relationship/disconnect/" + relId;
            UM5ToolsWS._do3DSpaceCall(options);
        },
        relFromType: function (relType, options) {
            options.url = "/UM5Tools/Relationship/" + relType + "/fromtype";
            UM5ToolsWS._do3DSpaceCall(options);
        },
        relToType: function (relType, options) {
            options.url = "/UM5Tools/Relationship/" + relType + "/totype";
            UM5ToolsWS._do3DSpaceCall(options);
        },

        //UI Conf Services

        uiConfList: function (confType, options) {
            options.url = "/UM5Tools/uiconf/v1/list/" + confType;
            options.method = "POST";
            UM5ToolsWS._do3DSpaceCall(options);
        },
        uiConfCreate: function (confType, confName, confContent, options) {
            options.url = "/UM5Tools/uiconf/v1/create/" + confType + "/" + confName;
            options.data = JSON.stringify(confContent);
            options.headers = {
                "Content-Type": "application/json"
            };
            options.method = "POST";
            UM5ToolsWS._do3DSpaceCall(options);
        },
        uiConfUpdate: function (confPID, confContent, options) {
            options.url = "/UM5Tools/uiconf/v1/update/" + confPID;
            options.data = JSON.stringify(confContent);
            options.headers = {
                "Content-Type": "application/json"
            };
            options.method = "POST";
            UM5ToolsWS._do3DSpaceCall(options);
        },
        uiConfDelete: function (confPID, options) {
            options.url = "/UM5Tools/uiconf/v1/update/" + confPID;
            options.method = "DELETE";
            UM5ToolsWS._do3DSpaceCall(options);
        },
        uiConfContent: function (confPID, options) {
            options.url = "/UM5Tools/uiconf/v1/getConf/" + confPID;
            options.method = "GET";
            UM5ToolsWS._do3DSpaceCall(options);
        }
    };
    return UM5ToolsWS;
});