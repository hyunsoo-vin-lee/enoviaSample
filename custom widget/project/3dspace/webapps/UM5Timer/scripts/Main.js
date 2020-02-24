/*
 * BT WW Competencies Center - Fast Prototypes Team
 * @author UM5
 */

function executeWidgetCode() {
    require(["UWA/Drivers/jQuery", "css!BTWWLibrairies/semantic-ui/semantic.min"], function($) {
        var myWidget = {
            // Widget Events
            onLoadWidget: function() {
                var wdgUrl = widget.getUrl();
                wdgUrl = wdgUrl.substring(0, wdgUrl.lastIndexOf("/"));

                widget.setIcon(wdgUrl + "/../UM5Modules/assets/icons/custom-widget-icon.png");

                myWidget.initTimer();
                $(widget.body).empty();
                $(widget.body).append(myWidget.$divCounter);

                var $divButtons = $("<div id='buttons'></div>");
                var $btnStart = $("<button class='ui basic button small green'><i class='icon play'></i>Start</button>");
                var $btnStop = $("<button class='ui basic button small blue'><i class='icon pause'></i>Pause</button>");
                var $btnReset = $("<button class='ui basic button small orange'><i class='icon refresh'></i>Reset</button>");

                $divButtons.append($btnStart);
                $divButtons.append($btnStop);
                $divButtons.append($btnReset);
                $(widget.body).append($divButtons);

                $btnStart.click(function() {
                    if (myWidget.status !== "running") {
                        myWidget.lastTimeStamp = Date.now();
                        myWidget.status = "running";
                        myWidget.animationLoop();
                    }
                });

                $btnStop.click(function() {
                    myWidget.status = "stop";
                });

                $btnReset.click(function() {
                    myWidget.resetTimer();
                });
            },

            onRefreshWidget: function() {},

            lastTimeStamp: 0,
            time: 0,
            status: "stop",

            $divCounter: $("<div class='counter'></div>"),

            initTimer: function() {
                myWidget.$divCounter.empty();

                myWidget.time = parseFloat(widget.getValue("timer")) * 1000;

                myWidget.drawDisplay();
            },

            resetTimer: function() {
                myWidget.initTimer();
            },

            drawDisplay: function() {
                var msLeft = myWidget.time % 1000;
                var sLeft = ((myWidget.time - msLeft) / 1000) % 60;
                var minLeft = ((myWidget.time - msLeft - 1000 * sLeft) / 60000) % 60;

                myWidget.$divCounter.text(
                    minLeft.toLocaleString(undefined, { minimumIntegerDigits: 2 }) +
                        ":" +
                        sLeft.toLocaleString(undefined, { minimumIntegerDigits: 2 }) +
                        "." +
                        msLeft.toLocaleString(undefined, { minimumIntegerDigits: 3 })
                );
            },

            animationLoop: function() {
                var currentTS = Date.now();
                var delta = currentTS - myWidget.lastTimeStamp;

                myWidget.time -= delta;

                myWidget.lastTimeStamp = currentTS;

                if (myWidget.time <= 0) {
                    myWidget.time = 0;
                    myWidget.drawDisplay();
                    return;
                } else if (myWidget.status === "stop") {
                    myWidget.drawDisplay();
                } else {
                    myWidget.drawDisplay();
                    requestAnimationFrame(myWidget.animationLoop);
                }
            }
        };

        widget.addEvent("onLoad", myWidget.onLoadWidget);
        widget.addEvent("onRefresh", myWidget.onRefreshWidget);
    });
}
