import { useState } from 'react'
import { ChevronDown, ChevronUp, Plus, Minus, Sparkles, Users, Briefcase } from 'lucide-react'
import { ALL_AGENTS, AGENT_SUGGESTIONS } from '../../data/plansData'
import type { Agent } from '../../data/plansData'

function getSuggestions(query: string): Agent[] {
  if (!query) return []
  const lower = query.toLowerCase()
  for (const [keyword, ids] of Object.entries(AGENT_SUGGESTIONS)) {
    if (lower.includes(keyword)) {
      return ALL_AGENTS.filter(a => ids.includes(a.id))
    }
  }
  return []
}

interface Props {
  activeAgents: string[]
  onToggle: (agentId: string) => void
  query?: string
}

export function AgentSelector({ activeAgents, onToggle, query = '' }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  const suggested = getSuggestions(query)
  const twins = ALL_AGENTS.filter(a => a.type === 'twin')
  const specialists = ALL_AGENTS.filter(a => a.type === 'planner' || a.type === 'specialist')
  const activeList = ALL_AGENTS.filter(a => activeAgents.includes(a.id))

  return (
    <div
      className="flex-shrink-0 border-b"
      style={{ borderColor: 'rgba(0,0,0,0.07)', background: 'rgba(255,255,255,0.7)' }}
    >
      {/* Top row: title + collapse */}
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-widest font-medium" style={{ color: 'rgba(0,0,0,0.35)' }}>
            Your Team
          </span>
          {/* Active team pills */}
          <div className="flex items-center gap-1 ml-1">
            {activeList.map(a => (
              <span
                key={a.id}
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: `${a.color}15`, color: a.color, border: `1px solid ${a.color}30` }}
              >
                {a.emoji} {a.label}
              </span>
            ))}
          </div>
        </div>
        <button
          onClick={() => setCollapsed(v => !v)}
          style={{ color: 'rgba(0,0,0,0.35)' }}
        >
          {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>

      {!collapsed && (
        <div className="px-6 pb-4 flex flex-col gap-4">
          {/* Suggested section */}
          {suggested.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles size={11} style={{ color: '#B45309' }} />
                <span className="text-xs font-medium" style={{ color: '#B45309' }}>
                  Suggested for this task
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {suggested.map(agent => (
                  <AgentChip
                    key={agent.id}
                    agent={agent}
                    active={activeAgents.includes(agent.id)}
                    onToggle={() => onToggle(agent.id)}
                    highlight
                  />
                ))}
              </div>
            </div>
          )}

          {/* Twins section */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Users size={11} style={{ color: 'rgba(0,0,0,0.35)' }} />
              <span className="text-xs font-medium" style={{ color: 'rgba(0,0,0,0.40)' }}>Twins</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {twins.map(agent => (
                <AgentChip
                  key={agent.id}
                  agent={agent}
                  active={activeAgents.includes(agent.id)}
                  onToggle={() => onToggle(agent.id)}
                />
              ))}
            </div>
          </div>

          {/* Specialists section */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Briefcase size={11} style={{ color: 'rgba(0,0,0,0.35)' }} />
              <span className="text-xs font-medium" style={{ color: 'rgba(0,0,0,0.40)' }}>Specialists</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {specialists.map(agent => (
                <AgentChip
                  key={agent.id}
                  agent={agent}
                  active={activeAgents.includes(agent.id)}
                  onToggle={() => onToggle(agent.id)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface AgentChipProps {
  agent: Agent
  active: boolean
  onToggle: () => void
  highlight?: boolean
}

function AgentChip({ agent, active, onToggle, highlight }: AgentChipProps) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150"
      style={{
        background: active
          ? `${agent.color}18`
          : highlight
            ? 'rgba(245,158,11,0.06)'
            : 'rgba(0,0,0,0.04)',
        border: active
          ? `1px solid ${agent.color}35`
          : highlight
            ? '1px solid rgba(245,158,11,0.25)'
            : '1px solid rgba(0,0,0,0.08)',
        color: active ? agent.color : 'rgba(0,0,0,0.50)',
      }}
    >
      <span>{agent.emoji}</span>
      <span>{agent.label}</span>
      {active
        ? <Minus size={10} style={{ color: agent.color }} />
        : <Plus size={10} style={{ color: 'rgba(0,0,0,0.35)' }} />
      }
    </button>
  )
}
