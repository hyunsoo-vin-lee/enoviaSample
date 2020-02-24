/*
 * BT WW Competencies Center - Fast Prototypes Team
 * @author UM5
 */

function executeWidgetCode() {
    require(["UWA/Drivers/jQuery", "BTWWSemanticUI/SemanticUITable_ES5_UM5_v1/SemanticUITable"], function($, SemanticUITable) {
        var myWidget = {
            // Widget Events
            onLoadWidget: function() {
                var tableUI = new SemanticUITable({
                    id: "um5Test",
                    config: {
                        columns: [
                            {
                                header: "ID",
                                cell: function cell(rowObject) {
                                    return rowObject.id;
                                }
                            },
                            {
                                header: "Name",
                                cell: function cell(rowObject) {
                                    return rowObject.name;
                                }
                            }
                        ]
                    }
                });
                $(widget.body).empty();
                $(widget.body).append(tableUI.$table);

                tableUI.addRows([{ id: 0, name: "Test 1" }, { id: 1, name: "Test 2" }, { id: 2, name: "Test 3" }, { id: 3, name: "Test 4" }]);
            }
        };

        widget.addEvent("onLoad", myWidget.onLoadWidget);
        //widget.addEvent("onRefresh", myWidget.onLoadWidget);
        //widget.addEvent("onSearch", myWidget.onSearchWidget);
        //widget.addEvent("onResetSearch", myWidget.onResetSearchWidget);

        //widget.addEvent("onConfigChange", myWidget.onConfigChange); //For change of Table Config in list
    });
}
