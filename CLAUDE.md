# termcat — CLAUDE.md

AI 터미널 세션을 감지해 macOS 메뉴바에 고양이 애니메이션을 표시하는 앱.

---

## 개발 커맨드

```bash
npm run dev           # 개발 서버 (Electron + Vite HMR)
npm run typecheck     # TypeScript 타입 검사
npm run lint          # ESLint 검사
npm run lint:fix      # ESLint 자동 수정
npm run format        # Prettier 포맷 적용
npm run format:check  # CI용 포맷 검사
npm run build         # 프로덕션 빌드
npm run build:mac     # .dmg 패키지 빌드
```

---

## 문서

| 문서 | 내용 |
|------|------|
| [기능 명세 인덱스](./docs/index.md) | 전체 기능 목록 및 아키텍처 |
| [TypeScript 컨벤션](./docs/conventions/typescript.md) | 타입, export, 에러 처리 |
| [Electron 패턴](./docs/conventions/electron.md) | IPC, 보안, Tray, 생명주기 |
| [React 컨벤션](./docs/conventions/react.md) | 컴포넌트, Zustand, 스타일링 |
| [Git 워크플로](./docs/conventions/git.md) | 브랜치, 커밋 메시지, PR |
| [네이밍 규칙](./docs/conventions/naming.md) | 파일, 변수, IPC 채널명 |
| [에러 핸들링](./docs/conventions/error-handling.md) | Error Boundary, IPC 에러, ParseError, 전역 수집 |

---

## 프로젝트 구조

```
src/
  main/        Electron main process
  preload/     contextBridge 보안 브리지
  renderer/    React UI (팝업, 온보딩, 설정 창)
  cli/         node-pty 래퍼 CLI (별도 번들)
  shared/      프로세스 공통 타입 (types.ts)
docs/
  features/    기능별 명세
  conventions/ 코딩 컨벤션
resources/
  sprites/     고양이 PNG 스프라이트 (16×16, 8프레임)
```

---

## 핵심 원칙

- `any` 사용 금지 — `src/shared/types.ts` 에 공통 타입 정의
- IPC 채널명 하드코딩 금지 — `IpcChannel` 타입에서만 관리
- `export default` 금지 — named export만 사용
- `console.log` 프로덕션 코드 금지 — `electron-log` 사용
- 컴포넌트에서 `window.electron.*` 직접 호출 금지 — 훅으로 래핑
