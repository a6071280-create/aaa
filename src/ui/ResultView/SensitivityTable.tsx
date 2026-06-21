import type { SensitivityRow, UnitConstraintDetail } from '../../domain/types'

interface Props {
  rows: SensitivityRow[]
  constraintDetail: UnitConstraintDetail
  machineName: string
}

export function SensitivityTable({ rows, constraintDetail, machineName }: Props) {
  const { roiMaxUnits, budgetMaxUnits, slotMaxUnits, demandMaxUnits, bindingConstraint, recoveryWeeksNeeded } = constraintDetail

  const bindingLabel: Record<UnitConstraintDetail['bindingConstraint'], string> = {
    roi: 'ROI制約',
    budget: '予算上限',
    slot: '島の空き',
    demand: '需要上限',
  }

  return (
    <div className="result-card">
      <div className="result-card-title">
        <span>推奨台数 制約内訳</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>
          {machineName} / 回収目安 {Math.ceil(recoveryWeeksNeeded)}週
        </span>
      </div>

      <div className="constraint-grid" style={{ marginBottom: 14 }}>
        {(
          [
            { key: 'roi', label: 'ROI上限', value: roiMaxUnits === Infinity ? '∞' : roiMaxUnits },
            { key: 'budget', label: '予算上限', value: budgetMaxUnits },
            { key: 'demand', label: '需要上限', value: demandMaxUnits },
            { key: 'slot', label: '島の空き', value: slotMaxUnits },
          ] as const
        ).map(({ key, label, value }) => (
          <div key={key} className={`constraint-cell${bindingConstraint === key ? ' binding' : ''}`}>
            <div className="constraint-cell-label">{label}</div>
            <div className="constraint-cell-value">{value}</div>
            <div className="constraint-cell-unit">台</div>
            {bindingConstraint === key && (
              <div><span className="binding-badge">制約元</span></div>
            )}
          </div>
        ))}
      </div>

      <div className="result-card-title" style={{ marginTop: 8 }}>
        <span>ROI感度表（目標回収週 ±2週）</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>
          制約元: {bindingLabel[bindingConstraint]}
        </span>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>目標回収期間</th>
            <th>ROI判定</th>
            <th>ROI上限台数</th>
            <th>推奨台数</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.targetRecoveryWeeks} className={row.isCurrentSetting ? 'current-row' : ''}>
              <td>{row.targetRecoveryWeeks}週{row.isCurrentSetting ? ' ◀現在' : ''}</td>
              <td className={row.roiPasses ? 'roi-pass' : 'roi-fail'}>
                {row.roiPasses ? '✓ 成立' : '✗ 不成立'}
              </td>
              <td>{row.roiMaxUnits === 0 ? <span className="roi-fail">0（警告）</span> : row.roiMaxUnits}</td>
              <td style={{ fontWeight: row.isCurrentSetting ? 700 : 400 }}>{row.recommendedUnits}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
