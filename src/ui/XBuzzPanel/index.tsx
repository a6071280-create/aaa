import { useState } from 'react'
import type { EvalScore } from '../../domain/types'
import { analyzeSentiment } from '../../domain/sentiment/slotSentiment'
import { API_BASE_URL } from '../../config/api'

interface XTweet {
  id: string
  text: string
  created_at: string
  public_metrics: { retweet_count: number; reply_count: number; like_count: number }
}

interface Props {
  machineName: string
  onPopularityChange: (score: EvalScore) => void
}

type Status = 'idle' | 'loading' | 'done' | 'error'

export function XBuzzPanel({ machineName, onPopularityChange }: Props) {
  const [aliases, setAliases] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [tweets, setTweets] = useState<XTweet[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const [sentiment, setSentiment] = useState<ReturnType<typeof analyzeSentiment> | null>(null)
  const [applied, setApplied] = useState(false)

  const handleSearch = async () => {
    if (!machineName.trim()) return
    setStatus('loading')
    setTweets([])
    setSentiment(null)
    setApplied(false)
    setErrorMsg('')

    try {
      const params = new URLSearchParams({ q: machineName, count: '50' })
      if (aliases.trim()) params.set('aliases', aliases)
      const res = await fetch(`${API_BASE_URL}/search?${params}`)
      if (!res.ok) {
        const j = await res.json() as { error?: string; detail?: string }
        throw new Error(j.detail ?? j.error ?? `HTTP ${res.status}`)
      }
      const data = await res.json() as { tweets: XTweet[] }
      setTweets(data.tweets)
      const result = analyzeSentiment(data.tweets.map(t => t.text))
      setSentiment(result)
      setStatus('done')
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e))
      setStatus('error')
    }
  }

  const handleApply = () => {
    if (!sentiment) return
    onPopularityChange(sentiment.popularityScore)
    setApplied(true)
  }

  const pct = (n: number) => {
    const total = (sentiment?.positive ?? 0) + (sentiment?.negative ?? 0)
    return total === 0 ? 0 : Math.round((n / total) * 100)
  }

  return (
    <div className="x-buzz-panel">
      <div className="section-title" style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--accent)' }}>
        X（Twitter）口コミ分析
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 120 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>機種名（自動入力）</div>
          <input
            type="text"
            value={machineName}
            readOnly
            style={{ width: '100%', background: 'var(--surface-2)', cursor: 'not-allowed', fontSize: 12 }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 120 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>略称・別名（カンマ区切り）</div>
          <input
            type="text"
            placeholder="例: 乙女,乙女5"
            value={aliases}
            onChange={e => setAliases(e.target.value)}
            style={{ width: '100%', fontSize: 12 }}
          />
        </div>
      </div>

      <button
        type="button"
        className="btn btn-sm"
        disabled={status === 'loading' || !machineName.trim()}
        onClick={handleSearch}
        style={{ marginBottom: 10 }}
      >
        {status === 'loading' ? '検索中…' : 'X で検索・分析'}
      </button>

      {status === 'error' && (
        <div className="warning-box" style={{ marginBottom: 8 }}>
          ⚠ {errorMsg}
        </div>
      )}

      {status === 'done' && sentiment && (
        <>
          {/* サマリーカード */}
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px', marginBottom: 10 }}>
            <div style={{ fontSize: 12, marginBottom: 6 }}>
              <strong>取得ツイート数: {tweets.length}件</strong>
              　ポジ: {sentiment.positive}件 / ネガ: {sentiment.negative}件
            </div>

            {/* ポジネガバー */}
            <div style={{ display: 'flex', height: 12, borderRadius: 4, overflow: 'hidden', marginBottom: 8, background: 'var(--border)' }}>
              <div style={{ width: `${pct(sentiment.positive)}%`, background: '#4caf50' }} />
              <div style={{ width: `${pct(sentiment.negative)}%`, background: '#f44336' }} />
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: 11, marginBottom: 8 }}>
              <span style={{ color: '#4caf50' }}>■ ポジ {pct(sentiment.positive)}%</span>
              <span style={{ color: '#f44336' }}>■ ネガ {pct(sentiment.negative)}%</span>
            </div>

            {sentiment.topPositiveWords.length > 0 && (
              <div style={{ fontSize: 11, marginBottom: 4 }}>
                <span style={{ color: '#4caf50' }}>よく出たポジ語:</span>{' '}
                {sentiment.topPositiveWords.join('・')}
              </div>
            )}
            {sentiment.topNegativeWords.length > 0 && (
              <div style={{ fontSize: 11, marginBottom: 8 }}>
                <span style={{ color: '#f44336' }}>よく出たネガ語:</span>{' '}
                {sentiment.topNegativeWords.join('・')}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 12 }}>
                推定 大衆期待度: <strong>{sentiment.popularityScore}</strong>/5
              </div>
              <button
                type="button"
                className="btn btn-sm"
                onClick={handleApply}
                disabled={applied}
                style={{ fontSize: 11 }}
              >
                {applied ? '✓ 反映済み' : '予測フォームに反映'}
              </button>
            </div>
          </div>

          {/* ツイート一覧（最新5件） */}
          <details style={{ fontSize: 11 }}>
            <summary style={{ cursor: 'pointer', color: 'var(--text-muted)', marginBottom: 4 }}>
              ツイート一覧（{tweets.length}件）
            </summary>
            <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
              {tweets.slice(0, 20).map(t => (
                <div key={t.id} style={{ padding: '4px 6px', background: 'var(--surface-2)', borderRadius: 4, fontSize: 11, lineHeight: 1.4 }}>
                  <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>
                    ❤ {t.public_metrics.like_count}　RT {t.public_metrics.retweet_count}
                  </div>
                  {t.text}
                </div>
              ))}
            </div>
          </details>
        </>
      )}
    </div>
  )
}
