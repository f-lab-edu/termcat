# 기능 07 — 빌드 & 배포

## 개요

`electron-builder`로 macOS `.dmg` 패키지를 빌드하고,  
CLI 바이너리(`termcat`)를 시스템 PATH에서 실행할 수 있도록 패키지에 포함한다.

---

## 빌드 산출물

| 파일 | 설명 |
|------|------|
| `termcat-x.x.x.dmg` | macOS 설치 이미지 (Apple Silicon + Intel 유니버설) |
| `termcat-x.x.x-arm64.dmg` | Apple Silicon 전용 (선택) |
| `/usr/local/bin/termcat` | CLI 심볼릭 링크 (설치 후 PATH에서 사용) |

---

## 프로젝트 구조

```
src/
  main/          → Electron main process
  preload/       → contextBridge
  renderer/      → React UI
  cli/           → Node.js CLI (별도 번들)
resources/
  sprites/       → PNG 스프라이트 에셋
  icon.icns      → 앱 아이콘
electron-builder.yml
```

### CLI 번들 전략

CLI(`src/cli/`)는 Electron main process와 별도로 번들해야 함:
- electron-vite는 `main`, `preload`, `renderer` 3개 타겟만 지원
- CLI는 순수 Node.js로 번들 → `out/cli/index.js`
- `package.json` `bin` 필드에 등록

```json
// package.json
{
  "bin": {
    "termcat": "./out/cli/index.js"
  }
}
```

---

## electron-builder.yml 핵심 설정

```yaml
appId: com.termcat
productName: termcat

mac:
  target:
    - target: dmg
      arch: [universal]
  category: public.app-category.utilities

files:
  - out/**
  - resources/**
  - "!resources/sprites/**/*.psd"  # 원본 PSD 제외

extraResources:
  - from: resources/sprites
    to: sprites

afterPack: scripts/after-pack.js  # CLI symlink 생성 스크립트
```

---

## CLI PATH 등록

`.dmg`로 설치된 앱은 `/Applications/termcat.app`에 위치.  
CLI를 PATH에서 사용하려면 심볼릭 링크 필요:

```
/usr/local/bin/termcat → /Applications/termcat.app/Contents/Resources/app/out/cli/index.js
```

온보딩 창에서 "CLI 경로 등록" 옵션으로 자동 생성:
```ts
fs.symlinkSync(cliPath, '/usr/local/bin/termcat')
```

> `sudo` 없이 가능한 경로: `~/.local/bin/termcat` (PATH에 포함 시)

---

## 빌드 커맨드

```bash
# 개발 실행
npm run dev

# 프로덕션 빌드 (Electron 앱)
npm run build

# DMG 패키지 생성
npm run dist
```

---

## 완료 조건

- [ ] `npm run dist` 실행 시 `.dmg` 파일이 생성됨
- [ ] DMG 마운트 후 `/Applications`으로 드래그 설치 가능
- [ ] 설치된 앱이 로그인 아이템으로 등록 가능
- [ ] CLI 심볼릭 링크 생성 후 `termcat claude` 명령어 동작
- [ ] Apple Silicon / Intel 양쪽에서 실행됨 (universal 빌드)
- [ ] 앱 서명 없이도 macOS Gatekeeper 경고 우회 안내 제공

---

## 관련 파일

| 파일 | 설명 |
|------|------|
| `electron-builder.yml` | 빌드 설정 |
| `electron.vite.config.ts` | Vite 번들 설정 |
| `scripts/after-pack.js` | 패키징 후 훅 스크립트 |
| `package.json` | `bin`, `scripts` 필드 |
