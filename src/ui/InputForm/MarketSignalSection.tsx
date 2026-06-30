import { useState } from 'react'
import type { MarketSignal, ReferenceMachine, EvalScore } from '../../domain/types'
import { REFERENCE_MACHINES } from '../../data/referenceMachines'
import { StarRating } from './MachineSpecSection'
import { fetchYoutubeSignal } from '../../utils/youtubeSignal'

const YT_KEY_STORAGE = 'shiire_yt_api_key'

interface Props {
  value: MarketSignal
  onChange: (v: MarketSignal) => void
  machineName: string
}

export function MarketSignalSection({ value, onChange, machineName }: Props) {
  const [selectId, setSelectId] = useState('')
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(YT_KEY_STORAGE) ?? '')
  const [showKeyInput, setShowKeyInput] = useState(false)
  const [ytLoading, setYtLoading] = useState(false)
  const [ytError, setYtError] = useState<string | null>(null)
  const [ytSuccess, setYtSuccess] = useState(false)

  const addRef = () => {
    if (!selectId) return
    if (value.referenceMachines.length >= 3) return
    const found = REFERENCE_MACHINES.find(r => r.id === selectId)
    if (!found) return
    if (value.referenceMachines.some(r => r.id === selectId)) return
    onChange({ ...value, referenceMachines: [...value.referenceMachines, found] })
    setSelectId('')
  }

  const removeRef = (id: string) => {
    onChange({ ...value, referenceMachines: value.referenceMachines.filter(r => r.id !== id) })
  }

  const available = REFERENCE_MACHINES.filter(
    r => !value.referenceMachines.some(s => s.id === r.id)
  )

  const doYoutubeSearch = async (key: string) => {
    if (!machineName.trim()) return
    setYtLoading(true)
    setYtError(null)
    setYtSuccess(false)
    try {
      const result = await fetchYoutubeSignal(machineName.trim(), key)
      onChange({ ...value, popularityScore: result.score, popularityMemo: result.memo })
      setYtSuccess(true)
      setTimeout(() => setYtSuccess(false), 3000)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'エラーが発生しました'
      setYtError(msg)
    } finally {
      setYtLoading(false)
    }
  }

  const handleYoutubeClick = () => {
    if (!machineName.trim()) return
    if (!apiKey) {
      setShowKeyInput(true)
    } else {
      doYoutubeSearch(apiKey)
    }
  }

  const handleKeySave = () => {
    const trimmed = apiKey.trim()
    if (!trimmed) return
    localStorage.setItem(YT_KEY_STORAGE, trimmed)
    setShowKeyInput(false)
    doYoutubeSearch(trimmed)
  }

  return (
    <div className="section">
      <div className="section-title">
        <span className="section-badge">B</span>市場期待度
      </div>
      <div className="section-body">
      <div className="field-row">
        <label className="field-label">大衆期待度（SNS）</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <StarRating
            value={value.popularityScore}
            onChange={v => onChange({ ...value, popularityScore: v as EvalScore })}
          />
          <button
            className={`btn btn-sm yt-btn${ytSuccess ? ' yt-btn-success' : ''}`}
            type="button"
            disabled={ytLoading || !machineName.trim()}
            onClick={handleYoutubeClick}
            title="YouTube試打動画を検索してスコアを自動設定"
          >
            {ytLoading ? '取得中…' : ytSuccess ? '✓ 取得完了' : '▶ YouTube自動取得'}
          </button>
        </div>
      </div>

      {showKeyInput && (
        <div className="yt-key-panel">
          <p className="yt-key-desc">
            YouTube Data API v3 キーを入力してください。
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Cloud Console
            </a>
            で無料取得できます（1日1万クエリ）。
          </p>
          <div className="yt-key-row">
            <input
              type="password"
              value={apiKey}
              placeholder="AIza..."
              onChange={e => setApiKey(e.target.value)}
              className="yt-key-input"
              onKeyDown={e => e.key === 'Enter' && handleKeySave()}
            />
            <button className="btn btn-sm btn-primary" type="button" onClick={handleKeySave}
              disabled={!apiKey.trim()}>
              保存して検索
            </button>
            <button className="btn btn-sm btn-secondary" type="button"
              onClick={() => setShowKeyInput(false)}>
              キャンセル
            </button>
          </div>
        </div>
      )}

      {ytError && (
        <div className="yt-error">⚠ {ytError}</div>
      )}

      <div className="field-row">
        <label className="field-label">出典メモ</label>
        <input
          type="text"
          value={value.popularityMemo ?? ''}
          placeholder="例：X のトレンド入り、YouTube再生数など"
          onChange={e => onChange({ ...value, popularityMemo: e.target.value })}
        />
      </div>

      <div style={{ marginTop: 8 }}>
        <div className="field-label" style={{ marginBottom: 4 }}>
          類似台（参照機種）<span className="field-unit" style={{ marginLeft: 6 }}>最大3件</span>
        </div>

        <div className="ref-machine-list">
          {value.referenceMachines.map(r => (
            <RefChip key={r.id} machine={r} onRemove={() => removeRef(r.id)} />
          ))}
        </div>

        {value.referenceMachines.length < 3 && (
          <div className="ref-select-wrapper">
            <select value={selectId} onChange={e => setSelectId(e.target.value)}>
              <option value="">── 機種を選択 ──</option>
              {available.map(r => (
                <option key={r.id} value={r.id}>
                  {r.machineName}（実績{r.actualContributionWeeks}週）
                </option>
              ))}
            </select>
            <button className="btn btn-secondary btn-sm" type="button" onClick={addRef}>
              追加
            </button>
          </div>
        )}

        {value.referenceMachines.length === 0 && (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            ※ 参照台未選択時はゲームフロー別の標準値をベースラインとします
          </p>
        )}
      </div>
      </div>
    </div>
  )
}

function RefChip({ machine, onRemove }: { machine: ReferenceMachine; onRemove: () => void }) {
  const pureStr = machine.pureIncrease
    ? `純増${machine.pureIncrease.lower}${machine.pureIncrease.upper ? `/${machine.pureIncrease.upper}` : ''}枚/G`
    : ''
  return (
    <div className="ref-machine-chip">
      <div>
        <span className="ref-chip-name">{machine.machineName}</span>
        <span className="ref-chip-meta" style={{ marginLeft: 8 }}>
          実績 <strong>{machine.actualContributionWeeks}週</strong>
          {pureStr && ` / ${pureStr}`}
        </span>
      </div>
      <button className="ref-chip-remove" type="button" onClick={onRemove} title="削除">×</button>
    </div>
  )
}
