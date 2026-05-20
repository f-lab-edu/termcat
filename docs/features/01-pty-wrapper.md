# 기능 01 — PTY 래퍼 CLI

## 개요

`termcat <command> [args...]` 형태로 실행되는 CLI 진입점.  
`node-pty`로 PTY를 생성해 AI CLI를 자식 프로세스로 실행하고, 그 출력을 가로채 SpeedMonitor로 전달한다.

---

## 유저 스토리

- 사용자가 `termcat claude` 를 실행하면 평소처럼 Claude CLI가 열린다.
- 사용자는 래퍼 존재를 의식하지 않고 AI와 대화할 수 있다.
- 세션이 시작되면 메뉴바 고양이가 회전을 시작한다.

---

## 입력 / 출력

| 항목 | 내용 |
|------|------|
| 입력 | `process.argv[2..]` — 실행할 명령어와 인수 |
| 출력 | PTY stdout을 그대로 사용자 터미널에 패스스루 |
| 부수효과 | IPC로 Electron main에 세션 시작/출력 이벤트 전달 |

---

## 기술 구현

### PTY 생성

```ts
import pty from 'node-pty'

const shell = pty.spawn(command, args, {
  name: 'xterm-256color',
  cols: process.stdout.columns ?? 80,
  rows: process.stdout.rows ?? 24,
  cwd: process.cwd(),
  env: process.env,
})
```

- `process.stdout.columns/rows`를 그대로 넘겨 터미널 크기를 유지
- `TERM=xterm-256color`로 색상/이스케이프 시퀀스 지원

### 패스스루

```ts
// PTY → 사용자 터미널
shell.onData((data) => {
  process.stdout.write(data)
  speedMonitor.feed(data)
})

// 사용자 터미널 → PTY (stdin 포워딩)
process.stdin.setRawMode(true)
process.stdin.on('data', (data) => shell.write(data.toString()))
```

### 터미널 크기 변경 동기화

```ts
process.stdout.on('resize', () => {
  shell.resize(process.stdout.columns, process.stdout.rows)
})
```

### IPC 연결

- Electron main process가 먼저 실행 중이어야 함
- CLI → Electron IPC 방식: **Unix Domain Socket** (`/tmp/termcat-<uid>.sock`)
  - Electron main이 소켓 서버를 열고 대기
  - CLI 프로세스가 소켓에 연결해 JSON 이벤트를 전송

```ts
// CLI → Electron으로 보내는 이벤트 형태
type CliEvent =
  | { type: 'session:start'; pid: number; command: string }
  | { type: 'session:data'; pid: number; chars: number; timestamp: number }
  | { type: 'session:exit'; pid: number; code: number }
```

---

## 완료 조건 (Acceptance Criteria)

- [ ] `termcat claude` 실행 시 Claude CLI가 정상 실행됨
- [ ] PTY 크기가 현재 터미널과 동일하게 유지됨 (크기 변경 시 동기화)
- [ ] 터미널 색상/이스케이프 시퀀스가 깨지지 않음
- [ ] Ctrl+C 등 시그널이 자식 프로세스에 정상 전달됨
- [ ] 자식 프로세스 종료 시 CLI도 같은 exit code로 종료됨
- [ ] Electron이 실행 중이지 않아도 CLI는 정상 동작 (IPC 연결 실패 시 무시)

---

## 관련 파일

| 파일 | 설명 |
|------|------|
| `src/cli/index.ts` | CLI 진입점 (package.json `bin` 등록) |
| `src/cli/pty-wrapper.ts` | PTY 생성 및 패스스루 로직 |
| `src/cli/ipc-client.ts` | Electron과의 IPC 클라이언트 |
| `src/main/ipc-server.ts` | Electron main의 IPC 서버 |
