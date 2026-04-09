import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '../services/api';

interface AuthUser {
  id: string;
  username: string;
  isAdmin: boolean;
}

export interface ManagedUser {
  id: string;
  username: string;
  isAdmin: boolean;
  created_at: string;
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null);
  const isLoading = ref(true);
  const needsSetup = ref(false);

  const isAuthenticated = computed(() => !!user.value);
  const isAdmin = computed(() => !!user.value?.isAdmin);

  async function checkAuth() {
    isLoading.value = true;
    try {
      const statusData = await api.get<{ needsSetup: boolean }>('/auth/status');
      needsSetup.value = statusData.needsSetup;

      if (statusData.needsSetup) {
        user.value = null;
        return;
      }

      const data = await api.get<{ user: AuthUser }>('/auth/me');
      user.value = data.user;
    } catch {
      user.value = null;
    } finally {
      isLoading.value = false;
    }
  }

  async function setup(username: string, password: string) {
    const data = await api.post<{ user: AuthUser }>('/auth/setup', { username, password });
    user.value = data.user;
    needsSetup.value = false;
    return data.user;
  }

  async function login(username: string, password: string) {
    const data = await api.post<{ user: AuthUser }>('/auth/login', { username, password });
    user.value = data.user;
    return data.user;
  }

  async function logout() {
    await api.post('/auth/logout');
    user.value = null;
  }

  async function inviteUser(username: string, password: string) {
    const data = await api.post<{ user: AuthUser }>('/auth/invite', { username, password });
    return data.user;
  }

  // --- Admin user management ---

  async function listUsers(): Promise<ManagedUser[]> {
    const data = await api.get<{ users: ManagedUser[] }>('/auth/users');
    return data.users;
  }

  async function deleteUser(userId: string) {
    await api.delete(`/auth/users/${userId}`);
  }

  async function toggleAdmin(userId: string): Promise<ManagedUser> {
    const data = await api.put<{ user: ManagedUser }>(`/auth/users/${userId}/admin`, {});
    return data.user;
  }

  async function resetPassword(userId: string, password: string) {
    await api.put(`/auth/users/${userId}/password`, { password });
  }

  return {
    user,
    isLoading,
    needsSetup,
    isAuthenticated,
    isAdmin,
    checkAuth,
    setup,
    login,
    logout,
    inviteUser,
    listUsers,
    deleteUser,
    toggleAdmin,
    resetPassword,
  };
});
