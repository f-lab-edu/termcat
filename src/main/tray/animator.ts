import type { SpeedLevel } from '@shared/types'
import type { Tray } from 'electron'

import { FRAME_INTERVALS, loadFrames } from './frames'

export type TrayAnimator = ReturnType<typeof createTrayAnimator>

export function createTrayAnimator(tray: Tray, spritesDir: string) {
  const frames = loadFrames(spritesDir)
  let currentFrame = 0
  let timer: NodeJS.Timeout | null = null

  function stop(): void {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
  }

  function advance(): void {
    currentFrame = (currentFrame + 1) % frames.length
    tray.setImage(frames[currentFrame])
  }

  return {
    setLevel(level: SpeedLevel): void {
      stop()
      if (level === 'idle') {
        currentFrame = 0
        tray.setImage(frames[0])
        return
      }
      timer = setInterval(() => advance(), FRAME_INTERVALS[level])
    },
    destroy(): void {
      stop()
    },
  }
}
