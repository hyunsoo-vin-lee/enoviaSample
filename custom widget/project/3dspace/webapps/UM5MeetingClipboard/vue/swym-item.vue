<template>
  <div class="swymItem">
    <base-clipboard-item>
      <template slot="image">
        <img :src="getIconURL()" class="previewSwym">
      </template>
      <span class="mainName">{{content.data.displayType || content.data.objectType}}</span>
      <br>
      <a :href="content.data.urlContent['3DSwym']" :title="'Open : '+content.data.displayName">
        <v-icon>link</v-icon>
        <span v-html="content.data.displayName"></span>
      </a>
    </base-clipboard-item>
  </div>
</template>

<style scoped>
.swymItem {
  position: relative;
}
.swymItem > img.previewSwym {
  max-height: 3em;
  float: left;
  margin-right: 0.5em;
}
</style>

<script>
define(["vue", "vueloader!current/vue/base-clipboard-item"], function(Vue) {
  return Vue.component("swym-item", {
    template: template,
    props: ["content"],
    data: function() {
      return {
        getIconURL() {
          let url = this.content.data.displayPreview;
          if (!url || url === "") {
            let wdgUrl = widget.getUrl();
            wdgUrl = wdgUrl.substring(0, wdgUrl.lastIndexOf("/"));
            url = wdgUrl + "/assets/defaultSwym.png";
          }
          return url;
        }
      };
    },
    methods: {}
  });
});
</script>