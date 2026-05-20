# 에러 핸들링

## 에러 분류

| 종류 | 예시 | 처리 방향 |
|------|------|----------|
| **복구 가능** | IPC 연결 실패, 설정 파싱 실패 | 폴백 값 사용, 재시도 |
| **복구 불가** | 렌더러 렌더링 크래시 | Error Boundary로 격리, 에러 UI 표시 |
| **무시 가능** | Electron 미실행 시 IPC 소켓 없음 | 조용히 무시, 정상 동작 유지 |

---

## 에러 처리 레이어

예상한 에러부터 예상치 못한 에러까지, 레이어별로 처리 책임이 나뉜다:

```
렌더러 프로세스
  ├─ try/catch in hooks          예상한 IPC 에러 (설정 로드 실패 등)
  ├─ Error Boundary              렌더링 중 동기 에러
  ├─ useThrowToErrorBoundary     async 에러를 Boundary로 라우팅
  ├─ unhandledrejection 이벤트   그 외 모든 미처리 Promise rejection  ← 예상치 못한 에러
  └─ window.onerror              그 외 모든 미처리 동기 에러           ← 예상치 못한 에러

메인 프로세스
  ├─ try/catch                   예상한 에러
  ├─ unhandledRejection 이벤트   미처리 Promise rejection              ← 예상치 못한 에러
  └─ uncaughtException 이벤트    미처리 동기 에러 → 앱 종료            ← 예상치 못한 에러
```

각 레이어를 모두 구현해야 에러가 조용히 사라지지 않는다.

---

## React Error Boundary

컴포넌트 렌더링 중 발생한 에러는 Error Boundary가 잡는다.  
창 단위로 최상위에 하나를 두고, 필요한 경우 개별 섹션에 추가로 감싼다:

```tsx
// components/ErrorBoundary.tsx
import { Component, type ReactNode } from 'react'

interface Props {
  fallback?: ReactNode
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      return this.props.fallback ?? <ErrorScreen error={this.state.error} />
    }
    return this.props.children
  }
}
```

```tsx
// 창 최상위에 배치
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

Error Boundary는 **렌더링 중 동기적으로 throw된 에러만** 잡는다.  
아래는 잡지 못하므로 별도 처리가 필요하다:
- 이벤트 핸들러 내부 에러
- `useEffect` 내부 비동기 에러 (Promise, async/await)
- IPC 호출 에러

async 에러를 Error Boundary로 라우팅하려면 `useThrowToErrorBoundary` 훅을 쓴다.  
`useState` setter는 렌더링 중 실행되므로 거기서 throw하면 Boundary가 잡는다:

```tsx
// hooks/useThrowToErrorBoundary.ts
export function useThrowToErrorBoundary() {
  const [, setState] = useState<never>()
  return (error: Error) => {
    setState(() => { throw error })  // setState 콜백 → 렌더링 중 실행 → Boundary가 잡음
  }
}

// 사용 — async 에러를 Boundary로 라우팅
function SettingsPanel() {
  const throwToErrorBoundary = useThrowToErrorBoundary()

  useEffect(() => {
    window.electron.getSettings()
      .then(setSettings)
      .catch(throwToErrorBoundary)  // 이제 Error Boundary가 처리
  }, [])
}
```

단, 모든 async 에러를 Boundary로 보낼 필요는 없다.  
복구 가능한 에러(설정 로드 실패 → 기본값 사용)는 훅 내부에서 처리하고,  
복구 불가능한 에러(예상치 못한 크래시)만 Boundary로 올린다.

---

## IPC 에러 처리

`ipcRenderer.invoke` 는 main process에서 throw하면 reject된 Promise를 반환한다.  
훅에서 try/catch로 처리하고 컴포넌트에 에러 상태를 노출한다:

```ts
// hooks/useSettings.ts
export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    window.electron.getSettings()
      .then(setSettings)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err : new Error(String(err)))
      })
  }, [])

  const update = async (patch: Partial<AppSettings>): Promise<void> => {
    try {
      await window.electron.setSettings(patch)
      setSettings((prev) => prev ? { ...prev, ...patch } : null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
    }
  }

  return { settings, error, update }
}
```

훅을 쓰는 컴포넌트는 `error` 상태를 명시적으로 처리한다:

```tsx
const { settings, error } = useSettings()

if (error) return <p>설정을 불러올 수 없습니다.</p>
if (!settings) return <p>로딩 중...</p>
```

---

## ParseError 처리

`parseCliEvent` 등 파서는 실패 시 `ParseError`를 throw한다.  
경계 코드(IPC 서버)에서 잡아 로그를 남기고, 해당 메시지만 버린다:

```ts
// main/ipc-server.ts
socket.on('data', (buf) => {
  let raw: unknown
  try {
    raw = JSON.parse(buf.toString())
  } catch {
    log.warn('ipc: invalid JSON received', buf.toString())
    return
  }

  let event: CliEvent
  try {
    event = parseCliEvent(raw)
  } catch (err) {
    if (err instanceof ParseError) {
      log.warn('ipc: parse failed', { raw: err.raw, message: err.message })
      return  // 해당 메시지만 버리고 연결 유지
    }
    throw err  // ParseError가 아닌 예외는 다시 throw
  }

  sessionManager.handle(event)
})
```

---

## `useEffect` 비동기 에러

`useEffect` 내부의 async/await 에러는 Error Boundary가 잡지 못한다.  
반드시 try/catch로 처리하거나, 에러 상태를 통해 렌더링에서 처리한다:

```ts
// 금지 — 에러가 조용히 사라짐
useEffect(() => {
  async function load() {
    const data = await window.electron.getSettings()  // 에러 발생 시 무시됨
    setSettings(data)
  }
  load()
}, [])

// 허용
useEffect(() => {
  async function load() {
    try {
      const data = await window.electron.getSettings()
      setSettings(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
    }
  }
  load()
}, [])
```

---

## 전역 에러 수집 (예상치 못한 에러)

모든 레이어를 통과하고도 처리되지 않은 에러의 최후 방어선.  
로그를 남기고, renderer는 에러 화면으로 전환하거나 main은 앱을 안전하게 종료한다.

```ts
// renderer/src/main.tsx
// 미처리 Promise rejection — async 에러가 어디서도 catch되지 않은 경우
window.addEventListener('unhandledrejection', (event) => {
  window.electron.logError({
    type: 'unhandledrejection',
    reason: String(event.reason),
  })
  event.preventDefault()  // 브라우저 콘솔 기본 출력 억제
})

// 미처리 동기 에러 — 이벤트 핸들러 등에서 throw된 경우
window.addEventListener('error', (event) => {
  window.electron.logError({
    type: 'uncaught',
    message: event.message,
    stack: event.error?.stack,
  })
})
```

```ts
// main/index.ts
// 미처리 Promise rejection
process.on('unhandledRejection', (reason) => {
  log.error('unhandledRejection', reason)
  // main process는 죽지 않으므로 로그만 남기고 계속 실행
})

// 미처리 동기 에러 — main process가 죽을 수 있는 가장 심각한 케이스
process.on('uncaughtException', (err) => {
  log.error('uncaughtException', err)
  // main이 불안정한 상태이므로 안전하게 종료
  // 재시작이 필요하면 사용자에게 알리거나 auto-restart 설정
  app.quit()
})
```

### preload에서 main으로 에러 전달

renderer의 전역 에러를 main이 기록할 수 있도록 preload에 로그 채널을 노출한다:

```ts
// preload/index.ts
contextBridge.exposeInMainWorld('electron', {
  logError: (payload: ErrorPayload) => ipcRenderer.invoke('error:log', payload),
})

// main/index.ts
ipcMain.handle('error:log', (_, payload: ErrorPayload) => {
  log.error('[renderer]', payload)
})
```

---

## 에러 무시 규칙

아래 케이스는 명시적으로 무시하되, 주석으로 이유를 남긴다:

```ts
// Electron이 실행 중이지 않을 때 — CLI는 정상 동작해야 함
const socket = await connect().catch(() => null)  // null이면 IPC 없이 계속 진행

// 이미 destroy된 tray에 접근하는 경우 — 앱 종료 타이밍 race condition
try {
  tray.setImage(frame)
} catch {
  // tray destroyed during quit — ignore
}
```

이유 없이 `catch (() => {})` 로 에러를 삼키는 것은 금지한다.
