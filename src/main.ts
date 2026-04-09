import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import './style.css'
import App from './App.vue'
import { useAuthStore } from './stores/auth'
import { useAppStore } from './stores/appState'

const pinia = createPinia()

const app = createApp(App)
app.use(pinia)
app.use(router)

// Check auth status before mounting
const authStore = useAuthStore()
authStore.checkAuth().then(() => {
  // If authenticated, load app data
  if (authStore.isAuthenticated) {
    const appStore = useAppStore()
    appStore.loadAll()
  }
  app.mount('#app')
})
