import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useAppStore } from '../stores/appState'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { public: true }
    },
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/team/:id',
      name: 'team',
      component: () => import('../views/TeamView.vue')
    },
    {
      path: '/game/:id',
      name: 'game',
      component: () => import('../views/GameView.vue')
    },
    {
      path: '/builder',
      name: 'formation-builder',
      component: () => import('../views/FormationBuilderView.vue')
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/AdminView.vue'),
      meta: { adminOnly: true }
    }
  ]
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  // Wait for auth check to complete if still loading
  if (authStore.isLoading) {
    await authStore.checkAuth()
  }

  // Allow access to login page
  if (to.meta.public) {
    // If authenticated and trying to go to login, redirect home
    if (authStore.isAuthenticated) {
      return { name: 'home' }
    }
    return true
  }

  // Redirect unauthenticated users to login
  if (!authStore.isAuthenticated) {
    return { name: 'login' }
  }

  // Redirect non-admins away from admin-only routes
  if (to.meta.adminOnly && !authStore.isAdmin) {
    return { name: 'home' }
  }

  // Ensure app data is loaded for authenticated users
  const appStore = useAppStore()
  if (!appStore.hasLoaded && !appStore.isLoading) {
    await appStore.loadAll()
  }

  return true
})

export default router

