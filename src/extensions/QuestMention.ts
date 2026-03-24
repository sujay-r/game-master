import { Mention } from '@tiptap/extension-mention'
import { mergeAttributes } from '@tiptap/core'

export const QuestMention = Mention.extend({
  name: 'questMention',

  addAttributes() {
    return {
      ...this.parent?.(),
      'data-type': {
        default: 'quest',
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
      'data-quest-type': {
        default: null,
        parseHTML: (element) => element.getAttribute('data-quest-type'),
        renderHTML: (attributes) => ({
          'data-quest-type': attributes['data-quest-type'],
        }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="quest"]',
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    const questType = node.attrs['data-quest-type'] || 'main'
    return [
      'span',
      mergeAttributes({ class: `quest-mention ${questType}` }, HTMLAttributes),
      `@@${node.attrs.label}`,
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

export default QuestMention
