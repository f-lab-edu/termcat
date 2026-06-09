import type { ElectronAPI } from '@electron-toolkit/preload'

import type { AIShortcut } from '@shared/types'

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
  }
}
