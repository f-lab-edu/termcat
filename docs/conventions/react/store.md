# React — 상태 관리 (Zustand)

## 스토어 구조

`src/renderer/src/store/` 에 기능별로 분리한다:

```
store/
  session.ts    현재 세션 상태, 속도 레벨
  settings.ts   앱 설정 (IPC로 main과 동기화)
```

---

## State / Actions 분리 패턴

State 타입과 Actions 타입을 별도로 선언하고, actions는 스토어 바깥 모듈 함수로 뺀다.  
이 구조는 React 훅 없이도 action을 호출할 수 있어 IPC 이벤트 핸들러나 테스트에서 유용하다.

```ts
// store/session.ts
import { create } from 'zustand'
import type { SpeedLevel, SessionInfo } from '@shared/types'

// State 타입 — 순수 데이터만
interface SessionState {
  sessions: SessionInfo[]
  currentLevel: SpeedLevel
}

// Actions 타입 — 상태 변경 함수만
interface SessionActions {
  setLevel: (level: SpeedLevel) => void
  addSession: (session: SessionInfo) => void
  removeSession: (pid: number) => void
}

// 스토어는 State만 보유 (초기값만 선언)
export const useSessionStore = create<SessionState>(() => ({
  sessions: [],
  currentLevel: 'idle',
}))

// Actions는 모듈 레벨 함수로 분리 — 컴포넌트 바깥에서도 호출 가능
export const sessionActions: SessionActions = {
  setLevel: (level) => useSessionStore.setState({ currentLevel: level }),
  addSession: (session) =>
    useSessionStore.setState((s) => ({ sessions: [...s.sessions, session] })),
  removeSession: (pid) =>
    useSessionStore.setState((s) => ({ sessions: s.sessions.filter((s) => s.pid !== pid) })),
}
```

---

## 사용 패턴

컴포넌트에서는 state 구독과 action 호출을 분리한다:

```tsx
// 상태 구독 — hook으로
const currentLevel = useSessionStore((s) => s.currentLevel)

// action 호출 — hook 없이 직접 import
import { sessionActions } from '../store/session'
sessionActions.setLevel('fast')
```

IPC 이벤트 핸들러(훅 바깥)에서도 동일하게 사용한다:

```ts
// hooks/useSessionUpdates.ts
useEffect(() => {
  const unsubscribe = window.electron.onSessionUpdate((payload) => {
    sessionActions.setLevel(payload.level)  // hook 없이 직접 호출
  })
  return unsubscribe
}, [])
```
