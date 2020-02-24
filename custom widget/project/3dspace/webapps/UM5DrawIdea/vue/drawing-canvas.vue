<template>
  <div class="canvasDiv">
    <canvas
      class="canvas2d"
      @mousedown="downAt(getMousePosition($event))"
      @mousemove="if(mouseOrTouchDown){moveAt(getMousePosition($event))}"
      @mouseup="if(mouseOrTouchDown){upAt(getMousePosition($event))}"
      @mouseleave="if(mouseOrTouchDown){upAt(getMousePosition($event))}"
      @touchstart.prevent="downAt(getTouchPosition($event))"
      @touchmove.prevent="if(mouseOrTouchDown){moveAt(getTouchPosition($event))}"
      @touchend.prevent="if(mouseOrTouchDown){upAt(getTouchPosition($event))}"
      @touchleave.prevent="if(mouseOrTouchDown){upAt(getTouchPosition($event))}"
      @dragenter.stop="dragOver=true"
      @dragleave.stop="dragOver=false"
      @dragover.prevent.stop="dragOver=true"
      @drop.prevent.stop="drop($event)"
    ></canvas>
    <div class="canvasTop">
      <div class="topToolsLeft">
        <v-btn icon small @click="genPreviewAndGoBack()">
          <v-icon>chevron_left</v-icon>
        </v-btn>
      </div>
      <div class="canvasName">
        <input type="text" @change="nameChange" :value="boardName">
      </div>
      <div class="topToolsRight">
        <v-btn icon small @click="addDrawing()">
          <v-icon>add</v-icon>
        </v-btn>
        <v-btn icon small @click="screenshot()">
          <v-icon>camera_alt</v-icon>
        </v-btn>
      </div>
    </div>

    <div class="canvasTools">
      <div class="centering">
        <div :class="['btnTool', drawMode==='pen'?'active':'']" @click="drawMode='pen'">
          <v-icon>gesture</v-icon>
        </div>
        <div :class="['btnTool', drawMode==='eraser'?'active':'']" @click="drawMode='eraser'">
          <v-icon>backspace</v-icon>
        </div>
        <div :class="['btnTool', drawMode==='move'?'active':'']" @click="drawMode='move'">
          <v-icon>zoom_out_map</v-icon>
        </div>
        <div :class="['btnTool']">
          <v-icon :style="'color:'+currentColor" @click="togglePalette">palette</v-icon>
          <div v-if="showPalette" class="palette">
            <span
              class="colorBullet"
              style="background-color:red;"
              @click="currentColor='red';showPalette=false;"
            ></span>
            <span
              class="colorBullet"
              style="background-color:orange;"
              @click="currentColor='orange';showPalette=false;"
            ></span>
            <span
              class="colorBullet"
              style="background-color:yellow;"
              @click="currentColor='yellow';showPalette=false;"
            ></span>
            <span
              class="colorBullet"
              style="background-color:green;"
              @click="currentColor='green';showPalette=false;"
            ></span>
            <span
              class="colorBullet"
              style="background-color:cyan;"
              @click="currentColor='cyan';showPalette=false;"
            ></span>
            <span
              class="colorBullet"
              style="background-color:blue;"
              @click="currentColor='blue';showPalette=false;"
            ></span>
            <span
              class="colorBullet"
              style="background-color:purple;"
              @click="currentColor='purple';showPalette=false;"
            ></span>
            <span
              class="colorBullet"
              style="background-color:violet;"
              @click="currentColor='violet';showPalette=false;"
            ></span>
            <span
              class="colorBullet"
              style="background-color:white;"
              @click="currentColor='white';showPalette=false;"
            ></span>
            <span
              class="colorBullet"
              style="background-color:lightgrey;"
              @click="currentColor='lightgrey';showPalette=false;"
            ></span>
            <span
              class="colorBullet"
              style="background-color:grey;"
              @click="currentColor='grey';showPalette=false;"
            ></span>
            <span
              class="colorBullet"
              style="background-color:black;"
              @click="currentColor='black';showPalette=false;"
            ></span>
          </div>
        </div>
        <div :class="['btnTool']" @click="undo()">
          <v-icon>undo</v-icon>
        </div>
        <div :class="['btnTool',(undoStack.length>0?'':'inactive')]" @click="redo()">
          <v-icon>redo</v-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.canvasDiv {
  position: relative;
  width: 100%;
  height: 100%;
}

.canvasTop {
  position: absolute;
  top: 0em;
  left: 0em;
  right: 0em;
  text-align: center;
}

.canvasTop > .topToolsLeft {
  position: absolute;
  top: 0em;
  left: 0em;
}

.canvasTop > .topToolsRight {
  position: absolute;
  top: 0em;
  right: 0em;
}

.canvasTools {
  position: absolute;
  bottom: 0em;
  left: 0em;
  right: 0em;
  text-align: center;
}
.canvasTools > .centering {
  display: inline-block;
}

.canvasTools .btnTool {
  display: inline-block;
  color: lightgrey;
  cursor: pointer;
  position: relative;
}
.canvasTools .btnTool.active {
  color: rgb(0, 74, 211);
}

.canvasTools .btnTool > .v-icon {
  color: lightgrey;
}
.canvasTools .btnTool.active > .v-icon {
  color: rgb(0, 74, 211);
}

.canvasTools .btnTool.inactive,
.canvasTools .btnTool.inactive > .v-icon {
  color: #f2f2f2;
  pointer-events: none;
  cursor: default;
}

.palette {
  position: absolute;
  width: 6em;
  bottom: 1.5em;
  left: -2em;
}

.palette > .colorBullet {
  display: inline-block;
  width: 1.2em;
  height: 1.2em;
  border-radius: 0.6em;
  border: 1px solid grey;
}
</style>

<script>
define(["vue", "DrawIdea/Utils"], function(Vue, Utils) {
  return Vue.component("drawing-canvas", {
    template: template,
    props: ["content", "preview", "boardName"],
    data: function() {
      return {
        drawMode: "pen", //"pen", "eraser", "text", "move"
        canvasEl: undefined,
        ctx2d: undefined, //To store the canvas context 2D to draw into it

        showPalette: false,
        currentColor: "blue",
        currentText: "Some Text...",

        mouseOrTouchDown: false,
        currentObjectMoved: null,
        lastPosition: null,

        undoStack: [],

        dragOver: false
      };
    },

    mounted() {
      this.canvasEl = this.$el.getElementsByClassName("canvas2d")[0];
      this.ctx2d = this.canvasEl.getContext("2d");
      window.addEventListener("resize", this.resize); //Listen at the frame level for a resize
      this.resize();
    },

    updated() {
      this.redrawCanvas();
    },

    methods: {
      resize() {
        let elBoundingBox = this.$el.getBoundingClientRect();
        this.canvasEl.setAttribute("width", elBoundingBox.width);
        this.canvasEl.setAttribute("height", elBoundingBox.height);

        this.redrawCanvas();
      },

      togglePalette() {
        this.showPalette = !this.showPalette;
      },

      undo() {
        if (this.content.length > 0) {
          let rmContent = this.content.splice(this.content.length - 1, 1)[0];
          this.undoStack.push(rmContent);
          this.redrawCanvas();
        }
      },
      redo() {
        if (this.undoStack.length > 0) {
          let reAddContent = this.undoStack.splice(
            this.undoStack.length - 1,
            1
          )[0];
          this.content.push(reAddContent);
          this.redrawCanvas();
        }
      },

      getMousePosition(ev) {
        return { x: ev.pageX, y: ev.pageY };
      },
      getTouchPosition(ev) {
        return { x: ev.targetTouches[0].pageX, y: ev.targetTouches[0].pageY };
      },

      downAt(pos) {
        if (this.drawMode === "move" || this.drawMode === "text") {
          this.mouseOrTouchDown = true;
          this.startMoveObject(pos);
          if (this.drawMode === "text" && !this.currentObjectMoved) {
            //Add a Text
            this.addText(pos.x, pos.y, this.currentText, this.currentColor);
            this.startMoveObject(pos); //Detect it under the cursor so it can be moved
          }
        } else if (this.drawMode === "pen" || this.drawMode === "eraser") {
          //Do paint or erase a point / line
          this.mouseOrTouchDown = true;
          this.addPaintPoint(pos.x, pos.y, true, this.drawMode === "eraser");
        }
      },
      moveAt(pos) {
        if (
          this.mouseOrTouchDown &&
          (this.drawMode === "pen" || this.drawMode === "eraser")
        ) {
          this.addPaintPoint(pos.x, pos.y, false, this.drawMode === "eraser");
        } else if (this.drawMode === "move" || this.drawMode === "text") {
          if (this.mouseOrTouchDown) {
            this.doMoveObject(pos);
          }
        }
      },
      upAt(pos) {
        this.moveAt(pos);
        this.mouseOrTouchDown = false;
      },

      startMoveObject(pos) {
        let isObjDetected = false;
        for (let i = 0; i < this.content.length; i++) {
          const objPaint = this.content[i];
          if (objPaint.boundingBox) {
            if (
              pos.x >= objPaint.boundingBox.x1 &&
              pos.x <= objPaint.boundingBox.x2 &&
              pos.y >= objPaint.boundingBox.y1 &&
              pos.y <= objPaint.boundingBox.y2
            ) {
              this.currentObjectMoved = objPaint;
              this.lastPosition = pos;
              isObjDetected = true;
              break;
            }
          }
        }
        if (!isObjDetected) {
          this.currentObjectMoved = null;
        }
        //Update currentColor and Text if needed
        if (
          this.currentObjectMoved &&
          this.currentObjectMoved.type === "text" &&
          (this.drawMode === "move" || this.drawMode === "text")
        ) {
          this.currentColor = this.currentObjectMoved.color;
          this.currentText = this.currentObjectMoved.text;
        }
      },
      doMoveObject(pos) {
        if (this.currentObjectMoved) {
          let dX = pos.x - this.lastPosition.x;
          let dY = pos.y - this.lastPosition.y;
          if (
            this.currentObjectMoved.type === "text" ||
            this.currentObjectMoved.type === "imgB64"
          ) {
            this.currentObjectMoved.point.x += dX;
            this.currentObjectMoved.point.y += dY;
          } else if (this.currentObjectMoved.type === "paint") {
            let arrPoints = this.currentObjectMoved.points;
            for (let i = 0; i < arrPoints.length; i++) {
              const point = arrPoints[i];
              point.x += dX;
              point.y += dY;
            }
          }
          this.lastPosition = pos;
        }
        //Do a Redraw
        this.redrawCanvas();
      },

      addText(x, y, text, color) {
        let cnvWidth = this.ctx2d.canvas.width;
        this.content.push({
          id: "text-" + Date.now(),
          type: "text",
          color: color,
          size: 20,
          point: {
            x: x,
            y: y
          },
          maxWidth: 0.95 * cnvWidth,
          text: text,
          font: "Arial",
          mode: "source-over"
        });
        this.redrawCanvas();
      },
      addPaintPoint(x, y, startPoint, eraseMode) {
        if (startPoint) {
          this.content.push({
            id: "paint-" + Date.now(),
            type: "paint",
            color: eraseMode ? "rgba(0,0,0,1)" : this.currentColor,
            size: eraseMode ? 8 : 3,
            points: [],
            mode: eraseMode ? "destination-out" : "source-over"
          });
        }
        let currentArrPoints = this.content[this.content.length - 1].points;
        currentArrPoints.push({
          x: x,
          y: y
        });

        this.redrawCanvas();
      },

      redrawCanvas(noVisualHelpers) {
        let ctx2d = this.ctx2d;

        ctx2d.clearRect(0, 0, ctx2d.canvas.width, ctx2d.canvas.height); //Clear

        //Default values
        ctx2d.lineJoin = "round";
        ctx2d.lineCap = "round";
        ctx2d.lineWidth = 5;
        ctx2d.strokeStyle = "black";

        for (let i = 0; i < this.content.length; i++) {
          const objPaint = this.content[i];
          ctx2d.globalCompositeOperation = objPaint.mode; //To change the painting mode (draw, erase)

          if (objPaint.type === "paint") {
            ctx2d.lineWidth = objPaint.size;
            ctx2d.strokeStyle = objPaint.color;
            ctx2d.beginPath();
            if (objPaint.points.length >= 1) {
              ctx2d.moveTo(objPaint.points[0].x, objPaint.points[0].y);
            }
            let xMin = objPaint.points[0].x,
              xMax = objPaint.points[0].x,
              yMin = objPaint.points[0].y,
              yMax = objPaint.points[0].y;
            for (j = 1; j < objPaint.points.length - 2; j++) {
              let pt = objPaint.points[j];
              let pt2 = objPaint.points[j + 1];
              //ctx2d.lineTo(pt.x, pt.y);
              //Smooth line with quadratic curve
              //http://codetheory.in/html5-canvas-drawing-lines-with-smooth-edges/
              let endX = (pt.x + pt2.x) / 2;
              let endY = (pt.y + pt2.y) / 2;
              ctx2d.quadraticCurveTo(pt.x, pt.y, endX, endY);

              xMin = Math.min(xMin, pt.x);
              xMax = Math.max(xMax, pt.x);
              yMin = Math.min(yMin, pt.y);
              yMax = Math.max(yMax, pt.y);
            }

            //Last 2 points
            if (objPaint.points.length >= 3) {
              let pt = objPaint.points[objPaint.points.length - 2];
              let pt2 = objPaint.points[objPaint.points.length - 1];
              ctx2d.quadraticCurveTo(pt.x, pt.y, pt2.x, pt2.y);
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

            let canvasWidth = ctx2d.canvas.width;

            //Draw taking into account max width for the text block
            let maxTextWidth = Math.min(
              objPaint.maxWidth,
              canvasWidth - objPaint.point.x - 5
            ); //5px of margin against the right border
            let wordsList = objPaint.text.split(" ");
            let currentTextLine = wordsList[0];
            let textMetricsWidth = 0;
            let currentLineIndex = 0;
            let lineHeightOffset = objPaint.size * 1.2;

            for (j = 1; j < wordsList.length; j++) {
              let word = wordsList[j];
              textMetricsWidth = ctx2d.measureText(currentTextLine + " " + word)
                .width;
              if (textMetricsWidth > maxTextWidth) {
                //Write current Text
                ctx2d.fillText(
                  currentTextLine,
                  objPaint.point.x,
                  objPaint.point.y + currentLineIndex * lineHeightOffset
                );
                currentLineIndex++;
                currentTextLine = word;
              } else {
                //Keep adding Text to the line
                currentTextLine = currentTextLine + " " + word;
              }
            }
            //Remember to write last line of text
            ctx2d.fillText(
              currentTextLine,
              objPaint.point.x,
              objPaint.point.y + currentLineIndex * lineHeightOffset
            );

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
                let canvasWidth = ctx2d.canvas.width;
                let canvasHeight = ctx2d.canvas.height;
                let ratioCanvas = canvasWidth / canvasHeight;

                let imgToDraw = objPaint.content;

                let imgWidth = imgToDraw.naturalWidth;
                let imgHeight = imgToDraw.naturalHeight;
                let ratioImg = imgWidth / imgHeight;

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

              let posX = objPaint.point.x;
              let posY = objPaint.point.y;

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

              ctx2d.drawImage(
                objPaint.content,
                posX,
                posY,
                objPaint.drawWidth,
                objPaint.drawHeight
              );
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
            this.currentObjectMoved &&
            this.currentObjectMoved === objPaint &&
            (this.drawMode === "move" || this.drawMode === "text")
          ) {
            ctx2d.globalCompositeOperation = "source-over";
            ctx2d.fillStyle = "black";
            ctx2d.fillRect(
              objPaint.boundingBox.x1 - 5,
              objPaint.boundingBox.y1 - 5,
              5,
              5
            );
            ctx2d.fillRect(
              objPaint.boundingBox.x2,
              objPaint.boundingBox.y1 - 5,
              5,
              5
            );
            ctx2d.fillRect(
              objPaint.boundingBox.x2,
              objPaint.boundingBox.y2,
              5,
              5
            );
            ctx2d.fillRect(
              objPaint.boundingBox.x1 - 5,
              objPaint.boundingBox.y2,
              5,
              5
            );
          }
        }
      },

      genPreviewAndGoBack() {
        this.redrawCanvas(true);
        let strB64 = this.ctx2d.canvas.toDataURL("image/png");
        this.$emit("back", strB64);
      },
      addDrawing() {
        this.genPreviewAndGoBack();
        this.$emit("add-drawing");
      },

      nameChange(ev) {
        this.$emit("name-changed", ev.target.value);
      },

      screenshot() {
        this.redrawCanvas(true); //Redraw without move helpers (little squares)
        let strB64 = this.ctx2d.canvas.toDataURL("image/png");
        this.$emit("screenshot", strB64);
      },

      drop(ev) {
        let preTypesOfInfos = ev.dataTransfer.types;
        //MS Edge bug with DOMStringList instead of Array, so quick cast here
        let typesOfInfos = [];
        for (let i = 0; i < preTypesOfInfos.length; i++) {
          const element = preTypesOfInfos[i];
          typesOfInfos.push(element);
          console.log(
            "dataType : ",
            element,
            "data",
            ev.dataTransfer.getData(element)
          );
        }

        console.log("drop", typesOfInfos);

        let imgFound = false;

        if (typesOfInfos.indexOf("Files") !== -1) {
          let fileList = ev.dataTransfer.files;
          for (let i = 0; i < fileList.length; i++) {
            const file = fileList[i];

            const fType = file.type;

            if (fType.indexOf("image/") === 0) {
              //Read the Image for display
              var image = new Image();
              image.onload = () => {
                this.content.push({
                  type: "imgB64",
                  mode: "source-over",
                  content: image,
                  drawMode: "extend",
                  orientation: 1, //EXIF Orientation
                  point: {
                    x: 0,
                    y: 0
                  }
                });

                this.redrawCanvas(); //Refresh display

                this.drawMode = "move"; //Automatically go to Move mode to place the image
              };
              image.src = URL.createObjectURL(file);

              console.log("Image Found", file);
              imgFound = true;
            }
          }
        } else if (typesOfInfos.indexOf("img/b64") !== -1) {
          var image = new Image();
          image.onload = () => {
            this.content.push({
              type: "imgB64",
              mode: "source-over",
              content: image,
              drawMode: "extend",
              orientation: 1, //EXIF Orientation
              point: {
                x: 0,
                y: 0
              }
            });

            this.redrawCanvas(); //Refresh display

            this.drawMode = "move"; //Automatically go to Move mode to place the image
          };
          image.src = ev.dataTransfer.getData("img/b64");

          console.log("Image Found", ev.dataTransfer.getData("img/b64"));
          imgFound = true;
        }

        if (!imgFound) {
          //Maybe we are on MS Edge and we need to look in text/plain
          if (typesOfInfos.indexOf("text/plain") !== -1) {
            console.debug("Check for data in text/plain");
            let txtData = ev.dataTransfer.getData("text/plain");
            if (
              txtData.indexOf("data:image/") !== -1 &&
              txtData.indexOf(";base64,") !== -1
            ) {
              console.debug("Get image from base64 data");
              let image = new Image();
              image.onload = () => {
                this.content.push({
                  type: "imgB64",
                  mode: "source-over",
                  content: image,
                  drawMode: "extend",
                  orientation: 1, //EXIF Orientation
                  point: {
                    x: 0,
                    y: 0
                  }
                });

                this.redrawCanvas(); //Refresh display

                this.drawMode = "move"; //Automatically go to Move mode to place the image
              };
              image.src = txtData;

              console.log("Image Found from Text", txtData);
              imgFound = true;
            } else {
              //Try if it's a 3DDrive file to download it ...
              //Code for 3DDrive File !
              console.debug("Try to check if it's JSON data", txtData);
              try {
                let jsonInfo = JSON.parse(txtData);

                if (jsonInfo.hasOwnProperty("type")) {
                  const typeObj = jsonInfo.type;
                  if (typeObj === "3DXContent") {
                    //Check for 3DDrive file
                    if (jsonInfo.data.serviceId === "3DDrive") {
                      //Download the image file and then add it to the Canvas
                      Utils.get3DDriveFile(
                        jsonInfo,
                        fileBlob => {
                          //Load file as image
                          let image = new Image();
                          image.onload = () => {
                            this.content.push({
                              type: "imgB64",
                              mode: "source-over",
                              content: image,
                              drawMode: "extend",
                              orientation: 1, //EXIF Orientation
                              point: {
                                x: 0,
                                y: 0
                              }
                            });
                            this.redrawCanvas(); //Refresh display

                            this.drawMode = "move"; //Automatically go to Move mode to place the image
                          };
                          image.src = URL.createObjectURL(fileBlob);
                        },
                        err => {
                          console.error(err);
                        }
                      );
                    }
                  }
                }
              } catch (err) {
                console.warn("Not a JSON content ... ", err);
              }
            }
          }
        }
      }
    }
  });
});
</script>