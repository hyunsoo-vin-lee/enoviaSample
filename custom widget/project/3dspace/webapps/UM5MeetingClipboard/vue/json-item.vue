<template>
  <div class="jsonItem" v-html="content.html"></div>
</template>

<style scoped>
.jsonItem table {
  border-collapse: collapse;
  width: 100%;
  max-width: 100%;
}
.jsonItem table tr td {
  border: 1px solid lightgrey;
}

.jsonItem table tr td.key {
  background-color: rgb(232, 232, 232);
  font-weight: bold;
}
</style>

<script>
define(["vue"], function(Vue) {
  return Vue.component("json-item", {
    template: template,
    props: ["content"],
    data: function() {
      return {};
    },
    methods: {}
  });
});
</script>