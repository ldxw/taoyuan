import type { MonsterDef, MineFloorDef } from '@/types'

/** 怪物定义 */
export const MONSTERS: Record<string, MonsterDef> = {
  mud_worm: {
    id: 'mud_worm',
    name: '泥虫',
    hp: 15,
    attack: 8,
    defense: 1,
    expReward: 5,
    drops: [
      { itemId: 'copper_ore', chance: 0.5 },
      { itemId: 'quartz', chance: 0.1 }
    ],
    description: '蠕动的泥虫，不太危险。'
  },
  stone_crab: {
    id: 'stone_crab',
    name: '石蟹',
    hp: 25,
    attack: 10,
    defense: 3,
    expReward: 8,
    drops: [
      { itemId: 'copper_ore', chance: 0.6 },
      { itemId: 'iron_ore', chance: 0.15 }
    ],
    description: '硬壳甲虫，防御较高。'
  },
  ice_bat: {
    id: 'ice_bat',
    name: '冰蝠',
    hp: 30,
    attack: 12,
    defense: 2,
    expReward: 12,
    drops: [
      { itemId: 'iron_ore', chance: 0.5 },
      { itemId: 'jade', chance: 0.1 }
    ],
    description: '寒冰中飞舞的蝙蝠。'
  },
  ghost: {
    id: 'ghost',
    name: '幽灵',
    hp: 20,
    attack: 15,
    defense: 0,
    expReward: 15,
    drops: [
      { itemId: 'jade', chance: 0.2 },
      { itemId: 'quartz', chance: 0.3 }
    ],
    description: '飘忽不定的幽灵，攻高防低。'
  },
  fire_bat: {
    id: 'fire_bat',
    name: '火蝠',
    hp: 35,
    attack: 12,
    defense: 3,
    expReward: 18,
    drops: [
      { itemId: 'gold_ore', chance: 0.55 },
      { itemId: 'ruby', chance: 0.15 }
    ],
    description: '浑身燃烧的蝙蝠。'
  },
  shadow_warrior: {
    id: 'shadow_warrior',
    name: '暗影武士',
    hp: 50,
    attack: 13,
    defense: 4,
    expReward: 28,
    drops: [
      { itemId: 'gold_ore', chance: 0.65 },
      { itemId: 'ruby', chance: 0.25 }
    ],
    description: '矿洞深处的强大敌人。'
  }
}

/** 生成矿洞层数据 */
const generateFloors = (): MineFloorDef[] => {
  const floors: MineFloorDef[] = []
  for (let i = 1; i <= 30; i++) {
    let zone: MineFloorDef['zone']
    let ores: string[]
    let monsters: MonsterDef[]

    if (i <= 10) {
      zone = 'shallow'
      ores = ['copper_ore', 'quartz']
      monsters = [MONSTERS.mud_worm!, MONSTERS.stone_crab!]
    } else if (i <= 20) {
      zone = 'deep'
      ores = ['iron_ore', 'jade']
      monsters = [MONSTERS.ice_bat!, MONSTERS.ghost!]
    } else {
      zone = 'lava'
      ores = ['gold_ore', 'ruby']
      monsters = [MONSTERS.fire_bat!, MONSTERS.shadow_warrior!]
    }

    floors.push({
      floor: i,
      zone,
      ores,
      monsters,
      isSafePoint: i % 10 === 0
    })
  }
  return floors
}

export const MINE_FLOORS = generateFloors()

/** 获取指定层数据 */
export const getFloor = (floor: number): MineFloorDef | undefined => {
  return MINE_FLOORS.find(f => f.floor === floor)
}

/** 矿洞区域中文名 */
export const ZONE_NAMES: Record<MineFloorDef['zone'], string> = {
  shallow: '浅矿·土石洞穴',
  deep: '深矿·冰霜暗河',
  lava: '熔岩层·地火暗涌'
}
