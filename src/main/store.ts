import ElectronStore from 'electron-store'

import { type AIShortcut, DEFAULT_SPEED_THRESHOLDS, type SpeedThresholds } from '@shared/types'

interface StoreSchema {
  onboardingDone: boolean
  aiShortcuts: AIShortcut[]
  thresholds: SpeedThresholds
}

export const store = new ElectronStore<StoreSchema>({
  defaults: {
    onboardingDone: false,
    aiShortcuts: [],
    thresholds: DEFAULT_SPEED_THRESHOLDS,
  },
})
