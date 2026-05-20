# 네이밍 컨벤션

## 파일 & 폴더

| 대상 | 규칙 | 예시 |
|------|------|------|
| Electron main 모듈 | `kebab-case.ts` | `speed-monitor.ts`, `ipc-server.ts` |
| React 컴포넌트 | `PascalCase.tsx` | `StatusPopup.tsx`, `OnboardingWindow.tsx` |
| React 훅 | `use-*.ts` | `use-session.ts`, `use-settings.ts` |
| vanilla-extract 스타일 | `PascalCase.css.ts` | `StatusPopup.css.ts` |
| Zustand store | `*.ts` (kebab) | `session.ts`, `settings.ts` |
| 공통 타입 | `types.ts` | `src/shared/types.ts` |
| 테스트 | `*.test.ts(x)` | `speed-monitor.test.ts` |
| 스프라이트 에셋 | `cat-f0N.png` | `cat-f01.png` ~ `cat-f08.png` |
| 설정 파일 | 프레임워크 관례 따름 | `electron.vite.config.ts` |

폴더는 모두 `kebab-case`:

```
src/
  main/
  preload/
  renderer/
    src/
      components/
      hooks/
      store/
  cli/
  shared/
```

---

## 변수 & 함수

| 대상 | 규칙 | 예시 |
|------|------|------|
| 변수, 함수 | `camelCase` | `currentLevel`, `createTray()` |
| 클래스 | `PascalCase` | `SpeedMonitor`, `TrayAnimator` |
| 상수 (불변 원시값) | `UPPER_SNAKE_CASE` | `SOCKET_PATH`, `WINDOW_MS` |
| React 컴포넌트 | `PascalCase` | `StatusPopup` |
| 커스텀 훅 | `use` 접두사 | `useSession`, `useSettings` |
| boolean 변수/프로퍼티 | `is`/`has`/`can` 접두사 | `isRunning`, `hasAlias`, `canRetry` |
| 이벤트 핸들러 | `on`/`handle` 접두사 | `onClose`, `handleSessionExit` |

---

## IPC 채널명

`domain:action` 형식, 소문자 kebab:

```ts
type IpcChannel =
  | 'session:update'
  | 'session:list'
  | 'settings:get'
  | 'settings:set'
  | 'onboarding:done'
```

---

## 이벤트 타입

판별 유니온의 `type` 필드는 `domain:action` 형식:

```ts
type CliEvent =
  | { type: 'session:start'; pid: number; command: string }
  | { type: 'session:data'; pid: number; chars: number; timestamp: number }
  | { type: 'session:exit'; pid: number; code: number }
```

---

## 약어 정책

잘 알려진 약어는 허용하되, 모호한 약어는 풀어 쓴다:

```ts
// 허용 — 업계 표준 약어
const pid = process.pid
const cps = charsPerSecond
const ipc = new IpcServer()

// 금지 — 모호한 약어
const sm = new SpeedMonitor()   // → monitor
const ta = new TrayAnimator()   // → animator
const mgr = new SessionManager() // → manager (mgr 금지)
```
