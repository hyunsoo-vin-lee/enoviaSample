<template>
  <div class="messageList">
    <message-block
      v-for="(msg,i) in messages"
      :key="'msg-'+i"
      :message="msg"
      @remove="removeMessage(i)"
    ></message-block>
  </div>
</template>

<style scoped>
</style>

<script>
define(["vue", "vueloader!current/vue/message-block"], function(Vue) {
  return Vue.component("message-list", {
    template: template,
    props: ["messages"],
    data: function() {
      return {};
    },
    methods: {
      removeMessage: function(index) {
        this.messages.splice(index, 1);
      }
    }
  });
});
</script>