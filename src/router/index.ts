import HUDView from '@/views/HUDView.vue'
import QuestView from '@/views/QuestView.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/quests',
      name: "HUD",
      component: HUDView
    },
    {
      path: '/',
      name: "Quests",
      component: QuestView
    }
  ],
})

export default router
