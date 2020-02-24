<template>
  <div class="fileItem">
    <base-clipboard-item>
      <span class="mainName">File : {{content.data.name || content.fileName}}</span>
    </base-clipboard-item>
  </div>
</template>

<style scoped>
.imgItem > img {
  max-height: 3em;
}
</style>

<script>
define(["vue"], function(Vue) {
  return Vue.component("file-item", {
    template: template,
    props: ["content"],
    data: function() {
      return {};
    },
    methods: {}
  });
});
</script>