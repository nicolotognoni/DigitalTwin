import { X, Lightbulb, Lock, Globe } from 'lucide-react'
import { GROUP_COLORS, GROUP_LABELS } from '../data/graphData'
import type { GraphNode, Mode, NodePrivacy } from '../data/graphData'

interface InsightPanelProps {
  node: GraphNode | null
  onClose: () => void
  mode: Mode
  privacy: NodePrivacy
  onTogglePrivacy: () => void
}

export function InsightPanel({ node, onClose, mode, privacy, onTogglePrivacy }: InsightPanelProps) {
  if (!node) return null

  const color = GROUP_COLORS[node.group]
  const groupLabel = GROUP_LABELS[node.group]
  const isBridge = node.owner === 'bridge'

  return (
    <div
      className="insight-panel absolute right-0 top-0 h-full w-80 flex flex-col"
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(20px)',
        borderLeft: '1px solid rgba(0,0,0,0.07)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <span className="text-xs uppercase tracking-widest font-medium" style={{ color: 'rgba(0,0,0,0.30)' }}>
          {isBridge ? 'Connessione' : 'Identity Node'}
        </span>
        <button
          onClick={onClose}
          className="transition-colors" style={{ color: 'rgba(0,0,0,0.30)' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'rgba(0,0,0,0.60)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(0,0,0,0.30)'}
        >
          <X size={16} />
        </button>
      </div>

      {/* Node title */}
      <div className="px-5 pb-5 border-b border-black/5">
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
          />
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              color,
              background: `${color}15`,
              border: `1px solid ${color}30`,
            }}
          >
            {groupLabel}
          </span>
        </div>
        <h2 className="text-lg font-semibold leading-tight" style={{ color: '#0f0f1a' }}>
          {node.label}
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 py-5 overflow-y-auto">
        {isBridge ? (
          // Bridge node: special 3-line layout
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: 'rgba(99,102,241,0.8)' }} />
                <p className="text-sm text-black/60 leading-relaxed">
                  <span className="text-black/35 text-xs block mb-0.5 uppercase tracking-widest">Federico</span>
                  {node.federicoLine}
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: 'rgba(16,185,129,0.8)' }} />
                <p className="text-sm text-black/60 leading-relaxed">
                  <span className="text-black/35 text-xs block mb-0.5 uppercase tracking-widest">Francesco</span>
                  {node.francescoLine}
                </p>
              </div>
            </div>
            <div
              className="px-4 py-3 rounded-lg"
              style={{ background: `${color}10`, border: `1px solid ${color}25` }}
            >
              <p className="text-sm font-medium leading-relaxed" style={{ color }}>
                → {node.connectionLine}
              </p>
            </div>
          </div>
        ) : (
          // Regular node: insight text
          <>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={14} className="text-black/35" />
              <span className="text-xs text-black/35 uppercase tracking-widest font-medium">
                AI Insight
              </span>
            </div>
            <p className="text-sm text-black/65 leading-relaxed italic">
              "{node.insight}"
            </p>
          </>
        )}
      </div>

      {/* Footer */}
      {!isBridge && (
        <>
          {/* Privacy toggle — only in Federico's own graph */}
          {mode === 'federico' && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-black/5">
              <div className="flex items-center gap-2.5">
                {privacy === 'private'
                  ? <Lock size={14} className="flex-shrink-0" style={{ color: 'rgba(0,0,0,0.40)' }} />
                  : <Globe size={14} className="flex-shrink-0" style={{ color: hexAlpha(color, 0.7) }} />
                }
                <div>
                  <span className="text-xs font-medium" style={{ color: privacy === 'private' ? 'rgba(0,0,0,0.55)' : hexAlpha(color, 0.8) }}>
                    {privacy === 'private' ? 'Private' : 'Public'}
                  </span>
                  <span className="block text-xs" style={{ color: 'rgba(0,0,0,0.30)' }}>
                    {privacy === 'private' ? 'Only visible to you' : 'Visible to friends'}
                  </span>
                </div>
              </div>
              {/* Toggle switch */}
              <button
                onClick={onTogglePrivacy}
                className="relative w-9 h-5 rounded-full transition-all duration-200 flex-shrink-0"
                style={{
                  background: privacy === 'private'
                    ? 'rgba(0,0,0,0.06)'
                    : hexAlpha(color, 0.15),
                  border: privacy === 'private'
                    ? '1px solid rgba(0,0,0,0.10)'
                    : `1px solid ${hexAlpha(color, 0.35)}`,
                }}
              >
                <span
                  className="absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200"
                  style={{
                    left: privacy === 'private' ? '2px' : 'calc(100% - 18px)',
                    background: privacy === 'private' ? 'rgba(0,0,0,0.25)' : color,
                    boxShadow: privacy === 'public' ? `0 0 6px ${hexAlpha(color, 0.5)}` : 'none',
                  }}
                />
              </button>
            </div>
          )}

          <div className="px-5 py-4 border-t border-black/5">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1">
                {Array.from({ length: Math.min(node.memories, 5) }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: hexAlpha(color, 0.3 + i * 0.12) }}
                  />
                ))}
              </div>
              <span className="text-xs text-black/30">
                Based on {node.memories} recorded interactions
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function hexAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}
