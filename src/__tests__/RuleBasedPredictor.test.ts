import { describe, it, expect } from 'vitest'
import { RuleBasedPredictor } from '../domain/predictor/RuleBasedPredictor'
import { REFERENCE_MACHINES } from '../data/referenceMachines'
import type { PredictionInput } from '../domain/types'

const predictor = new RuleBasedPredictor()

function makeNeutralInput(refIds: string[]): PredictionInput {
  const refs = refIds.map(id => {
    const found = REFERENCE_MACHINES.find(r => r.id === id)
    if (!found) throw new Error(`unknown ref id: ${id}`)
    return found
  })
  return {
    machineSpec: {
      machineName: 'テスト機種',
      category: 'smart_slot',
      pureIncrease: { lower: 3.0 },
      gameFlow: 'pseudo_bonus_at',
      firstHitDenominator: 319,
      maker: 'テストメーカー',
      ipFame: 'mid',          // 中堅IP → bonus=0
    },
    marketSignal: {
      popularityScore: 3,    // 基準値 → delta=0
      referenceMachines: refs,
    },
    managerEval: {
      overall: 3,            // 基準値 → delta=0
      explosivePayout: 3,
      gameplayFun: 3,
      customerFit: 3,
    },
    storeConstraints: {
      newMachineBudget: 10_000_000,
      machinePrice: 1_650_000,
      availableSlots: 6,
      targetRecoveryWeeks: 16,
      avgDailyMachineMarginYen: 3_500,
      competitorAdoption: 'normal',
    },
  }
}

// ── 回帰テスト ────────────────────────────────────────────────────────────────
// 既知機種を参照台として設定し、中立評価での予測が実績値に収束するか確認。
// 全評価スコア=3(中央)・IP=mid(ボーナス0)のため、delta合計=0。
// よって予測 ≈ 参照台の実績値 になるはず。

describe('RuleBasedPredictor 回帰テスト', () => {
  it('北斗の拳を参照台にした場合、予測は89週に近い（±5週）', () => {
    const input = makeNeutralInput(['hokuto_no_ken'])
    const result = predictor.predict(input)
    const { weeks } = result.contributionWeeks
    expect(weeks).toBeGreaterThanOrEqual(84)
    expect(weeks).toBeLessThanOrEqual(94)
  })

  it('モンキーターンVを参照台にした場合、予測は119週に近い（±5週）', () => {
    const input = makeNeutralInput(['monkey_turn_v'])
    const result = predictor.predict(input)
    const { weeks } = result.contributionWeeks
    expect(weeks).toBeGreaterThanOrEqual(114)
    expect(weeks).toBeLessThanOrEqual(124)
  })

  it('ゴッドイーターを参照台にした場合、予測は42週に近い（±5週）', () => {
    const input = makeNeutralInput(['god_eater'])
    const result = predictor.predict(input)
    const { weeks } = result.contributionWeeks
    expect(weeks).toBeGreaterThanOrEqual(37)
    expect(weeks).toBeLessThanOrEqual(47)
  })

  it('相対順序：モンキーV > 北斗 > ゴッドイーター', () => {
    const wMonkey  = predictor.predict(makeNeutralInput(['monkey_turn_v'])).contributionWeeks.weeks
    const wHokuto  = predictor.predict(makeNeutralInput(['hokuto_no_ken'])).contributionWeeks.weeks
    const wGodEater = predictor.predict(makeNeutralInput(['god_eater'])).contributionWeeks.weeks
    expect(wMonkey).toBeGreaterThan(wHokuto)
    expect(wHokuto).toBeGreaterThan(wGodEater)
  })
})

// ── シグナル感度テスト ────────────────────────────────────────────────────────

describe('RuleBasedPredictor シグナル感度テスト', () => {
  it('大衆期待度 5 の予測 > 大衆期待度 1 の予測', () => {
    const base = makeNeutralInput(['hokuto_no_ken'])
    const highPop = { ...base, marketSignal: { ...base.marketSignal, popularityScore: 5 as const } }
    const lowPop  = { ...base, marketSignal: { ...base.marketSignal, popularityScore: 1 as const } }
    const wHigh = predictor.predict(highPop).contributionWeeks.weeks
    const wLow  = predictor.predict(lowPop).contributionWeeks.weeks
    expect(wHigh).toBeGreaterThan(wLow)
  })

  it('著名IPは中堅IPより予測週数が高い', () => {
    const base = makeNeutralInput(['hokuto_no_ken'])
    const famous   = { ...base, machineSpec: { ...base.machineSpec, ipFame: 'famous' as const } }
    const original = { ...base, machineSpec: { ...base.machineSpec, ipFame: 'original' as const } }
    const wFamous   = predictor.predict(famous).contributionWeeks.weeks
    const wOriginal = predictor.predict(original).contributionWeeks.weeks
    expect(wFamous).toBeGreaterThan(wOriginal)
  })

  it('参照台なしのカテゴリ標準値ベースラインは confidence=low になる', () => {
    const input = makeNeutralInput([])
    const result = predictor.predict(input)
    expect(result.contributionWeeks.confidence).toBe('low')
  })

  it('参照台1件で confidence=mid', () => {
    const input = makeNeutralInput(['hokuto_no_ken'])
    const result = predictor.predict(input)
    expect(result.contributionWeeks.confidence).toBe('mid')
  })

  it('参照台2件以上 + シグナル一致で confidence=high', () => {
    const input = makeNeutralInput(['hokuto_no_ken', 'monkey_turn_v'])
    const result = predictor.predict(input)
    expect(result.contributionWeeks.confidence).toBe('high')
  })

  it('予測週数は常に1以上', () => {
    const base = makeNeutralInput(['god_eater'])
    const worstCase = {
      ...base,
      machineSpec: { ...base.machineSpec, ipFame: 'original' as const },
      marketSignal: { ...base.marketSignal, popularityScore: 1 as const },
      managerEval: { overall: 1 as const, explosivePayout: 1 as const, gameplayFun: 1 as const, customerFit: 1 as const },
    }
    const result = predictor.predict(worstCase)
    expect(result.contributionWeeks.weeks).toBeGreaterThanOrEqual(1)
  })
})

// ── ブレークダウン構造テスト ──────────────────────────────────────────────────

describe('RuleBasedPredictor breakdown 構造テスト', () => {
  it('breakdown の total = baseline + Σdelta に一致する', () => {
    const input = makeNeutralInput(['hokuto_no_ken'])
    const { breakdown } = predictor.predict(input).contributionWeeks
    const sumDelta = breakdown.items.reduce((s, it) => s + it.delta, 0)
    const rawTotal = breakdown.baseline + sumDelta
    expect(breakdown.total).toBe(Math.max(1, Math.round(rawTotal)))
  })

  it('breakdown の items に 6 つの因子が含まれる', () => {
    const input = makeNeutralInput(['hokuto_no_ken'])
    const { breakdown } = predictor.predict(input).contributionWeeks
    expect(breakdown.items).toHaveLength(6)
  })
})
