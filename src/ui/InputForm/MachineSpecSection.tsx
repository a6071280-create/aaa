import type { MachineSpec, EvalScore } from '../../domain/types'
import { CATEGORY_LABELS, GAME_FLOW_LABELS, IP_FAME_LABELS } from '../../config/defaults'

interface Props {
  value: MachineSpec
  onChange: (v: MachineSpec) => void
}

export function MachineSpecSection({ value, onChange }: Props) {
  const set = <K extends keyof MachineSpec>(k: K, v: MachineSpec[K]) =>
    onChange({ ...value, [k]: v })

  const isSlot = ['smart_slot', 'normal_20'].includes(value.category)

  return (
    <div className="section">
      <div className="section-title">
        <span className="section-badge">A</span>機種スペック
      </div>

      <div className="field-row">
        <label className="field-label">機種名</label>
        <input
          type="text"
          value={value.machineName}
          placeholder="例：北斗の拳 天昇"
          onChange={e => set('machineName', e.target.value)}
        />
      </div>

      <div className="field-row">
        <label className="field-label">種別</label>
        <select value={value.category} onChange={e => set('category', e.target.value as MachineSpec['category'])}>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {isSlot && (
        <>
          <div className="field-row has-unit">
            <label className="field-label">純増（下位AT）</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={value.pureIncrease?.lower ?? ''}
              onChange={e => set('pureIncrease', { lower: parseFloat(e.target.value) || 0, upper: value.pureIncrease?.upper })}
            />
            <span className="field-unit">枚/G</span>
          </div>
          <div className="field-row has-unit">
            <label className="field-label">純増（上位AT）</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={value.pureIncrease?.upper ?? ''}
              placeholder="任意"
              onChange={e => {
                const v = parseFloat(e.target.value)
                set('pureIncrease', { lower: value.pureIncrease?.lower ?? 0, upper: isNaN(v) ? undefined : v })
              }}
            />
            <span className="field-unit">枚/G</span>
          </div>
        </>
      )}

      <div className="field-row">
        <label className="field-label">ゲームフロー類型</label>
        <select value={value.gameFlow} onChange={e => set('gameFlow', e.target.value as MachineSpec['gameFlow'])}>
          {Object.entries(GAME_FLOW_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <div className="field-row has-unit">
        <label className="field-label">初当り確率</label>
        <input
          type="number"
          step="1"
          min="1"
          value={value.firstHitDenominator}
          onChange={e => set('firstHitDenominator', parseInt(e.target.value) || 319)}
        />
        <span className="field-unit">分の1</span>
      </div>

      <div className="field-row">
        <label className="field-label">メーカー</label>
        <input
          type="text"
          value={value.maker}
          placeholder="例：SANYO、コナミ"
          onChange={e => set('maker', e.target.value)}
        />
      </div>

      <div className="field-row">
        <label className="field-label">IP / 版権知名度</label>
        <select value={value.ipFame} onChange={e => set('ipFame', e.target.value as MachineSpec['ipFame'])}>
          {Object.entries(IP_FAME_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

export function StarRating({ value, onChange }: { value: EvalScore; onChange: (v: EvalScore) => void }) {
  return (
    <div className="star-row">
      {([1, 2, 3, 4, 5] as EvalScore[]).map(n => (
        <button
          key={n}
          className={`star-btn${value >= n ? ' active' : ''}`}
          onClick={() => onChange(n)}
          type="button"
          title={`${n}`}
        >★</button>
      ))}
    </div>
  )
}
