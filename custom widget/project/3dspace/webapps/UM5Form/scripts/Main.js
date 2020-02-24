/**
 * BT WW Competencies Center - Fast Prototypes Team
 * @author UM5
 */

function executeWidgetCode() {
    require([
        "UWA/Drivers/jQuery",
        "DS/PlatformAPI/PlatformAPI",
        "DS/DataDragAndDrop/DataDragAndDrop",
        "UM5Modules/Connector3DSpace",
        "UM5Modules/PreferencesSetManager"
    ], function (
        $,
        PlatformAPI,
        DataDragAndDrop,
        Connector3DSpace,
        PreferencesSetManager
    ) {
        var myWidget = {

            dataFull: [],
            oidsRoots: [],

            displayData: function (arrData) {
                console.log("displayData");

                var formHTML = "";

                //Generate Display
                var configPref = widget.getValue("config");
                if (configPref === "Custom") {
                    formHTML = "<div id='topToolbar' class='toolbar' style='height:24px'><div id='saveCustomConfig' class='toolbarButton'>SavePrefs</div></div><div id='divForm' style='height:calc(100% - 25px);overflow:auto;'>";
                } else {
                    formHTML = "<div id='divForm' style='height:100%;overflow:auto;'>";
                }

                if (arrData.length === 0) {
                    formHTML += "<div style='margin:10px;text-align:center;'>Drop Object here or Select Object to start</div>";
                } else {
                    formHTML += "<table><thead>";
                    try {
                        var arrFormConfig = JSON.parse(widget.getValue("formConfig"));

                        var wdgUrl = widget.getUrl();
                        wdgUrl = wdgUrl.substring(0, wdgUrl.lastIndexOf("/")) + "/../"; //We should be at 3DSpace/webapps level here

                        //Headers

                        for (var j = 0; j < arrData.length + 1; j++) {
                            formHTML += "<th class='formHead'></th>";
                        }
                        formHTML += "</tr></thead><tbody>";

                        //Display
                        for (var i = 0; i < arrFormConfig.length; i++) {
                            var config = arrFormConfig[i];
                            if (config.type === "select") {
                                var keyObj = config.value;
                                var label = config.label || keyObj;
                                formHTML += "<tr class='formLine'><td class='formHeader'>" + label + "</td>";
                                for (var j = 0; j < arrData.length; j++) {
                                    var obj = arrData[j];
                                    var valDisp = obj[keyObj] || "";

                                    var valueObjNls = obj["nls!" + keyObj];
                                    if (null !== valueObjNls && typeof valueObjNls !== "undefined" && valueObjNls !== "") {
                                        valDisp = valueObjNls;
                                    }

                                    if (keyObj.indexOf("JPO-") === 0) {
                                        //Test if we have images to adjust the src url
                                        var idxSrc = valDisp.indexOf("src=");
                                        if (idxSrc !== -1) {
                                            var quoteSymb = valDisp.substring(idxSrc + 4, idxSrc + 5);
                                            var idxEndSrc = valDisp.indexOf(quoteSymb, idxSrc + 5);

                                            var beforeSrc = valDisp.substring(0, idxSrc + 5);
                                            var originalSrc = valDisp.substring(idxSrc + 5, idxEndSrc);
                                            var afterSrc = valDisp.substring(idxEndSrc);

                                            valDisp = beforeSrc + wdgUrl + originalSrc + afterSrc;
                                        }
                                    }
                                    formHTML += "<td class='formValue'>" + valDisp + "</td>";
                                }
                                formHTML += "</tr>";
                            }
                        }
                    } catch (err) {
                        console.error(err);
                        formHTML += "<div style='margin:10px;text-align:center;'>Issue will generating display please check the Form Setup preference</div>";
                    }
                    formHTML += "</tbody></table>";
                }

                formHTML += "</div>";

                //Save Scroll Position
                var $divForm = $("#divForm");
                var scrollY = 0;
                if ($divForm.length > 0) {
                    scrollY = $divForm.get(0).scrollTop;
                }

                //Set Content
                widget.body.innerHTML = formHTML;

                //Set Scroll Position back
                $divForm = $("#divForm");
                $divForm.get(0).scrollTop = scrollY;

                myWidget.setDnD();
                myWidget.setToolbarButtons();
            },

            setDnD: function () {
                console.log("setDnD");
                var $divForm = $("#divForm");
                if ($divForm.length > 0) {
                    var elemDivForm = $divForm.get(0);
                    DataDragAndDrop.droppable(elemDivForm, {
                        drop: function (data) {
                            var dataDnD = JSON.parse(data);
                            if (widget.id !== dataDnD.widgetId && dataDnD.sourceDnD === "Table") {
                                var oidDropped = dataDnD.objectId;
                                if (myWidget.oidsRoots.indexOf(oidDropped) === -1) {
                                    myWidget.loadRootData([oidDropped]);
                                    myWidget.oidsRoots.push(oidDropped);
                                    widget.setValue("oidsLoaded", myWidget.oidsRoots.join(","));
                                } else {
                                    alert("The Object is already added as a root in this table");
                                }
                            }
                        }
                    });
                }
            },

            setToolbarButtons: function () {
                console.log("setToolbarButtons");
                var configPref = widget.getValue("config");
                if (configPref === "Custom") {
                    $("#saveCustomConfig").each(function () {
                        var elem = this;
                        $(elem).on("click", function (event) {
                            PreferencesSetManager.saveCustomPrefs();
                        });
                    });
                }
            },

            selectObject: function (dataSelect) {
                console.log("selectObject");

                var wdgId = dataSelect.widgetId;
                if (widget.id === wdgId) return; //Ignore event when it's coming from the widget itself


                var strOid = dataSelect.objectId;
                var isSelected = dataSelect.isSelected;
                if (isSelected) {
                    var idxOid = myWidget.oidsRoots.indexOf(strOid);
                    if (idxOid === -1) {
                        myWidget.loadRootData([strOid]);
                        myWidget.oidsRoots.push(strOid);
                        widget.setValue("oidsLoaded", myWidget.oidsRoots.join(","));
                    }
                } else {
                    var idxOid = myWidget.oidsRoots.indexOf(strOid);
                    if (idxOid !== -1) {
                        //Remove it ?
                        myWidget.removeRootId(strOid);
                    }
                }
            },

            removeRootId: function (oidToRemove) {
                var idxArrRoots = myWidget.oidsRoots.indexOf(oidToRemove);
                if (idxArrRoots !== -1) {
                    myWidget.oidsRoots.splice(idxArrRoots, 1);
                    widget.setValue("oidsLoaded", myWidget.oidsRoots.join(","));
                    for (var i = 0; i < myWidget.dataFull.length; i++) {
                        var objTest = myWidget.dataFull[i];
                        if (objTest.id === oidToRemove) {
                            myWidget.dataFull.splice(i, 1);
                            i--;
                        }
                    }
                }
                myWidget.displayData(myWidget.dataFull);
            },

            onLoadWidget: function () {
                console.log("onLoadWidget");
                var wdgUrl = widget.getUrl();
                wdgUrl = wdgUrl.substring(0, wdgUrl.lastIndexOf("/"));
                widget.setIcon(wdgUrl + "/assets/icons/Form.png");

                var strOids = widget.getValue("oidsLoaded");
                //console.log("strOids="+strOids);
                if (strOids !== "") {
                    var arrOids = strOids.split(",");
                    myWidget.oidsRoots = arrOids;
                    myWidget.loadRootData(arrOids);
                } else {
                    myWidget.displayData(myWidget.dataFull); //Display empty table for a start
                }

                PlatformAPI.subscribe("Select_Object", myWidget.selectObject);

                PreferencesSetManager.setupConfig("UM5Form", [{
                    name: "configName",
                    noSave: true
                }, "selects", "formConfig", "searchKeys"]);
                PreferencesSetManager.loadPrefConfigs();
            },

            loadRootData: function (oids) {
                console.log("loadRootData with oids=");
                console.log(oids);
                if (typeof oids === "undefined") return;

                var opts = {
                    url: "/UM5Tools/ObjectInfo",
                    method: "POST",
                    type: "json",
                    data: {
                        "action": "getInfos",
                        "objectIds": oids.join(","),
                        "selects": widget.getValue("selects")
                    },
                    onComplete: function (dataResp) {
                        if (dataResp.msg === "OK") {
                            var arrDataObjs = dataResp.data;


                            for (var i = 0; i < arrDataObjs.length; i++) {
                                var doAdd = true;
                                var inObj = arrDataObjs[i];
                                for (var j = 0; j < myWidget.dataFull.length; j++) {
                                    var testObj = myWidget.dataFull[j];
                                    if (testObj.id === inObj.id) {
                                        //Update already loaded object
                                        for (var keyIn in inObj) {
                                            testObj[keyIn] = inObj[keyIn];
                                        }
                                        doAdd = false;
                                    }
                                }
                                if (doAdd) {
                                    myWidget.dataFull.push(inObj);
                                }
                            }

                            myWidget.displayData(myWidget.dataFull);
                            //console.log(myWidget.dataFull);
                        } else {
                            widget.body.innerHTML += "<p>Error in WebService Response</p>";
                            widget.body.innerHTML += "<p>" + JSON.stringify(dataResp) + "</p>";
                            console.error("Call Faillure : " + JSON.stringify(dataResp));
                        }
                    },
                    onFailure: function (error) {
                        widget.body.innerHTML += "<p>Call Faillure</p>";
                        widget.body.innerHTML += "<p>" + JSON.stringify(error) + "</p>";
                        console.error("Call Faillure : " + JSON.stringify(error));
                    }
                };

                Connector3DSpace.call3DSpace(opts);
            },

            onConfigChange: function (namePref, valuePref) {
                PreferencesSetManager.onConfigChange(namePref, valuePref);
            }

        };

        widget.addEvent("onLoad", myWidget.onLoadWidget);
        widget.addEvent("onRefresh", myWidget.onLoadWidget);

        widget.addEvent("onConfigChange", myWidget.onConfigChange); //For change of Table Config in list
    });
}