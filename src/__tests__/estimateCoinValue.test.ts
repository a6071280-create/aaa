import { describe, it, expect } from 'vitest'
import { estimateCoinValue } from '../domain/coinValue/estimateCoinValue'

// ── 公式: coinValueYen = 100 / normalCoinsPerG ───────────────────────────────
// スマスロは50コイン=100円（2円/コイン）。コイン持ちが少ない＝1Gあたりの実効コスト高

describe('estimateCoinValue 基本公式テスト', () => {
  it('normalCoinsPerG=32入力時: 100/32=3.1円/G（モンキーターンV実績値）', () => {
    const result = estimateCoinValue({ normalCoinsPerG: 32 }, 2.5, 319)
    expect(result.coinValueYen).toBe(3.1)
    expect(result.normalCoinsPerGSource).toBe('入力値')
    expect(result.isEstimated).toBe(true)
  })

  it('normalCoinsPerG=30入力時: 100/30≈3.3円/G（北斗の拳実績値）', () => {
    const result = estimateCoinValue({ normalCoinsPerG: 30 }, 4.1, 319)
    expect(result.coinValueYen).toBe(3.3)
  })

  it('normalCoinsPerG=24入力時: 100/24≈4.2円/G（かぐや様実績値）', () => {
    const result = estimateCoinValue({ normalCoinsPerG: 24 }, 9.0, 319)
    expect(result.coinValueYen).toBe(4.2)
  })

  it('normalCoinsPerG=28入力時: 100/28≈3.6円/G（ゴッドイーター実績値に近い）', () => {
    const result = estimateCoinValue({ normalCoinsPerG: 28 }, 9.0, 319)
    expect(result.coinValueYen).toBeCloseTo(3.6, 0)
  })
})

describe('estimateCoinValue 純増からの推定テスト', () => {
  it('純増2.5枚/G（バランス型）: 推定コイン単価は3.0〜3.3円の範囲', () => {
    const result = estimateCoinValue({}, 2.5, 319)
    expect(result.coinValueYen).toBeGreaterThanOrEqual(3.0)
    expect(result.coinValueYen).toBeLessThanOrEqual(3.3)
    expect(result.normalCoinsPerGSource).toContain('推定')
  })

  it('純増9.0枚/G（高純増型）: 推定コイン単価は3.7〜4.5円の範囲', () => {
    const result = estimateCoinValue({}, 9.0, 319)
    expect(result.coinValueYen).toBeGreaterThanOrEqual(3.7)
    expect(result.coinValueYen).toBeLessThanOrEqual(4.5)
  })

  it('高純増ほどコイン単価が高い（単調増加）', () => {
    const low = estimateCoinValue({}, 2.5, 319).coinValueYen
    const mid = estimateCoinValue({}, 5.0, 319).coinValueYen
    const high = estimateCoinValue({}, 9.0, 319).coinValueYen
    expect(low).toBeLessThan(mid)
    expect(mid).toBeLessThan(high)
  })

  it('デフォルト（入力なし）: 純増3.0枚/Gで標準的な値を返す', () => {
    const result = estimateCoinValue({}, 3.0, 319)
    expect(result.coinValueYen).toBeGreaterThan(2.5)
    expect(result.coinValueYen).toBeLessThan(5.0)
  })
})

describe('estimateCoinValue 平均獲得枚数テスト', () => {
  it('AT継続率指定時: avgGainPerHitが算出される', () => {
    const result = estimateCoinValue({ atContinuationRate: 50 }, 3.0, 319)
    expect(result.avgGainPerHit).toBeDefined()
    expect(result.avgGainPerHit!).toBeGreaterThan(0)
  })

  it('平均AT継続G数指定時: avgGainPerHit = pureIncrease × G数', () => {
    const result = estimateCoinValue({ avgAtContinuationGames: 400 }, 3.0, 319)
    expect(result.avgGainPerHit).toBe(1200)  // 3.0 × 400
  })

  it('avgGainPerFirstHit直接指定時: その値が使われる', () => {
    const result = estimateCoinValue({ avgGainPerFirstHit: 800 }, 3.0, 319)
    expect(result.avgGainPerHit).toBe(800)
  })

  it('avgConsumedUntilHit = firstHitDenominator × (50/normalCoinsPerG)', () => {
    const result = estimateCoinValue({ normalCoinsPerG: 32 }, 3.0, 319)
    const expected = Math.round(319 * (50 / 32))
    expect(result.avgConsumedUntilHit).toBe(expected)
  })
})

describe('estimateCoinValue mode判定テスト', () => {
  it('詳細入力なしの場合: mode=simple', () => {
    const result = estimateCoinValue({}, 3.0, 319)
    expect(result.mode).toBe('simple')
  })

  it('押し順ナビ発生率入力時: mode=detailed', () => {
    const result = estimateCoinValue({ pushOrderNaviRate: 80 }, 3.0, 319)
    expect(result.mode).toBe('detailed')
  })

  it('特化ゾーン上乗せ入力時: mode=detailed', () => {
    const result = estimateCoinValue({ avgBonusAddition: 500 }, 3.0, 319)
    expect(result.mode).toBe('detailed')
  })
})

describe('estimateCoinValue breakdown構造テスト', () => {
  it('formula フィールドが説明文字列を返す', () => {
    const result = estimateCoinValue({ normalCoinsPerG: 32 }, 2.5, 319)
    expect(result.formula).toContain('32')
    expect(result.formula).toContain('円/G')
  })

  it('isEstimated は常にtrue', () => {
    const result = estimateCoinValue({}, 3.0, 319)
    expect(result.isEstimated).toBe(true)
  })

  it('firstHitDenominator が breakdown に保持される', () => {
    const result = estimateCoinValue({}, 3.0, 500)
    expect(result.firstHitDenominator).toBe(500)
  })
})
