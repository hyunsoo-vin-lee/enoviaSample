<template>
  <div class="graphNodeBlock">
    <div class="expandArrowVerticalDown" v-if="parent && index === 0 && parent.childs.length > 1"></div>
    <div
      class="expandArrowVerticalFull"
      v-if="parent && index > 0 && index < (parent.childs.length-1)"
    ></div>
    <div
      class="expandArrowVerticalUp"
      v-if="parent && index === (parent.childs.length-1) && parent.childs.length > 1"
    ></div>
    <div class="leftBlock">
      <div class="expandArrowDashFrom" v-if="parent"></div>
      <div
        v-if="parent && arrowDirection"
        :class="'arrowDirection '+(obj.relDirection==='to' ? 'arrowTo' : 'arrowFrom')"
      ></div>
      <graph-node
        :obj="obj"
        :node-id="obj.physicalid"
        :parent="parent"
        :expandable="expandable"
        @expand="expand(obj.physicalid)"
        @more-info="displayMore()"
        @remove-root="removeRootObject()"
        @drop-as-child="dropAsChild"
        @set-dragged-node="fwSetDraggedNode"
      ></graph-node>
      <div class="expandArrowDashTo" v-if="obj.expanded && obj.childs.length > 0 && expandable"></div>
    </div>
    <div class="rightBlock" v-if="expandable">
      <graph-list
        :data="obj.childs"
        v-if="obj.expanded"
        :parent="obj"
        :expandable="expandable"
        :arrow-direction="arrowDirection"
        @drop-as-child="fwDropAsChild"
        @set-dragged-node="fwSetDraggedNode"
      ></graph-list>
    </div>
  </div>
</template>

<style scoped>
</style>

<script>
define(["vue", "Utils", "vueloader!current/vue/graph-node"], function(
  Vue,
  Utils
) {
  return Vue.component("graph-node-block", {
    template: template,
    props: ["obj", "path", "parent", "index", "expandable", "arrowDirection"],
    data: function() {
      return {};
    },
    methods: {
      expand: function(physicalid) {
        let that = this;
        if (that.obj.expanded) {
          that.obj.expanded = false;
        } else {
          Utils.expand(that, physicalid);
        }
      },
      displayMore: function() {
        //Display more in Enovia Tab
        window.open(this.obj.enoUrl, "_blank");
      },
      removeRootObject: function() {
        Utils.removeRoot(this.obj);
      },
      dropAsChild: function(arrPIDs) {
        this.$emit("drop-as-child", this.obj, arrPIDs);
      },
      fwDropAsChild: function(objRef, arrPIDs) {
        this.$emit("drop-as-child", objRef, arrPIDs);
      },
      fwSetDraggedNode: function(obj) {
        this.$emit("set-dragged-node", obj);
      }
    }
  });
});
</script>