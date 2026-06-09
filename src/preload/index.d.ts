import type { ElectronAPI } from '@electron-toolkit/preload'

import type { AIShortcut, SpeedThresholds } from '@shared/types'

declare global {
  interface Window {
    electron: ElectronAPI
    onboarding: {
      apply: () => Promise<string>
      close: () => Promise<void>
      skip: () => Promise<void>
    }
    aiShortcut: {
      list: () => Promise<AIShortcut[]>
      save: (shortcut: AIShortcut) => Promise<void>
      delete: (id: string) => Promise<void>
      closeWindow: () => Promise<void>
    }
    thresholds: {
      get: () => Promise<SpeedThresholds>
      set: (thresholds: SpeedThresholds) => Promise<void>
    }
  }
}
