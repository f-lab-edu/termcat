import type { Tray } from 'electron'
import { nativeImage } from 'electron'
import { join } from 'path'

import type { CatStyle, SpeedLevel } from '@shared/types'

const IDLE_INTERVAL = 800
const FRAME_INTERVALS: Record<Exclude<SpeedLevel, 'idle'>, number> = {
  slow: 500,
  mid: 200,
  fast: 70,
}

interface CatStyleConfig {
  prefix: string
  frameCount: number
  idleFrames: number[]
  /** 활성화 시 처음 한 번 재생되는 인트로 프레임 인덱스 목록 */
  spinIntroFrames: number[]
  /** 인트로 이후 반복 재생되는 루프 프레임 인덱스 목록 */
  spinLoopFrames: number[]
  useTemplate: boolean
}

const CAT_STYLE_CONFIGS: Record<CatStyle, CatStyleConfig> = {
  cat: {
    prefix: 'cat',
    frameCount: 8,
    idleFrames: [3, 4],
    spinIntroFrames: [5, 6, 7, 0, 1, 2],
    spinLoopFrames: [5, 6, 7, 0, 1, 2],
    useTemplate: true,
  },
  cat2: {
    prefix: 'cat2',
    frameCount: 67,
    idleFrames: [0],
    spinIntroFrames: Array.from({ length: 67 }, (_, i) => i),
    // 프레임 60→67→60 핑퐁: [59..66, 65..59]
    spinLoopFrames: [
      ...Array.from({ length: 8 }, (_, i) => 59 + i), // 60→67
      ...Array.from({ length: 6 }, (_, i) => 65 - i), // 66→61
    ],
    useTemplate: false,
  },
}

function loadFrames(
  spritesDir: string,
  prefix: string,
  count: number,
  useTemplate: boolean
): Electron.NativeImage[] {
  return Array.from({ length: count }, (_, i) => {
    const frameName = `${prefix}-f${String(i + 1).padStart(2, '0')}.png`
    const img = nativeImage.createFromPath(join(spritesDir, frameName))
    if (useTemplate) img.setTemplateImage(true)
    return img
  })
}

export type TrayAnimator = ReturnType<typeof createTrayAnimator>

export function createTrayAnimator(tray: Tray, spritesDir: string, style: CatStyle = 'cat') {
  const config = CAT_STYLE_CONFIGS[style]
  const frames = loadFrames(spritesDir, config.prefix, config.frameCount, config.useTemplate)
  let idleIndex = 0
  let timer: NodeJS.Timeout | null = null

  function stop(): void {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
  }

  return {
    setLevel(level: SpeedLevel): void {
      stop()
      if (level === 'idle') {
        idleIndex = 0
        tray.setImage(frames[config.idleFrames[0]])
        if (config.idleFrames.length > 1) {
          timer = setInterval(() => {
            idleIndex = (idleIndex + 1) % config.idleFrames.length
            tray.setImage(frames[config.idleFrames[idleIndex]])
          }, IDLE_INTERVAL)
        }
        return
      }

      const intro = config.spinIntroFrames
      const loop = config.spinLoopFrames
      const interval = FRAME_INTERVALS[level]
      let introIdx = 0
      let loopIdx = 0
      let inIntro = true

      tray.setImage(frames[intro[0]])
      timer = setInterval(() => {
        if (inIntro) {
          introIdx++
          if (introIdx >= intro.length) {
            inIntro = false
            loopIdx = 0
            tray.setImage(frames[loop[loopIdx]])
          } else {
            tray.setImage(frames[intro[introIdx]])
          }
        } else {
          loopIdx = (loopIdx + 1) % loop.length
          tray.setImage(frames[loop[loopIdx]])
        }
      }, interval)
    },
    destroy(): void {
      stop()
    },
  }
}
