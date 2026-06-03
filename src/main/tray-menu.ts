import { is } from '@electron-toolkit/utils'
import type { Tray } from 'electron'
import { app, Menu } from 'electron'

import { openOnboardingWindow } from '@main/onboarding'
import { store } from '@main/store'

export function buildTrayMenu(tray: Tray): void {
  const { openAtLogin } = app.getLoginItemSettings()

  const devItems = is.dev
    ? [
        { type: 'separator' as const },
        {
          label: '[Dev] Reset Onboarding',
          click: () => {
            store.set('onboardingDone', false)
            openOnboardingWindow()
          },
        },
      ]
    : []

  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'termcat', enabled: false },
      { type: 'separator' },
      {
        label: '데스크탑 실행 시 자동 시작',
        type: 'checkbox',
        checked: openAtLogin,
        click: (menuItem) => {
          app.setLoginItemSettings({ openAtLogin: menuItem.checked, openAsHidden: true })
          buildTrayMenu(tray)
        },
      },
      { type: 'separator' },
      { label: 'Quit', role: 'quit' },
      ...devItems,
    ])
  )
}
