import type { IPFame, CompetitorLevel, GameFlowType } from '../domain/types'

export interface PredictorWeights {
  // シグナルごとの週数加減点（スコア中央値=3から1ポイントあたり）
  popularityScoreDeltaPerPoint: number
  overallEvalDeltaPerPoint: number
  explosivePayoutDeltaPerPoint: number
  gameplayFunDeltaPerPoint: number
  customerFitDeltaPerPoint: number

  // IP知名度ボーナス（絶対値、週数加算）
  ipFameBonus: Record<IPFame, number>

  // コイン単価ペナルティ（§3.5）
  // 高コイン単価ほど寿命が短い傾向。1円/G超過あたりの週数減点。
  coinValuePenaltyPerYenAbove: number  // ペナルティ係数（負の値）
  coinValueBaselineYen: number         // ペナルティなしの基準単価（円/G）

  // 競合導入による需要係数（availableSlotsに乗じる）
  competitorAdoptionFactor: Record<CompetitorLevel, number>

  // 参照台未選択時のゲームフロー別ベースライン（週）
  categoryBaseline: Record<GameFlowType, number>

  // 需要上限: 予測週数に応じたスロット使用率
  weeksDemandFactor: { thresholdHigh: number; thresholdMid: number; thresholdLow: number }
  demandRatioByWeeks: { high: number; mid: number; low: number; veryLow: number }
}

export const DEFAULT_WEIGHTS: PredictorWeights = {
  popularityScoreDeltaPerPoint: 8,    // ±16週（MAX-MIN）
  overallEvalDeltaPerPoint: 5,        // ±10週
  explosivePayoutDeltaPerPoint: 3,    // ±6週
  gameplayFunDeltaPerPoint: 3,        // ±6週
  customerFitDeltaPerPoint: 4,        // ±8週

  ipFameBonus: {
    famous: 12,
    mid: 0,
    original: -8,
  },

  // コイン単価が基準(3.1円)より1円高いごとに-10週（実績より: モンキーV=119, かぐや様=57で差62週）
  // 単価差: 4.2-3.1=1.1円 に対し週数差: 119-57≈62週 → 62/1.1≈56週/円だが他要因もあるため保守的に-10
  coinValuePenaltyPerYenAbove: -10,
  coinValueBaselineYen: 3.1,

  competitorAdoptionFactor: {
    high: 0.65,    // 競合多い → 自店取り分減
    normal: 1.0,
    low: 1.25,     // 競合少ない → 自店優位
    unknown: 1.0,
  },

  // 実績データから導出したカテゴリ別ベースライン
  categoryBaseline: {
    normal_a: 181,         // マイジャグV/キングハナハナ/ゴーゴー3 平均
    pseudo_bonus_at: 84,   // モンキーV/北斗/戦国乙女4 平均
    mixed_12: 80,          // からくり/東京喰種 平均
    game_count_add: 57,    // かぐや様
    st: 42,                // ゴッドイーター
    other: 60,
  },

  weeksDemandFactor: {
    thresholdHigh: 80,
    thresholdMid: 40,
    thresholdLow: 20,
  },
  demandRatioByWeeks: {
    high: 1.0,
    mid: 0.70,
    low: 0.50,
    veryLow: 0.30,
  },
}
