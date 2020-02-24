/**
 * BT WW Competencies Center - Fast Prototypes Team
 * @author UM5
 */
define("UM5Modules/DocumentsWS", ["UM5Modules/Connector3DExp"], function (Connector3DExp) {
    "use strict";

    var DocumentsWS = {

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
                    //Save the CSRF Token if it's there
                    if (dataResp && dataResp.csrf && dataResp.csrf.name === "ENO_CSRF_TOKEN") {
                        DocumentsWS._currentCSRF = dataResp.csrf;
                    }
                    if (dataResp.success) {
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

        //OOTB Documents Web Services

        //Manage the CSRF Token
        _currentCSRF: null,
        _doCallWithCSRF: function (options) {
            if (!options.data) {
                options.data = {};
            }
            if ((!DocumentsWS._currentCSRF || DocumentsWS._currentCSRF === null) && options.method !== "GET") {
                //If it's a GET request CSRF is not needed and we will have a CSRF token available in return
                //Get the CSRF before doing the Call
                DocumentsWS._do3DSpaceCall({
                    url: "/resources/v1/application/CSRF", //KO in 18x ? 19x Only ?
                    method: "GET",
                    forceReload: true,
                    onOk: (data) => {
                        //We have the CSRF Token here
                        DocumentsWS._currentCSRF = data.csrf;
                        //Now do the call
                        DocumentsWS._doCallWithCSRF(options);
                    },
                    onError: (errorType, errorMsg) => {
                        options.onError("Impossible to get CSRF Token due to " + errorType, errorMsg);
                    }
                });
            } else {
                //Do the call directly with the last CSRF Token
                options.data.csrf = DocumentsWS._currentCSRF;
                if (options.method !== "GET") {
                    options.data = JSON.stringify(options.data);
                    options.contentType = "application/json";
                }
                DocumentsWS._do3DSpaceCall(options);
            }
        },

        //Helpers for the Web Services
        getDocInfos: function (docId, options) {
            options.url = "/resources/v1/modeler/documents/" + docId;
            options.method = "GET";
            options.forceReload = true;
            DocumentsWS._doCallWithCSRF(options);
        },

        getDocInfosFiles: function (docId, options) {
            options.url = "/resources/v1/modeler/documents/" + docId + "/files";
            options.method = "GET";
            options.forceReload = true;
            DocumentsWS._doCallWithCSRF(options);
        },

        getDocFileDownloadTicket: function (docId, fileId, options) {
            options.url = `/resources/v1/modeler/documents/${docId}/files/${fileId}/DownloadTicket`;
            options.method = "PUT";
            options.forceReload = true;
            DocumentsWS._doCallWithCSRF(options);
        }

    };
    return DocumentsWS;
});