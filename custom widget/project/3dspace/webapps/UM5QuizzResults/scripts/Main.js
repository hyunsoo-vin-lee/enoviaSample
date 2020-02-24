/*
 * BT WW Competencies Center - Fast Prototypes Team
 * @author UM5
 */

function executeWidgetCode() {
    require(["UWA/Drivers/jQuery", "css!BTWWLibrairies/semantic-ui/semantic.min"], function ($) {
        var myWidget = {
            questions: [],
            head: "TBD",

            questionsResultsCounts: [],

            urlWebSocket: "",
            webSocket: null,
            wsReady: false,

            // Widget Events
            onLoadWidget: function () {
                var wdgUrl = widget.getUrl();
                wdgUrl = wdgUrl.substring(0, wdgUrl.lastIndexOf("/"));

                widget.setIcon(wdgUrl + "/../UM5Modules/assets/icons/custom-widget-icon.png");

                var $wdgBody = $(widget.body);
                $wdgBody.empty();

                $wdgBody.append("<div id='content'></div>");

                myWidget.loadConfigFile();
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
                        myWidget.urlWebSocket = data.urlWebSocket;
                        myWidget.questions = data.questions;
                        myWidget.head = data.head;
                        myWidget.startPage = data.startPage;
                        myWidget.endPage = data.endPage;

                        myWidget.buildDisplay();

                        if (!myWidget.webSocket ||
                            (myWidget.webSocket.readyState !== WebSocket.OPEN && myWidget.webSocket.readyState !== WebSocket.CONNECTING)
                        ) {
                            myWidget.webSocket = new WebSocket(myWidget.urlWebSocket); //Going through reverse proxy
                            myWidget.webSocket.onopen = myWidget.onWebSocketReady;
                            myWidget.webSocket.onmessage = myWidget.onWebSocketMessage;
                        }
                    },
                    error: function (jqXHR, txtStatus, errorThrown) {
                        widget.body.innerHTML = "Error will loading config File :" + txtStatus + "<br>" + errorThrown;
                    }
                });
            },

            loadResults: function () {
                $("div.errorLog").remove();
                let baseUrl = widget.getValue("baseURL");
                var urlToCall = baseUrl + "/UM5QuizzModeler/UM5QuizzWS/" + myWidget.confName + "/getResults";
                $.ajax({
                    dataType: "json",
                    url: urlToCall,
                    method: "GET",
                    data: "",
                    success: function (data) {
                        myWidget.questionsResultsCounts = data;

                        if (myWidget.questionsResultsCounts.length > 0) {
                            var $nbParticipants = $("#nbParticipants");
                            $nbParticipants.html(myWidget.questionsResultsCounts[0]["nbAnswers"]);
                        }

                        myWidget.buildResultsDisplay();
                    },
                    error: function (jqXHR, txtStatus, errorThrown) {
                        $("#content").append("<div class='errorLog'>Error will loading Results: " + jqXHR.status + " " + txtStatus + "<br>" + errorThrown + "</div>");
                    }
                });
            },

            buildDisplay: function () {
                var $content = $("#content");
                $content.empty();

                $content.append("<div class='ui label blue' style='margin-bottom: 0.5em;'><i class='icon users'></i><span id='nbParticipants'>??</span></div>");

                var $saveBtn = $("<div id='saveBtn' title='Export as CSV'>&#128190;</div>"); //Unicode Save (Floppy disk)
                $saveBtn.click(myWidget.exportCSV);
                $content.append($saveBtn);

                var $clearBtn = $("<div id='clearBtn' title='Clear Quizz Results'><i class='icon trash alternate'></i></div>"); //Unicode Save (Floppy disk)
                $clearBtn.click(myWidget.clearQuizzResults);
                $content.append($clearBtn);

                var bCheckDispOneByOne = widget.getValue("checkDispOneByOne") === "true";
                myWidget.currentQuestion = myWidget.currentQuestion || 0;

                var dispQPanel = function (qIndex) {
                    $("div.questionResult").addClass("hidden");
                    $("#q-" + qIndex).removeClass("hidden");
                };
                var qPrev = function () {
                    myWidget.currentQuestion--;
                    if (myWidget.currentQuestion < 0) {
                        myWidget.currentQuestion = myWidget.questions.length - 1;
                    }
                    dispQPanel(myWidget.currentQuestion);
                };
                var qNext = function () {
                    myWidget.currentQuestion++;
                    if (myWidget.currentQuestion >= myWidget.questions.length) {
                        myWidget.currentQuestion = 0;
                    }
                    dispQPanel(myWidget.currentQuestion);
                };

                var i;
                for (i = 0; i < myWidget.questions.length; i++) {
                    var questionItem = myWidget.questions[i];
                    var $divQuestion = myWidget.buildQuestionDiv(questionItem, i);

                    if (bCheckDispOneByOne) {
                        //Append a next button
                        if (i !== myWidget.currentQuestion) {
                            $divQuestion.addClass("hidden");
                        }
                        var $divButtons = $("<div class='buttonsPrevNext'></div>");
                        var $btnPrev = $("<button class='ui button icon blue'><i class='icon chevron left'></i></button>");
                        var $btnNext = $("<button class='ui button icon blue'><i class='icon chevron right'></i></button>");

                        $btnPrev.click(qPrev);
                        $btnNext.click(qNext);

                        $divButtons.append($btnPrev);
                        $divButtons.append($btnNext);

                        $divQuestion.append($divButtons);
                    }
                    $content.append($divQuestion);
                }

                myWidget.buildResultsDisplay();
                myWidget.loadResults();
            },

            buildQuestionDiv: function (questionItem, index) {
                var $divQuestion = $("<div id='q-" + index + "'  class='questionResult'></div>");
                $divQuestion.append("<div class='question'>" + questionItem.question + "</div>");
                $divQuestion.append("<div id='result-" + index + "' class='result'>" + "</div>");
                return $divQuestion;
            },

            buildResultsDisplay: function () {
                var i = 0;
                for (i = 0; i < myWidget.questionsResultsCounts.length; i++) {
                    var qRes = myWidget.questionsResultsCounts[i];
                    try {
                        myWidget.updateQuestionResult(qRes, i);
                    } catch (error) {
                        console.error(error);
                    }
                }
            },

            updateQuestionResult: function (qRes, index) {
                var $divToUpdate = $("#result-" + index);
                $divToUpdate.empty();

                var arrCorrectAnswers = myWidget.questions[index].correct;
                var allCorrect = false;
                if (!arrCorrectAnswers) {
                    arrCorrectAnswers = [""];
                    allCorrect = true;
                }

                var answersNumber = qRes["nbAnswers"];

                if (myWidget.questions[index].type === "YesNo") {
                    var correctIs = arrCorrectAnswers[0];

                    var percentYes = (qRes["yes"] || 0) / answersNumber * 100;
                    var percentNo = (qRes["no"] || 0) / answersNumber * 100;

                    if (correctIs === "yes") {
                        var $divCorrectYes = $("<div class='correct inline'>Yes</div>");
                        $divCorrectYes.css("width", percentYes + "%");
                        $divCorrectYes.append(
                            "<div class='percentage'>" +
                            percentYes.toLocaleString(undefined, {
                                maximumFractionDigits: 1
                            }) +
                            "% (" +
                            (qRes["yes"] || 0) +
                            ")</div>"
                        );

                        var $divIncorrectNo = $("<div class='incorrect inline'>No</div>");
                        $divIncorrectNo.css("width", percentNo + "%");
                        $divIncorrectNo.append(
                            "<div class='percentage'>" +
                            percentNo.toLocaleString(undefined, {
                                maximumFractionDigits: 1
                            }) +
                            "% (" +
                            (qRes["no"] || 0) +
                            ")</div>"
                        );

                        if (percentYes > 0) $divToUpdate.append($divCorrectYes);
                        if (percentNo > 0) $divToUpdate.append($divIncorrectNo);
                    } else {
                        var $divCorrectNo = $("<div class='correct inline'>No</div>");
                        $divCorrectNo.css("width", percentNo + "%");
                        $divCorrectNo.append(
                            "<div class='percentage'>" +
                            percentNo.toLocaleString(undefined, {
                                maximumFractionDigits: 1
                            }) +
                            "% (" +
                            (qRes["no"] || 0) +
                            ")</div>"
                        );

                        var $divIncorrectYes = $("<div class='incorrect inline'>Yes</div>");
                        $divIncorrectYes.css("width", percentYes + "%");
                        $divIncorrectYes.append(
                            "<div class='percentage'>" +
                            percentYes.toLocaleString(undefined, {
                                maximumFractionDigits: 1
                            }) +
                            "% (" +
                            (qRes["yes"] || 0) +
                            ")</div>"
                        );

                        if (percentNo > 0) $divToUpdate.append($divCorrectNo);
                        if (percentYes > 0) $divToUpdate.append($divIncorrectYes);
                    }
                } else {
                    for (var key in qRes) {
                        if (qRes.hasOwnProperty(key) && key !== "nbAnswers") {
                            var counter = qRes[key];
                            var percentage = counter / answersNumber * 100;
                            var $divAnswer = $(
                                "<div class='answer'>" + key + " - " + percentage.toLocaleString(undefined, {
                                    maximumFractionDigits: 1
                                }) + "% (" +
                                (counter || 0) +
                                ")</div>"
                            );
                            $divAnswer.css("width", percentage + "%");
                            if (arrCorrectAnswers.indexOf(key) !== -1 || allCorrect) {
                                $divAnswer.addClass("correct");
                            } else {
                                $divAnswer.addClass("incorrect");
                            }
                            $divToUpdate.append($divAnswer);
                        }
                    }
                }
            },

            onWebSocketReady: function () {
                myWidget.wsReady = true;
                //console.log("WebSocket is Ready");
            },

            onWebSocketMessage: function (event) {
                var dataMsg = JSON.parse(event.data);
                //console.log("Web Socket says : ", dataMsg);
                var action = dataMsg.action || "";
                if ("updateAvailable" === action) {
                    myWidget.loadResults();
                }
            },

            exportCSV: function () {
                //Do export results as CSV
                var splitChar = ",";
                var strCSV = "Question" + splitChar + "Value" + splitChar + "NumberOfAnswers" + splitChar + "Percent\r\n";
                var i = 0;
                for (i = 0; i < myWidget.questionsResultsCounts.length; i++) {
                    var qRes = myWidget.questionsResultsCounts[i];
                    var answersNumber = qRes["nbAnswers"];
                    for (var key in qRes) {
                        if (qRes.hasOwnProperty(key) && key !== "nbAnswers") {
                            var counter = qRes[key];
                            var percentage = counter / answersNumber * 100;
                            strCSV += i + 1 + splitChar + "\"" + key.replace(/"/g, "\\\"").replace(/'/g, '\\\'') + "\"" + splitChar + counter + splitChar + percentage + "\r\n";
                        }
                    }
                    strCSV += i + 1 + splitChar + "Total results" + splitChar + answersNumber + splitChar + "100\r\n";
                }

                strCSV = "data:text/csv;charset=utf-8," + strCSV;

                var fileName = "ExportQuizz_" + myWidget.configName + "_" + Date.now() + ".csv";
                var $aCSV = $("<a href=\"" + encodeURI(strCSV) + "\" download='" + fileName + "' style='display:none;'>CSV</a>");
                $(widget.body).append($aCSV);
                $aCSV.get(0).click();
                $aCSV.remove();
            },

            clearQuizzResults: function () {
                if (confirm("Are you sure to want to delete the Quizz Results ? Did you exported them first ??")) {
                    if (confirm("Really !? You really want to delete the quizz result ??")) {
                        myWidget.doClearQuizzResults();
                    }
                }
            },

            doClearQuizzResults: function () {
                //var urlToCall = myWidget.urlGetResult.replace("{quizzName}", myWidget.configNameResult);
                let baseUrl = widget.getValue("baseURL");
                var urlToCall = baseUrl + "/UM5QuizzModeler/UM5QuizzWS/" + myWidget.confName + "/getResults";
                $.ajax({
                    dataType: "json",
                    url: urlToCall,
                    method: "DELETE",
                    data: "",
                    success: function (data) {
                        if (data && data.msg === "OK") {
                            myWidget.quizzResults = [];
                            widget.setValue("quizzResults", JSON.stringify(myWidget.quizzResults));
                            console.debug("OK - Deleted results from the server");
                            myWidget.questionsResultsCounts = [];
                            myWidget.onLoadWidget();
                        }
                    },
                    error: function ( /*jqXHR, txtStatus, errorThrown*/ ) {
                        console.warn("KO - Impossible to delete Quizz Results from the server");
                    }
                });
            }

        };

        widget.addEvent("onLoad", myWidget.onLoadWidget);
    });
}