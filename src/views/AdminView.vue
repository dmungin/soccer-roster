<template>
  <div class="w-full h-full overflow-y-auto bg-gray-50">
    <div class="max-w-4xl mx-auto p-6 sm:p-8">

      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3 uppercase">
            <div class="w-10 h-10 bg-blue-600 rounded-none flex items-center justify-center shadow-md">
              <Users class="w-5 h-5 text-white" />
            </div>
            User Management
          </h1>
          <p class="text-[10px] text-gray-400 font-bold mt-1 ml-[52px] uppercase tracking-widest">
            Manage application access
          </p>
        </div>
        <router-link to="/" class="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-gray-800 transition px-3 py-2 rounded-none border border-transparent hover:border-gray-200 hover:bg-gray-100">
          <ArrowLeft class="w-4 h-4" /> Dashboard
        </router-link>
      </div>

      <!-- Create User Card -->
      <div class="bg-white border border-gray-200 rounded-none shadow-sm mb-6 overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 cursor-pointer select-none" @click="showCreateForm = !showCreateForm">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-blue-50 rounded-none flex items-center justify-center">
              <UserPlus class="w-4 h-4 text-blue-600" />
            </div>
            <span class="font-black text-xs uppercase tracking-widest text-gray-800">Create New Account</span>
          </div>
          <ChevronDown class="w-4 h-4 text-gray-400 transition-transform duration-200" :class="showCreateForm ? 'rotate-180' : ''" />
        </div>

        <div v-if="showCreateForm" class="p-6 space-y-4 bg-gray-50/50">
          <div v-if="createError" class="bg-red-50 border border-red-200 text-red-700 rounded-none px-4 py-3 text-sm font-medium flex items-center gap-2">
            <AlertCircle class="w-4 h-4 shrink-0" /> {{ createError }}
          </div>
          <div v-if="createSuccess" class="bg-green-50 border border-green-200 text-green-700 rounded-none px-4 py-3 text-sm font-medium flex items-center gap-2">
            <CheckCircle class="w-4 h-4 shrink-0" /> Account <strong>{{ createSuccess }}</strong> created.
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Username</label>
              <input
                id="new-username"
                v-model="newUsername"
                type="text"
                placeholder="e.g. coach_jones"
                class="w-full px-3 py-2.5 rounded-none border border-gray-300 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium text-sm transition"
              />
            </div>
            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Password</label>
              <input
                id="new-password"
                v-model="newPassword"
                type="password"
                placeholder="Min. 6 characters"
                class="w-full px-3 py-2.5 rounded-none border border-gray-300 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium text-sm transition"
              />
            </div>
          </div>

          <div class="flex items-center gap-3">
            <label class="flex items-center gap-2 cursor-pointer select-none">
              <div
                class="w-10 h-6 rounded-none relative transition-colors duration-200 cursor-pointer border border-gray-300"
                :class="newIsAdmin ? 'bg-blue-600 border-blue-600' : 'bg-gray-200'"
                @click="newIsAdmin = !newIsAdmin"
              >
                <div class="w-4 h-4 bg-white rounded-none absolute top-[3px] transition-all duration-200 shadow-sm" :class="newIsAdmin ? 'left-[19px]' : 'left-[3px]'"></div>
              </div>
              <span class="text-xs font-bold text-gray-700 uppercase tracking-tight">Grant Admin Access</span>
            </label>
            <span class="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Managers can invite others</span>
          </div>

          <button
            @click="createUser"
            :disabled="isCreating || !newUsername.trim() || newPassword.length < 6"
            id="create-user-btn"
            class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-none font-black text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
          >
            <span v-if="isCreating" class="flex items-center gap-2"><Loader2 class="w-3.5 h-3.5 animate-spin" /> Creating...</span>
            <span v-else>Create Account</span>
          </button>
        </div>
      </div>

      <!-- Users Table -->
      <div class="bg-white border border-gray-200 rounded-none shadow-sm overflow-hidden">
        <div class="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          <div class="w-8 h-8 bg-gray-100 rounded-none flex items-center justify-center">
            <Users class="w-4 h-4 text-gray-500" />
          </div>
          <span class="font-black text-xs uppercase tracking-widest text-gray-800">All Users</span>
          <span class="ml-auto text-xs font-black text-gray-400 bg-gray-100 px-2 py-1 rounded-none">{{ users.length }}</span>
        </div>

        <div v-if="isLoadingUsers" class="py-12 flex justify-center items-center text-gray-400">
          <Loader2 class="w-6 h-6 animate-spin mr-2" /> Loading users...
        </div>

        <div v-else-if="users.length === 0" class="py-12 text-center text-gray-400 text-sm font-medium">
          No users found.
        </div>

        <ul v-else class="divide-y divide-gray-100">
          <li
            v-for="u in users"
            :key="u.id"
            class="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 gap-4 hover:bg-gray-50 transition group"
          >
            <!-- User info -->
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-9 h-9 rounded-none bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-sm">
                {{ u.username.charAt(0).toUpperCase() }}
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-bold text-gray-800">{{ u.username }}</span>
                  <span v-if="u.id === authStore.user?.id" class="text-[10px] font-black bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-none uppercase tracking-tighter">You</span>
                  <span v-if="u.isAdmin" class="text-[10px] font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-none uppercase flex items-center gap-1 tracking-tighter">
                    <Shield class="w-2.5 h-2.5" /> Admin
                  </span>
                </div>
                <div class="text-[10px] text-gray-400 font-bold uppercase mt-0.5 tracking-tighter">
                  Created {{ formatDate(u.created_at) }}
                </div>
              </div>
            </div>

            <!-- Actions (hidden for self) -->
            <div v-if="u.id !== authStore.user?.id" class="flex items-center gap-2 shrink-0">

              <!-- Reset Password -->
              <div class="relative" :ref="el => resetRefs[u.id] = el">
                <button
                  @click="toggleResetForm(u.id)"
                  class="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-blue-600 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 px-3 py-1.5 rounded-none transition flex items-center gap-1"
                  :title="`Reset ${u.username}'s password`"
                >
                  <KeyRound class="w-3 h-3" /> Reset PW
                </button>

                <!-- Inline password reset form -->
                <div
                  v-if="resetForms[u.id]?.open"
                  class="absolute right-0 top-full mt-2 bg-white border border-gray-300 rounded-none shadow-xl p-4 z-20 w-64"
                  @click.stop
                >
                  <p class="text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">New PW for <span class="text-blue-600">{{ u.username }}</span></p>
                  <div v-if="resetForms[u.id].error" class="text-xs text-red-500 font-medium mb-2">{{ resetForms[u.id].error }}</div>
                  <div v-if="resetForms[u.id].success" class="text-xs text-green-600 font-medium mb-2">✓ Updated!</div>
                  <input
                    type="password"
                    v-model="resetForms[u.id].value"
                    placeholder="New password (min. 6 chars)"
                    class="w-full text-sm border border-gray-200 rounded-none px-3 py-2 focus:outline-none focus:border-blue-500 mb-3"
                    @keyup.enter="submitReset(u.id)"
                  />
                  <div class="flex gap-2">
                    <button
                      @click="submitReset(u.id)"
                      :disabled="resetForms[u.id].loading || (resetForms[u.id].value?.length ?? 0) < 6"
                      class="bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-none hover:bg-blue-700 disabled:opacity-50 transition flex-1"
                    >
                      <span v-if="resetForms[u.id].loading">Saving...</span>
                      <span v-else>Save</span>
                    </button>
                    <button @click="resetForms[u.id].open = false" class="border border-gray-200 text-gray-500 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-none hover:bg-gray-50 transition">Cancel</button>
                  </div>
                </div>
              </div>

              <!-- Toggle Admin -->
              <button
                @click="handleToggleAdmin(u.id, u.username)"
                :class="[
                  'text-[10px] font-black uppercase tracking-widest border px-3 py-1.5 rounded-none transition flex items-center gap-1',
                  u.isAdmin
                    ? 'text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100'
                    : 'text-gray-500 border-gray-200 hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50'
                ]"
                :title="u.isAdmin ? `Revoke admin from ${u.username}` : `Make ${u.username} admin`"
              >
                <ShieldCheck class="w-3 h-3" />
                {{ u.isAdmin ? 'Revoke Admin' : 'Make Admin' }}
              </button>

              <!-- Delete -->
              <button
                @click="handleDelete(u.id, u.username)"
                class="text-gray-300 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 p-2 rounded-none transition"
                :title="`Delete ${u.username}`"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>

            <!-- Self badge -->
            <div v-else class="text-xs text-gray-400 font-medium shrink-0 italic">
              Your account
            </div>
          </li>
        </ul>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue';
import { useAuthStore, type ManagedUser } from '../stores/auth';
import {
  Users, UserPlus, Trash2, Shield, ShieldCheck, KeyRound,
  ChevronDown, AlertCircle, CheckCircle, Loader2, ArrowLeft
} from 'lucide-vue-next';

const authStore = useAuthStore();

// --- State ---
const users = ref<ManagedUser[]>([]);
const isLoadingUsers = ref(false);
const showCreateForm = ref(true);

// Create form
const newUsername = ref('');
const newPassword = ref('');
const newIsAdmin = ref(false);
const isCreating = ref(false);
const createError = ref('');
const createSuccess = ref('');

// Reset password forms per user
const resetForms = reactive<Record<string, { open: boolean; value: string; loading: boolean; error: string; success: boolean }>>({});
const resetRefs = reactive<Record<string, any>>({});

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

async function loadUsers() {
  isLoadingUsers.value = true;
  try {
    users.value = await authStore.listUsers();
    // Init reset forms for each user
    for (const u of users.value) {
      if (!resetForms[u.id]) {
        resetForms[u.id] = { open: false, value: '', loading: false, error: '', success: false };
      }
    }
  } catch (err: any) {
    console.error(err);
  } finally {
    isLoadingUsers.value = false;
  }
}

async function createUser() {
  createError.value = '';
  createSuccess.value = '';
  isCreating.value = true;

  try {
    if (newIsAdmin.value) {
      // Use invite + then toggle admin — or just use invite with admin flag via a separate call
      const created = await authStore.inviteUser(newUsername.value.trim(), newPassword.value);
      if (newIsAdmin.value) {
        await authStore.toggleAdmin(created.id);
      }
    } else {
      await authStore.inviteUser(newUsername.value.trim(), newPassword.value);
    }
    createSuccess.value = newUsername.value.trim();
    newUsername.value = '';
    newPassword.value = '';
    newIsAdmin.value = false;
    await loadUsers();
  } catch (err: any) {
    createError.value = err.message || 'Failed to create user';
  } finally {
    isCreating.value = false;
  }
}

function toggleResetForm(userId: string) {
  if (resetForms[userId]) {
    resetForms[userId].open = !resetForms[userId].open;
    resetForms[userId].error = '';
    resetForms[userId].success = false;
  }
}

async function submitReset(userId: string) {
  const form = resetForms[userId];
  if (!form || form.value.length < 6) return;

  form.loading = true;
  form.error = '';
  form.success = false;

  try {
    await authStore.resetPassword(userId, form.value);
    form.success = true;
    form.value = '';
    setTimeout(() => {
      form.open = false;
      form.success = false;
    }, 1500);
  } catch (err: any) {
    form.error = err.message || 'Failed to reset password';
  } finally {
    form.loading = false;
  }
}

async function handleToggleAdmin(userId: string, username: string) {
  if (!confirm(`Change admin status for "${username}"?`)) return;
  try {
    const updated = await authStore.toggleAdmin(userId);
    const idx = users.value.findIndex(u => u.id === userId);
    if (idx !== -1) users.value[idx].isAdmin = updated.isAdmin;
  } catch (err: any) {
    alert(err.message || 'Failed to update admin status');
  }
}

async function handleDelete(userId: string, username: string) {
  if (!confirm(`Delete account "${username}"? This will also delete all their teams and games. This cannot be undone.`)) return;
  try {
    await authStore.deleteUser(userId);
    users.value = users.value.filter(u => u.id !== userId);
  } catch (err: any) {
    alert(err.message || 'Failed to delete user');
  }
}

// Close dropdowns on outside click
function handleOutsideClick(event: MouseEvent) {
  for (const userId of Object.keys(resetForms)) {
    const el = resetRefs[userId];
    if (el && !el.contains(event.target as Node)) {
      resetForms[userId].open = false;
    }
  }
}

onMounted(() => {
  loadUsers();
  document.addEventListener('click', handleOutsideClick);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideClick);
});
</script>
