<template>
  <div class="imgItem">
    <base-clipboard-item>
      <template slot="image">
        <img :src="content.imgUrl" draggable="true" @dragstart="dragStartImg($event)">
      </template>
      <span class="mainName">{{getFileName()}}</span>
    </base-clipboard-item>
  </div>
</template>

<style scoped>
.imgItem > img {
  max-height: 3em;
  margin-right: 0.5em;
}
</style>

<script>
define(["vue"], function(Vue) {
  return Vue.component("img-item", {
    template: template,
    props: ["content"],
    data: function() {
      return {};
    },
    methods: {
      getFileName: function() {
        let fileName = this.content.data.name;
        if (!fileName || fileName === "") {
          fileName = this.content.fileName;
        }
        if (!fileName || fileName === "") {
          fileName = "Image file";
        }
        return fileName;
      },

      dragStartImg: function(ev) {
        ev.dataTransfer.setData("img/b64", this.content.imgUrl);
        ev.dataTransfer.effectAllowed = "all";
      }
    }
  });
});
</script>