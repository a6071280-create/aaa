import type { ManagerEvaluation, EvalScore } from '../../domain/types'
import { StarRating } from './MachineSpecSection'

interface Props {
  value: ManagerEvaluation
  onChange: (v: ManagerEvaluation) => void
}

const EVAL_ROWS: { key: keyof ManagerEvaluation; label: string }[] = [
  { key: 'overall', label: '総合評価' },
  { key: 'explosivePayout', label: '出玉の爆発力' },
  { key: 'gameplayFun', label: 'ゲーム性の面白さ' },
  { key: 'customerFit', label: '客層フィット' },
]

export function ManagerEvalSection({ value, onChange }: Props) {
  return (
    <div className="section">
      <div className="section-title">
        <span className="section-badge">C</span>店長試打評価
      </div>

      {EVAL_ROWS.map(({ key, label }) => (
        <div className="field-row" key={key}>
          <label className="field-label">{label}</label>
          <StarRating
            value={value[key] as EvalScore}
            onChange={v => onChange({ ...value, [key]: v as EvalScore })}
          />
        </div>
      ))}

      <div style={{ marginTop: 8 }}>
        <label className="field-label" style={{ display: 'block', marginBottom: 4 }}>
          自由コメント
        </label>
        <textarea
          value={value.comment ?? ''}
          placeholder="試打した感想、懸念点など"
          onChange={e => onChange({ ...value, comment: e.target.value })}
        />
      </div>
    </div>
  )
}
