// パチスロ特化のポジネガ辞書
// スコア: +2=強ポジ, +1=ポジ, -1=ネガ, -2=強ネガ

export interface SentimentWord {
  word: string
  score: number
}

export const SENTIMENT_DICT: SentimentWord[] = [
  // 強ポジ (+2)
  { word: '神台', score: 2 }, { word: '爆発', score: 2 }, { word: '神', score: 2 },
  { word: '最高', score: 2 }, { word: '大当たり', score: 2 }, { word: '天井', score: 1 },
  { word: '設定6', score: 2 }, { word: '優秀', score: 2 }, { word: '人気', score: 1 },
  { word: '話題', score: 1 }, { word: '稼げる', score: 2 }, { word: '大量獲得', score: 2 },
  { word: '万枚', score: 2 }, { word: '千枚', score: 1 }, { word: '継続', score: 1 },
  { word: '楽しい', score: 1 }, { word: '面白い', score: 2 }, { word: '良い', score: 1 },
  { word: 'いい', score: 1 }, { word: '好き', score: 1 }, { word: '熱い', score: 1 },
  { word: '出る', score: 1 }, { word: '出た', score: 1 }, { word: '勝った', score: 2 },
  { word: '勝てる', score: 1 }, { word: '期待', score: 1 }, { word: '当たった', score: 1 },
  { word: 'ヒット', score: 1 }, { word: '満足', score: 2 }, { word: '完走', score: 2 },
  { word: '設定高い', score: 2 }, { word: '釘が良い', score: 1 }, { word: '回る', score: 1 },
  { word: '稼働', score: 1 },

  // 強ネガ (-2)
  { word: '産廃', score: -2 }, { word: 'クソ台', score: -2 }, { word: '詐欺', score: -2 },
  { word: '終わった', score: -2 }, { word: 'ゴミ', score: -2 }, { word: '最悪', score: -2 },
  { word: 'ひどい', score: -2 }, { word: '酷い', score: -2 }, { word: '撤去', score: -2 },
  { word: 'ハズレ', score: -2 }, { word: 'やばい', score: -1 },

  // ネガ (-1)
  { word: '出ない', score: -2 }, { word: 'ハマる', score: -1 }, { word: '負けた', score: -2 },
  { word: 'キツい', score: -1 }, { word: 'きつい', score: -1 }, { word: '難しい', score: -1 },
  { word: '厳しい', score: -1 }, { word: 'つまらない', score: -2 }, { word: '飽きた', score: -1 },
  { word: '飽き', score: -1 }, { word: '嫌い', score: -2 }, { word: 'しんどい', score: -1 },
  { word: '撤退', score: -1 }, { word: '辛い', score: -1 }, { word: '損', score: -1 },
  { word: '廃台', score: -2 }, { word: '不人気', score: -2 }, { word: '過疎', score: -1 },
  { word: '設定低い', score: -2 }, { word: '設定1', score: -1 }, { word: '天井遠い', score: -1 },
]

export interface SentimentResult {
  score: number           // 合計スコア
  normalizedScore: number // -1.0〜+1.0 に正規化
  positive: number        // ポジ単語数
  negative: number        // ネガ単語数
  topPositiveWords: string[]
  topNegativeWords: string[]
  /** 1〜5 の popularityScore への変換 */
  popularityScore: 1 | 2 | 3 | 4 | 5
}

export function analyzeSentiment(texts: string[]): SentimentResult {
  const posHits: Map<string, number> = new Map()
  const negHits: Map<string, number> = new Map()
  let totalScore = 0
  let posCount = 0
  let negCount = 0

  for (const text of texts) {
    for (const { word, score } of SENTIMENT_DICT) {
      const count = countOccurrences(text, word)
      if (count === 0) continue
      totalScore += score * count
      if (score > 0) {
        posCount += count
        posHits.set(word, (posHits.get(word) ?? 0) + count)
      } else {
        negCount += count
        negHits.set(word, (negHits.get(word) ?? 0) + count)
      }
    }
  }

  const total = posCount + negCount || 1
  const normalizedScore = Math.max(-1, Math.min(1, totalScore / (total * 2)))

  const topPositiveWords = [...posHits.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([w]) => w)

  const topNegativeWords = [...negHits.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([w]) => w)

  // -1〜+1 を 1〜5 にマッピング
  const popularityScore = normalizedScoreToPopularity(normalizedScore)

  return { score: totalScore, normalizedScore, positive: posCount, negative: negCount, topPositiveWords, topNegativeWords, popularityScore }
}

function countOccurrences(text: string, word: string): number {
  let count = 0
  let pos = 0
  while ((pos = text.indexOf(word, pos)) !== -1) { count++; pos++ }
  return count
}

function normalizedScoreToPopularity(n: number): 1 | 2 | 3 | 4 | 5 {
  if (n >= 0.4) return 5
  if (n >= 0.15) return 4
  if (n >= -0.15) return 3
  if (n >= -0.4) return 2
  return 1
}
