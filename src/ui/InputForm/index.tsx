import type { PredictionInput } from '../../domain/types'
import { MachineSpecSection } from './MachineSpecSection'
import { MarketSignalSection } from './MarketSignalSection'
import { ManagerEvalSection } from './ManagerEvalSection'
import { StoreConstraintSection } from './StoreConstraintSection'

interface Props {
  value: PredictionInput
  onChange: (v: PredictionInput) => void
  onPredict: () => void
  onReset: () => void
  hasResult: boolean
}

export function InputForm({ value, onChange, onPredict, onReset, hasResult }: Props) {
  const canPredict = value.machineSpec.machineName.trim().length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <MachineSpecSection
          value={value.machineSpec}
          onChange={machineSpec => onChange({ ...value, machineSpec })}
        />
        <MarketSignalSection
          value={value.marketSignal}
          onChange={marketSignal => onChange({ ...value, marketSignal })}
        />
        <ManagerEvalSection
          value={value.managerEval}
          onChange={managerEval => onChange({ ...value, managerEval })}
        />
        <StoreConstraintSection
          value={value.storeConstraints}
          onChange={storeConstraints => onChange({ ...value, storeConstraints })}
        />
      </div>

      <div className="action-bar">
        <button
          className="btn btn-primary"
          type="button"
          onClick={onPredict}
          disabled={!canPredict}
          style={{ opacity: canPredict ? 1 : 0.5, cursor: canPredict ? 'pointer' : 'not-allowed' }}
        >
          予測を実行
        </button>
        {hasResult && (
          <button className="btn btn-secondary" type="button" onClick={onReset}>
            リセット
          </button>
        )}
        {!canPredict && (
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>機種名を入力してください</span>
        )}
      </div>
    </div>
  )
}
