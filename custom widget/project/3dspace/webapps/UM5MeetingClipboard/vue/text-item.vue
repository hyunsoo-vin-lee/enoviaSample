<template>
  <div class="textItem">
    <textarea :id="cke_id" :value="content.data"></textarea>
  </div>
</template>

<style scoped>
</style>

<script>
/* global CKEDITOR */
define(["vue", "BTWWLibrairies/ckeditor/ckeditor"], function(Vue) {
  return Vue.component("text-item", {
    template: template,
    props: ["content"],
    data: function() {
      return {
        cke_id: undefined,
        destroyed: false,
        focused: false
      };
    },
    computed: {
      ckinstance() {
        return CKEDITOR.instances[this.cke_id];
      }
    },

    watch: {
      "content.data": function(newContent) {
        console.log(
          widget.id + " - text-item : watch, new content.data",
          newContent
        );
        this.ckinstance.setData(newContent, { internal: true }); // [ internal ] : Boolean, Whether to suppress any event firing when copying data internally inside the editor.
      }
    },

    created: function() {
      //vue instance created
      //Let's get a unique id
      if (!window.cke_count) {
        window.cke_count = 1;
      }
      this.cke_id = "cke_id-" + window.cke_count++;
    },
    mounted() {
      this.create();
    },
    beforeDestroy() {
      this.destroy();
    },
    updated() {
      console.log(widget.id + " - text-item updated", this.content.data);
      this.$nextTick(() => {
        //If updated from outside, set back the data in ckEditor
        this.ckinstance.setData(this.content.data, {
          internal: this.focused
        });
      });
    },

    methods: {
      create() {
        if (typeof CKEDITOR === "undefined") {
          console.log("CKEDITOR is missing (http://ckeditor.com/)");
          return;
        }
        let ckconfig = {
          toolbarGroups: [
            { name: "document", groups: ["mode", "document", "doctools"] },
            { name: "clipboard", groups: ["undo", "clipboard"] },
            {
              name: "editing",
              groups: ["find", "selection", "spellchecker", "editing"]
            },
            { name: "forms", groups: ["forms"] },
            { name: "basicstyles", groups: ["basicstyles", "cleanup"] },
            {
              name: "paragraph",
              groups: ["list", "indent", "blocks", "align", "bidi", "paragraph"]
            },
            { name: "links", groups: ["links"] },
            { name: "insert", groups: ["insert"] },
            { name: "styles", groups: ["styles"] },
            { name: "colors", groups: ["colors"] },
            { name: "tools", groups: ["tools"] },
            { name: "others", groups: ["others"] },
            { name: "about", groups: ["about"] }
          ],
          removeButtons: "About,Anchor",
          removePlugins: "dragdrop,basket",
          height: "3em", //Initial Height,
          resize_enable: true // false
        };

        CKEDITOR.inline(this.cke_id, ckconfig);

        this.ckinstance.setData(this.content.data);
        this.ckinstance.on("instanceReady", () => {
          this.ckinstance.setData(this.content.data);
        });

        this.ckinstance.on("change", this.onChange);
        this.ckinstance.on("focus", () => {
          this.focused = true;
        });
        this.ckinstance.on("blur", () => {
          this.focused = false;
        });
      },
      destroy() {
        try {
          if (!this.destroyed) {
            this.ckinstance.focusManager.blur(true);
            this.ckinstance.removeAllListeners();
            this.ckinstance.destroy();
            this.destroyed = true;
          }
        } catch (e) {}
      },
      onChange(ev) {
        let html = this.ckinstance.getData();
        console.log(widget.id + " - text-item : onChange", html);
        this.$emit("input", html);
        this.content.data = html;
      }
    }
  });
});
</script>