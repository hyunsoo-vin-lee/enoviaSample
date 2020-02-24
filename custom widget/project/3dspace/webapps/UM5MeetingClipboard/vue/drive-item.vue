<template>
  <div class="driveItem">
    <base-clipboard-item>
      <template slot="image">
        <img
          :src="content.data.displayPreview"
          class="previewDrive"
          draggable="true"
          @dragstart="dragStartImg($event)"
        >
      </template>
      <span class="mainName">3DDrive : {{content.data.displayType || content.data.objectType}}</span>
      <br>
      {{content.data.displayName}}
    </base-clipboard-item>
  </div>
</template>

<style scoped>
.driveItem {
  position: relative;
}
.driveItem > img.previewDrive {
  max-height: 3em;
  float: left;
  margin-right: 0.5em;
}
</style>

<script>
define(["vue"], function(Vue) {
  return Vue.component("drive-item", {
    template: template,
    props: ["content"],
    data: function() {
      return {};
    },
    methods: {
      dragStartImg(ev) {
        ev.dataTransfer.setData("text/plain", JSON.stringify(this.content));
        ev.dataTransfer.effectAllowed = "all";
      }
    }
  });
});
</script>