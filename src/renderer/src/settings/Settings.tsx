import { type CSSProperties, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { Button } from '@renderer/components/index'
import { createLogger } from '@renderer/logger'
import { type AIShortcut, DEFAULT_SPEED_THRESHOLDS, type SpeedThresholds } from '@shared/types'

import * as s from './Settings.css'

const log = createLogger('settings')

const SMOOTHING_OPTIONS = [1, 2, 3, 5, 8]
const SAVE_DEBOUNCE_MS = 300

type TooltipPlacement = 'top' | 'right'

function Tooltip({
  text,
  placement = 'top',
}: {
  text: string
  placement?: TooltipPlacement
}): JSX.Element {
  const [pos, setPos] = useState<CSSProperties | null>(null)
  const iconRef = useRef<HTMLSpanElement>(null)

  function handleMouseEnter(): void {
    if (!iconRef.current) return
    const rect = iconRef.current.getBoundingClientRect()
    if (placement === 'right') {
      setPos({ top: rect.top + rect.height / 2, left: rect.right + 6 })
    } else {
      setPos({ bottom: window.innerHeight - rect.top + 6, left: rect.left + rect.width / 2 })
    }
  }

  return (
    <span className={s.tooltipWrapper}>
      <span
        ref={iconRef}
        className={s.tooltipIcon}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setPos(null)}
      >
        ⓘ
      </span>
      {pos !== null &&
        createPortal(
          <span className={placement === 'right' ? s.tooltipBoxRight : s.tooltipBox} style={pos}>
            {text}
          </span>,
          document.body
        )}
    </span>
  )
}

interface DraftState {
  id: string
  name: string
  command: string
}

interface ShortcutCardProps {
  shortcut: AIShortcut
  onEdit: () => void
  onDelete: () => Promise<void>
}

function ShortcutCard({ shortcut, onEdit, onDelete }: ShortcutCardProps): JSX.Element {
  return (
    <div className={s.card}>
      <div className={s.cardRow}>
        <p className={s.cardName}>{shortcut.name}</p>
        <div className={s.cardActions}>
          <Button variant="ghost" onClick={onEdit}>
            편집
          </Button>
          <Button variant="ghost" onClick={onDelete}>
            삭제
          </Button>
        </div>
      </div>
      <p className={s.cardCommand}>{shortcut.command}</p>
    </div>
  )
}

interface ShortcutFormProps {
  draft: DraftState
  onChange: (draft: DraftState) => void
  onSave: () => Promise<void>
  onCancel: () => void
  isSaving: boolean
}

function ShortcutForm({
  draft,
  onChange,
  onSave,
  onCancel,
  isSaving,
}: ShortcutFormProps): JSX.Element {
  const isValid = draft.name.trim().length > 0 && draft.command.trim().length > 0

  return (
    <div className={s.form}>
      <div className={s.formRow}>
        <p className={s.label}>이름</p>
        <input
          className={s.input}
          placeholder="그냥 클로드 키기"
          value={draft.name}
          onChange={(e) => onChange({ ...draft, name: e.target.value })}
        />
      </div>
      <div className={s.formRow}>
        <p className={s.label}>명령어</p>
        <input
          className={s.input}
          placeholder="claude --dangerously-skip-permissions"
          value={draft.command}
          onChange={(e) => onChange({ ...draft, command: e.target.value })}
        />
      </div>
      <div className={s.formActions}>
        <Button variant="secondary" onClick={onCancel}>
          취소
        </Button>
        <Button variant="primary" disabled={!isValid || isSaving} onClick={onSave}>
          저장
        </Button>
      </div>
    </div>
  )
}

function ThresholdsForm(): JSX.Element {
  const [thresholds, setThresholds] = useState<SpeedThresholds>(DEFAULT_SPEED_THRESHOLDS)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    window.thresholds
      .get()
      .then(setThresholds)
      .catch((err) => log.error('failed to load thresholds', err))

    return () => {
      if (saveTimer.current !== null) clearTimeout(saveTimer.current)
    }
  }, [])

  function scheduleSave(next: SpeedThresholds): void {
    if (saveTimer.current !== null) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      window.thresholds.set(next).catch((err) => log.error('failed to save thresholds', err))
    }, SAVE_DEBOUNCE_MS)
  }

  function handleSlowChange(raw: number): void {
    const slow = Math.min(raw, thresholds.mid - 1)
    const next = { ...thresholds, slow }
    setThresholds(next)
    scheduleSave(next)
  }

  function handleMidChange(raw: number): void {
    const mid = Math.max(raw, thresholds.slow + 1)
    const next = { ...thresholds, mid }
    setThresholds(next)
    scheduleSave(next)
  }

  function handleSmoothingChange(smoothingTicks: number): void {
    const next = { ...thresholds, smoothingTicks }
    setThresholds(next)
    scheduleSave(next)
  }

  return (
    <div className={s.section}>
      <p className={s.sectionTitle}>속도 감지 설정</p>

      <div className={s.sliderRow}>
        <div className={s.sliderHeader}>
          <div className={s.labelRow}>
            <p className={s.label}>느림 감지 (chars/s)</p>
            <Tooltip text="이 값 이하면 고양이가 천천히 걸어요" />
          </div>
          <p className={s.sliderValue}>{thresholds.slow}</p>
        </div>
        <input
          className={s.slider}
          type="range"
          min={1}
          max={thresholds.mid - 1}
          value={thresholds.slow}
          onChange={(e) => handleSlowChange(Number(e.target.value))}
        />
      </div>

      <div className={s.sliderRow}>
        <div className={s.sliderHeader}>
          <div className={s.labelRow}>
            <p className={s.label}>빠름 감지 (chars/s)</p>
            <Tooltip text="이 값 이하면 보통 속도, 초과하면 고양이가 달려요" />
          </div>
          <p className={s.sliderValue}>{thresholds.mid}</p>
        </div>
        <input
          className={s.slider}
          type="range"
          min={thresholds.slow + 1}
          max={500}
          value={thresholds.mid}
          onChange={(e) => handleMidChange(Number(e.target.value))}
        />
      </div>

      <div className={s.selectRow}>
        <div className={s.labelRow}>
          <p className={s.label}>반응 민감도</p>
          <Tooltip text="숫자가 클수록 속도 변화에 더 느리게 반응해요" placement="right" />
        </div>
        <select
          className={s.select}
          value={thresholds.smoothingTicks}
          onChange={(e) => handleSmoothingChange(Number(e.target.value))}
        >
          {SMOOTHING_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}틱
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export function Settings(): JSX.Element {
  const [shortcuts, setShortcuts] = useState<AIShortcut[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<DraftState>({ id: '', name: '', command: '' })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    window.aiShortcut
      .list()
      .then(setShortcuts)
      .catch((err) => log.error('failed to load shortcuts', err))
  }, [])

  function startAdd(): void {
    setEditingId('')
    setDraft({ id: '', name: '', command: '' })
  }

  function startEdit(shortcut: AIShortcut): void {
    setEditingId(shortcut.id)
    setDraft({ id: shortcut.id, name: shortcut.name, command: shortcut.command })
  }

  function cancelEdit(): void {
    setEditingId(null)
  }

  async function handleSave(): Promise<void> {
    setIsSaving(true)
    try {
      const shortcut: AIShortcut = {
        id: draft.id || crypto.randomUUID(),
        name: draft.name.trim(),
        command: draft.command.trim(),
      }
      await window.aiShortcut.save(shortcut)
      setShortcuts(await window.aiShortcut.list())
      setEditingId(null)
    } catch (err) {
      log.error('failed to save shortcut', err)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(id: string): Promise<void> {
    await window.aiShortcut.delete(id)
    setShortcuts((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <div className={s.container}>
      <div className={s.header}>
        <p className={s.title}>AI 실행하기</p>
      </div>

      <div className={s.list}>
        {shortcuts.length === 0 && editingId === null && (
          <p className={s.empty}>아직 설정된 숏컷이 없어요</p>
        )}

        {shortcuts.map((shortcut) =>
          editingId === shortcut.id ? (
            <ShortcutForm
              key={shortcut.id}
              draft={draft}
              onChange={setDraft}
              onSave={handleSave}
              onCancel={cancelEdit}
              isSaving={isSaving}
            />
          ) : (
            <ShortcutCard
              key={shortcut.id}
              shortcut={shortcut}
              onEdit={() => startEdit(shortcut)}
              onDelete={() =>
                handleDelete(shortcut.id).catch((err) =>
                  log.error('failed to delete shortcut', err)
                )
              }
            />
          )
        )}

        {editingId === '' && (
          <ShortcutForm
            draft={draft}
            onChange={setDraft}
            onSave={handleSave}
            onCancel={cancelEdit}
            isSaving={isSaving}
          />
        )}
      </div>

      {editingId === null && (
        <Button variant="secondary" onClick={startAdd}>
          + 숏컷 추가
        </Button>
      )}

      <div className={s.divider} />

      <ThresholdsForm />
    </div>
  )
}
