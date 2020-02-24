<template>
    <div class='messageBlock' :style='getColor()'>
        <div class='closeBtn' @click.stop='$emit("remove")'>
            <v-icon>close</v-icon>
        </div>
        <div class='messageIcon'>
            <v-icon v-if='message.level === "error"'>error</v-icon>
            <v-icon v-else-if='message.level === "warn"'>warning</v-icon>
            <v-icon v-else>info</v-icon>
        </div>
        <div class='messageContent'>
            <div class='messageTitle'>{{message.title}}</div>
            <div class='messageText'>{{message.message}}</div>
        </div>
    </div>
</template>

<style scoped>
.messageBlock {
    background-color: #bfe2ff;
    border: 1px solid #e3e3e3;
    box-shadow: 1px 1px 5px #e8e8e8;
    min-width: 12em;
    max-width: 20em;
    position: relative;
}

.messageBlock > .closeBtn {
    position: absolute;
    top: 0em;
    right: 0em;
    cursor: pointer;
}

.messageBlock > .messageIcon {
    position: absolute;
    top: calc(50% - 0.75em);
    left: 0.5em;
}

.messageBlock > .messageContent {
    padding-left: 2.5em;
}

.messageBlock > .messageContent > .messageTitle {
    font-weight: bold;
    padding-right: 1.5em;
}
</style>

<script>
define(["vue"], function(Vue) {
    return Vue.component("message-block", {
        template: template,
        props: ["message"],
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
                    case "success":
                        style = "background-color:#bfffd4;";
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