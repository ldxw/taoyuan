import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { AnimalBuildingType, AnimalType, Animal, Quality, PetState, PetType, IncubationState } from '@/types'
import { ANIMAL_BUILDINGS, ANIMAL_DEFS, HAY_ITEM_ID, getBuildingUpgrade, INCUBATION_MAP } from '@/data'
import { usePlayerStore } from './usePlayerStore'
import { useInventoryStore } from './useInventoryStore'
import { useGameStore } from './useGameStore'
import { useSkillStore } from './useSkillStore'

export const useAnimalStore = defineStore('animal', () => {
  const buildings = ref<{ type: AnimalBuildingType; built: boolean; level: number }[]>([
    { type: 'coop', built: false, level: 0 },
    { type: 'barn', built: false, level: 0 },
    { type: 'stable', built: false, level: 0 }
  ])
  const animals = ref<Animal[]>([])

  /** 鸡舍孵化器状态 (同时最多1个) */
  const incubating = ref<IncubationState | null>(null)

  /** 牲口棚孵化器状态 (同时最多1个, barn level ≥ 2) */
  const barnIncubating = ref<IncubationState | null>(null)

  /** 宠物状态 */
  const pet = ref<PetState | null>(null)

  /** 今天是否已放牧 */
  const grazedToday = ref(false)

  const coopBuilt = computed(() => buildings.value.find(b => b.type === 'coop')?.built ?? false)
  const barnBuilt = computed(() => buildings.value.find(b => b.type === 'barn')?.built ?? false)
  const stableBuilt = computed(() => buildings.value.find(b => b.type === 'stable')?.built ?? false)

  const coopAnimals = computed(() =>
    animals.value.filter(a => {
      const def = ANIMAL_DEFS.find(d => d.type === a.type)
      return def?.building === 'coop'
    })
  )

  const barnAnimals = computed(() =>
    animals.value.filter(a => {
      const def = ANIMAL_DEFS.find(d => d.type === a.type)
      return def?.building === 'barn'
    })
  )

  /** 获取马 */
  const getHorse = computed(() =>
    animals.value.find(a => a.type === 'horse') ?? null
  )

  /** 是否拥有马 */
  const hasHorse = computed(() => getHorse.value !== null)

  /** 建造畜舍 */
  const buildBuilding = (type: AnimalBuildingType): boolean => {
    const playerStore = usePlayerStore()
    const inventoryStore = useInventoryStore()

    const b = buildings.value.find(b => b.type === type)
    if (!b || b.built) return false

    const def = ANIMAL_BUILDINGS.find(d => d.type === type)
    if (!def) return false

    // 检查材料
    for (const mat of def.materialCost) {
      if (inventoryStore.getItemCount(mat.itemId) < mat.quantity) return false
    }
    // 检查金币
    if (!playerStore.spendMoney(def.cost)) return false

    // 扣除材料
    for (const mat of def.materialCost) {
      inventoryStore.removeItem(mat.itemId, mat.quantity)
    }

    b.built = true
    b.level = 1
    return true
  }

  /** 升级畜舍 */
  const upgradeBuilding = (type: AnimalBuildingType): boolean => {
    const playerStore = usePlayerStore()
    const inventoryStore = useInventoryStore()

    const b = buildings.value.find(b => b.type === type)
    if (!b || !b.built || b.level >= 3) return false

    const upgrade = getBuildingUpgrade(type, b.level + 1)
    if (!upgrade) return false

    for (const mat of upgrade.materialCost) {
      if (inventoryStore.getItemCount(mat.itemId) < mat.quantity) return false
    }
    if (!playerStore.spendMoney(upgrade.cost)) return false

    for (const mat of upgrade.materialCost) {
      inventoryStore.removeItem(mat.itemId, mat.quantity)
    }

    b.level++
    return true
  }

  /** 购买动物 */
  const buyAnimal = (animalType: AnimalType, customName: string): boolean => {
    const playerStore = usePlayerStore()

    const def = ANIMAL_DEFS.find(d => d.type === animalType)
    if (!def) return false

    // 检查容量 (level × 4, 马厩固定1)
    const building = buildings.value.find(b => b.type === def.building)
    if (!building?.built) return false
    const maxCapacity = def.building === 'stable' ? 1 : building.level * 4
    const currentCount = animals.value.filter(a => {
      const aDef = ANIMAL_DEFS.find(d => d.type === a.type)
      return aDef?.building === def.building
    }).length
    if (currentCount >= maxCapacity) return false

    // 检查金币
    if (!playerStore.spendMoney(def.cost)) return false

    animals.value.push({
      id: `${animalType}_${Date.now()}`,
      type: animalType,
      name: customName || def.name,
      friendship: 0,
      mood: 128,
      daysOwned: 0,
      daysSinceProduct: 0,
      wasFed: false,
      wasPetted: false
    })
    return true
  }

  /** 喂食所有动物（消耗干草，马也需要喂食） */
  const feedAll = (): { fedCount: number; noHayCount: number } => {
    const inventoryStore = useInventoryStore()

    let fedCount = 0
    let noHayCount = 0
    const unfed = animals.value.filter(a => !a.wasFed)

    for (const animal of unfed) {
      if (inventoryStore.removeItem(HAY_ITEM_ID, 1)) {
        animal.wasFed = true
        fedCount++
      } else {
        noHayCount++
      }
    }
    return { fedCount, noHayCount }
  }

  /** 抚摸动物 */
  const petAnimal = (animalId: string): boolean => {
    const animal = animals.value.find(a => a.id === animalId)
    if (!animal || animal.wasPetted) return false
    animal.wasPetted = true
    const coopmasterBonus = useSkillStore().getSkill('farming').perk10 === 'coopmaster' ? 1.5 : 1.0
    animal.friendship = Math.min(1000, animal.friendship + Math.floor(5 * coopmasterBonus))
    return true
  }

  // ============================================================
  // 孵化器
  // ============================================================

  /** 开始鸡舍孵化 (需鸡舍 ≥ 2 级, 仅限 coop 类蛋) */
  const startIncubation = (itemId: string): { success: boolean; message: string } => {
    const coopBuilding = buildings.value.find(b => b.type === 'coop')
    if (!coopBuilding?.built || coopBuilding.level < 2) {
      return { success: false, message: '需要大型鸡舍（2级）才能使用孵化器。' }
    }
    if (incubating.value) {
      return { success: false, message: '孵化器中已有蛋在孵化。' }
    }
    const mapping = INCUBATION_MAP[itemId]
    if (!mapping || mapping.building !== 'coop') {
      return { success: false, message: '这个物品不能在鸡舍孵化。' }
    }

    const inventoryStore = useInventoryStore()
    if (!inventoryStore.removeItem(itemId, 1)) {
      return { success: false, message: '背包中没有这个物品。' }
    }

    // coopmaster 专精减半孵化时间
    const skillStore = useSkillStore()
    const hasCoopmaster = skillStore.getSkill('farming').perk10 === 'coopmaster'
    const days = hasCoopmaster ? Math.ceil(mapping.days / 2) : mapping.days

    incubating.value = { itemId, animalType: mapping.animalType, daysLeft: days }
    const animalDef = ANIMAL_DEFS.find(d => d.type === mapping.animalType)
    return { success: true, message: `开始孵化${animalDef?.name ?? '动物'}，预计${days}天后孵出。` }
  }

  /** 每日孵化器更新 */
  const dailyIncubatorUpdate = (): { hatched?: { type: AnimalType; name: string } } => {
    if (!incubating.value) return {}

    incubating.value.daysLeft--
    if (incubating.value.daysLeft <= 0) {
      const { animalType, itemId } = incubating.value
      const def = ANIMAL_DEFS.find(d => d.type === animalType)

      // 检查容量
      const building = buildings.value.find(b => b.type === 'coop')
      const maxCapacity = (building?.level ?? 0) * 4
      const currentCount = coopAnimals.value.length

      if (currentCount >= maxCapacity) {
        // 容量满，退回蛋
        const inventoryStore = useInventoryStore()
        inventoryStore.addItem(itemId, 1)
        incubating.value = null
        return {}
      }

      const count = animals.value.filter(a => a.type === animalType).length
      const name = `${def?.name ?? '动物'}${count + 1}`
      animals.value.push({
        id: `${animalType}_${Date.now()}`,
        type: animalType,
        name,
        friendship: 0,
        mood: 200,
        daysOwned: 0,
        daysSinceProduct: 0,
        wasFed: false,
        wasPetted: false
      })
      incubating.value = null
      return { hatched: { type: animalType, name } }
    }

    return {}
  }

  /** 开始牲口棚孵化 (需牲口棚 ≥ 2 级, 仅限 barn 类蛋) */
  const startBarnIncubation = (itemId: string): { success: boolean; message: string } => {
    const barnBuilding = buildings.value.find(b => b.type === 'barn')
    if (!barnBuilding?.built || barnBuilding.level < 2) {
      return { success: false, message: '需要大型牲口棚（2级）才能使用孵化器。' }
    }
    if (barnIncubating.value) {
      return { success: false, message: '牲口棚孵化器中已有蛋在孵化。' }
    }
    const mapping = INCUBATION_MAP[itemId]
    if (!mapping || mapping.building !== 'barn') {
      return { success: false, message: '这个物品不能在牲口棚孵化。' }
    }

    const inventoryStore = useInventoryStore()
    if (!inventoryStore.removeItem(itemId, 1)) {
      return { success: false, message: '背包中没有这个物品。' }
    }

    const skillStore = useSkillStore()
    const hasCoopmaster = skillStore.getSkill('farming').perk10 === 'coopmaster'
    const days = hasCoopmaster ? Math.ceil(mapping.days / 2) : mapping.days

    barnIncubating.value = { itemId, animalType: mapping.animalType, daysLeft: days }
    const animalDef = ANIMAL_DEFS.find(d => d.type === mapping.animalType)
    return { success: true, message: `开始在牲口棚孵化${animalDef?.name ?? '动物'}，预计${days}天后孵出。` }
  }

  /** 每日牲口棚孵化器更新 */
  const dailyBarnIncubatorUpdate = (): { hatched?: { type: AnimalType; name: string } } => {
    if (!barnIncubating.value) return {}

    barnIncubating.value.daysLeft--
    if (barnIncubating.value.daysLeft <= 0) {
      const { animalType, itemId } = barnIncubating.value
      const def = ANIMAL_DEFS.find(d => d.type === animalType)

      const building = buildings.value.find(b => b.type === 'barn')
      const maxCapacity = (building?.level ?? 0) * 4
      const currentCount = barnAnimals.value.length

      if (currentCount >= maxCapacity) {
        const inventoryStore = useInventoryStore()
        inventoryStore.addItem(itemId, 1)
        barnIncubating.value = null
        return {}
      }

      const count = animals.value.filter(a => a.type === animalType).length
      const name = `${def?.name ?? '动物'}${count + 1}`
      animals.value.push({
        id: `${animalType}_${Date.now()}`,
        type: animalType,
        name,
        friendship: 0,
        mood: 200,
        daysOwned: 0,
        daysSinceProduct: 0,
        wasFed: false,
        wasPetted: false
      })
      barnIncubating.value = null
      return { hatched: { type: animalType, name } }
    }

    return {}
  }

  // ============================================================
  // 宠物
  // ============================================================

  /** 领养宠物 */
  const adoptPet = (type: PetType, name: string) => {
    pet.value = { type, name, friendship: 0, wasPetted: false }
  }

  /** 抚摸宠物 */
  const petThePet = (): boolean => {
    if (!pet.value || pet.value.wasPetted) return false
    pet.value.wasPetted = true
    pet.value.friendship = Math.min(1000, pet.value.friendship + 5)
    return true
  }

  /** 每日宠物更新 */
  const dailyPetUpdate = (): { item?: string } => {
    if (!pet.value) return {}

    // 未抚摸扣好感
    if (!pet.value.wasPetted) {
      pet.value.friendship = Math.max(0, pet.value.friendship - 2)
    }
    pet.value.wasPetted = false

    // 高好感带回采集物
    if (pet.value.friendship >= 800 && Math.random() < 0.1) {
      const finds = ['herb', 'wild_berry', 'pine_cone', 'bamboo_shoot', 'wild_mushroom']
      const item = finds[Math.floor(Math.random() * finds.length)]!
      const inventoryStore = useInventoryStore()
      inventoryStore.addItem(item, 1)
      return { item }
    }
    return {}
  }

  // ============================================================
  // 放牧
  // ============================================================

  /** 放牧（春/夏/秋非雨天；冬季仅牦牛可放牧） */
  const grazeAnimals = (): { success: boolean; count: number; message: string; bonusProducts?: { itemId: string; quality: Quality }[] } => {
    if (grazedToday.value) {
      return { success: false, count: 0, message: '今天已经放牧过了。' }
    }

    const gameStore = useGameStore()
    if (gameStore.isRainy) {
      return { success: false, count: 0, message: '雨天不能放牧。' }
    }

    // 只有喂食过的动物可放牧（排除马）
    let grazeable: Animal[]
    if (gameStore.season === 'winter') {
      // 冬季仅牦牛可放牧
      grazeable = animals.value.filter(a => a.wasFed && a.type === 'yak')
      if (grazeable.length === 0) {
        return { success: false, count: 0, message: '冬天只有牦牛可以放牧，且需先喂食。' }
      }
    } else {
      grazeable = animals.value.filter(a => a.wasFed && a.type !== 'horse')
      if (grazeable.length === 0) {
        return { success: false, count: 0, message: '没有已喂食的动物可放牧。' }
      }
    }

    grazedToday.value = true
    const bonusProducts: { itemId: string; quality: Quality }[] = []

    for (const animal of grazeable) {
      animal.mood = 255
      animal.friendship = Math.min(1000, animal.friendship + 10)

      // 猪放牧时额外找到松露
      if (animal.type === 'pig') {
        bonusProducts.push({ itemId: 'truffle', quality: getAnimalProductQuality(animal.friendship) })
      }
    }

    // 将猪找到的松露直接加入背包
    if (bonusProducts.length > 0) {
      const inventoryStore = useInventoryStore()
      for (const bp of bonusProducts) {
        inventoryStore.addItem(bp.itemId, 1, bp.quality)
      }
    }

    const pigCount = bonusProducts.length
    let message = `${grazeable.length}只动物在草地上愉快地觅食。`
    if (pigCount > 0) {
      message += `猪找到了${pigCount}个松露！`
    }

    return { success: true, count: grazeable.length, message, bonusProducts: bonusProducts.length > 0 ? bonusProducts : undefined }
  }

  /** 每日更新：产品收集、心情/友好度变化 */
  const dailyUpdate = (): { products: { itemId: string; quality: Quality }[] } => {
    const products: { itemId: string; quality: Quality }[] = []
    const skillStore = useSkillStore()
    const gameStore = useGameStore()
    const coopmasterBonus = skillStore.getSkill('farming').perk10 === 'coopmaster' ? 1.5 : 1.0
    const hasShepherd = skillStore.getSkill('farming').perk10 === 'shepherd'
    for (const animal of animals.value) {
      animal.daysOwned++
      animal.daysSinceProduct++

      // 友好度变化
      const friendshipMultiplier = gameStore.farmMapType === 'meadowlands' ? 1.5 : 1.0
      if (!animal.wasFed) {
        animal.friendship = Math.max(0, animal.friendship - 10)
      }
      // 牦牛: 未抚摸不扣友好度
      if (!animal.wasPetted && animal.type !== 'yak') {
        animal.friendship = Math.max(0, animal.friendship - 5)
      }
      if (animal.wasFed && animal.wasPetted) {
        animal.friendship = Math.min(1000, animal.friendship + Math.floor(15 * friendshipMultiplier * coopmasterBonus))
      } else if (animal.wasFed) {
        animal.friendship = Math.min(1000, animal.friendship + Math.floor(5 * friendshipMultiplier * coopmasterBonus))
      }

      // 心情根据喂食调整
      // 骆驼: 夏季未喂食不扣心情(耐热)
      if (animal.wasFed) {
        animal.mood = Math.min(255, animal.mood + 30)
      } else if (animal.type === 'camel' && gameStore.season === 'summer') {
        // 骆驼夏季耐热，未喂食不扣心情
      } else {
        animal.mood = Math.max(0, animal.mood - 50)
      }

      // 产品检查（跳过马，马无产出）
      const def = ANIMAL_DEFS.find(d => d.type === animal.type)
      if (def && def.produceDays > 0 && animal.daysSinceProduct >= def.produceDays && animal.wasFed) {
        let quality = getAnimalProductQuality(animal.friendship)
        // 牧羊人专精：品质提升一档
        if (hasShepherd) {
          const qualityOrder: Quality[] = ['normal', 'fine', 'excellent', 'supreme']
          const idx = qualityOrder.indexOf(quality)
          quality = qualityOrder[Math.min(idx + 1, qualityOrder.length - 1)]!
        }
        products.push({ itemId: def.productId, quality })
        animal.daysSinceProduct = 0
      }

      // 兔子: 好感≥600时4%概率额外产出幸运兔脚
      if (animal.type === 'rabbit' && animal.friendship >= 600 && Math.random() < 0.04) {
        products.push({ itemId: 'rabbit_foot', quality: getAnimalProductQuality(animal.friendship) })
      }

      // 重置每日状态
      animal.wasFed = false
      animal.wasPetted = false
    }

    // 重置放牧状态
    grazedToday.value = false

    return { products }
  }

  /** 根据友好度决定产品品质 */
  const getAnimalProductQuality = (friendship: number): Quality => {
    if (friendship >= 800) return 'supreme'
    if (friendship >= 500) return 'excellent'
    if (friendship >= 200) return 'fine'
    return 'normal'
  }

  const serialize = () => {
    return {
      buildings: buildings.value,
      animals: animals.value,
      incubating: incubating.value,
      barnIncubating: barnIncubating.value,
      pet: pet.value,
      grazedToday: grazedToday.value
    }
  }

  const deserialize = (data: any) => {
    if (data.buildings) {
      const savedBuildings = data.buildings.map((b: any) => ({ ...b, level: b.level ?? (b.built ? 1 : 0) }))
      // 兼容旧存档：补充缺少的 stable 建筑
      const savedTypes = new Set(savedBuildings.map((b: any) => b.type))
      if (!savedTypes.has('stable')) {
        savedBuildings.push({ type: 'stable', built: false, level: 0 })
      }
      buildings.value = savedBuildings
    }
    if (data.animals) {
      animals.value = data.animals
    }
    incubating.value = data.incubating ?? null
    barnIncubating.value = data.barnIncubating ?? null
    pet.value = data.pet ?? null
    grazedToday.value = data.grazedToday ?? false
  }

  return {
    buildings,
    animals,
    incubating,
    barnIncubating,
    pet,
    grazedToday,
    coopBuilt,
    barnBuilt,
    stableBuilt,
    coopAnimals,
    barnAnimals,
    getHorse,
    hasHorse,
    buildBuilding,
    upgradeBuilding,
    buyAnimal,
    feedAll,
    petAnimal,
    startIncubation,
    dailyIncubatorUpdate,
    startBarnIncubation,
    dailyBarnIncubatorUpdate,
    adoptPet,
    petThePet,
    dailyPetUpdate,
    grazeAnimals,
    dailyUpdate,
    getAnimalProductQuality,
    serialize,
    deserialize
  }
})
