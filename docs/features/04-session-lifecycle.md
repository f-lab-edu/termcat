# 기능 04 — 세션 라이프사이클 관리

## 개요

CLI 프로세스가 시작/종료될 때 Electron main의 세션 상태를 관리하고,  
TrayAnimator에 올바른 속도 레벨을 전달한다.

---

## 상태 머신

```
          termcat <cmd> 실행
               │
               ▼
          ┌─────────┐
          │ RUNNING │ ◀─── session:data (chars 갱신)
          └────┬────┘
               │ session:exit 또는 IPC 연결 끊김
               ▼
          ┌─────────┐
          │  IDLE   │
          └─────────┘
```

| 상태 | 설명 | 트레이 레벨 |
|------|------|------------|
| `IDLE` | 활성 세션 없음 | `idle` |
| `RUNNING` | 하나 이상의 세션 활성 | SpeedMonitor 결과 |

---

## IPC 이벤트 처리

Electron main의 IPC 서버가 수신하는 이벤트:

```ts
// 세션 시작 — CLI 연결 직후 전송
{ type: 'session:start'; pid: number; command: string }

// 출력 데이터 — 100ms 마다
{ type: 'session:data'; pid: number; chars: number; timestamp: number }

// 세션 종료 — 자식 프로세스 exit 시
{ type: 'session:exit'; pid: number; code: number }
```

### SessionManager

```ts
class SessionManager {
  private sessions = new Map<number, Session>()

  onStart(pid: number, command: string): void {
    this.sessions.set(pid, { pid, command, startedAt: Date.now(), monitor: new SpeedMonitor() })
  }

  onData(pid: number, chars: number, timestamp: number): void {
    this.sessions.get(pid)?.monitor.feed(chars, timestamp)
  }

  onExit(pid: number): void {
    this.sessions.delete(pid)
  }

  currentLevel(): SpeedLevel {
    if (this.sessions.size === 0) return 'idle'
    // 다중 세션: 가장 빠른 레벨 사용
    const levels = [...this.sessions.values()].map((s) => s.monitor.currentLevel())
    return maxLevel(levels)
  }
}
```

---

## 이상 케이스 처리

| 케이스 | 처리 |
|--------|------|
| CLI 프로세스가 비정상 종료 (SIGKILL 등) | IPC 소켓 끊김 감지 → 해당 세션 제거 |
| Electron 재시작 시 고아 세션 | 소켓 재생성, 기존 세션 정리 |
| `session:exit` 없이 소켓 닫힘 | 동일하게 세션 제거 처리 |

---

## 완료 조건

- [ ] `termcat claude` 실행 시 RUNNING 상태로 전환됨
- [ ] AI CLI 종료 시 IDLE로 복귀 (고양이 정지)
- [ ] 비정상 종료(프로세스 kill) 시에도 3초 이내 IDLE로 복귀
- [ ] 동시에 세션이 2개 이상일 때 가장 빠른 레벨이 반영됨

---

## 관련 파일

| 파일 | 설명 |
|------|------|
| `src/main/session-manager.ts` | SessionManager 클래스 |
| `src/main/ipc-server.ts` | Unix Domain Socket IPC 서버 |
| `src/shared/types.ts` | `Session`, `SpeedLevel` 타입 |
