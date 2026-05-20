# 아키텍처 원칙

## 단일 책임

하나의 파일·클래스·함수는 하나의 이유로만 변경된다.

`SpeedMonitor`는 속도를 측정한다. Tray를 건드리지 않는다.  
`TrayAnimator`는 아이콘을 교체한다. 속도를 계산하지 않는다.  
`SessionManager`는 세션 목록을 관리한다. IPC 소켓을 직접 열지 않는다.

책임이 두 개라는 신호:
- 클래스 이름에 `And`가 들어간다 (`SpeedMonitorAndTrayUpdater`)
- 메서드를 설명하려면 "그리고"가 필요하다
- 한 파일을 고쳤는데 관련 없는 테스트가 깨진다

---

## 파일 크기

**파일 하나에 200줄을 넘기지 않는다. 300줄은 분리 신호다.**

줄 수 자체가 목적이 아니다. 파일이 길어진다는 건 책임이 늘어났다는 뜻이다.  
200줄이 넘으면 어떤 책임을 분리할 수 있는지 먼저 찾는다.

```
// 분리 전
ipc-server.ts  340줄  (소켓 관리 + 이벤트 파싱 + 세션 라우팅)

// 분리 후
ipc-server.ts      80줄  소켓 생성, 연결 관리
ipc-dispatcher.ts  90줄  수신 메시지 → 이벤트 파싱 + 라우팅
```

---

## 단방향 레이어

의존성은 아래 방향으로만 흐른다. 역방향 참조는 순환 의존을 만든다.

```
CLI Process
    ↓  (IPC 이벤트 전송)
Main Process
    ↓  (상태 push)
Renderer Process
```

레이어 규칙:

| 레이어 | 참조 가능 | 참조 불가 |
|--------|-----------|----------|
| `cli/` | `shared/` | `main/`, `renderer/` |
| `main/` | `shared/` | `cli/`, `renderer/` |
| `renderer/` | `shared/` | `cli/`, `main/` |
| `shared/` | 없음 | 모두 |

`main/`이 `renderer/`의 컴포넌트를 import하거나,  
`renderer/`가 `main/`의 클래스를 직접 import하면 레이어 위반이다.  
프로세스 간 통신은 반드시 IPC를 통한다.

---

## 추상화 시점

지금 필요한 것만 만든다. 미래를 위한 코드는 작성하지 않는다.

```ts
// 금지 — 쓰이지 않는 유연성
class AnimatorBase {
  protected abstract getFrames(): NativeImage[]
  protected abstract getInterval(level: SpeedLevel): number
}
class CatAnimator extends AnimatorBase { ... }

// 허용 — 지금 필요한 것만
class TrayAnimator {
  setLevel(level: SpeedLevel): void { ... }
}
```

같은 코드가 **세 번** 반복될 때 추상화를 고려한다.  
두 번은 복사한다.
