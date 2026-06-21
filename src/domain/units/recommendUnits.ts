import type {
  PredictionInput,
  ContributionWeeksPrediction,
  UnitRecommendation,
  UnitConstraintDetail,
  SensitivityRow,
} from '../types'
import type { PredictorWeights } from '../../config/weights'
import { DEFAULT_WEIGHTS } from '../../config/weights'

function calcDemandMaxUnits(
  availableSlots: number,
  weeks: number,
  competitorAdoption: PredictionInput['storeConstraints']['competitorAdoption'],
  w: PredictorWeights,
): number {
  const { thresholdHigh, thresholdMid, thresholdLow } = w.weeksDemandFactor
  const { high, mid, low, veryLow } = w.demandRatioByWeeks
  const weeksFactor =
    weeks >= thresholdHigh ? high
    : weeks >= thresholdMid ? mid
    : weeks >= thresholdLow ? low
    : veryLow
  const compFactor = w.competitorAdoptionFactor[competitorAdoption]
  return Math.max(1, Math.floor(availableSlots * weeksFactor * compFactor))
}

function calcSensitivityRow(
  targetRecoveryWeeks: number,
  recoveryWeeksNeeded: number,
  predictedWeeks: number,
  budgetMaxUnits: number,
  slotMaxUnits: number,
  demandMaxUnits: number,
  isCurrentSetting: boolean,
): SensitivityRow {
  const roiPasses = recoveryWeeksNeeded <= predictedWeeks && recoveryWeeksNeeded <= targetRecoveryWeeks
  const roiMaxUnits = roiPasses ? slotMaxUnits : 0
  const recommendedUnits = Math.max(0, Math.min(roiMaxUnits, budgetMaxUnits, slotMaxUnits, demandMaxUnits))
  return { targetRecoveryWeeks, roiMaxUnits, recommendedUnits, isCurrentSetting, roiPasses }
}

function findBindingConstraint(
  detail: Omit<UnitConstraintDetail, 'bindingConstraint'>,
): UnitConstraintDetail['bindingConstraint'] {
  const { roiMaxUnits, budgetMaxUnits, slotMaxUnits, demandMaxUnits } = detail
  const min = Math.min(roiMaxUnits, budgetMaxUnits, slotMaxUnits, demandMaxUnits)
  if (roiMaxUnits === min) return 'roi'
  if (demandMaxUnits === min) return 'demand'
  if (budgetMaxUnits === min) return 'budget'
  return 'slot'
}

function buildRationale(
  binding: UnitConstraintDetail['bindingConstraint'],
  units: number,
  detail: UnitConstraintDetail,
): string {
  const labels = {
    roi: `ROI制約（回収${Math.ceil(detail.recoveryWeeksNeeded)}週 > 目標）により ${units}台に制限`,
    budget: `予算上限（${detail.budgetMaxUnits}台分）が制約`,
    slot: `島の空き台数（${detail.slotMaxUnits}台）が上限`,
    demand: `需要上限（予測週数・競合から${detail.demandMaxUnits}台）が制約`,
  }
  return labels[binding]
}

export function recommendUnits(
  input: PredictionInput,
  prediction: ContributionWeeksPrediction,
  weights: PredictorWeights = DEFAULT_WEIGHTS,
): UnitRecommendation {
  const { storeConstraints } = input
  const { weeks } = prediction
  const {
    newMachineBudget,
    machinePrice,
    availableSlots,
    targetRecoveryWeeks,
    avgDailyMachineMarginYen,
    competitorAdoption,
  } = storeConstraints

  // ── §4 ステップ1: ROI逆算 ─────────────────────────────────────────────
  const weeklyMarginPerUnit = avgDailyMachineMarginYen * 7
  const recoveryWeeksNeeded = weeklyMarginPerUnit > 0
    ? machinePrice / weeklyMarginPerUnit
    : Infinity

  const roiPasses = recoveryWeeksNeeded <= weeks && recoveryWeeksNeeded <= targetRecoveryWeeks
  const roiMaxUnits = roiPasses ? availableSlots : 0

  // ── §4 ステップ2〜4: 予算・島・需要 ──────────────────────────────────
  const budgetMaxUnits = machinePrice > 0
    ? Math.floor(newMachineBudget / machinePrice)
    : availableSlots
  const slotMaxUnits = availableSlots
  const demandMaxUnits = calcDemandMaxUnits(availableSlots, weeks, competitorAdoption, weights)

  // ── §4 ステップ5: 最終台数 ────────────────────────────────────────────
  const units = Math.max(0, Math.min(roiMaxUnits, budgetMaxUnits, slotMaxUnits, demandMaxUnits))

  const detailBase = { roiMaxUnits, budgetMaxUnits, slotMaxUnits, demandMaxUnits, recoveryWeeksNeeded }
  const bindingConstraint = findBindingConstraint(detailBase)
  const constraintDetail: UnitConstraintDetail = { ...detailBase, bindingConstraint }

  // ── 感度表: targetRecoveryWeeks ±2 ───────────────────────────────────
  const sensitivityTable: SensitivityRow[] = [-2, -1, 0, 1, 2].map(delta =>
    calcSensitivityRow(
      targetRecoveryWeeks + delta,
      recoveryWeeksNeeded,
      weeks,
      budgetMaxUnits,
      slotMaxUnits,
      demandMaxUnits,
      delta === 0,
    ),
  )

  const roiWarning = !roiPasses
    ? `回収に必要な週数は${Math.ceil(recoveryWeeksNeeded)}週ですが、予測稼働貢献${weeks}週・目標${targetRecoveryWeeks}週を上回っています。単体ROIが成立しないため、台数を絞るか見送りを検討してください。`
    : undefined

  return {
    units,
    rationale: buildRationale(bindingConstraint, units, constraintDetail),
    constraintDetail,
    roiWarning,
    sensitivityTable,
  }
}
