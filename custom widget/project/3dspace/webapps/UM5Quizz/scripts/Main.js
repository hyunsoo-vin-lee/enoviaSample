/**
 * BT WW Competencies Center - Fast Prototypes Team
 * @author UM5
 */

function executeWidgetCode() {
    require(["UWA/Drivers/jQuery", "css!BTWWLibrairies/semantic-ui/semantic.min"], function ($) {
        var myWidget = {
            head: "TBD",
            startPage: {
                img: "Not Found",
                text: "To be defined"
            },
            questions: [],
            confName: "",

            currentQuestion: -1, //For the start panel

            questionsResults: [],

            buildDisplay: function () {
                var $body = $(widget.body);
                $body.empty(); //Clear

                var $mainPanel = $("<div id='main'></div>");
                var $topPanel = myWidget.buildTopPanel();
                var $middlePanel = $("<div id='middle'></div>");
                var $bottomPanel = myWidget.buildBottomPanel();

                $mainPanel.append($topPanel);
                $mainPanel.append($middlePanel);
                $mainPanel.append($bottomPanel);

                var $startPanel = myWidget.buildStartPanel();
                $middlePanel.append($startPanel);

                for (var i = 0; i < myWidget.questions.length; i++) {
                    var questionItem = myWidget.questions[i];
                    var $panelQuestion = myWidget.buildQuestionPanel(i, questionItem);

                    $middlePanel.append($panelQuestion);
                }

                $body.append($mainPanel);
            },

            buildTopPanel: function () {
                //var wdgUrl = widget.getUrl();
                //wdgUrl = wdgUrl.substring(0, wdgUrl.lastIndexOf("/")) + "/assets/";
                var $panel = $("<div id='top' class='dsBlue'>" + myWidget.head + "</div>");
                return $panel;
            },
            buildBottomPanel: function () {
                var $panel = $("<div id='bottom'></div>");

                var $progressBar = $(
                    "<div id='progressBar' class='ui grey progress small alignRight' style='margin-bottom:-1.5em;'><div class='bar'></div></div>"
                );
                var objConfProgress = {
                    total: myWidget.questions.length + 1,
                    showActivity: false,
                    autoSuccess: true //,
                    //text: {
                    //    active: "Question {value} sur " + myWidget.questions.length, //I'm not using "{total}" because Last question is not 100%
                    //    success: "Questionnaire complété avec succès"
                    //}
                };
                if (myWidget.currentQuestion >= 0) {
                    objConfProgress.value = myWidget.currentQuestion + 1;
                }
                $progressBar.progress(objConfProgress);
                $progressBar.progress("set duration", 2000);

                var $divCenter = $("<div id='botCentering'></div>");
                $divCenter.append($progressBar);

                $panel.append($divCenter);

                return $panel;
            },

            buildStartPanel: function () {
                var $panel = $("<div id='start' class='panel question clickable dsFont dsBlue'></div>");
                $panel.click(myWidget.nextDisplay);
                if (-1 !== myWidget.currentQuestion) {
                    $panel.css("display", "none");
                }

                $panel.append("<div class='vertical spacer percent30'></div>");

                $panel.append("<div><img style='" + myWidget.startPage.imgCss + "' src='" + myWidget.startPage.img + "'/></div>");

                $panel.append("<div class='vertical spacer one'></div>");

                $panel.append(myWidget.startPage.text);

                $panel.append("<br><span style='font-size:0.5em;'>Tap or Click to Start</span>");

                return $panel;
            },

            buildQuestionPanel: function (index, questionItem) {
                var $panelQuestion = $("<div class='panel question'></div>");
                $panelQuestion.attr("panelIndex", index);

                if (index !== myWidget.currentQuestion) {
                    $panelQuestion.css("display", "none");
                }

                var $questionLine = $("<div class='line question dsFont dsBlue'>" + questionItem.question + "</div>");
                $panelQuestion.append($questionLine);

                if (questionItem.image) {
                    var $imgQuestion = $("<div class='question imageHolder'><img src='" + questionItem.image + "'/></div>");
                    $panelQuestion.append($imgQuestion);
                    $panelQuestion.addClass("hasImage");
                }

                if (questionItem.type === "YesNo") {
                    var $btnGroup = $("<div class='ui buttons huge' style='width:80%'></div>");
                    var $yes = $("<button class='ui button yes primary clickable dsFont' data-value='yes'>Yes</button>");
                    $yes.click(myWidget.nextDisplay);
                    var $no = $("<button class='ui button no primary clickable dsFont' data-value='no'>No</button>");
                    $no.click(myWidget.nextDisplay);

                    $btnGroup.append($yes);
                    $btnGroup.append("<div class='horizontal spacer'></div>");
                    $btnGroup.append($no);

                    $panelQuestion.append("<div class='vertical spacer percent30'></div>");
                    $panelQuestion.append($btnGroup);
                } else if (questionItem.type === "OneChoice") {
                    for (var j = 0; j < questionItem.choices.length; j++) {
                        var choiceItem = questionItem.choices[j];
                        var $btnChoice = $("<button class='ui button choice big clickable dsFont'>" + choiceItem + "</button>");
                        $btnChoice.attr("data-value", choiceItem);
                        $btnChoice.click(myWidget.nextDisplay);

                        $panelQuestion.append($btnChoice);
                    }
                } else if (questionItem.type === "MultiChoice") {
                    var minChoices = questionItem.min || 0;
                    var maxChoices = questionItem.max || questionItem.choices.length;
                    var choices = 0;
                    var $btnSubmitChoices = $("<button class='ui button big primary clickable submitBtn dsFont'>Next</button>");
                    var fctToggleButton = function (ev) {
                        ev.preventDefault();
                        ev.stopPropagation();

                        var $thisBtn = $(this);
                        $thisBtn.toggleClass("active");
                        if ($thisBtn.hasClass("active")) {
                            choices++;
                            $thisBtn.find("input").focus();
                        } else {
                            choices--;
                        }
                        if (choices >= minChoices && choices <= maxChoices) {
                            $btnSubmitChoices.removeClass("disabled");
                        } else {
                            $btnSubmitChoices.addClass("disabled");
                        }
                    };
                    var fctCheckNumberChoices = function (ev) {
                        var $thisBtn = $(this);
                        if (!$thisBtn.hasClass("disabled")) {
                            myWidget.nextDisplay.call(this, [ev]);
                        }
                    };

                    $panelQuestion.append("<div class='vertical spacer one'></div>");

                    for (var j2 = 0; j2 < questionItem.choices.length; j2++) {
                        var choiceItemMulti = questionItem.choices[j2];
                        var $btnChoiceMulti;
                        if (typeof choiceItemMulti === "string") {
                            $btnChoiceMulti = $(
                                "<button class='ui button toggle big choice clickable dsFont'><i class='checkmark icon'></i>" + choiceItemMulti + "</button>"
                            );
                            $btnChoiceMulti.attr("data-value", choiceItemMulti);
                        } else if (choiceItemMulti && choiceItemMulti.type === "buttonWithText") {
                            var txtPlaceHolder = choiceItemMulti.placeholder || "...";
                            $btnChoiceMulti = $(
                                "<button class='ui button toggle big choice clickable withText dsFont'><i class='checkmark icon'></i>" +
                                choiceItemMulti.value +
                                "<br/></button>"
                            );
                            var $divTxt = $("<div class='ui input'></div>");
                            var $inTxt = $("<input type='text' placeholder='" + txtPlaceHolder + "'/>");
                            $inTxt.click(function (ev) {
                                ev.stopPropagation();
                                $(this).focus();
                            });
                            $inTxt.on("keyup", function (ev) {
                                ev.stopPropagation();
                                if (ev.keyCode === 32) {
                                    //spacebar
                                    //Issue with spacebar unchecking the button and hidding the input text
                                    ev.preventDefault();
                                }
                            });
                            $divTxt.append($inTxt);
                            $btnChoiceMulti.append($divTxt);
                            $btnChoiceMulti.attr("data-value", choiceItemMulti);
                        }
                        $btnChoiceMulti.click(fctToggleButton);
                        $panelQuestion.append($btnChoiceMulti);
                    }

                    if (questionItem.choices.length > 15) {
                        $panelQuestion.addClass("longList");
                    }

                    $panelQuestion.append("<div class='vertical spacer one'></div>");

                    $btnSubmitChoices.click(fctCheckNumberChoices);
                    if (minChoices > 0) {
                        $btnSubmitChoices.addClass("disabled");
                    }

                    $panelQuestion.append($btnSubmitChoices);
                } else if (questionItem.type === "MultiLevelChoice") {
                    var $divPanelDynamic = $("<div class='panel dynamic'><div>");
                    var currentChoice = [];
                    var fctChoiceClicked = function () {
                        currentChoice = $(this)
                            .attr("data-value")
                            .split("/");
                        fctDisplayDynamicPanel();
                    };
                    var fctDisplayDynamicPanel = function () {
                        $divPanelDynamic.empty();
                        var treeChoice = questionItem.choices;
                        var i,
                            itemObj,
                            prependValue = "";
                        if (currentChoice.length > 0) {
                            for (var c = 0; c < currentChoice.length; c++) {
                                var choice = currentChoice[c];
                                for (i = 0; i < treeChoice.length; i++) {
                                    itemObj = treeChoice[i];
                                    if (itemObj.value === choice) {
                                        prependValue += choice + "/";
                                        treeChoice = itemObj.childs;
                                    }
                                }
                            }
                        }
                        for (i = 0; i < treeChoice.length; i++) {
                            itemObj = treeChoice[i];
                            var $btnChoice = $("<button class='ui button big choice clickable dsFont'>" + itemObj.value + "</button>");
                            $btnChoice.attr("data-value", prependValue + itemObj.value);
                            if (itemObj.childs && itemObj.childs.length > 0) {
                                $btnChoice.append("<i class='ui icon angle right'></i>");
                                $btnChoice.click(fctChoiceClicked);
                            } else {
                                $btnChoice.click(myWidget.nextDisplay);
                            }
                            $divPanelDynamic.append($btnChoice);
                        }
                        if (currentChoice.length > 0) {
                            var $btnChoiceBack = $("<button class='ui button big basic primary choice clickable dsFont'>Retour</button>");
                            $btnChoiceBack.click(function () {
                                currentChoice.splice(currentChoice.length - 1, 1);
                                fctDisplayDynamicPanel();
                            });
                            $divPanelDynamic.append($btnChoiceBack);
                        }
                    };
                    fctDisplayDynamicPanel();
                    $panelQuestion.append("<div class='vertical spacer one'></div>");
                    $panelQuestion.append($divPanelDynamic);
                } else if (questionItem.type === "FreeText") {
                    var $freeText = $("<div class='ui form'><div class='field'><textarea rows='3' placeholder='Type something Here'></textarea></div></div>");
                    $panelQuestion.append("<div class='vertical spacer one'></div>");
                    $panelQuestion.append($freeText);

                    var $btnSubmitFreeText = $("<button class='ui button big primary clickable dsFont'>Next</button>");
                    $btnSubmitFreeText.click(myWidget.nextDisplay);

                    $panelQuestion.append("<div class='vertical spacer one'></div>");
                    $panelQuestion.append($btnSubmitFreeText);
                } else if (questionItem.type === "Evaluate") {
                    var min = questionItem.min;
                    var max = questionItem.max;
                    var step = questionItem.step || 1;
                    var labelMin = questionItem.labelMin || "";
                    var labelMax = questionItem.labelMax || "";
                    for (var r = min; r <= max; r += step) {
                        var $btnRate = $("<button class='ui button choice big clickable dsFont'>" + r + "</button>");
                        if (r === min && labelMin !== "") {
                            $btnRate.append(" - " + labelMin);
                        }
                        if (r === max && labelMax !== "") {
                            $btnRate.append(" - " + labelMax);
                        }
                        $btnRate.attr("data-value", r);
                        $btnRate.click(myWidget.nextDisplay);

                        $panelQuestion.append($btnRate);
                    }
                    var dispNA = questionItem["dispN/A"];
                    if (dispNA) {
                        var $btnRateNA = $("<button class='ui button choice big clickable dsFont'>N/A</button>");
                        $btnRateNA.attr("data-value", "N/A");
                        $btnRateNA.click(myWidget.nextDisplay);
                        $panelQuestion.append($btnRateNA);
                    }
                } else {
                    console.error("Question Type Not Managed : " + questionItem.type);
                }

                return $panelQuestion;
            },

            updateResults: function (itemClicked) {
                var result = {};
                var questionIndex = myWidget.currentQuestion;
                if (questionIndex >= 0 && questionIndex < myWidget.questions.length) {
                    var questionItem = myWidget.questions[questionIndex];
                    var questionType = questionItem.type;
                    result.type = questionType;
                    var val;
                    if (questionType === "MultiChoice") {
                        val = "";
                        var values = [];
                        var $itemsSelected = $(itemClicked)
                            .closest(".panel.question")
                            .find("button.active");
                        $itemsSelected.each(function () {
                            var $this = $(this);
                            if ($(this).hasClass("withText")) {
                                values.push($this.find("input").val());
                            } else {
                                values.push($this.attr("data-value"));
                            }
                        });
                        val = values.join("|");
                    } else if (questionType === "Rating") {
                        val = $(itemClicked)
                            .closest(".panel.question")
                            .find("div.ui.rating")
                            .rating("get rating");
                    } else if (questionType === "FreeText") {
                        val = "";
                        var $itemText = $(itemClicked)
                            .closest(".panel.question")
                            .find("textarea");
                        //val = btoa($itemText.val()); //Base64 encoding
                        val = $itemText.val();
                    } else {
                        val = $(itemClicked).attr("data-value");
                    }
                    result.value = val;
                }

                myWidget.questionsResults[questionIndex] = result;
            },

            rebuildDisplay: function () {
                //Rebuild the display and show the current question
                myWidget.buildDisplay();
            },

            nextDisplay: function (ev) {
                var $panelQuestion = $(this).closest("div.panel.question");
                //console.log("Clicked " + $panelQuestion.attr("panelIndex") + ":" + $(this).html());

                myWidget.updateResults(this);

                var showResultNow = widget.getValue("showResultAfterQuestion") === "true";

                if (showResultNow && myWidget.currentQuestion >= 0 && myWidget.questions[myWidget.currentQuestion].correct) {
                    $panelQuestion.fadeOut(200, myWidget.showCurrentQuestionResult);
                } else {
                    //myWidget.currentQuestion++;
                    myWidget.goToNextQuestionIndex();

                    $panelQuestion.fadeOut(200, myWidget.showNextQuestionDisplay);
                }
            },

            goToNextQuestionIndex: function () {
                myWidget.currentQuestion++;
                $("div#progressBar").progress("increment");
                //Check conditions on the next question
                //check for "showIf" declaration

                var fctCheckDisplayQuestion = function () {
                    if (myWidget.currentQuestion < myWidget.questions.length) {
                        var questionItem = myWidget.questions[myWidget.currentQuestion];
                        if (questionItem["showIf"]) {
                            var conditionObj = questionItem["showIf"];
                            var valToTest = conditionObj.value;
                            var conditionToTest = conditionObj.condition;
                            var qIndexToTest = conditionObj.questionIndex;
                            var valResult = myWidget.questionsResults[qIndexToTest].value;

                            var showOk = false;
                            switch (conditionToTest) {
                                case "equals":
                                    if (typeof valToTest === "string" && valToTest === valResult || (typeof valToTest !== "string" && valToTest.indexOf(valResult) !== -1)) {
                                        showOk = true;
                                    }
                                    break;

                                default:
                                    showOk = true;
                                    break;
                            }
                            if (!showOk) {
                                myWidget.currentQuestion++;
                                $("div#progressBar").progress("increment");
                                fctCheckDisplayQuestion();
                            }
                        }
                    }
                };

                fctCheckDisplayQuestion();

            },

            buildPanelResultForQuestion: function (questionIndex) {
                var $panelResult = $("<div class='panel question clickable'></div>");

                var questionItem = myWidget.questions[questionIndex];
                $panelResult.append("<div>The correct answer for the question :</div>");
                $panelResult.append("<div class='dsfont dsBlue line question'>" + questionItem.question + "</div>");
                $panelResult.append("<div>are :</div>");

                var userAnswers = myWidget.questionsResults[questionIndex].value.split("|");

                var arrChoices = questionItem.choices || ["yes", "no"];

                if (questionItem.type === "MultiLevelChoice") {
                    arrChoices = questionItem.correct.slice(0); //Copy array
                    if (arrChoices.indexOf(userAnswers[0]) === -1) {
                        arrChoices.push(userAnswers[0]);
                    }
                }

                var i,
                    oneWrong = false;
                for (i = 0; i < arrChoices.length; i++) {
                    var choice = arrChoices[i];
                    var $divChoice = $("<div class='answer'>" + choice + "</div>");
                    var correct = false;
                    if (questionItem.correct.indexOf(choice) !== -1) {
                        $divChoice.addClass("correct");
                        correct = true;
                    } else {
                        $divChoice.addClass("uncorrect");
                    }
                    if (userAnswers.indexOf(choice) !== -1) {
                        $divChoice.addClass("selected");
                        if (!correct) {
                            oneWrong = true;
                        }
                    } else {
                        $divChoice.addClass("notselected");
                        if (correct) {
                            oneWrong = true;
                        }
                    }
                    $panelResult.append($divChoice);
                }

                $panelResult.append("<div>Click to continue</div>");

                if (oneWrong) {
                    $panelResult.prepend("<div class='result wrong'>Wrong</div>");
                    try {
                        window.navigator.vibrate([100, 50, 100, 50, 100]);
                    } catch (err) {
                        console.error(err);
                    }
                } else {
                    $panelResult.prepend("<div class='result correct'>Correct</div>");
                }

                return $panelResult;
            },

            showCurrentQuestionResult: function () {
                var $middlePanel = $("#middle");
                var $panelResult = myWidget.buildPanelResultForQuestion(myWidget.currentQuestion);

                $middlePanel.append($panelResult);

                $panelResult.click(function () {
                    //myWidget.currentQuestion++;
                    myWidget.goToNextQuestionIndex();
                    $panelResult.fadeOut(200, myWidget.showNextQuestionDisplay);
                });
            },

            showNextQuestionDisplay: function () {
                $("div.panel.question[panelIndex='" + myWidget.currentQuestion + "']").fadeIn(200);


                var showResultNow = widget.getValue("showResultAfterQuestion") === "true";

                var showResultsAtEnd = widget.getValue("showResultAtEnd") === "true";

                if (myWidget.currentQuestion >= myWidget.questions.length) {
                    if (showResultNow || !showResultsAtEnd) {
                        myWidget.endSurvey();
                    } else {
                        myWidget.showAllAnswers();
                    }
                }
            },

            showAllAnswers: function () {
                var $middlePanel = $("div#middle");
                $middlePanel.empty(); //Clear

                var indexResult = 0;
                var fctShowPanel = function () {
                    var qItem = myWidget.questions[indexResult];

                    if (indexResult >= myWidget.questionsResults.length) {
                        myWidget.endSurvey();
                    } else {
                        if (qItem.correct) {
                            var $panelResult = myWidget.buildPanelResultForQuestion(indexResult);
                            $middlePanel.append($panelResult);

                            $panelResult.click(function () {
                                indexResult++;
                                $panelResult.fadeOut(200, fctShowPanel);
                            });
                        } else {
                            indexResult++;
                            fctShowPanel();
                        }
                    }
                };
                fctShowPanel();
            },

            endSurvey: function () {
                var $middlePanel = $("div#middle");
                $middlePanel.empty(); //Clear

                $middlePanel.append(myWidget.buildEndSurveyPanel());

                myWidget.sendResult(
                    function sendOK() {
                        $middlePanel.click(function () {
                            myWidget.currentQuestion = -1;
                            myWidget.onLoadWidget();
                        });
                        $("div#loaderResults").removeClass("active");
                        $("div#sentOK").removeClass("hidden");

                        myWidget.questionsResults = [];
                    },
                    function sentKO() {
                        console.error("ERROR - Results Not Sent");

                        //TODO Change later for a Retry
                        $middlePanel.click(function () {
                            myWidget.currentQuestion = -1;
                            myWidget.onLoadWidget();
                        });
                        $("div#loaderResults").removeClass("active");
                        $("div#sentOK").removeClass("hidden");

                        myWidget.questionsResults = [];
                    }
                );
            },

            buildEndSurveyPanel: function () {
                var $panel = $("<div class='panel question endSurvey'></div>");
                $panel.append("<div class='vertical spacer percent30'></div>");
                $panel.append("<div><img style='" + myWidget.endPage.imgCss + "' src='" + myWidget.endPage.img + "'/></div>");
                $panel.append("<div class='vertical spacer one'></div>");
                $panel.append("<div class='text dsFont dsBlue' style='font-size:2.5em;line-height:1.05em'>" + myWidget.endPage.text + "</div>");
                $panel.append("<div class='vertical spacer one'></div>");
                $panel.append("<div id='loaderResults' class='ui test loader active dsFont dsBlue'>Sending results...</div>");
                $panel.append("<div id='sentOK' class='hidden dsFont dsBlue'>Click to restart the Quizz</div>");
                return $panel;
            },

            sendResult: function (onResultsSentSuccess, onResultSentFail) {
                //console.log("Results : " + JSON.stringify(myWidget.questionsResults));
                //Code to send the results
                //onResultsSentSuccess();

                let baseUrl = widget.getValue("baseURL");
                var urlToCall = baseUrl + "/UM5QuizzModeler/UM5QuizzWS/" + myWidget.confName + "/addResults";

                var arrResults = [];
                for (var i = 0; i < myWidget.questionsResults.length; i++) {
                    var questRes = myWidget.questionsResults[i];
                    //arrResults[i] = myWidget.removeAccents(questRes.value);
                    arrResults[i] = (questRes && questRes.value) || "";
                }

                $.ajax(urlToCall, {
                    type: "POST",
                    dataType: "json",
                    //contentType: "application/x-www-form-urlencoded",
                    contentType: "text/plain",
                    data: JSON.stringify(arrResults),
                    //data: JSON.stringify(dataQuestion),
                    success: function (data) {
                        onResultsSentSuccess(data);
                    },
                    error: function (xhr, status, errorThrown) {
                        onResultSentFail(xhr, status, errorThrown);
                    }
                });
            },

            removeAccents: function (str) {
                var accents = "ÀÁÂÃÄÅàáâãäåÒÓÔÕÕÖØòóôõöøÈÉÊËèéêëðÇçÐÌÍÎÏìíîïÙÚÛÜùúûüÑñŠšŸÿýŽž";
                var accentsOut = "AAAAAAaaaaaaOOOOOOOooooooEEEEeeeeeCcDIIIIiiiiUUUUuuuuNnSsYyyZz";
                str = str.split("");
                var strLen = str.length;
                var i, x;
                for (i = 0; i < strLen; i++) {
                    if ((x = accents.indexOf(str[i])) != -1) {
                        str[i] = accentsOut[x];
                    }
                }
                return str.join("");
            },

            loadConfigFile: function () {
                //var fileUrl = widget.getValue("configSurveyFile");
                let baseUrl = widget.getValue("baseURL");
                let confName = widget.getValue("confName");
                myWidget.confName = confName;
                $.ajax({
                    dataType: "json",
                    url: baseUrl + "/UM5QuizzModeler/UM5QuizzWS/config/" + confName,
                    method: "GET",
                    data: "",
                    success: function (data) {
                        myWidget.questions = data.questions;
                        myWidget.head = data.head;
                        myWidget.startPage = data.startPage;
                        myWidget.endPage = data.endPage;

                        myWidget.buildDisplay();
                    },
                    error: function (jqXHR, txtStatus, errorThrown) {
                        widget.body.innerHTML = "Error will loading config File :" + txtStatus + "<br>" + errorThrown;
                    }
                });
            },

            onLoadWidget: function () {
                var wdgUrl = widget.getUrl();
                wdgUrl = wdgUrl.substring(0, wdgUrl.lastIndexOf("/"));

                widget.setIcon(wdgUrl + "/../UM5Modules/assets/icons/custom-widget-icon.png");

                myWidget.loadConfigFile();
                //myWidget.buildDisplay();//Move in loadConfigFile...
            },
            onRefreshWidget: function () {
                if (myWidget.confName === "") {
                    myWidget.onLoadWidget();
                } else {
                    myWidget.rebuildDisplay();
                }
            }
        };

        widget.addEvent("onLoad", myWidget.onLoadWidget);
        widget.addEvent("onRefresh", myWidget.onRefreshWidget);
    });
}