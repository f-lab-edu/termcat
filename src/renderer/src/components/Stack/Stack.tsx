import { sprinkles } from '@renderer/styles/sprinkles.css'

type SpaceKey = '1' | '2' | '3' | '4' | '5' | '6'

interface Props {
  direction?: 'row' | 'column'
  gap?: SpaceKey
  align?: 'stretch' | 'flex-start' | 'center' | 'flex-end'
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between'
  children: React.ReactNode
}

export function Stack({ direction = 'column', gap, align, justify, children }: Props): JSX.Element {
  return (
    <div
      className={sprinkles({
        display: 'flex',
        flexDirection: direction,
        ...(gap && { gap }),
        ...(align && { alignItems: align }),
        ...(justify && { justifyContent: justify }),
      })}
    >
      {children}
    </div>
  )
}
