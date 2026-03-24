import { Mention } from '@tiptap/extension-mention'
import { mergeAttributes } from '@tiptap/core'

export const TaskMention = Mention.extend({
  name: 'taskMention',

  addAttributes() {
    return {
      ...this.parent?.(),
      'data-type': {
        default: 'task',
        parseHTML: (element) => element.getAttribute('data-type'),
        renderHTML: (attributes) => ({
          'data-type': attributes['data-type'],
        }),
      },
      'data-id': {
        default: null,
        parseHTML: (element) => element.getAttribute('data-id'),
        renderHTML: (attributes) => ({
          'data-id': attributes['data-id'],
        }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="task"]',
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes({ class: 'task-mention' }, HTMLAttributes),
      `@${node.attrs.label}`,
    ]
  },

  addKeyboardShortcuts() {
    return {
      Backspace: () =>
        this.editor.commands.command(({ tr, state }) => {
          let isMention = false
          const { selection } = state
          const { empty, anchor } = selection

          if (!empty) {
            return false
          }

          state.doc.nodesBetween(anchor - 1, anchor, (node, pos) => {
            if (node.type.name === this.name) {
              isMention = true
              tr.insertText('', pos, pos + node.nodeSize)
              return false
            }
          })

          return isMention
        }),
    }
  },
})

export default TaskMention
