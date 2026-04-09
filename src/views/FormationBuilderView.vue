<template>
  <div class="h-full flex flex-col w-full bg-white relative">
    <!-- Header -->
    <div class="px-6 py-5 flex flex-wrap gap-4 items-center justify-between border-b border-gray-200 z-10 bg-gray-50 shadow-sm">
      <div class="flex items-center space-x-6 w-full lg:w-auto">
        <router-link to="/" class="flex items-center justify-center bg-white border border-gray-300 text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-md transition shadow-sm h-[42px]">
          <ArrowLeft class="w-5 h-5"/>
        </router-link>
        
        <div class="flex items-center space-x-3 flex-1 min-w-[200px]">
          <label class="text-xs font-bold uppercase text-gray-500 whitespace-nowrap">Name</label>
          <input v-model="formationName" placeholder="e.g. 4-4-2" class="border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-500 text-sm font-bold w-full" />
        </div>

        <div class="flex items-center space-x-3 shrink-0">
          <label class="text-xs font-bold uppercase text-gray-500 hidden sm:block">Size</label>
          <select v-model="formationSize" class="border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-500 text-sm font-bold bg-white w-[120px]">
            <option value="11v11">11 v 11</option>
            <option value="9v9">9 v 9</option>
            <option value="7v7">7 v 7</option>
          </select>
        </div>
      </div>

      <div class="flex-1 lg:flex-none flex items-center justify-end w-full lg:w-auto mt-2 lg:mt-0">
         <span v-if="positionsObj.length !== expectedCount" class="text-red-500 font-bold text-sm mr-4">
           Added {{ positionsObj.length }} / {{ expectedCount }} positions
         </span>
         <span v-else class="text-green-600 font-bold text-sm mr-4">
           Ready ({{expectedCount}})
         </span>
         <button @click="saveFormation" :disabled="!formationName.trim() || positionsObj.length !== expectedCount" class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded shadow transition disabled:opacity-50 tracking-wide uppercase text-sm">
           Save Formation
         </button>
      </div>
    </div>

    <!-- Designer -->
    <div class="flex flex-1 overflow-hidden relative bg-gray-100 flex-col md:flex-row">
      <!-- Sidebar Options -->
      <div class="w-full md:w-[320px] shrink-0 border-r border-gray-200 bg-white flex flex-col shadow-[2px_0_10px_-5px_rgba(0,0,0,0.1)] overflow-y-auto max-h-[30vh] md:max-h-none z-10">
        <div class="p-4 bg-blue-50 border-b border-blue-100">
          <p class="text-[13px] text-blue-800 font-medium leading-relaxed">Drag positions onto the field below to build your formation.</p>
        </div>
        <div v-for="(group, groupName) in POSITIONS" :key="groupName" class="border-b border-gray-100">
          <div class="px-4 py-2 bg-gray-50 font-black text-gray-600 uppercase text-[10px] tracking-widest">{{ groupName }}</div>
          <div class="p-3 flex flex-wrap gap-2">
            <div 
              v-for="pos in group" 
              :key="pos.label" 
              class="border border-gray-300 rounded bg-white px-3 py-1.5 flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.05)] cursor-grab active:cursor-grabbing text-xs font-bold text-gray-700 hover:border-blue-400 hover:text-blue-700 transition hover:shadow-md"
              draggable="true" 
              @dragstart="onSidebarDragStart($event, pos)"
              :title="pos.name"
            >
              {{ pos.label }}
            </div>
          </div>
        </div>
      </div>

      <!-- Field Layout Area -->
      <div class="flex-1 flex items-center justify-center p-4 sm:p-8 overflow-y-auto relative bg-gradient-to-br from-gray-100 to-gray-200">
         <div class="w-full max-w-[500px] aspect-[3/4] relative bg-[#2a8b3e] rounded-xl border-[6px] border-white shadow-[0_10px_30px_rgba(0,0,0,0.15)] overflow-hidden"
              @dragover.prevent="onFieldDragOver"
              @drop="onFieldDrop">
            <!-- Grass background strips -->
            <div class="absolute inset-0 pattern-grass"></div>
            
            <!-- Field markings -->
            <div class="absolute inset-0 m-4 border-[2.5px] border-white/60 pointer-events-none rounded-[1px]"></div>
            <div class="absolute top-1/2 left-4 right-4 border-t-[2.5px] border-white/60 pointer-events-none"></div>
            <div class="absolute top-1/2 left-1/2 w-32 h-32 -translate-x-1/2 -translate-y-1/2 rounded-full border-[2.5px] border-white/60 pointer-events-none"></div>
            <div class="absolute top-1/2 left-1/2 w-2.5 h-2.5 -translate-x-1/2 -translate-y-1/2 bg-white/60 rounded-full pointer-events-none"></div>

            <div class="absolute top-4 left-1/2 w-48 h-24 -translate-x-1/2 border-[2.5px] border-t-0 border-white/60 pointer-events-none"></div>
            <div class="absolute top-4 left-1/2 w-20 h-10 -translate-x-1/2 border-[2.5px] border-t-0 border-white/60 pointer-events-none"></div>
            
            <div class="absolute bottom-4 left-1/2 w-48 h-24 -translate-x-1/2 border-[2.5px] border-b-0 border-white/60 pointer-events-none"></div>
            <div class="absolute bottom-4 left-1/2 w-20 h-10 -translate-x-1/2 border-[2.5px] border-b-0 border-white/60 pointer-events-none"></div>
            
            <!-- Placed positions -->
            <div 
              v-for="p in positionsObj" 
              :key="p.id"
              class="absolute w-10 h-10 sm:w-12 sm:h-12 -translate-x-1/2 -translate-y-1/2 rounded-full flex flex-col items-center justify-center border-[2.5px] border-white/80 shadow-[0_4px_15px_rgba(0,0,0,0.4)] bg-black/60 cursor-grab active:cursor-grabbing group hover:bg-black/80 hover:border-white transition-all hover:scale-105"
              :style="{ left: `${p.x}%`, top: `${p.y}%` }"
              draggable="true"
              @dragstart="onNodeDragStart($event, p)"
            >
              <span class="text-white font-bold text-[11px] sm:text-xs select-none tracking-widest">{{ p.label }}</span>
              <!-- Delete button -->
              <button 
                @click.stop="removePosition(p.id)"
                class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow hover:bg-red-600 scale-75 sm:scale-100"
                title="Remove Position"
              >
                <Trash2 class="w-3 h-3"/>
              </button>
            </div>
         </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAppStore } from '../stores/appState';
import { ArrowLeft, Trash2 } from 'lucide-vue-next';
import type { FormationType, PositionDef } from '../types';

const router = useRouter();
const store = useAppStore();

const POSITIONS = {
  Striker: [
    { label: 'LST', name: 'Left Striker' },
    { label: 'RST', name: 'Right Striker' },
    { label: 'ST', name: 'Striker' },
  ],
  Midfield: [
    { label: 'LW', name: 'Left Wing' },
    { label: 'RW', name: 'Right Wing' },
    { label: 'AM', name: 'Attacking Midfield' },
    { label: 'LAM', name: 'Left Attacking Midfield' },
    { label: 'RAM', name: 'Right Attacking Midfield' },
    { label: 'CM', name: 'Center Midfield' },
    { label: 'LM', name: 'Left Midfield' },
    { label: 'RM', name: 'Right Midfield' },
    { label: 'DM', name: 'Defensive Midfield' },
    { label: 'LDM', name: 'Left Defensive Midfield' },
    { label: 'RDM', name: 'Right Defensive Midfield' },
  ],
  Defense: [
    { label: 'GK', name: 'Goal Keeper' },
    { label: 'LWB', name: 'Left Wing Back' },
    { label: 'RWB', name: 'Right Wing Back' },
    { label: 'LB', name: 'Left Back' },
    { label: 'RB', name: 'Right Back' },
    { label: 'CB', name: 'Center Back' },
    { label: 'LCB', name: 'Left Center Back' },
    { label: 'RCB', name: 'Right Center Back' },
    { label: 'SW', name: 'Sweeper' },
    { label: 'STP', name: 'Stopper' },
  ]
};

const formationName = ref('');
const formationSize = ref<FormationType>('11v11');
const positionsObj = ref<{id: string, label: string, name: string, x: number, y: number}[]>([]);

const expectedCount = computed(() => {
  if (formationSize.value === '11v11') return 11;
  if (formationSize.value === '9v9') return 9;
  return 7;
});

function onSidebarDragStart(e: DragEvent, posData: { label: string, name: string }) {
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/json', JSON.stringify({ 
      source: 'sidebar', 
      label: posData.label,
      name: posData.name
    }));
  }
}

function onNodeDragStart(e: DragEvent, p: { id: string }) {
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({ 
      source: 'node', 
      id: p.id
    }));
  }
}

function onFieldDragOver(e: DragEvent) {
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'copy';
  }
}

function onFieldDrop(e: DragEvent) {
  try {
    const dataStr = e.dataTransfer?.getData('application/json');
    if (!dataStr) return;
    const data = JSON.parse(dataStr);
    
    // Calculate percentages
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    
    if (data.source === 'sidebar') {
      positionsObj.value.push({
        id: crypto.randomUUID(),
        label: data.label,
        name: data.name,
        x: Math.round(x*10)/10,
        y: Math.round(y*10)/10
      });
    } else if (data.source === 'node') {
      const p = positionsObj.value.find(node => node.id === data.id);
      if (p) {
        p.x = Math.round(x*10)/10;
        p.y = Math.round(y*10)/10;
      }
    }
  } catch (err) {}
}

function removePosition(id: string) {
  positionsObj.value = positionsObj.value.filter(p => p.id !== id);
}

async function saveFormation() {
  if (!formationName.value.trim() || positionsObj.value.length !== expectedCount.value) return;
  
  try {
    const posDefs: PositionDef[] = positionsObj.value.map(p => ({
      id: crypto.randomUUID(),
      label: p.label,
      x: p.x,
      y: p.y
    }));
    
    await store.addCustomFormation(formationName.value.trim(), formationSize.value, posDefs);
    router.push('/');
  } catch (err) {
    alert('Failed to save formation.');
    console.error(err);
  }
}
</script>

<style scoped>
.pattern-grass {
  background-image: repeating-linear-gradient(0deg, transparent, transparent 10%, rgba(255,255,255,0.06) 10%, rgba(255,255,255,0.06) 20%);
}
</style>
