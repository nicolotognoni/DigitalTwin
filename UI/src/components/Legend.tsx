import { GROUP_COLORS, GROUP_LABELS } from '../data/graphData'
import type { NodeGroup, Mode } from '../data/graphData'

interface LegendProps {
  mode: Mode
  friendPreview?: boolean
}

export function Legend({ mode, friendPreview }: LegendProps) {
  if (mode === 'compare') {
    return (
      <div
        className="absolute bottom-6 left-6 flex flex-col gap-1.5 p-3 rounded-lg"
        style={{
          background: 'rgba(10, 10, 20, 0.7)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: 'rgba(99,102,241,0.8)' }} />
          <span className="text-xs" style={{ color: 'rgba(0,0,0,0.45)' }}>Federico</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: 'rgba(16,185,129,0.8)' }} />
          <span className="text-xs" style={{ color: 'rgba(0,0,0,0.45)' }}>Francesco</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#EC4899', boxShadow: '0 0 4px #EC489980' }} />
          <span className="text-xs" style={{ color: 'rgba(0,0,0,0.45)' }}>Connessione</span>
        </div>
      </div>
    )
  }

  const groups = (Object.keys(GROUP_COLORS) as NodeGroup[]).filter(
    (g) => g !== 'self' && g !== 'bridge'
  )

  return (
    <div
      className="absolute bottom-6 left-6 flex flex-col gap-1.5 p-3 rounded-lg"
      style={{
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(0,0,0,0.07)',
      }}
    >
      {groups.map((group) => (
        <div key={group} className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{
              backgroundColor: GROUP_COLORS[group],
              boxShadow: `0 0 4px ${GROUP_COLORS[group]}80`,
            }}
          />
          <span className="text-xs" style={{ color: 'rgba(0,0,0,0.45)' }}>{GROUP_LABELS[group]}</span>
        </div>
      ))}
      {/* Private node indicator — only in Federico's view */}
      {mode === 'federico' && (
        <div className="flex items-center gap-2 mt-0.5 pt-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{
              background: 'transparent',
              border: '1px dashed rgba(0,0,0,0.25)',
            }}
          />
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
            {friendPreview ? 'Hidden node' : 'Private node'}
          </span>
        </div>
      )}
    </div>
  )
}
