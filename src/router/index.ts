import HUDView from '@/views/HUDView.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: "HUD",
      component: HUDView
    }
  ],
})

export default router
