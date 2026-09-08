<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm" @click.self="$emit('close')">
    <div class="bg-white rounded-none shadow-2xl max-w-md w-full flex flex-col max-h-[92vh] border-2 border-gray-900 overflow-hidden">
      <!-- Header -->
      <div class="bg-blue-600 text-white p-4 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-lg">⚽</div>
          <div>
            <h2 class="text-xl font-black tracking-tight leading-none">Goal for {{ teamName }}!</h2>
            <div class="text-[10px] font-bold text-blue-100 uppercase tracking-widest mt-1">
              {{ currentPeriodLabel }} &bull; Minute {{ matchMinute }}'
            </div>
          </div>
        </div>
        <button @click="$emit('close')" class="text-white/70 hover:text-white p-1 transition" aria-label="Close">
          <X class="w-6 h-6" />
        </button>
      </div>

      <!-- Body -->
      <div class="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
        <!-- Minute Selector -->
        <div class="flex items-center justify-between bg-gray-50 p-2.5 border border-gray-200">
          <label class="text-xs font-black uppercase text-gray-600 tracking-wider">Match Minute</label>
          <div class="flex items-center gap-2">
            <button @click="matchMinute = Math.max(1, matchMinute - 1)" class="w-7 h-7 bg-white border border-gray-300 font-bold hover:bg-gray-100">-</button>
            <span class="font-black text-sm w-10 text-center">{{ matchMinute }}'</span>
            <button @click="matchMinute++" class="w-7 h-7 bg-white border border-gray-300 font-bold hover:bg-gray-100">+</button>
          </div>
        </div>

        <!-- Step 1: Scorer -->
        <div>
          <label class="text-xs font-black uppercase text-gray-700 tracking-wider block mb-1.5">
            1. Select Goal Scorer <span class="text-red-500">*</span>
          </label>
          <div class="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            <button
              v-for="p in sortedPlayers"
              :key="'scorer-' + p.id"
              type="button"
              :data-testid="'scorer-' + p.name"
              @click="selectedScorerId = p.id"
              :class="[
                'w-full flex items-center justify-between p-2.5 text-left border rounded-none transition font-bold text-sm',
                selectedScorerId === p.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
              ]"
            >
              <span class="truncate">{{ p.name }}</span>
              <span v-if="isOnField(p.id)" :class="['text-[10px] px-1.5 py-0.5 uppercase tracking-wider', selectedScorerId === p.id ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-700']">
                On Field
              </span>
            </button>
          </div>
        </div>

        <!-- Step 2: Assist (Optional) -->
        <div>
          <label class="text-xs font-black uppercase text-gray-700 tracking-wider block mb-1.5">
            2. Assist <span class="text-gray-400 font-normal">(Optional)</span>
          </label>
          <div class="space-y-1.5 max-h-44 overflow-y-auto pr-1">
            <!-- Unassisted Option -->
            <button
              type="button"
              data-testid="assist-unassisted"
              @click="selectedAssistId = null"
              :class="[
                'w-full flex items-center justify-between p-2 text-left border rounded-none transition text-xs font-bold',
                selectedAssistId === null
                  ? 'bg-gray-800 text-white border-gray-800 shadow-sm'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              ]"
            >
              <span>None / Unassisted</span>
              <span v-if="selectedAssistId === null" class="text-[10px]">&check;</span>
            </button>

            <!-- Other Players for Assist -->
            <button
              v-for="p in potentialAssisters"
              :key="'assist-' + p.id"
              type="button"
              :data-testid="'assist-' + p.name"
              @click="selectedAssistId = p.id"
              :class="[
                'w-full flex items-center justify-between p-2 text-left border rounded-none transition text-xs font-bold',
                selectedAssistId === p.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
              ]"
            >
              <span class="truncate">{{ p.name }}</span>
              <span v-if="isOnField(p.id)" :class="['text-[9px] px-1 py-0.5 uppercase', selectedAssistId === p.id ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-700']">
                On Field
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-4 bg-gray-50 border-t border-gray-200 flex gap-2 shrink-0">
        <button
          @click="submitGoal"
          :disabled="!selectedScorerId"
          class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black py-3 px-4 rounded-none text-sm uppercase tracking-wider shadow-sm transition"
        >
          Confirm Goal (+1)
        </button>
        <button
          @click="$emit('close')"
          class="bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 font-bold py-3 px-4 rounded-none text-xs uppercase tracking-wider transition"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { X } from 'lucide-vue-next';
import type { Player } from '../types';

const props = defineProps<{
  isOpen: boolean;
  teamName: string;
  currentMinute: number;
  currentPeriodLabel: string;
  activeOnFieldPlayerIds: string[];
  roster: Player[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'submit', data: { scorerId: string; assistId: string | null; minute: number }): void;
}>();

const matchMinute = ref(props.currentMinute || 1);
const selectedScorerId = ref<string | null>(null);
const selectedAssistId = ref<string | null>(null);

watch(() => props.isOpen, (open) => {
  if (open) {
    matchMinute.value = Math.max(1, props.currentMinute || 1);
    selectedScorerId.value = null;
    selectedAssistId.value = null;
  }
});

function isOnField(playerId: string) {
  return props.activeOnFieldPlayerIds.includes(playerId);
}

// On-field players listed first, then bench players
const sortedPlayers = computed(() => {
  const onField = props.roster.filter(p => isOnField(p.id));
  const offField = props.roster.filter(p => !isOnField(p.id));
  return [...onField, ...offField];
});

// Assister list excludes whoever is selected as scorer
const potentialAssisters = computed(() => {
  return sortedPlayers.value.filter(p => p.id !== selectedScorerId.value);
});

function submitGoal() {
  if (!selectedScorerId.value) return;
  emit('submit', {
    scorerId: selectedScorerId.value,
    assistId: selectedAssistId.value,
    minute: matchMinute.value,
  });
}
</script>
