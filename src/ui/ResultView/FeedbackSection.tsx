import { useState } from 'react'
import type { FeedbackEntry, GameFlowType } from '../../domain/types'
import type { WeightAdjustment } from '../../domain/learning/WeightLearner'
import { GAME_FLOW_LABELS } from '../../config/defaults'

interface Props {
  sessionId: string
  gameFlow: GameFlowType
  predictedWeeks: number
  history: FeedbackEntry[]
  adjustments: WeightAdjustment[]
  onSubmit: (actualWeeks: number) => void
}

export function FeedbackSection({
  sessionId, gameFlow, predictedWeeks, history, adjustments, onSubmit,
}: Props) {
  const [weeks, setWeeks] = useState('')

  const existing = history.find(e => e.sessionId === sessionId)
  const gfAdjust = adjustments.find(a => a.gameFlow === gameFlow)
  const parsed = parseInt(weeks)
  const valid = !isNaN(parsed) && parsed >= 1

  return (
    <div className="result-card feedback-section">
      <div className="result-card-title">実績フィードバック</div>

      {gfAdjust && (
        <div className="learning-note">
          🧠 {GAME_FLOW_LABELS[gameFlow]} のベースラインを
          <strong style={{ color: gfAdjust.delta > 0 ? 'var(--success)' : 'var(--danger)' }}>
            {gfAdjust.delta > 0 ? '+' : ''}{gfAdjust.delta}週
          </strong> 調整中
          <span style={{ color: 'var(--text-muted)' }}>（{gfAdjust.feedbackCount}件より）</span>
        </div>
      )}

      {existing ? (
        <div className="feedback-submitted">
          <span>✓ 送信済み：実績 <strong>{existing.actualWeeks}週</strong></span>
          <span className="feedback-diff" style={{
            color: existing.actualWeeks >= predictedWeeks ? 'var(--success)' : 'var(--danger)',
          }}>
            （予測比 {existing.actualWeeks >= predictedWeeks ? '+' : ''}{existing.actualWeeks - predictedWeeks}週）
          </span>
          <span className="feedback-hint">→ 次回予測から反映されます</span>
        </div>
      ) : (
        <>
          <p className="feedback-desc">
            実際の稼働貢献週が出たら入力してください。予測モデルのベースラインが自動調整されます。
          </p>
          <div className="feedback-input-row">
            <span className="feedback-label">予測 {predictedWeeks}週 → 実績</span>
            <input
              type="number"
              min={1}
              className="feedback-input"
              value={weeks}
              placeholder="週数"
              onChange={e => setWeeks(e.target.value)}
            />
            <span style={{ fontSize: 12 }}>週</span>
            <button
              className="btn btn-sm btn-primary"
              type="button"
              disabled={!valid}
              onClick={() => { onSubmit(parsed); setWeeks('') }}
            >
              送信
            </button>
          </div>
        </>
      )}

      {history.length > 0 && (
        <details style={{ marginTop: 10 }}>
          <summary style={{ fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer' }}>
            フィードバック履歴 {history.length}件
          </summary>
          <table className="data-table" style={{ marginTop: 6 }}>
            <thead>
              <tr>
                <th>機種名</th>
                <th>ゲームフロー</th>
                <th>予測週</th>
                <th>実績週</th>
                <th>誤差</th>
              </tr>
            </thead>
            <tbody>
              {[...history].reverse().map((e, i) => {
                const diff = e.actualWeeks - e.predictedWeeks
                return (
                  <tr key={i}>
                    <td>{e.machineName}</td>
                    <td>{GAME_FLOW_LABELS[e.gameFlow]}</td>
                    <td>{e.predictedWeeks}週</td>
                    <td>{e.actualWeeks}週</td>
                    <td style={{ color: diff >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                      {diff >= 0 ? '+' : ''}{diff}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </details>
      )}
    </div>
  )
}
