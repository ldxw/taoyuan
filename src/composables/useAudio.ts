import { ref } from 'vue'
import type { Season, Weather, TimePeriod } from '@/types'
import { useGameStore } from '@/stores'
import { getTimePeriod } from '@/data/timeConstants'

/** 音量设置 */
const sfxEnabled = ref(true)
const bgmEnabled = ref(true)
const sfxVolume = ref(0.3)
const bgmVolume = ref(0.15)

let audioCtx: AudioContext | null = null
let bgmOscillator: OscillatorNode | null = null
let bgmGain: GainNode | null = null
let bgmPlaying = false
let bgmLoopId = 0

const getCtx = (): AudioContext => {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  return audioCtx
}

/** 播放简单合成音效 */
const playSfx = (freq: number, duration: number = 0.1, type: OscillatorType = 'square', vol: number = sfxVolume.value) => {
  if (!sfxEnabled.value) return
  const ctx = getCtx()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, ctx.currentTime)
  gain.gain.setValueAtTime(vol, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + duration)
}

/** 播放两音符组合 */
const playTwoNote = (f1: number, f2: number, dur: number = 0.08, type: OscillatorType = 'square') => {
  playSfx(f1, dur, type)
  setTimeout(() => playSfx(f2, dur, type), dur * 1000)
}

// ====== 游戏音效 ======

/** 按钮点击 */
export const sfxClick = () => {
  playSfx(800, 0.05, 'square', 0.15)
}

/** 浇水 */
export const sfxWater = () => {
  playSfx(300, 0.15, 'sine', 0.2)
  setTimeout(() => playSfx(400, 0.1, 'sine', 0.15), 80)
}

/** 种植 */
export const sfxPlant = () => {
  playSfx(500, 0.08, 'triangle')
  setTimeout(() => playSfx(600, 0.06, 'triangle'), 60)
}

/** 收获 */
export const sfxHarvest = () => {
  playTwoNote(523, 784, 0.1, 'square') // C5 → G5
}

/** 开垦 */
export const sfxDig = () => {
  playSfx(200, 0.12, 'sawtooth', 0.2)
}

/** 购买 */
export const sfxBuy = () => {
  playTwoNote(660, 880, 0.06, 'triangle')
}

/** 出售/获得金币 */
export const sfxCoin = () => {
  playTwoNote(880, 1100, 0.06, 'square')
}

/** 升级 */
export const sfxLevelUp = () => {
  const ctx = getCtx()
  if (!sfxEnabled.value) return
  const notes = [523, 659, 784, 1047] // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    setTimeout(() => playSfx(freq, 0.15, 'square', 0.25), i * 100)
  })
  // 结束音
  setTimeout(() => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(1047, ctx.currentTime)
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.4)
  }, 400)
}

/** 战斗攻击 */
export const sfxAttack = () => {
  playSfx(150, 0.1, 'sawtooth', 0.25)
  setTimeout(() => playSfx(100, 0.08, 'sawtooth', 0.2), 50)
}

/** 受伤 */
export const sfxHurt = () => {
  playSfx(200, 0.15, 'square', 0.2)
  setTimeout(() => playSfx(150, 0.2, 'square', 0.15), 80)
}

/** 钓鱼拉线 */
export const sfxReel = () => {
  playSfx(600, 0.06, 'triangle', 0.2)
  setTimeout(() => playSfx(700, 0.06, 'triangle', 0.15), 40)
}

/** 钓到鱼 */
export const sfxFishCatch = () => {
  const notes = [660, 784, 880]
  notes.forEach((f, i) => setTimeout(() => playSfx(f, 0.1, 'square'), i * 80))
}

/** 断线 */
export const sfxLineBroken = () => {
  playSfx(400, 0.1, 'sawtooth', 0.25)
  setTimeout(() => playSfx(200, 0.2, 'sawtooth', 0.2), 80)
}

/** 挖矿 */
export const sfxMine = () => {
  playSfx(250, 0.08, 'sawtooth', 0.2)
  setTimeout(() => playSfx(350, 0.06, 'triangle', 0.15), 60)
}

/** 休息/睡觉 */
export const sfxSleep = () => {
  const notes = [523, 440, 349, 262] // C5 → C4 下行
  notes.forEach((f, i) => setTimeout(() => playSfx(f, 0.2, 'sine', 0.15), i * 150))
}

/** 错误/失败 */
export const sfxError = () => {
  playSfx(200, 0.15, 'square', 0.2)
}

/** 采集 */
export const sfxForage = () => {
  playSfx(440, 0.08, 'triangle', 0.2)
  setTimeout(() => playSfx(550, 0.06, 'triangle', 0.15), 50)
}

// ====== 背景音乐 (中国风五声音阶) ======

// 五声音阶: 宫(C) 商(D) 角(E) 徵(G) 羽(A)
// C3=131 D3=147 E3=165 G3=196 A3=220
// C4=262 D4=294 E4=330 G4=392 A4=440
// C5=523 D5=587 E5=659 G5=784 A5=880

// ---- BGM 类型定义 ----

type SeasonBgmType = 'spring' | 'summer' | 'autumn' | 'winter'
type FestivalBgmType = 'festival_spring' | 'festival_summer' | 'festival_autumn' | 'festival_winter'
type BgmType = SeasonBgmType | FestivalBgmType | 'battle'

let currentFestivalOverride: FestivalBgmType | null = null

// ---- 春季 BGM（明快上行，晨光田园） ----

const SPRING_MELODY: number[] = [
  // A — 晨光
  330, 392, 440, 392, 330, 294, 262, 294, 330, 392, 440, 523, 440, 392, 330, 0,
  // B — 流水
  523, 440, 392, 330, 392, 440, 523, 587, 523, 440, 392, 440, 392, 330, 294, 0,
  // C — 田间
  294, 330, 392, 440, 392, 330, 294, 262, 294, 330, 392, 330, 294, 262, 294, 0,
  // D — 暮归
  440, 392, 330, 392, 440, 523, 440, 392, 330, 294, 330, 392, 330, 294, 262, 0
]

const SPRING_BASS: number[] = [
  131,
  147,
  165,
  196, // C3 D3 E3 G3
  220,
  196,
  165,
  131, // A3 G3 E3 C3
  147,
  165,
  196,
  131, // D3 E3 G3 C3
  220,
  196,
  165,
  131 // A3 G3 E3 C3
]

// ---- 夏季 BGM（活泼高音域，蝉鸣荷塘） ----

const SUMMER_MELODY: number[] = [
  // A — 蝉鸣
  523, 587, 659, 587, 523, 440, 523, 587, 659, 784, 659, 587, 523, 440, 392, 0,
  // B — 荷塘
  440, 523, 587, 523, 440, 392, 440, 523, 587, 523, 440, 392, 330, 392, 440, 0,
  // C — 午后
  784, 659, 587, 523, 587, 659, 523, 440, 392, 440, 523, 587, 523, 440, 392, 0,
  // D — 凉风
  392, 440, 523, 587, 659, 587, 523, 440, 392, 330, 392, 440, 392, 330, 262, 0
]

const SUMMER_BASS: number[] = [
  165,
  196,
  220,
  196, // E3 G3 A3 G3
  131,
  165,
  196,
  220, // C3 E3 G3 A3
  196,
  165,
  131,
  147, // G3 E3 C3 D3
  165,
  196,
  220,
  131 // E3 G3 A3 C3
]

// ---- 秋季 BGM（缓慢下行，落叶忧伤） ----

const AUTUMN_MELODY: number[] = [
  // A — 落叶
  440, 392, 330, 294, 262, 294, 330, 262, 440, 392, 330, 294, 262, 294, 262, 0,
  // B — 秋收
  330, 392, 440, 392, 330, 294, 330, 392, 440, 523, 440, 392, 330, 294, 262, 0,
  // C — 暮色
  523, 440, 392, 330, 262, 294, 330, 294, 262, 294, 330, 392, 330, 294, 262, 0,
  // D — 月影
  294, 330, 392, 440, 392, 330, 294, 262, 294, 262, 294, 330, 294, 262, 262, 0
]

const AUTUMN_BASS: number[] = [
  220,
  196,
  165,
  131, // A3 G3 E3 C3（下行）
  147,
  165,
  196,
  165, // D3 E3 G3 E3
  131,
  147,
  165,
  196, // C3 D3 E3 G3
  220,
  196,
  165,
  131 // A3 G3 E3 C3
]

// ---- 冬季 BGM（稀疏空灵，初雪炉火） ----

const WINTER_MELODY: number[] = [
  // A — 初雪
  262, 0, 330, 0, 392, 330, 262, 0, 294, 0, 392, 0, 440, 392, 330, 0,
  // B — 炉火
  440, 392, 330, 262, 330, 392, 330, 0, 262, 294, 330, 294, 262, 0, 262, 0,
  // C — 寒溪
  330, 392, 440, 0, 392, 330, 0, 262, 294, 330, 0, 294, 262, 0, 262, 0,
  // D — 归家
  392, 330, 294, 262, 294, 330, 392, 330, 294, 262, 0, 294, 262, 0, 262, 0
]

const WINTER_BASS: number[] = [
  131,
  0,
  165,
  0, // C3 休 E3 休（稀疏）
  196,
  0,
  131,
  0, // G3 休 C3 休
  147,
  0,
  165,
  131, // D3 休 E3 C3
  196,
  165,
  131,
  0 // G3 E3 C3 休
]

// ---- 战斗 BGM（紧迫激烈） ----

const BATTLE_MELODY: number[] = [
  // 紧迫 — 快速上行
  330, 392, 440, 523, 440, 392, 330, 262,
  // 对峙 — 重复低音
  196, 262, 196, 262, 330, 262, 196, 0,
  // 冲锋 — 高音急促
  523, 587, 523, 440, 523, 587, 659, 523,
  // 危机 — 下行紧张
  440, 392, 330, 262, 330, 392, 262, 0
]

const BATTLE_BASS: number[] = [
  131,
  165,
  131,
  165, // C3 E3 交替
  196,
  165,
  131,
  196 // G3 E3 C3 G3
]

// ---- 节日 BGM ----

/** 春耕祭 — 上行庆典 */
const FESTIVAL_SPRING_MELODY: number[] = [523, 587, 659, 784, 659, 587, 523, 440, 523, 659, 784, 880, 784, 659, 523, 0]
const FESTIVAL_SPRING_BASS: number[] = [131, 196, 165, 220]

/** 荷灯节 — 飘逸梦幻 */
const FESTIVAL_SUMMER_MELODY: number[] = [440, 523, 587, 523, 440, 392, 440, 523, 587, 659, 587, 523, 440, 392, 330, 0]
const FESTIVAL_SUMMER_BASS: number[] = [220, 196, 165, 196]

/** 丰收宴 — 节奏欢快 */
const FESTIVAL_AUTUMN_MELODY: number[] = [392, 440, 523, 440, 392, 330, 392, 440, 523, 587, 523, 440, 523, 440, 392, 0]
const FESTIVAL_AUTUMN_BASS: number[] = [196, 220, 165, 131]

/** 除夕守岁 — 温暖庄重 */
const FESTIVAL_WINTER_MELODY: number[] = [262, 330, 392, 440, 523, 440, 392, 330, 440, 523, 587, 659, 587, 523, 440, 0]
const FESTIVAL_WINTER_BASS: number[] = [131, 165, 196, 220]

// ---- BGM 配置表 ----

interface BgmConfig {
  melody: number[]
  bass: number[]
  noteDur: number
  melodyWave: OscillatorType
  bassWave: OscillatorType
}

const BGM_CONFIG: Record<BgmType, BgmConfig> = {
  // 季节
  spring: { melody: SPRING_MELODY, bass: SPRING_BASS, noteDur: 0.38, melodyWave: 'triangle', bassWave: 'sine' },
  summer: { melody: SUMMER_MELODY, bass: SUMMER_BASS, noteDur: 0.34, melodyWave: 'triangle', bassWave: 'sine' },
  autumn: { melody: AUTUMN_MELODY, bass: AUTUMN_BASS, noteDur: 0.42, melodyWave: 'triangle', bassWave: 'sine' },
  winter: { melody: WINTER_MELODY, bass: WINTER_BASS, noteDur: 0.5, melodyWave: 'sine', bassWave: 'sine' },
  // 节日
  festival_spring: { melody: FESTIVAL_SPRING_MELODY, bass: FESTIVAL_SPRING_BASS, noteDur: 0.3, melodyWave: 'square', bassWave: 'triangle' },
  festival_summer: { melody: FESTIVAL_SUMMER_MELODY, bass: FESTIVAL_SUMMER_BASS, noteDur: 0.4, melodyWave: 'sine', bassWave: 'sine' },
  festival_autumn: {
    melody: FESTIVAL_AUTUMN_MELODY,
    bass: FESTIVAL_AUTUMN_BASS,
    noteDur: 0.28,
    melodyWave: 'square',
    bassWave: 'triangle'
  },
  festival_winter: { melody: FESTIVAL_WINTER_MELODY, bass: FESTIVAL_WINTER_BASS, noteDur: 0.35, melodyWave: 'triangle', bassWave: 'sine' },
  // 战斗
  battle: { melody: BATTLE_MELODY, bass: BATTLE_BASS, noteDur: 0.22, melodyWave: 'sawtooth', bassWave: 'square' }
}

// ---- 天气修饰器 ----

interface WeatherModifier {
  tempoScale: number // 节奏缩放（>1 更慢，<1 更快）
  volumeScale: number // 音量缩放
  melodyWaveOverride?: OscillatorType // 覆盖旋律波形
  ambientFreq?: number // 环境音频率（雨声/风声）
  ambientWave?: OscillatorType
  ambientVolume?: number
  detuneAmount?: number // 失谐量（音分），营造氛围
}

const WEATHER_MODIFIERS: Record<Weather, WeatherModifier> = {
  sunny: {
    tempoScale: 1.0,
    volumeScale: 1.0
  },
  rainy: {
    tempoScale: 1.15, // 略慢，沉思感
    volumeScale: 0.85, // 柔和
    ambientFreq: 120, // 低频雨声
    ambientWave: 'sawtooth',
    ambientVolume: 0.03,
    detuneAmount: 5
  },
  stormy: {
    tempoScale: 0.9, // 略紧迫
    volumeScale: 0.75,
    melodyWaveOverride: 'sawtooth',
    ambientFreq: 80, // 低沉雷声
    ambientWave: 'sawtooth',
    ambientVolume: 0.05,
    detuneAmount: 10
  },
  snowy: {
    tempoScale: 1.25, // 更缓慢
    volumeScale: 0.7, // 静谧
    melodyWaveOverride: 'sine', // 纯净空灵
    detuneAmount: 8
  },
  windy: {
    tempoScale: 0.95,
    volumeScale: 0.9,
    ambientFreq: 200, // 风声
    ambientWave: 'sine',
    ambientVolume: 0.04,
    detuneAmount: 3
  }
}

// ---- 时段修饰器（逐音符动态读取） ----

interface TimeModifier {
  volumeScale: number // 音量缩放
  tempoScale: number // 节奏缩放（>1 更慢）
  detuneOffset: number // 额外失谐（音分）
  bassVolumeScale: number // 低音音量缩放
}

const TIME_MODIFIERS: Record<TimePeriod, TimeModifier> = {
  morning: {
    volumeScale: 1.0, // 清晨明亮
    tempoScale: 1.0,
    detuneOffset: 0,
    bassVolumeScale: 0.8
  },
  afternoon: {
    volumeScale: 0.95, // 午后略柔
    tempoScale: 1.05, // 微慢，慵懒感
    detuneOffset: 0,
    bassVolumeScale: 1.0
  },
  evening: {
    volumeScale: 0.85, // 傍晚渐暗
    tempoScale: 1.1, // 渐缓
    detuneOffset: 3, // 微失谐，暮色氛围
    bassVolumeScale: 1.1 // 低音略突出
  },
  night: {
    volumeScale: 0.7, // 夜间安静
    tempoScale: 1.2, // 明显放慢
    detuneOffset: 6, // 更多失谐，梦幻感
    bassVolumeScale: 1.3 // 低音更突出
  },
  late_night: {
    volumeScale: 0.55, // 深夜极静
    tempoScale: 1.3, // 最慢
    detuneOffset: 10, // 迷离失谐
    bassVolumeScale: 1.5 // 低音为主
  }
}

// ---- 环境音层 ----

let ambientOscillator: OscillatorNode | null = null
let ambientGainNode: GainNode | null = null

const stopAmbient = () => {
  if (ambientOscillator) {
    try {
      ambientOscillator.stop()
    } catch (_) {
      /* 已停止 */
    }
    ambientOscillator = null
  }
  ambientGainNode = null
}

// ---- BGM 播放核心 ----

const playBgmLoop = (type: BgmType = 'spring', weather: Weather = 'sunny') => {
  if (!bgmEnabled.value || bgmPlaying) return
  bgmPlaying = true
  const myLoopId = ++bgmLoopId

  const ctx = getCtx()
  const baseConfig = BGM_CONFIG[type]

  // 战斗不受天气/时段修饰
  const isBattle = type === 'battle'
  const weatherMod = isBattle ? WEATHER_MODIFIERS.sunny : WEATHER_MODIFIERS[weather]

  // 天气修饰（循环期间固定）
  const weatherNoteDur = baseConfig.noteDur * weatherMod.tempoScale
  const weatherMelodyWave = weatherMod.melodyWaveOverride ?? baseConfig.melodyWave
  const weatherBassWave = baseConfig.bassWave
  const weatherVolume = bgmVolume.value * weatherMod.volumeScale
  const weatherDetune = weatherMod.detuneAmount ?? 0

  // 启动环境音层
  if (weatherMod.ambientFreq && weatherMod.ambientVolume) {
    ambientOscillator = ctx.createOscillator()
    ambientGainNode = ctx.createGain()
    ambientOscillator.type = weatherMod.ambientWave ?? 'sine'
    ambientOscillator.frequency.setValueAtTime(weatherMod.ambientFreq, ctx.currentTime)
    ambientGainNode.gain.setValueAtTime(weatherMod.ambientVolume, ctx.currentTime)
    ambientOscillator.connect(ambientGainNode)
    ambientGainNode.connect(ctx.destination)
    ambientOscillator.start()
  }

  let noteIndex = 0

  const playNext = () => {
    if (!bgmEnabled.value || !bgmPlaying || myLoopId !== bgmLoopId) {
      if (myLoopId === bgmLoopId) bgmPlaying = false
      stopAmbient()
      return
    }

    // 时段修饰（逐音符动态读取，战斗跳过）
    const gameStore = useGameStore()
    const timeMod = isBattle ? TIME_MODIFIERS.morning : TIME_MODIFIERS[getTimePeriod(gameStore.hour)]

    // 合成最终参数：天气（固定）× 时段（动态）
    const noteDur = weatherNoteDur * timeMod.tempoScale
    const volume = weatherVolume * timeMod.volumeScale
    const detune = weatherDetune + timeMod.detuneOffset

    const freq = baseConfig.melody[noteIndex % baseConfig.melody.length]!

    // 旋律
    if (freq > 0) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = weatherMelodyWave
      osc.frequency.setValueAtTime(freq, ctx.currentTime)
      if (detune !== 0) osc.detune.setValueAtTime(detune, ctx.currentTime)
      gain.gain.setValueAtTime(volume, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + noteDur * 0.85)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + noteDur)
    }

    // 低音 — 每 4 拍一个根音
    if (noteIndex % 4 === 0) {
      const bassIndex = Math.floor(noteIndex / 4) % baseConfig.bass.length
      const bassFreq = baseConfig.bass[bassIndex]!
      if (bassFreq > 0) {
        const bassOsc = ctx.createOscillator()
        const bassGain = ctx.createGain()
        bassOsc.type = weatherBassWave
        bassOsc.frequency.setValueAtTime(bassFreq, ctx.currentTime)
        if (detune !== 0) bassOsc.detune.setValueAtTime(detune * 0.5, ctx.currentTime)
        bassGain.gain.setValueAtTime(volume * timeMod.bassVolumeScale * 0.5, ctx.currentTime)
        bassGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + noteDur * 3.5)
        bassOsc.connect(bassGain)
        bassGain.connect(ctx.destination)
        bassOsc.start()
        bassOsc.stop(ctx.currentTime + noteDur * 4)
      }
    }

    noteIndex++
    setTimeout(playNext, noteDur * 1000)
  }

  playNext()
}

const stopBgm = () => {
  bgmPlaying = false
  stopAmbient()
  if (bgmOscillator) {
    bgmOscillator.stop()
    bgmOscillator = null
  }
  if (bgmGain) {
    bgmGain = null
  }
}

/** 解析当前应播放的 BGM 类型和天气 */
const resolveCurrentBgm = (): { type: BgmType; weather: Weather } => {
  const gameStore = useGameStore()

  if (currentFestivalOverride) {
    return { type: currentFestivalOverride, weather: 'sunny' }
  }

  return { type: gameStore.season as SeasonBgmType, weather: gameStore.weather as Weather }
}

// ====== 导出 composable ======

export const useAudio = () => {
  const toggleSfx = () => {
    sfxEnabled.value = !sfxEnabled.value
  }

  const toggleBgm = () => {
    bgmEnabled.value = !bgmEnabled.value
    if (bgmEnabled.value) {
      const { type, weather } = resolveCurrentBgm()
      playBgmLoop(type, weather)
    } else {
      stopBgm()
    }
  }

  /** 启动 BGM（自动匹配当前季节+天气） */
  const startBgm = () => {
    if (bgmEnabled.value && !bgmPlaying) {
      const { type, weather } = resolveCurrentBgm()
      playBgmLoop(type, weather)
    }
  }

  /** 强制切换到当前季节/天气的 BGM（日结算后使用） */
  const switchToSeasonalBgm = () => {
    if (!bgmEnabled.value) return
    stopBgm()
    const { type, weather } = resolveCurrentBgm()
    playBgmLoop(type, weather)
  }

  /** 切换到战斗 BGM */
  const startBattleBgm = () => {
    if (!bgmEnabled.value) return
    stopBgm()
    playBgmLoop('battle', 'sunny')
  }

  /** 恢复战斗前的 BGM（季节/节日） */
  const resumeNormalBgm = () => {
    if (!bgmEnabled.value) return
    stopBgm()
    const { type, weather } = resolveCurrentBgm()
    playBgmLoop(type, weather)
  }

  /** 开始播放节日 BGM */
  const startFestivalBgm = (season: Season) => {
    if (!bgmEnabled.value) return
    const festivalType = `festival_${season}` as FestivalBgmType
    currentFestivalOverride = festivalType
    stopBgm()
    playBgmLoop(festivalType, 'sunny')
  }

  /** 结束节日 BGM，恢复季节 BGM */
  const endFestivalBgm = () => {
    currentFestivalOverride = null
    if (bgmEnabled.value) {
      switchToSeasonalBgm()
    }
  }

  return {
    sfxEnabled,
    bgmEnabled,
    toggleSfx,
    toggleBgm,
    startBgm,
    stopBgm,
    startBattleBgm,
    resumeNormalBgm,
    switchToSeasonalBgm,
    startFestivalBgm,
    endFestivalBgm
  }
}
