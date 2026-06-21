import type { StoreConstraints } from '../../domain/types'
import { COMPETITOR_LABELS, DK_SIS_AVG_DAILY_MARGIN_YEN } from '../../config/defaults'

interface Props {
  value: StoreConstraints
  onChange: (v: StoreConstraints) => void
}

export function StoreConstraintSection({ value, onChange }: Props) {
  const set = <K extends keyof StoreConstraints>(k: K, v: StoreConstraints[K]) =>
    onChange({ ...value, [k]: v })

  const numField = (
    key: keyof StoreConstraints,
    label: string,
    unit: string,
    opts: { step?: number; min?: number; placeholder?: string } = {}
  ) => (
    <div className="field-row has-unit">
      <label className="field-label">{label}</label>
      <input
        type="number"
        step={opts.step ?? 1}
        min={opts.min ?? 0}
        value={value[key] as number}
        placeholder={opts.placeholder}
        onChange={e => {
          const n = parseFloat(e.target.value)
          if (!isNaN(n)) set(key, n as StoreConstraints[typeof key])
        }}
      />
      <span className="field-unit">{unit}</span>
    </div>
  )

  const weeklyMargin = value.avgDailyMachineMarginYen * 7
  const recoveryWeeks = weeklyMargin > 0 ? Math.ceil(value.machinePrice / weeklyMargin) : null
  const roiOk = recoveryWeeks !== null && recoveryWeeks <= value.targetRecoveryWeeks

  return (
    <div className="section">
      <div className="section-title">
        <span className="section-badge">D</span>自店制約（仕入れ台数算出）
      </div>

      {numField('newMachineBudget', '新台予算上限', '円', { step: 100000, placeholder: '10000000' })}
      {numField('machinePrice', '1台あたり機械代', '円', { step: 10000 })}
      {numField('availableSlots', '島の空き台数', '台', { min: 1 })}

      <div className="field-row has-unit" style={{ background: '#fffbeb', borderRadius: 3, padding: '4px 0' }}>
        <label className="field-label" style={{ fontWeight: 700 }}>
          目標回収期間 ★ROI主制約
        </label>
        <input
          type="number"
          step="1"
          min="1"
          value={value.targetRecoveryWeeks}
          onChange={e => {
            const n = parseInt(e.target.value)
            if (!isNaN(n) && n > 0) set('targetRecoveryWeeks', n)
          }}
        />
        <span className="field-unit">週</span>
      </div>

      <div className="field-row has-unit">
        <label className="field-label">
          この新台の予想台粗利
          <span
            className="field-unit"
            style={{ display: 'block', fontSize: 10 }}
            title={`DK-SIS全国平均は${DK_SIS_AVG_DAILY_MARGIN_YEN.toLocaleString()}円/日。新台好調期は2〜4倍が目安。`}
          >
            ※新台の予想値を入力
          </span>
        </label>
        <input
          type="number"
          step="500"
          min="0"
          value={value.avgDailyMachineMarginYen}
          onChange={e => {
            const n = parseInt(e.target.value)
            if (!isNaN(n)) set('avgDailyMachineMarginYen', n)
          }}
        />
        <span className="field-unit">円/日</span>
      </div>

      {recoveryWeeks !== null && (
        <div style={{
          fontSize: 11,
          color: roiOk ? 'var(--success)' : 'var(--warning)',
          marginBottom: 6,
          textAlign: 'right',
          fontWeight: 600,
        }}>
          週次粗利 {weeklyMargin.toLocaleString()}円 → 回収目安 {recoveryWeeks}週
          {roiOk
            ? ` ✓（目標${value.targetRecoveryWeeks}週以内）`
            : ` ⚠ （目標${value.targetRecoveryWeeks}週を超過）`}
        </div>
      )}

      <div className="field-row">
        <label className="field-label">競合店の同台導入見込み</label>
        <select
          value={value.competitorAdoption}
          onChange={e => set('competitorAdoption', e.target.value as StoreConstraints['competitorAdoption'])}
        >
          {Object.entries(COMPETITOR_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
