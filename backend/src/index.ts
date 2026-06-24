export interface Env {
  X_BEARER_TOKEN: string
}

const ALLOWED_ORIGINS = [
  'https://a6071280-create.github.io',
  'http://localhost:5173',
  'http://localhost:4173',
]

function corsHeaders(origin: string | null): Record<string, string> {
  const allow = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

export interface XTweet {
  id: string
  text: string
  created_at: string
  public_metrics: {
    retweet_count: number
    reply_count: number
    like_count: number
  }
}

export interface SearchResponse {
  tweets: XTweet[]
  meta: { total_count: number; newest_id?: string }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin')
    const cors = corsHeaders(origin)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors })
    }

    const url = new URL(request.url)
    if (url.pathname !== '/search') {
      return new Response('Not Found', { status: 404, headers: cors })
    }

    const q = url.searchParams.get('q')?.trim()
    if (!q) {
      return new Response(JSON.stringify({ error: 'query required' }), {
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    const aliases = url.searchParams.get('aliases')?.trim()
    const count = Math.min(parseInt(url.searchParams.get('count') ?? '50'), 100)

    // クエリ構築: 機種名 OR 略称 でスロット関連ツイートを検索
    const terms = [q, ...(aliases ? aliases.split(',').map(s => s.trim()).filter(Boolean) : [])]
    const queryTerms = terms.map(t => `"${t}"`).join(' OR ')
    const query = `(${queryTerms}) (スロット OR パチスロ OR 設定 OR 出玉 OR AT OR ボーナス) lang:ja -is:retweet`

    const xUrl = new URL('https://api.twitter.com/2/tweets/search/recent')
    xUrl.searchParams.set('query', query)
    xUrl.searchParams.set('max_results', String(count))
    xUrl.searchParams.set('tweet.fields', 'created_at,public_metrics,text')

    const xResp = await fetch(xUrl.toString(), {
      headers: { Authorization: `Bearer ${env.X_BEARER_TOKEN}` },
    })

    if (!xResp.ok) {
      const errText = await xResp.text()
      return new Response(JSON.stringify({ error: 'X API error', detail: errText }), {
        status: xResp.status, headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    const data = await xResp.json() as { data?: XTweet[]; meta?: Record<string, unknown> }
    const result: SearchResponse = {
      tweets: data.data ?? [],
      meta: { total_count: (data.data ?? []).length },
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  },
}
