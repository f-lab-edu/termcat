import { useEffect, useState } from 'react'

import { CatSprite, Stack, SwitchCase } from '@renderer/components/index'

import { OnboardingPrompt } from './components/OnboardingPrompt'
import { OnboardingSuccess } from './components/OnboardingSuccess'
import * as s from './Onboarding.css'
import { useOnboarding } from './useOnboarding'

type Status = 'idle' | 'pending' | 'done' | 'error'

export function Onboarding(): JSX.Element {
  const onboarding = useOnboarding()
  const [status, setStatus] = useState<Status>('idle')
  const [rcPath, setRcPath] = useState('')

  async function handleApply(): Promise<void> {
    setStatus('pending')
    try {
      const path = await onboarding.apply()
      setRcPath(path)
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  useEffect(() => {
    if (status !== 'done') return
    const id = setTimeout(() => onboarding.close(), 2000)
    return () => clearTimeout(id)
  }, [status])

  return (
    <div className={s.container}>
      <Stack direction="column" align="center" gap="3">
        <CatSprite />
        <SwitchCase
          value={status}
          caseBy={{
            idle: <OnboardingPrompt isError={false} isPending={false} onApply={handleApply} />,
            pending: <OnboardingPrompt isError={false} isPending={true} onApply={handleApply} />,
            error: <OnboardingPrompt isError={true} isPending={false} onApply={handleApply} />,
            done: <OnboardingSuccess rcPath={rcPath} />,
          }}
        />
      </Stack>
    </div>
  )
}
