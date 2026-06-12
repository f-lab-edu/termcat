import { BrowserWindow, type Rectangle, screen } from 'electron'
import { join } from 'path'

const POPUP_WIDTH = 280
const POPUP_HEIGHT = 360

let popupWindow: BrowserWindow | null = null

function createPopupWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: POPUP_WIDTH,
    height: POPUP_HEIGHT,
    show: false,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}?page=popup`)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'), { query: { page: 'popup' } })
  }

  win.on('blur', () => win.hide())

  return win
}

function calculatePosition(trayBounds: Rectangle, winBounds: Rectangle): { x: number; y: number } {
  const display = screen.getDisplayNearestPoint({ x: trayBounds.x, y: trayBounds.y })
  const { workArea } = display

  const x = Math.round(trayBounds.x + trayBounds.width / 2 - winBounds.width / 2)
  const y = Math.round(trayBounds.y + trayBounds.height)

  return {
    x: Math.max(workArea.x, Math.min(x, workArea.x + workArea.width - winBounds.width)),
    y: Math.max(workArea.y, Math.min(y, workArea.y + workArea.height - winBounds.height)),
  }
}

export function togglePopup(trayBounds: Rectangle): void {
  if (!popupWindow || popupWindow.isDestroyed()) {
    popupWindow = createPopupWindow()
  }

  if (popupWindow.isVisible()) {
    popupWindow.hide()
    return
  }

  const pos = calculatePosition(trayBounds, popupWindow.getBounds())
  popupWindow.setPosition(pos.x, pos.y)
  popupWindow.show()
  popupWindow.focus()
}
