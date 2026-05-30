import { style } from '@vanilla-extract/css'

import { vars } from '@renderer/styles/tokens.css'

export const container = style({
  padding: vars.space['6'],
  textAlign: 'center',
})
