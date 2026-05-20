import { app, Tray, Menu, nativeImage } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { join } from 'path'

let tray: Tray | null = null

function createTray(): void {
  const iconPath = join(__dirname, '../../resources/icon.png')
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
  tray = new Tray(icon)
  tray.setToolTip('termcat')

  const contextMenu = Menu.buildFromTemplate([
    { label: 'termcat', enabled: false },
    { type: 'separator' },
    { label: 'Quit', role: 'quit' }
  ])

  tray.setContextMenu(contextMenu)
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.termcat')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  if (process.platform === 'darwin') {
    app.dock.hide()
  }

  createTray()
})

// tray-only app — keep running even with no windows open
app.on('window-all-closed', () => {})
