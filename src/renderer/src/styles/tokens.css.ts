import { createGlobalTheme } from '@vanilla-extract/css'

export const vars = createGlobalTheme(':root', {
  color: {
    text: {
      primary: '#111111',
      secondary: '#555555',
      muted: '#999999',
      error: '#cc0000',
      onDark: '#ffffff',
    },
    bg: {
      primary: '#000000',
      surface: '#ffffff',
      overlay: 'rgba(0, 0, 0, 0.04)',
    },
    border: {
      default: '#cccccc',
    },
    status: {
      idle: { bg: '#e5e7eb', fg: '#6b7280' },
      slow: { bg: '#dbeafe', fg: '#2563eb' },
      mid: { bg: '#fef3c7', fg: '#d97706' },
      fast: { bg: '#fee2e2', fg: '#dc2626' },
    },
  },
  font: {
    size: {
      xs: '12px',
      sm: '13px',
      md: '14px',
      lg: '16px',
      xl: '20px',
      emoji: '32px',
    },
    weight: {
      normal: '400',
      semibold: '600',
    },
    family: {
      sans: '-apple-system, BlinkMacSystemFont, sans-serif',
    },
  },
  space: {
    '1': '4px',
    '2': '8px',
    '3': '12px',
    '4': '16px',
    '5': '20px',
    '6': '24px',
  },
  radius: {
    sm: '4px',
    md: '6px',
    lg: '8px',
  },
  animation: {
    duration: {
      fast: '120ms',
      base: '200ms',
      slow: '300ms',
    },
    easing: {
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
    },
  },
})
