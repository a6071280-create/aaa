import { useState } from 'react'
import type { MarketSignal, ReferenceMachine, EvalScore } from '../../domain/types'
import { REFERENCE_MACHINES } from '../../data/referenceMachines'
import { StarRating } from './MachineSpecSection'

interface Props {
  value: MarketSignal
  onChange: (v: MarketSignal) => void
}

export function MarketSignalSection({ value, onChange }: Props) {
  const [selectId, setSelectId] = useState('')

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

  return (
    <div className="section">
      <div className="section-title">
        <span className="section-badge">B</span>市場期待度
      </div>

      <div className="field-row">
        <label className="field-label">大衆期待度（SNS）</label>
        <StarRating
          value={value.popularityScore}
          onChange={v => onChange({ ...value, popularityScore: v as EvalScore })}
        />
      </div>

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
          {machine.coinUnitYen > 0 && ` / 単価${machine.coinUnitYen}円`}
          {pureStr && ` / ${pureStr}`}
        </span>
      </div>
      <button className="ref-chip-remove" type="button" onClick={onRemove} title="削除">×</button>
    </div>
  )
}
