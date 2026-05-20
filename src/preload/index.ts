import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge } from 'electron'

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
  } catch (error) {
    console.error(error) // eslint-disable-line no-console
  }
} else {
  // @ts-expect-error non-isolated fallback
  window.electron = electronAPI
}
