<template>
  <div class="uriItem">
    <base-clipboard-item>
      <template slot="image">
        <img :src="getIconURL()" class="iconLink" style="padding:0.5em;">
      </template>
      <span class="mainName">Link</span>
      <br>
      <a :href="content.data.uri" :title="content.data.uri">
        <v-icon>link</v-icon>
        {{content.data.comment || content.data.uri}}
      </a>
    </base-clipboard-item>
  </div>
</template>

<style scoped>
</style>

<script>
define(["vue"], function(Vue) {
  return Vue.component("uri-item", {
    template: template,
    props: ["content"],
    data: function() {
      return {};
    },
    methods: {
      getIconURL() {
        let wdgUrl = widget.getUrl();
        wdgUrl = wdgUrl.substring(0, wdgUrl.lastIndexOf("/"));
        url = wdgUrl + "/assets/link_icon_blue.png";
        return url;
      }
    }
  });
});
</script>