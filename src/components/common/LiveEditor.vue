<template>
  <editor-content :editor="editor" class="textbox-style" />
</template>

<script setup lang="ts">
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { Placeholder } from '@tiptap/extensions'
import { onBeforeUnmount, onMounted, ref, watch, h, render } from 'vue'
import tippy, { type Instance as TippyInstance } from 'tippy.js'
import 'tippy.js/dist/tippy.css'
import TaskMention from '@/extensions/TaskMention'
import QuestMention from '@/extensions/QuestMention'
import TaskMentionDropdown from './TaskMentionDropdown.vue'
import QuestMentionDropdown from './QuestMentionDropdown.vue'
import type { TaskType, Quest } from '@/types/common'

interface TaskWithQuestName extends TaskType {
  questName?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SuggestionRenderProps = any

const props = defineProps<{
  modelValue: string | null
  placeholder?: string
  textBox: boolean
  disabled?: boolean
  enableTaskMentions?: boolean
  enableQuestMentions?: boolean
  availableTasks?: TaskWithQuestName[]
  availableQuests?: Quest[]
  currentEntityId?: number
  currentEntityType?: 'task' | 'quest'
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

// TODO: Implement reference click navigation
// Currently detects clicks but doesn't navigate
// When implementing:
// 1. Add 'mention-click' emit
// 2. Detect clicks on .task-mention and .quest-mention elements
// 3. Emit event with type ('task'|'quest') and id
// 4. Parent (Task.vue/QuestDetailModal.vue) receives and opens modal
// 5. Consider using global state instead of events for cleaner architecture

const editor = ref<Editor>()
let taskTippyInstance: TippyInstance | null = null
let questTippyInstance: TippyInstance | null = null
let taskDropdownComponent: ReturnType<typeof h> | null = null
let questDropdownComponent: ReturnType<typeof h> | null = null

function createTaskMentionConfig() {
  return {
    HTMLAttributes: {
      class: 'task-mention',
    },
    suggestion: {
      char: '@',
      startOfLine: false,
      allowSpaces: true,
      items: () => {
        return props.availableTasks || []
      },
      render: () => {
        let component: ReturnType<typeof h> | null = null
        let popup: TippyInstance | null = null

        return {
          onStart: (suggestionProps: SuggestionRenderProps) => {
            component = h(TaskMentionDropdown, {
              items: suggestionProps.items || [],
              query: suggestionProps.query,
              currentTaskId: (
                suggestionProps.editor?.storage as { mention?: { currentEntityId?: number } }
              ).mention?.currentEntityId,
              onSelect: (task: TaskWithQuestName) => {
                const { editor, range } = suggestionProps

                // Replace range (trigger @ + query) with mention + trailing space
                editor
                  .chain()
                  .focus()
                  .insertContentAt(range, [
                    {
                      type: 'taskMention',
                      attrs: {
                        id: task.id,
                        label: task.title,
                        'data-type': 'task',
                        'data-id': task.id,
                      },
                    },
                    {
                      type: 'text',
                      text: ' ',
                    },
                  ])
                  .run()
              },
            })

            const div = document.createElement('div')
            render(component, div)
            taskDropdownComponent = component

            popup = tippy(document.body, {
              getReferenceClientRect: suggestionProps.clientRect,
              appendTo: () => document.body,
              content: div,
              showOnCreate: true,
              interactive: true,
              trigger: 'manual',
              placement: 'bottom-start',
            })
            taskTippyInstance = popup
          },
          onUpdate: (suggestionProps: SuggestionRenderProps) => {
            if (component && taskDropdownComponent) {
              taskDropdownComponent.component?.exposed?.updateData?.(
                suggestionProps.items,
                suggestionProps.query,
              )
            }
            if (popup) {
              popup.setProps({
                getReferenceClientRect: suggestionProps.clientRect,
              })
            }
          },
          onKeyDown: (suggestionProps: SuggestionRenderProps) => {
            if (taskDropdownComponent?.component?.exposed) {
              return taskDropdownComponent.component.exposed.onKeyDown(suggestionProps.event)
            }
            return false
          },
          onExit: () => {
            if (popup) {
              popup.destroy()
              taskTippyInstance = null
            }
            if (component) {
              render(null, component.el?.parentElement)
              taskDropdownComponent = null
            }
          },
        }
      },
    },
  }
}

function createQuestMentionConfig() {
  return {
    HTMLAttributes: {
      class: 'quest-mention',
    },
    suggestion: {
      char: '@@',
      startOfLine: false,
      allowSpaces: true,
      items: () => {
        return props.availableQuests || []
      },
      render: () => {
        let component: ReturnType<typeof h> | null = null
        let popup: TippyInstance | null = null

        return {
          onStart: (suggestionProps: SuggestionRenderProps) => {
            component = h(QuestMentionDropdown, {
              items: suggestionProps.items || [],
              query: suggestionProps.query,
              currentQuestId: (
                suggestionProps.editor?.storage as { mention?: { currentEntityId?: number } }
              ).mention?.currentEntityId,
              onSelect: (quest: Quest) => {
                const { editor, range } = suggestionProps

                // Replace range (trigger @@ + query) with mention + trailing space
                editor
                  .chain()
                  .focus()
                  .insertContentAt(range, [
                    {
                      type: 'questMention',
                      attrs: {
                        id: quest.id,
                        label: quest.title,
                        'data-type': 'quest',
                        'data-id': quest.id,
                        'data-quest-type': quest.type,
                      },
                    },
                    {
                      type: 'text',
                      text: ' ',
                    },
                  ])
                  .run()
              },
            })

            const div = document.createElement('div')
            render(component, div)
            questDropdownComponent = component

            popup = tippy(document.body, {
              getReferenceClientRect: suggestionProps.clientRect,
              appendTo: () => document.body,
              content: div,
              showOnCreate: true,
              interactive: true,
              trigger: 'manual',
              placement: 'bottom-start',
            })
            questTippyInstance = popup
          },
          onUpdate: (suggestionProps: SuggestionRenderProps) => {
            if (component && questDropdownComponent) {
              questDropdownComponent.component?.exposed?.updateData?.(
                suggestionProps.items,
                suggestionProps.query,
              )
            }
            if (popup) {
              popup.setProps({
                getReferenceClientRect: suggestionProps.clientRect,
              })
            }
          },
          onKeyDown: (suggestionProps: SuggestionRenderProps) => {
            if (questDropdownComponent?.component?.exposed) {
              return questDropdownComponent.component.exposed.onKeyDown(suggestionProps.event)
            }
            return false
          },
          onExit: () => {
            if (popup) {
              popup.destroy()
              questTippyInstance = null
            }
            if (component) {
              render(null, component.el?.parentElement)
              questDropdownComponent = null
            }
          },
        }
      },
    },
  }
}

watch(
  () => props.modelValue,
  (value) => {
    if (!editor.value) return

    const isSame = editor.value.getHTML() === value
    if (isSame) return

    editor.value.commands.setContent(value)
  },
)

watch(
  () => props.disabled,
  (disabled) => {
    if (editor.value) {
      editor.value.setEditable(!disabled)
    }
  },
)

onMounted(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extensions: any[] = [StarterKit]

  if (props.placeholder) {
    extensions.push(
      Placeholder.configure({
        placeholder: props.placeholder,
      }),
    )
  }

  if (props.enableTaskMentions) {
    extensions.push(TaskMention.configure(createTaskMentionConfig()))
  }

  if (props.enableQuestMentions) {
    extensions.push(QuestMention.configure(createQuestMentionConfig()))
  }

  editor.value = new Editor({
    extensions: extensions,
    content: props.modelValue,
    editable: !props.disabled,
    onUpdate: ({ editor }) => {
      emit('update:modelValue', editor.getHTML())
    },
  })

  // Store current entity info for self-reference prevention
  if (editor.value && props.currentEntityId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(editor.value.storage as any).mention = {
      currentEntityId: props.currentEntityId,
      currentEntityType: props.currentEntityType,
    }
  }
})

onBeforeUnmount(() => {
  if (taskTippyInstance) {
    taskTippyInstance.destroy()
  }
  if (questTippyInstance) {
    questTippyInstance.destroy()
  }
  if (editor.value) {
    editor.value.destroy()
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
  border-color: #4bab91;
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

/* Task mention styling */
.task-mention {
  color: #32a287;
  background: rgba(50, 162, 135, 0.1);
  padding: 0.1em 0.3em;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.task-mention:hover {
  background: rgba(50, 162, 135, 0.2);
  text-decoration: underline;
}

/* Quest mention styling - color-coded by type */
.quest-mention {
  padding: 0.1em 0.3em;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.quest-mention.main {
  color: #c9a227;
  background: rgba(201, 162, 39, 0.1);
}

.quest-mention.main:hover {
  background: rgba(201, 162, 39, 0.2);
  text-decoration: underline;
}

.quest-mention.side {
  color: #6b8cae;
  background: rgba(107, 140, 174, 0.1);
}

.quest-mention.side:hover {
  background: rgba(107, 140, 174, 0.2);
  text-decoration: underline;
}

.quest-mention.lifeAdmin {
  color: #20b2aa;
  background: rgba(32, 178, 170, 0.1);
}

.quest-mention.lifeAdmin:hover {
  background: rgba(32, 178, 170, 0.2);
  text-decoration: underline;
}
</style>
