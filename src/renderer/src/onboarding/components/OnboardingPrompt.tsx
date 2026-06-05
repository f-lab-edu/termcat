import { Button, Stack, Text } from '@renderer/components/index'

interface Props {
  isError: boolean
  isPending: boolean
  onApply: () => Promise<void>
}

export function OnboardingPrompt({ isError, isPending, onApply }: Props): JSX.Element {
  return (
    <Stack direction="column" align="center" gap="3">
      <Text variant="title">termcat 설정</Text>
      <Text variant="body">
        alias를 등록하면 <code>claude</code> 명령어 그대로 사용할 수 있어요.
      </Text>
      {isError && <Text variant="error">등록 중 오류가 발생했어요.</Text>}
      <Button variant="primary" disabled={isPending} onClick={onApply}>
        시작하기
      </Button>
    </Stack>
  )
}
