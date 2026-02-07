<template>
  <div class="fixed inset-0 pointer-events-none z-50">
    <div
      v-for="msg in floatMessages"
      :key="msg.id"
      class="float-msg absolute text-xs font-bold whitespace-nowrap"
      :class="msg.colorClass"
      :style="{ left: msg.x + 'px', top: msg.y + 'px' }"
    >
      {{ msg.text }}
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useGameLog } from '@/composables/useGameLog'

  const { floatMessages } = useGameLog()
</script>

<style scoped>
  .float-msg {
    animation: floatUp 1.5s ease-out forwards;
  }

  @keyframes floatUp {
    0% {
      opacity: 1;
      transform: translateY(0);
    }
    70% {
      opacity: 0.8;
      transform: translateY(-30px);
    }
    100% {
      opacity: 0;
      transform: translateY(-50px);
    }
  }
</style>
