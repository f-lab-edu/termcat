import { App } from './App'
import { Onboarding } from './onboarding/index'
import { Popup } from './popup/Popup'
import { Settings } from './settings/index'

const pages = {
  onboarding: Onboarding,
  settings: Settings,
  popup: Popup,
} as const

type PageKey = keyof typeof pages

export function Router(): JSX.Element {
  const page = new URLSearchParams(window.location.search).get('page') as PageKey | null

  if (page && page in pages) {
    const Page = pages[page]
    return <Page />
  }

  return <App />
}
