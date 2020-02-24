/*
 * BT WW Competencies Center - Fast Prototypes Team
 * @author UM5
 */

function executeWidgetCode() {
    require(["UWA/Drivers/jQuery", "BTWWSemanticUI/SemanticUIMessage_ES5_UM5_v1/SemanticUIMessage"], function($, SemanticUIMessage) {
        var myWidget = {
            config: {},
            // Widget Events
            onLoadWidget: function() {
                var wdgUrl = widget.getUrl();
                wdgUrl = wdgUrl.substring(0, wdgUrl.lastIndexOf("/"));

                widget.setIcon(wdgUrl + "/../UM5Modules/assets/icons/custom-widget-icon.png");

                var $wdgBody = $(widget.body);
                $wdgBody.empty();

                $wdgBody.append("<div id='contentMain'>Loading People</div>");

                //Init Notification UI
                SemanticUIMessage.initContainer({ parent: widget.body });

                myWidget.loadConfigFile();
            },

            loadConfigFile: function() {
                var fileUrl = widget.getValue("configFile");
                $.ajax({
                    dataType: "json",
                    url: fileUrl,
                    method: "GET",
                    data: "",
                    success: function(data) {
                        myWidget.config = data;
                        var $divContent = $("#contentMain");
                        $divContent.empty();
                        $divContent.append("Display...");
                        myWidget.buildSearchPanel();
                    },
                    error: function(jqXHR, txtStatus, errorThrown) {
                        widget.body.innerHTML = "Error will loading config File :" + txtStatus + "<br>" + errorThrown;
                        console.error(txtStatus + " : " + errorThrown);
                        SemanticUIMessage.addNotif({
                            level: "error",
                            title: txtStatus,
                            message: errorThrown,
                            sticky: false
                        });
                    }
                });
            },

            buildSearchPanel: function() {
                var wdgUrl = widget.getUrl();
                wdgUrl = wdgUrl.substring(0, wdgUrl.lastIndexOf("/")) + "/assets/";

                var $divContent = $("#contentMain");
                $divContent.empty();

                var $divCards = $("<div id='cardsContainer' class='ui five cards'></div>");

                var arrPeoples = myWidget.config.peoples;

                for (var i = 0; i < arrPeoples.length; i++) {
                    var person = arrPeoples[i];
                    var $divCard = $("<div class='ui card raised link fluid blue'></div>");
                    $divCard.attr("data-id", person.id);

                    var img = "<img class='ui wireframe image' src='" + wdgUrl + "image.png'>";
                    if (person.photo && person.photo !== "") {
                        img = "<img src='" + person.photo + "'/>";
                    }
                    var $imgCard = $("<div class='image'>" + img + "</div>");
                    $divCard.append($imgCard);

                    var $contentCard = $("<div class='content'></div>");

                    var $headerCard = $("<div class='header'>" + person.firstName + " " + person.lastName + "</div>");
                    $contentCard.append($headerCard);

                    var $descriptionCard = $("<div class='description'>" + person.roleName + "</div>");
                    $contentCard.append($descriptionCard);

                    $divCard.append($contentCard);

                    $divCards.append($divCard);

                    $divCard.click(myWidget.clickOnPerson);
                }

                $divContent.append($divCards);
            },

            clickOnPerson: function(ev) {
                var $this = $(this);
                var idPersonClicked = $this.attr("data-id");

                var person = myWidget.findPersonById(idPersonClicked);

                var $divPersonDetails = $("#personDetails");

                if (!$divPersonDetails || $divPersonDetails.length === 0) {
                    $divPersonDetails = $("<div id='personDetails'></div>");
                    var $divContent = $("#contentMain");
                    $divContent.append($divPersonDetails);
                }

                var $divCards = $("#cardsContainer");
                $divCards.addClass("one collapseRight");
                $divCards.removeClass("five");

                $divPersonDetails.addClass("show");

                $divPersonDetails.empty();

                var $divCloseBtn = $("<div id='closeBtn'><i class='large close icon'></i></div>");
                var $divPersonHead = $("<div id='personHeader'></div>");
                var $divPersonContent = $("<div id='personContent'></div>");

                $divPersonDetails.append($divCloseBtn);
                $divPersonDetails.append($divPersonHead);
                $divPersonDetails.append($divPersonContent);

                $divCloseBtn.click(function() {
                    $divPersonDetails.removeClass("show");
                    $divCards.removeClass("one collapseRight");
                    $divCards.addClass("five");
                });

                $divPersonHead.append("<div style='display:inline-block;'>" + person.firstName + "</div>");
            },

            findPersonById: function(idPerson) {
                var personFound;

                var arrPeoples = myWidget.config.peoples;

                for (var i = 0; i < arrPeoples.length; i++) {
                    var person = arrPeoples[i];
                    if (person.id === idPerson) {
                        personFound = person;
                        break;
                    }
                }
                return personFound;
            }
        };

        widget.addEvent("onLoad", myWidget.onLoadWidget);
        //widget.addEvent("onRefresh", myWidget.onLoadWidget);
        //widget.addEvent("onSearch", myWidget.onSearchWidget);
        //widget.addEvent("onResetSearch", myWidget.onResetSearchWidget);
    });
}
