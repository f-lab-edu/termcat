import { app, ipcMain } from 'electron'

import type { SessionManager } from '@main/session-manager'

export function registerPopupIpcHandlers(sessionManager: SessionManager): void {
  ipcMain.handle('popup:get-sessions', () => ({
    sessions: sessionManager.getSnapshots(),
    openAtLogin: app.getLoginItemSettings().openAtLogin,
  }))

  ipcMain.handle('popup:quit', () => app.quit())
}
