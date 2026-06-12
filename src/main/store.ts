import ElectronStore from 'electron-store'

import {
  type AIShortcut,
  type CatStyle,
  DEFAULT_SPEED_THRESHOLDS,
  type SpeedThresholds,
} from '@shared/types'

interface StoreSchema {
  onboardingDone: boolean
  aiShortcuts: AIShortcut[]
  thresholds: SpeedThresholds
  catStyle: CatStyle
}

export const store = new ElectronStore<StoreSchema>({
  defaults: {
    onboardingDone: false,
    aiShortcuts: [],
    thresholds: DEFAULT_SPEED_THRESHOLDS,
    catStyle: 'cat',
  },
})
