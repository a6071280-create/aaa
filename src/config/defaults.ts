// DK-SIS全国平均台粗利（2023年度目安）
export const DK_SIS_AVG_DAILY_MARGIN_YEN = 3_500

// デフォルト目標回収期間
export const DEFAULT_TARGET_RECOVERY_WEEKS = 16

// スマスロ新台の標準的な機械代（目安）
export const DEFAULT_MACHINE_PRICE_YEN = 1_650_000

// UI表示用：カテゴリラベル
export const CATEGORY_LABELS: Record<string, string> = {
  smart_slot: 'スマスロ',
  smart_pachinko: 'スマパチ',
  normal_20: '20円ノーマル(A)',
  pachinko_4en: '4円パチンコ',
  other: 'その他',
}

export const GAME_FLOW_LABELS: Record<string, string> = {
  st: 'ST（一撃特化）',
  pseudo_bonus_at: '擬似ボ+AT（バランス）',
  game_count_add: 'ゲーム数上乗せ（高純増）',
  normal_a: 'ノーマルA',
  mixed_12: '一種二種混合（荒波）',
  other: 'その他',
}

export const IP_FAME_LABELS: Record<string, string> = {
  famous: '著名IP',
  mid: '中堅IP',
  original: 'オリジナル',
}

export const COMPETITOR_LABELS: Record<string, string> = {
  high: '多い',
  normal: '普通',
  low: '少ない',
  unknown: '不明',
}

export const CONFIDENCE_LABELS: Record<string, string> = {
  low: '低',
  mid: '中',
  high: '高',
}
