<template>
  <div class="h-screen w-screen flex flex-col overflow-hidden bg-gray-50 text-gray-900 font-sans print:h-auto print:w-auto print:overflow-visible">
    <!-- Main Content routing -->
    <main class="flex-1 flex min-h-0 min-w-0 print:h-auto print:block relative overflow-hidden print:overflow-visible">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
</script>
