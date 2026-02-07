import type { FarmMapType } from '@/types'

export interface FarmMapDef {
  type: FarmMapType
  name: string
  description: string
  bonus: string
}

export const FARM_MAP_DEFS: FarmMapDef[] = [
  { type: 'standard', name: '桃源田庄', description: '广阔的平原，最适合大规模种植。', bonus: '初始农场6×6' },
  { type: 'riverland', name: '溪流田庄', description: '小河环绕的田地，水产丰富。', bonus: '钓鱼经验+25%，鱼售价+10%' },
  { type: 'forest', name: '竹林田庄', description: '林间空地，采集物种类繁多。', bonus: '采集经验+25%，20%概率双倍采集' },
  { type: 'hilltop', name: '山丘田庄', description: '山腰的梯田，蕴含矿脉。', bonus: '挖矿经验+25%，矿石+1' },
  { type: 'wilderness', name: '荒野田庄', description: '偏远荒地，夜间有野兽出没。', bonus: '战斗经验+50%，每日被动获矿石' },
  { type: 'meadowlands', name: '草甸田庄', description: '开阔牧场，适合饲养牲畜。', bonus: '开局有鸡舍+2鸡，友好度+50%' }
]
