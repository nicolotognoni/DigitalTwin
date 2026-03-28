import type { SummaryItem } from '../../data/dashboardData'

interface Props {
  items: SummaryItem[]
  onFocusNode: (nodeId: string) => void
}

export function IdentitySummary({ items, onFocusNode }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-xs uppercase tracking-widest font-medium" style={{ color: 'rgba(0,0,0,0.35)' }}>Identity Summary</span>
      </div>
      {items.map((item, i) => (
        <button
          key={i}
          onClick={() => onFocusNode(item.nodeId)}
          className="text-left px-3 py-2.5 rounded-lg transition-all duration-150 group"
          style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.07)'
            ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,0.10)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.03)'
            ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,0.05)'
          }}
        >
          <p className="text-xs leading-relaxed transition-colors" style={{ color: 'rgba(0,0,0,0.55)' }}>
            {item.text}
          </p>
        </button>
      ))}
    </div>
  )
}
