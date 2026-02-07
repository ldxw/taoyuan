import type { Component } from 'vue'
import router from '@/router'
import { useGameStore } from '@/stores'
import { isShopOpen } from '@/data/timeConstants'
import { addLog } from './useGameLog'
import { handleEndDay } from './useEndDay'
import { sfxClick, useAudio } from './useAudio'
import {
  Wheat,
  Egg,
  Home,
  Users,
  Store,
  TreePine,
  Fish,
  Pickaxe,
  Flame,
  Cog,
  Wrench,
  Package,
  Star,
  BookOpen,
  Wallet,
  ScrollText
} from 'lucide-vue-next'

export type PanelKey =
  | 'farm'
  | 'shop'
  | 'inventory'
  | 'fishing'
  | 'mining'
  | 'village'
  | 'cooking'
  | 'forage'
  | 'upgrade'
  | 'skills'
  | 'workshop'
  | 'achievement'
  | 'animal'
  | 'home'
  | 'wallet'
  | 'quest'

export const TABS: { key: PanelKey; label: string; icon: Component }[] = [
  { key: 'farm', label: '农场', icon: Wheat },
  { key: 'animal', label: '畜棚', icon: Egg },
  { key: 'home', label: '农舍', icon: Home },
  { key: 'village', label: '桃源村', icon: Users },
  { key: 'shop', label: '万物铺', icon: Store },
  { key: 'forage', label: '竹林', icon: TreePine },
  { key: 'fishing', label: '清溪', icon: Fish },
  { key: 'mining', label: '矿洞', icon: Pickaxe },
  { key: 'cooking', label: '灶台', icon: Flame },
  { key: 'workshop', label: '加工坊', icon: Cog },
  { key: 'upgrade', label: '工坊', icon: Wrench },
  { key: 'inventory', label: '背包', icon: Package },
  { key: 'skills', label: '技能', icon: Star },
  { key: 'achievement', label: '图鉴', icon: BookOpen },
  { key: 'wallet', label: '钱袋', icon: Wallet },
  { key: 'quest', label: '告示栏', icon: ScrollText }
]

/** 导航到游戏面板，检查旅行时间、就寝时间和商店营业时间 */
export const navigateToPanel = (panelKey: PanelKey) => {
  const gameStore = useGameStore()
  const { startBgm } = useAudio()

  if (gameStore.isPastBedtime) {
    addLog('已经凌晨2点了，你必须休息。')
    handleEndDay()
    return
  }

  // 商店营业检查
  const shopCheck = isShopOpen(panelKey, gameStore.day, gameStore.hour)
  if (!shopCheck.open) {
    addLog(shopCheck.reason!)
    return
  }

  // 旅行时间
  const travelResult = gameStore.travelTo(panelKey)
  if (travelResult.timeCost > 0) {
    addLog(travelResult.message)
  }
  if (travelResult.passedOut) {
    handleEndDay()
    return
  }

  sfxClick()
  startBgm()
  router.push({ name: panelKey })
}

export const useNavigation = () => {
  return {
    TABS,
    navigateToPanel
  }
}
