import type { Tray } from 'electron'
import { nativeImage } from 'electron'
import { join } from 'path'

import type { SpeedLevel } from '@shared/types'

const FRAME_COUNT = 8
const IDLE_FRAMES = [3, 4] // cat-f04, cat-f05
const SPIN_FRAMES = [5, 6, 7, 0, 1, 2] // cat-f06 → f07 → f08 → f01 → f02 → f03
const IDLE_INTERVAL = 800
const FRAME_INTERVALS: Record<Exclude<SpeedLevel, 'idle'>, number> = {
  slow: 500,
  mid: 200,
  fast: 70,
}

function loadFrames(spritesDir: string): Electron.NativeImage[] {
  return Array.from({ length: FRAME_COUNT }, (_, i) => {
    const frameName = `cat-f${String(i + 1).padStart(2, '0')}.png`
    const img = nativeImage.createFromPath(join(spritesDir, frameName))
    img.setTemplateImage(true)
    return img
  })
}

export type TrayAnimator = ReturnType<typeof createTrayAnimator>

export function createTrayAnimator(tray: Tray, spritesDir: string) {
  const frames = loadFrames(spritesDir)
  let idleIndex = 0
  let spinIndex = 0
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
        tray.setImage(frames[IDLE_FRAMES[0]])
        timer = setInterval(() => {
          idleIndex = (idleIndex + 1) % IDLE_FRAMES.length
          tray.setImage(frames[IDLE_FRAMES[idleIndex]])
        }, IDLE_INTERVAL)
        return
      }
      spinIndex = 0
      tray.setImage(frames[SPIN_FRAMES[0]])
      const interval = FRAME_INTERVALS[level]
      timer = setInterval(() => {
        spinIndex = (spinIndex + 1) % SPIN_FRAMES.length
        tray.setImage(frames[SPIN_FRAMES[spinIndex]])
      }, interval)
    },
    destroy(): void {
      stop()
    },
  }
}
