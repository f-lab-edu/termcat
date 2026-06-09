import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'

import type { AIShortcut, SpeedThresholds } from '@shared/types'

const onboardingAPI = {
  apply: (): Promise<string> => ipcRenderer.invoke('onboarding:apply'),
  close: (): Promise<void> => ipcRenderer.invoke('onboarding:close'),
  skip: (): Promise<void> => ipcRenderer.invoke('onboarding:skip'),
}

const aiShortcutAPI = {
  list: (): Promise<AIShortcut[]> => ipcRenderer.invoke('ai-shortcut:list'),
  save: (shortcut: AIShortcut): Promise<void> => ipcRenderer.invoke('ai-shortcut:save', shortcut),
  delete: (id: string): Promise<void> => ipcRenderer.invoke('ai-shortcut:delete', id),
  closeWindow: (): Promise<void> => ipcRenderer.invoke('settings:close'),
}

const thresholdsAPI = {
  get: (): Promise<SpeedThresholds> => ipcRenderer.invoke('thresholds:get'),
  set: (thresholds: SpeedThresholds): Promise<void> =>
    ipcRenderer.invoke('thresholds:set', thresholds),
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('onboarding', onboardingAPI)
    contextBridge.exposeInMainWorld('aiShortcut', aiShortcutAPI)
    contextBridge.exposeInMainWorld('thresholds', thresholdsAPI)
  } catch (error) {
    console.error(error) // eslint-disable-line no-console
  }
} else {
  // @ts-expect-error non-isolated fallback
  window.electron = electronAPI
  // @ts-expect-error non-isolated fallback
  window.onboarding = onboardingAPI
  // @ts-expect-error non-isolated fallback
  window.aiShortcut = aiShortcutAPI
  // @ts-expect-error non-isolated fallback
  window.thresholds = thresholdsAPI
}
