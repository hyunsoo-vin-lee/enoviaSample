/*
 * BT WW Competencies Center - Fast Prototypes Team
 * @author UM5
 */

function executeWidgetCode() {
    require(["UWA/Drivers/jQuery"], function($) {
        var myWidget = {
            // Widget Events
            onLoadWidget: function() {
                var wdgUrl = widget.getUrl();
                wdgUrl = wdgUrl.substring(0, wdgUrl.lastIndexOf("/"));

                widget.setIcon(wdgUrl + "/../UM5Modules/assets/icons/custom-widget-icon.png");

                var wdgTitlePref = widget.getValue("wdgTitle");
                if (wdgTitlePref) {
                    widget.setTitle(wdgTitlePref);
                }

                var $wdgBody = $(widget.body);
                $wdgBody.empty();
                $wdgBody.append("<div id='content'></div>");
                myWidget.drawWords();
                setTimeout(myWidget.updateFontSize, 200); //Delay for DOM update
            },
            onResizeWidget: function() {
                myWidget.updateFontSize();
            },

            updateFontSize: function() {
                var $content = $("#content");
                var h = $content.height();
                $content.css("font-size", h + "px");
                $content.css("padding-top", "0px");

                //Calculate current Width and adjust font-size if needed
                var $spanWords = $("#content span");
                var totWidth = ($spanWords.length - 1) * (h / 4); //0.25em

                $spanWords.each(function() {
                    totWidth += $(this).width();
                });

                var availableWidth = $content.width();
                if (totWidth > availableWidth) {
                    var scaleFactor = availableWidth / totWidth;
                    $content.css("font-size", h * scaleFactor + "px");
                    $content.css("padding-top", h * (1 - scaleFactor) / 2 + "px");
                }
            },

            drawWords: function() {
                var strWords = widget.getValue("words");
                var arrWords = strWords.split(",");

                var $content = $("#content");
                $content.empty();

                for (var i = 0; i < arrWords.length; i++) {
                    var word = arrWords[i];
                    var colorClass = "highlight";
                    if (word.indexOf("!") === 0) {
                        colorClass = "dimmed";
                        word = word.substring(1);
                    }
                    var $spanWord = $("<span class='" + colorClass + "'>" + word + "</span>");
                    $content.append($spanWord);
                }
            }
        };

        widget.addEvent("onLoad", myWidget.onLoadWidget);
        widget.addEvent("onResize", myWidget.onResizeWidget);
    });
}
