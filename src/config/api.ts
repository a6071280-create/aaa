// Cloudflare Worker のデプロイ後にURLを更新する
// wrangler deploy 実行後に表示されるURLを設定
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://shiire-tool-api.workers.dev'
