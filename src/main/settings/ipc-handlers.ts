import { ipcMain } from 'electron'

import { store } from '@main/store'
import { rebuildTrayMenu } from '@main/tray-menu'
import type { AIShortcut, CatStyle, SpeedThresholds } from '@shared/types'

import { closeSettingsWindow } from './window'

export function registerSettingsIpcHandlers(onCatStyleChange: (style: CatStyle) => void): void {
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

  ipcMain.handle('thresholds:get', () => store.get('thresholds'))

  ipcMain.handle('thresholds:set', (_, thresholds: SpeedThresholds) => {
    store.set('thresholds', thresholds)
  })

  ipcMain.handle('cat-style:get', () => store.get('catStyle'))

  ipcMain.handle('cat-style:set', (_, style: CatStyle) => {
    store.set('catStyle', style)
    onCatStyleChange(style)
  })
}
