# React — 컴포넌트 구조

## 파일 내 선언 순서

```tsx
// 1. 외부 import
import { useEffect } from 'react'

// 2. 내부 import (타입 → 스타일 → 훅 → 컴포넌트 순)
import type { SessionInfo } from '@shared/types'
import * as styles from './StatusPopup.css'
import { useSession } from '../hooks/useSession'

// 3. 컴포넌트 내부 타입
interface Props {
  onClose: () => void
}

// 4. 컴포넌트 본체
export function StatusPopup({ onClose }: Props): JSX.Element {
  // ...
}
```

---

## 성능 주의사항

- `setInterval` / `setTimeout` 은 `useEffect` cleanup에서 반드시 해제
- 세션 상태는 100ms마다 IPC로 수신 → 불필요한 리렌더링을 막기 위해 `useMemo` / `useCallback` 적절히 사용
- 팝업 윈도우는 DOM이 작으므로 최적화보다 코드 명확성 우선
- 에러 처리 패턴은 [../error-handling.md](../error-handling.md) 참조
