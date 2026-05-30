import { createSprinkles, defineProperties } from '@vanilla-extract/sprinkles'

import { vars } from './tokens.css'

const layoutProperties = defineProperties({
  properties: {
    display: ['none', 'flex', 'block', 'inline-flex', 'inline-block'],
    flexDirection: ['row', 'column'],
    alignItems: ['stretch', 'flex-start', 'center', 'flex-end'],
    justifyContent: ['flex-start', 'center', 'flex-end', 'space-between'],
    flexWrap: ['nowrap', 'wrap'],
    gap: vars.space,
    padding: vars.space,
    paddingTop: vars.space,
    paddingBottom: vars.space,
    paddingLeft: vars.space,
    paddingRight: vars.space,
  },
  shorthands: {
    px: ['paddingLeft', 'paddingRight'],
    py: ['paddingTop', 'paddingBottom'],
  },
})

const colorProperties = defineProperties({
  properties: {
    color: vars.color.text,
    background: vars.color.bg,
  },
})

export const sprinkles = createSprinkles(layoutProperties, colorProperties)
export type Sprinkles = Parameters<typeof sprinkles>[0]
