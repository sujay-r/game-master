<template>
  <editor-content :editor="editor" class="textbox-style" />
</template>

<script setup lang="ts">
import { Editor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extensions';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = defineProps<{
  modelValue: string | null,
  placeholder?: string,
  textBox: boolean,
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>();

const editor = ref<Editor>();

watch(
  () => props.modelValue,
  (value) => {
    if (!editor.value) return;

    const isSame = editor.value.getHTML() === value;
    if (isSame) return;

    editor.value.commands.setContent(value);
  }
);

onMounted(() => {
  const extensions: any[] = [StarterKit];
  if (props.placeholder) {
    extensions.push(
      Placeholder.configure({
        placeholder: props.placeholder,
      })
    );
  }

  editor.value = new Editor({
    extensions: extensions,
    content: props.modelValue,
    onUpdate: ({ editor }) => {
      emit('update:modelValue', editor.getHTML());
    }
  })
})

onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy();
  }
})

</script>

<style>
.textbox-style {
  text-align: left;
  width: 100%;
  min-height: 140px;
  resize: vertical;
  border-radius: 12px;
  border: 1.5px solid #e0e0e0;
  background: rgba(0, 0, 0, 0.05);
  font-size: 1em;
  font-family: inherit;
  color: #424242;
  box-sizing: border-box;
  margin-bottom: 1em;
  transition: border-color 0.2s;
}

.textbox-style:focus-within {
  background: #fff;
  border-color: #4BAB91;
}

.textbox-style .ProseMirror {
  min-height: 140px;
  width: 100%;
  padding: 1em;
  border: none;
  outline: none;
  background: transparent;
  font-size: inherit;
  font-family: inherit;
  color: inherit;
  box-sizing: border-box;
  border-radius: 12px;
  box-shadow: none;
}

.textbox-style .ProseMirror:focus {
  outline: none;
  box-shadow: none;
}

.tiptap p.is-editor-empty:first-child::before {
  color: rgba(0, 0, 0, 0.27);
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}
</style>
