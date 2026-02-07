<template>
  <div>
    <h3 class="text-accent text-sm mb-3">
      <Wallet :size="14" class="inline" />
      钱袋
    </h3>
    <p class="text-xs text-muted mb-3">永久被动加成物品，满足条件后自动解锁。</p>

    <div class="flex flex-col gap-2">
      <div
        v-for="item in WALLET_ITEMS"
        :key="item.id"
        class="flex items-center justify-between border border-accent/20 rounded-[2px] px-3 py-2"
        :class="{ 'opacity-40': !walletStore.has(item.id) }"
      >
        <div>
          <span class="text-sm" :class="walletStore.has(item.id) ? 'text-accent' : 'text-muted'">
            {{ item.name }}
          </span>
          <span class="text-muted text-xs ml-2">{{ item.description }}</span>
        </div>
        <div class="text-xs">
          <span v-if="walletStore.has(item.id)" class="text-success">
            <Unlock :size="14" class="inline" />
            已解锁
          </span>
          <span v-else class="text-muted">
            <Lock :size="14" class="inline" />
            {{ item.unlockCondition }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { Wallet, Unlock, Lock } from 'lucide-vue-next'
  import { useWalletStore } from '@/stores'
  import { WALLET_ITEMS } from '@/data/wallet'

  const walletStore = useWalletStore()
</script>
