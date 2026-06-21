import type { PredictionSession } from '../domain/types'
import { exportJSON, exportCSV } from '../utils/export'

interface Props {
  session: PredictionSession
}

export function ExportButton({ session }: Props) {
  return (
    <>
      <button
        className="btn btn-secondary btn-sm"
        type="button"
        onClick={() => exportJSON(session)}
      >
        JSON で保存
      </button>
      <button
        className="btn btn-secondary btn-sm"
        type="button"
        onClick={() => exportCSV(session)}
      >
        CSV で保存
      </button>
    </>
  )
}
