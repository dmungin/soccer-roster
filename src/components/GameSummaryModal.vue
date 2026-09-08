<template>
  <div v-if="isOpen && game" class="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm print:p-0" @click.self="$emit('close')">
    <div class="bg-white rounded-none shadow-2xl max-w-xl w-full flex flex-col max-h-[92vh] border-2 border-gray-900 overflow-hidden print:max-h-none print:shadow-none print:border-none">
      
      <!-- Modal Header / Scoreboard -->
      <div class="bg-gray-900 text-white p-5 shrink-0 text-center relative">
        <button @click="$emit('close')" class="absolute top-3 right-3 text-gray-400 hover:text-white p-1.5 transition print:hidden" aria-label="Close">
          <X class="w-6 h-6" />
        </button>

        <div class="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-1">
          {{ team?.name }} &bull; Match Summary
        </div>
        <h2 class="text-xl sm:text-2xl font-black tracking-tight text-white mb-3">
          {{ game.name }}
        </h2>

        <!-- Score Banner -->
        <div class="inline-flex items-center justify-center gap-4 bg-black/40 px-6 py-3 border border-white/10 shadow-inner">
          <div class="text-right">
            <span class="block text-xs font-bold text-gray-300 uppercase tracking-wider">{{ team?.name || 'Us' }}</span>
            <span class="text-4xl sm:text-5xl font-black text-white">{{ game.scoreUs ?? 0 }}</span>
          </div>
          <span class="text-2xl font-black text-gray-500">-</span>
          <div class="text-left">
            <span class="block text-xs font-bold text-gray-300 uppercase tracking-wider">Opponent</span>
            <span class="text-4xl sm:text-5xl font-black text-white">{{ game.scoreThem ?? 0 }}</span>
          </div>
        </div>

        <!-- Result Badge -->
        <div class="mt-3">
          <span :class="['text-xs font-black uppercase px-3 py-1 tracking-widest border', resultClass]">
            {{ resultText }}
          </span>
        </div>
      </div>

      <!-- Content -->
      <div class="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
        <!-- Goal Scorers Recap -->
        <div>
          <h3 class="text-xs font-black uppercase text-gray-500 tracking-wider mb-2.5 flex items-center gap-1.5 border-b pb-1.5">
            <span>⚽</span> Goal Scorers &amp; Assists
          </h3>

          <div v-if="teamGoals.length === 0" class="p-4 bg-gray-50 text-gray-400 text-xs italic text-center border border-dashed">
            No goals recorded for {{ team?.name || 'our team' }}.
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="g in teamGoals"
              :key="g.id"
              class="flex items-center justify-between p-3 bg-blue-50/60 border border-blue-200 shadow-2xs"
            >
              <div class="flex items-center gap-2.5">
                <span class="text-lg">⚽</span>
                <div>
                  <div class="font-black text-gray-900 text-sm sm:text-base leading-tight">
                    {{ getPlayerName(g.playerId) }}
                  </div>
                  <div v-if="g.assistPlayerId" class="text-xs text-blue-700 font-bold mt-0.5 flex items-center gap-1">
                    <span>🅰️</span> Assist: {{ getPlayerName(g.assistPlayerId) }}
                  </div>
                </div>
              </div>

              <div class="text-right">
                <span class="text-xs font-black bg-blue-600 text-white px-2 py-0.5 rounded-none shadow-2xs">
                  {{ g.minute }}'
                </span>
                <span class="block text-[10px] font-bold text-gray-400 mt-0.5">
                  Quarter {{ g.periodIndex }}{{ g.shift ? ` (${g.shift})` : '' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Full Match Timeline -->
        <div>
          <h3 class="text-xs font-black uppercase text-gray-500 tracking-wider mb-2.5 flex items-center gap-1.5 border-b pb-1.5">
            <Clock class="w-3.5 h-3.5 text-gray-600" /> Match Event Timeline
          </h3>

          <div v-if="!game.events || game.events.length === 0" class="p-4 bg-gray-50 text-gray-400 text-xs italic text-center border border-dashed">
            No events logged during this match.
          </div>
          <div v-else class="relative pl-6 border-l-2 border-gray-200 space-y-3 my-2">
            <div
              v-for="ev in sortedEvents"
              :key="ev.id"
              class="relative flex items-center justify-between text-xs"
            >
              <!-- Timeline Dot -->
              <div :class="['absolute -left-[31px] w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[8px]', getEventDotClass(ev.type)]">
              </div>

              <div>
                <span class="font-black text-gray-800 mr-2">{{ getEventTitle(ev) }}</span>
                <span v-if="ev.notes" class="text-gray-500 italic text-[11px]">({{ ev.notes }})</span>
              </div>

              <span class="font-black text-gray-400 text-[11px] shrink-0 ml-2">
                {{ ev.minute }}'
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="p-4 bg-gray-50 border-t border-gray-200 flex flex-wrap gap-2 justify-between items-center shrink-0 print:hidden">
        <button
          @click="triggerPrint"
          class="bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 font-bold py-2.5 px-3.5 rounded-none text-xs uppercase tracking-wider transition flex items-center gap-1.5 shadow-sm"
        >
          <Printer class="w-4 h-4" /> Print Summary
        </button>

        <div class="flex gap-2">
          <button
            @click="$emit('reopen')"
            class="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold py-2.5 px-3 rounded-none text-xs uppercase tracking-wider transition flex items-center gap-1"
            title="Reopen match in live mode"
          >
            <RotateCcw class="w-3.5 h-3.5" /> Reopen Game
          </button>

          <button
            @click="$emit('close')"
            class="bg-gray-900 hover:bg-gray-800 text-white font-bold py-2.5 px-4 rounded-none text-xs uppercase tracking-wider transition"
          >
            Done
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { X, Clock, Printer, RotateCcw } from 'lucide-vue-next';
import type { Game, Team, GameEvent } from '../types';

const props = defineProps<{
  isOpen: boolean;
  game: Game | undefined;
  team: Team | undefined;
}>();

defineEmits<{
  (e: 'close'): void;
  (e: 'reopen'): void;
}>();

const resultText = computed(() => {
  if (!props.game) return '';
  const us = props.game.scoreUs ?? 0;
  const them = props.game.scoreThem ?? 0;
  if (us > them) return 'Victory';
  if (us < them) return 'Defeat';
  return 'Draw';
});

const resultClass = computed(() => {
  if (!props.game) return '';
  const us = props.game.scoreUs ?? 0;
  const them = props.game.scoreThem ?? 0;
  if (us > them) return 'bg-emerald-500 text-white border-emerald-600';
  if (us < them) return 'bg-rose-500 text-white border-rose-600';
  return 'bg-amber-500 text-white border-amber-600';
});

function getPlayerName(playerId?: string) {
  if (!playerId) return 'Player';
  return props.team?.players.find(p => p.id === playerId)?.name || 'Player';
}

const teamGoals = computed(() => {
  if (!props.game?.events) return [];
  return props.game.events.filter(e => e.type === 'goal');
});

const sortedEvents = computed(() => {
  if (!props.game?.events) return [];
  return [...props.game.events].sort((a, b) => a.minute - b.minute);
});

function getEventTitle(ev: GameEvent) {
  if (ev.type === 'goal') {
    const scorer = getPlayerName(ev.playerId);
    const assist = ev.assistPlayerId ? ` (Assist: ${getPlayerName(ev.assistPlayerId)})` : '';
    return `⚽ Goal: ${scorer}${assist}`;
  }
  if (ev.type === 'opponent_goal') {
    return '🔴 Opponent Goal';
  }
  if (ev.type === 'period_start') {
    return `🏁 Quarter ${ev.periodIndex} Started`;
  }
  if (ev.type === 'period_end') {
    return `🏁 Quarter ${ev.periodIndex} Ended`;
  }
  if (ev.type === 'sub') {
    return `⏱️ Substitution Window`;
  }
  return ev.type;
}

function getEventDotClass(type: GameEvent['type']) {
  if (type === 'goal') return 'bg-emerald-600 text-white';
  if (type === 'opponent_goal') return 'bg-rose-500 text-white';
  if (type === 'period_start' || type === 'period_end') return 'bg-gray-800 text-white';
  return 'bg-blue-500 text-white';
}

function triggerPrint() {
  window.print();
}
</script>
