<template>
  <div id="editor">
    <mjml>
      <mj-body>
        <!-- Your MJML body here -->
        <mj-section>
        </mj-section>
      </mj-body>
    </mjml>
  </div>
</template>
<script setup lang="ts">
import "grapesjs/dist/css/grapes.min.css";
import grapesjs from "grapesjs";
import ckeditor from "./ckeditor.ts";
import grapesJSMJML from "grapesjs-mjml";
import { defineProps, onMounted, ref } from "vue";

const props = defineProps<{
  suggestions: {
    id: number;
    name: string;
  }[];
}>();

const editor = ref<null | any>(null);

onMounted(() => {
    console.log(props.suggestions);
  editor.value = grapesjs.init({
    container: "#editor",
    fromElement: true,
    plugins: [grapesJSMJML, ckeditor],
    pluginsOpts: {
      [ckeditor]: {
        suggestions: props.suggestions,
      },
    },
  });
});
</script>

<style lang="scss">
.cke_autocomplete_panel {
    color: #000;
}
</style>
