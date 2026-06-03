import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'

const onboardingAPI = {
  apply: (): Promise<string> => ipcRenderer.invoke('onboarding:apply'),
  close: (): Promise<void> => ipcRenderer.invoke('onboarding:close'),
  skip: (): Promise<void> => ipcRenderer.invoke('onboarding:skip'),
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('onboarding', onboardingAPI)
  } catch (error) {
    console.error(error) // eslint-disable-line no-console
  }
} else {
  // @ts-expect-error non-isolated fallback
  window.electron = electronAPI
  // @ts-expect-error non-isolated fallback
  window.onboarding = onboardingAPI
}
