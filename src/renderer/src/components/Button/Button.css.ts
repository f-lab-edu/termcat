import { recipe } from '@vanilla-extract/recipes'

import { vars } from '@renderer/styles/tokens.css'

export const button = recipe({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${vars.space['2']} ${vars.space['5']}`,
    borderRadius: vars.radius.md,
    fontSize: vars.font.size.sm,
    fontFamily: vars.font.family.sans,
    fontWeight: vars.font.weight.normal,
    cursor: 'pointer',
    border: 'none',
    transition: `opacity ${vars.animation.duration.fast} ${vars.animation.easing.easeOut}`,
    selectors: {
      '&:hover': { opacity: 0.85 },
      '&:active': { opacity: 0.7 },
      '&:disabled': { opacity: 0.4, cursor: 'not-allowed' },
    },
  },
  variants: {
    variant: {
      primary: {
        background: vars.color.bg.primary,
        color: vars.color.text.onDark,
      },
      secondary: {
        background: 'transparent',
        color: vars.color.text.secondary,
        border: `1px solid ${vars.color.border.default}`,
      },
      ghost: {
        background: 'transparent',
        color: vars.color.text.secondary,
      },
    },
  },
  defaultVariants: {
    variant: 'primary',
  },
})
