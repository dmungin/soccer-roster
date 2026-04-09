<template>
  <div v-if="game && team" class="flex flex-col w-full h-full bg-white relative print:h-auto print:min-h-[100vh] print:overflow-visible">
    
    <!-- Print Header -->
    <div class="hidden print:hidden flex-col mb-1.5 items-center">
       <h1 class="text-lg font-black text-black tracking-tight uppercase">{{ game.name }} Game Plan</h1>
       <p class="text-[10px] border-b border-gray-300 pb-1 mb-1.5 w-full text-center font-bold text-gray-500">{{ team.name }} • {{ team.matchType }} <span v-if="game.date">| {{ formatDate(game.date) }}</span></p>
    </div>

    <!-- Dynamic Team Header -->
    <div :class="['px-6 py-5 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 shrink-0 z-20 relative shadow-md print:hidden', team.color]">
      <div class="flex items-center space-x-4">
        <div class="bg-white/20 p-1.5 rounded-xl backdrop-blur-sm border border-white/30 hidden sm:flex items-center justify-center w-14 h-14 shadow-inner overflow-hidden">
           <img v-if="isCustomIcon(team.icon)" :src="team.icon" class="w-12 h-12 object-contain" />
           <component v-else :is="(LucideIcons as any)[team.icon]" class="w-10 h-10 text-white"/>
        </div>
        <div>
          <h2 class="text-2xl font-black text-white flex items-center tracking-tight">
            {{ game.name }} 
            <span v-if="game.date" class="text-white/80 font-bold text-xs ml-3 bg-black/20 px-2 py-1 rounded-md border border-white/10 uppercase tracking-widest">{{ formatDate(game.date) }}</span>
          </h2>
          <p class="text-sm font-bold text-white/80 mt-1 capitalize tracking-wide flex items-center">
             <img v-if="isCustomIcon(team.icon)" :src="team.icon" class="w-3 h-3 mr-1.5 sm:hidden object-contain" />
             <component v-else :is="(LucideIcons as any)[team.icon]" class="w-3 h-3 mr-1.5 sm:hidden"/> {{ team.name }} • {{ team.matchType }}
          </p>
        </div>
      </div>
      <div class="flex space-x-3 w-full md:w-auto">
        <router-link to="/" class="flex items-center justify-center bg-white/10 hover:bg-white/20 text-white px-3 py-2 border border-white/20 rounded-md transition shadow-sm backdrop-blur-sm" title="Back to Dashboard">
          <ArrowLeft class="w-5 h-5"/>
        </router-link>
        <button @click="triggerPrint" class="bg-white text-gray-900 px-4 py-2 rounded-md font-bold text-sm flex justify-center items-center hover:bg-gray-100 transition shadow-sm flex-1 md:flex-none"><Printer class="w-4 h-4 mr-2"/> Print</button>
      </div>
    </div>
    
    <div class="flex flex-1 overflow-hidden flex-col xl:flex-row relative print:flex-col print:items-stretch print:gap-0 print:overflow-visible">
      <!-- Left side: Summary Table -->
      <div class="xl:w-[400px] 2xl:w-[480px] xl:border-r border-gray-200 flex flex-col p-5 bg-gray-50 overflow-y-auto shrink-0 shadow-[2px_0_10px_-5px_rgba(0,0,0,0.08)] xl:shadow-none z-10 border-b xl:border-b-0 max-h-[45vh] xl:max-h-none print:w-full print:flex-row print:items-center print:border-none print:shadow-none print:bg-transparent print:p-0 print:mb-0 print:overflow-visible print:flex print:max-h-none print:gap-4 print:max-w-[95%] print:mx-auto">
        
        <!-- NEW PRINT-ONLY HEADER SIDE-BY-SIDE WITH TABLE -->
        <div class="hidden print:flex flex-col w-[20%] shrink-0 pr-2 justify-center border-r print:border-gray-400">
           <h1 class="text-xl font-black text-black tracking-tight uppercase leading-none print:mb-1 print:text-sm">{{ game.name }}</h1>
           <p class="text-xs font-bold text-gray-800 uppercase print:text-[7px]">{{ team.name }}</p>
           <p class="text-[10px] font-bold text-gray-600 mt-0.5 print:text-[6px]" v-if="game.date">{{ formatDate(game.date) }}</p>
        </div>
        
        <div class="mb-5 bg-white p-5 rounded-xl border border-gray-200 shadow-sm print:hidden">
          <label class="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 block">Create Lineup</label>
          <div class="flex flex-col gap-3">
            <input v-model="newLineupName" placeholder="Lineup Name (e.g. Q1, H1)" class="border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm font-medium" />
            <div class="flex gap-2">
              <select v-model="selectedFormationId" class="border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm bg-white font-medium flex-1 min-w-0">
                <option v-for="f in availableFormations" :key="f.id" :value="f.id">{{ f.name }}</option>
              </select>
              <button @click="createLineup" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold disabled:opacity-50 transition shadow-sm text-sm shrink-0 uppercase tracking-wide" :disabled="!newLineupName.trim()">Add Lineup</button>
            </div>
             <p v-if="availableFormations.length === 0" class="text-xs text-red-500 mt-1">No formations available for {{ team.matchType }}.</p>
          </div>
        </div>

        <div v-if="teamOtherGames.length > 0" class="mb-5 bg-white p-5 rounded-xl border border-gray-200 shadow-sm print:hidden">
          <label class="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 block">Copy From Another Game</label>
          <div class="flex gap-2">
            <select v-model="selectedGameToCopyId" class="border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm bg-white font-medium flex-1 min-w-0">
              <option disabled value="">Select previous game...</option>
              <option v-for="g in teamOtherGames" :key="g.id" :value="g.id">{{ g.name }} {{ g.date ? '(' + formatDate(g.date) + ')' : '' }}</option>
            </select>
            <button @click="copyFromGame" class="bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 px-4 py-2 rounded-lg font-bold disabled:opacity-50 transition shadow-sm text-sm shrink-0 uppercase tracking-wide flex items-center" :disabled="!selectedGameToCopyId" title="Copy All Field Grids">
               <Copy class="w-4 h-4 sm:mr-1"/> <span class="hidden sm:inline">Copy All</span>
            </button>
          </div>
        </div>

        <div class="flex justify-between items-end mb-2.5 print:hidden">
          <h3 class="font-black text-gray-800 uppercase tracking-widest text-xs">Game Roster & Playing Time</h3>
        </div>
        <!-- SCREEN VIEW: Expandable List -->
        <div class="flex-1 overflow-y-auto space-y-2 print:hidden pr-1 pb-4">
          <div v-for="p in team.players" :key="p.id" class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col group transition" draggable="true" @dragstart="onDragStart($event, p)">
            <!-- Header (Collapsed) -->
            <div class="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition" @click="toggleExpandedPlayer(p.id)">
              <div class="flex items-center space-x-3">
                <GripVertical class="w-4 h-4 text-gray-300 group-hover:text-gray-500 cursor-grab active:cursor-grabbing" title="Drag to field"/>
                <span class="font-bold text-gray-800" :title="p.name">{{ p.name }}</span>
              </div>
              <div class="flex items-center space-x-4">
                <div class="w-[50px] text-right">
                  <span class="font-black text-sm" :class="[getPlayPercentage(p.id) > 65 ? 'text-blue-600' : getPlayPercentage(p.id) > 30 ? 'text-indigo-700' : 'text-orange-500']">{{ getPlayPercentage(p.id) }}%</span>
                </div>
                <ChevronDown class="w-4 h-4 text-gray-400 transition-transform duration-200" :class="{ 'rotate-180': expandedPlayers.includes(p.id) }" />
              </div>
            </div>
            
            <!-- Body (Expanded) -->
            <div v-if="expandedPlayers.includes(p.id)" class="border-t border-gray-100 bg-gray-50/50 p-4">
              <div v-if="game.lineups.length > 0" class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div v-for="(l, i) in game.lineups" :key="l.id" class="flex items-center justify-between bg-white px-2 py-1.5 rounded-lg border border-gray-200 shadow-sm text-xs">
                  <span class="font-bold text-gray-600 truncate mr-2 text-[10px]" :title="l.name">{{ i + 1 }}. {{ l.name }}</span>
                  <span class="font-black px-1.5 py-0.5 rounded text-[9px]" :class="getPlayerPositionLabel(p.id, l) ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'">
                    {{ getPlayerPositionLabel(p.id, l) || 'Bench' }}
                  </span>
                </div>
              </div>
              <p v-else class="text-xs text-gray-400 font-medium italic text-center">No lineups added.</p>
            </div>
          </div>
          
          <div v-if="team.players.length === 0" class="p-8 text-center text-gray-400 italic font-medium bg-white rounded-xl border border-gray-200 shadow-sm">
            Roster is empty. Manage team roster to add players.
          </div>
        </div>

        <!-- PRINT VIEW: Roster Table -->
        <div class="hidden print:block w-full border-[0.5px] border-gray-800 bg-white mb-2 shadow-none overflow-visible">
          <table class="w-full text-left relative min-w-full text-[6px] leading-none">
            <thead class="text-black text-[7px] uppercase font-black border-b-[0.5px] border-gray-800">
              <tr>
                <th class="px-1.5 py-0.5 border-r-[0.5px] border-gray-400 text-black w-8 text-center shrink-0">#</th>
                <th v-for="p in team.players" :key="p.id" class="px-0.5 py-0.5 text-center border-r-[0.5px] border-gray-400 min-w-0 text-black truncate max-w-[50px] text-[7px]" :title="p.name">{{ p.name }}</th>
              </tr>
            </thead>
            <tbody class="divide-y-[0.5px] divide-gray-400 font-medium text-black">
              <tr v-for="(l, i) in game.lineups" :key="l.id">
                <td class="px-1.5 py-[1px] border-r-[0.5px] border-gray-400 font-bold text-center text-[7px] bg-gray-50/10" :title="l.name">{{ i + 1 }}</td>
                <td v-for="p in team.players" :key="p.id" class="px-0.5 py-[1px] text-center border-r-[0.5px] border-gray-400">
                   <div v-if="getPlayerPositionLabel(p.id, l)" class="font-bold text-[7px] text-black leading-none uppercase">
                      {{ getPlayerPositionLabel(p.id, l) }}
                   </div>
                </td>
              </tr>
              <tr v-if="game.lineups.length === 0">
                <td colspan="100%" class="px-4 py-2 text-center text-gray-500 italic font-medium text-[6px]">No lineups added.</td>
              </tr>
              <!-- Play Percentage Row -->
              <tr v-if="team.players.length > 0" class="border-t-[0.5px] border-gray-800 bg-gray-50/30">
                <td class="px-1.5 py-[1px] border-r-[0.5px] border-gray-400 font-black text-center text-[7px]">Play %</td>
                <td v-for="p in team.players" :key="p.id" class="px-0.5 py-[1px] text-center border-r-[0.5px] border-gray-400 font-black text-[8px]">
                  {{ getPlayPercentage(p.id) }}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Right Side: Field Grids -->
      <div class="flex-1 overflow-y-auto bg-gray-200/40 p-6 relative flex flex-col print:p-0 print:bg-transparent print:overflow-visible print:block print:h-auto print:min-h-0 print:w-full print:max-w-[95%] print:mx-auto print:mt-0">        
        <div v-if="game.lineups.length === 0" class="flex-1 flex flex-col items-center justify-center text-gray-400 text-sm font-bold border-2 border-dashed border-gray-300 rounded-3xl bg-white bg-opacity-60 m-4 py-16 shadow-sm print:hidden">
          <img v-if="isCustomIcon(team.icon)" :src="team.icon" class="mb-4 opacity-30 w-16 h-16 object-contain" />
           <component v-else :is="(LucideIcons as any)[team.icon]" class="mb-4 opacity-30 w-16 h-16 text-gray-400" />
          No lineups added yet.<br>Create one using the {{ team.matchType }} form on the left.
        </div>
        
        <!-- Multi-Field Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-6 items-start pb-12 print:grid-cols-4 print:gap-1 print:pb-0">
          <div v-for="lineup in game.lineups" :key="lineup.id" class="flex flex-col print:break-inside-avoid">
            <div class="flex justify-between items-center px-0.5 mb-1 print:mb-0 print:px-2 print:translate-y-3.5 print:translate-x-0 relative z-10 print:h-1">
              <div class="flex items-center">
                <input
                  v-model="lineup.name"
                  @blur="store.updateLineupName(game.id, lineup.id, lineup.name)"
                  @keyup.enter="($event.target as HTMLInputElement).blur()"
                  class="font-bold text-gray-800 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none w-[100px] transition text-sm selection:bg-blue-200 print:text-black print:border-none print:w-auto print:text-[6px] print:p-0 print:h-auto print:leading-none"
                  title="Edit Lineup Name"
                />
              </div>
              <div class="flex space-x-0.5 opacity-50 focus-within:opacity-100 hover:opacity-100 transition-opacity print:hidden">
                <button @click="store.copyLineupInGame(game.id, lineup.id)" class="text-blue-600 hover:bg-blue-100 p-1 rounded transition" title="Duplicate Field Grid"><Copy class="w-3.5 h-3.5"/></button>
                <button @click="store.deleteLineup(game.id, lineup.id)" class="text-red-500 hover:bg-red-100 p-1 rounded transition" title="Delete Field Grid"><Trash2 class="w-3.5 h-3.5"/></button>
              </div>
            </div>
            <div class="w-full">
               <FieldView :gameId="game.id" :lineup="lineup" />
            </div>

            <!-- Bench Players -->
            <div class="mt-3 flex flex-col bg-white rounded-lg p-2 print:p-0 print:mt-0 print:ml-1 print:bg-transparent">
              <h4 class="text-[9px] font-black uppercase text-gray-400 mb-1.5 tracking-widest print:hidden">Bench</h4>
              <div class="flex flex-wrap gap-x-2.5 gap-y-2 print:gap-x-0.5 print:gap-y-0 print:whitespace-normal print:leading-[1.1]">
                <div v-for="(p, index) in getBenchPlayers(lineup)" :key="p.id" 
                     class="flex flex-col items-center group cursor-grab active:cursor-grabbing print:flex-row print:items-center print:inline-flex"
                     draggable="true" @dragstart="onDragStart($event, p)">
                   <!-- Screen: Badge -->
                   <div class="bg-gray-100 text-gray-500 rounded-full w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center font-bold text-[10px] sm:text-[11px] shadow-sm print:hidden ring-1 ring-black/5 group-hover:ring-blue-400 group-hover:bg-blue-50 group-hover:text-blue-700 transition">
                     BE
                   </div>
                   <!-- Text -->
                   <span class="text-[9px] sm:text-[10px] font-bold text-gray-500 mt-1 print:mt-0 print:text-[6px] print:text-black group-hover:text-gray-800 transition">
                     {{ p.name }}<span v-if="index !== getBenchPlayers(lineup).length - 1" class="hidden print:inline mr-0.5">,</span>
                   </span>
                </div>
                <div v-if="getBenchPlayers(lineup).length === 0" class="text-[10px] font-bold text-gray-300 italic print:text-[6px] print:text-gray-400">None</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
  <div v-else class="h-full flex items-center justify-center bg-gray-50 flex-col space-y-4">
    <div class="p-10 text-center bg-white border border-gray-200 shadow-sm rounded-2xl text-gray-500 max-w-sm">
      <p class="text-lg font-bold mb-6 text-gray-800">Game data not found or missing team context.</p>
      <router-link to="/" class="bg-blue-600 w-full block text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-sm">Return to Dashboard</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue';
import { useRoute } from 'vue-router';
import { useAppStore } from '../stores/appState';
import { FORMATIONS } from '../utils/formations';
import { formatDate } from '../utils/date';
import type { Player, Lineup } from '../types';
import FieldView from '../components/FieldView.vue';
import { Trash2, Copy, Printer, GripVertical, ArrowLeft, ChevronDown } from 'lucide-vue-next';
import * as LucideIcons from 'lucide-vue-next';

const route = useRoute();
const store = useAppStore();

const gameId = route.params.id as string;
const game = computed(() => store.getGame(gameId));
const team = computed(() => game.value ? store.getTeam(game.value.teamId) : undefined);

const newLineupName = ref('');
const selectedFormationId = ref('');

const availableFormations = computed(() => {
  if (!team.value) return [];
  return FORMATIONS.filter(f => f.type === team.value!.matchType);
});

const teamOtherGames = computed(() => {
  if (!team.value || !game.value) return [];
  return store.games.filter(g => g.teamId === team.value!.id && g.id !== game.value!.id);
});

const selectedGameToCopyId = ref('');

async function copyFromGame() {
  if (!game.value || !selectedGameToCopyId.value) return;
  if (confirm('This will append all lineups from the selected game to this game. Do you want to proceed?')) {
    await store.copyLineupsFromGame(game.value.id, selectedGameToCopyId.value);
    selectedGameToCopyId.value = '';
  }
}

function isCustomIcon(icon: string | undefined): boolean {
  if (!icon) return false;
  return icon.startsWith('http') || icon.startsWith('data:');
}

// Auto-fill default formation
watchEffect(() => {
  if (team.value && !selectedFormationId.value) {
    selectedFormationId.value = team.value.defaultFormationId;
  }
});

function createLineup() {
  if (!game.value || !newLineupName.value.trim()) return;
  const formation = FORMATIONS.find(f => f.id === selectedFormationId.value);
  if (formation) {
    store.addLineupToGame(game.value.id, newLineupName.value.trim(), formation);
    newLineupName.value = '';
  }
}

const expandedPlayers = ref<string[]>([]);
function toggleExpandedPlayer(playerId: string) {
  const index = expandedPlayers.value.indexOf(playerId);
  if (index > -1) {
    expandedPlayers.value.splice(index, 1);
  } else {
    expandedPlayers.value.push(playerId);
  }
}

function getPlayerPositionLabel(playerId: string, lineup: Lineup) {
  const pos = lineup.positions.find(p => p.playerId === playerId);
  return pos ? pos.label : '';
}

function isActiveInLineup(playerId: string, lineup: Lineup) {
  return lineup.positions.some(p => p.playerId === playerId);
}

function getPlayPercentage(playerId: string) {
  if (!game.value || game.value.lineups.length === 0) return 0;
  let activeStarts = 0;
  game.value.lineups.forEach(l => {
    if (isActiveInLineup(playerId, l)) activeStarts++;
  });
  return Math.round((activeStarts / game.value.lineups.length) * 100);
}

function getBenchPlayers(lineup: Lineup) {
  if (!team.value) return [];
  return team.value.players.filter(p => !isActiveInLineup(p.id, lineup));
}

function onDragStart(event: DragEvent, player: Player) {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copyMove';
    event.dataTransfer.setData('application/json', JSON.stringify({ 
      source: 'roster_table', 
      playerId: player.id 
    }));

    // Create a circular drag ghost mimicking the field nodes
    const dragElement = document.createElement('div');
    dragElement.className = 'flex items-center justify-center font-bold shadow-md bg-white text-green-900 border border-gray-800 rounded-full';
    dragElement.style.width = '32px';
    dragElement.style.height = '32px';
    dragElement.style.fontSize = '12px';
    dragElement.style.position = 'absolute';
    dragElement.style.top = '-1000px';
    dragElement.style.left = '-1000px';
    dragElement.style.zIndex = '-9999';

    const parts = player.name.split(' ');
    dragElement.textContent = parts.length >= 2 
      ? (`${parts[0][0]}${parts[parts.length-1][0]}`).toUpperCase()
      : player.name.substring(0, 2).toUpperCase();

    document.body.appendChild(dragElement);
    
    // 16, 16 sets the mouse cursor to grip the exact center of the 32x32 circle!
    event.dataTransfer.setDragImage(dragElement, 16, 16);
    
    setTimeout(() => {
      if (document.body.contains(dragElement)) {
         document.body.removeChild(dragElement);
      }
    }, 0);
  }
}

function triggerPrint() {
  window.print();
}
</script>
