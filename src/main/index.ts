import { electronApp, optimizer } from '@electron-toolkit/utils'
import { app, Menu, nativeImage, Tray } from 'electron'
import { join } from 'path'

import { createIpcServer } from '@main/ipc-server'
import { hasAlias, openOnboardingWindow } from '@main/onboarding'
import { createSessionManager } from '@main/session-manager'
import { store } from '@main/store'
import { createTrayAnimator } from '@main/tray-animator'
import type { SpeedLevel } from '@shared/types'

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
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'termcat', enabled: false },
      { type: 'separator' },
      { label: 'Quit', role: 'quit' },
    ])
  )

  return tray
}

function startCore(tray: Tray): () => void {
  const sessionManager = createSessionManager()
  const animator = createTrayAnimator(tray, getSpritesDir())
  animator.setLevel('idle')

  const ipcServer = createIpcServer((event) => {
    if (event.type === 'session:start') {
      sessionManager.onStart(event.pid, event.command)
    } else if (event.type === 'session:data') {
      sessionManager.onData(event.pid, event.chars, event.timestamp)
    } else if (event.type === 'session:exit') {
      sessionManager.onExit(event.pid)
    }
  })

  ipcServer.start()

  let currentLevel: SpeedLevel = 'idle'

  setInterval(() => {
    const newLevel = sessionManager.tick()
    if (newLevel !== currentLevel) {
      currentLevel = newLevel
      animator.setLevel(newLevel)
    }
  }, TICK_MS)

  return () => {
    ipcServer.stop()
    animator.destroy()
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
  const stop = startCore(tray)

  app.on('before-quit', stop)

  if (!store.get('onboardingDone') && !hasAlias()) {
    openOnboardingWindow()
  }
})

app.on('window-all-closed', () => {})
