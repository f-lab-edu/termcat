import { style } from '@vanilla-extract/css'

import { vars } from '@renderer/styles/tokens.css'

export const container = style({
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: vars.space['6'],
})
