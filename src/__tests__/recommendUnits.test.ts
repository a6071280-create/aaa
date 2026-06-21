import { describe, it, expect } from 'vitest'
import { recommendUnits } from '../domain/units/recommendUnits'
import type { PredictionInput, ContributionWeeksPrediction } from '../domain/types'

function makeInput(overrides: Partial<PredictionInput['storeConstraints']> = {}): PredictionInput {
  return {
    machineSpec: {
      machineName: 'テスト台',
      category: 'smart_slot',
      pureIncrease: { lower: 3.0 },
      gameFlow: 'pseudo_bonus_at',
      firstHitDenominator: 319,
      maker: 'テスト',
      ipFame: 'mid',
    },
    marketSignal: { popularityScore: 3, referenceMachines: [] },
    managerEval: { overall: 3, explosivePayout: 3, gameplayFun: 3, customerFit: 3 },
    storeConstraints: {
      newMachineBudget: 10_000_000,
      machinePrice: 1_650_000,
      availableSlots: 6,
      targetRecoveryWeeks: 16,
      avgDailyMachineMarginYen: 3_500,
      competitorAdoption: 'normal',
      ...overrides,
    },
  }
}

function makePrediction(weeks: number): ContributionWeeksPrediction {
  return {
    weeks,
    confidence: 'mid',
    breakdown: { baseline: weeks, baselineSource: 'テスト', items: [], total: weeks },
  }
}

describe('recommendUnits', () => {
  it('ROIが成立する場合、推奨台数 > 0', () => {
    // 週次粗利3500*7=24500、回収週=1650000/24500≈67週。予測100週ならROI成立
    const input = makeInput({ targetRecoveryWeeks: 80 })
    const result = recommendUnits(input, makePrediction(100))
    expect(result.units).toBeGreaterThan(0)
    expect(result.roiWarning).toBeUndefined()
  })

  it('ROIが不成立の場合、推奨台数=0 かつ roiWarning が設定される', () => {
    // 週次粗利24500、回収週=1650000/24500≈67週。予測20週ではROI不成立
    const input = makeInput({ targetRecoveryWeeks: 16 })
    const result = recommendUnits(input, makePrediction(20))
    expect(result.units).toBe(0)
    expect(result.roiWarning).toBeTruthy()
  })

  it('予算上限が島の空き台数より少ない場合、予算が制約元になる', () => {
    // 予算=3_300_000 → 3_300_000/1_650_000=2台。島の空き=6台
    const input = makeInput({ newMachineBudget: 3_300_000, availableSlots: 6, targetRecoveryWeeks: 80 })
    const result = recommendUnits(input, makePrediction(100))
    expect(result.constraintDetail.bindingConstraint).toBe('budget')
    expect(result.units).toBeLessThanOrEqual(2)
  })

  it('島の空き台数が最も少ない場合、島が制約元になる', () => {
    // 予算=大量、島=2台
    const input = makeInput({ newMachineBudget: 100_000_000, availableSlots: 2, targetRecoveryWeeks: 80 })
    const result = recommendUnits(input, makePrediction(100))
    expect(result.constraintDetail.slotMaxUnits).toBe(2)
    expect(result.units).toBeLessThanOrEqual(2)
  })

  it('感度表は5行で、現在設定行が1つだけ存在する', () => {
    const input = makeInput({ targetRecoveryWeeks: 16 })
    const result = recommendUnits(input, makePrediction(100))
    expect(result.sensitivityTable).toHaveLength(5)
    const currentRows = result.sensitivityTable.filter(r => r.isCurrentSetting)
    expect(currentRows).toHaveLength(1)
    expect(currentRows[0].targetRecoveryWeeks).toBe(16)
  })

  it('感度表のtargetRecoveryWeeksは ±2週の連続した値', () => {
    const input = makeInput({ targetRecoveryWeeks: 20 })
    const result = recommendUnits(input, makePrediction(100))
    const weeks = result.sensitivityTable.map(r => r.targetRecoveryWeeks)
    expect(weeks).toEqual([18, 19, 20, 21, 22])
  })

  it('競合導入「多い」は「少ない」より需要上限が低い', () => {
    const inputHigh = makeInput({ competitorAdoption: 'high', targetRecoveryWeeks: 80 })
    const inputLow  = makeInput({ competitorAdoption: 'low',  targetRecoveryWeeks: 80 })
    const rHigh = recommendUnits(inputHigh, makePrediction(100))
    const rLow  = recommendUnits(inputLow,  makePrediction(100))
    expect(rHigh.constraintDetail.demandMaxUnits).toBeLessThan(rLow.constraintDetail.demandMaxUnits)
  })

  it('予測週数が短い場合、需要上限は低くなる', () => {
    const input = makeInput({ targetRecoveryWeeks: 4, newMachineBudget: 100_000_000 })
    const rLongWeeks  = recommendUnits(input, makePrediction(100))
    const rShortWeeks = recommendUnits(input, makePrediction(10))
    expect(rShortWeeks.constraintDetail.demandMaxUnits).toBeLessThan(rLongWeeks.constraintDetail.demandMaxUnits)
  })
})
