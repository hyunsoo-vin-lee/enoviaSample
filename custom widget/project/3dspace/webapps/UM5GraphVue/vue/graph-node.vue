<template>
  <div
    :class="'graphNode'+(obj.selected ? ' selected' : '')"
    :node-objid="nodeId"
    :style="obj.css"
    @click="toggleSelection"
    @mousedown.stop
    draggable="true"
    @dragstart.stop="dragNodeStart($event)"
    @dragend.stop="dragNodeStop"
  >
    <div
      v-if="parent"
      class="connectionType"
      :title="obj['name[connection]']"
      :style="obj.cssRel"
    >{{obj["name[connection]"]}}</div>
    <div class="nodeTop" :title="obj['nls!type'] || obj.type">{{obj['nls!type'] || obj.type}}</div>
    <div class="nodeMiddle" :title="obj.dispMiddle">
      <img v-if="obj.iconUrl" :src="obj.iconUrl" class="iconType">
      {{obj.dispMiddle}}
    </div>
    <div class="nodeBottom" :title="obj.dispBottom">{{obj.dispBottom}}</div>
    <div v-if="expandable" class="expandBtn" title="Expand/Collapse" @click.stop="$emit('expand')">
      <v-icon v-if="obj.expanded">remove</v-icon>
      <v-icon v-else>add</v-icon>
    </div>
    <div
      v-if="!parent && !obj.gotThroughFind"
      class="removeRootBtn"
      title="Remove root object from display"
      @click.stop="$emit('remove-root')"
    >
      <v-icon small>delete</v-icon>
    </div>
    <div class="moreBtn" title="More Information" @click.stop="$emit('more-info')">
      <v-icon small>more_horiz</v-icon>
    </div>
    <div
      :class="'dropAsChild'+(highlightDrop ? ' dropZone' : '')"
      @drop.prevent.stop="dropAsChild($event);removeHighlightForDrop();"
      @dragover.prevent.stop="addHighlightForDrop"
      @dragenter.stop="addHighlightForDrop"
      @dragleave.stop="removeHighlightForDrop"
    ></div>
  </div>
</template>

<style scoped>
</style>

<script>
define(["vue", "Utils"], function(Vue, Utils) {
  return Vue.component("graph-node", {
    template: template,
    props: ["obj", "nodeId", "parent", "expandable"],
    data: function() {
      return {
        highlightDrop: false
      };
    },
    methods: {
      toggleSelection: function() {
        if (this.obj.selected) {
          this.$set(this.obj, "selected", false);
        } else {
          this.$set(this.obj, "selected", true);
        }
        if ( this.parent )
       	{
	        //console.log($("div[node-objid=" + this.parent.physicalid + "]").length);
	        $("div[node-objid=" + this.parent.physicalid + "]").trigger("click");
       	}
      },
      dragNodeStart: function(event) {
        let data3DXContent = {
          protocol: "3DXContent",
          version: "1.1",
          source: "UM5Wdg_Table",
          widgetId: widget.id,
          data: {
            items: [
              {
                envId: Utils.getTenant,
                contextId: "",
                objectId: this.obj.physicalid,
                objectType: this.obj.type,
                displayName: this.obj.name,
                displayType: this.obj.type,
                serviceId: "3DSpace"
              }
            ]
          }
        };
        let dataDnD = JSON.stringify(data3DXContent);
        let objNames = [this.obj.name];
        let shortdata = JSON.stringify(objNames);

        //3DExp format
        event.dataTransfer.setData("text/plain", dataDnD);
        event.dataTransfer.setData("text/searchitems", dataDnD);
        event.dataTransfer.setData("shortdata", shortdata);

        //URL if drop in new Web Browser Tab
        event.dataTransfer.setData("text/uri-list", this.obj.enoUrl);

        //Indicate to vueApp that a node is being dragged to display the right tools for delete or disconnect
        //vueApp.draggingNode = this.obj;
        this.$emit("set-dragged-node", this.obj);
      },
      dragNodeStop: function() {
        //vueApp.draggingNode = false;
        this.$emit("set-dragged-node", false);
      },
      addHighlightForDrop: function() {
        this.highlightDrop = true;
      },
      removeHighlightForDrop: function() {
        this.highlightDrop = false;
      },
      dropAsChild: function(event) {
        if (event.dataTransfer) {
          let dataTxt = event.dataTransfer.getData("text");
          let dataDnD = JSON.parse(dataTxt);
          if (dataDnD.protocol === "3DXContent") {
            let arrObjs = dataDnD.data.items;
            let arrPIDs = [];
            for (let i = 0; i < arrObjs.length; i++) {
              let item = arrObjs[i];
              let pidDropped = item.objectId;
              if (arrPIDs.indexOf(pidDropped) === -1) {
                arrPIDs.push(pidDropped);
              }
            }
            this.$emit("drop-as-child", arrPIDs);
          }
        }
      }
    }
  });
});
</script>