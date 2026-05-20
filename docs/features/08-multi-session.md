# 기능 08 — 다중 세션 지원 (Should)

## 개요

`termcat`을 여러 터미널 탭에서 동시에 실행하면,  
메뉴바에 고양이 여러 마리가 각자 독립적인 속도로 회전한다.

---

## 유저 스토리

- 터미널 창 2개에서 각각 `termcat claude`를 실행하면 메뉴바에 고양이 2마리가 나타난다.
- 각 고양이는 해당 세션의 토큰 속도를 독립적으로 반영한다.
- 세션이 종료되면 해당 고양이만 사라진다.

---

## 구현 방향

### Tray 인스턴스 동적 생성

Electron은 Tray 인스턴스를 여러 개 생성할 수 있음:

```ts
class MultiTrayManager {
  private trays = new Map<number, { tray: Tray; animator: TrayAnimator }>()

  addSession(pid: number): void {
    const tray = new Tray(idleIcon)
    const animator = new TrayAnimator(tray)
    this.trays.set(pid, { tray, animator })
  }

  removeSession(pid: number): void {
    const entry = this.trays.get(pid)
    if (!entry) return
    entry.animator.stop()
    entry.tray.destroy()
    this.trays.delete(pid)
  }

  updateLevel(pid: number, level: SpeedLevel): void {
    this.trays.get(pid)?.animator.setLevel(level)
  }
}
```

### 세션 순서 고정

macOS 메뉴바는 Tray 생성 순서대로 왼쪽부터 표시됨.  
세션 시작 순서를 유지해 고양이 위치가 일관되게 유지.

---

## 완료 조건

- [ ] 동시에 2개 세션 실행 시 고양이 2마리 표시
- [ ] 각 세션의 속도가 독립적으로 반영됨
- [ ] 세션 종료 시 해당 고양이만 메뉴바에서 제거됨
- [ ] 세션이 0개일 때 고양이가 1마리(idle) 또는 0마리로 설정 가능

---

## 관련 파일

| 파일 | 설명 |
|------|------|
| `src/main/multi-tray-manager.ts` | 다중 Tray 관리 |
| `src/main/session-manager.ts` | 세션별 SpeedMonitor |
