/*
 * BT WW Competencies Center - Fast Prototypes Team
 * @author UM5
 */

function executeWidgetCode() {
    require(["UWA/Drivers/jQuery", "BTWWLibrairies/qrcode/qrcode"], function ($, QRCode) {
        var myWidget = {
            // Widget Events
            onLoadWidget: function () {
                var wdgUrl = widget.getUrl();
                wdgUrl = wdgUrl.substring(0, wdgUrl.lastIndexOf("/"));

                widget.setIcon(wdgUrl + "/../UM5Modules/assets/icons/custom-widget-icon.png");

                var title = widget.getValue("wdgTitle");
                if (title && title !== "") {
                    widget.setTitle(title);
                }

                var $wdgBody = $(widget.body);
                $wdgBody.empty();

                var $QrCode = $("<div id='qrCode'></div>");
                $wdgBody.append($QrCode);

                new QRCode($QrCode.get(0), {
                    text: widget.getValue("qrCodeText"),
                    colorDark: "#005685", //dsBlue
                    colorLight: "#ffffff",
                    width: 512,
                    height: 512
                });

                //Draw Center Image
                //CenterImage.png

                var bCenterImage = widget.getValue("centerImage") === "true";

                if (bCenterImage) {
                    var imgUrl = wdgUrl + "/assets/icons/CenterImage.png";

                    var qrCodeSize = 512;
                    var imgSize = 128;
                    var imgMargin = 4;

                    var $canvas = $("#qrCode > canvas");

                    var ctx2d = $canvas.get(0).getContext("2d");

                    var startPointClear = qrCodeSize / 2 - imgSize / 2;
                    ctx2d.clearRect(startPointClear, startPointClear, imgSize, imgSize);

                    var centerImage = new Image();
                    centerImage.crossOrigin = "anonymous"; //https://stackoverflow.com/questions/34743987/canvas-image-crossplatform-insecure-error
                    centerImage.src = imgUrl;
                    centerImage.onload = function () {
                        ctx2d.drawImage(
                            centerImage,
                            startPointClear + imgMargin,
                            startPointClear + imgMargin,
                            imgSize - 2 * imgMargin,
                            imgSize - 2 * imgMargin
                        );

                        //Make Image great again
                        $("#qrCode img").get(0).src = ctx2d.canvas.toDataURL("image/png");
                    };
                } else {
                    $("#qrCode img").get(0).src = ctx2d.canvas.toDataURL("image/png");
                }
            }
        };

        widget.addEvent("onLoad", myWidget.onLoadWidget);
        //widget.addEvent("onRefresh", myWidget.onLoadWidget);
        //widget.addEvent("onSearch", myWidget.onSearchWidget);
        //widget.addEvent("onResetSearch", myWidget.onResetSearchWidget);

        //widget.addEvent("onConfigChange", myWidget.onConfigChange); //For change of Table Config in list
    });
}