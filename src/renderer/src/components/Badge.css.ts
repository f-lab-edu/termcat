import { vars } from '@renderer/styles/tokens.css'
import { recipe } from '@vanilla-extract/recipes'

export const badge = recipe({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: `2px ${vars.space['2']}`,
    borderRadius: vars.radius.lg,
    fontSize: vars.font.size.xs,
    fontWeight: vars.font.weight.semibold,
    fontFamily: vars.font.family.sans,
    letterSpacing: '0.02em',
  },
  variants: {
    level: {
      idle: {
        background: vars.color.status.idle.bg,
        color: vars.color.status.idle.fg,
      },
      slow: {
        background: vars.color.status.slow.bg,
        color: vars.color.status.slow.fg,
      },
      mid: {
        background: vars.color.status.mid.bg,
        color: vars.color.status.mid.fg,
      },
      fast: {
        background: vars.color.status.fast.bg,
        color: vars.color.status.fast.fg,
      },
    },
  },
})
