interface Props<T extends string> {
  value: T
  caseBy: Partial<Record<T, JSX.Element | null>>
  defaultComponent?: JSX.Element | null
}

export function SwitchCase<T extends string>({
  value,
  caseBy,
  defaultComponent = null,
}: Props<T>): JSX.Element | null {
  return caseBy[value] ?? defaultComponent
}
