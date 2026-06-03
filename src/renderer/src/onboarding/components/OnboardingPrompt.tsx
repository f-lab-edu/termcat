import { Button, Stack, Text } from '@renderer/components/index'

interface Props {
  isError: boolean
  onApply: () => void
  onSkip: () => void
}

export function OnboardingPrompt({ isError, onApply, onSkip }: Props): JSX.Element {
  return (
    <Stack direction="column" align="center" gap="3">
      <Text variant="title">termcat 설정</Text>
      <Text variant="body">
        alias를 등록하면 <code>claude</code> 명령어 그대로 사용할 수 있어요.
      </Text>
      {isError && <Text variant="error">등록 중 오류가 발생했어요.</Text>}
      <Stack direction="row" gap="2">
        <Button variant="primary" onClick={onApply}>
          자동 적용
        </Button>
        <Button variant="secondary" onClick={onSkip}>
          나중에
        </Button>
      </Stack>
    </Stack>
  )
}
