// ── 列挙値 ──────────────────────────────────────────────────────────────────

export type MachineCategory =
  | 'smart_slot'      // スマスロ
  | 'smart_pachinko'  // スマパチ
  | 'normal_20'       // 20円ノーマル(A)
  | 'pachinko_4en'    // 4円パチンコ
  | 'other'

export type GameFlowType =
  | 'st'               // ST（ストックゾーン/一撃特化）
  | 'pseudo_bonus_at'  // 擬似ボーナス+AT（バランス型）
  | 'game_count_add'   // ゲーム数上乗せ（高純増型）
  | 'normal_a'         // ノーマルA（ジャグラー等）
  | 'mixed_12'         // 一種二種混合（荒波型）
  | 'other'

export type IPFame = 'famous' | 'mid' | 'original'
export type CompetitorLevel = 'high' | 'normal' | 'low' | 'unknown'
export type Confidence = 'low' | 'mid' | 'high'
export type EvalScore = 1 | 2 | 3 | 4 | 5

// ── §6 ゲームフロー3軸（スマスロAT機用）────────────────────────────────────
export type NormalPhaseMgmt = '周期管理' | 'ゲーム数管理' | 'ポイント管理'
export type FirstHitTrigger = '規定周期解除' | '規定ゲーム数解除' | 'レア役解除'
export type AtType = '差枚管理型AT' | 'ゲーム数管理型AT' | 'セット数管理AT' | 'STタイプ'

export interface GameFlow {
  normalPhase: NormalPhaseMgmt[]
  firstHitTriggers: FirstHitTrigger[]
  atTypes: { type: AtType; role: 'primary' | 'secondary' }[]
}

// ── §3.5 コイン単価試算用スペック ────────────────────────────────────────────
export interface CoinValueSpec {
  normalCoinsPerG?: number        // 通常時コイン持ち（50枚あたりG数。デフォルト32）
  atContinuationRate?: number     // AT継続率 (%)
  avgAtContinuationGames?: number // 平均AT継続G数（継続率の代替）
  avgGainPerFirstHit?: number     // AT初当り時の平均獲得枚数
  // 詳細入力（任意）
  pushOrderNaviRate?: number      // 押し順ナビ発生率 (%)
  avgBonusAddition?: number       // 特化ゾーン平均上乗せ（枚）
}

export interface CoinValueBreakdown {
  mode: 'simple' | 'detailed'
  normalCoinsPerG: number         // 使用した通常時コイン持ち
  normalCoinsPerGSource: string   // '入力値' or '純増から推定' or 'デフォルト'
  avgGainPerHit?: number          // 平均獲得枚数（参考）
  avgConsumedUntilHit: number     // 初当りまでの平均消費枚数（参考）
  firstHitDenominator: number
  expectedDiffPerGame?: number    // 1Gあたり期待差枚（参考）
  coinValueYen: number            // コイン単価（円/G）
  formula: string                 // 計算式の説明
  isEstimated: true
}

// ── §2-A 機種スペック ────────────────────────────────────────────────────────

export interface PureIncreaseSpec {
  lower: number   // 下位AT 枚/G
  upper?: number  // 上位AT 枚/G（任意）
}

export interface MachineSpec {
  machineName: string
  category: MachineCategory
  pureIncrease?: PureIncreaseSpec    // スロット系のみ
  gameFlow: GameFlowType             // ベースライン分類（既存）
  gameFlowDetail?: GameFlow          // 3軸詳細（スマスロAT機用・任意）
  coinValueSpec?: CoinValueSpec      // コイン単価試算用（スマスロ系・任意）
  firstHitDenominator: number        // 初当り確率の分母
  maker: string
  ipFame: IPFame
}

// ── §2-B 市場期待度 ──────────────────────────────────────────────────────────

export interface ReferenceMachine {
  id: string
  machineName: string
  category: MachineCategory
  gameFlow: GameFlowType
  pureIncrease?: PureIncreaseSpec
  coinUnitYen?: number               // 実績コイン単価（円/G）
  actualContributionWeeks: number
  releaseYear: number
  memo?: string
}

export interface MarketSignal {
  popularityScore: EvalScore        // SNS大衆期待度 1〜5
  popularityMemo?: string
  referenceMachines: ReferenceMachine[]  // 1〜3件
}

// ── §2-C 店長試打評価 ────────────────────────────────────────────────────────

export interface ManagerEvaluation {
  overall: EvalScore
  explosivePayout: EvalScore   // 出玉の爆発力
  gameplayFun: EvalScore       // ゲーム性の面白さ
  customerFit: EvalScore       // 客層フィット
  comment?: string
}

// ── §2-D 自店制約 ───────────────────────────────────────────────────────────

export interface StoreConstraints {
  newMachineBudget: number          // 新台予算上限（円）
  machinePrice: number              // 1台あたり機械代（円）
  availableSlots: number            // 島の空き台数
  targetRecoveryWeeks: number       // 目標回収期間（週）★主制約
  avgDailyMachineMarginYen: number  // 自店平均台粗利（円/日）
  competitorAdoption: CompetitorLevel
}

// ── 統合入力 ─────────────────────────────────────────────────────────────────

export interface PredictionInput {
  machineSpec: MachineSpec
  marketSignal: MarketSignal
  managerEval: ManagerEvaluation
  storeConstraints: StoreConstraints
}

// ── 予測①出力：稼働貢献週 ───────────────────────────────────────────────────

export interface ScoreBreakdownItem {
  factor: string    // 例："大衆期待度" "類似台実績" "IP知名度"
  delta: number     // ±週数
  rationale: string // 根拠（UIのtooltip/棒グラフラベルに使用）
}

export interface ScoreBreakdown {
  baseline: number             // 類似台実績の平均（週）
  baselineSource: string       // "類似台3件の平均" or "カテゴリ標準値"
  items: ScoreBreakdownItem[]
  total: number                // baseline + Σdelta
}

export interface ContributionWeeksPrediction {
  weeks: number
  confidence: Confidence
  breakdown: ScoreBreakdown
}

// ── 予測②出力：推奨仕入れ台数 ─────────────────────────────────────────────

export interface UnitConstraintDetail {
  roiMaxUnits: number           // ROI逆算の上限
  budgetMaxUnits: number        // 予算 ÷ 機械代
  slotMaxUnits: number          // 島の空き台数
  demandMaxUnits: number        // 需要上限（貢献週×競合係数）
  bindingConstraint: 'roi' | 'budget' | 'slot' | 'demand'
  recoveryWeeksNeeded: number   // 実際に必要な回収週数
}

export interface SensitivityRow {
  targetRecoveryWeeks: number
  roiMaxUnits: number
  recommendedUnits: number
  isCurrentSetting: boolean
  roiPasses: boolean
}

export interface UnitRecommendation {
  units: number
  rationale: string
  constraintDetail: UnitConstraintDetail
  roiWarning?: string
  sensitivityTable: SensitivityRow[]
}

// ── 最終結果 ─────────────────────────────────────────────────────────────────

export interface PredictionResult {
  contributionWeeks: ContributionWeeksPrediction
  unitRecommendation: UnitRecommendation
  predictedAt: string
}

// ── エクスポート単位 ─────────────────────────────────────────────────────────

export interface PredictionSession {
  id: string
  input: PredictionInput
  result: PredictionResult
}
