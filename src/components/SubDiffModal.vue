<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm" @click.self="$emit('close')">
    <div class="bg-white rounded-none shadow-2xl max-w-lg w-full flex flex-col max-h-[90vh] border-2 border-gray-900 overflow-hidden">
      <!-- Modal Header -->
      <div class="bg-gray-900 text-white p-4 flex items-center justify-between shrink-0">
        <div>
          <div class="text-[10px] font-black uppercase text-emerald-400 tracking-widest flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Substitution Window
          </div>
          <h2 class="text-xl sm:text-2xl font-black tracking-tight mt-0.5">
            {{ currentLineup?.name || 'Current' }} <span class="text-gray-400">&rarr;</span> {{ nextLineup?.name || 'Next' }}
          </h2>
        </div>
        <button @click="$emit('close')" class="text-gray-400 hover:text-white p-2 transition" aria-label="Close">
          <X class="w-6 h-6" />
        </button>
      </div>

      <!-- Advisory Banner -->
      <div class="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-900 font-medium flex items-center justify-between">
        <span class="flex items-center gap-1.5">
          <Clock class="w-4 h-4 text-amber-600 shrink-0" />
          <span>Game clock keeps rolling. Call out subs when play stops (throw-in, stoppage).</span>
        </span>
        <span v-if="overdueSeconds > 0" class="text-[10px] font-black bg-amber-200 text-amber-900 px-1.5 py-0.5 whitespace-nowrap ml-2">
          +{{ formatSeconds(overdueSeconds) }}
        </span>
      </div>

      <!-- Body: Callouts -->
      <div class="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
        <!-- 1. Going In (Bench to Field) -->
        <div>
          <h3 class="text-xs font-black uppercase text-gray-500 tracking-wider mb-2 flex items-center gap-1.5">
            <ArrowUpRight class="w-4 h-4 text-emerald-600" />
            Going In (Bench &rarr; Field)
            <span class="text-[11px] font-bold text-gray-400 ml-auto">{{ diff.incoming.length }} players</span>
          </h3>

          <div v-if="diff.incoming.length === 0" class="p-3 bg-gray-50 text-gray-400 text-xs italic text-center border border-dashed">
            No incoming players from the bench.
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="sub in diff.incoming"
              :key="sub.incomingPlayer.id"
              class="flex items-center justify-between p-3 bg-emerald-50/70 border-l-4 border-emerald-500 border border-emerald-200 shadow-sm"
            >
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
                  {{ sub.positionLabel }}
                </div>
                <div>
                  <div class="font-black text-gray-900 text-base leading-tight">
                    {{ sub.incomingPlayer.name }}
                  </div>
                  <div class="text-[11px] font-bold text-gray-500 mt-0.5">
                    Plays <span class="text-emerald-700 font-extrabold">{{ sub.positionLabel }}</span>
                  </div>
                </div>
              </div>

              <div class="text-right">
                <span v-if="sub.replacedPlayer" class="text-xs font-bold text-gray-600 bg-white px-2 py-1 border border-gray-200 inline-block shadow-2xs">
                  Replaces <strong class="text-gray-900">{{ sub.replacedPlayer.name }}</strong>
                </span>
                <span v-else class="text-[11px] font-bold text-gray-400 italic">
                  Open slot
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Position Shifts on Field -->
        <div v-if="diff.shifts.length > 0">
          <h3 class="text-xs font-black uppercase text-gray-500 tracking-wider mb-2 flex items-center gap-1.5">
            <RefreshCw class="w-3.5 h-3.5 text-blue-600" />
            Position Moves on Field
            <span class="text-[11px] font-bold text-gray-400 ml-auto">{{ diff.shifts.length }} players</span>
          </h3>
          <div class="space-y-1.5">
            <div
              v-for="shift in diff.shifts"
              :key="shift.player.id"
              class="flex items-center justify-between p-2.5 bg-blue-50/70 border border-blue-200 shadow-2xs text-xs"
            >
              <span class="font-black text-gray-900">{{ shift.player.name }}</span>
              <div class="flex items-center gap-1.5 text-[11px] font-bold">
                <span class="bg-gray-200 text-gray-700 px-1.5 py-0.5">{{ shift.fromPosition }}</span>
                <span class="text-blue-600">&rarr;</span>
                <span class="bg-blue-600 text-white px-1.5 py-0.5">{{ shift.toPosition }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Coming Off to Bench -->
        <div>
          <h3 class="text-xs font-black uppercase text-gray-500 tracking-wider mb-2 flex items-center gap-1.5">
            <ArrowDownRight class="w-4 h-4 text-rose-500" />
            Coming Off to Bench (Rest)
            <span class="text-[11px] font-bold text-gray-400 ml-auto">{{ diff.resting.length }} players</span>
          </h3>

          <div v-if="diff.resting.length === 0" class="p-3 bg-gray-50 text-gray-400 text-xs italic text-center border border-dashed">
            No players coming off to bench.
          </div>
          <div v-else class="space-y-1.5">
            <div
              v-for="rest in diff.resting"
              :key="rest.player.id"
              class="flex items-center justify-between p-2.5 bg-rose-50/50 border border-rose-200 text-xs"
            >
              <span class="font-bold text-gray-800 truncate" :title="rest.player.name">{{ rest.player.name }}</span>
              <span class="text-[10px] font-bold text-gray-500 bg-white px-1.5 py-0.5 border border-gray-200 shrink-0">
                from {{ rest.fromPosition }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="p-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row gap-2.5 shrink-0">
        <button
          @click="$emit('confirm')"
          class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 px-4 rounded-none text-sm uppercase tracking-wider shadow-sm transition flex items-center justify-center gap-2"
        >
          <Check class="w-4 h-4" /> Apply &amp; Switch to {{ nextLineup?.name || 'Next Shift' }}
        </button>
        <button
          @click="$emit('close')"
          class="bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 font-bold py-3 px-4 rounded-none text-xs uppercase tracking-wider transition text-center"
        >
          Wait for Stoppage
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { X, Clock, ArrowUpRight, ArrowDownRight, RefreshCw, Check } from 'lucide-vue-next';
import type { Lineup, Player } from '../types';
import { calculateSubstitutionDiff } from '../utils/lineupParser';

const props = defineProps<{
  isOpen: boolean;
  currentLineup: Lineup | undefined;
  nextLineup: Lineup | undefined;
  roster: Player[];
  quarterTimeRemaining?: string;
  overdueSeconds?: number;
}>();

defineEmits<{
  (e: 'close'): void;
  (e: 'confirm'): void;
}>();

const diff = computed(() => {
  return calculateSubstitutionDiff(props.currentLineup, props.nextLineup, props.roster);
});

function formatSeconds(sec: number | undefined) {
  if (!sec) return '0:00';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}
</script>
