import { electronApp, optimizer } from '@electron-toolkit/utils'
import { app, nativeImage, Tray } from 'electron'
import { join } from 'path'

import { createIpcServer } from '@main/ipc-server'
import { hasAlias, openOnboardingWindow } from '@main/onboarding'
import { registerPopupIpcHandlers } from '@main/popup/ipc-handlers'
import { togglePopup } from '@main/popup/window'
import { createSessionManager } from '@main/session-manager'
import { registerSettingsIpcHandlers } from '@main/settings'
import { store } from '@main/store'
import { createTrayAnimator } from '@main/tray-animator'
import { getContextMenu } from '@main/tray-menu'
import type { CatStyle, SpeedLevel } from '@shared/types'

const TICK_MS = 100

function getSpritesDir(): string {
  return join(__dirname, '../../resources/sprites')
}

function createTray(): Tray {
  const iconPath = join(getSpritesDir(), 'cat-f01.png')
  const icon = nativeImage.createFromPath(iconPath)
  icon.setTemplateImage(true)

  const tray = new Tray(icon)
  tray.setToolTip('termcat')

  tray.on('click', (_, bounds) => togglePopup(bounds))
  tray.on('right-click', () => tray.popUpContextMenu(getContextMenu()))

  return tray
}

function startCore(tray: Tray): { stop: () => void; setStyle: (style: CatStyle) => void } {
  const sessionManager = createSessionManager(() => store.get('thresholds'))
  let animator = createTrayAnimator(tray, getSpritesDir(), store.get('catStyle'))
  animator.setLevel('idle')
  let currentLevel: SpeedLevel = 'idle'

  const ipcServer = createIpcServer((event) => {
    if (event.type === 'session:start') {
      sessionManager.onStart(event.pid, event.command)
    } else if (event.type === 'session:data') {
      sessionManager.onData(event.pid, event.chars, event.timestamp)
    } else if (event.type === 'session:stats') {
      sessionManager.onStats(event.pid, event.tokens)
    } else if (event.type === 'session:exit') {
      sessionManager.onExit(event.pid)
    }
  })

  registerPopupIpcHandlers(sessionManager)
  ipcServer.start()

  const tickerId = setInterval(() => {
    const newLevel = sessionManager.tick()
    if (newLevel !== currentLevel) {
      currentLevel = newLevel
      animator.setLevel(newLevel)
    }
  }, TICK_MS)

  return {
    stop: () => {
      clearInterval(tickerId)
      ipcServer.stop()
      animator.destroy()
    },
    setStyle: (style: CatStyle) => {
      animator.destroy()
      animator = createTrayAnimator(tray, getSpritesDir(), style)
      animator.setLevel(currentLevel)
    },
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.termcat')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  if (process.platform === 'darwin') {
    app.dock.hide()
  }

  const tray = createTray()
  const { stop, setStyle } = startCore(tray)

  registerSettingsIpcHandlers(setStyle)

  app.on('before-quit', stop)

  if (!store.get('onboardingDone') && !hasAlias()) {
    openOnboardingWindow()
  }
})

app.on('window-all-closed', () => {})
