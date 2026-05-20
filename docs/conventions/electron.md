# Electron 컨벤션

## 프로세스 경계

termcat은 세 가지 프로세스 컨텍스트가 존재한다:

| 프로세스 | 파일 위치 | Node.js 접근 | DOM 접근 |
|---------|-----------|-------------|---------|
| **main** | `src/main/` | O | X |
| **preload** | `src/preload/` | 제한적 | X |
| **renderer** | `src/renderer/` | X (IPC만) | O |
| **CLI** | `src/cli/` | O | X |

각 프로세스에서 상대방 프로세스의 API를 직접 import하지 않는다.  
`src/shared/` 의 타입만 공유한다.

---

## IPC 패턴

### Renderer ↔ Main (창 UI)

`ipcMain.handle` / `ipcRenderer.invoke` 쌍을 사용한다. 단방향 `.send`/`.on` 은 이벤트 스트림(세션 상태 업데이트)에만 허용한다:

```ts
// main — 요청/응답 패턴
ipcMain.handle('settings:get', () => store.get())
ipcMain.handle('settings:set', (_, patch: Partial<AppSettings>) => store.set(patch))

// main → renderer 단방향 (상태 push)
mainWindow.webContents.send('session:update', payload)
```

```ts
// preload — 최소한만 노출
contextBridge.exposeInMainWorld('electron', {
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (patch) => ipcRenderer.invoke('settings:set', patch),
  onSessionUpdate: (cb) => {
    ipcRenderer.on('session:update', (_, payload) => cb(payload))
    return () => ipcRenderer.removeAllListeners('session:update')
  },
})
```

IPC 채널명은 `shared/types.ts` 의 `IpcChannel` 타입에서만 정의한다. 문자열 리터럴 하드코딩 금지.

### CLI → Main (PTY 데이터 전달)

Unix Domain Socket (`/tmp/termcat-<uid>.sock`) 사용.  
Electron이 실행 중이지 않을 때 CLI는 IPC 실패를 무시하고 정상 동작해야 한다:

```ts
// ipc-client.ts
async function connect(): Promise<net.Socket | null> {
  return new Promise((resolve) => {
    const sock = net.createConnection(SOCKET_PATH)
    sock.on('connect', () => resolve(sock))
    sock.on('error', () => resolve(null))  // Electron 미실행 시 무시
  })
}
```

---

## 보안 설정

BrowserWindow 생성 시 아래 옵션을 항상 유지한다:

```ts
new BrowserWindow({
  webPreferences: {
    contextIsolation: true,   // 필수 — renderer에서 Node.js 직접 접근 차단
    nodeIntegration: false,   // 필수
    sandbox: true,
    preload: join(__dirname, '../preload/index.js'),
  },
})
```

`shell.openExternal()` 호출 전 URL을 검증한다:

```ts
const ALLOWED_ORIGINS = ['https://github.com']

function safeOpenExternal(url: string): void {
  const parsed = new URL(url)
  if (!ALLOWED_ORIGINS.some((o) => parsed.origin === o)) return
  shell.openExternal(url)
}
```

---

## Tray 관리

Tray 인스턴스는 GC를 막기 위해 모듈 스코프 변수에 항상 레퍼런스를 유지해야 한다.  
로컬 변수로만 보관하면 GC 시 tray가 사라진다:

```ts
// 금지
function createTray(): void {
  const tray = new Tray(icon)  // 함수 종료 후 GC 대상
}

// 허용
let tray: Tray | null = null

function createTray(): void {
  tray = new Tray(icon)  // 모듈 스코프 참조 유지
}
```

---

## 앱 생명주기

```ts
// tray 전용 앱 — 창이 없어도 종료하지 않는다
app.on('window-all-closed', () => {})

// macOS 독 아이콘 숨김
if (process.platform === 'darwin') {
  app.dock.hide()
}

// 앱 종료 전 리소스 정리
app.on('before-quit', () => {
  tray?.destroy()
  ipcServer?.close()
})
```

---

## 로깅

`console.log` 는 개발 중에만 허용. 프로덕션 코드에는 `electron-log` 를 사용한다:

```ts
import log from 'electron-log'

log.info('session started', { pid, command })
log.error('ipc connection failed', error)
```

로그 파일 위치: `~/Library/Logs/termcat/main.log`
