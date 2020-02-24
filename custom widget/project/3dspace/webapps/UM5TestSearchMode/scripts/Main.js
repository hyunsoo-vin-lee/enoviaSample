/*
 * BT WW Competencies Center - Fast Prototypes Team
 * @author UM5
 */

function executeWidgetCode() {
    require(["UWA/Drivers/jQuery"], function ($) {
        var myWidget = {
            // Widget Events
            onLoadWidget: function () {
                var wdgUrl = widget.getUrl();
                wdgUrl = wdgUrl.substring(0, wdgUrl.lastIndexOf("/"));

                widget.setIcon(wdgUrl + "/../UM5Modules/assets/icons/custom-widget-icon.png");

                var wdgTitlePref = widget.getValue("wdgTitle");
                if (wdgTitlePref) {
                    widget.setTitle(wdgTitlePref);
                }

                let $wdgBody = $(widget.body);
                $wdgBody.empty();

                let $btnSearchMode = $("<button>Switch Search Mode</button>");
                $btnSearchMode.on("click", myWidget.switchSearchMode);

                let $btnOpenTags = $("<button>Open Tags</button>");
                $btnOpenTags.on("click", myWidget.openTags);

                $wdgBody.append($btnSearchMode);
                $wdgBody.append($btnOpenTags);
            },
            searchMode: 0,
            switchSearchMode: () => {
                if (myWidget.searchMode === 0) {
                    //Try to switch to search in this tab mode
                    //Try to switch to search in this tab mode only if needed :
                    //Try to switch to search in this tab mode only if needed :
                    let btnSearchInDash = top.document.getElementById("search-combo-find-in-tab");
                    if (btnSearchInDash.className.indexOf("selected") === -1) {
                        btnSearchInDash.click();
                        //Blur the search input to fold back the search menu if needed
                        let inSearchTop = top.document.getElementById("input_search_div");
                        inSearchTop.getElementsByTagName("input")[0].blur();
                    }
                    myWidget.searchMode = 1;
                } else {
                    //Try to go back to 3DSearch mode
                    top.document.getElementById("search-combo-search-item").click();
                    myWidget.searchMode = 0;
                }
            },
            openTags: () => {
                top.document.getElementById("btn_tag_nav").click();
            }

        };

        widget.addEvent("onLoad", myWidget.onLoadWidget);
        //widget.addEvent("onRefresh", myWidget.onLoadWidget);
        //widget.addEvent("onSearch", myWidget.onSearchWidget);
        //widget.addEvent("onResetSearch", myWidget.onResetSearchWidget);

        //widget.addEvent("onConfigChange", myWidget.onConfigChange); //For change of Table Config in list
    });
}