import { ipcMain } from 'electron'

import { store } from '@main/store'
import { rebuildTrayMenu } from '@main/tray-menu'
import type { AIShortcut } from '@shared/types'

import { closeSettingsWindow } from './window'

export function registerSettingsIpcHandlers(): void {
  ipcMain.handle('ai-shortcut:list', () => store.get('aiShortcuts'))

  ipcMain.handle('ai-shortcut:save', (_, shortcut: AIShortcut) => {
    const shortcuts = store.get('aiShortcuts')
    const idx = shortcuts.findIndex((s) => s.id === shortcut.id)
    if (idx >= 0) {
      shortcuts[idx] = shortcut
    } else {
      shortcuts.push(shortcut)
    }
    store.set('aiShortcuts', shortcuts)
    rebuildTrayMenu()
  })

  ipcMain.handle('ai-shortcut:delete', (_, id: string) => {
    store.set(
      'aiShortcuts',
      store.get('aiShortcuts').filter((s) => s.id !== id)
    )
    rebuildTrayMenu()
  })

  ipcMain.handle('settings:close', () => {
    closeSettingsWindow()
  })
}
