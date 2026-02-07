import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'menu', component: () => import('@/views/MainMenu.vue') },
    {
      path: '/game',
      component: () => import('@/views/GameLayout.vue'),
      redirect: '/game/farm',
      children: [
        { path: 'farm', name: 'farm', component: () => import('@/components/game/FarmView.vue') },
        { path: 'animal', name: 'animal', component: () => import('@/components/game/AnimalView.vue') },
        { path: 'home', name: 'home', component: () => import('@/components/game/HomeView.vue') },
        { path: 'village', name: 'village', component: () => import('@/components/game/NpcView.vue') },
        { path: 'shop', name: 'shop', component: () => import('@/components/game/ShopView.vue') },
        { path: 'forage', name: 'forage', component: () => import('@/components/game/ForageView.vue') },
        { path: 'fishing', name: 'fishing', component: () => import('@/components/game/FishingView.vue') },
        { path: 'mining', name: 'mining', component: () => import('@/components/game/MiningView.vue') },
        { path: 'cooking', name: 'cooking', component: () => import('@/components/game/CookingView.vue') },
        { path: 'workshop', name: 'workshop', component: () => import('@/components/game/ProcessingView.vue') },
        { path: 'upgrade', name: 'upgrade', component: () => import('@/components/game/ToolUpgradeView.vue') },
        { path: 'inventory', name: 'inventory', component: () => import('@/components/game/InventoryView.vue') },
        { path: 'skills', name: 'skills', component: () => import('@/components/game/SkillView.vue') },
        { path: 'achievement', name: 'achievement', component: () => import('@/components/game/AchievementView.vue') },
        { path: 'wallet', name: 'wallet', component: () => import('@/components/game/WalletView.vue') },
        { path: 'quest', name: 'quest', component: () => import('@/components/game/QuestView.vue') }
      ]
    }
  ]
})

export default router
