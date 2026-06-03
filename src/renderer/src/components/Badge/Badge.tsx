import type { SpeedLevel } from '@shared/types'

import { badge } from './Badge.css'

const LEVEL_LABEL: Record<SpeedLevel, string> = {
  idle: 'idle',
  slow: 'slow',
  mid: 'mid',
  fast: 'fast',
}

interface Props {
  level: SpeedLevel
}

export function Badge({ level }: Props): JSX.Element {
  return <span className={badge({ level })}>{LEVEL_LABEL[level]}</span>
}
