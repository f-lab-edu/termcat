import type { SpeedLevel } from '@shared/types'
import { nativeImage } from 'electron'
import { join } from 'path'

export const FRAME_COUNT = 8
export const FRAME_INTERVALS: Record<Exclude<SpeedLevel, 'idle'>, number> = {
  slow: 200,
  mid: 100,
  fast: 40,
}

export function loadFrames(spritesDir: string): Electron.NativeImage[] {
  return Array.from({ length: FRAME_COUNT }, (_, i) => {
    const frameName = `cat-f${String(i + 1).padStart(2, '0')}.png`
    const img = nativeImage.createFromPath(join(spritesDir, frameName))
    img.setTemplateImage(true)
    return img
  })
}
