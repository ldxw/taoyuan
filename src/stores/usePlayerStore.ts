import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import {
  LATE_NIGHT_STAMINA_RECOVERY,
  PASSOUT_STAMINA_RECOVERY,
  PASSOUT_MONEY_PENALTY_RATE,
  PASSOUT_MONEY_PENALTY_CAP
} from '@/data/timeConstants'
import { useSkillStore } from './useSkillStore'

/** 最大体力阶梯 */
const STAMINA_CAPS = [120, 150, 180]

/** HP 常量 */
const BASE_MAX_HP = 100
const HP_PER_MINING_LEVEL = 5
const FIGHTER_HP_BONUS = 15
const WARRIOR_HP_BONUS = 25

export const usePlayerStore = defineStore('player', () => {
  const money = ref(500)
  const stamina = ref(120)
  const maxStamina = ref(120)
  const staminaCapLevel = ref(0) // 0=120, 1=150, 2=180

  // HP 系统
  const hp = ref(BASE_MAX_HP)
  const baseMaxHp = ref(BASE_MAX_HP)

  const isExhausted = computed(() => stamina.value <= 15)
  const staminaPercent = computed(() => Math.round((stamina.value / maxStamina.value) * 100))

  /** 计算当前最大 HP（基础 + 挖矿等级 + 专精加成） */
  const getMaxHp = (): number => {
    const skillStore = useSkillStore()
    let bonus = skillStore.miningLevel * HP_PER_MINING_LEVEL
    const perk5 = skillStore.getSkill('mining').perk5
    const perk10 = skillStore.getSkill('mining').perk10
    if (perk5 === 'fighter') bonus += FIGHTER_HP_BONUS
    if (perk10 === 'warrior') bonus += WARRIOR_HP_BONUS
    return baseMaxHp.value + bonus
  }

  const getHpPercent = (): number => {
    return Math.round((hp.value / getMaxHp()) * 100)
  }

  const getIsLowHp = (): boolean => {
    return hp.value <= getMaxHp() * 0.25
  }

  /** 消耗体力，返回是否成功 */
  const consumeStamina = (amount: number): boolean => {
    if (stamina.value < amount) return false
    stamina.value -= amount
    return true
  }

  /** 恢复体力 */
  const restoreStamina = (amount: number) => {
    stamina.value = Math.min(stamina.value + amount, maxStamina.value)
  }

  /** 受到伤害（扣 HP），返回实际伤害值 */
  const takeDamage = (amount: number): number => {
    const actual = Math.min(amount, hp.value)
    hp.value -= actual
    return actual
  }

  /** 恢复生命值 */
  const restoreHealth = (amount: number) => {
    hp.value = Math.min(hp.value + amount, getMaxHp())
  }

  /**
   * 每日重置
   * - 正常：满体力 + 满HP
   * - 晚睡：75% 体力 + 满HP
   * - 昏倒：50% 体力 + 满HP + 扣10%金币
   */
  const dailyReset = (mode: 'normal' | 'late' | 'passout'): { moneyLost: number } => {
    let moneyLost = 0
    switch (mode) {
      case 'normal':
        stamina.value = maxStamina.value
        break
      case 'late':
        stamina.value = Math.floor(maxStamina.value * LATE_NIGHT_STAMINA_RECOVERY)
        break
      case 'passout':
        stamina.value = Math.floor(maxStamina.value * PASSOUT_STAMINA_RECOVERY)
        moneyLost = Math.min(Math.floor(money.value * PASSOUT_MONEY_PENALTY_RATE), PASSOUT_MONEY_PENALTY_CAP)
        money.value -= moneyLost
        break
    }
    // HP 每天都回满
    hp.value = getMaxHp()
    return { moneyLost }
  }

  /** 提升体力上限 */
  const upgradeMaxStamina = (): boolean => {
    if (staminaCapLevel.value >= STAMINA_CAPS.length - 1) return false
    staminaCapLevel.value++
    maxStamina.value = STAMINA_CAPS[staminaCapLevel.value]!
    return true
  }

  /** 花费金币，返回是否成功 */
  const spendMoney = (amount: number): boolean => {
    if (money.value < amount) return false
    money.value -= amount
    return true
  }

  /** 获得金币 */
  const earnMoney = (amount: number) => {
    money.value += amount
  }

  const serialize = () => {
    return {
      money: money.value,
      stamina: stamina.value,
      maxStamina: maxStamina.value,
      staminaCapLevel: staminaCapLevel.value,
      hp: hp.value,
      baseMaxHp: baseMaxHp.value
    }
  }

  const deserialize = (data: ReturnType<typeof serialize>) => {
    money.value = data.money
    stamina.value = data.stamina
    maxStamina.value = data.maxStamina
    staminaCapLevel.value = data.staminaCapLevel
    hp.value = (data as any).hp ?? BASE_MAX_HP
    baseMaxHp.value = (data as any).baseMaxHp ?? BASE_MAX_HP
  }

  return {
    money,
    stamina,
    maxStamina,
    staminaCapLevel,
    hp,
    baseMaxHp,
    isExhausted,
    staminaPercent,
    getMaxHp,
    getHpPercent,
    getIsLowHp,
    consumeStamina,
    restoreStamina,
    takeDamage,
    restoreHealth,
    dailyReset,
    upgradeMaxStamina,
    spendMoney,
    earnMoney,
    serialize,
    deserialize
  }
})
