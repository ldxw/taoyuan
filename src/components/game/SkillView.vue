<template>
  <div>
    <h3 class="text-accent text-sm mb-3">
      <Star :size="14" class="inline" />
      技能
    </h3>
    <div class="space-y-3">
      <div v-for="skill in skillStore.skills" :key="skill.type" class="game-panel">
        <div class="flex justify-between items-center mb-1">
          <p class="text-sm">{{ SKILL_NAMES[skill.type] }} Lv.{{ skill.level }}</p>
          <p v-if="expInfo(skill.type)" class="text-xs text-muted">
            {{ expInfo(skill.type)!.current }}/{{ expInfo(skill.type)!.required }}
          </p>
          <p v-else class="text-xs text-accent">MAX</p>
        </div>
        <div class="bg-bg rounded-[2px] h-2 mb-2">
          <div class="h-2 bg-accent rounded-[2px] transition-all" :style="{ width: expPercent(skill.type) + '%' }" />
        </div>
        <div v-if="skill.perk5 || skill.perk10" class="text-xs text-water">
          <span v-if="skill.perk5">{{ PERK_NAMES[skill.perk5] }}</span>
          <span v-if="skill.perk10">/ {{ PERK_NAMES[skill.perk10] }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { Star } from 'lucide-vue-next'
  import { useSkillStore } from '@/stores'
  import type { SkillType, SkillPerk5, SkillPerk10 } from '@/types'

  const skillStore = useSkillStore()

  const SKILL_NAMES: Record<SkillType, string> = {
    farming: '农耕',
    foraging: '采集',
    fishing: '钓鱼',
    mining: '挖矿'
  }

  const PERK_NAMES: Record<SkillPerk5 | SkillPerk10, string> = {
    harvester: '丰收者',
    rancher: '牧人',
    lumberjack: '樵夫',
    herbalist: '药师',
    fisher: '渔夫',
    trapper: '捕手',
    miner: '矿工',
    fighter: '斗士',
    intensive: '精耕',
    artisan: '匠人',
    botanist: '植物学家',
    alchemist: '炼金师',
    angler: '垂钓大师',
    aquaculture: '水产商',
    prospector: '探矿者',
    warrior: '武者'
  }

  const expInfo = (type: SkillType) => {
    return skillStore.getExpToNextLevel(type)
  }

  const expPercent = (type: SkillType): number => {
    const info = skillStore.getExpToNextLevel(type)
    if (!info) return 100
    return Math.round((info.current / info.required) * 100)
  }
</script>
