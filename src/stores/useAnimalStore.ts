import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { AnimalBuildingType, AnimalType, Animal, Quality } from '@/types'
import { ANIMAL_BUILDINGS, ANIMAL_DEFS, HAY_ITEM_ID } from '@/data'
import { usePlayerStore } from './usePlayerStore'
import { useInventoryStore } from './useInventoryStore'
import { useGameStore } from './useGameStore'

export const useAnimalStore = defineStore('animal', () => {
  const buildings = ref<{ type: AnimalBuildingType; built: boolean }[]>([
    { type: 'coop', built: false },
    { type: 'barn', built: false }
  ])
  const animals = ref<Animal[]>([])

  const coopBuilt = computed(() => buildings.value.find(b => b.type === 'coop')?.built ?? false)
  const barnBuilt = computed(() => buildings.value.find(b => b.type === 'barn')?.built ?? false)

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
    return true
  }

  /** 购买动物 */
  const buyAnimal = (animalType: AnimalType, customName: string): boolean => {
    const playerStore = usePlayerStore()

    const def = ANIMAL_DEFS.find(d => d.type === animalType)
    if (!def) return false

    // 检查畜舍是否已建
    const building = buildings.value.find(b => b.type === def.building)
    if (!building?.built) return false

    // 检查容量
    const buildingDef = ANIMAL_BUILDINGS.find(d => d.type === def.building)
    if (!buildingDef) return false
    const currentCount = animals.value.filter(a => {
      const aDef = ANIMAL_DEFS.find(d => d.type === a.type)
      return aDef?.building === def.building
    }).length
    if (currentCount >= buildingDef.capacity) return false

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

  /** 喂食所有动物（消耗干草） */
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
    animal.friendship = Math.min(1000, animal.friendship + 5)
    return true
  }

  /** 每日更新：产品收集、心情/友好度变化 */
  const dailyUpdate = (): { products: { itemId: string; quality: Quality }[] } => {
    const products: { itemId: string; quality: Quality }[] = []
    for (const animal of animals.value) {
      animal.daysOwned++
      animal.daysSinceProduct++

      // 友好度变化
      const friendshipMultiplier = useGameStore().farmMapType === 'meadowlands' ? 1.5 : 1.0
      if (!animal.wasFed) {
        animal.friendship = Math.max(0, animal.friendship - 10)
      }
      if (!animal.wasPetted) {
        animal.friendship = Math.max(0, animal.friendship - 5)
      }
      if (animal.wasFed && animal.wasPetted) {
        animal.friendship = Math.min(1000, animal.friendship + Math.floor(15 * friendshipMultiplier))
      } else if (animal.wasFed) {
        animal.friendship = Math.min(1000, animal.friendship + Math.floor(5 * friendshipMultiplier))
      }

      // 心情根据喂食调整
      if (animal.wasFed) {
        animal.mood = Math.min(255, animal.mood + 30)
      } else {
        animal.mood = Math.max(0, animal.mood - 50)
      }

      // 产品检查
      const def = ANIMAL_DEFS.find(d => d.type === animal.type)
      if (def && animal.daysSinceProduct >= def.produceDays && animal.wasFed) {
        const quality = getAnimalProductQuality(animal.friendship)
        products.push({ itemId: def.productId, quality })
        animal.daysSinceProduct = 0
      }

      // 重置每日状态
      animal.wasFed = false
      animal.wasPetted = false
    }
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
    return { buildings: buildings.value, animals: animals.value }
  }

  const deserialize = (data: any) => {
    if (data.buildings) {
      buildings.value = data.buildings
    }
    if (data.animals) {
      animals.value = data.animals
    }
  }

  return {
    buildings,
    animals,
    coopBuilt,
    barnBuilt,
    coopAnimals,
    barnAnimals,
    buildBuilding,
    buyAnimal,
    feedAll,
    petAnimal,
    dailyUpdate,
    getAnimalProductQuality,
    serialize,
    deserialize
  }
})
