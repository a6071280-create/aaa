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

interface ValidationError {
  field: string
  message: string
}

function validate(input: PredictionInput): ValidationError[] {
  const errors: ValidationError[] = []
  const { machineSpec, storeConstraints } = input

  if (!machineSpec.machineName.trim()) {
    errors.push({ field: 'machineName', message: '機種名を入力してください' })
  }
  if (machineSpec.firstHitDenominator <= 0) {
    errors.push({ field: 'firstHit', message: '初当り確率の分母は1以上にしてください' })
  }
  if (storeConstraints.machinePrice <= 0) {
    errors.push({ field: 'machinePrice', message: '機械代を入力してください' })
  }
  if (storeConstraints.availableSlots <= 0) {
    errors.push({ field: 'availableSlots', message: '島の空き台数を1台以上にしてください' })
  }
  if (storeConstraints.newMachineBudget <= 0) {
    errors.push({ field: 'budget', message: '予算上限を入力してください' })
  }
  if (storeConstraints.avgDailyMachineMarginYen <= 0) {
    errors.push({ field: 'margin', message: '予想台粗利を入力してください' })
  }
  if (storeConstraints.targetRecoveryWeeks <= 0) {
    errors.push({ field: 'target', message: '目標回収期間を1週以上にしてください' })
  }

  return errors
}

export function InputForm({ value, onChange, onPredict, onReset, hasResult }: Props) {
  const errors = validate(value)
  const canPredict = errors.length === 0

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
          machineName={value.machineSpec.machineName}
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
        {errors.length > 0 && (
          <span style={{ fontSize: 11, color: 'var(--danger)' }}>
            {errors[0].message}
          </span>
        )}
      </div>
    </div>
  )
}
