import { Eye, EyeOff, Info, LayoutList, Network } from 'lucide-react'
import { ModeSelector } from './ModeSelector'
import type { Mode } from '../data/graphData'

type AppView = 'twin' | 'plans'

interface HeaderProps {
  view: AppView
  onViewChange: (v: AppView) => void
  mode: Mode
  onModeChange: (mode: Mode) => void
  friendPreview: boolean
  onFriendPreviewChange: (v: boolean) => void
}

export function Header({ view, onViewChange, mode, onModeChange, friendPreview, onFriendPreviewChange }: HeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-black/5" style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)' }}>
      {/* Left: brand + view switcher */}
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-xs font-medium tracking-widest uppercase" style={{ color: 'rgba(0,0,0,0.45)' }}>
          Digital Twin
        </span>
        <div className="flex items-center gap-1 ml-1">
          <ViewTab
            active={view === 'twin'}
            icon={<Network size={11} />}
            label="Graph"
            onClick={() => onViewChange('twin')}
          />
          <ViewTab
            active={view === 'plans'}
            icon={<LayoutList size={11} />}
            label="Plans"
            onClick={() => onViewChange('plans')}
          />
        </div>
      </div>

      {/* Center: mode selector (only in twin view) */}
      {view === 'twin' && <ModeSelector mode={mode} onChange={onModeChange} />}

      {/* Right: contextual controls */}
      <div className="flex items-center gap-3">
        {view === 'twin' && mode === 'federico' && (
          <button
            onClick={() => onFriendPreviewChange(!friendPreview)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200"
            style={{
              background: friendPreview ? 'rgba(251,191,36,0.12)' : 'rgba(0,0,0,0.04)',
              border: friendPreview ? '1px solid rgba(251,191,36,0.35)' : '1px solid rgba(0,0,0,0.08)',
              color: friendPreview ? '#B45309' : 'rgba(0,0,0,0.35)',
            }}
          >
            {friendPreview ? <Eye size={12} /> : <EyeOff size={12} />}
            Friend Preview
          </button>
        )}
        <div className="flex items-center gap-2">
          <Info size={12} style={{ color: 'rgba(0,0,0,0.25)' }} />
          <span className="text-xs italic" style={{ color: 'rgba(0,0,0,0.30)' }}>
            {view === 'plans' ? 'Collaborative plans with AI agents' : 'This model is generated from your past interactions'}
          </span>
        </div>
      </div>
    </div>
  )
}

function ViewTab({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200"
      style={{
        background: active ? 'rgba(139,92,246,0.10)' : 'transparent',
        border: active ? '1px solid rgba(139,92,246,0.22)' : '1px solid transparent',
        color: active ? '#7C3AED' : 'rgba(0,0,0,0.40)',
      }}
    >
      {icon}
      {label}
    </button>
  )
}
