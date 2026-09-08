<template>
  <div v-if="game && team" class="min-h-screen bg-gray-100 flex flex-col select-none">
    
    <!-- Top Scoreboard Bar -->
    <header :class="['px-3 py-2.5 sm:px-6 sm:py-3 text-white shadow-md z-30 shrink-0 sticky top-0', team.color]">
      <div class="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        
        <!-- Team & Navigation -->
        <div class="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <router-link :to="`/game/${game.id}`" class="p-1.5 sm:p-2 bg-white/15 hover:bg-white/25 text-white transition rounded-none shrink-0" title="Back to Game Plan">
            <ArrowLeft class="w-4 h-4 sm:w-5 sm:h-5" />
          </router-link>
          <div class="min-w-0">
            <h1 class="text-sm sm:text-lg font-black tracking-tight leading-tight truncate">
              {{ game.name }}
            </h1>
            <div class="text-[10px] sm:text-xs font-bold text-white/80 uppercase tracking-wide flex items-center gap-1 truncate">
              <span>{{ team.name }}</span>
              <span>&bull;</span>
              <span v-if="game.status === 'completed'" class="text-emerald-200">FINAL</span>
              <span v-else class="text-emerald-300 font-black animate-pulse">● LIVE</span>
            </div>
          </div>
        </div>

        <!-- Central Score Display -->
        <div class="flex items-center bg-black/30 border border-white/20 px-3 sm:px-6 py-1.5 sm:py-2 shrink-0 shadow-inner">
          <div class="text-center">
            <span class="block text-[9px] sm:text-[10px] font-bold text-white/70 uppercase truncate max-w-[70px] sm:max-w-[100px]">{{ team.name }}</span>
            <span class="text-2xl sm:text-4xl font-black text-white leading-none">{{ game.scoreUs ?? 0 }}</span>
          </div>
          <span class="text-lg sm:text-2xl font-black text-white/40 mx-2 sm:mx-3">-</span>
          <div class="text-center">
            <span class="block text-[9px] sm:text-[10px] font-bold text-white/70 uppercase">Opponent</span>
            <span class="text-2xl sm:text-4xl font-black text-white leading-none">{{ game.scoreThem ?? 0 }}</span>
          </div>
        </div>

        <!-- Quick Score Buttons -->
        <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            @click="openScoreGoalModal"
            class="bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white font-black px-2.5 sm:px-4 py-2 rounded-none text-xs sm:text-sm uppercase tracking-wider shadow-sm transition flex items-center gap-1"
            title="Log Goal for Our Team"
          >
            <Plus class="w-4 h-4" /> <span class="hidden sm:inline">Goal</span> (Us)
          </button>
          <button
            @click="logOpponentGoal"
            class="bg-white/20 hover:bg-white/30 active:scale-95 text-white font-black px-2.5 sm:px-3.5 py-2 rounded-none text-xs sm:text-sm uppercase tracking-wider transition flex items-center gap-1 border border-white/25"
            title="Log Opponent Goal"
          >
            <Plus class="w-4 h-4" /> <span class="hidden sm:inline">Goal</span> (Them)
          </button>
          <button
            v-if="game.status !== 'completed'"
            @click="confirmFinishMatch"
            class="hidden md:flex bg-gray-900/80 hover:bg-gray-900 text-white font-bold px-3 py-2 text-xs uppercase tracking-wider transition border border-white/20"
          >
            End Game
          </button>
        </div>

      </div>
    </header>

    <!-- Master Match Control Bar (Clock, Quarter, Subs) -->
    <section class="bg-gray-900 text-white border-b border-gray-800 px-3 py-3 sm:px-6 shrink-0 shadow-inner">
      <div class="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        
        <!-- Period & Shift Selector -->
        <div class="flex items-center gap-2 sm:gap-3 w-full md:w-auto justify-between md:justify-start">
          <div>
            <div class="text-[9px] sm:text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-1.5">
              <span>Period</span>
              <span class="text-gray-400 text-[10px] font-normal lowercase">({{ currentQuarterMinutes }}m)</span>
            </div>
            <div class="text-base sm:text-lg font-black text-white flex items-center gap-1.5">
              <span>Quarter {{ currentPeriod }}</span>
              <span class="text-xs font-bold text-gray-400">/ 4</span>
              <span v-if="activeLineup" class="bg-blue-600 text-white text-[11px] font-black px-1.5 py-0.5 ml-1">
                {{ activeLineup.name }}
              </span>
            </div>
          </div>

          <!-- Quick Period Nav -->
          <div class="flex gap-1 items-center">
            <button
              v-for="p in [1, 2, 3, 4]"
              :key="p"
              @click="setPeriod(p)"
              :class="[
                'w-7 h-7 sm:w-8 sm:h-8 font-black text-xs transition border',
                currentPeriod === p
                  ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                  : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'
              ]"
            >
              Q{{ p }}
            </button>
          </div>

          <!-- Match-Level Quarter Duration Selector (when paused) -->
          <div v-if="!isClockRunning" class="hidden sm:flex items-center gap-1 pl-2 border-l border-gray-800 text-[10px] text-gray-400">
            <span class="font-bold">Length:</span>
            <select
              :value="currentQuarterMinutes"
              @change="changeQuarterMinutes(Number(($event.target as HTMLInputElement).value))"
              class="bg-gray-800 text-white font-bold text-[11px] px-1.5 py-1 border border-gray-700 rounded-none outline-none"
              title="Set Quarter Duration for this Match"
            >
              <option :value="8">8m</option>
              <option :value="10">10m</option>
              <option :value="12">12m</option>
              <option :value="15">15m</option>
              <option :value="20">20m</option>
              <option :value="25">25m</option>
            </select>
          </div>
        </div>

        <!-- Master Clock Controls (Uninterrupted) -->
        <div class="flex items-center gap-2 sm:gap-4 w-full md:w-auto justify-center">
          <!-- Digital Display -->
          <div class="bg-black/60 px-4 py-1.5 border border-gray-700 text-center font-mono">
            <div class="text-2xl sm:text-3xl font-black tracking-widest text-emerald-400 leading-none">
              {{ formatTimer(quarterSecondsRemaining) }}
            </div>
            <span class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Quarter Time</span>
          </div>

          <!-- Clock Toggle -->
          <button
            @click="toggleClock"
            :class="[
              'px-4 py-2 font-black text-xs sm:text-sm uppercase tracking-wider shadow-sm transition flex items-center gap-1.5',
              isClockRunning
                ? 'bg-amber-500 hover:bg-amber-600 text-gray-950'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            ]"
          >
            <component :is="isClockRunning ? Pause : Play" class="w-4 h-4 fill-current" />
            <span>{{ isClockRunning ? 'Pause Clock' : 'Start Clock' }}</span>
          </button>

          <!-- Minute Adjusters -->
          <div class="flex gap-1">
            <button @click="adjustClock(-60)" class="w-8 h-8 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs border border-gray-700" title="-1 Min">-1m</button>
            <button @click="adjustClock(60)" class="w-8 h-8 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs border border-gray-700" title="+1 Min">+1m</button>
          </div>
        </div>

        <!-- Sub Status & Whistle -->
        <div class="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          <!-- Sub Countdown / Status -->
          <div class="text-right">
            <div class="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400">
              Sub Window
            </div>
            <div :class="['text-xs sm:text-sm font-black', isSubDue ? 'text-amber-400 animate-pulse' : 'text-gray-200']">
              <span v-if="isSubDue">Subs Due (+{{ formatTimer(subOverdueSeconds) }})</span>
              <span v-else>{{ formatTimer(subSecondsRemaining) }}</span>
            </div>
          </div>

          <button
            @click="openSubCallout"
            :class="[
              'px-3 py-2 text-xs font-black uppercase tracking-wider transition border flex items-center gap-1 shadow-sm',
              isSubDue
                ? 'bg-amber-400 text-gray-950 border-amber-300 animate-bounce'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700'
            ]"
          >
            <Users class="w-3.5 h-3.5" />
            <span>{{ isSubDue ? 'Review Subs!' : 'View Subs' }}</span>
          </button>

          <!-- Whistle Sound Trigger -->
          <button
            @click="triggerRefereeWhistle"
            class="p-2 bg-gray-800 hover:bg-gray-700 text-amber-300 border border-gray-700 transition"
            title="Play Referee Whistle"
          >
            <Volume2 class="w-4 h-4" />
          </button>
        </div>

      </div>
    </section>

    <!-- Advisory Non-Blocking Banner (when subs are due and waiting for throw-in) -->
    <div
      v-if="isSubDue"
      class="bg-amber-400 text-gray-950 px-4 py-2 text-xs font-black flex items-center justify-between shadow-md shrink-0 border-b border-amber-500"
    >
      <div class="flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full bg-gray-950 animate-ping"></span>
        <span>
          MID-QUARTER SUB WINDOW READY: Quarter clock is rolling. Call out substitutions at the next stoppage!
        </span>
      </div>
      <button
        @click="openSubCallout"
        class="bg-gray-950 hover:bg-gray-800 text-white px-3 py-1 text-[11px] font-black uppercase tracking-wider shrink-0 transition"
      >
        Call Out Subs
      </button>
    </div>

    <!-- Main Content: Pitch & Bench + Event Feed -->
    <main class="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      <!-- Left Column: Tactical Pitch & Field Lineup (8 cols) -->
      <section class="lg:col-span-8 bg-white border border-gray-200 shadow-sm p-4 flex flex-col space-y-4">
        
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-3">
          <div>
            <h2 class="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
              <span>On Pitch: {{ activeLineup?.name || 'Lineup' }}</span>
              <span class="text-xs font-bold text-gray-500">({{ team.matchType }})</span>
            </h2>
            <p class="text-xs text-gray-500 font-medium">
              Tap any player on the field or bench to swap positions on the fly.
            </p>
          </div>

          <!-- Shift Switcher -->
          <div class="flex items-center gap-1.5 flex-wrap">
            <button
              v-for="l in game.lineups"
              :key="l.id"
              @click="activeLineupId = l.id"
              :class="[
                'px-2.5 py-1 text-xs font-black uppercase tracking-wider transition border',
                activeLineupId === l.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              ]"
            >
              {{ l.name }}
            </button>
          </div>
        </div>

        <!-- Soccer Pitch Field Component -->
        <div v-if="activeLineup" class="w-full max-w-md mx-auto aspect-[3/4] relative">
          <FieldView
            :game-id="game.id"
            :lineup="activeLineup"
            :selected-player-id="selectedPlayerId"
            @select-player="handleSelectPlayer"
            @clear-selection="selectedPlayerId = null"
          />
        </div>
        <div v-else class="p-12 text-center text-gray-400 italic bg-gray-50 border border-dashed">
          No lineups configured for this game.
        </div>

        <!-- Bench Players for Active Lineup -->
        <div class="border-t pt-3">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-xs font-black uppercase tracking-wider text-gray-500">
              Bench Players ({{ benchPlayers.length }})
            </h3>
            <span v-if="selectedPlayerId" class="text-[11px] font-bold text-blue-600 animate-pulse">
              Tap another player to swap!
            </span>
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              v-for="p in benchPlayers"
              :key="p.id"
              type="button"
              @click="handleSelectPlayer(p.id)"
              :class="[
                'px-3 py-1.5 text-xs font-bold transition border flex items-center gap-1.5',
                selectedPlayerId === p.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              ]"
            >
              <span class="w-2 h-2 rounded-full bg-gray-400"></span>
              <span>{{ p.name }}</span>
            </button>
            <div v-if="benchPlayers.length === 0" class="text-xs text-gray-400 italic">
              No players currently on the bench.
            </div>
          </div>
        </div>

      </section>

      <!-- Right Column: Match Event Feed & Actions (4 cols) -->
      <aside class="lg:col-span-4 flex flex-col space-y-4">
        
        <!-- Quick Quarter Advance Card -->
        <div class="bg-white border border-gray-200 shadow-sm p-4 space-y-3">
          <h3 class="text-xs font-black uppercase text-gray-500 tracking-wider">
            Quarter Management
          </h3>
          <div class="flex gap-2">
            <button
              v-if="currentPeriod < 4"
              @click="advanceQuarter"
              class="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-black py-2.5 px-3 text-xs uppercase tracking-wider transition shadow-sm"
            >
              Start Quarter {{ currentPeriod + 1 }} &rarr;
            </button>
            <button
              @click="confirmFinishMatch"
              class="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 px-3 text-xs uppercase tracking-wider transition shadow-sm"
            >
              Finalize Match
            </button>
          </div>
        </div>

        <!-- Match Events Feed -->
        <div class="bg-white border border-gray-200 shadow-sm p-4 flex flex-col flex-1">
          <div class="flex items-center justify-between mb-3 border-b pb-2">
            <h3 class="text-xs font-black uppercase text-gray-500 tracking-wider flex items-center gap-1.5">
              <Clock class="w-3.5 h-3.5 text-gray-600" /> Match Event Log
            </h3>
            <span class="text-[11px] font-bold text-gray-400">{{ game.events?.length || 0 }} events</span>
          </div>

          <div v-if="!game.events || game.events.length === 0" class="py-8 text-center text-gray-400 text-xs italic">
            No events logged yet. Tap "+ Goal" to record goals.
          </div>
          <div v-else class="space-y-2 max-h-96 overflow-y-auto pr-1">
            <div
              v-for="ev in sortedEventsReversed"
              :key="ev.id"
              class="p-2.5 bg-gray-50 border border-gray-200 flex items-center justify-between text-xs group"
            >
              <div class="flex items-center gap-2 min-w-0">
                <span class="font-black text-xs text-blue-600 shrink-0">{{ ev.minute }}'</span>
                <div class="truncate">
                  <span class="font-bold text-gray-900 block truncate">{{ formatEventText(ev) }}</span>
                  <span v-if="ev.assistPlayerId" class="text-[10px] text-gray-500 block truncate">
                    Assist: {{ getPlayerName(ev.assistPlayerId) }}
                  </span>
                </div>
              </div>

              <!-- Delete/Undo Action -->
              <button
                @click="deleteEvent(ev.id)"
                class="text-gray-300 hover:text-red-600 p-1 transition opacity-60 group-hover:opacity-100"
                title="Undo / Delete Event"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

      </aside>

    </main>

    <!-- Modals -->
    <SubDiffModal
      :is-open="isSubModalOpen"
      :current-lineup="activeLineup"
      :next-lineup="nextLineupForSub"
      :roster="team.players"
      :quarter-time-remaining="formatTimer(quarterSecondsRemaining)"
      :overdue-seconds="subOverdueSeconds"
      @close="isSubModalOpen = false"
      @confirm="applySubWindow"
    />

    <ScoreGoalModal
      :is-open="isGoalModalOpen"
      :team-name="team.name"
      :current-minute="currentMatchMinute"
      :current-period-label="`Quarter ${currentPeriod}`"
      :active-on-field-player-ids="activeOnFieldPlayerIds"
      :roster="team.players"
      @close="isGoalModalOpen = false"
      @submit="handleGoalScored"
    />

    <GameSummaryModal
      :is-open="isSummaryModalOpen"
      :game="game"
      :team="team"
      @close="isSummaryModalOpen = false"
      @reopen="handleReopenMatch"
    />

  </div>
  <div v-else class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="bg-white p-8 border border-gray-200 shadow-sm max-w-sm text-center">
      <p class="font-bold text-gray-700 mb-4">Loading match data...</p>
      <router-link to="/" class="bg-blue-600 text-white px-4 py-2 text-sm font-bold block">Dashboard</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAppStore } from '../stores/appState';
import type { GameEvent, Lineup } from '../types';
import FieldView from '../components/FieldView.vue';
import SubDiffModal from '../components/SubDiffModal.vue';
import ScoreGoalModal from '../components/ScoreGoalModal.vue';
import GameSummaryModal from '../components/GameSummaryModal.vue';
import { playWhistle, playSubChime } from '../utils/sound';
import { parseLineupShift } from '../utils/lineupParser';
import {
  ArrowLeft,
  Play,
  Pause,
  Plus,
  Users,
  Clock,
  Trash2,
  Volume2,
} from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const store = useAppStore();

const gameId = route.params.id as string;
const STORAGE_KEY = `first_touch_live_${gameId}`;
const game = computed(() => store.getGame(gameId));
const team = computed(() => (game.value ? store.getTeam(game.value.teamId) : undefined));

// --- Timer & Match State ---
const DEFAULT_QUARTER_MINUTES = 10;
const currentQuarterMinutes = ref(10);
const hasInitializedFromTeam = ref(false);

const currentPeriod = ref(1);
const quarterSecondsRemaining = ref(DEFAULT_QUARTER_MINUTES * 60);
const subSecondsRemaining = ref(Math.round(DEFAULT_QUARTER_MINUTES / 2) * 60);
const isClockRunning = ref(false);
const isSubDue = ref(false);
const subOverdueSeconds = ref(0);

watch(team, (t) => {
  if (t && !hasInitializedFromTeam.value) {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const qm = t.quarterMinutes ?? DEFAULT_QUARTER_MINUTES;
      currentQuarterMinutes.value = qm;
      quarterSecondsRemaining.value = qm * 60;
      subSecondsRemaining.value = Math.round(qm / 2) * 60;
    }
    hasInitializedFromTeam.value = true;
  }
}, { immediate: true });

const activeLineupId = ref<string>('');
const selectedPlayerId = ref<string | null>(null);

// Modal states
const isSubModalOpen = ref(false);
const isGoalModalOpen = ref(false);
const isSummaryModalOpen = ref(false);

let clockInterval: ReturnType<typeof setInterval> | null = null;

// Active lineup
const activeLineup = computed(() => {
  if (!game.value || game.value.lineups.length === 0) return undefined;
  if (activeLineupId.value) {
    const found = game.value.lineups.find(l => l.id === activeLineupId.value);
    if (found) return found;
  }
  return game.value.lineups[0];
});

// Next lineup for sub rotation
const nextLineupForSub = computed(() => {
  if (!game.value || !activeLineup.value) return undefined;
  const idx = game.value.lineups.findIndex(l => l.id === activeLineup.value!.id);
  if (idx !== -1 && idx + 1 < game.value.lineups.length) {
    return game.value.lineups[idx + 1];
  }
  return undefined;
});

// Players currently on pitch
const activeOnFieldPlayerIds = computed(() => {
  if (!activeLineup.value) return [];
  return activeLineup.value.positions
    .map(p => p.playerId)
    .filter((id): id is string => !!id);
});

// Bench players for active lineup
const benchPlayers = computed(() => {
  if (!team.value) return [];
  const onField = new Set(activeOnFieldPlayerIds.value);
  return team.value.players.filter(p => !onField.has(p.id));
});

// Calculate current match minute (e.g. Q1 with 8:00 left = minute 2')
const currentMatchMinute = computed(() => {
  const elapsedInQuarterSec = currentQuarterMinutes.value * 60 - quarterSecondsRemaining.value;
  const quarterBaseMin = (currentPeriod.value - 1) * currentQuarterMinutes.value;
  const matchMinute = quarterBaseMin + Math.floor(elapsedInQuarterSec / 60) + 1;
  return Math.max(1, matchMinute);
});

// Sorted events for display
const sortedEventsReversed = computed(() => {
  if (!game.value?.events) return [];
  return [...game.value.events].sort((a, b) => b.minute - a.minute);
});

// --- Timer Engine ---
function startClock() {
  if (isClockRunning.value) return;
  isClockRunning.value = true;
  saveLocalState();

  // If match was scheduled, mark in_progress
  if (game.value && game.value.status === 'scheduled') {
    store.updateGameLiveStatus(game.value.id, 'in_progress');
  }

  clockInterval = setInterval(() => {
    tickClock();
  }, 1000);
}

function pauseClock() {
  isClockRunning.value = false;
  if (clockInterval) {
    clearInterval(clockInterval);
    clockInterval = null;
  }
  saveLocalState();
}

function toggleClock() {
  if (isClockRunning.value) {
    pauseClock();
  } else {
    startClock();
  }
}

function adjustClock(secondsDelta: number) {
  quarterSecondsRemaining.value = Math.max(0, quarterSecondsRemaining.value + secondsDelta);
  saveLocalState();
}

function tickClock() {
  // Quarter timer continues uninterrupted!
  if (quarterSecondsRemaining.value > 0) {
    quarterSecondsRemaining.value--;
  } else {
    // Quarter ended!
    pauseClock();
    playWhistle();
    alert(`Quarter ${currentPeriod.value} has ended!`);
    return;
  }

  // Sub timer tracking
  if (subSecondsRemaining.value > 0) {
    subSecondsRemaining.value--;
    if (subSecondsRemaining.value === 0) {
      // Sub window reached!
      isSubDue.value = true;
      subOverdueSeconds.value = 0;
      playSubChime();
    }
  } else if (isSubDue.value) {
    // Keep track of time elapsed waiting for stoppage
    subOverdueSeconds.value++;
  }

  saveLocalState();
}

function formatTimer(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// --- Period & Sub Transitions ---
function setPeriod(p: number) {
  currentPeriod.value = p;
  quarterSecondsRemaining.value = currentQuarterMinutes.value * 60;
  subSecondsRemaining.value = Math.round(currentQuarterMinutes.value / 2) * 60;
  isSubDue.value = false;
  subOverdueSeconds.value = 0;

  // Auto-switch to lineup corresponding to this period
  if (game.value) {
    const targetLineup = game.value.lineups.find(l => {
      const parsed = parseLineupShift(l);
      return parsed.period === p && (parsed.shift === 'A' || parsed.shift === 'full');
    }) || game.value.lineups[(p - 1) * 2] || game.value.lineups[p - 1];

    if (targetLineup) {
      activeLineupId.value = targetLineup.id;
    }
  }

  saveLocalState();
}

function changeQuarterMinutes(mins: number) {
  const validMins = Math.max(1, Math.round(mins) || 10);
  currentQuarterMinutes.value = validMins;
  if (!isClockRunning.value) {
    quarterSecondsRemaining.value = validMins * 60;
    subSecondsRemaining.value = Math.round(validMins / 2) * 60;
    isSubDue.value = false;
    subOverdueSeconds.value = 0;
  }
  saveLocalState();
}

function advanceQuarter() {
  if (currentPeriod.value < 4) {
    setPeriod(currentPeriod.value + 1);
  }
}

function openSubCallout() {
  isSubModalOpen.value = true;
}

async function applySubWindow() {
  isSubModalOpen.value = false;
  isSubDue.value = false;
  subOverdueSeconds.value = 0;

  // Transition to next lineup if available
  if (nextLineupForSub.value) {
    activeLineupId.value = nextLineupForSub.value.id;
  }

  // Log sub event
  if (game.value) {
    await store.addGameEvent(game.value.id, {
      type: 'sub',
      minute: currentMatchMinute.value,
      periodIndex: currentPeriod.value,
      notes: `Substituted to ${activeLineup.value?.name || 'next rotation'}`,
    });
  }

  saveLocalState();
}

function triggerRefereeWhistle() {
  playWhistle();
}

// --- Emergency / On-Field Player Swap ---
async function handleSelectPlayer(playerId: string) {
  if (!selectedPlayerId.value) {
    selectedPlayerId.value = playerId;
    return;
  }

  if (selectedPlayerId.value === playerId) {
    selectedPlayerId.value = null;
    return;
  }

  // Two players selected -> SWAP them in the active lineup!
  if (!activeLineup.value || !game.value) {
    selectedPlayerId.value = null;
    return;
  }

  const p1Id = selectedPlayerId.value;
  const p2Id = playerId;
  selectedPlayerId.value = null;

  const pos1 = activeLineup.value.positions.find(p => p.playerId === p1Id);
  const pos2 = activeLineup.value.positions.find(p => p.playerId === p2Id);

  if (pos1 && pos2) {
    // Swap two on-field players
    await store.assignPlayerToPosition(game.value.id, activeLineup.value.id, pos1.id, p2Id);
    await store.assignPlayerToPosition(game.value.id, activeLineup.value.id, pos2.id, p1Id);
  } else if (pos1 && !pos2) {
    // p1 was on field, p2 from bench -> sub p2 in for p1
    await store.assignPlayerToPosition(game.value.id, activeLineup.value.id, pos1.id, p2Id);
  } else if (!pos1 && pos2) {
    // p2 was on field, p1 from bench -> sub p1 in for p2
    await store.assignPlayerToPosition(game.value.id, activeLineup.value.id, pos2.id, p1Id);
  }
}

// --- Scorekeeping ---
function openScoreGoalModal() {
  isGoalModalOpen.value = true;
}

async function handleGoalScored(data: { scorerId: string; assistId: string | null; minute: number }) {
  isGoalModalOpen.value = false;
  if (!game.value) return;

  const shiftLabel = activeLineup.value ? parseLineupShift(activeLineup.value).shift : undefined;

  await store.addGameEvent(game.value.id, {
    type: 'goal',
    minute: data.minute,
    periodIndex: currentPeriod.value,
    shift: shiftLabel === 'full' ? undefined : shiftLabel,
    playerId: data.scorerId,
    assistPlayerId: data.assistId,
  });
}

async function logOpponentGoal() {
  if (!game.value) return;
  await store.addGameEvent(game.value.id, {
    type: 'opponent_goal',
    minute: currentMatchMinute.value,
    periodIndex: currentPeriod.value,
  });
}

async function deleteEvent(eventId: string) {
  if (!game.value) return;
  if (confirm('Undo / remove this match event?')) {
    await store.deleteGameEvent(game.value.id, eventId);
  }
}

async function confirmFinishMatch() {
  if (!game.value) return;
  if (confirm(`Mark match as Final with score ${game.value.scoreUs} - ${game.value.scoreThem}?`)) {
    pauseClock();
    await store.completeGame(game.value.id);
    isSummaryModalOpen.value = true;
  }
}

async function handleReopenMatch() {
  if (!game.value) return;
  await store.reopenGame(game.value.id);
  isSummaryModalOpen.value = false;
}

function getPlayerName(playerId?: string) {
  if (!playerId) return 'Unknown';
  return team.value?.players.find(p => p.id === playerId)?.name || 'Unknown';
}

function formatEventText(ev: GameEvent) {
  if (ev.type === 'goal') {
    return `⚽ Goal: ${getPlayerName(ev.playerId)}`;
  }
  if (ev.type === 'opponent_goal') {
    return '🔴 Opponent Goal';
  }
  if (ev.type === 'sub') {
    return `⏱️ ${ev.notes || 'Substitution'}`;
  }
  return ev.type;
}

// --- Persistence via localStorage ---
function saveLocalState() {
  try {
    const state = {
      period: currentPeriod.value,
      currentQuarterMinutes: currentQuarterMinutes.value,
      quarterSecondsRemaining: quarterSecondsRemaining.value,
      subSecondsRemaining: subSecondsRemaining.value,
      isSubDue: isSubDue.value,
      subOverdueSeconds: subOverdueSeconds.value,
      isClockRunning: isClockRunning.value,
      activeLineupId: activeLineupId.value,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save live game state:', err);
  }
}

function restoreLocalState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const state = JSON.parse(raw);
    if (state.period) currentPeriod.value = state.period;
    if (state.activeLineupId) activeLineupId.value = state.activeLineupId;

    if (state.currentQuarterMinutes) {
      currentQuarterMinutes.value = state.currentQuarterMinutes;
    } else if (team.value?.quarterMinutes) {
      currentQuarterMinutes.value = team.value.quarterMinutes;
    }
    hasInitializedFromTeam.value = true;

    const baseQuarter = currentQuarterMinutes.value;
    const elapsed = state.isClockRunning ? Math.floor((Date.now() - state.timestamp) / 1000) : 0;

    quarterSecondsRemaining.value = Math.max(0, (state.quarterSecondsRemaining ?? baseQuarter * 60) - elapsed);
    subSecondsRemaining.value = Math.max(0, (state.subSecondsRemaining ?? Math.round(baseQuarter / 2) * 60) - elapsed);
    isSubDue.value = state.isSubDue || subSecondsRemaining.value === 0;
    subOverdueSeconds.value = (state.subOverdueSeconds ?? 0) + (isSubDue.value ? elapsed : 0);

    if (state.isClockRunning && quarterSecondsRemaining.value > 0) {
      startClock();
    }
  } catch (err) {
    console.error('Failed to restore live game state:', err);
  }
}

onMounted(() => {
  if (game.value && game.value.lineups.length > 0) {
    activeLineupId.value = game.value.lineups[0].id;
  }
  restoreLocalState();

  // If game is already completed, open summary modal by default
  if (game.value && game.value.status === 'completed') {
    isSummaryModalOpen.value = true;
  }
});

onUnmounted(() => {
  pauseClock();
});
</script>
