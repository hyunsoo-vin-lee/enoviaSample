<template>
  <div class="personItem">
    <base-clipboard-item>
      <template slot="image">
        <img :src="content.data.imgUrl" class="previewPerson">
      </template>
      <span class="mainName">{{content.data.data.givenName}} {{content.data.data.sn}}</span>
      <br>
      {{content.data.data.title}}
      <br>
      <a
        :href="'mailto:'+content.data.data.mail"
        :title="'Send an e-mail to : '+content.data.data.mail"
      >
        <v-icon>mail</v-icon>
        <span>{{content.data.data.mail}}</span>
      </a>
    </base-clipboard-item>
  </div>
</template>

<style scoped>
.personItem {
  position: relative;
}
.personItem > img.previewPerson {
  max-height: 4em;
  float: left;
  margin: 0.5em;
}
</style>

<script>
define(["vue"], function(Vue) {
  return Vue.component("person-item", {
    template: template,
    props: ["content"],
    data: function() {
      return {};
    },
    methods: {}
  });
});
</script>