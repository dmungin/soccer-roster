<template>
  <div 
    class="absolute w-8 h-8 sm:w-10 sm:h-10 -translate-x-1/2 -translate-y-1/2 rounded-full flex flex-col items-center justify-center border-[1.5px] transition-all print:border-none print:shadow-none cursor-pointer"
    :style="{ left: `${position.x}%`, top: `${position.y}%` }"
    :class="[
       isHovered || (selectedPlayerId && !player) ? 'border-yellow-400 bg-white/30' : 'border-white/40 bg-black/30 print:!bg-transparent',
       isDuplicate ? 'ring-2 ring-red-500 shadow-[0_0_10px_rgba(239,68,68,1)] print:ring-red-500' : '',
       player ? 'border-white/80 bg-white/10 print:!bg-transparent print:border-none' : '',
       selectedPlayerId === player?.id ? 'ring-4 ring-blue-500 border-blue-500 z-50' : ''
    ]"
    @dragover.prevent="onDragOver"
    @dragenter.prevent="isHovered = true"
    @dragleave.prevent="isHovered = false"
    @drop.prevent="onDrop"
    @dragstart="onDragStart"
    @click.stop="handleClick"
    :draggable="true"
  >
    <div v-if="player" class="flex flex-col items-center justify-center w-full h-full relative group cursor-grab">
      <div class="bg-white text-green-900 print:bg-transparent print:text-black print:w-auto print:h-auto print:leading-none print:mb-[1px] rounded-full w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center font-bold text-[10px] sm:text-[11px] print:text-[9px] shadow-sm print:shadow-none">
        {{ position.label }}
      </div>
      <div class="absolute -bottom-5 sm:-bottom-6 print:relative print:bottom-auto w-max px-1.5 py-0.5 bg-black/90 print:!bg-transparent print:text-black print:font-bold text-white text-[10px] sm:text-xs print:text-[8px] rounded pointer-events-none truncate max-w-[100px] shadow-sm print:shadow-none print:p-0 mt-0.5">
        {{ player.name }}
      </div>
      <button 
        @click.stop="$emit('unassign')" 
        class="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition shadow print-hide hidden md:flex"
        title="Unassign"
      >
        <X class="w-3 h-3" />
      </button>
    </div>
    <div v-else class="text-white/60 print:text-black print:text-[9px] print:border-none rounded-full flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 font-bold text-[10px] sm:text-[11px] pointer-events-none select-none">
      {{ position.label }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { X } from 'lucide-vue-next';
import type { LineupPosition, Player } from '../types';

const props = defineProps<{
  position: LineupPosition;
  player: Player | null;
  isDuplicate: boolean;
  selectedPlayerId: string | null;
}>();

const emit = defineEmits<{
  (e: 'assign', playerId: string): void;
  (e: 'unassign'): void;
  (e: 'select-player', playerId: string): void;
  (e: 'clear-selection'): void;
}>();

const isHovered = ref(false);

function handleClick() {
  if (props.selectedPlayerId) {
    if (props.player && props.selectedPlayerId === props.player.id) {
       // Tap already-selected player on field again -> Unassign/Bench
       emit('unassign');
       emit('clear-selection');
    } else {
       // Place or Swap
       emit('assign', props.selectedPlayerId);
       emit('clear-selection');
    }
  } else if (props.player) {
    // Select field player
    emit('select-player', props.player.id);
  }
}

function onDragOver(e: DragEvent) {
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move';
  }
}

function onDrop(e: DragEvent) {
  isHovered.value = false;
  try {
    const data = JSON.parse(e.dataTransfer?.getData('application/json') || '{}');
    
    if (data.source === 'position_node') {
      if (data.positionId === props.position.id) {
         // Dropped natively on itself (micro-drag). 
         // Let event bubble so FieldView correctly updates X/Y coordinates locally
         return; 
      } else if (data.playerId) {
         // Dropping populated player node onto ANOTHER node -> Reassign / Swap
         e.stopPropagation();
         emit('assign', data.playerId);
         return;
      }
    }
    
    // Roster Table payload drop matching
    if (data.playerId && data.source !== 'position_node') {
      e.stopPropagation();
      emit('assign', data.playerId);
    }
  } catch (err) {
    console.error('Drop error', err);
  }
}

function onDragStart(e: DragEvent) {
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({ 
      source: 'position_node', 
      playerId: props.player?.id || null,
      positionId: props.position.id
    }));

    // Create a circular drag ghost mimicking the nodes directly so it doesn't scrape backgrounds
    const dragElement = document.createElement('div');
    dragElement.className = 'flex items-center justify-center font-bold shadow-md rounded-full print-hide transition-all';
    dragElement.style.width = '32px';
    dragElement.style.height = '32px';
    dragElement.style.position = 'absolute';
    dragElement.style.top = '-1000px';
    dragElement.style.left = '-1000px';
    dragElement.style.zIndex = '-9999';

    if (props.player) {
      dragElement.classList.add('bg-white', 'text-green-900', 'border', 'border-gray-800');
      dragElement.style.fontSize = '12px';
      dragElement.textContent = props.position.label;
    } else {
      dragElement.classList.add('bg-black', 'bg-opacity-30', 'border-[1.5px]', 'border-white', 'border-opacity-40', 'text-white', 'text-opacity-60');
      dragElement.style.fontSize = '10px';
      dragElement.textContent = props.position.label;
    }

    document.body.appendChild(dragElement);
    e.dataTransfer.setDragImage(dragElement, 16, 16);
    
    setTimeout(() => {
      if (document.body.contains(dragElement)) {
         document.body.removeChild(dragElement);
      }
    }, 0);
  }
}
</script>
