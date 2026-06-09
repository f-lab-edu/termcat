import { style } from '@vanilla-extract/css'

import { vars } from '@renderer/styles/tokens.css'

export const container = style({
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  padding: vars.space['6'],
  paddingTop: '44px',
  gap: vars.space['4'],
  boxSizing: 'border-box',
})

export const header = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
})

export const title = style({
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
  margin: 0,
})

export const list = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space['2'],
  flex: 1,
  overflowY: 'auto',
})

export const card = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space['1'],
  padding: vars.space['3'],
  borderRadius: vars.radius.md,
  border: `1px solid ${vars.color.border.default}`,
  background: vars.color.bg.surface,
})

export const cardRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
})

export const cardName = style({
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
  margin: 0,
})

export const cardCommand = style({
  fontSize: vars.font.size.xs,
  color: vars.color.text.muted,
  fontFamily: 'monospace',
  margin: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})

export const cardActions = style({
  display: 'flex',
  gap: vars.space['1'],
  flexShrink: 0,
})

export const form = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space['2'],
  padding: vars.space['3'],
  borderRadius: vars.radius.md,
  border: `1px solid ${vars.color.border.default}`,
  background: vars.color.bg.overlay,
})

export const formRow = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space['1'],
})

export const label = style({
  fontSize: vars.font.size.xs,
  color: vars.color.text.secondary,
  margin: 0,
})

export const input = style({
  fontSize: vars.font.size.sm,
  fontFamily: vars.font.family.sans,
  color: vars.color.text.primary,
  background: vars.color.bg.surface,
  border: `1px solid ${vars.color.border.default}`,
  borderRadius: vars.radius.sm,
  padding: `${vars.space['1']} ${vars.space['2']}`,
  outline: 'none',
  selectors: {
    '&:focus': {
      borderColor: vars.color.text.secondary,
    },
  },
})

export const formActions = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: vars.space['2'],
  marginTop: vars.space['1'],
})

export const empty = style({
  fontSize: vars.font.size.sm,
  color: vars.color.text.muted,
  textAlign: 'center',
  padding: vars.space['4'],
})
