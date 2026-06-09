import ElectronStore from 'electron-store'

import type { AIShortcut } from '@shared/types'

interface StoreSchema {
  onboardingDone: boolean
  aiShortcuts: AIShortcut[]
}

export const store = new ElectronStore<StoreSchema>({
  defaults: { onboardingDone: false, aiShortcuts: [] },
})
