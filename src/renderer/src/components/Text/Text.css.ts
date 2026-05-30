import { recipe } from '@vanilla-extract/recipes'

import { vars } from '@renderer/styles/tokens.css'

export const text = recipe({
  base: {
    margin: 0,
    padding: 0,
    fontFamily: vars.font.family.sans,
  },
  variants: {
    variant: {
      emoji: {
        fontSize: vars.font.size.emoji,
      },
      title: {
        fontSize: vars.font.size.lg,
        fontWeight: vars.font.weight.semibold,
        color: vars.color.text.primary,
      },
      body: {
        fontSize: vars.font.size.sm,
        color: vars.color.text.secondary,
        lineHeight: 1.5,
      },
      error: {
        fontSize: vars.font.size.xs,
        color: vars.color.text.error,
      },
    },
  },
})
