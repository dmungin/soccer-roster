<template>
  <div class="p-4 sm:p-8 max-w-6xl mx-auto print-hide w-full overflow-y-auto">
    <!-- Header Splash -->
    <div class="flex flex-col items-center justify-center py-8 mb-6 mt-4">
      <svg class="w-16 h-16 text-blue-600 mb-4 stroke-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="3" width="20" height="18" rx="2" ry="2"/>
        <line x1="12" y1="3" x2="12" y2="21"/>
        <circle cx="12" cy="12" r="3"/>
        <path d="M2 8h3v8H2"/>
        <path d="M22 8h-3v8h3"/>
      </svg>
      <h1 class="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight text-center">Soccer Roster</h1>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      <!-- Teams -->
      <section class="bg-white p-6 rounded-lg shadow-sm border border-gray-200 block">
        <h2 class="text-2xl font-bold mb-4 flex items-center"><Users class="mr-2 w-6 h-6 text-blue-600" /> Teams</h2>
        
        <div class="bg-gray-50 border border-gray-200 p-5 rounded-lg mb-6 space-y-4 shadow-inner">
          <label class="text-sm font-extrabold text-gray-800 uppercase tracking-wider block">Create New Team</label>
          <input v-model="newTeamName" placeholder="Team Name..." class="border border-gray-300 rounded px-3 py-2 w-full outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-400" />

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="text-[11px] font-bold uppercase text-gray-500 mb-2 block">Team Color</label>
              <div class="flex flex-wrap gap-2">
                <button v-for="c in colors" :key="c" @click="selectedColor = c" :class="[c, 'w-6 h-6 rounded-full cursor-pointer border-2 transition', selectedColor === c ? 'border-gray-800 scale-110 shadow-sm' : 'border-transparent']" :title="c"></button>
              </div>
            </div>
            <div>
              <label class="text-[11px] font-bold uppercase text-gray-500 mb-2 block">Mascot Icon</label>
               <div class="flex flex-col gap-2">
                 <div class="flex flex-wrap gap-1">
                  <button v-for="i in icons" :key="i" @click="selectedIcon = i" :class="['w-7 h-7 rounded flex items-center justify-center cursor-pointer transition', selectedIcon === i ? 'bg-gray-300 shadow-inner' : 'hover:bg-gray-200']" :title="i">
                    <component :is="(LucideIcons as any)[i]" class="w-4 h-4 text-gray-800"/>
                  </button>
                  <button @click="selectedIcon = 'custom'" :class="['w-7 h-7 rounded flex items-center justify-center cursor-pointer transition text-[9px] font-black text-gray-800 uppercase', selectedIcon === 'custom' ? 'bg-gray-300 shadow-inner' : 'hover:bg-gray-200']" title="Custom URL">URL</button>
                 </div>
                 <input v-if="selectedIcon === 'custom'" v-model="customIconUrl" placeholder="Image URL (http://...)" class="border border-gray-300 rounded px-2 py-1.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-400 text-xs w-full" />
               </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
             <div class="flex flex-col">
               <label class="text-[11px] font-bold uppercase text-gray-500 mb-1">Match Type</label>
               <select v-model="selectedMatchType" @change="onMatchTypeChange" class="border border-gray-300 rounded px-2 py-1.5 text-sm bg-white outline-none focus:border-blue-500">
                  <option value="11v11">11 v 11</option>
                  <option value="9v9">9 v 9</option>
                  <option value="7v7">7 v 7</option>
               </select>
             </div>
             <div class="flex flex-col">
               <label class="text-[11px] font-bold uppercase text-gray-500 mb-1">Default Formation</label>
               <select v-model="selectedDefaultFormationId" class="border border-gray-300 rounded px-2 py-1.5 text-sm bg-white outline-none focus:border-blue-500">
                  <option v-for="f in getFormationsForType(selectedMatchType)" :key="f.id" :value="f.id">{{ f.name }}</option>
               </select>
             </div>
          </div>
          
          <button @click="createTeam" :disabled="!newTeamName.trim()" class="bg-blue-600 w-full text-white px-4 py-2 mt-2 rounded font-bold hover:bg-blue-700 disabled:opacity-50 transition shadow-sm text-sm">Create Team</button>
        </div>

        <ul class="space-y-2">
          <li v-if="store.teams.length === 0" class="text-gray-400 text-sm py-8 text-center italic border-2 border-dashed rounded-lg">No teams created.</li>
          <li v-for="team in store.teams" :key="team.id" class="flex justify-between items-center p-3 hover:bg-gray-50 border rounded-lg transition duration-150 shadow-sm bg-white">
            <div class="flex items-center space-x-4">
              <div :class="[team.color, 'w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0 shadow-inner overflow-hidden']">
                 <img v-if="isCustomIcon(team.icon)" :src="team.icon" class="w-8 h-8 object-contain" />
                 <component v-else :is="(LucideIcons as any)[team.icon]" class="w-5 h-5"/>
              </div>
              <div class="flex flex-col">
                <span class="font-bold text-gray-800 text-lg leading-tight">{{ team.name }}</span>
                <span class="text-[11px] font-medium text-gray-500 uppercase tracking-wide">{{ team.players.length }} players • {{ team.matchType }}</span>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <router-link :to="`/team/${team.id}`" class="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded border border-transparent hover:border-blue-100 text-sm font-medium transition">Roster</router-link>
              <button @click="store.deleteTeam(team.id)" class="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded transition" title="Delete Team"><Trash2 class="w-4 h-4"/></button>
            </div>
          </li>
        </ul>
      </section>

      <!-- Games -->
      <section class="bg-white p-6 rounded-lg shadow-sm border border-gray-200 block">
        <h2 class="text-2xl font-bold mb-4 flex items-center"><Calendar class="mr-2 w-6 h-6 text-blue-600" /> Scheduled Games</h2>
        <div class="flex flex-col space-y-3 mb-6 bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-inner">
          <label class="text-sm font-extrabold text-gray-800 uppercase tracking-wider block">Create New Game</label>
          <input v-model="newGameName" placeholder="Game Name/Opponent (e.g. vs Milford)" class="border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-400" />
          <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <input v-model="newGameDate" type="date" class="border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-500" />
            <select v-model="newGameTeamId" class="border border-gray-300 rounded px-3 py-2 flex-1 text-sm outline-none focus:border-blue-500 bg-white">
              <option disabled value="">Select Home Team...</option>
              <option v-for="team in store.teams" :key="team.id" :value="team.id">{{ team.name }} ({{ team.matchType }})</option>
            </select>
          </div>
          <button @click="createGame" class="bg-blue-600 text-white w-full px-4 py-2 rounded font-bold hover:bg-blue-700 disabled:opacity-50 transition text-sm shadow-sm" :disabled="!newGameTeamId || !newGameName.trim()">Schedule Game</button>
        </div>
        
        <ul class="space-y-2">
          <li v-if="store.games.length === 0" class="text-gray-400 text-sm py-8 text-center italic border-2 border-dashed rounded-lg">No games created.</li>
          <li v-for="game in store.games" :key="game.id" class="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 hover:bg-gray-50 border rounded-lg transition duration-150 shadow-sm bg-white space-y-3 sm:space-y-0">
            <div>
              <div class="font-bold text-gray-800 flex items-center text-lg leading-tight">{{ game.name }} <span v-if="game.date" class="bg-gray-100 text-gray-500 text-[10px] uppercase font-bold px-2 py-0.5 rounded ml-2">{{ formatDate(game.date) }}</span></div>
               <div class="text-[11px] font-medium text-gray-500 uppercase tracking-wide mt-1 flex items-center">
                  <img v-if="isCustomIcon(store.getTeam(game.teamId)?.icon)" :src="store.getTeam(game.teamId)?.icon" class="w-3 h-3 mr-1 object-contain" />
                  <component v-else :is="(LucideIcons as any)[store.getTeam(game.teamId)?.icon || 'Shield']" class="w-3 h-3 mr-1" />
                  {{ store.getTeam(game.teamId)?.name || 'Unknown Team' }} • {{ game.lineups.length }} lineups
               </div>
            </div>
            <div class="flex items-center space-x-2 w-full sm:w-auto">
              <router-link :to="`/game/${game.id}`" class="bg-blue-50 flex-1 sm:flex-none text-center text-blue-700 border border-blue-200 hover:bg-blue-100 font-bold px-4 py-2 rounded text-sm transition shadow-sm">Open Game</router-link>
              <button @click="store.deleteGame(game.id)" class="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded transition" title="Delete Game"><Trash2 class="w-4 h-4"/></button>
            </div>
          </li>
        </ul>
      </section>
    </div>

    <!-- Custom Formations Card -->
    <div class="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
       <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-3 sm:space-y-0 border-b border-gray-100 pb-4">
          <h2 class="text-2xl font-bold flex items-center text-gray-800"><component :is="LucideIcons.LayoutGrid" class="mr-2 w-6 h-6 text-blue-600" /> Custom Formations</h2>
          <router-link to="/builder" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow-sm transition flex items-center gap-2 text-sm uppercase tracking-wide">
             <component :is="LucideIcons.Plus" class="w-4 h-4"/> Create Formation
          </router-link>
       </div>
       
       <ul class="space-y-3">
          <li v-if="store.customFormations.length === 0" class="text-gray-400 text-sm py-8 text-center italic border-2 border-dashed rounded-lg bg-gray-50">No custom formations created.</li>
          <li v-for="formation in store.customFormations" :key="formation.id" class="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 hover:bg-gray-50 border rounded-lg transition duration-150 shadow-sm bg-white space-y-3 sm:space-y-0">
            <div>
               <div class="font-bold text-gray-800 flex items-center text-lg leading-tight">{{ formation.name }}</div>
               <div class="text-[11px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                  {{ formation.type }} &bull; {{ formation.positions.length }} positions
               </div>
            </div>
            <div class="flex items-center space-x-2 w-full sm:w-auto">
               <button @click="previewFormation(formation)" class="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-bold px-4 py-2 rounded text-sm transition shadow-sm flex-1 sm:flex-none">Preview</button>
               <button @click="deleteFormation(formation.id)" class="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded transition" title="Delete Formation"><Trash2 class="w-4 h-4"/></button>
            </div>
          </li>
       </ul>
    </div>

    <!-- Preview Modal -->
    <div v-if="previewNode" class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" @click.self="previewNode = null">
      <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg flex flex-col max-h-[90vh]">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-black text-gray-800 tracking-tight">{{ previewNode.name }} <span class="bg-gray-100 text-gray-500 text-[10px] uppercase font-bold px-2 py-0.5 rounded ml-2 align-middle">{{ previewNode.type }}</span></h2>
          <button @click="previewNode = null" class="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition" aria-label="Close Preview"><component :is="LucideIcons.X" class="w-5 h-5"/></button>
        </div>
        <div class="flex-1 overflow-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl p-4 sm:p-8 flex items-center justify-center relative">
            <div class="w-full max-w-[400px] aspect-[3/4] relative bg-[#2a8b3e] rounded-xl border-[6px] border-white shadow-[0_10px_30px_rgba(0,0,0,0.15)] overflow-hidden">
                <div class="absolute inset-0 pattern-grass"></div>
                <div class="absolute inset-0 m-4 border-2 border-white/60 pointer-events-none rounded-[1px]"></div>
                <div class="absolute top-1/2 left-4 right-4 border-t-2 border-white/60 pointer-events-none"></div>
                <div class="absolute top-1/2 left-1/2 w-32 h-32 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/60 pointer-events-none"></div>
                <div class="absolute top-1/2 left-1/2 w-2.5 h-2.5 -translate-x-1/2 -translate-y-1/2 bg-white/60 rounded-full pointer-events-none"></div>

                <div class="absolute top-4 left-1/2 w-48 h-24 -translate-x-1/2 border-2 border-t-0 border-white/60 pointer-events-none"></div>
                <div class="absolute top-4 left-1/2 w-20 h-10 -translate-x-1/2 border-2 border-t-0 border-white/60 pointer-events-none"></div>
                
                <div class="absolute bottom-4 left-1/2 w-48 h-24 -translate-x-1/2 border-2 border-b-0 border-white/60 pointer-events-none"></div>
                <div class="absolute bottom-4 left-1/2 w-20 h-10 -translate-x-1/2 border-2 border-b-0 border-white/60 pointer-events-none"></div>
                
                <div 
                  v-for="p in previewNode.positions" 
                  :key="p.id"
                  class="absolute w-8 h-8 sm:w-10 sm:h-10 -translate-x-1/2 -translate-y-1/2 rounded-full flex flex-col items-center justify-center border-2 border-white/80 shadow-[0_4px_15px_rgba(0,0,0,0.4)] bg-black/60"
                  :style="{ left: `${p.x}%`, top: `${p.y}%` }"
                >
                  <span class="text-white font-bold text-[9px] sm:text-[10.5px] select-none tracking-widest">{{ p.label }}</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAppStore } from '../stores/appState';
import { Users, Calendar, Trash2 } from 'lucide-vue-next';
import * as LucideIcons from 'lucide-vue-next';
import { FORMATIONS } from '../utils/formations';
import { formatDate } from '../utils/date';
import type { FormationType } from '../types';

const store = useAppStore();

const newTeamName = ref('');
const newGameName = ref('');
const newGameDate = ref('');
const newGameTeamId = ref('');

// Customization options
const colors = ['bg-blue-600', 'bg-red-600', 'bg-green-600', 'bg-yellow-500', 'bg-purple-600', 'bg-orange-500', 'bg-slate-800', 'bg-teal-600'];
const icons = ['Shield', 'ShieldHalf', 'Zap', 'Flame', 'Star', 'Trophy', 'Swords', 'Crown'];
const selectedColor = ref(colors[0]);
const selectedIcon = ref(icons[0]);
const customIconUrl = ref('');
const selectedMatchType = ref<FormationType>('11v11');
const selectedDefaultFormationId = ref('11v11-4-3-3');
const previewNode = ref<Formation | null>(null);

function previewFormation(f: Formation) {
  previewNode.value = f;
}

async function deleteFormation(id: string) {
  if (confirm('Are you sure you want to delete this custom formation?')) {
    await store.deleteCustomFormation(id);
  }
}

function isCustomIcon(icon: string | undefined): boolean {
  if (!icon) return false;
  return icon.startsWith('http') || icon.startsWith('data:');
}

function getFormationsForType(type: FormationType) {
  const defaults = FORMATIONS.filter(f => f.type === type);
  const customs = store.customFormations.filter(f => f.type === type);
  return [...defaults, ...customs];
}

function onMatchTypeChange() {
  const forms = getFormationsForType(selectedMatchType.value);
  if (forms.length > 0) {
    selectedDefaultFormationId.value = forms[0].id;
  }
}

async function createTeam() {
  if (newTeamName.value.trim()) {
    const finalIcon = selectedIcon.value === 'custom' && customIconUrl.value.trim() 
      ? customIconUrl.value.trim() 
      : (selectedIcon.value === 'custom' ? 'Shield' : selectedIcon.value);

    await store.addTeam(newTeamName.value.trim(), selectedColor.value, finalIcon, selectedMatchType.value, selectedDefaultFormationId.value);
    
    newTeamName.value = '';
    customIconUrl.value = '';
    selectedColor.value = colors[0];
    selectedIcon.value = icons[0];
    selectedMatchType.value = '11v11';
    onMatchTypeChange();
  }
}

async function createGame() {
  if (newGameName.value.trim() && newGameTeamId.value) {
    await store.addGame(newGameName.value.trim(), newGameTeamId.value, newGameDate.value);
    newGameName.value = '';
    newGameDate.value = '';
  }
}
</script>

<style scoped>
.pattern-grass {
  background-image: repeating-linear-gradient(0deg, transparent, transparent 10%, rgba(255,255,255,0.06) 10%, rgba(255,255,255,0.06) 20%);
}
</style>
