<template>
  <div class="h-screen w-screen flex flex-col overflow-hidden bg-gray-50 text-gray-900 font-sans print:h-auto print:w-auto print:overflow-visible">
    <!-- Top Bar (when authenticated, not on login page) -->
    <header v-if="authStore.isAuthenticated && route.name !== 'login'" class="bg-white border-b border-gray-200 px-4 py-2 flex justify-between items-center shrink-0 print:hidden z-50">
      <router-link to="/" class="flex items-center space-x-2 hover:opacity-80 transition">
        <div class="w-7 h-7 bg-blue-600 rounded-none flex items-center justify-center">
          <svg class="w-4 h-4 text-white stroke-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="18" rx="0" ry="0"/>
            <line x1="12" y1="3" x2="12" y2="21"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </div>
        <span class="font-bold text-gray-800 text-sm">Soccer Roster</span>
      </router-link>
      <div class="flex items-center space-x-3">
        <!-- Admin Panel Link -->
        <router-link
          v-if="authStore.isAdmin"
          to="/admin"
          class="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-none transition"
          :class="route.name === 'admin'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100'"
          title="User Management"
        >
          <Users class="w-3.5 h-3.5" />
          Admin
        </router-link>
        <span class="text-xs font-medium text-gray-500">
          {{ authStore.user?.username }}
        </span>
        <button @click="handleLogout" class="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-none transition" title="Sign Out">
          <LogOut class="w-4 h-4" />
        </button>
      </div>
    </header>

    <!-- Main Content routing -->
    <main class="flex-1 flex flex-col min-h-0 min-w-0 print:h-auto print:block relative overflow-y-auto print:overflow-visible bg-gray-50">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from './stores/auth';
import { LogOut, Users } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

async function handleLogout() {
  await authStore.logout();
  router.push('/login');
}
</script>
