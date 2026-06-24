import { useRef } from 'react'
import { usePrediction } from './hooks/usePrediction'
import { useWeights, type LearningData } from './hooks/useWeights'
import { InputForm } from './ui/InputForm'
import { ResultView } from './ui/ResultView'

export default function App() {
  const {
    weights,
    feedbackHistory,
    adjustments,
    addFeedback,
    exportLearningData,
    importLearningData,
    resetLearning,
  } = useWeights()

  const { input, updateInput, result, session, runPrediction, resetAll } = usePrediction(weights)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target?.result as string) as LearningData
        importLearningData(data)
      } catch {
        alert('学習データの読み込みに失敗しました')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleFeedback = (actualWeeks: number) => {
    if (!session || !result) return
    addFeedback({
      sessionId: session.id,
      machineName: input.machineSpec.machineName,
      gameFlow: input.machineSpec.gameFlow,
      predictedWeeks: result.contributionWeeks.weeks,
      actualWeeks,
    })
  }

  return (
    <>
      <header className="app-header">
        <h1>新台仕入れ判断支援ツール</h1>
        <span className="subtitle">稼働貢献週 &amp; 推奨台数 予測</span>
        <div className="learning-controls">
          {feedbackHistory.length > 0 && (
            <span className="learning-badge">🧠 学習済 {feedbackHistory.length}件</span>
          )}
          <button className="btn-header" type="button" onClick={() => fileInputRef.current?.click()}>
            学習データ読込
          </button>
          {feedbackHistory.length > 0 && (
            <>
              <button className="btn-header" type="button" onClick={exportLearningData}>
                書き出し
              </button>
              <button className="btn-header btn-header-danger" type="button" onClick={resetLearning}>
                リセット
              </button>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImport}
          />
        </div>
      </header>
      <div className="app-body">
        <div className="pane-input">
          <InputForm
            value={input}
            onChange={updateInput}
            onPredict={runPrediction}
            onReset={resetAll}
            hasResult={result !== null}
          />
        </div>
        <div className="pane-result">
          <ResultView
            result={result}
            input={input}
            session={session}
            feedbackHistory={feedbackHistory}
            adjustments={adjustments}
            onFeedback={handleFeedback}
          />
        </div>
      </div>
    </>
  )
}
