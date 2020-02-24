<template>
  <div class="enoItem">
    <base-clipboard-item>
      <span
        class="mainName"
        title="3DSpace object"
      >{{content.data.displayType || content.data.objectType}}</span>
      <br>
      <a v-if="content.url" :href="content.url" title="Open in 3DSpace">{{content.data.displayName}}</a>
      <span v-else>{{content.data.displayName}}</span>
    </base-clipboard-item>
  </div>
</template>

<style scoped>
</style>

<script>
define(["vue"], function(Vue) {
  return Vue.component("eno-item", {
    template: template,
    props: ["content"],
    data: function() {
      return {};
    },
    methods: {}
  });
});
</script>