# 기능 02 — chars/sec 측정 & 속도 분류

## 개요

PTY 출력 스트림의 초당 문자 수(`chars/sec`)를 슬라이딩 윈도우로 측정하고,  
속도를 `idle / slow / mid / fast` 4단계로 분류해 Electron main에 전달한다.

---

## 유저 스토리

- AI가 토큰을 빠르게 생성할수록 고양이가 빠르게 회전한다.
- AI가 답변을 생각 중이거나 입력을 기다리면 고양이가 느리게 돈다.
- 세션이 없으면 고양이가 멈춘다.

---

## 속도 단계 정의

| 단계 | chars/sec | 의미 | 고양이 상태 |
|------|-----------|------|------------|
| `idle` | 0 | 세션 없음 | 정지 |
| `slow` | 0 < x ≤ 10 | 대기 중 / 입력 받는 중 | 느리게 회전 |
| `mid` | 10 < x ≤ 80 | 도구 실행 / 파일 쓰기 | 중간 속도 |
| `fast` | x > 80 | 토큰 생성 중 | 빠르게 회전 |

> 임계값은 설정에서 커스터마이즈 가능해야 함 (기능 10 참조)

---

## 측정 알고리즘

### 슬라이딩 윈도우

- 윈도우 크기: **1000ms**
- 매 **100ms** 마다 현재 윈도우 내 문자 수 집계 → `chars/sec` 계산
- 0으로 수렴하는 구간에서 즉각 반응하도록 데이터가 없으면 즉시 `slow` 로 전환

```ts
class SpeedMonitor {
  private readonly windowMs = 1000
  private readonly tickMs = 100
  private buffer: Array<{ ts: number; chars: number }> = []

  feed(data: string): void {
    this.buffer.push({ ts: Date.now(), chars: data.length })
  }

  tick(): SpeedLevel {
    const now = Date.now()
    this.buffer = this.buffer.filter((e) => now - e.ts <= this.windowMs)
    const total = this.buffer.reduce((s, e) => s + e.chars, 0)
    const cps = total / (this.windowMs / 1000)
    return this.classify(cps)
  }

  private classify(cps: number): SpeedLevel {
    if (cps === 0) return 'slow'     // 세션 중이지만 출력 없음
    if (cps <= 10) return 'slow'
    if (cps <= 80) return 'mid'
    return 'fast'
  }
}
```

### 스무딩 (급격한 속도 변화 억제)

- 연속 3 tick 이상 같은 단계가 유지될 때만 레벨 전환
- 단, `idle` 전환(세션 종료)은 즉각 반응

---

## IPC 이벤트 페이로드

```ts
// 100ms 마다 Electron main으로 전송
{ type: 'session:data'; pid: number; chars: number; timestamp: number }
```

Electron main에서 직접 SpeedMonitor를 돌려 레벨을 계산한다 (CLI는 raw 데이터만 전송).

---

## 완료 조건

- [ ] 슬라이딩 윈도우 1000ms 기준 `chars/sec` 계산이 정확함
- [ ] 100ms 간격으로 tick 발생 (requestAnimationFrame 아닌 setInterval)
- [ ] 출력이 없는 구간에서 1초 이내 `slow`로 전환됨
- [ ] 속도 단계 전환이 급격하지 않음 (스무딩 적용)
- [ ] 임계값이 설정값에 따라 교체 가능한 구조

---

## 관련 파일

| 파일 | 설명 |
|------|------|
| `src/main/speed-monitor.ts` | SpeedMonitor 클래스 |
| `src/shared/types.ts` | `SpeedLevel` 타입 정의 |
