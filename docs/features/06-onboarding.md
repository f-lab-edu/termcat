# 기능 06 — 첫 실행 온보딩

## 개요

앱 최초 실행 시 사용자에게 shell alias 설정을 안내하고, 동의하면 자동으로 적용한다.

---

## 유저 스토리

- 앱을 처음 실행하면 "alias를 등록하면 `claude` 명령어 그대로 쓸 수 있어요" 안내가 뜬다.
- '자동 적용' 버튼을 누르면 `~/.zshrc` (또는 `~/.bashrc`)에 alias가 추가된다.
- 이미 등록되어 있으면 안내 없이 스킵한다.

---

## 온보딩 흐름

```
앱 첫 실행
    │
    ▼
alias 등록 여부 확인 ──► 이미 있음 → 스킵
    │
    ▼ 없음
알림 팝업 표시
    │
    ├─ "자동 적용" 클릭 ──► rc 파일에 alias 추가 → 완료 알림
    │
    └─ "나중에" / 닫기 ──► 스킵 (다음 실행 시 다시 표시)
```

---

## alias 감지 로직

```ts
function hasAlias(shell: string): boolean {
  const rcPath = getRcPath(shell)           // ~/.zshrc or ~/.bashrc
  const content = fs.readFileSync(rcPath, 'utf-8')
  return content.includes('termcat')        // 이미 등록된 경우
}

function getRcPath(shell: string): string {
  if (shell.includes('zsh')) return path.join(os.homedir(), '.zshrc')
  if (shell.includes('bash')) return path.join(os.homedir(), '.bashrc')
  return path.join(os.homedir(), '.profile')
}
```

현재 셸 감지: `process.env.SHELL`

---

## alias 자동 등록

```ts
const ALIAS_BLOCK = `
# termcat — AI session monitor
alias claude="termcat claude"
alias chatgpt="termcat chatgpt"
alias gemini="termcat gemini"
`

function appendAlias(rcPath: string): void {
  fs.appendFileSync(rcPath, ALIAS_BLOCK)
}
```

등록 후 안내 문구:
> "`.zshrc`에 alias를 추가했어요. 새 터미널 탭을 열면 바로 사용할 수 있습니다."

---

## UI (Electron 알림 or 미니 윈도우)

두 가지 옵션:
1. **Electron Notification API** (macOS 시스템 알림) — 간단하지만 버튼 제한
2. **작은 BrowserWindow** — 커스텀 UI 가능, 권장

### 미니 온보딩 윈도우 스펙

| 항목 | 값 |
|------|-----|
| 크기 | 400×240px |
| 위치 | 화면 중앙 또는 메뉴바 아래 |
| 스타일 | `titleBarStyle: 'hiddenInset'`, 비사이즈변경 |
| 닫기 시 동작 | 재시작 시 재표시 (설정에 `onboardingDone: false` 유지) |

---

## 완료 조건

- [ ] 최초 실행 시 온보딩 창이 표시됨
- [ ] alias가 이미 있으면 온보딩 스킵됨
- [ ] "자동 적용" 클릭 시 `.zshrc` / `.bashrc`에 alias 블록이 추가됨
- [ ] 등록 완료 후 다음 실행부터 온보딩 창이 표시되지 않음
- [ ] zsh / bash 양쪽에서 올바른 rc 파일을 감지함

---

## 관련 파일

| 파일 | 설명 |
|------|------|
| `src/main/onboarding.ts` | alias 감지 및 등록 로직 |
| `src/renderer/src/Onboarding.tsx` | 온보딩 UI 컴포넌트 |
| `src/main/store.ts` | `onboardingDone` 설정 저장 (electron-store) |
