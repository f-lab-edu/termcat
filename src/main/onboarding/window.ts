import { BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'

import { store } from '@main/store'

import { appendAlias } from './alias'

export function openOnboardingWindow(): void {
  const win = new BrowserWindow({
    width: 400,
    height: 280,
    resizable: false,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}?page=onboarding`)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'), { query: { page: 'onboarding' } })
  }

  ipcMain.handleOnce('onboarding:apply', () => {
    const rcPath = appendAlias()
    store.set('onboardingDone', true)
    win.close()
    return rcPath
  })

  ipcMain.handleOnce('onboarding:skip', () => {
    store.set('onboardingDone', true)
    win.close()
  })
}
