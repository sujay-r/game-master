import { defineStore } from 'pinia'
import type { Tag } from '@/types/common'
import {
  fetchAllTags,
  createTag,
  findOrCreateTag,
  updateTag,
  deleteTag,
  fetchTagUsageCounts,
} from '@/lib/supabase'

// TODO: Replace preset color palette with a proper color picker (e.g. <input type="color"> or a library)
const TAG_COLORS = [
  '#32a287',
  '#2d826d',
  '#c9a227',
  '#6b8cae',
  '#20b2aa',
  '#c62828',
  '#8e6b8c',
  '#d4894a',
  '#424242',
  '#1976d2',
  '#388e3c',
  '#f57c00',
  '#7b1fa2',
  '#00796b',
  '#5d4037',
  '#e91e63',
  '#455a64',
  '#9e9d24',
]

interface TagsStoreState {
  tags: Tag[]
  loading: boolean
  error: string | null
  usageCounts: Map<number, number>
}

const useTagsStore = defineStore('tags', {
  state: (): TagsStoreState => ({
    tags: [],
    loading: false,
    error: null,
    usageCounts: new Map(),
  }),

  actions: {
    async loadTags() {
      this.loading = true
      this.error = null
      try {
        this.tags = await fetchAllTags()
        await this.loadUsageCounts()
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to load tags'
        console.error('Error loading tags: ', err)
      } finally {
        this.loading = false
      }
    },

    async loadUsageCounts() {
      try {
        this.usageCounts = await fetchTagUsageCounts()
      } catch (err) {
        console.error('Error loading tag usage counts: ', err)
      }
    },

    getNextDefaultColor(): string {
      const index = this.tags.length % TAG_COLORS.length
      return TAG_COLORS[index]
    },

    async ensureTag(name: string): Promise<Tag> {
      const normalized = name.trim().toLowerCase()
      if (!normalized) {
        throw new Error('Tag name cannot be empty')
      }
      const existing = this.tags.find((t) => t.name === normalized)
      if (existing) {
        return existing
      }
      // TODO: Allow user to pick a tag color during creation instead of auto-assigning
      const color = this.getNextDefaultColor()
      const tag = await findOrCreateTag(normalized, color)
      this.tags.push(tag)
      this.tags.sort((a, b) => a.name.localeCompare(b.name))
      return tag
    },

    async addTag(name: string, color?: string): Promise<Tag> {
      const tag = await createTag(name, color || this.getNextDefaultColor())
      this.tags.push(tag)
      this.tags.sort((a, b) => a.name.localeCompare(b.name))
      return tag
    },

    async renameTag(tagId: number, newName: string): Promise<Tag> {
      const updated = await updateTag(tagId, { name: newName })
      const index = this.tags.findIndex((t) => t.id === tagId)
      if (index !== -1) {
        this.tags[index] = updated
        this.tags.sort((a, b) => a.name.localeCompare(b.name))
      }
      return updated
    },

    async recolorTag(tagId: number, newColor: string): Promise<Tag> {
      const updated = await updateTag(tagId, { color: newColor })
      const index = this.tags.findIndex((t) => t.id === tagId)
      if (index !== -1) {
        this.tags[index] = updated
      }
      return updated
    },

    async removeTag(tagId: number): Promise<void> {
      await deleteTag(tagId)
      this.tags = this.tags.filter((t) => t.id !== tagId)
      this.usageCounts.delete(tagId)
    },

    isTagInUse(tagId: number): boolean {
      return (this.usageCounts.get(tagId) || 0) > 0
    },

    clearError() {
      this.error = null
    },
  },

  getters: {
    allTags: (state) => state.tags,

    getTagByName: (state) => {
      return (name: string) => state.tags.find((t) => t.name === name.trim().toLowerCase())
    },

    getTagById: (state) => {
      return (id: number) => state.tags.find((t) => t.id === id)
    },

    tagColors: () => TAG_COLORS,
  },
})

export { useTagsStore }
