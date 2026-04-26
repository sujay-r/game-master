import { defineAsyncComponent } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import HUDView from '@/views/HUDView.vue'
import QuestView from '@/views/QuestView.vue'
import ShopView from '@/views/ShopView.vue'

const LoginView = defineAsyncComponent(() => import('@/views/LoginView.vue'))

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'HUD',
      component: HUDView,
      meta: { requiresAuth: true },
    },
    {
      path: '/quests',
      name: 'Quests',
      component: QuestView,
      meta: { requiresAuth: true },
    },
    {
      path: '/shop',
      name: 'Shop',
      component: ShopView,
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      name: 'Login',
      component: LoginView,
      meta: { requiresAuth: false },
    },
  ],
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Wait for auth initialization to complete instead of blind timeout
  if (authStore.loading) {
    await authStore.authReady
  }

  const requiresAuth = to.meta.requiresAuth
  const isAuthenticated = authStore.isAuthenticated

  if (requiresAuth && !isAuthenticated) {
    // Redirect to login if trying to access protected route while not authenticated
    next({ name: 'Login' })
  } else if (to.name === 'Login' && isAuthenticated) {
    // Redirect to home if trying to access login while already authenticated
    next({ name: 'HUD' })
  } else {
    next()
  }
})

export default router
