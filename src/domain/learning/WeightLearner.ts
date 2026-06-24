import type { FeedbackEntry, GameFlowType } from '../types'
import type { PredictorWeights } from '../../config/weights'
import { DEFAULT_WEIGHTS } from '../../config/weights'

const LEARNING_RATE = 0.3

export interface WeightAdjustment {
  gameFlow: GameFlowType
  label: string
  delta: number
  feedbackCount: number
  baselineBefore: number
  baselineAfter: number
}

export function learnFromFeedback(
  history: FeedbackEntry[]
): { weights: PredictorWeights; adjustments: WeightAdjustment[] } {
  if (history.length === 0) {
    return { weights: DEFAULT_WEIGHTS, adjustments: [] }
  }

  const newBaseline = { ...DEFAULT_WEIGHTS.categoryBaseline }
  const adjustments: WeightAdjustment[] = []

  const gameFlows = Object.keys(newBaseline) as GameFlowType[]
  for (const gf of gameFlows) {
    const entries = history.filter(e => e.gameFlow === gf)
    if (entries.length === 0) continue

    const avgError =
      entries.reduce((s, e) => s + (e.actualWeeks - e.predictedWeeks), 0) / entries.length
    const delta = Math.round(avgError * LEARNING_RATE)
    if (delta === 0) continue

    const before = newBaseline[gf]
    newBaseline[gf] = Math.max(1, before + delta)
    adjustments.push({
      gameFlow: gf,
      label: gf,
      delta,
      feedbackCount: entries.length,
      baselineBefore: before,
      baselineAfter: newBaseline[gf],
    })
  }

  return {
    weights: { ...DEFAULT_WEIGHTS, categoryBaseline: newBaseline },
    adjustments,
  }
}
