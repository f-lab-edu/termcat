import { text } from './Text.css'

type TextVariant = 'emoji' | 'title' | 'body' | 'error'

interface Props {
  variant: TextVariant
  children: React.ReactNode
}

export function Text({ variant, children }: Props): JSX.Element {
  return <p className={text({ variant })}>{children}</p>
}
