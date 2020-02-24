<template>
  <div class="baseClipboardItem">
    <div class="leftSlot">
      <slot name="image">
        <img :src="getWidgetUrl()+'/assets/cube.png'" style="padding:1.0em;">
      </slot>
    </div>
    <div class="rightSlot">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
.baseClipboardItem {
  position: relative;
  height: 5em;
}
.baseClipboardItem > .leftSlot {
  position: absolute;
  width: 5em;
  height: 5em;
  top: 0em;
  left: 0em;
  overflow: hidden;
}
.baseClipboardItem > .leftSlot img {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  margin: auto;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
}
.baseClipboardItem > .rightSlot {
  position: absolute;
  width: calc(100% - 5.5em);
  height: 5em;
  top: 0em;
  left: 5.5em;
  overflow: hidden;
}
</style>

<script>
define(["vue"], function(Vue) {
  return Vue.component("base-clipboard-item", {
    template: template,
    props: ["item"],
    data: function() {
      return {};
    },
    methods: {
      getWidgetUrl() {
        var wdgUrl = widget.getUrl();
        wdgUrl = wdgUrl.substring(0, wdgUrl.lastIndexOf("/"));
        return wdgUrl;
      }
    }
  });
});
</script>