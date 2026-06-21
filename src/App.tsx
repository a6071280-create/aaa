import { usePrediction } from './hooks/usePrediction'
import { InputForm } from './ui/InputForm'
import { ResultView } from './ui/ResultView'

export default function App() {
  const { input, updateInput, result, session, runPrediction, resetAll } = usePrediction()

  return (
    <>
      <header className="app-header">
        <h1>新台仕入れ判断支援ツール</h1>
        <span className="subtitle">稼働貢献週 &amp; 推奨台数 予測</span>
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
          <ResultView result={result} input={input} session={session} />
        </div>
      </div>
    </>
  )
}
