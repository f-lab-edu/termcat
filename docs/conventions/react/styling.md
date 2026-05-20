# React — 스타일링 (vanilla-extract)

스타일 파일은 컴포넌트와 같은 폴더에 `*.css.ts` 로 위치한다:

```
StatusPopup.tsx
StatusPopup.css.ts
```

- inline style 금지 (`style={{ color: 'red' }}`)
- Tailwind 클래스 금지 — vanilla-extract로 통일

---

## `createThemeContract` + `createTheme` — 테마 시스템

테마 계약(contract)을 먼저 정의하고, 라이트/다크 테마를 각각 구현한다.  
컴포넌트는 계약의 변수만 참조하므로 테마 교체 시 컴포넌트 코드를 건드리지 않는다:

```ts
// theme.css.ts
import { createThemeContract, createTheme } from '@vanilla-extract/css'

export const vars = createThemeContract({
  color: {
    bg: null,
    bgHover: null,
    text: null,
    textSecondary: null,
    accent: null,
  },
  space: { sm: null, md: null, lg: null },
  radius: { sm: null, md: null },
})

export const lightTheme = createTheme(vars, {
  color: { bg: '#ffffff', bgHover: '#f5f5f5', text: '#1a1a1a', textSecondary: '#666666', accent: '#0066cc' },
  space: { sm: '4px', md: '8px', lg: '16px' },
  radius: { sm: '4px', md: '8px' },
})

export const darkTheme = createTheme(vars, {
  color: { bg: '#1e1e1e', bgHover: '#2a2a2a', text: '#f0f0f0', textSecondary: '#999999', accent: '#4da3ff' },
  space: { sm: '4px', md: '8px', lg: '16px' },
  radius: { sm: '4px', md: '8px' },
})
```

```tsx
// App.tsx — 시스템 다크모드에 맞춰 테마 클래스 적용
const theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? darkTheme : lightTheme
<div className={theme}>...</div>
```

---

## `style` — 기본 스타일

```ts
import { style } from '@vanilla-extract/css'
import { vars } from '../theme.css'

export const container = style({
  padding: vars.space.lg,
  backgroundColor: vars.color.bg,
  borderRadius: vars.radius.md,
  selectors: {
    '&:hover': { backgroundColor: vars.color.bgHover },
  },
  '@media': {
    'screen and (max-width: 400px)': { padding: vars.space.md },
  },
})
```

---

## `styleVariants` — 열거형 변형

`SpeedLevel` 같이 값이 정해진 열거형 변형에 사용한다:

```ts
import { styleVariants } from '@vanilla-extract/css'
import type { SpeedLevel } from '@shared/types'

export const indicator = styleVariants({
  idle: { backgroundColor: '#888888' },
  slow: { backgroundColor: '#4caf50' },
  mid:  { backgroundColor: '#ff9800' },
  fast: { backgroundColor: '#f44336' },
} satisfies Record<SpeedLevel, unknown>)
```

```tsx
<div className={indicator[level]} />
```

---

## `recipe` — 복합 변형 컴포넌트

여러 variant가 조합되는 컴포넌트에 사용한다. `@vanilla-extract/recipes` 패키지 필요:

```ts
import { recipe } from '@vanilla-extract/recipes'

export const button = recipe({
  base: {
    borderRadius: vars.radius.sm,
    fontWeight: 500,
    cursor: 'pointer',
    border: 'none',
  },
  variants: {
    size: {
      sm: { fontSize: 12, padding: `${vars.space.sm} ${vars.space.md}` },
      md: { fontSize: 14, padding: `${vars.space.md} ${vars.space.lg}` },
    },
    intent: {
      primary:   { backgroundColor: vars.color.accent, color: '#fff' },
      secondary: { backgroundColor: vars.color.bgHover, color: vars.color.text },
      danger:    { backgroundColor: '#f44336', color: '#fff' },
    },
  },
  compoundVariants: [
    { variants: { size: 'sm', intent: 'danger' }, style: { fontWeight: 700 } },
  ],
  defaultVariants: { size: 'md', intent: 'secondary' },
})
```

```tsx
<button className={button({ size: 'sm', intent: 'primary' })}>확인</button>
```

---

## `keyframes` — 애니메이션

```ts
import { keyframes, style } from '@vanilla-extract/css'

const spin = keyframes({
  from: { transform: 'rotate(0deg)' },
  to:   { transform: 'rotate(360deg)' },
})

export const spinning = style({
  animationName: spin,
  animationDuration: '0.4s',
  animationTimingFunction: 'linear',
  animationIterationCount: 'infinite',
})
```

---

## `globalStyle` — 전역 스타일

리셋이나 폰트 등 전역 스타일은 `global.css.ts` 한 파일에 모은다:

```ts
import { globalStyle } from '@vanilla-extract/css'

globalStyle('*, *::before, *::after', {
  boxSizing: 'border-box',
  margin: 0,
  padding: 0,
})

globalStyle('body', {
  fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
  WebkitFontSmoothing: 'antialiased',
})
```

---

## `composeStyles` — 스타일 조합

```ts
import { style, composeStyles } from '@vanilla-extract/css'

const base = style({ padding: 8 })
const rounded = style({ borderRadius: 4 })

// 금지
export const card = `${base} ${rounded}`

// 허용
export const card = composeStyles(base, rounded)
```
