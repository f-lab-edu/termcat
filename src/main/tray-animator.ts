import type { SpeedLevel } from '@shared/types'
import type { Tray } from 'electron'
import { nativeImage } from 'electron'
import { join } from 'path'

const FRAME_COUNT = 8
const FRAME_INTERVALS: Record<Exclude<SpeedLevel, 'idle'>, number> = {
  slow: 200,
  mid: 100,
  fast: 40,
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
      const interval = FRAME_INTERVALS[level]
      timer = setInterval(() => advance(), interval)
    },
    destroy(): void {
      stop()
    },
  }
}
