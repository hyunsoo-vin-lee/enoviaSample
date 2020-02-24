/*
 * BT WW Competencies Center - Fast Prototypes Team
 * @author UM5
 */

function executeWidgetCode() {
    require(["UWA/Drivers/jQuery", "DS/PlatformAPI/PlatformAPI", "BTWWSemanticUI/SemanticUIMessage_ES5_UM5_v1/SemanticUIMessage"], function(
        $,
        PlatformAPI,
        SemanticUIMessage
    ) {
        var myWidget = {
            addNewSub: null,
            arrImages: [],
            arrImgsKeys: [],

            // Widget Events
            onLoadWidget: function() {
                var wdgUrl = widget.getUrl();
                wdgUrl = wdgUrl.substring(0, wdgUrl.lastIndexOf("/"));

                widget.setIcon(wdgUrl + "/../UM5Modules/assets/icons/custom-widget-icon.png");

                var wdgTitlePref = widget.getValue("wdgTitle");
                if (wdgTitlePref) {
                    widget.setTitle(wdgTitlePref);
                }

                if (!myWidget.addNewSub) {
                    myWidget.addNewSub = PlatformAPI.subscribe("newImage", myWidget.addNewImage);
                }

                var $wdgBody = $(widget.body);
                $wdgBody.empty();

                $wdgBody.append("<div id='content'></div>");

                //Init Notification UI
                SemanticUIMessage.initContainer({ parent: widget.body });

                myWidget.loadImagesFromPrefs();

                for (var i = 0; i < myWidget.arrImages.length; i++) {
                    var imgData = myWidget.arrImages[i];
                    myWidget.addImageDisplay(imgData);
                }
            },

            loadImagesFromPrefs: function() {
                myWidget.arrImgsKeys = JSON.parse(widget.getValue("dataImgsArr"));
                myWidget.arrImages = [];

                for (var i = 0; i < myWidget.arrImgsKeys.length; i++) {
                    var key = myWidget.arrImgsKeys[i];
                    try {
                        var dataImg = JSON.parse(widget.getValue(key));
                        dataImg.key = key;
                        myWidget.arrImages.push(dataImg);
                    } catch (err) {
                        console.error(err);
                        myWidget.arrImgsKeys.splice(i, 1);
                        i--;
                    }
                }
                widget.setValue("dataImgsArr", JSON.stringify(myWidget.arrImgsKeys));
            },

            addNewImage: function(dataMsg) {
                if (dataMsg.source === "UM5Camera") {
                    //Save in Array
                    myWidget.arrImages.push(dataMsg);

                    var newKey = "img-" + Date.now();
                    myWidget.arrImgsKeys.push(newKey);

                    widget.addPreference(newKey);

                    widget.addPreference({
                        name: newKey,
                        type: "hidden",
                        label: newKey,
                        defaultValue: "{}"
                    });
                    widget.setValue(newKey, JSON.stringify(dataMsg));

                    widget.setValue("dataImgsArr", JSON.stringify(myWidget.arrImgsKeys));

                    dataMsg.key = newKey;
                    myWidget.addImageDisplay(dataMsg);
                }
            },

            addImageDisplay: function(dataMsg) {
                var dataPng = dataMsg.data;
                var $divImg = $("<div class='galeryImg'><img src='" + dataPng + "'/></div>");
                $divImg.click(myWidget.toggleImageDisplay);

                var $btnDelete = $("<i data-key='" + dataMsg.key + "' class='btnDelete icon trash'></i>");
                $btnDelete.click(myWidget.deleteImage);

                var $btnSave = $("<i data-key='" + dataMsg.key + "' class='btnSave icon save'></i>");
                $btnSave.click(myWidget.saveImage);

                $divImg.append($btnDelete);
                $divImg.append($btnSave);
                $("#content").prepend($divImg);
            },

            toggleImageDisplay: function() {
                var $img = $(this);
                if ($img.hasClass("galeryImg")) {
                    $img.removeClass("galeryImg");
                    $img.addClass("fullScreenImg");
                } else {
                    $img.removeClass("fullScreenImg");
                    $img.addClass("galeryImg");
                }
            },

            deleteImage: function() {
                var $btn = $(this);
                var keyToDelete = $btn.attr("data-key");
                myWidget.arrImgsKeys.splice(myWidget.arrImgsKeys.indexOf(keyToDelete), 1);
                widget.setValue(keyToDelete, "");
                //widget.removePreference(keyToDelete);
                widget.setValue("dataImgsArr", JSON.stringify(myWidget.arrImgsKeys));
                myWidget.onLoadWidget();
            },

            saveImage: function(ev) {
                ev.preventDefault();
                ev.stopPropagation();

                var $btn = $(this);
                var keyToSave = $btn.attr("data-key");
                for (var i = 0; i < myWidget.arrImages.length; i++) {
                    var imgData = myWidget.arrImages[i];
                    if (imgData.key === keyToSave) {
                        var dataPng = imgData.data;
                        var $anchorSave = $("<a id='imgSave' href='" + dataPng + "' download='photo.png' target='_blank'>Save Image</a>");

                        $("#content").append($anchorSave);

                        $anchorSave.get(0).click();

                        break;
                    }
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
