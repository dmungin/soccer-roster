<template>
  <!-- Outer container: no overflow-hidden so GK and edge players aren't chopped -->
  <div 
    class="w-full relative select-none aspect-[3/4] print:aspect-[4/5]"
    @dragover.prevent="onFieldDragOver"
    @drop="onFieldDrop"
    @click="$emit('clear-selection')"
  >
    
    <!-- Field Graphic with overflow hidden for pitch lines -->
    <div class="absolute inset-0 bg-green-600 print:!bg-transparent rounded-none border-[3px] border-white shadow-inner print:border-none print:shadow-none bg-cover overflow-hidden pointer-events-none">
      <!-- Grass background strips -->
      <div class="absolute inset-0 pattern-grass print:hidden"></div>
      
      <!-- Field markings -->
      <div class="absolute inset-0 m-2 sm:m-3 border-[1.5px] sm:border-2 border-white/50 print:border-gray-300 print:border-[1px] print:m-1"></div>
      <div class="absolute top-1/2 left-2 print:left-1 right-2 print:right-1 border-t-[1.5px] sm:border-t-2 border-white/50 print:border-gray-300 print:border-t-[1px]"></div>
      <div class="absolute top-1/2 left-1/2 w-20 h-20 sm:w-28 sm:h-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] sm:border-2 border-white/50 print:hidden"></div>
      <!-- Center spot -->
      <div class="absolute top-1/2 left-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 -translate-x-1/2 -translate-y-1/2 bg-white/50 rounded-full print:hidden"></div>

      <!-- Penalty Box Top -->
      <div class="absolute top-2 print:top-1 left-1/2 w-28 h-12 sm:top-3 sm:w-36 sm:h-16 -translate-x-1/2 border-[1.5px] sm:border-2 border-t-0 border-white/50 print:hidden"></div>
      <div class="absolute top-2 print:top-1 left-1/2 w-12 h-6 sm:top-3 sm:w-16 sm:h-8 -translate-x-1/2 border-[1.5px] sm:border-2 border-t-0 border-white/50 print:border-gray-300 print:border-t-0 print:border-[1px]"></div>
      
      <!-- Penalty Box Bottom -->
      <div class="absolute bottom-2 print:bottom-1 left-1/2 w-28 h-12 sm:bottom-3 sm:w-36 sm:h-16 -translate-x-1/2 border-[1.5px] sm:border-2 border-b-0 border-white/50 print:hidden"></div>
      <div class="absolute bottom-2 print:bottom-1 left-1/2 w-12 h-6 sm:bottom-3 sm:w-16 sm:h-8 -translate-x-1/2 border-[1.5px] sm:border-2 border-b-0 border-white/50 print:border-gray-300 print:border-b-0 print:border-[1px]"></div>
    </div>
    
    <!-- Nodes overlay -->
    <PositionNode 
      v-for="pos in lineup.positions" 
      :key="pos.id"
      :position="pos"
      :player="getPlayer(pos.playerId)"
      :is-duplicate="isDuplicate(pos.playerId)"
      :selected-player-id="selectedPlayerId"
      @assign="handleAssign(pos.id, $event)"
      @unassign="handleAssign(pos.id, null)"
      @select-player="$emit('select-player', $event)"
      @clear-selection="$emit('clear-selection')"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAppStore } from '../stores/appState';
import PositionNode from './PositionNode.vue';
import type { Lineup } from '../types';

const props = defineProps<{ 
  gameId: string, 
  lineup: Lineup,
  selectedPlayerId: string | null 
}>();

const emit = defineEmits<{
  (e: 'select-player', playerId: string): void;
  (e: 'clear-selection'): void;
}>();
const store = useAppStore();

const teamPlayers = computed(() => {
  const game = store.getGame(props.gameId);
  if (!game) return [];
  const team = store.getTeam(game.teamId);
  return team ? team.players : [];
});

function getPlayer(id: string | null) {
  if (!id) return null;
  return teamPlayers.value.find(p => p.id === id) || null;
}

function isDuplicate(playerId: string | null) {
  if (!playerId) return false;
  const count = props.lineup.positions.filter(p => p.playerId === playerId).length;
  return count > 1;
}

function handleAssign(positionId: string, playerId: string | null) {
  store.assignPlayerToPosition(props.gameId, props.lineup.id, positionId, playerId);
}

function onFieldDragOver(e: DragEvent) {
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move';
  }
}

function onFieldDrop(e: DragEvent) {
  try {
    const dataStr = e.dataTransfer?.getData('application/json');
    if (!dataStr) return;
    const data = JSON.parse(dataStr);
    
    if (data.source === 'position_node' && data.positionId) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
      
      store.updatePositionLocation(props.gameId, props.lineup.id, data.positionId, Math.round(x*10)/10, Math.round(y*10)/10);
    }
  } catch(err) {}
}
</script>

<style scoped>
.pattern-grass {
  background-image: repeating-linear-gradient(0deg, transparent, transparent 10%, rgba(255,255,255,0.04) 10%, rgba(255,255,255,0.04) 20%);
}
</style>
