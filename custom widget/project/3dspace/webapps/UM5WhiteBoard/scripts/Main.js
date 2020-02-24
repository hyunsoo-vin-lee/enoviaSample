/*
 * BT WW Competencies Center - Fast Prototypes Team
 * @author UM5
 */

function executeWidgetCode() {
    require(["UWA/Drivers/jQuery", "BTWWSemanticUI/SemanticUIMessage_ES5_UM5_v1/SemanticUIMessage"], function($, SemanticUIMessage) {
        var myWidget = {
            //Web Socket Objects
            webSocket: null,
            wsReady: false,

            //White Board Objects
            boards: [],
            currentBoard: null,

            pendingAction: null, //For add newBoard to switch to the new board when it's created

            _currentDisplay: "boards",
            _mouseDown: false,
            _currentColor: "blue",
            _canvas2dCtx: null,
            penMode: "pen",
            _objectBeingMoved: null,
            _lastPosition: {
                x: 0,
                y: 0
            },

            // Widget Events
            onLoadWidget: function() {
                var wdgUrl = widget.getUrl();
                wdgUrl = wdgUrl.substring(0, wdgUrl.lastIndexOf("/"));

                widget.setIcon(wdgUrl + "/../UM5Modules/assets/icons/custom-widget-icon.png");

                var $wdgBody = $(widget.body);

                $wdgBody.empty();
                $wdgBody.append("<div id='content'>Connecting to Server...</div>");

                //Init Notification UI
                SemanticUIMessage.initContainer({ parent: widget.body });

                if (!myWidget.webSocket || (myWidget.webSocket.readyState !== WebSocket.OPEN && myWidget.webSocket.readyState !== WebSocket.CONNECTING)) {
                    myWidget.webSocket = new WebSocket("wss://3dexp.17xfd04.ds/UM5WhiteboardWS"); //Going through reverse proxy
                    myWidget.webSocket.onopen = myWidget.onWebSocketReady;
                    myWidget.webSocket.onmessage = myWidget.onWebSocketMessage;
                    myWidget.webSocket.onerror = myWidget.onWebSocketError;
                }
            },

            onResizeWidget: function() {
                if (myWidget._currentDisplay === "drawing") {
                    myWidget._uiResizeCanvas();
                }
            },

            onRefreshWidget: function() {
                if (myWidget._currentDisplay === "drawing") {
                    myWidget.redrawCanvas();
                } else {
                    myWidget.showBoards();
                }
            },

            //Web Socket Events
            onWebSocketReady: function() {
                myWidget.wsReady = true;
                /*SemanticUIMessage.addNotif({
                    level: "success",
                    title: "Connected",
                    message: "WebSocket is Ready",
                    sticky: false
                });*/
                myWidget.showBoards();
            },

            onWebSocketError: function(err) {
                SemanticUIMessage.addNotif({
                    level: "error",
                    title: "WebSocket Error",
                    message: JSON.stringify(err),
                    sticky: false
                });
            },

            onWebSocketMessage: function(event) {
                var dataMsg = JSON.parse(event.data);
                //console.log("Web Socket says : ", dataMsg);

                var action = dataMsg.action || "";
                if ("newBoard" === action) {
                    myWidget.doAddNewBoard(dataMsg);
                } else if ("removeBoard" === action) {
                    myWidget.doRemoveBoard(dataMsg);
                } else if ("updateBoard" === action) {
                    myWidget.doUpdateBoard(dataMsg);
                }
                myWidget.pendingAction = null;
            },

            //Web Sockets Actions Code
            sendToWS: function(jsonMsg) {
                if (myWidget.wsReady) {
                    myWidget.webSocket.send(JSON.stringify(jsonMsg));
                } else {
                    SemanticUIMessage.addNotif({
                        level: "error",
                        title: "WebSocket Send",
                        message: "WebSocket not ready, message not sent",
                        sticky: false
                    });
                }
            },

            doAddNewBoard: function(wsMsg) {
                var newBoard = { id: wsMsg.id, title: wsMsg.title, content: wsMsg.content || [] };
                myWidget.boards.push(newBoard);
                if (myWidget.pendingAction && myWidget.pendingAction === "newBoard") {
                    myWidget.currentBoard = newBoard;
                    myWidget.showCurrentBoard();
                } else if (!myWidget.currentBoard) {
                    myWidget.showBoards();
                }
            },

            doUpdateBoard: function(wsMsg) {
                var updatedBoard = { id: wsMsg.id, title: wsMsg.title, content: wsMsg.content || [] };
                if (myWidget.currentBoard && myWidget.currentBoard.id === updatedBoard.id) {
                    myWidget.currentBoard = updatedBoard;
                    if (myWidget._currentDisplay === "drawing") {
                        myWidget.redrawCanvas();
                    }
                }
                //Update in the Array
                for (var i = 0; i < myWidget.boards.length; i++) {
                    var boardHere = myWidget.boards[i];
                    if (boardHere.id === updatedBoard.id) {
                        myWidget.boards[i] = updatedBoard;
                        break;
                    }
                }
            },

            doRemoveBoard: function(wsMsg) {
                var updatedBoard = { id: wsMsg.id, title: wsMsg.title, content: wsMsg.content || [] };
                //Update in the Array
                for (var i = 0; i < myWidget.boards.length; i++) {
                    var boardHere = myWidget.boards[i];
                    if (boardHere.id === updatedBoard.id) {
                        myWidget.boards.splice(i, 1);
                        break;
                    }
                }
                //Refresh display if needed
                if (myWidget.currentBoard && myWidget.currentBoard.id === updatedBoard.id) {
                    myWidget.currentBoard = null;
                    SemanticUIMessage.addNotif({
                        level: "warning",
                        title: "Board Removed",
                        message: "The Board that you were working on as been removed by an administrator",
                        sticky: true
                    });
                    myWidget.showBoards();
                } else if (!myWidget.currentBoard) {
                    myWidget.showBoards();
                }
            },

            //User Action Code
            uiAddNewBoard: function() {
                myWidget.pendingAction = "newBoard";
                myWidget.sendToWS({ action: "newBoard" });
            },

            uiLoadBoard: function() {
                var $this = $(this);
                var boardId = $this.attr("board-id");
                myWidget.currentBoard = myWidget.getBoardById(boardId);
                myWidget.showCurrentBoard();
            },

            uiRemoveBoard: function(ev) {
                ev.preventDefault();
                ev.stopPropagation();
                var $this = $(this);
                var boardId = $this.attr("board-id");
                myWidget.sendToWS({ action: "removeBoard", id: boardId });
            },

            uiBackToBoards: function(ev) {
                myWidget.currentBoard = null;
                myWidget.showBoards();
            },

            uiMouseUpSaveContent: function() {
                myWidget.sendToWS({
                    action: "addContent",
                    id: myWidget.currentBoard.id,
                    content: myWidget.currentBoard.content[myWidget.currentBoard.content.length - 1]
                });
            },

            uiMouseUpUpdateContent: function(contentToUpdate) {
                if (contentToUpdate) {
                    myWidget.sendToWS({
                        action: "updateContent",
                        id: myWidget.currentBoard.id,
                        content: contentToUpdate
                    });
                }
            },

            _uiSetupCanvasEvents: function() {
                var $canvas = $("#canvas2D");

                var mouseDownAt = function(ev, mouseX, mouseY) {
                    if (myWidget.penMode === "move" || myWidget.penMode === "text") {
                        myWidget._mouseDown = true;
                        myWidget.startMoveObjectAt(mouseX, mouseY); //We need it before to be able to test if there is something bellow the cursor to add or not a nex Text
                    }

                    if (myWidget.penMode === "pen" || myWidget.penMode === "eraser") {
                        myWidget._mouseDown = true;

                        var eraseMode = false;
                        if (myWidget.penMode === "eraser") {
                            eraseMode = true;
                        }
                        myWidget.addPaintPoint(mouseX, mouseY, true, eraseMode);
                    } else if (myWidget.penMode === "text" && !myWidget._objectBeingMoved) {
                        myWidget.addTextAt(mouseX, mouseY, $("#textInput").val(), myWidget._currentColor);
                        myWidget.uiMouseUpSaveContent();
                        myWidget.startMoveObjectAt(mouseX, mouseY); //This way we can move it directly
                    }
                };

                var mouseMoveAt = function(ev, mouseX, mouseY, updateCursor) {
                    if (myWidget._mouseDown && (myWidget.penMode === "pen" || myWidget.penMode === "eraser")) {
                        myWidget.addPaintPoint(mouseX, mouseY, false);
                    }
                    if (myWidget.penMode === "move" || myWidget.penMode === "text") {
                        if (myWidget._mouseDown) {
                            myWidget.doMoveObjectTo(mouseX, mouseY);
                        } else if (updateCursor) {
                            myWidget.updateCursorAt(mouseX, mouseY);
                        }
                    }
                };

                var mouseUpAt = function(ev, mouseX, mouseY) {
                    if (myWidget._mouseDown && (myWidget.penMode === "pen" || myWidget.penMode === "eraser")) {
                        myWidget.addPaintPoint(mouseX, mouseY, false);
                        myWidget.uiMouseUpSaveContent();
                    }
                    if ((myWidget.penMode === "move" || myWidget.penMode === "text") && myWidget._mouseDown) {
                        myWidget.doMoveObjectTo(mouseX, mouseY);
                        if (myWidget.penMode === "text") {
                            $("#textInput").focus();
                        }
                        myWidget.uiMouseUpUpdateContent(myWidget._objectBeingMoved);
                    }
                    myWidget._mouseDown = false;
                };

                $canvas.mousedown(function(ev) {
                    var mouseX = ev.pageX - this.offsetLeft;
                    var mouseY = ev.pageY - this.offsetTop;

                    mouseDownAt(ev, mouseX, mouseY);
                });

                $canvas.mousemove(function(ev) {
                    var mouseX = ev.pageX - this.offsetLeft;
                    var mouseY = ev.pageY - this.offsetTop;

                    mouseMoveAt(ev, mouseX, mouseY, true);
                });

                $canvas.mouseup(function(ev) {
                    var mouseX = ev.pageX - this.offsetLeft;
                    var mouseY = ev.pageY - this.offsetTop;

                    mouseUpAt(ev, mouseX, mouseY);
                });

                $canvas.mouseleave(function(ev) {
                    myWidget._mouseDown = false;
                });

                $canvas.on("touchstart", function(ev) {
                    ev.preventDefault();
                    var mouseX = ev.originalEvent.targetTouches[0].pageX - this.offsetLeft;
                    var mouseY = ev.originalEvent.targetTouches[0].pageY - this.offsetTop;

                    mouseDownAt(ev, mouseX, mouseY);
                });

                $canvas.on("touchmove", function(ev) {
                    ev.preventDefault();
                    var mouseX = ev.originalEvent.targetTouches[0].pageX - this.offsetLeft;
                    var mouseY = ev.originalEvent.targetTouches[0].pageY - this.offsetTop;

                    mouseMoveAt(ev, mouseX, mouseY, false);
                });

                $canvas.on("touchend", function(ev) {
                    ev.preventDefault();
                    var mouseX = ev.originalEvent.targetTouches[0].pageX - this.offsetLeft;
                    var mouseY = ev.originalEvent.targetTouches[0].pageY - this.offsetTop;

                    mouseUpAt(ev, mouseX, mouseY);
                });

                $canvas.on("touchleave", function(ev) {
                    ev.preventDefault();

                    myWidget._mouseDown = false;
                });
            },

            _uiResizeCanvas: function() {
                var $divCanvas = $("#canvasDiv");
                var $canvas = $("#canvas2D");

                var w = $divCanvas.width();
                var h = $divCanvas.height();

                $canvas.attr("width", w);
                $canvas.attr("height", h);

                myWidget.redrawCanvas();
            },

            uiChangeModeTo: function(newMode) {
                var lastMode = myWidget.penMode;

                $("#canvasDiv").css("cursor", "default"); //Reset it here to avoid having move cursor if a move was done just before switching Pen Mode

                if (lastMode === newMode && (newMode === "pen" || newMode === "text")) {
                    $("#colorCurrent").click(); //Hide or Show Color Picker
                } else {
                    myWidget.penMode = newMode;

                    $("#penBtn").removeClass("active");
                    $("#eraserBtn").removeClass("active");
                    $("#textBtn").removeClass("active");
                    $("#moveBtn").removeClass("active");

                    if (newMode === "pen") {
                        $("#penBtn").addClass("active");
                    } else if (newMode === "eraser") {
                        $("#eraserBtn").addClass("active");
                    } else if (newMode === "text") {
                        $("#textBtn").addClass("active");
                    } else if (newMode === "move") {
                        $("#moveBtn").addClass("active");
                    }

                    myWidget.displayPenOptions();
                }
            },

            //Other code
            getBoardById: function(boardId) {
                var board = null;
                for (var i = 0; i < myWidget.boards.length; i++) {
                    var boardHere = myWidget.boards[i];
                    if (boardHere.id === boardId) {
                        board = boardHere;
                        break;
                    }
                }
                return board;
            },

            //Display code
            showBoards: function() {
                myWidget._currentDisplay = "boards";
                var $content = $("#content");

                $content.empty();

                for (var i = 0; i < myWidget.boards.length; i++) {
                    var board = myWidget.boards[i];

                    var $divBoard = $("<div class='boardPreview'>" + board.title + "</div>");
                    $divBoard.attr("board-id", board.id);
                    $divBoard.click(myWidget.uiLoadBoard);

                    var $iconRemove = $("<i class='remove icon'></i>");
                    $iconRemove.attr("board-id", board.id);
                    $iconRemove.click(myWidget.uiRemoveBoard);

                    $divBoard.append($iconRemove);

                    $content.append($divBoard);
                }

                var $divAddBoard = $("<div class='boardPreview'>Add Board</div>");
                $divAddBoard.click(function(ev) {
                    myWidget.uiAddNewBoard();
                });

                $content.append($divAddBoard);
            },

            showCurrentBoard: function() {
                myWidget._currentDisplay = "drawing";
                if (!myWidget.currentBoard) {
                    myWidget.showBoards();
                    return;
                }
                var $content = $("#content");

                $content.empty();

                var $divCanvas = $("<div id='canvasDiv'></div>");

                var $divBoardTitle = $("<div id='boardTitle'>" + myWidget.currentBoard.title + "</div>");
                $divCanvas.append($divBoardTitle);

                var $divBackToBoards = $("<div id='backToBoards'><i class='chevron left icon'></i></div>");
                $divBackToBoards.click(myWidget.uiBackToBoards);
                $divCanvas.append($divBackToBoards);

                var $canvas = $("<canvas id='canvas2D'></canvas>");
                $divCanvas.append($canvas);

                $content.append($divCanvas);

                var canvas2D = $canvas.get(0);
                myWidget._canvas2dCtx = canvas2D.getContext("2d");

                myWidget.addToolbar($divCanvas);

                myWidget._uiSetupCanvasEvents();
                myWidget._uiResizeCanvas(); //Will do the redraw
            },

            addToolbar: function($divParent) {
                //Add the toolbar

                var $divBottom = $("<div id='bottomContent'></div>");

                var $botToolbar = $("<div id='botToolbar'></div>");

                $divBottom.append($botToolbar);
                $divParent.append($divBottom);

                //Load the buttons
                var $btnPen = $("<div id='penBtn' class='toolbarBtn active'><i class='icon write'></i></div>");
                $btnPen.click(function(ev) {
                    myWidget.uiChangeModeTo("pen");
                });
                $botToolbar.append($btnPen);

                var $btnEraser = $("<div id='eraserBtn' class='toolbarBtn'><i class='icon erase'></i></div>");
                $btnEraser.click(function(ev) {
                    myWidget.uiChangeModeTo("eraser");
                });
                $botToolbar.append($btnEraser);

                var $btnText = $(
                    "<div id='textBtn' class='toolbarBtn'><i class='icons'><i class='icon font'></i><i class='corner icon text cursor'></i></i></div>"
                );
                $btnText.click(function(ev) {
                    myWidget.uiChangeModeTo("text");
                });
                $botToolbar.append($btnText);

                var $btnMove = $("<div id='moveBtn' class='toolbarBtn'><i class='icon move'></i></div>");
                $btnMove.click(function(ev) {
                    myWidget.uiChangeModeTo("move");
                });
                $botToolbar.append($btnMove);

                var $btnUndo = $("<div id='undoBtn' class='toolbarBtn'><i class='icon undo'></i></div>");
                $btnUndo.click(function(ev) {});
                $botToolbar.append($btnUndo);

                var $btnRedo = $("<div id='redoBtn' class='toolbarBtn'><i class='icon repeat'></i></div>");
                $btnRedo.click(function(ev) {});
                $botToolbar.append($btnRedo);

                var $divHidden = $("<div id='hiddenOptions'><div>");
                $divParent.append($divHidden);
            },

            displayPenOptions: function() {
                $("#hiddenOptions").empty();
                if (myWidget.penMode === "text") {
                    var textInfos = myWidget._getLastText();
                    if (!textInfos) {
                        textInfos = {
                            text: "",
                            color: "#1e70d5"
                        };
                    }
                    var textVal = textInfos.text;
                    var $textInput = $("<input id='textInput' name='textInput' type='text' placeholder='Text To Draw...' value='" + textVal + "'/>");
                    $textInput.on("change keyup", function(ev) {
                        myWidget._updateLastText($(this).val());
                    });
                    $textInput.on("focusin focus", function(ev) {
                        //To solve issues with Safari on iOS 10+
                        ev.preventDefault();
                        ev.stopPropagation();
                        window.scrollTo(0, 0);
                        window.parent.scrollTo(0, 0);
                        document.body.scrollTop = 0;
                        window.parent.document.body.scrollTop = 0;
                    });
                    $("#hiddenOptions").append($textInput);
                    $textInput.focus();
                }
            },

            redrawCanvas: function(noVisualHelpers) {
                //noVisualHelpers to generate the image to Save

                var ctx2d = myWidget._canvas2dCtx;

                ctx2d.clearRect(0, 0, ctx2d.canvas.width, ctx2d.canvas.height); //Clear

                //Default values
                ctx2d.lineJoin = "round";
                ctx2d.lineWidth = 5;
                ctx2d.strokeStyle = "black";
                var canvasWidth;
                var i, j;

                for (i = 0; i < myWidget.currentBoard.content.length; i++) {
                    var objPaint = myWidget.currentBoard.content[i];
                    ctx2d.globalCompositeOperation = objPaint.mode;

                    //console.log(i+"-objPaint=");
                    //console.log(objPaint);

                    if (objPaint.type === "paint") {
                        ctx2d.lineWidth = objPaint.size;
                        ctx2d.strokeStyle = objPaint.color;
                        ctx2d.beginPath();
                        if (objPaint.points.length >= 1) {
                            ctx2d.moveTo(objPaint.points[0].x, objPaint.points[0].y);
                        }
                        var xMin = objPaint.points[0].x,
                            xMax = objPaint.points[0].x,
                            yMin = objPaint.points[0].y,
                            yMax = objPaint.points[0].y;
                        for (j = 1; j < objPaint.points.length; j++) {
                            var pt = objPaint.points[j];
                            ctx2d.lineTo(pt.x, pt.y);
                            xMin = Math.min(xMin, pt.x);
                            xMax = Math.max(xMax, pt.x);
                            yMin = Math.min(yMin, pt.y);
                            yMax = Math.max(yMax, pt.y);
                        }
                        //ctx2d.closePath();
                        ctx2d.stroke();

                        //Update bounding box for Moving objects
                        objPaint.boundingBox = {
                            x1: xMin,
                            y1: yMin,
                            x2: xMax,
                            y2: yMax
                        };
                    } else if (objPaint.type === "text") {
                        ctx2d.textBaseline = "hanging";
                        ctx2d.font = objPaint.size + "px " + objPaint.font;
                        ctx2d.fillStyle = objPaint.color;

                        canvasWidth = ctx2d.canvas.width;

                        //Draw taking into account max width for the text block
                        var maxTextWidth = Math.min(objPaint.maxWidth, canvasWidth - objPaint.point.x - 5); //5px of margin against the right border
                        var wordsList = objPaint.text.split(" ");
                        var currentTextLine = wordsList[0];
                        var textMetricsWidth = 0;
                        var currentLineIndex = 0;
                        var lineHeightOffset = objPaint.size * 1.2;

                        for (j = 1; j < wordsList.length; j++) {
                            var word = wordsList[j];
                            textMetricsWidth = ctx2d.measureText(currentTextLine + " " + word).width;
                            if (textMetricsWidth > maxTextWidth) {
                                //Write current Text
                                ctx2d.fillText(currentTextLine, objPaint.point.x, objPaint.point.y + currentLineIndex * lineHeightOffset);
                                currentLineIndex++;
                                currentTextLine = word;
                            } else {
                                //Keep adding Text to the line
                                currentTextLine = currentTextLine + " " + word;
                            }
                        }
                        //Remember to write last line of text
                        ctx2d.fillText(currentTextLine, objPaint.point.x, objPaint.point.y + currentLineIndex * lineHeightOffset);

                        //Update bounding box for Moving objects
                        objPaint.boundingBox = {
                            x1: objPaint.point.x,
                            y1: objPaint.point.y,
                            x2: objPaint.point.x + maxTextWidth,
                            y2: objPaint.point.y + (currentLineIndex + 1) * lineHeightOffset
                        };
                    } else if (objPaint.type === "imgB64") {
                        if (objPaint.drawMode === "extend") {
                            if (!objPaint.drawWidth || !objPaint.drawHeight) {
                                //ctx2d.canvas.width, ctx2d.canvas.height
                                canvasWidth = ctx2d.canvas.width;
                                var canvasHeight = ctx2d.canvas.height;
                                var ratioCanvas = canvasWidth / canvasHeight;

                                var imgToDraw = objPaint.content;

                                var imgWidth = imgToDraw.naturalWidth;
                                var imgHeight = imgToDraw.naturalHeight;
                                var ratioImg = imgWidth / imgHeight;

                                if (ratioImg >= ratioCanvas) {
                                    objPaint.drawWidth = ctx2d.canvas.width;
                                    objPaint.drawHeight = ctx2d.canvas.width / ratioImg;
                                } else {
                                    objPaint.drawHeight = ctx2d.canvas.height;
                                    objPaint.drawWidth = ctx2d.canvas.height * ratioImg;
                                }

                                //objPaint.drawWidth = ctx2d.canvas.width;
                                //objPaint.drawHeight = ctx2d.canvas.height;
                            }

                            ctx2d.save();

                            var posX = objPaint.point.x;
                            var posY = objPaint.point.y;

                            //Manage Image orientation + Position update
                            switch (objPaint.orientation) {
                                case 2:
                                    ctx2d.translate(objPaint.drawWidth, 0);
                                    ctx2d.scale(-1, 1);
                                    posX = -1 * posX;
                                    break; //Pos Done
                                case 3:
                                    ctx2d.translate(objPaint.drawWidth, objPaint.drawHeight);
                                    ctx2d.rotate(Math.PI);
                                    posX = -1 * posX;
                                    posY = -1 * posY;
                                    break; //Pos Done
                                case 4:
                                    ctx2d.translate(0, objPaint.drawHeight);
                                    ctx2d.scale(1, -1);
                                    posY = -1 * posY;
                                    break; //Pos Done
                                case 5:
                                    ctx2d.rotate(0.5 * Math.PI);
                                    ctx2d.scale(1, -1);
                                    posX = objPaint.point.y;
                                    posY = objPaint.point.x;
                                    break; //Pos Done
                                case 6:
                                    ctx2d.rotate(0.5 * Math.PI);
                                    ctx2d.translate(0, -objPaint.drawHeight);
                                    posX = objPaint.point.y;
                                    posY = -1 * objPaint.point.x;
                                    break; //Pos Done
                                case 7:
                                    ctx2d.rotate(0.5 * Math.PI);
                                    ctx2d.translate(objPaint.drawWidth, -objPaint.drawHeight);
                                    ctx2d.scale(-1, 1);
                                    posX = -1 * objPaint.point.y;
                                    posY = -1 * objPaint.point.x;
                                    break; //Pos Done
                                case 8:
                                    ctx2d.rotate(-0.5 * Math.PI);
                                    ctx2d.translate(-objPaint.drawWidth, 0);
                                    posX = -1 * objPaint.point.y;
                                    posY = objPaint.point.x;
                                    break; //Pos Done
                            }

                            ctx2d.drawImage(objPaint.content, posX, posY, objPaint.drawWidth, objPaint.drawHeight);
                            ctx2d.restore();

                            //Update bounding box for Moving objects
                            objPaint.boundingBox = {
                                x1: objPaint.point.x,
                                y1: objPaint.point.y,
                                x2: objPaint.point.x + objPaint.drawWidth,
                                y2: objPaint.point.y + objPaint.drawHeight
                            };
                            if (objPaint.orientation >= 5 && objPaint.orientation <= 8) {
                                //Invert Height and Width due to rotation
                                objPaint.boundingBox = {
                                    x1: objPaint.point.x,
                                    y1: objPaint.point.y,
                                    x2: objPaint.point.x + objPaint.drawHeight,
                                    y2: objPaint.point.y + objPaint.drawWidth
                                };
                            }
                        } else {
                            //normal mode
                            ctx2d.drawImage(objPaint.content, 0, 0);
                        }
                    }

                    //Add Selection Box if needed
                    if (
                        !noVisualHelpers &&
                        myWidget._objectBeingMoved &&
                        myWidget._objectBeingMoved === objPaint &&
                        (myWidget.penMode === "move" || myWidget.penMode === "text")
                    ) {
                        ctx2d.globalCompositeOperation = "source-over";
                        ctx2d.fillStyle = "black";
                        ctx2d.fillRect(objPaint.boundingBox.x1 - 5, objPaint.boundingBox.y1 - 5, 5, 5);
                        ctx2d.fillRect(objPaint.boundingBox.x2, objPaint.boundingBox.y1 - 5, 5, 5);
                        ctx2d.fillRect(objPaint.boundingBox.x2, objPaint.boundingBox.y2, 5, 5);
                        ctx2d.fillRect(objPaint.boundingBox.x1 - 5, objPaint.boundingBox.y2, 5, 5);
                    }
                }
            },
            addPaintPoint: function(x, y, startPoint, erase) {
                //console.log("addPaintPoint, x="+x+", y="+y+", startPoint="+startPoint+", erase="+erase);
                if (startPoint) {
                    myWidget.currentBoard.content.push({
                        id: "paint-" + Date.now(),
                        type: "paint",
                        color: erase ? "rgba(0,0,0,1)" : myWidget._currentColor,
                        size: erase ? 8 : 3,
                        points: [],
                        mode: erase ? "destination-out" : "source-over" //Erase or Draw over as a normal pen
                    });
                }

                var objPath = myWidget.currentBoard.content[myWidget.currentBoard.content.length - 1];
                objPath.points.push({
                    x: x,
                    y: y
                });

                myWidget.redrawCanvas();
            },

            addTextAt: function(x, y, text, color) {
                var canvasWidth = myWidget._canvas2dCtx.canvas.width;

                myWidget.currentBoard.content.push({
                    id: "text-" + Date.now(),
                    type: "text",
                    color: color,
                    size: 20,
                    point: {
                        x: x,
                        y: y
                    },
                    maxWidth: canvasWidth * 0.95,
                    text: text,
                    font: "Arial",
                    mode: "source-over"
                });

                myWidget.redrawCanvas();
            },

            updateCursorAt: function(x, y) {
                //console.log("updateCursorAt : "+x+" - "+y);
                var isObjectUnderCursor = false;
                for (var i = myWidget.currentBoard.content.length - 1; i >= 0; i--) {
                    //Take the last one first
                    var objPaint = myWidget.currentBoard.content[i];
                    if (objPaint.boundingBox) {
                        if (x >= objPaint.boundingBox.x1 && x <= objPaint.boundingBox.x2 && y >= objPaint.boundingBox.y1 && y <= objPaint.boundingBox.y2) {
                            isObjectUnderCursor = true;
                            break;
                        }
                    }
                }
                //console.log("updateCursorAt : isObjectUnderCursor="+isObjectUnderCursor);
                if (isObjectUnderCursor) {
                    $("#canvasDiv").css("cursor", "move");
                } else {
                    $("#canvasDiv").css("cursor", "default");
                }
            },

            startMoveObjectAt: function(x, y) {
                var isObjectUnderCursor = false;
                for (var i = myWidget.currentBoard.content.length - 1; i >= 0; i--) {
                    //Take the last one first
                    var objPaint = myWidget.currentBoard.content[i];
                    if (objPaint.boundingBox) {
                        if (x >= objPaint.boundingBox.x1 && x <= objPaint.boundingBox.x2 && y >= objPaint.boundingBox.y1 && y <= objPaint.boundingBox.y2) {
                            myWidget._objectBeingMoved = objPaint;
                            myWidget._lastPosition.x = x;
                            myWidget._lastPosition.y = y;
                            isObjectUnderCursor = true;
                            break;
                        }
                    }
                }
                if (!isObjectUnderCursor) {
                    myWidget._objectBeingMoved = null;
                }
                //Update Text input and color when a text is selected
                if (myWidget._objectBeingMoved && myWidget._objectBeingMoved.type === "text" && (myWidget.penMode === "text" || myWidget.penMode === "move")) {
                    myWidget._currentColor = myWidget._objectBeingMoved.color;
                    if (myWidget.penMode === "text") {
                        $("#colorCurrent").css("background-color", myWidget._objectBeingMoved.color);
                        $("#textInput").val(myWidget._objectBeingMoved.text);
                    }
                }
            },

            doMoveObjectTo: function(x, y) {
                if (myWidget._objectBeingMoved) {
                    var offsetX = x - myWidget._lastPosition.x;
                    var offsetY = y - myWidget._lastPosition.y;

                    if (myWidget._objectBeingMoved.type === "text") {
                        myWidget._objectBeingMoved.point.x = myWidget._objectBeingMoved.point.x + offsetX;
                        myWidget._objectBeingMoved.point.y = myWidget._objectBeingMoved.point.y + offsetY;
                    } else if (myWidget._objectBeingMoved.type === "paint") {
                        var arrPoints = myWidget._objectBeingMoved.points;
                        for (var i = 0; i < arrPoints.length; i++) {
                            var point = arrPoints[i];
                            point.x = point.x + offsetX;
                            point.y = point.y + offsetY;
                        }
                    }
                    myWidget._lastPosition.x = x;
                    myWidget._lastPosition.y = y;
                }
                myWidget.redrawCanvas();
            },

            _getLastText: function() {
                var lastText;
                if (myWidget._objectBeingMoved && myWidget._objectBeingMoved.type === "text") {
                    lastText = myWidget._objectBeingMoved;
                } else {
                    var arrPaintObjs = myWidget.currentBoard.content;
                    for (var i = arrPaintObjs.length - 1; i >= 0; i--) {
                        var objPaint = arrPaintObjs[i];
                        if (objPaint.type === "text") {
                            lastText = objPaint;
                            break;
                        }
                    }
                }
                return lastText;
            },
            _updateLastText: function(textVal) {
                var lastText = myWidget._getLastText();
                if (lastText) {
                    lastText.text = textVal;
                    myWidget.redrawCanvas();
                    myWidget.uiMouseUpUpdateContent(lastText);
                }
            },
            _updateLastTextColor: function(textColor) {
                var lastText = myWidget._getLastText();
                if (lastText) {
                    lastText.color = textColor;
                    myWidget.redrawCanvas();
                }
            }
        };

        widget.addEvent("onLoad", myWidget.onLoadWidget);
        widget.addEvent("onRefresh", myWidget.onRefreshWidget);
        widget.addEvent("onResize", myWidget.onResizeWidget);
    });
}
