import type { PredictionSession } from '../domain/types'

export function exportJSON(session: PredictionSession): void {
  const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' })
  downloadBlob(blob, `pachinko_prediction_${session.id.slice(0, 8)}.json`)
}

export function exportCSV(session: PredictionSession): void {
  const { input, result } = session
  const ms = input.machineSpec
  const sc = input.storeConstraints
  const cw = result.contributionWeeks
  const ur = result.unitRecommendation

  const rows: [string, string][] = [
    ['機種名', ms.machineName],
    ['種別', ms.category],
    ['ゲームフロー', ms.gameFlow],
    ['IP知名度', ms.ipFame],
    ['大衆期待度', String(input.marketSignal.popularityScore)],
    ['店長総合評価', String(input.managerEval.overall)],
    ['出玉爆発力', String(input.managerEval.explosivePayout)],
    ['ゲーム性', String(input.managerEval.gameplayFun)],
    ['客層フィット', String(input.managerEval.customerFit)],
    ['予算上限（円）', String(sc.newMachineBudget)],
    ['機械代（円/台）', String(sc.machinePrice)],
    ['島の空き台数', String(sc.availableSlots)],
    ['目標回収期間（週）', String(sc.targetRecoveryWeeks)],
    ['平均台粗利（円/日）', String(sc.avgDailyMachineMarginYen)],
    ['競合導入見込み', sc.competitorAdoption],
    ['予測稼働貢献週', String(cw.weeks)],
    ['信頼度', cw.confidence],
    ['スコアベースライン（週）', String(cw.breakdown.baseline)],
    ...cw.breakdown.items.map(it => [`  ${it.factor}加減点（週）`, String(it.delta)] as [string, string]),
    ['推奨仕入れ台数', String(ur.units)],
    ['制約元', ur.constraintDetail.bindingConstraint],
    ['ROI上限台数', String(ur.constraintDetail.roiMaxUnits)],
    ['予算上限台数', String(ur.constraintDetail.budgetMaxUnits)],
    ['島上限台数', String(ur.constraintDetail.slotMaxUnits)],
    ['需要上限台数', String(ur.constraintDetail.demandMaxUnits)],
    ['予測日時', result.predictedAt],
  ]

  const csv = rows.map(([k, v]) => `"${k}","${v}"`).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, `pachinko_prediction_${session.id.slice(0, 8)}.csv`)
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
