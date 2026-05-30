import { button } from './Button.css'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

interface Props {
  variant?: ButtonVariant
  disabled?: boolean
  onClick?: () => void
  children: React.ReactNode
}

export function Button({ variant = 'primary', disabled, onClick, children }: Props): JSX.Element {
  return (
    <button className={button({ variant })} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  )
}
