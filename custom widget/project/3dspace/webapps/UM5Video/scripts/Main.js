/*
 * BT WW Competencies Center - Fast Prototypes Team
 * @author UM5
 */

function executeWidgetCode() {
    require(["UWA/Drivers/jQuery", "BTWWLibrairies/jsmpeg/jsmpeg.min"], function($, JSMpeg) {
        var myWidget = {
            player: null,

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
                $wdgBody.css("text-align", "center");

                var videoUrl = widget.getValue("videoUrl");
                if (!videoUrl || videoUrl === "") {
                    //No video url
                    $wdgBody.append("Please Provide a video URL in the widget Preferences.");
                } else {
                    //Display Video Tag
                    var $canvas = $("<canvas id='video-canvas'></canvas>");
                    $canvas.css("height", "100%");
                    $wdgBody.append($canvas);
                    myWidget.player = new JSMpeg.Player(videoUrl, { canvas: $canvas.get(0) });
                }
            },

            onUnloadWidget: function() {
                if (myWidget.player) {
                    myWidget.player.destroy();
                }
            }
        };

        widget.addEvent("onLoad", myWidget.onLoadWidget);
        widget.addEvent("onUnload", myWidget.onUnloadWidget);
    });
}
