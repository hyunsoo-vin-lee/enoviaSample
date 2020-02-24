<template>
    <div class='enoObj'>
        <div class='docIdentity'>
            {{item.type}} - {{item.name}} - {{item.revision}}<br>
            Title : {{item.title}}<br>
        </div>
        <div v-if="item.files" class='docFiles'>
            <v-icon>attachment</v-icon> Files : <span v-if="item.files">{{item.files.length}}</span><span v-else>0</span>
            <div v-for="(file,i) in item.files" :key="'file-'+i">
                {{file.dataelements.title}}
            </div>
        </div>
        <v-icon class='removeEnoObj' @click='$emit("remove")' title='Remove this item'>close</v-icon>
    </div>
</template>

<style scoped>
.enoObj {
    position: relative;
    display: flex;
    flex-direction: row;

    border: 1px solid lightgrey;
    margin-bottom: 0.2em;
    padding: 0.2em;
    margin-right: 0.2em;
    box-shadow: 0.1em 0.1em 0.2em 0em #d4d4d4;
}

.enoObj > .docIdentity,
.enoObj > .docFiles {
    flex: 1;
    text-align: left;
}

.removeEnoObj {
    position: absolute;
    top: 0em;
    right: 0em;
}
</style>

<script>
define(["vue"], function(Vue) {
    return Vue.component("eno-object", {
        template: template,
        props: ["item"],
        data: function() {
            return {
                dragOver: false
            };
        },
        methods: {
            drop: function(event) {
                this.dragOver = false;
                if (event && event.dataTransfer) {
                    let data = event.dataTransfer.getData("text");
                    this.$emit("drop-on", data);
                } else {
                    console.warn("Drop not managed, no dataTransfer found");
                }
            }
        }
    });
});
</script>