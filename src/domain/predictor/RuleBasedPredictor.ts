import type { IPredictor } from './IPredictor'
import type {
  PredictionInput,
  PredictionResult,
  ContributionWeeksPrediction,
  ScoreBreakdown,
  ScoreBreakdownItem,
  Confidence,
} from '../types'
import { DEFAULT_WEIGHTS, type PredictorWeights } from '../../config/weights'
import { recommendUnits } from '../units/recommendUnits'

export class RuleBasedPredictor implements IPredictor {
  private weights: PredictorWeights

  constructor(weights: PredictorWeights = DEFAULT_WEIGHTS) {
    this.weights = weights
  }

  predict(input: PredictionInput): PredictionResult {
    const contributionWeeks = this.predictContributionWeeks(input)
    const unitRecommendation = recommendUnits(input, contributionWeeks, this.weights)
    return {
      contributionWeeks,
      unitRecommendation,
      predictedAt: new Date().toISOString(),
    }
  }

  private predictContributionWeeks(input: PredictionInput): ContributionWeeksPrediction {
    const { marketSignal, managerEval, machineSpec } = input
    const w = this.weights

    // ── ベースライン算出 ──────────────────────────────────────────────────
    const refs = marketSignal.referenceMachines
    let baseline: number
    let baselineSource: string

    if (refs.length > 0) {
      const sum = refs.reduce((acc, r) => acc + r.actualContributionWeeks, 0)
      baseline = sum / refs.length
      baselineSource = `類似台${refs.length}件の平均実績`
    } else {
      baseline = w.categoryBaseline[machineSpec.gameFlow]
      baselineSource = `${machineSpec.gameFlow}カテゴリの標準値`
    }

    // ── 各シグナルの加減点 ────────────────────────────────────────────────
    const items: ScoreBreakdownItem[] = []

    const popDelta = (marketSignal.popularityScore - 3) * w.popularityScoreDeltaPerPoint
    const popSign = popDelta >= 0 ? '+' : ''
    items.push({
      factor: '大衆期待度（SNS）',
      delta: popDelta,
      rationale: `スコア${marketSignal.popularityScore}/5 → 基準(3)から${popSign}${marketSignal.popularityScore - 3}pt × ${w.popularityScoreDeltaPerPoint}週/pt`,
    })

    const overallDelta = (managerEval.overall - 3) * w.overallEvalDeltaPerPoint
    items.push({
      factor: '店長総合評価',
      delta: overallDelta,
      rationale: `${managerEval.overall}/5 × ${w.overallEvalDeltaPerPoint}週/pt`,
    })

    const explosiveDelta = (managerEval.explosivePayout - 3) * w.explosivePayoutDeltaPerPoint
    items.push({
      factor: '出玉爆発力',
      delta: explosiveDelta,
      rationale: `${managerEval.explosivePayout}/5 × ${w.explosivePayoutDeltaPerPoint}週/pt`,
    })

    const funDelta = (managerEval.gameplayFun - 3) * w.gameplayFunDeltaPerPoint
    items.push({
      factor: 'ゲーム性',
      delta: funDelta,
      rationale: `${managerEval.gameplayFun}/5 × ${w.gameplayFunDeltaPerPoint}週/pt`,
    })

    const fitDelta = (managerEval.customerFit - 3) * w.customerFitDeltaPerPoint
    items.push({
      factor: '客層フィット',
      delta: fitDelta,
      rationale: `${managerEval.customerFit}/5 × ${w.customerFitDeltaPerPoint}週/pt`,
    })

    const ipDelta = w.ipFameBonus[machineSpec.ipFame]
    items.push({
      factor: 'IP知名度',
      delta: ipDelta,
      rationale: machineSpec.ipFame === 'famous' ? '著名IP補正' : machineSpec.ipFame === 'original' ? 'オリジナルIP減点' : '中堅IP（補正なし）',
    })

    const totalDelta = items.reduce((s, it) => s + it.delta, 0)
    const rawTotal = baseline + totalDelta
    const total = Math.max(1, Math.round(rawTotal))

    const breakdown: ScoreBreakdown = { baseline, baselineSource, items, total }

    // ── 信頼度 ────────────────────────────────────────────────────────────
    // 参照台件数 + シグナルの一貫性（人気スコアと店長評価の乖離）
    let confidence: Confidence
    if (refs.length === 0) {
      confidence = 'low'
    } else if (refs.length === 1) {
      confidence = 'mid'
    } else {
      const evalAvg = (managerEval.overall + managerEval.gameplayFun + managerEval.explosivePayout) / 3
      const popNorm = marketSignal.popularityScore
      const divergence = Math.abs(evalAvg - popNorm)
      confidence = divergence <= 1.5 ? 'high' : 'mid'
    }

    return { weeks: total, confidence, breakdown }
  }
}
