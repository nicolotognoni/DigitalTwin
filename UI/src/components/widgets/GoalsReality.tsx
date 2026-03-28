import type { GoalRow } from '../../data/dashboardData'

interface Props {
  rows: GoalRow[]
  onFocusNode: (nodeId: string) => void
}

const ALIGNMENT_CONFIG = {
  yes: { label: 'Aligned', color: '#10B981' },
  moving: { label: 'Moving', color: '#3B82F6' },
  partial: { label: 'Partial', color: '#F59E0B' },
  slow: { label: 'Slow', color: '#EF4444' },
}

export function GoalsReality({ rows, onFocusNode }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-widest font-medium mb-2" style={{ color: 'rgba(0,0,0,0.35)' }}>Goals vs Reality</span>
      {rows.map((row, i) => {
        const cfg = ALIGNMENT_CONFIG[row.alignment]
        return (
          <button
            key={i}
            onClick={() => onFocusNode(row.nodeId)}
            className="text-left px-3 py-2 rounded-lg transition-all duration-150"
            style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.07)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.03)'
            }}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-medium" style={{ color: 'rgba(0,0,0,0.70)' }}>{row.goal}</span>
              <span
                className="text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
                style={{ color: cfg.color, background: `${cfg.color}18`, fontSize: '10px' }}
              >
                {cfg.label}
              </span>
            </div>
            <p className="text-xs leading-tight" style={{ color: 'rgba(0,0,0,0.40)' }}>{row.behavior}</p>
          </button>
        )
      })}
    </div>
  )
}
