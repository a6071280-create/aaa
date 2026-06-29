import type { EvalScore } from '../domain/types'

const YT_BASE = 'https://www.googleapis.com/youtube/v3'

export interface YoutubeSignalResult {
  score: EvalScore
  videoCount: number
  maxViews: number
  topVideoTitle: string
  memo: string
}

function calcScore(videoCount: number, maxViews: number): EvalScore {
  const v = videoCount >= 100 ? 5 : videoCount >= 30 ? 4 : videoCount >= 10 ? 3 : videoCount >= 3 ? 2 : 1
  const m = maxViews >= 500_000 ? 5 : maxViews >= 100_000 ? 4 : maxViews >= 30_000 ? 3 : maxViews >= 5_000 ? 2 : 1
  return Math.max(1, Math.min(5, Math.round((v + m) / 2))) as EvalScore
}

function fmtViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M再生`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K再生`
  return `${n}再生`
}

export async function fetchYoutubeSignal(
  machineName: string,
  apiKey: string,
): Promise<YoutubeSignalResult> {
  const q = encodeURIComponent(`${machineName} 試打`)
  const searchRes = await fetch(
    `${YT_BASE}/search?part=snippet&q=${q}&type=video&relevanceLanguage=ja&regionCode=JP&maxResults=5&order=viewCount&key=${apiKey}`,
  )
  if (!searchRes.ok) {
    const err = await searchRes.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `HTTP ${searchRes.status}`)
  }
  const searchData = await searchRes.json()

  const totalResults: number = searchData.pageInfo?.totalResults ?? 0
  const items: { id?: { videoId?: string }; snippet?: { title?: string } }[] =
    searchData.items ?? []

  if (items.length === 0) {
    return {
      score: 1,
      videoCount: 0,
      maxViews: 0,
      topVideoTitle: '',
      memo: `YouTube「${machineName} 試打」動画なし（自動取得）`,
    }
  }

  const ids = items.map(it => it.id?.videoId).filter(Boolean).join(',')
  const statsRes = await fetch(
    `${YT_BASE}/videos?part=statistics&id=${ids}&key=${apiKey}`,
  )
  if (!statsRes.ok) throw new Error(`YouTube統計取得エラー HTTP ${statsRes.status}`)
  const statsData = await statsRes.json()

  const views: number[] = (statsData.items ?? []).map(
    (it: { statistics?: { viewCount?: string } }) =>
      parseInt(it.statistics?.viewCount ?? '0', 10),
  )
  const maxViews = views.length > 0 ? Math.max(...views) : 0
  const topVideoTitle = items[0]?.snippet?.title ?? ''
  const score = calcScore(totalResults, maxViews)

  return {
    score,
    videoCount: totalResults,
    maxViews,
    topVideoTitle,
    memo: `YouTube試打動画 約${totalResults}件・最高${fmtViews(maxViews)}（自動取得）`,
  }
}
