<template>
  <div class="fixed inset-0 bg-black/60 flex items-center justify-center z-40">
    <div class="game-panel max-w-md w-full">
      <h3 class="text-accent text-sm mb-2">{{ SKILL_NAMES[skillType] }} 达到{{ level }}级！</h3>
      <p class="text-xs text-muted mb-4">选择一个专精方向：</p>

      <div class="flex flex-col gap-3">
        <button
          v-for="option in options"
          :key="option.id"
          class="btn text-xs text-left flex flex-col gap-1 py-3"
          @click="handleSelect(option.id)"
        >
          <span class="text-accent">{{ option.name }}</span>
          <span class="text-muted">{{ option.description }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { SkillType, SkillPerk5, SkillPerk10 } from '@/types'

  const props = defineProps<{
    skillType: SkillType
    level: 5 | 10
  }>()

  const emit = defineEmits<{
    select: [perk: SkillPerk5 | SkillPerk10]
  }>()

  const SKILL_NAMES: Record<SkillType, string> = {
    farming: '农耕',
    foraging: '采集',
    fishing: '钓鱼',
    mining: '挖矿'
  }

  interface PerkOption {
    id: SkillPerk5 | SkillPerk10
    name: string
    description: string
  }

  const PERK5_OPTIONS: Record<SkillType, PerkOption[]> = {
    farming: [
      { id: 'harvester', name: '丰收者', description: '作物售价+10%' },
      { id: 'rancher', name: '牧人', description: '动物产品售价+20%' }
    ],
    foraging: [
      { id: 'lumberjack', name: '樵夫', description: '采集时25%概率额外获得木材' },
      { id: 'herbalist', name: '药师', description: '采集物品概率+20%' }
    ],
    fishing: [
      { id: 'fisher', name: '渔夫', description: '鱼售价+25%' },
      { id: 'trapper', name: '捕手', description: '挣扎时成功率+15%' }
    ],
    mining: [
      { id: 'miner', name: '矿工', description: '矿石+1' },
      { id: 'fighter', name: '斗士', description: '受伤-15%' }
    ]
  }

  const PERK10_OPTIONS: Record<SkillType, PerkOption[]> = {
    farming: [
      { id: 'intensive', name: '精耕', description: '收获时20%概率双倍' },
      { id: 'artisan', name: '匠人', description: '加工品售价+25%' }
    ],
    foraging: [
      { id: 'botanist', name: '植物学家', description: '采集物必定优良品质' },
      { id: 'alchemist', name: '炼金师', description: '食物恢复+50%' }
    ],
    fishing: [
      { id: 'angler', name: '垂钓大师', description: '传说鱼出现率大幅提升' },
      { id: 'aquaculture', name: '水产商', description: '鱼售价+50%' }
    ],
    mining: [
      { id: 'prospector', name: '探矿者', description: '矿石25%概率双倍' },
      { id: 'warrior', name: '武者', description: '+25最大生命值' }
    ]
  }

  const options = props.level === 5 ? PERK5_OPTIONS[props.skillType] : PERK10_OPTIONS[props.skillType]

  const handleSelect = (perkId: SkillPerk5 | SkillPerk10) => {
    emit('select', perkId)
  }
</script>
