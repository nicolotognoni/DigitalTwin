import { Plus, Clock } from 'lucide-react'
import type { Plan, PlanStatus } from '../../data/plansData'

const STATUS_CONFIG: Record<PlanStatus, { label: string; bg: string; color: string }> = {
  draft:     { label: 'Draft',     bg: 'rgba(0,0,0,0.06)',        color: 'rgba(0,0,0,0.45)'  },
  ready:     { label: 'Ready',     bg: 'rgba(245,158,11,0.12)',   color: '#B45309'            },
  confirmed: { label: 'Confirmed', bg: 'rgba(16,185,129,0.12)',   color: '#047857'            },
}

interface Props {
  plans: Plan[]
  selectedId: string | null
  onSelect: (plan: Plan) => void
  onNew: () => void
}

export function PlanList({ plans, selectedId, onSelect, onNew }: Props) {
  return (
    <div
      className="flex flex-col h-full flex-shrink-0"
      style={{
        width: '280px',
        borderRight: '1px solid rgba(0,0,0,0.07)',
        background: 'rgba(255,255,255,0.6)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <span className="text-xs uppercase tracking-widest font-medium" style={{ color: 'rgba(0,0,0,0.35)' }}>
          Your Plans
        </span>
        <button
          onClick={onNew}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150"
          style={{
            background: 'rgba(139,92,246,0.08)',
            border: '1px solid rgba(139,92,246,0.18)',
            color: '#7C3AED',
          }}
        >
          <Plus size={11} />
          New
        </button>
      </div>

      {/* Plan cards */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 flex flex-col gap-2">
        {plans.map((plan) => {
          const isActive = plan.id === selectedId
          const status = STATUS_CONFIG[plan.status]
          return (
            <button
              key={plan.id}
              onClick={() => onSelect(plan)}
              className="text-left rounded-2xl p-4 transition-all duration-200"
              style={{
                background: isActive ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.02)',
                border: '1px solid transparent',
                boxShadow: isActive
                  ? '0 0 0 1.5px rgba(139,92,246,0.40), 0 4px 20px rgba(139,92,246,0.08)'
                  : '0 0 0 1px rgba(0,0,0,0.07)',
              }}
            >
              {/* Emoji + title row */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg leading-none">{plan.emoji}</span>
                  <span
                    className="text-sm font-semibold leading-tight"
                    style={{ color: isActive ? '#0f0f1a' : 'rgba(0,0,0,0.70)' }}
                  >
                    {plan.title}
                  </span>
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                  style={{ background: status.bg, color: status.color, fontSize: '10px' }}
                >
                  {status.label}
                </span>
              </div>

              {/* Timestamp */}
              <div className="flex items-center gap-1.5">
                <Clock size={10} style={{ color: 'rgba(0,0,0,0.28)' }} />
                <span className="text-xs" style={{ color: 'rgba(0,0,0,0.30)', fontSize: '11px' }}>
                  {plan.updatedAt}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
