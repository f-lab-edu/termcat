import { useState } from 'react'

import { CatSprite, Stack } from '@renderer/components/index'

import { OnboardingPrompt } from './components/OnboardingPrompt'
import { OnboardingSuccess } from './components/OnboardingSuccess'
import * as s from './Onboarding.css'

type Status = 'idle' | 'done' | 'error'

export function Onboarding(): JSX.Element {
  const [status, setStatus] = useState<Status>('idle')
  const [rcPath, setRcPath] = useState('')

  async function handleApply(): Promise<void> {
    try {
      const path = await window.onboarding.apply()
      setRcPath(path)
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  async function handleSkip(): Promise<void> {
    await window.onboarding.skip()
  }

  return (
    <div className={s.container}>
      <Stack direction="column" align="center" gap="3">
        <CatSprite />
        {status === 'done' ? (
          <OnboardingSuccess rcPath={rcPath} />
        ) : (
          <OnboardingPrompt
            isError={status === 'error'}
            onApply={handleApply}
            onSkip={handleSkip}
          />
        )}
      </Stack>
    </div>
  )
}
