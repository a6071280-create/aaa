import type { ReferenceMachine, ContributionWeeksPrediction } from '../../domain/types'

interface Props {
  references: ReferenceMachine[]
  prediction: ContributionWeeksPrediction
  machineName: string
}

export function ReferenceMachineTable({ references, prediction, machineName }: Props) {
  if (references.length === 0) return null

  return (
    <div className="result-card">
      <div className="result-card-title">
        <span>類似台との比較</span>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>機種名</th>
            <th>コイン単価</th>
            <th>純増（下位/上位）</th>
            <th>実績稼働貢献週</th>
          </tr>
        </thead>
        <tbody>
          {references.map(r => (
            <tr key={r.id}>
              <td>{r.machineName}</td>
              <td>{r.coinUnitYen > 0 ? `${r.coinUnitYen}円` : '-'}</td>
              <td>
                {r.pureIncrease
                  ? `${r.pureIncrease.lower}${r.pureIncrease.upper ? `/${r.pureIncrease.upper}` : ''}枚/G`
                  : '-'}
              </td>
              <td>{r.actualContributionWeeks}週</td>
            </tr>
          ))}
          <tr style={{ background: '#e0f0ff', fontWeight: 700 }}>
            <td>【予測】{machineName}</td>
            <td>—</td>
            <td>—</td>
            <td style={{ color: 'var(--primary-light)' }}>{prediction.weeks}週（予測）</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
