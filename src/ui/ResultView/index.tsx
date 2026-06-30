import type { PredictionResult, PredictionInput, PredictionSession, FeedbackEntry } from '../../domain/types'
import { CONFIDENCE_LABELS } from '../../config/defaults'

// DK-SIS 2023年業界平均 11.2週 を基準とした判定ティア
const DK_SIS_AVG = 11.2

function hitTier(weeks: number): { label: string; color: string } {
  if (weeks < 8)   return { label: '短命リスク（見送り推奨）', color: 'var(--danger)' }
  if (weeks < 12)  return { label: 'ボーダー（DK-SIS平均付近）', color: '#e67e22' }
  if (weeks <= 20) return { label: '標準ヒット', color: 'var(--text-muted)' }
  if (weeks <= 50) return { label: 'ヒット', color: 'var(--success)' }
  return { label: 'メガヒット', color: '#8e44ad' }
}
import { ScoreBreakdownChart } from './ScoreBreakdownChart'
import { SensitivityTable } from './SensitivityTable'
import { ReferenceMachineTable } from './ReferenceMachineTable'
import { FeedbackSection } from './FeedbackSection'
import { ExportButton } from '../ExportButton'
import type { WeightAdjustment } from '../../domain/learning/WeightLearner'

interface Props {
  result: PredictionResult | null
  input: PredictionInput
  session: PredictionSession | null
  feedbackHistory: FeedbackEntry[]
  adjustments: WeightAdjustment[]
  onFeedback: (actualWeeks: number) => void
}

export function ResultView({ result, input, session, feedbackHistory, adjustments, onFeedback }: Props) {
  if (!result) {
    return (
      <div className="result-placeholder">
        <div className="icon">📊</div>
        <p>左のフォームに入力して「予測を実行」を押すと</p>
        <p>稼働貢献週と推奨仕入れ台数が表示されます</p>
      </div>
    )
  }

  const { contributionWeeks, unitRecommendation } = result
  const machineName = input.machineSpec.machineName
  const tier = hitTier(contributionWeeks.weeks)

  const handlePrint = () => {
    document.title = `仕入れ判断_${machineName}_${new Date().toLocaleDateString('ja-JP')}`
    window.print()
  }

  return (
    <div>
      {/* KPI */}
      <div className="result-kpi-row">
        <div className="kpi-card">
          <div className="kpi-label">予測 稼働貢献週</div>
          <div>
            <span className="kpi-value">{contributionWeeks.weeks}</span>
            <span className="kpi-unit">週</span>
          </div>
          <span className={`kpi-confidence conf-${contributionWeeks.confidence}`}>
            信頼度 {CONFIDENCE_LABELS[contributionWeeks.confidence]}
          </span>
          <div style={{ fontSize: 12, fontWeight: 600, color: tier.color, marginTop: 4 }}>
            {tier.label}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
            DK-SIS業界平均 {DK_SIS_AVG}週
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">推奨 仕入れ台数</div>
          <div>
            <span className="kpi-value">{unitRecommendation.units}</span>
            <span className="kpi-unit">台</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            {unitRecommendation.rationale}
          </div>
        </div>
      </div>

      {/* ROI警告 */}
      {unitRecommendation.roiWarning && (
        <div className="warning-box">
          ⚠ {unitRecommendation.roiWarning}
        </div>
      )}

      {/* スコア内訳 */}
      <ScoreBreakdownChart breakdown={contributionWeeks.breakdown} />

      {/* 制約内訳 + 感度表 */}
      <SensitivityTable
        rows={unitRecommendation.sensitivityTable}
        constraintDetail={unitRecommendation.constraintDetail}
        machineName={machineName}
      />

      {/* 類似台比較 */}
      <ReferenceMachineTable
        references={input.marketSignal.referenceMachines}
        prediction={contributionWeeks}
        machineName={machineName}
      />

      {/* 印刷フッター（印刷時のみ表示） */}
      <div className="print-footer">
        {machineName} 仕入れ判断レポート — {new Date(result.predictedAt).toLocaleString('ja-JP')} 作成
      </div>

      {/* フィードバック */}
      {session && (
        <FeedbackSection
          sessionId={session.id}
          gameFlow={input.machineSpec.gameFlow}
          predictedWeeks={contributionWeeks.weeks}
          history={feedbackHistory}
          adjustments={adjustments}
          onSubmit={onFeedback}
        />
      )}

      {/* エクスポート・印刷 */}
      {session && (
        <div className="export-row">
          <button className="btn btn-sm print-btn" type="button" onClick={handlePrint}>
            印刷／PDF
          </button>
          <ExportButton session={session} />
        </div>
      )}
    </div>
  )
}
