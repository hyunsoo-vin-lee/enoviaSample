/**
 * BT WW Competencies Center - Fast Prototypes Team
 * @author UM5
 */
/* eslint no-console:"off" */
function executeWidgetCode() {
    require(["UWA/Drivers/jQuery", "DS/WAFData/WAFData", "DS/DataDragAndDrop/DataDragAndDrop"], function($, WAFData, DataDragAndDrop) {
        var myWidget = {
            dataFull: [],

            displayData: function() {
                //var wdgUrl = widget.getUrl();
                //wdgUrl = wdgUrl.substring(0, wdgUrl.lastIndexOf("/")) + "/../"; //We should be at 3DSpace/webapps level here

                //Display data in Table
                var tableHTML = "<div id='divTable' style='height:100%;overflow:auto;'>Drop here !";

                tableHTML += "</div>";

                widget.body.innerHTML = tableHTML;

                myWidget.setDnD();
            },

            setDnD: function() {
                var $divTable = $("#divTable");
                if ($divTable.length > 0) {
                    var elemDivTable = $divTable.get(0);
                    DataDragAndDrop.droppable(elemDivTable, {
                        drop: function(data, elem, event) {
                            console.log("DataDragAndDrop - data=");
                            console.log(data);
                            console.log("DataDragAndDrop - elem=");
                            console.log(elem);
                            console.log("DataDragAndDrop - event=");
                            console.log(event);

                            if (event.dataTransfer && event.dataTransfer.types) {
                                for (var i = 0; i < event.dataTransfer.types.length; i++) {
                                    var dndType = event.dataTransfer.types[i];
                                    var val = event.dataTransfer.getData(dndType);
                                    console.log("drop type : " + dndType + ", val =");
                                    console.log(val);
                                }
                            }
                        }
                    });
                    /*$divTable.each(function(){
					var elem=this;
					var $elem4DnD = $(elem);
					$elem4DnD.on("dragenter",function(event){
						console.log("dragenter - event = ");
						console.log(event);
					});
					$elem4DnD.on("dragover",function(event){
						console.log("dragover - event = ");
						console.log(event);
					});
					$elem4DnD.on("dragleave",function(event){
						console.log("dragleave - event = ");
						console.log(event);
					});
					$elem4DnD.on("drop",function(event){
						console.log("drop - event = ");
						console.log(event);
					});
				});*/
                }
            },

            onLoadWidget: function() {
                var wdgUrl = widget.getUrl();
                wdgUrl = wdgUrl.substring(0, wdgUrl.lastIndexOf("/"));

                widget.setIcon(wdgUrl + "/../UM5Modules/assets/icons/custom-widget-icon.png");

                widget.setTitle("DnD Tester");

                myWidget.displayData(myWidget.dataFull);
            }
        };

        widget.addEvent("onLoad", myWidget.onLoadWidget);
        widget.addEvent("onRefresh", myWidget.onLoadWidget);
    });
}
