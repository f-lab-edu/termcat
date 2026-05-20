# Git 워크플로

## 브랜치 전략

`main` 브랜치에 직접 push하지 않는다. 모든 작업은 feature 브랜치에서 PR로 병합한다.

### 브랜치 네이밍

```
feat/<기능명>       새 기능 구현
fix/<이슈명>        버그 수정
refactor/<대상>     동작 변경 없는 코드 개선
docs/<대상>         문서 변경만
chore/<작업>        빌드, 설정, 의존성 변경
```

기능 브랜치는 `docs/features/` 번호를 기준으로 이름 짓는다:

```
feat/01-pty-wrapper
feat/02-speed-measurement
feat/03-tray-animation
feat/04-session-lifecycle
```

---

## 커밋 메시지

[Conventional Commits](https://www.conventionalcommits.org/) 형식을 따른다:

```
<type>(<scope>): <subject>

[optional body]
```

### type

| type | 용도 |
|------|------|
| `feat` | 새 기능 |
| `fix` | 버그 수정 |
| `refactor` | 리팩토링 |
| `docs` | 문서 |
| `chore` | 빌드/설정/의존성 |
| `test` | 테스트 추가/수정 |
| `style` | 포매팅 (기능 변경 없음) |

### scope

변경된 모듈 단위:

| scope | 대상 |
|-------|------|
| `cli` | `src/cli/` |
| `main` | `src/main/` |
| `renderer` | `src/renderer/` |
| `preload` | `src/preload/` |
| `ipc` | IPC 관련 |
| `tray` | Tray 아이콘/애니메이션 |
| `build` | 빌드 설정 |
| `deps` | 의존성 |

### subject 규칙

- 영어, 소문자 시작
- 명령형 동사 (`add`, `fix`, `remove`, `update` — `added`, `fixes` 아님)
- 마침표 없음
- 72자 이내

### 예시

```
feat(cli): add PTY wrapper with stdin passthrough
fix(tray): correct icon resize on Retina display
refactor(main): extract SpeedMonitor into separate class
docs(features): add speed measurement spec
chore(deps): upgrade electron to v34
chore(build): configure universal binary for Apple Silicon
```

### body 작성 기준

subject 한 줄로 충분하면 body를 쓰지 않는다.  
**왜** 변경했는지 비자명한 이유가 있을 때만 body를 추가한다:

```
fix(ipc): handle socket disconnect on abnormal CLI exit

node-pty child process can be killed externally without sending
session:exit. Added socket 'close' event handler to clean up
orphaned sessions in SessionManager.
```

---

## Pull Request

### 제목

커밋 메시지 형식과 동일하게 작성한다.

### 본문 체크리스트

기능 PR은 해당 `docs/features/0x-*.md` 의 완료 조건을 체크리스트로 붙인다:

```markdown
## 완료 조건

- [x] `termcat claude` 실행 시 Claude CLI가 정상 실행됨
- [x] PTY 크기가 현재 터미널과 동일하게 유지됨
- [ ] Electron이 실행 중이지 않아도 CLI는 정상 동작
```

### 리뷰 없이 병합 가능한 경우

- `docs/` 변경만 있는 PR
- `chore(deps)` 패치 버전 업그레이드

그 외 모든 PR은 셀프 리뷰 후 병합.
