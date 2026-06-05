export function useOnboarding() {
  return {
    apply: () => window.onboarding.apply(),
    close: () => window.onboarding.close(),
    skip: () => window.onboarding.skip(),
  }
}
