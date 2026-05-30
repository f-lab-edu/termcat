import { globalStyle } from '@vanilla-extract/css'

import { vars } from './tokens.css'

globalStyle('*, *::before, *::after', {
  boxSizing: 'border-box',
})

globalStyle('html, body', {
  margin: 0,
  padding: 0,
  fontFamily: vars.font.family.sans,
  fontSize: vars.font.size.md,
  color: vars.color.text.primary,
  background: vars.color.bg.surface,
  WebkitFontSmoothing: 'antialiased',
})

globalStyle('p', {
  margin: 0,
})

globalStyle('code', {
  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
  fontSize: '0.9em',
})
