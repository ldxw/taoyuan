import type { NpcDef } from '@/types'

/** 所有NPC定义 */
export const NPCS: NpcDef[] = [
  {
    id: 'chen_bo',
    name: '陈伯',
    role: '万物铺老板',
    personality: '热心豪爽',
    birthday: { season: 'spring', day: 8 },
    lovedItems: ['tea', 'osmanthus'],
    likedItems: ['cabbage', 'rice', 'potato'],
    hatedItems: ['copper_ore', 'quartz'],
    dialogues: {
      stranger: ['客官，初来乍到吧？老朽陈伯，万物铺就是我开的。', '有什么需要的尽管来，童叟无欺。'],
      acquaintance: ['哈哈，又来了！今天想买点什么？', '最近进了些好货，你来看看。'],
      friendly: ['你跟你祖父年轻时一个样，能吃苦。', '有些好东西，我只留给老朋友。'],
      bestFriend: ['你就像我自己的孩子一样。', '这铺子，将来说不定就交给你了……开个玩笑。']
    }
  },
  {
    id: 'liu_niang',
    name: '柳娘',
    role: '村长的女儿',
    personality: '温柔聪慧',
    birthday: { season: 'summer', day: 14 },
    lovedItems: ['chrysanthemum', 'osmanthus'],
    likedItems: ['tea', 'wintersweet'],
    hatedItems: ['iron_ore', 'firewood'],
    dialogues: {
      stranger: ['你好，你是新来的田庄主人吧？我是柳娘。', '桃源乡很美的，你会喜欢这里。'],
      acquaintance: ['今天天气不错，适合出门走走。', '我在读一本古诗集，要不要一起看看？'],
      friendly: ['有你在，村子热闹了不少呢。', '我做了些桂花糕，尝一块吧。'],
      bestFriend: ['和你聊天总是很开心……', '这朵花送给你，是我在山上找到的。']
    },
    marriageable: true,
    heartEventIds: ['liu_niang_heart_3', 'liu_niang_heart_5', 'liu_niang_heart_8']
  },
  {
    id: 'a_shi',
    name: '阿石',
    role: '矿工',
    personality: '沉默寡言',
    birthday: { season: 'autumn', day: 5 },
    lovedItems: ['ruby', 'jade'],
    likedItems: ['gold_ore', 'iron_ore', 'potato'],
    hatedItems: ['chrysanthemum', 'wintersweet'],
    dialogues: {
      stranger: ['……嗯。', '矿洞……小心点。'],
      acquaintance: ['你也去挖矿？……带上镐。', '深层有好东西，也有危险。'],
      friendly: ['这块矿石不错，给你。', '你的镐该升级了，我可以帮你看看。'],
      bestFriend: ['……你是我第一个朋友。', '最深处的宝藏……我只告诉你。']
    },
    marriageable: true,
    heartEventIds: ['a_shi_heart_3', 'a_shi_heart_5', 'a_shi_heart_8']
  },
  {
    id: 'qiu_yue',
    name: '秋月',
    role: '渔家女',
    personality: '活泼开朗',
    birthday: { season: 'winter', day: 20 },
    lovedItems: ['koi', 'giant_salamander'],
    likedItems: ['crucian', 'carp', 'grass_carp', 'bass'],
    hatedItems: ['copper_ore', 'iron_ore'],
    dialogues: {
      stranger: ['哎呀，新面孔！我是秋月，最会钓鱼的那个！', '想学钓鱼就来找我呀！'],
      acquaintance: ['今天溪水特别清，肯定能钓到大鱼！', '你钓鱼的样子越来越有模有样了嘛。'],
      friendly: ['这是我的私房钓点，只告诉你哦。', '我教你做红烧鲤鱼吧，超好吃的！'],
      bestFriend: ['以后一起去钓鱼好不好？每天都去！', '你是我见过最厉害的钓手！嘿嘿。']
    },
    marriageable: true,
    heartEventIds: ['qiu_yue_heart_3', 'qiu_yue_heart_5', 'qiu_yue_heart_8']
  },
  {
    id: 'lin_lao',
    name: '林老',
    role: '老中医',
    personality: '慈祥博学',
    birthday: { season: 'autumn', day: 22 },
    lovedItems: ['herb', 'tea'],
    likedItems: ['winter_bamboo_shoot', 'bamboo'],
    hatedItems: ['ruby', 'gold_ore'],
    dialogues: {
      stranger: ['年轻人，初来此地，水土可还习惯？', '老夫行医数十载，有什么不舒服的尽管说。'],
      acquaintance: ['这草药是好东西，可以入药也可以泡茶。', '你的气色比刚来时好多了。'],
      friendly: ['老夫有一剂药膳方子，可以增强体力。', '你祖父……是老夫的故交。'],
      bestFriend: ['这部《本草拾遗》，送给你了。好好研读。', '桃源乡的未来，就拜托你了。']
    }
  },
  {
    id: 'xiao_man',
    name: '小满',
    role: '木匠学徒',
    personality: '调皮好奇',
    birthday: { season: 'spring', day: 18 },
    lovedItems: ['watermelon', 'sweet_potato'],
    likedItems: ['wood', 'bamboo', 'radish'],
    hatedItems: ['herb', 'tea'],
    dialogues: {
      stranger: ['哇，你就是那个新来的！我是小满！', '你的田庄我去偷看过了，好破啊——啊不是，很有潜力！'],
      acquaintance: ['我最近在练做柜子，要不要来一个？', '师父说我手艺还不行，哼！'],
      friendly: ['我帮你修工具吧！保证好使！', '嘿嘿，偷偷给你打个折。'],
      bestFriend: ['以后我要盖全村最大的房子！你帮我设计？', '你是我最好的朋友！……别告诉别人啊。']
    }
  }
]

/** 根据ID获取NPC定义 */
export const getNpcById = (id: string): NpcDef | undefined => {
  return NPCS.find(n => n.id === id)
}
