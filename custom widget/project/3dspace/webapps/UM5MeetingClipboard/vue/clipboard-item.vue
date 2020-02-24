<template>
  <div class="clipboardItem">
    <div class="contentItem" :is="getContentComponentType()" :content="item"></div>
    <v-icon class="closeIcon" @click="$emit('remove-item')">delete</v-icon>
    <select v-model="item.category">
      <option v-for="opt in getOptions()" :key="'opt-'+opt" :value="opt.value">{{opt.label}}</option>
    </select>
  </div>
</template>

<style scoped>
.clipboardItem {
  position: relative;

  border: 1px solid #e4e4e4;
  margin-bottom: 0.75em;
  padding: 0.2em;
  margin-right: 0.2em;
  /*box-shadow: 0.1em 0.1em 0.2em 0em #d4d4d4;*/

  text-align: left;
}

.clipboardItem .mainName {
  color: #368ec4;
}

.clipboardItem > .closeIcon {
  position: absolute;
  top: 0em;
  right: 0em;
  color: #b4b6ba;
}

.clipboardItem > .contentItem {
  overflow: auto;
  color: #77797c;
}

.clipboardItem > select {
  color: #b4b6ba;
  border-radius: 1em;
  text-align: center;
  padding-left: 0.5em;
  padding-right: 0.6em;

  position: absolute;
  top: 0em;
  right: 1.5em;

  cursor: pointer;
}
</style>

<script>
define([
  "vue",
  "vueloader!current/vue/uri-item",
  "vueloader!current/vue/text-item",
  "vueloader!current/vue/eno-item",
  "vueloader!current/vue/img-item",
  "vueloader!current/vue/file-item",
  "vueloader!current/vue/html-item",
  "vueloader!current/vue/swym-item",
  "vueloader!current/vue/drive-item",
  "vueloader!current/vue/person-item",
  "vueloader!current/vue/json-item"
], function(Vue) {
  return Vue.component("clipboard-item", {
    template: template,
    props: ["item"],
    data: function() {
      return {};
    },
    methods: {
      getContentComponentType: function() {
        let currentType = this.item.type;
        if (currentType === "URI") {
          return "uri-item";
        } else if (currentType === "3DXContent") {
          //Look into the data
          let serviceId = this.item.data.serviceId;
          if (serviceId === "3DSpace") {
            return "eno-item";
          } else if (serviceId === "3DSwym") {
            return "swym-item";
          } else if (serviceId === "3DDrive") {
            return "drive-item";
          }
        } else if (currentType === "Image") {
          return "img-item";
        } else if (currentType === "File") {
          return "file-item";
        } else if (currentType === "HTML") {
          return "html-item";
        } else if (currentType === "Person") {
          return "person-item";
        } else if (currentType === "JSON") {
          return "json-item";
        }
        //Default : Display content as text
        return "text-item";
      },
      getOptions: function() {
        let opts = [];
        let currentType = this.item.type;
        if (currentType === "Person") {
          opts = [
            { label: "Attendee", value: "attendee" },
            { label: "Person", value: "person" }
          ];
        } else {
          opts = [
            { label: "Input", value: "inData" },
            { label: "Output", value: "outData" },
            { label: "Context", value: "ctxData" }
          ];
        }
        return opts;
      }
    }
  });
});
</script>