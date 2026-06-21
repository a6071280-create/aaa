import type { ScoreBreakdown } from '../../domain/types'

interface Props {
  breakdown: ScoreBreakdown
}

const MAX_DELTA = 20 // ±20週を100%とした表示スケール

export function ScoreBreakdownChart({ breakdown }: Props) {
  const { baseline, baselineSource, items, total } = breakdown
  const totalDelta = total - baseline

  return (
    <div className="result-card">
      <div className="result-card-title">
        <span>スコア内訳（稼働貢献週 加減点）</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>
          ベースライン: {baselineSource}
        </span>
      </div>

      <div className="breakdown-baseline-row">
        <span>ベースライン（{baselineSource}）</span>
        <span style={{ fontWeight: 700 }}>{Math.round(baseline)} 週</span>
      </div>

      {items.map(item => {
        const absRatio = Math.min(1, Math.abs(item.delta) / MAX_DELTA) * 50
        const isPos = item.delta > 0
        const isNeg = item.delta < 0
        return (
          <div key={item.factor} className="breakdown-row" title={item.rationale}>
            <span className="breakdown-label">{item.factor}</span>
            <div className="breakdown-bar-wrap">
              {/* 中央線 */}
              <div style={{
                position: 'absolute', left: '50%', top: 0, width: 1, height: '100%',
                background: 'var(--border-strong)', opacity: 0.5,
              }} />
              {isPos && (
                <div
                  className="breakdown-bar bar-positive"
                  style={{ width: `${absRatio}%` }}
                />
              )}
              {isNeg && (
                <div
                  className="breakdown-bar bar-negative"
                  style={{ width: `${absRatio}%` }}
                />
              )}
            </div>
            <span className={`breakdown-delta ${isPos ? 'delta-pos' : isNeg ? 'delta-neg' : 'delta-zero'}`}>
              {item.delta > 0 ? '+' : ''}{item.delta.toFixed(0)}週
            </span>
          </div>
        )
      })}

      <div className="breakdown-total-row">
        <span>予測稼働貢献週（合計）</span>
        <span>
          {Math.round(baseline)} {totalDelta >= 0 ? '+' : ''}{totalDelta.toFixed(0)}
          {' = '}
          <span style={{ color: 'var(--primary-light)', fontSize: 16 }}>{total}週</span>
        </span>
      </div>
    </div>
  )
}
