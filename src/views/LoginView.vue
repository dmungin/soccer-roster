<template>
  <div class="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4">
    <!-- Decorative background elements -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-none blur-3xl"></div>
      <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-none blur-3xl"></div>
    </div>

    <div class="w-full max-w-md relative z-10">
      <!-- Logo -->
      <div class="flex flex-col items-center mb-8">
        <div class="w-16 h-16 bg-blue-600 rounded-none flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4">
          <svg class="w-10 h-10 text-white stroke-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="18" rx="0" ry="0"/>
            <line x1="12" y1="3" x2="12" y2="21"/>
            <circle cx="12" cy="12" r="3"/>
            <path d="M2 8h3v8H2"/>
            <path d="M22 8h-3v8h3"/>
          </svg>
        </div>
        <h1 class="text-3xl font-black text-white tracking-tight uppercase">First Touch</h1>
        <p class="text-blue-300/70 text-sm mt-1 font-medium uppercase tracking-tight">
          {{ authStore.needsSetup ? 'Create your admin account' : 'Sign in to your account' }}
        </p>
      </div>

      <!-- Card -->
      <div class="bg-white/10 backdrop-blur-xl border border-white/10 rounded-none p-8 shadow-2xl">
        <form @submit.prevent="handleSubmit">
          <!-- Error Message -->
          <div v-if="error" class="bg-red-500/20 border border-red-500/30 text-red-200 rounded-none px-4 py-3 mb-6 text-sm font-medium flex items-center">
            <AlertCircle class="w-4 h-4 mr-2 shrink-0" />
            {{ error }}
          </div>

          <!-- Setup Notice -->
          <div v-if="authStore.needsSetup" class="bg-blue-500/20 border border-blue-500/30 text-blue-200 rounded-none px-4 py-3 mb-6 text-sm font-medium">
            Welcome! Create your admin account to get started. This account will have full control over the app.
          </div>

          <div class="space-y-5">
            <div>
              <label for="login-username" class="block text-xs font-black uppercase text-blue-100 mb-2 tracking-widest">Username</label>
              <input 
                id="login-username"
                v-model="username" 
                type="text" 
                autocomplete="username"
                required
                class="w-full px-4 py-3 rounded-none bg-white/10 border border-white/10 text-white placeholder-white/30 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30 transition font-medium"
                placeholder="Enter username"
              />
            </div>

            <div>
              <label for="login-password" class="block text-xs font-black uppercase text-blue-100 mb-2 tracking-widest">Password</label>
              <input 
                id="login-password"
                v-model="password" 
                type="password" 
                autocomplete="current-password"
                required
                class="w-full px-4 py-3 rounded-none bg-white/10 border border-white/10 text-white placeholder-white/30 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30 transition font-medium"
                placeholder="Enter password"
              />
            </div>
          </div>

          <button 
            type="submit" 
            :disabled="isSubmitting || !username.trim() || !password.trim()"
            class="w-full mt-8 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-none font-black text-sm uppercase tracking-widest transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40"
          >
            <span v-if="isSubmitting" class="flex items-center justify-center">
              <Loader2 class="w-4 h-4 mr-2 animate-spin" /> Processing...
            </span>
            <span v-else>
              {{ authStore.needsSetup ? 'Create Admin Account' : 'Sign In' }}
            </span>
          </button>
        </form>
      </div>

      <p class="text-center text-white/30 text-[10px] uppercase tracking-widest mt-6 font-bold">
        Soccer Roster Manager &mdash; Tactical Planning Tool
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { AlertCircle, Loader2 } from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const username = ref('');
const password = ref('');
const error = ref('');
const isSubmitting = ref(false);

async function handleSubmit() {
  error.value = '';
  isSubmitting.value = true;

  try {
    if (authStore.needsSetup) {
      await authStore.setup(username.value.trim(), password.value);
    } else {
      await authStore.login(username.value.trim(), password.value);
    }
    
    const redirectPath = route.query.redirect as string;
    router.push(redirectPath || '/');
  } catch (err: any) {
    error.value = err.message || 'Something went wrong';
  } finally {
    isSubmitting.value = false;
  }
}
</script>
