import type { FishDef } from '@/types'

/** 所有鱼类定义 */
export const FISH: FishDef[] = [
  {
    id: 'crucian',
    name: '鲫鱼',
    season: ['spring', 'summer', 'autumn', 'winter'],
    weather: ['any'],
    difficulty: 'easy',
    sellPrice: 15,
    requiredReel: 2,
    rounds: 3,
    description: '最常见的淡水鱼，新手的好伙伴。'
  },
  {
    id: 'carp',
    name: '鲤鱼',
    season: ['spring', 'summer'],
    weather: ['sunny'],
    difficulty: 'easy',
    sellPrice: 25,
    requiredReel: 2,
    rounds: 4,
    description: '晴天在溪边常能见到的鱼。'
  },
  {
    id: 'grass_carp',
    name: '草鱼',
    season: ['summer', 'autumn'],
    weather: ['any'],
    difficulty: 'normal',
    sellPrice: 40,
    requiredReel: 3,
    rounds: 4,
    description: '体型较大的淡水鱼。'
  },
  {
    id: 'bass',
    name: '鲈鱼',
    season: ['autumn'],
    weather: ['rainy', 'stormy'],
    difficulty: 'normal',
    sellPrice: 60,
    requiredReel: 3,
    rounds: 5,
    description: '秋雨中出没的美味鱼。'
  },
  {
    id: 'koi',
    name: '锦鲤',
    season: ['spring'],
    weather: ['sunny'],
    difficulty: 'hard',
    sellPrice: 120,
    requiredReel: 4,
    rounds: 5,
    description: '华丽的锦鲤，非常珍贵。'
  },
  {
    id: 'giant_salamander',
    name: '娃娃鱼',
    season: ['winter'],
    weather: ['snowy'],
    difficulty: 'legendary',
    sellPrice: 300,
    requiredReel: 5,
    rounds: 5,
    description: '传说中的神秘生物，只在冬雪中出现。'
  },
  {
    id: 'silver_carp',
    name: '银鲢',
    season: ['spring', 'summer'],
    weather: ['any'],
    difficulty: 'easy',
    sellPrice: 20,
    requiredReel: 2,
    rounds: 3,
    description: '常见的银鲢鱼。'
  },
  {
    id: 'catfish',
    name: '鲶鱼',
    season: ['summer'],
    weather: ['rainy', 'stormy'],
    difficulty: 'normal',
    sellPrice: 45,
    requiredReel: 3,
    rounds: 4,
    description: '雨天活跃的鲶鱼。'
  },
  {
    id: 'eel',
    name: '鳗鱼',
    season: ['summer', 'autumn'],
    weather: ['rainy'],
    difficulty: 'hard',
    sellPrice: 85,
    requiredReel: 4,
    rounds: 5,
    description: '滑溜的鳗鱼，不易捕获。'
  },
  {
    id: 'golden_carp',
    name: '金鲤',
    season: ['spring'],
    weather: ['sunny'],
    difficulty: 'hard',
    sellPrice: 150,
    requiredReel: 4,
    rounds: 5,
    description: '闪闪发光的金色鲤鱼。'
  },
  {
    id: 'mandarin_fish',
    name: '桂花鱼',
    season: ['autumn'],
    weather: ['sunny'],
    difficulty: 'normal',
    sellPrice: 70,
    requiredReel: 3,
    rounds: 4,
    description: '肉质鲜美的桂花鱼。'
  },
  {
    id: 'cave_loach',
    name: '矿洞泥鳅',
    season: ['spring', 'summer', 'autumn', 'winter'],
    weather: ['any'],
    difficulty: 'normal',
    sellPrice: 35,
    requiredReel: 3,
    rounds: 4,
    description: '矿洞地下水中的泥鳅。',
    location: 'mine'
  },
  {
    id: 'cave_blindfish',
    name: '洞穴盲鱼',
    season: ['spring', 'summer', 'autumn', 'winter'],
    weather: ['any'],
    difficulty: 'hard',
    sellPrice: 100,
    requiredReel: 4,
    rounds: 5,
    description: '矿洞深处的珍稀盲鱼。',
    location: 'mine'
  },
  {
    id: 'sturgeon',
    name: '鲟鱼',
    season: ['summer', 'autumn'],
    weather: ['sunny'],
    difficulty: 'hard',
    sellPrice: 130,
    requiredReel: 4,
    rounds: 5,
    description: '体型庞大的古老鱼种。'
  },
  {
    id: 'ice_fish',
    name: '冰鱼',
    season: ['winter'],
    weather: ['snowy'],
    difficulty: 'normal',
    sellPrice: 55,
    requiredReel: 3,
    rounds: 4,
    description: '冰冷水域中的小鱼。'
  },
  {
    id: 'dragonfish',
    name: '龙鱼',
    season: ['summer'],
    weather: ['stormy'],
    difficulty: 'legendary',
    sellPrice: 500,
    requiredReel: 5,
    rounds: 5,
    description: '暴风雨中才会出现的传说之鱼。'
  }
]

/** 根据ID获取鱼 */
export const getFishById = (id: string): FishDef | undefined => {
  return FISH.find(f => f.id === id)
}

/** 获取当前季节和天气可钓到的鱼 */
export const getAvailableFish = (season: string, weather: string): FishDef[] => {
  return FISH.filter(f => f.season.includes(season as any) && (f.weather.includes('any') || f.weather.includes(weather as any)))
}
