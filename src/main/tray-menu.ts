import { is } from '@electron-toolkit/utils'
import { app, Menu } from 'electron'

import { openOnboardingWindow } from '@main/onboarding'
import { launchInTerminal, openSettingsWindow } from '@main/settings'
import { store } from '@main/store'

export function rebuildTrayMenu(): void {
  // no-op: menu is now built fresh on each right-click via getContextMenu()
}

export function getContextMenu(): Menu {
  const { openAtLogin } = app.getLoginItemSettings()

  const shortcuts = store.get('aiShortcuts')
  const shortcutItems = shortcuts.map((s) => ({
    label: s.name,
    click: () => launchInTerminal(s.command),
  }))

  const aiSubmenuItems = [
    ...shortcutItems,
    ...(shortcutItems.length > 0 ? [{ type: 'separator' as const }] : []),
    { label: '설정 편집...', click: () => openSettingsWindow() },
  ]

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

  return Menu.buildFromTemplate([
    { label: 'termcat', enabled: false },
    { type: 'separator' },
    {
      label: 'AI 실행하기',
      submenu: Menu.buildFromTemplate(aiSubmenuItems),
    },
    { type: 'separator' },
    {
      label: '데스크탑 실행 시 자동 시작',
      type: 'checkbox',
      checked: openAtLogin,
      click: (menuItem) => {
        app.setLoginItemSettings({ openAtLogin: menuItem.checked, openAsHidden: true })
      },
    },
    { type: 'separator' },
    { label: 'Quit', role: 'quit' },
    ...devItems,
  ])
}
