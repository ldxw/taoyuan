<script setup lang="ts">
  import { RouterView } from 'vue-router'
</script>

<template>
  <RouterView />
</template>

<style>
  @import 'tailwindcss';

  /* zpix 像素字体（支持中英文） */
  @font-face {
    font-family: 'zpix';
    src: url('@/assets/fonts/zpix.woff2') format('woff2');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
  }

  @theme {
    /* 传统中国色 */
    --color-bg: #1a1a1a;
    --color-panel: #2b2d3c;
    --color-text: #e8e4d9;
    --color-accent: #c8a45c;
    --color-danger: #c34043;
    --color-success: #5a9e6f;
    --color-water: #4c6e8a;
    --color-earth: #8b6914;
    --color-muted: #6b7280;

    /* 品质颜色 */
    --color-quality-fine: #b87333;
    --color-quality-excellent: #c0c0c0;
    --color-quality-supreme: #ffd700;

    /* 字体 */
    --font-game: 'zpix', monospace;

    /* 间距基准 4px */
    --spacing-1: 4px;
    --spacing-2: 8px;
    --spacing-3: 12px;
    --spacing-4: 16px;
    --spacing-6: 24px;
    --spacing-8: 32px;
  }

  /* 全局基础样式 */
  body {
    margin: 0;
    background-color: var(--color-bg);
    color: var(--color-text);
    font-family: var(--font-game);
    min-height: 100vh;
    -webkit-font-smoothing: none;
    -moz-osx-font-smoothing: unset;
    image-rendering: pixelated;
  }

  #app {
    max-width: 1000px;
    margin: 0 auto;
    padding: var(--spacing-2);
  }

  @media (min-width: 768px) {
    #app {
      padding: var(--spacing-4);
    }
  }

  /* 像素风按钮基础样式 */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-2);
    padding: var(--spacing-2) var(--spacing-4);
    background-color: var(--color-panel);
    color: var(--color-text);
    border: 1px solid oklch(from var(--color-accent) l c h / 0.3);
    border-radius: 2px;
    font-family: var(--font-game);
    font-size: 12px;
    min-height: 36px;
    cursor: pointer;
    transition:
      background-color 0.15s,
      color 0.15s;
  }

  .btn:hover {
    background-color: var(--color-accent);
  }

  .btn:active {
    opacity: 0.8;
  }

  .btn-danger:hover {
    background-color: var(--color-danger);
  }

  /* 像素风面板 */
  .game-panel {
    background-color: var(--color-panel);
    border: 1px solid oklch(from var(--color-accent) l c h / 0.3);
    border-radius: 2px;
    padding: var(--spacing-3);
    position: relative;
  }

  @media (min-width: 768px) {
    .game-panel {
      padding: var(--spacing-4);
    }
  }

  /* 滚动条样式 */
  ::-webkit-scrollbar {
    width: 6px;
  }

  ::-webkit-scrollbar-track {
    background: var(--color-bg);
  }

  ::-webkit-scrollbar-thumb {
    background: var(--color-muted);
    border-radius: 2px;
  }

  /* 面板切换过渡 */
  .panel-fade-enter-active {
    transition: opacity 0.2s ease-in;
  }

  .panel-fade-leave-active {
    transition: opacity 0.15s ease-out;
  }

  .panel-fade-enter-from,
  .panel-fade-leave-to {
    opacity: 0;
  }

  /* 按钮禁用状态 */
  .btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .btn:disabled:hover {
    background-color: var(--color-panel);
    color: var(--color-text);
  }

  .qmsg .qmsg-content-wrapper {
    color: var(--color-bg) !important;
    background: var(--color-accent) !important;
  }
</style>
