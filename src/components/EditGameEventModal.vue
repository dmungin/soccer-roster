<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm"
    @click.self="$emit('close')"
  >
    <div class="bg-white rounded-none shadow-2xl max-w-md w-full flex flex-col max-h-[92vh] border-2 border-gray-900 overflow-hidden">
      <!-- Header -->
      <div class="bg-gray-900 text-white p-4 flex items-center justify-between shrink-0 border-b border-gray-800">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-base">
            <span v-if="formType === 'goal'">⚽</span>
            <span v-else-if="formType === 'opponent_goal'">🔴</span>
            <span v-else>⏱️</span>
          </div>
          <div>
            <h2 class="text-base sm:text-lg font-black tracking-tight leading-tight">
              {{ event ? 'Edit Match Event' : 'Add Missed Event / Goal' }}
            </h2>
            <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
              {{ teamName }} &bull; Quarter {{ formPeriodIndex }} &bull; Minute {{ formMinute }}'
            </div>
          </div>
        </div>
        <button @click="$emit('close')" class="text-gray-400 hover:text-white p-1 transition" aria-label="Close">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Body Form -->
      <div class="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 text-xs">
        <!-- 1. Event Type Selector -->
        <div>
          <label class="font-black uppercase text-gray-700 tracking-wider block mb-1.5">
            Event Type
          </label>
          <div class="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              @click="formType = 'goal'"
              :class="[
                'p-2 text-center font-bold border transition flex flex-col items-center gap-1',
                formType === 'goal'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              ]"
            >
              <span class="text-base">⚽</span>
              <span>Team Goal</span>
            </button>
            <button
              type="button"
              @click="formType = 'opponent_goal'"
              :class="[
                'p-2 text-center font-bold border transition flex flex-col items-center gap-1',
                formType === 'opponent_goal'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              ]"
            >
              <span class="text-base">🔴</span>
              <span>Opponent Goal</span>
            </button>
            <button
              type="button"
              @click="formType = 'sub'"
              :class="[
                'p-2 text-center font-bold border transition flex flex-col items-center gap-1',
                formType === 'sub'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              ]"
            >
              <span class="text-base">⏱️</span>
              <span>Note / Sub</span>
            </button>
          </div>
        </div>

        <!-- 2. Time & Quarter Selectors -->
        <div class="grid grid-cols-2 gap-3 bg-gray-50 p-3 border border-gray-200">
          <div>
            <label class="font-black uppercase text-gray-600 tracking-wider block mb-1">
              Match Minute
            </label>
            <div class="flex items-center gap-1">
              <button
                type="button"
                @click="formMinute = Math.max(1, formMinute - 1)"
                class="w-7 h-7 bg-white border border-gray-300 font-bold hover:bg-gray-100 shrink-0"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                max="120"
                v-model.number="formMinute"
                class="w-full bg-white border border-gray-300 px-2 py-1 text-center font-black text-sm outline-none focus:border-blue-500"
              />
              <button
                type="button"
                @click="formMinute++"
                class="w-7 h-7 bg-white border border-gray-300 font-bold hover:bg-gray-100 shrink-0"
              >
                +
              </button>
            </div>
          </div>

          <div>
            <label class="font-black uppercase text-gray-600 tracking-wider block mb-1">
              Period / Quarter
            </label>
            <div class="flex gap-1">
              <button
                v-for="p in [1, 2, 3, 4]"
                :key="p"
                type="button"
                @click="formPeriodIndex = p"
                :class="[
                  'flex-1 py-1 text-xs font-black border transition',
                  formPeriodIndex === p
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                ]"
              >
                Q{{ p }}
              </button>
            </div>
          </div>
        </div>

        <!-- 3. Goal Scorer & Assist (If Team Goal) -->
        <div v-if="formType === 'goal'" class="space-y-3">
          <div>
            <label class="font-black uppercase text-gray-700 tracking-wider block mb-1">
              Goal Scorer <span class="text-red-500">*</span>
            </label>
            <select
              v-model="formPlayerId"
              class="w-full bg-white border border-gray-300 px-3 py-2 font-bold text-xs outline-none focus:border-blue-500"
            >
              <option :value="null">-- Select Scorer --</option>
              <option v-for="p in roster" :key="p.id" :value="p.id">
                {{ p.name }}
              </option>
            </select>
          </div>

          <div>
            <label class="font-black uppercase text-gray-700 tracking-wider block mb-1">
              Assist (Optional)
            </label>
            <select
              v-model="formAssistPlayerId"
              class="w-full bg-white border border-gray-300 px-3 py-2 font-bold text-xs outline-none focus:border-blue-500"
            >
              <option :value="null">-- None / Unassisted --</option>
              <option
                v-for="p in assisterOptions"
                :key="p.id"
                :value="p.id"
              >
                {{ p.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- 4. Notes / Incident Description (Always available or for Subs) -->
        <div>
          <label class="font-black uppercase text-gray-700 tracking-wider block mb-1">
            Notes / Details
          </label>
          <input
            type="text"
            v-model="formNotes"
            placeholder="e.g. Free kick, substitution notes..."
            class="w-full bg-white border border-gray-300 px-3 py-2 font-bold text-xs outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <!-- Footer Buttons -->
      <div class="p-3 sm:p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-2 shrink-0">
        <div>
          <button
            v-if="event"
            type="button"
            @click="handleDelete"
            class="text-red-600 hover:text-red-800 font-bold text-xs uppercase tracking-wider px-2 py-2 flex items-center gap-1 transition"
          >
            <Trash2 class="w-3.5 h-3.5" /> Delete
          </button>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="$emit('close')"
            class="bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 font-bold px-3 py-2 text-xs uppercase tracking-wider transition"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="handleSave"
            :disabled="formType === 'goal' && !formPlayerId"
            class="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black px-4 py-2 text-xs uppercase tracking-wider shadow-sm transition"
          >
            {{ event ? 'Save Changes' : 'Add Event' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { X, Trash2 } from 'lucide-vue-next';
import type { GameEvent, Player } from '../types';

const props = defineProps<{
  isOpen: boolean;
  event: GameEvent | null;
  teamName: string;
  roster: Player[];
  defaultMinute: number;
  defaultPeriod: number;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', payload: {
    id?: string;
    type: GameEvent['type'];
    minute: number;
    periodIndex: number;
    playerId: string | null;
    assistPlayerId: string | null;
    notes: string | null;
  }): void;
  (e: 'delete', id: string): void;
}>();

const formType = ref<GameEvent['type']>('goal');
const formMinute = ref(1);
const formPeriodIndex = ref(1);
const formPlayerId = ref<string | null>(null);
const formAssistPlayerId = ref<string | null>(null);
const formNotes = ref('');

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      if (props.event) {
        formType.value = props.event.type;
        formMinute.value = props.event.minute || 1;
        formPeriodIndex.value = props.event.periodIndex || 1;
        formPlayerId.value = props.event.playerId || null;
        formAssistPlayerId.value = props.event.assistPlayerId || null;
        formNotes.value = props.event.notes || '';
      } else {
        formType.value = 'goal';
        formMinute.value = Math.max(1, props.defaultMinute || 1);
        formPeriodIndex.value = props.defaultPeriod || 1;
        formPlayerId.value = null;
        formAssistPlayerId.value = null;
        formNotes.value = '';
      }
    }
  },
  { immediate: true }
);

const assisterOptions = computed(() => {
  return props.roster.filter((p) => p.id !== formPlayerId.value);
});

function handleSave() {
  if (formType.value === 'goal' && !formPlayerId.value) return;

  emit('save', {
    id: props.event?.id,
    type: formType.value,
    minute: formMinute.value,
    periodIndex: formPeriodIndex.value,
    playerId: formType.value === 'goal' ? formPlayerId.value : null,
    assistPlayerId: formType.value === 'goal' ? formAssistPlayerId.value : null,
    notes: formNotes.value.trim() || null,
  });
}

function handleDelete() {
  if (!props.event) return;
  if (confirm('Delete this event?')) {
    emit('delete', props.event.id);
  }
}
</script>
