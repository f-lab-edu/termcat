import ElectronStore from 'electron-store'

interface StoreSchema {
  onboardingDone: boolean
}

export const store = new ElectronStore<StoreSchema>({
  defaults: { onboardingDone: false },
})
