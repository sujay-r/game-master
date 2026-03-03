import { defineAsyncComponent } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

const HUDView = defineAsyncComponent(() => import('@/views/HUDView.vue'))
const QuestView = defineAsyncComponent(() => import('@/views/QuestView.vue'))

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/quests',
      // path: '/',
      name: 'HUD',
      component: HUDView,
    },
    {
      path: '/',
      // path: '/quests',
      name: 'Quests',
      component: QuestView,
    },
  ],
})

export default router
