import { useState } from 'react'
import type {
  MachineSpec, EvalScore,
  NormalPhaseMgmt, FirstHitTrigger, AtType, GameFlow, CoinValueSpec, GameFlowType,
} from '../../domain/types'
import { CATEGORY_LABELS, IP_FAME_LABELS } from '../../config/defaults'
import { estimateCoinValue } from '../../domain/coinValue/estimateCoinValue'

interface Props {
  value: MachineSpec
  onChange: (v: MachineSpec) => void
}

const NORMAL_PHASE_OPTIONS: NormalPhaseMgmt[] = ['周期管理', 'ゲーム数管理', 'ポイント管理']
const FIRST_HIT_OPTIONS: FirstHitTrigger[] = ['規定周期解除', '規定ゲーム数解除', 'レア役解除']
const AT_TYPE_OPTIONS: AtType[] = ['差枚管理型AT', 'ゲーム数管理型AT', 'セット数管理AT', 'STタイプ']

function toggleArray<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item]
}

function deriveGameFlowType(detail: GameFlow, category: MachineSpec['category']): GameFlowType {
  if (category === 'normal_20') return 'normal_a'
  const primaryType = detail.atTypes.find(a => a.role === 'primary')?.type
  if (primaryType === 'STタイプ') return 'st'
  if (primaryType === 'ゲーム数管理型AT') return 'game_count_add'
  return 'pseudo_bonus_at'
}

function GameFlowDetail3Axis({ value, onChange }: { value: GameFlow; onChange: (v: GameFlow) => void }) {
  return (
    <div style={{ marginTop: 8, padding: '8px 10px', background: 'var(--surface-2)', borderRadius: 4, border: '1px solid var(--border)' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', marginBottom: 6 }}>
        ゲームフロー詳細（3軸・複数選択可）
      </div>

      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>通常時の管理方式</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {NORMAL_PHASE_OPTIONS.map(opt => (
            <label key={opt} style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 3, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={value.normalPhase.includes(opt)}
                onChange={() => onChange({ ...value, normalPhase: toggleArray(value.normalPhase, opt) })}
              />
              {opt}
            </label>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>初当たり契機</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {FIRST_HIT_OPTIONS.map(opt => (
            <label key={opt} style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 3, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={value.firstHitTriggers.includes(opt)}
                onChange={() => onChange({ ...value, firstHitTriggers: toggleArray(value.firstHitTriggers, opt) })}
              />
              {opt}
            </label>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>AT管理タイプ</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {AT_TYPE_OPTIONS.map(opt => {
            const entry = value.atTypes.find(a => a.type === opt)
            const checked = !!entry
            return (
              <label key={opt} style={{ fontSize: 11, cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      if (checked) {
                        onChange({ ...value, atTypes: value.atTypes.filter(a => a.type !== opt) })
                      } else {
                        const role: 'primary' | 'secondary' = value.atTypes.length === 0 ? 'primary' : 'secondary'
                        onChange({ ...value, atTypes: [...value.atTypes, { type: opt, role }] })
                      }
                    }}
                  />
                  {opt}
                  {checked && (
                    <select
                      value={entry.role}
                      style={{ fontSize: 10, padding: '1px 2px', marginLeft: 2 }}
                      onChange={e => {
                        const newRole = e.target.value as 'primary' | 'secondary'
                        onChange({ ...value, atTypes: value.atTypes.map(a => a.type === opt ? { ...a, role: newRole } : a) })
                      }}
                    >
                      <option value="primary">主</option>
                      <option value="secondary">副</option>
                    </select>
                  )}
                </div>
              </label>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function CoinValueSpecSection({
  spec, pureIncrease, firstHitDenominator, onChange,
}: {
  spec: CoinValueSpec
  pureIncrease: number
  firstHitDenominator: number
  onChange: (v: CoinValueSpec) => void
}) {
  const [showDetail, setShowDetail] = useState(false)

  const result = pureIncrease > 0
    ? estimateCoinValue(spec, pureIncrease, firstHitDenominator)
    : null

  return (
    <div style={{ marginTop: 8, padding: '8px 10px', background: '#f0f9ff', borderRadius: 4, border: '1px solid #bae6fd' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#0369a1', marginBottom: 6 }}>
        コイン単価 試算（§3.5）
        <span style={{ fontWeight: 400, marginLeft: 6, fontSize: 10 }}>手入力不可。スペックから自動算出。</span>
      </div>

      <div className="field-row has-unit" style={{ marginBottom: 4 }}>
        <label className="field-label" style={{ fontSize: 11 }}>
          通常時コイン持ち
          <span className="field-unit" style={{ display: 'block', fontSize: 10 }}>未入力=純増から推定</span>
        </label>
        <input
          type="number"
          step="1"
          min="20"
          max="45"
          value={spec.normalCoinsPerG ?? ''}
          placeholder="32"
          onChange={e => {
            const n = parseInt(e.target.value)
            onChange({ ...spec, normalCoinsPerG: isNaN(n) ? undefined : n })
          }}
        />
        <span className="field-unit">G/50枚</span>
      </div>

      <div className="field-row has-unit" style={{ marginBottom: 4 }}>
        <label className="field-label" style={{ fontSize: 11 }}>AT継続率</label>
        <input
          type="number"
          step="1"
          min="0"
          max="99"
          value={spec.atContinuationRate ?? ''}
          placeholder="任意"
          onChange={e => {
            const n = parseFloat(e.target.value)
            onChange({ ...spec, atContinuationRate: isNaN(n) ? undefined : n })
          }}
        />
        <span className="field-unit">%</span>
      </div>

      <div className="field-row has-unit" style={{ marginBottom: 4 }}>
        <label className="field-label" style={{ fontSize: 11 }}>AT初当り平均獲得枚数</label>
        <input
          type="number"
          step="50"
          min="0"
          value={spec.avgGainPerFirstHit ?? ''}
          placeholder="任意"
          onChange={e => {
            const n = parseInt(e.target.value)
            onChange({ ...spec, avgGainPerFirstHit: isNaN(n) ? undefined : n })
          }}
        />
        <span className="field-unit">枚</span>
      </div>

      <button
        type="button"
        style={{ fontSize: 10, color: 'var(--primary-light)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 4 }}
        onClick={() => setShowDetail(v => !v)}
      >
        {showDetail ? '▲ 詳細入力を閉じる' : '▼ 詳細入力（押し順ナビ・特化ゾーン）'}
      </button>

      {showDetail && (
        <>
          <div className="field-row has-unit" style={{ marginBottom: 4 }}>
            <label className="field-label" style={{ fontSize: 11 }}>押し順ナビ発生率</label>
            <input
              type="number"
              step="1"
              min="0"
              max="100"
              value={spec.pushOrderNaviRate ?? ''}
              placeholder="任意"
              onChange={e => {
                const n = parseFloat(e.target.value)
                onChange({ ...spec, pushOrderNaviRate: isNaN(n) ? undefined : n })
              }}
            />
            <span className="field-unit">%</span>
          </div>
          <div className="field-row has-unit" style={{ marginBottom: 4 }}>
            <label className="field-label" style={{ fontSize: 11 }}>特化ゾーン平均上乗せ</label>
            <input
              type="number"
              step="10"
              min="0"
              value={spec.avgBonusAddition ?? ''}
              placeholder="任意"
              onChange={e => {
                const n = parseInt(e.target.value)
                onChange({ ...spec, avgBonusAddition: isNaN(n) ? undefined : n })
              }}
            />
            <span className="field-unit">枚</span>
          </div>
        </>
      )}

      {result && (
        <div style={{
          marginTop: 6,
          padding: '6px 8px',
          background: '#e0f2fe',
          borderRadius: 3,
          fontSize: 11,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>試算コイン単価</span>
            <span style={{ fontWeight: 700, color: '#0369a1', fontSize: 15 }}>
              {result.coinValueYen}円/G
            </span>
          </div>
          <div style={{ color: 'var(--text-muted)', marginTop: 2, fontSize: 10 }}>
            {result.formula}
          </div>
          {result.avgGainPerHit != null && (
            <div style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: 1 }}>
              平均獲得{result.avgGainPerHit}枚 / 初当りまで消費{result.avgConsumedUntilHit}枚
              {result.expectedDiffPerGame != null && ` / 期待差枚${result.expectedDiffPerGame}枚/G`}
            </div>
          )}
          <div style={{ color: '#0369a1', fontSize: 10, marginTop: 2 }}>
            ※ isEstimated=true（試算値） / mode={result.mode}
          </div>
        </div>
      )}
    </div>
  )
}

export function MachineSpecSection({ value, onChange }: Props) {
  const set = <K extends keyof MachineSpec>(k: K, v: MachineSpec[K]) =>
    onChange({ ...value, [k]: v })

  const isSlot = ['smart_slot', 'normal_20'].includes(value.category)
  const isSmartSlot = value.category === 'smart_slot'

  const defaultGameFlow: GameFlow = {
    normalPhase: [],
    firstHitTriggers: [],
    atTypes: [],
  }

  const handleGameFlowDetailChange = (gf: GameFlow) => {
    onChange({ ...value, gameFlowDetail: gf, gameFlow: deriveGameFlowType(gf, value.category) })
  }

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

      {isSmartSlot && (
        <GameFlowDetail3Axis
          value={value.gameFlowDetail ?? defaultGameFlow}
          onChange={handleGameFlowDetailChange}
        />
      )}

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

      {isSmartSlot && (
        <CoinValueSpecSection
          spec={value.coinValueSpec ?? {}}
          pureIncrease={value.pureIncrease?.lower ?? 0}
          firstHitDenominator={value.firstHitDenominator}
          onChange={coinValueSpec => set('coinValueSpec', coinValueSpec)}
        />
      )}
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
