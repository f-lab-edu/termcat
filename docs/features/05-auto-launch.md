# 기능 05 — 로그인 시 자동 시작

## 개요

macOS 로그인 시 termcat Electron 앱이 자동으로 실행되도록 시스템 로그인 항목에 등록한다.

---

## 유저 스토리

- 앱을 처음 설치하면 재부팅 후에도 메뉴바에 고양이가 항상 있다.
- 트레이 메뉴에서 자동 시작을 켜고 끌 수 있다.

---

## 구현

Electron의 내장 API `app.setLoginItemSettings` 사용:

```ts
// 자동 시작 등록
app.setLoginItemSettings({
  openAtLogin: true,
  openAsHidden: true, // 독 없이 백그라운드로 실행
})

// 해제
app.setLoginItemSettings({ openAtLogin: false })

// 현재 상태 조회
const { openAtLogin } = app.getLoginItemSettings()
```

### 트레이 메뉴 토글

```ts
Menu.buildFromTemplate([
  {
    label: '로그인 시 자동 시작',
    type: 'checkbox',
    checked: app.getLoginItemSettings().openAtLogin,
    click: (menuItem) => {
      app.setLoginItemSettings({ openAtLogin: menuItem.checked, openAsHidden: true })
    },
  },
  // ...
])
```

> 메뉴를 클릭할 때마다 `tray.setContextMenu`로 메뉴를 재빌드해 체크 상태를 최신으로 유지

---

## 완료 조건

- [ ] 최초 설치 후 재부팅 시 termcat이 자동 실행됨
- [ ] 트레이 메뉴에서 자동 시작 토글이 동작함
- [ ] 자동 시작 상태가 체크박스에 정확히 반영됨
- [ ] 자동 시작 시 독 아이콘이 나타나지 않음

---

## 관련 파일

| 파일 | 설명 |
|------|------|
| `src/main/index.ts` | `app.setLoginItemSettings` 호출 위치 |
| `src/main/tray-menu.ts` | 트레이 컨텍스트 메뉴 빌더 |
