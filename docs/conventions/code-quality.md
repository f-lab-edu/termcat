# 좋은 코드 원칙

**좋은 코드 = 변경하기 쉬운 코드**. 가독성·예측 가능성·응집도·결합도 네 가지로 평가한다.

---

## 1. 가독성 (Readability)

### 한 단위에서 다루는 개념은 6~7개 이하

코드 한 블록(함수, 컴포넌트)이 한 번에 처리하는 개념이 너무 많으면 쪼개야 한다.

```ts
// 금지 — 조건·부작용·계산이 한 함수에
function handleSessionData(event: CliEvent) {
  if (event.type === 'session:data') {
    const elapsed = Date.now() - event.timestamp
    const cps = event.chars / (elapsed / 1000)
    if (cps > 100) speedLevel = 'fast'
    else if (cps > 50) speedLevel = 'mid'
    else if (cps > 10) speedLevel = 'slow'
    else speedLevel = 'idle'
    tray.setImage(sprites[speedLevel])
    store.set('lastSpeed', speedLevel)
  }
}

// 허용 — 역할별로 분리
function handleSessionData(event: SessionDataEvent) {
  const level = classifySpeed(event.chars, event.timestamp)
  tray.setImage(sprites[level])
  store.set('lastSpeed', level)
}
```

### 복잡한 조건은 이름을 붙인다

```ts
// 금지
if (session.pid !== null && session.startedAt > 0 && !session.isExited) { ... }

// 허용
const isSessionActive = session.pid !== null && session.startedAt > 0 && !session.isExited
if (isSessionActive) { ... }
```

### ternary 중첩은 2단계 이하

```ts
// 금지
const label = isActive ? isAI ? 'AI 활성' : '일반 활성' : isSleeping ? '슬립' : '비활성'

// 허용 — 조건 분기가 많으면 if/else 또는 객체 맵
const statusMap: Record<SessionStatus, string> = {
  active_ai: 'AI 활성',
  active: '일반 활성',
  sleeping: '슬립',
  inactive: '비활성',
}
const label = statusMap[status]
```

### 추상화 수준을 통일한다

같은 함수 안에서 고수준 호출과 저수준 구현을 섞지 않는다.

```ts
// 금지 — 고수준(tray 업데이트)과 저수준(배열 인덱스 계산)이 혼재
function animate() {
  updateTrayIcon()
  frameIndex = (frameIndex + 1) % sprites.length  // 저수준 계산이 여기 있음
  setTimeout(animate, 120)
}

// 허용 — 같은 추상화 수준끼리
function animate() {
  updateTrayIcon()
  advanceFrame()
  scheduleNextFrame()
}
```

---

## 2. 예측 가능성 (Predictability)

### 같은 이름의 함수는 동일하게 동작한다

같은 카테고리 함수(예: validate*)는 반환 타입이 일치해야 한다.

```ts
// 금지 — 반환 타입이 제각각
function validatePid(pid: unknown): boolean { ... }
function validateCommand(cmd: unknown): string | null { ... }

// 허용 — 일관된 반환 타입
interface ValidationResult {
  ok: boolean
  reason?: string
}
function validatePid(pid: unknown): ValidationResult { ... }
function validateCommand(cmd: unknown): ValidationResult { ... }
```

### 숨겨진 로직은 시그니처에 드러낸다

```ts
// 금지 — 함수 이름만 보면 부작용을 알 수 없음
function getSpeedLevel(chars: number): SpeedLevel {
  log.info('speed calculated')  // 숨겨진 부작용
  return classifySpeed(chars)
}

// 허용 — 부작용이 있으면 이름에 드러내거나 분리
function calculateAndLogSpeed(chars: number): SpeedLevel {
  const level = classifySpeed(chars)
  log.info('speed calculated', level)
  return level
}
```

---

## 3. 응집도 (Cohesion)

### 같이 바뀌는 파일은 같이 둔다

기능 단위로 파일을 모은다. 레이어별 분리(모든 hooks/, 모든 utils/)보다 맥락별 분리가 우선이다.

```
// 금지 — 레이어별 분리
hooks/useSessionStats.ts
utils/formatTokens.ts
components/StatsPanel.tsx

// 허용 — 맥락별 분리 (같이 변경될 가능성이 높은 것끼리)
features/stats/
  StatsPanel.tsx
  useSessionStats.ts
  formatTokens.ts
```

### 매직 넘버는 상수로 추출한다

```ts
// 금지
if (contextUsedPercent > 80) { ... }
setTimeout(animate, 120)

// 허용
const CONTEXT_WARN_THRESHOLD = 80
const ANIMATION_FRAME_MS = 120

if (contextUsedPercent > CONTEXT_WARN_THRESHOLD) { ... }
setTimeout(animate, ANIMATION_FRAME_MS)
```

---

## 4. 결합도 (Coupling)

### Props Drilling은 3단계를 넘기지 않는다

3단계를 초과하면 Context API 또는 Zustand로 전달한다.

```tsx
// 금지 — stats가 3단계 이상 내려감
<App stats={stats}>
  <PopupWindow stats={stats}>
    <StatsPanel stats={stats}>
      <ContextBar stats={stats} />  // 4단계
```

### 전략적 중복을 허용한다

코드를 억지로 공통화했을 때 결합도가 높아진다면, 일부 중복을 허용한다.

```ts
// 경우에 따라 두 컴포넌트가 비슷해 보여도 변경 이유가 다르면 분리 유지
// PopupStatsPanel — 팝업 창용, 밀도 높게
// TrayTooltipStats — 툴팁용, 간결하게
// → 억지로 합치면 둘 다 변경할 때마다 서로 영향을 줌
```

---

## 5. 선언적 컴포넌트 설계

### "무엇을"을 묘사하고 "어떻게"는 숨긴다

```tsx
// 명령형 — 어떻게 동작하는지 노출
function StatsPanel() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) log.info('stats visible')
    })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  return <div ref={ref}>...</div>
}

// 선언적 — 의도만 드러남
function StatsPanel() {
  return (
    <ImpressionArea onImpression={() => log.info('stats visible')}>
      ...
    </ImpressionArea>
  )
}
```

### 컴포넌트 분리 기준

다음 중 하나라도 해당하면 분리를 고려한다:

- 다른 곳에서도 쓰일 것 같다 → 재사용을 위한 분리
- 단독으로 테스트하고 싶다 → 테스트를 위한 분리
- 조건이 복잡해져서 안쪽 로직이 보이지 않는다 → 가독성을 위한 분리
- 변경 이유가 다르다 → 응집도를 위한 분리

분리가 불필요한 경우: 미래 재사용이 불확실할 때 → 섣부른 추상화 금지.
