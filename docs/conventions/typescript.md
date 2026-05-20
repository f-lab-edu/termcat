# TypeScript 컨벤션

## 포매터 & 린터

저장 시 Prettier가 자동 포맷하고, ESLint가 import 순서를 정렬한다.  
VS Code에서 `.vscode/settings.json` 이 이미 설정되어 있으므로 별도 작업 없이 동작한다.

### Prettier 규칙 (`.prettierrc`)

| 옵션 | 값 | 의미 |
|------|-----|------|
| `semi` | `false` | 세미콜론 없음 |
| `singleQuote` | `true` | 작은따옴표 |
| `printWidth` | `100` | 한 줄 최대 100자 |
| `trailingComma` | `"es5"` | 배열·객체 마지막 쉼표 |
| `tabWidth` | `2` | 들여쓰기 2칸 |
| `arrowParens` | `"always"` | 화살표 함수 매개변수 항상 괄호 |

### import 순서 (ESLint `simple-import-sort`)

```ts
// 1. Node.js 내장 모듈
import { join } from 'node:path'

// 2. 외부 패키지
import { app, Tray } from 'electron'
import { create } from 'zustand'

// 3. 내부 절대 경로
import type { SpeedLevel } from '@shared/types'

// 4. 상대 경로 (부모 → 현재)
import { SpeedMonitor } from '../speed-monitor'
import { parseCliEvent } from './parsers'
```

그룹 사이에 빈 줄 하나. 저장 시 ESLint `--fix` 가 자동 정렬한다.

### type import 강제

값이 아닌 타입만 import할 때는 `import type` 을 사용한다 — ESLint가 자동 교정:

```ts
// 금지 (ESLint 에러)
import { SpeedLevel } from '@shared/types'

// 허용
import type { SpeedLevel } from '@shared/types'
```

### 커맨드

```bash
npm run format        # Prettier 포맷 적용
npm run format:check  # CI용 포맷 검사
npm run lint          # ESLint 검사
npm run lint:fix      # ESLint 자동 수정
```

---

## 컴파일러 설정

`strict: true` 가 항상 활성화되어야 한다. tsconfig에서 아래 옵션이 모두 켜진 상태여야 한다:

```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "noImplicitReturns": true,
  "exactOptionalPropertyTypes": true
}
```

---

## 타입 선언

### `interface` vs `type`

객체 형태는 `interface`, 유니온·교차·튜플은 `type`:

```ts
// 객체 → interface
interface Session {
  pid: number;
  command: string;
  startedAt: number;
}

// 유니온 → type
type SpeedLevel = "idle" | "slow" | "mid" | "fast";

// 이벤트 판별 유니온 → type
type CliEvent =
  | { type: "session:start"; pid: number; command: string }
  | { type: "session:data"; pid: number; chars: number; timestamp: number }
  | { type: "session:exit"; pid: number; code: number };
```

### `any` 금지

`any` 대신 `unknown` 을 쓰고 narrowing으로 처리한다:

```ts
// 금지
function parse(data: any) {
  return data.value;
}

// 허용
function parse(data: unknown): string {
  if (typeof data === "object" && data !== null && "value" in data) {
    return String((data as { value: unknown }).value);
  }
  throw new Error("unexpected shape");
}
```

IPC 소켓에서 수신한 JSON 등 외부 경계에서는 `zod` 또는 타입 가드로 검증한다.

---

## Parse, Don't Validate

외부에서 들어온 데이터를 `boolean`으로 검사하는 대신, **타입이 증명된 값을 반환하는 파서**를 만든다.  
한 번 파싱을 통과한 값은 이후 코드에서 다시 검사하지 않는다.

### 시스템 경계 정의

termcat에서 외부 데이터가 들어오는 지점:

| 경계                    | 데이터          |
| ----------------------- | --------------- |
| CLI → main IPC 소켓     | `CliEvent` JSON |
| `electron-store` 디스크 | `AppSettings`   |
| preload → renderer      | IPC 페이로드    |

### 파일 구조

타입과 파서 모두 도메인별로 분리한다.  
`index.ts` re-export 덕분에 외부 import 경로(`@shared/types`, `@shared/parsers`)는 변하지 않는다:

```
src/shared/
  types/
    cli-event.ts        ← CliEvent
    app-settings.ts     ← AppSettings
    speed-level.ts      ← SpeedLevel
    session.ts          ← SessionInfo
    ipc.ts              ← IpcChannel
    index.ts            ← 전체 re-export
  parsers/
    cli-event.ts        ← parseCliEvent()
    app-settings.ts     ← parseAppSettings()
    errors.ts           ← ParseError
    index.ts            ← 파서 re-export
```

각 타입 파일은 해당 도메인 타입만 선언한다:

```ts
// shared/types/speed-level.ts
export type SpeedLevel = 'idle' | 'slow' | 'mid' | 'fast'

// shared/types/cli-event.ts
export type CliEvent =
  | { type: 'session:start'; pid: number; command: string }
  | { type: 'session:data'; pid: number; chars: number; timestamp: number }
  | { type: 'session:exit'; pid: number; code: number }

// shared/types/index.ts — re-export만, 선언 없음
export type { SpeedLevel } from './speed-level'
export type { CliEvent } from './cli-event'
export type { AppSettings } from './app-settings'
export type { SessionInfo } from './session'
export type { IpcChannel } from './ipc'
```

### 파서 구현

외부 라이브러리 없이 타입 가드 + narrowing으로 작성한다.  
파싱 실패 시 `ParseError`를 throw해 호출부에서 명시적으로 처리하게 한다:

```ts
// shared/parsers/errors.ts
export class ParseError extends Error {
  constructor(
    message: string,
    public readonly raw: unknown,
  ) {
    super(message);
    this.name = "ParseError";
  }
}
```

```ts
// shared/parsers/cli-event.ts
import type { CliEvent } from "../types";
import { ParseError } from "./errors";

export function parseCliEvent(raw: unknown): CliEvent {
  if (typeof raw !== "object" || raw === null || !("type" in raw)) {
    throw new ParseError("CliEvent: not an object", raw);
  }

  const obj = raw as Record<string, unknown>;

  switch (obj["type"]) {
    case "session:start":
      if (
        typeof obj["pid"] !== "number" ||
        typeof obj["command"] !== "string"
      ) {
        throw new ParseError("CliEvent: invalid session:start fields", raw);
      }
      return {
        type: "session:start",
        pid: obj["pid"],
        command: obj["command"],
      };

    case "session:data":
      if (
        typeof obj["pid"] !== "number" ||
        typeof obj["chars"] !== "number" ||
        typeof obj["timestamp"] !== "number"
      ) {
        throw new ParseError("CliEvent: invalid session:data fields", raw);
      }
      return {
        type: "session:data",
        pid: obj["pid"],
        chars: obj["chars"],
        timestamp: obj["timestamp"],
      };

    case "session:exit":
      if (typeof obj["pid"] !== "number" || typeof obj["code"] !== "number") {
        throw new ParseError("CliEvent: invalid session:exit fields", raw);
      }
      return { type: "session:exit", pid: obj["pid"], code: obj["code"] };

    default:
      throw new ParseError(`CliEvent: unknown type "${obj["type"]}"`, raw);
  }
}
```

### 호출 위치

```ts
// main/ipc-server.ts — 경계에서 한 번만 파싱
socket.on("data", (buf) => {
  const event = parseCliEvent(JSON.parse(buf.toString())); // 여기서만 검증
  sessionManager.handle(event); // 이후엔 타입 신뢰
});
```

```ts
// main/session-manager.ts — 파싱 이후, 방어 코드 없음
handle(event: CliEvent): void {
  switch (event.type) {
    case 'session:start':
      this.onStart(event.pid, event.command)
      break
    case 'session:data':
      this.onData(event.pid, event.chars, event.timestamp)
      break
    case 'session:exit':
      this.onExit(event.pid)
      break
  }
}
```

### import 규칙

- 타입은 `@shared/types` 에서 import
- 파서 함수는 `@shared/parsers` 에서 import — 경계 코드에서만 사용

```ts
import type { CliEvent } from "@shared/types";
import { parseCliEvent } from "@shared/parsers";
```

### 금지 패턴

```ts
// 금지 — boolean 검증 후 다시 캐스팅
function isCliEvent(data: unknown): data is CliEvent {
  return typeof data === 'object' && data !== null && 'type' in data
}

if (isCliEvent(raw)) {
  // raw.command 접근 시 타입이 좁혀지지 않아 추가 체크 필요
}

// 금지 — 내부 로직에서 또 검증
handle(event: CliEvent): void {
  if (!event.pid) return  // 이미 파싱된 값을 다시 검사
}
```

---

## Export 규칙

`export default` 금지. named export만 사용한다:

```ts
// 금지
export default class SpeedMonitor {}
export default function createTray() {}

// 허용
export class SpeedMonitor {}
export function createTray(): Tray {}
```

파일 하나에 주요 export가 하나일 때 파일명과 export명을 일치시킨다:

```
speed-monitor.ts  →  export class SpeedMonitor
tray-animator.ts  →  export class TrayAnimator
```

---

## 함수 & 클래스

상태를 가지면 클래스, 순수 변환이면 함수:

```ts
// 상태 O → 클래스
export class SpeedMonitor {
  private buffer: Array<{ ts: number; chars: number }> = []
  feed(chars: number): void { ... }
  currentLevel(): SpeedLevel { ... }
}

// 순수 변환 → 함수
export function classifySpeed(cps: number, thresholds: Thresholds): SpeedLevel { ... }
```

비동기는 Promise 반환 함수로, callback 패턴은 사용하지 않는다:

```ts
// 금지
function readConfig(cb: (err: Error | null, data: Config) => void): void;

// 허용
async function readConfig(): Promise<Config>;
```

---

## 에러 처리

`Error` 서브클래스로 에러를 구분한다. 문자열을 throw하지 않는다:

```ts
export class IpcConnectionError extends Error {
  constructor(socketPath: string) {
    super(`IPC socket not found: ${socketPath}`);
    this.name = "IpcConnectionError";
  }
}
```

Electron main process에서 처리되지 않은 Promise rejection은 반드시 catch한다:

```ts
process.on("unhandledRejection", (reason) => {
  log.error("unhandled rejection", reason);
});
```

---

## 공통 타입 위치

프로세스 경계를 넘는 타입은 반드시 `src/shared/types/` 에 도메인별로 정의한다.  
main/renderer/cli 각자 중복 선언 금지.

| 파일 | 타입 |
|------|------|
| `types/cli-event.ts` | `CliEvent` |
| `types/app-settings.ts` | `AppSettings` |
| `types/speed-level.ts` | `SpeedLevel` |
| `types/session.ts` | `SessionInfo` |
| `types/ipc.ts` | `IpcChannel` |

import는 항상 `@shared/types` 경로로 한다 — 도메인 파일 직접 참조 금지:

```ts
// 허용
import type { CliEvent, SpeedLevel } from '@shared/types'

// 금지
import type { CliEvent } from '@shared/types/cli-event'
```
