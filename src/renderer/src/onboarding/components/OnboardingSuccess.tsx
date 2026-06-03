import { Stack, Text } from '@renderer/components/index'

interface Props {
  rcPath: string
}

export function OnboardingSuccess({ rcPath }: Props): JSX.Element {
  return (
    <Stack direction="column" align="center" gap="3">
      <Text variant="title">등록 완료!</Text>
      <Text variant="body">
        <code>{rcPath}</code>에 alias를 추가했어요.
        <br />새 터미널 탭을 열면 바로 사용할 수 있습니다.
      </Text>
    </Stack>
  )
}
