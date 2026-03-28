import { History } from 'lucide-react'
import type { PlanChange } from '../../data/plansData'

const ACTION_LABELS: Record<string, string> = {
  change_time:     'changed time to',
  change_activity: 'suggested',
  change_date:     'changed date to',
  add_participant: 'added',
  suggest:         'suggested',
}

interface Props {
  changes: PlanChange[]
}

export function ChangeLog({ changes }: Props) {
  if (changes.length === 0) return null

  return (
    <div
      className="rounded-2xl px-5 py-4"
      style={{
        background: 'rgba(255,255,255,0.92)',
        border: '1px solid rgba(0,0,0,0.07)',
        boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <History size={14} style={{ color: 'rgba(0,0,0,0.35)' }} />
        <span className="text-xs uppercase tracking-widest font-medium" style={{ color: 'rgba(0,0,0,0.35)' }}>
          Changes
        </span>
        <span
          className="text-xs px-1.5 py-0.5 rounded-full font-medium"
          style={{ background: 'rgba(0,0,0,0.06)', color: 'rgba(0,0,0,0.45)', fontSize: '10px' }}
        >
          {changes.length}
        </span>
      </div>

      {/* Timeline */}
      <div className="flex flex-col">
        {changes.map((change, i) => {
          const isLast = i === changes.length - 1
          const actionLabel = ACTION_LABELS[change.action] ?? 'updated'
          return (
            <div key={change.id} className="flex gap-3">
              {/* Dot + line */}
              <div className="flex flex-col items-center flex-shrink-0 w-4">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                  style={{
                    backgroundColor: change.agentColor,
                    boxShadow: `0 0 6px ${change.agentColor}60`,
                  }}
                />
                {!isLast && (
                  <div
                    className="w-px flex-1 my-1"
                    style={{ background: 'rgba(0,0,0,0.08)', minHeight: '20px' }}
                  />
                )}
              </div>

              {/* Content */}
              <div className="pb-4 flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2 mb-0.5">
                  <p className="text-xs font-medium" style={{ color: '#0f0f1a' }}>
                    <span style={{ color: change.agentColor }}>{change.agentEmoji} {change.agentLabel}</span>
                    {' '}→{' '}{actionLabel}{' '}
                    <span className="font-semibold">{change.value}</span>
                  </p>
                  <span className="text-xs flex-shrink-0" style={{ color: 'rgba(0,0,0,0.28)', fontSize: '10px' }}>
                    {change.timestamp}
                  </span>
                </div>
                <p className="text-xs italic" style={{ color: 'rgba(0,0,0,0.45)' }}>
                  "{change.reason}"
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
