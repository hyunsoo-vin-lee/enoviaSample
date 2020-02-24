/**
 * BT WW Competencies Center - Fast Prototypes Team
 * @author UM5
 */

function executeWidgetCode() {
    require(["UWA/Drivers/jQuery", "DS/WAFData/WAFData"], function($, WAFData) {
        var myWidget = {
            dataFull: [],

            displayData: function(arrData) {
                var wdgUrl = widget.getUrl();
                wdgUrl = wdgUrl.substring(0, wdgUrl.lastIndexOf("/")) + "/../"; //We should be at 3DSpace/webapps level here

                //Display data in Table
                var tableHTML = "";

                var configPref = widget.getValue("config");
                if (configPref === "Custom") {
                    tableHTML =
                        "<div id='topToolbar' class='toolbar' style='height:24px'><div id='saveCustomConfig' class='toolbarButton'>SavePrefs</div></div><div id='divTable' style='height:calc(100% - 25px);overflow:auto;'><table><thead><tr>";
                } else {
                    tableHTML = "<div id='divTable' style='height:100%;overflow:auto;'><table><thead><tr>";
                }

                //tableHTML="<div id='divTable' style='height:100%;overflow:auto;'><table><thead><tr>";

                var obj1 = arrData[0];
                if (!obj1) {
                    widget.body.innerHTML += "<p>Impossible to display file currently.</p>";
                    return;
                }

                var arrColumnHeaders = arrData[0].split(",");

                for (var i = 0; i < arrColumnHeaders.length; i++) {
                    tableHTML = tableHTML + "<th>" + arrColumnHeaders[i] + "</th>";
                }
                tableHTML = tableHTML + "</tr></thead><tbody>";

                for (var i = 1; i < arrData.length; i++) {
                    var classRow = i % 2 === 0 ? "roweven" : "rowodd";
                    tableHTML = tableHTML + "<tr class='" + classRow + " selectableLine' o='" + arrData[i].id + "'>";

                    var arrColumn = arrData[i].split(",");
                    for (var j = 0; j < arrColumn.length; j++) {
                        var valDisp = arrColumn[j];

                        tableHTML = tableHTML + "<td>" + valDisp + "</td>";
                    }
                    tableHTML = tableHTML + "</tr>";
                }

                tableHTML += "</tbody></table></div>";

                widget.body.innerHTML = tableHTML;

                myWidget.setDnD();

                myWidget.setSelectableLines();

                myWidget.setToolbarButtons();
            },

            onLoadWidget: function() {
                var wdgUrl = widget.getUrl();
                wdgUrl = wdgUrl.substring(0, wdgUrl.lastIndexOf("/"));
                widget.setIcon(wdgUrl + "/assets/icons/Table.png");

                myWidget.getFile();

                myWidget.displayData(myWidget.dataFull);
            },

            onSearchWidget: function(searchQuery) {
                var arrResult = [];
                var searchKeys = widget.getValue("searchKeys").split(",");

                for (var i = 0; i < myWidget.dataFull.length; i++) {
                    var objData = myWidget.dataFull[i];
                    for (var j = 0; j < searchKeys.length; j++) {
                        var searchKey = searchKeys[j].trim();
                        if (objData[searchKey] && objData[searchKey].indexOf(searchQuery) !== -1) {
                            arrResult.push(objData);
                            break;
                        }
                    }
                }
                myWidget.displayData(arrResult);
            },

            onResetSearchWidget: function() {
                myWidget.displayData(myWidget.dataFull);
            },

            getFile: function() {
                //Load CSV
                var urlWAF = widget.getValue("filePath"); //https://3dexp.16xfd04.ds/3DSpace/webapps/UM5CSV/assets/Cost_ProgramIntelligence.csv

                if (!urlWAF || urlWAF === "") {
                    widget.body.innerHTML = "<p>Please specify a file path</p>";
                    return;
                }

                var dataWAF = {};
                var methodWAF = "GET";
                var typeWAF = "text";

                WAFData.request(urlWAF, {
                    method: methodWAF,
                    data: dataWAF,
                    type: typeWAF,
                    onComplete: function(dataResp, headerResp) {
                        widget.body.innerHTML += "<p>Loading file OK... </p>";
                        var arrRes = dataResp.split("\n");
                        myWidget.dataFull = arrRes;
                        myWidget.displayData(myWidget.dataFull);
                    },
                    onFailure: function(error, responseDOMString, headerResp) {
                        widget.body.innerHTML += "<p>Loading file Failure</p>";
                    }
                });
            }
        };

        widget.addEvent("onLoad", myWidget.onLoadWidget);
        widget.addEvent("onRefresh", myWidget.onLoadWidget);
        widget.addEvent("onSearch", myWidget.onSearchWidget);
        widget.addEvent("onResetSearch", myWidget.onResetSearchWidget);
    });
}
