<template>
  <div class="messageBlock" :style="getColor()">
    <div class="closeBtn" @click.stop="$emit('remove')">
      <v-icon>close</v-icon>
    </div>
    <div class="messageIcon">
      <v-icon v-if="message.level === 'error'">error</v-icon>
      <v-icon v-else-if="message.level === 'warn'">warning</v-icon>
      <v-icon v-else>info</v-icon>
    </div>
    <div class="messageContent">
      <div class="messageTitle">{{message.title}}</div>
      <div class="messageText">{{message.message}}</div>
    </div>
  </div>
</template>

<style scoped>
</style>

<script>
define(["vue"], function(Vue) {
  return Vue.component("message-block", {
    template: template,
    props: ["message"],
    data: function() {
      return {};
    },
    methods: {
      getColor: function() {
        let style = "";
        let level = this.message.level;
        switch (level) {
          case "error":
            style = "background-color:#ffbfbf;";
            break;
          case "warning":
            style = "background-color:#fffcbf;";
            break;
          default:
            break;
        }
        return style;
      }
    }
  });
});
</script>
