import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { SkillType, SkillState, SkillPerk5, SkillPerk10 } from '@/types'

/** 各等级所需累计经验（6-10级减少约15%） */
const EXP_TABLE = [0, 100, 250, 500, 800, 1200, 1500, 1950, 2500, 3200, 4200]

/** 创建初始技能状态 */
const createSkill = (type: SkillType): SkillState => {
  return { type, exp: 0, level: 0, perk5: null, perk10: null }
}

export const useSkillStore = defineStore('skill', () => {
  const skills = ref<SkillState[]>([createSkill('farming'), createSkill('foraging'), createSkill('fishing'), createSkill('mining')])

  const getSkill = (type: SkillType): SkillState => {
    return skills.value.find(s => s.type === type)!
  }

  const farmingLevel = computed(() => getSkill('farming').level)
  const fishingLevel = computed(() => getSkill('fishing').level)
  const miningLevel = computed(() => getSkill('mining').level)
  const foragingLevel = computed(() => getSkill('foraging').level)

  /** 增加经验并自动升级 */
  const addExp = (type: SkillType, amount: number): { leveledUp: boolean; newLevel: number } => {
    const skill = getSkill(type)
    skill.exp += amount
    let leveledUp = false

    while (skill.level < 10) {
      const nextLevelExp = EXP_TABLE[skill.level + 1]!
      if (skill.exp >= nextLevelExp) {
        skill.level++
        leveledUp = true
      } else {
        break
      }
    }

    return { leveledUp, newLevel: skill.level }
  }

  /** 获取升级到下一级所需经验 */
  const getExpToNextLevel = (type: SkillType): { current: number; required: number } | null => {
    const skill = getSkill(type)
    if (skill.level >= 10) return null
    return { current: skill.exp, required: EXP_TABLE[skill.level + 1]! }
  }

  /** 计算技能对体力消耗的减免 (每级减少0.1，即10%累计) */
  const getStaminaReduction = (type: SkillType): number => {
    return getSkill(type).level * 0.1
  }

  /** 设置等级5专精 */
  const setPerk5 = (type: SkillType, perk: SkillPerk5): boolean => {
    const skill = getSkill(type)
    if (skill.level < 5 || skill.perk5 !== null) return false
    skill.perk5 = perk
    return true
  }

  /** 设置等级10专精 */
  const setPerk10 = (type: SkillType, perk: SkillPerk10): boolean => {
    const skill = getSkill(type)
    if (skill.level < 10 || skill.perk10 !== null) return false
    skill.perk10 = perk
    return true
  }

  /** 判断作物品质（基于农耕等级） */
  const rollCropQuality = (): 'normal' | 'fine' | 'excellent' | 'supreme' => {
    return rollCropQualityWithBonus(0)
  }

  /** 判断作物品质（带肥料加成） */
  const rollCropQualityWithBonus = (qualityBonus: number): 'normal' | 'fine' | 'excellent' | 'supreme' => {
    const level = farmingLevel.value
    const roll = Math.random()

    if (level >= 9 && roll < 0.05 + qualityBonus * 0.5) return 'supreme'
    if (level >= 6 && roll < 0.15 + qualityBonus) return 'excellent'
    if (level >= 3 && roll < 0.3 + qualityBonus) return 'fine'
    return 'normal'
  }

  /** 判断采集物品质（基于采集等级和专精） */
  const rollForageQuality = (): 'normal' | 'fine' | 'excellent' | 'supreme' => {
    const skill = getSkill('foraging')
    if (skill.perk10 === 'botanist') return 'excellent'
    const level = skill.level
    const roll = Math.random()

    if (level >= 9 && roll < 0.05) return 'supreme'
    if (level >= 6 && roll < 0.12) return 'excellent'
    if (level >= 3 && roll < 0.25) return 'fine'
    return 'normal'
  }

  const serialize = () => {
    return { skills: skills.value }
  }

  const deserialize = (data: ReturnType<typeof serialize>) => {
    skills.value = data.skills
  }

  return {
    skills,
    farmingLevel,
    fishingLevel,
    miningLevel,
    foragingLevel,
    getSkill,
    addExp,
    getExpToNextLevel,
    getStaminaReduction,
    setPerk5,
    setPerk10,
    rollCropQuality,
    rollCropQualityWithBonus,
    rollForageQuality,
    serialize,
    deserialize
  }
})
