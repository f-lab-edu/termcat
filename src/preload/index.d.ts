import type { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    onboarding: {
      apply: () => Promise<string>
      skip: () => Promise<void>
    }
  }
}
