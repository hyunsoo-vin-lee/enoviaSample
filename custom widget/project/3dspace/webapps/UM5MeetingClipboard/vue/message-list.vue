<template>
    <div class='messageList'>
        <message-block v-for='(msg,i) in messages' :key='"msg-"+i' :message='msg' @remove='removeMessage(i)'></message-block>
    </div>
</template>

<style scoped>
.messageList {
    position: absolute;
    top: 1em;
    right: 0.25em;
    z-index: 100;
}
</style>

<script>
define(["vue", "vueloader!current/vue/message-block"], function(Vue) {
    return Vue.component("message-list", {
        template: template,
        props: ["messages"],
        methods: {
            removeMessage: function(index) {
                this.messages.splice(index, 1);
            }
        }
    });
});
</script>
