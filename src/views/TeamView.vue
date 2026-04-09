<template>
  <div class="p-4 sm:p-8 w-full max-w-5xl mx-auto h-full flex flex-col print-hide overflow-hidden">
    <div v-if="team" class="flex flex-col h-full bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
      <!-- Header -->
      <div :class="['p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 shrink-0 shadow-md relative z-10', team.color]">
        <div class="flex items-center space-x-4">
           <div class="bg-white/20 p-1.5 rounded-xl backdrop-blur-sm border border-white/30 hidden sm:flex items-center justify-center w-14 h-14 shadow-inner overflow-hidden">
               <img v-if="isCustomIcon(team.icon)" :src="team.icon" class="w-12 h-12 object-contain" />
               <component :is="(LucideIcons as any)[team.icon]" class="w-10 h-10 text-white"/>
           </div>
           <div>
             <h2 class="text-2xl font-black text-white tracking-tight flex items-center">
               <img v-if="isCustomIcon(team.icon)" :src="team.icon" class="w-5 h-5 mr-2 sm:hidden object-contain" />
               <component v-else :is="(LucideIcons as any)[team.icon]" class="w-5 h-5 mr-2 text-white sm:hidden"/>
               {{ team.name }} Roster
             </h2>
             <p class="text-sm text-white/80 mt-1 uppercase font-bold tracking-widest">{{ team.players.length }} players total</p>
           </div>
        </div>
        <router-link to="/" class="flex items-center justify-center bg-white/10 hover:bg-white/20 text-white px-3 py-2 border border-white/20 rounded-md transition shadow-sm backdrop-blur-sm font-medium text-sm">
          ← Dashboard
        </router-link>
      </div>

      <!-- Content Grid -->
      <div class="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-8">
        
        <!-- Left: Add Player -->
        <div class="w-full md:w-1/3 flex flex-col shrink-0 space-y-6">

          <!-- Team Settings -->
          <div class="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex flex-col gap-4">
             <h3 class="font-bold text-gray-800 border-b border-gray-100 pb-2">Team Customization</h3>
             
             <div>
               <label class="text-[11px] font-bold uppercase text-gray-500 mb-1.5 block">Team Name</label>
               <input :value="team.name" @change="updateName(($event.target as HTMLInputElement).value)" class="border border-gray-300 rounded px-2.5 py-1.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-400 w-full text-sm font-medium" />
             </div>

             <div>
               <label class="text-[11px] font-bold uppercase text-gray-500 mb-1.5 block">Team Color</label>
               <div class="flex flex-wrap gap-2">
                 <button v-for="c in colors" :key="c" @click="updateColor(c)" :class="[c, 'w-6 h-6 rounded-full cursor-pointer border-2 transition', team.color === c ? 'border-gray-800 scale-110 shadow-sm' : 'border-transparent']" :title="c"></button>
               </div>
             </div>

             <div>
               <label class="text-[11px] font-bold uppercase text-gray-500 mb-1.5 block">Mascot Icon</label>
               <div class="flex flex-col gap-2">
                   <div class="flex flex-wrap gap-1">
                  <button v-for="i in icons" :key="i" @click="updateIcon(i)" :class="['w-7 h-7 rounded flex items-center justify-center cursor-pointer transition', team.icon === i ? 'bg-gray-300 shadow-inner' : 'hover:bg-gray-200']" :title="i">
                    <component :is="(LucideIcons as any)[i]" class="w-4 h-4 text-gray-800"/>
                  </button>
                  <button @click="showCustomUrl = !showCustomUrl" :class="['w-7 h-7 rounded flex items-center justify-center cursor-pointer transition text-[9px] font-black text-gray-800 uppercase', isCustomIcon(team.icon) || showCustomUrl ? 'bg-gray-300 shadow-inner' : 'hover:bg-gray-200']" title="Custom URL">URL</button>
                 </div>
                 <div v-if="showCustomUrl || isCustomIcon(team.icon)" class="flex gap-2">
                   <input v-model="customUrlInput" placeholder="Image URL (http://...)" class="border border-gray-300 rounded px-2 py-1.5 outline-none focus:border-blue-500 text-xs flex-1" />
                   <button @click="saveCustomIcon" :disabled="!customUrlInput.trim()" class="bg-blue-600 disabled:opacity-50 text-white px-2 py-1 rounded text-[10px] font-bold shadow-sm uppercase">Save</button>
                 </div>
               </div>
             </div>
          </div>

          <div class="bg-blue-50 p-5 rounded-lg border border-blue-100 h-max">
            <h3 class="font-bold text-blue-900 mb-2">Quick Add Players</h3>
            <p class="text-xs text-blue-700 mb-4 leading-relaxed">Paste a list of player names below, one per line. They will be appended to the current roster.</p>
            <textarea 
              v-model="bulkNames" 
              rows="6" 
              class="w-full border border-blue-200 p-3 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-400 bg-white" 
              placeholder="Lionel Messi&#10;Cristiano Ronaldo&#10;Neymar Jr..."
            ></textarea>
            <button 
              @click="addPlayers" 
              :disabled="!bulkNames.trim()"
              class="mt-3 w-full bg-blue-600 text-white px-4 py-2.5 rounded-md font-medium hover:bg-blue-700 transition disabled:opacity-50 shadow-sm"
            >
              Add to Team
            </button>
          </div>
        </div>

        <!-- Right: Roster List -->
        <div class="flex-1">
          <h3 class="font-bold text-gray-700 mb-4 border-b border-gray-100 pb-2">Current Players</h3>
          <div v-if="team.players.length === 0" class="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
            No players on this team yet. Use the quick add box to paste some names.
          </div>
          <ul v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <li 
              v-for="player in team.players" 
              :key="player.id" 
              class="flex justify-between items-center border border-gray-200 p-3 rounded-md group cursor-default shadow-sm hover:border-blue-400 hover:shadow-md transition bg-white"
            >
              <span class="font-medium text-gray-700">{{ player.name }}</span>
              <button 
                @click="store.removePlayerFromTeam(team.id, player.id)" 
                class="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition md:opacity-0 group-hover:opacity-100"
                title="Remove Player"
              >
                <Trash2 class="w-4 h-4"/>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div v-else class="p-8 text-center text-gray-500 bg-white rounded-xl border border-gray-200 shadow-sm">
      Team not found. <router-link to="/" class="text-blue-500 underline ml-2">Go Home</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAppStore } from '../stores/appState';
import { Trash2 } from 'lucide-vue-next';
import * as LucideIcons from 'lucide-vue-next';

const route = useRoute();
const store = useAppStore();

const teamId = route.params.id as string;
const team = computed(() => store.getTeam(teamId));

const bulkNames = ref('');
const icons = ['Shield', 'ShieldHalf', 'Zap', 'Flame', 'Star', 'Trophy', 'Swords', 'Crown'];
const colors = ['bg-blue-600', 'bg-red-600', 'bg-green-600', 'bg-yellow-500', 'bg-purple-600', 'bg-orange-500', 'bg-slate-800', 'bg-teal-600'];
const showCustomUrl = ref(false);
const customUrlInput = ref('');

watch(team, (val) => {
  if (val && isCustomIcon(val.icon)) {
    customUrlInput.value = val.icon;
  }
}, { immediate: true });

function isCustomIcon(icon: string | undefined): boolean {
  if (!icon) return false;
  return icon.startsWith('http') || icon.startsWith('data:');
}

function updateIcon(iconPath: string) {
  if (teamId) {
    store.updateTeamIcon(teamId, iconPath);
  }
}

function updateName(name: string) {
  if (teamId && name.trim()) {
    store.updateTeamName(teamId, name.trim());
  }
}

function updateColor(color: string) {
  if (teamId) {
    store.updateTeamColor(teamId, color);
  }
}

function saveCustomIcon() {
  if (teamId && customUrlInput.value.trim()) {
    store.updateTeamIcon(teamId, customUrlInput.value.trim());
    showCustomUrl.value = false;
  }
}

function addPlayers() {
  if (bulkNames.value.trim() && teamId) {
    const names = bulkNames.value.split('\n');
    store.appendPlayersToTeam(teamId, names);
    bulkNames.value = '';
  }
}
</script>
