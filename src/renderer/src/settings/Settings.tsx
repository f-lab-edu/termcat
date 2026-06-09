import { useEffect, useState } from 'react'

import { Button } from '@renderer/components/index'
import { createLogger } from '@renderer/logger'
import type { AIShortcut } from '@shared/types'

import * as s from './Settings.css'

const log = createLogger('settings')

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
    </div>
  )
}
