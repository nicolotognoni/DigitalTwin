import type { Mode } from '../data/graphData'
import {
  federicoSummary, federicoGoals, federicoTrajectory,
  francescoSummary, francescoGoals,
} from '../data/dashboardData'
import { IdentitySummary } from './widgets/IdentitySummary'
import { GoalsReality } from './widgets/GoalsReality'
import { Trajectory } from './widgets/Trajectory'
import { AskTwin } from './widgets/AskTwin'

interface Props {
  mode: Mode
  onFocusNode: (nodeId: string) => void
}

function Divider() {
  return <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)', margin: '4px 0' }} />
}

export function Sidebar({ mode, onFocusNode }: Props) {
  return (
    <div
      className="flex flex-col h-full overflow-y-auto flex-shrink-0"
      style={{
        width: '260px',
        background: 'rgba(255,255,255,0.75)',
        borderRight: '1px solid rgba(0,0,0,0.06)',
        padding: '16px 12px',
        gap: '16px',
      }}
    >
      {mode === 'federico' && (
        <>
          <IdentitySummary items={federicoSummary} onFocusNode={onFocusNode} />
          <Divider />
          <GoalsReality rows={federicoGoals} onFocusNode={onFocusNode} />
          <Divider />
          <Trajectory steps={federicoTrajectory} onFocusNode={onFocusNode} />
          <Divider />
          <AskTwin onFocusNode={onFocusNode} />
        </>
      )}

      {mode === 'francesco' && (
        <>
          <IdentitySummary items={francescoSummary} onFocusNode={onFocusNode} />
          <Divider />
          <GoalsReality rows={francescoGoals} onFocusNode={onFocusNode} />
        </>
      )}

      {mode === 'compare' && (
        <div className="flex flex-col gap-3">
          <span className="text-xs uppercase tracking-widest font-medium" style={{ color: 'rgba(0,0,0,0.35)' }}>Connections</span>
          {[
            { id: 'bridge-builders', label: 'You both build from zero' },
            { id: 'bridge-natives', label: 'Tech is your shared language' },
            { id: 'bridge-friction', label: 'Both fighting the wrong battle' },
            { id: 'bridge-drive', label: 'Different stars, same hunger' },
            { id: 'bridge-circle', label: 'Same world, different cities' },
          ].map(bridge => (
            <button
              key={bridge.id}
              onClick={() => onFocusNode(bridge.id)}
              className="text-left px-3 py-2.5 rounded-lg transition-all duration-150"
              style={{ background: 'rgba(236,72,153,0.05)', border: '1px solid rgba(236,72,153,0.12)' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(236,72,153,0.1)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(236,72,153,0.05)'
              }}
            >
              <p className="text-xs" style={{ color: 'rgba(236,72,153,0.8)' }}>{bridge.label}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
