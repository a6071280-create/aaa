import type { CoinValueSpec, CoinValueBreakdown } from '../types'

// スマスロの換算: 50コイン=100円 (2円/コイン)
// 実測データとの整合: 100 / normalCoinsPerG で実績値に一致
// モンキーV(32G)=3.1, 北斗(30G)=3.3, かぐや様(24G)=4.2, ゴッドイーター(28G)=3.5
const SLOT_100_YEN_PER_50_COINS = 100

function estimateNormalCoinsPerG(pureIncrease: number): number {
  // 高純増機種ほどコイン持ちが低く設計される（メーカーが出玉率を調整するため）
  // 経験則: 36 - 1.3 × 純増 (クランプ: 22〜38)
  return Math.max(22, Math.min(38, Math.round(36 - 1.3 * pureIncrease)))
}

export function estimateCoinValue(
  spec: CoinValueSpec,
  pureIncrease: number,
  firstHitDenominator: number,
): CoinValueBreakdown {
  const normalCoinsProvided = spec.normalCoinsPerG != null
  const normalCoinsPerG = spec.normalCoinsPerG
    ?? (pureIncrease > 0 ? estimateNormalCoinsPerG(pureIncrease) : 32)

  const normalCoinsPerGSource = normalCoinsProvided
    ? '入力値'
    : pureIncrease > 0
    ? `純増${pureIncrease}枚/Gから推定`
    : 'デフォルト(32G)'

  // 平均獲得枚数（参考値として計算）
  let avgGainPerHit: number | undefined
  if (spec.avgGainPerFirstHit != null) {
    avgGainPerHit = spec.avgGainPerFirstHit
  } else if (spec.avgAtContinuationGames != null) {
    avgGainPerHit = pureIncrease * spec.avgAtContinuationGames
  } else if (spec.atContinuationRate != null) {
    const r = Math.min(0.99, spec.atContinuationRate / 100)
    const avgSets = 1 / (1 - r)
    avgGainPerHit = pureIncrease * avgSets * 150  // 1セット≈150G
  }

  // 初当りまでの平均消費枚数
  const avgConsumedUntilHit = firstHitDenominator * (50 / normalCoinsPerG)

  // 1Gあたり期待差枚（参考値、仕様書の式）
  const expectedDiffPerGame = avgGainPerHit != null
    ? Math.round(((avgGainPerHit - avgConsumedUntilHit) / firstHitDenominator) * 100) / 100
    : undefined

  // 主式: 100円 ÷ normalCoinsPerG = 円/G
  const coinValueYen = Math.round((SLOT_100_YEN_PER_50_COINS / normalCoinsPerG) * 10) / 10

  const isDetailed = spec.pushOrderNaviRate != null || spec.avgBonusAddition != null

  const formula = `${SLOT_100_YEN_PER_50_COINS}円 ÷ ${normalCoinsPerG}G/50コイン（${normalCoinsPerGSource}）= ${coinValueYen}円/G`

  return {
    mode: isDetailed ? 'detailed' : 'simple',
    normalCoinsPerG,
    normalCoinsPerGSource,
    avgGainPerHit: avgGainPerHit != null ? Math.round(avgGainPerHit) : undefined,
    avgConsumedUntilHit: Math.round(avgConsumedUntilHit),
    firstHitDenominator,
    expectedDiffPerGame,
    coinValueYen,
    formula,
    isEstimated: true,
  }
}
