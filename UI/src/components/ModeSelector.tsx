import type { Mode } from '../data/graphData'

interface ModeSelectorProps {
  mode: Mode
  onChange: (mode: Mode) => void
}

const MODES: { value: Mode; label: string }[] = [
  { value: 'federico', label: 'Federico' },
  { value: 'francesco', label: 'Francesco' },
  { value: 'compare', label: 'Compare' },
]

export function ModeSelector({ mode, onChange }: ModeSelectorProps) {
  return (
    <div className="flex items-center gap-1">
      {MODES.map((m) => {
        const isActive = mode === m.value
        return (
          <button
            key={m.value}
            onClick={() => onChange(m.value)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all duration-200"
            style={{
              background: isActive ? 'rgba(0,0,0,0.06)' : 'transparent',
              color: isActive ? 'rgba(0,0,0,0.80)' : 'rgba(0,0,0,0.35)',
              border: isActive ? '1px solid rgba(0,0,0,0.10)' : '1px solid transparent',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full transition-all duration-200"
              style={{
                backgroundColor: isActive ? '#0f0f1a' : 'rgba(0,0,0,0.2)',
                boxShadow: isActive ? '0 0 4px rgba(0,0,0,0.3)' : 'none',
              }}
            />
            {m.value === 'compare' && isActive ? '⟷ Compare' : m.label}
          </button>
        )
      })}
    </div>
  )
}
