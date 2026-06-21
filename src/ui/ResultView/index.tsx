import type { PredictionResult, PredictionInput, PredictionSession } from '../../domain/types'
import { CONFIDENCE_LABELS } from '../../config/defaults'
import { ScoreBreakdownChart } from './ScoreBreakdownChart'
import { SensitivityTable } from './SensitivityTable'
import { ReferenceMachineTable } from './ReferenceMachineTable'
import { ExportButton } from '../ExportButton'

interface Props {
  result: PredictionResult | null
  input: PredictionInput
  session: PredictionSession | null
}

export function ResultView({ result, input, session }: Props) {
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
