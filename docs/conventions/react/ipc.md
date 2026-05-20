# React — IPC 래핑 규칙

`window.electron.*` 직접 호출을 컴포넌트에서 하지 않는다.  
반드시 커스텀 훅으로 래핑한다.

---

## 요청/응답 패턴

```ts
// hooks/useSettings.ts
export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    window.electron.getSettings()
      .then(setSettings)
      .catch((err: unknown) => setError(err instanceof Error ? err : new Error(String(err))))
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

---

## 이벤트 구독 패턴

구독과 cleanup을 훅이 책임진다:

```ts
// hooks/useSessionUpdates.ts
export function useSessionUpdates(): void {
  useEffect(() => {
    const unsubscribe = window.electron.onSessionUpdate((payload) => {
      sessionActions.setLevel(payload.level)
    })
    return unsubscribe  // 컴포넌트 unmount 시 구독 해제
  }, [])
}
```

---

## 에러 처리

훅에서 `error` 상태를 반환하고, 컴포넌트는 이를 명시적으로 처리한다:

```tsx
const { settings, error } = useSettings()

if (error) return <p>설정을 불러올 수 없습니다.</p>
if (!settings) return <p>로딩 중...</p>
```

IPC 에러 상세 처리는 [../error-handling.md](../error-handling.md) 참조.
