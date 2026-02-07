import type { Season } from '@/types'

/** 季节事件定义 */
export interface SeasonEventDef {
  id: string
  name: string
  season: Season
  day: number // 触发日期
  description: string
  /** 事件效果 */
  effects: {
    friendshipBonus?: number // 所有NPC好感加成
    moneyReward?: number // 金币奖励
    itemReward?: { itemId: string; quantity: number }[]
    staminaBonus?: number // 额外体力恢复
  }
  /** 事件文案 */
  narrative: string[]
  /** 是否为互动节日（有小游戏） */
  interactive?: boolean
  /** 互动节日类型 */
  festivalType?: 'fishing_contest' | 'harvest_fair'
}

export const SEASON_EVENTS: SeasonEventDef[] = [
  {
    id: 'spring_festival',
    name: '春耕祭',
    season: 'spring',
    day: 8,
    description: '全村庆祝春耕开始，祈求丰收。',
    effects: {
      friendshipBonus: 5,
      itemReward: [{ itemId: 'seed_cabbage', quantity: 5 }]
    },
    narrative: [
      '桃源乡一年一度的春耕祭到了！',
      '村民们聚集在广场，陈伯主持祈福仪式。',
      '柳娘在树上挂满了红色绸带，微风拂过像是一片红云。',
      '「祝愿今年风调雨顺，五谷丰登！」',
      '陈伯赠送了一些种子作为祝福。',
      '所有村民好感度+5。'
    ]
  },
  {
    id: 'summer_lantern',
    name: '荷灯节·钓鱼大赛',
    season: 'summer',
    day: 15,
    description: '河边放灯祈福，还有激动人心的钓鱼大赛！',
    effects: {
      friendshipBonus: 5
    },
    narrative: [
      '夏夜的清溪边，村民们聚在一起放荷灯。',
      '秋月早早准备了各式各样的荷花灯。',
      '「快来快来！今年加了钓鱼大赛环节！」',
      '柔和的灯光在水面上漂流，映着满天星斗。',
      '所有村民好感度+5。'
    ],
    interactive: true,
    festivalType: 'fishing_contest'
  },
  {
    id: 'autumn_harvest',
    name: '丰收宴·农展会',
    season: 'autumn',
    day: 22,
    description: '比拼收成，看谁的展品最出色！',
    effects: {
      friendshipBonus: 5,
      staminaBonus: 30
    },
    narrative: [
      '秋天的桃源乡充满了丰收的气息。',
      '村民们带着自己最好的收成齐聚广场。',
      '陈伯宣布：「今年举办农展会，大家拿出最好的东西来！」',
      '丰盛的宴席让你恢复了额外30点体力。',
      '所有村民好感度+5。'
    ],
    interactive: true,
    festivalType: 'harvest_fair'
  },
  {
    id: 'winter_new_year',
    name: '除夕守岁',
    season: 'winter',
    day: 28,
    description: '年终团聚，辞旧迎新。',
    effects: {
      friendshipBonus: 10,
      moneyReward: 300,
      itemReward: [
        { itemId: 'herb', quantity: 3 },
        { itemId: 'firewood', quantity: 5 }
      ]
    },
    narrative: [
      '冬季第28天——除夕之夜。',
      '桃源乡家家户户张灯结彩，炊烟袅袅。',
      '柳娘把你拉到村长家里：「一个人过年太冷清了，来我家吧。」',
      '陈伯端来了热气腾腾的年夜饭，林老递上一杯暖酒。',
      '阿石笨拙地递过一个红包：「……新年快乐。」',
      '秋月和小满在院子里放起了鞭炮，欢笑声响彻夜空。',
      '「新的一年，桃源乡会越来越好的。」林老说。',
      '这是你在桃源乡度过的第一个新年。',
      '收到红包300文和村民的礼物。所有村民好感度+10。'
    ]
  }
]

/** 根据季节和日期获取当天事件 */
export const getTodayEvent = (season: Season, day: number): SeasonEventDef | undefined => {
  return SEASON_EVENTS.find(e => e.season === season && e.day === day)
}
