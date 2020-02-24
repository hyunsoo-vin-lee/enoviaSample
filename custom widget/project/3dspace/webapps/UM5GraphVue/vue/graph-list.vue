<template>
  <div class="graphList">
    <graph-node-block
      v-for="(obj,i) in data"
      :key="i+obj.physicalid"
      :obj="obj"
      :parent="parent"
      :index="i"
      :expandable="expandable"
      :arrow-direction="arrowDirection"
      @drop-as-child="dropAsChild"
      @set-dragged-node="fwSetDraggedNode"
    ></graph-node-block>
  </div>
</template>

<style scoped>
</style>

<script>
define(["vue", "vueloader!current/vue/graph-node-block"], function(Vue) {
  return Vue.component("graph-list", {
    template: template,
    props: ["data", "parent", "expandable", "arrowDirection"],
    data: function() {
      return {};
    },
    methods: {
      dropAsChild: function(objRef, arrPIDs) {
        this.$emit("drop-as-child", objRef, arrPIDs);
      },
      fwSetDraggedNode: function(obj) {
        this.$emit("set-dragged-node", obj);
      }
    }
  });
});
</script>