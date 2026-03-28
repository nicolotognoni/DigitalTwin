import { useState } from 'react'
import { MapPin, Calendar, Clock, Users, Pencil, UserPlus, HelpCircle, Check, X } from 'lucide-react'
import type { Plan, PlanChange, PlanStatus } from '../../data/plansData'

const STATUS_CONFIG: Record<PlanStatus, { label: string; bg: string; color: string }> = {
  draft:     { label: 'Draft',     bg: 'rgba(0,0,0,0.06)',        color: 'rgba(0,0,0,0.45)'  },
  ready:     { label: 'Ready',     bg: 'rgba(245,158,11,0.12)',   color: '#B45309'            },
  confirmed: { label: 'Confirmed', bg: 'rgba(16,185,129,0.12)',   color: '#047857'            },
}

type EditField = 'activity' | 'time' | 'date' | 'participant' | null

interface Props {
  plan: Plan
  onUpdate: (updated: Plan, change: PlanChange) => void
  onScrollToLog: () => void
}

export function PlanCard({ plan, onUpdate, onScrollToLog }: Props) {
  const [editField, setEditField] = useState<EditField>(null)
  const [editValue, setEditValue] = useState('')
  const status = STATUS_CONFIG[plan.status]

  const commit = (field: EditField) => {
    if (!field || !editValue.trim()) {
      setEditField(null)
      return
    }
    const now = 'just now'
    const change: PlanChange = {
      id: `c${Date.now()}`,
      agentId: 'federico_twin',
      agentLabel: 'Federico Twin',
      agentEmoji: '🧠',
      agentColor: '#8B5CF6',
      action: field === 'participant' ? 'add_participant' : `change_${field}` as PlanChange['action'],
      value: editValue.trim(),
      reason: 'Manual edit',
      timestamp: now,
    }
    const updated: Plan = {
      ...plan,
      updatedAt: now,
      changes: [...plan.changes, change],
      ...(field === 'activity' && { activity: editValue.trim() }),
      ...(field === 'time' && { time: editValue.trim() }),
      ...(field === 'date' && { date: editValue.trim() }),
      ...(field === 'participant' && { participants: [...plan.participants, editValue.trim()] }),
    }
    onUpdate(updated, change)
    setEditField(null)
    setEditValue('')
  }

  const startEdit = (field: EditField, current: string) => {
    setEditField(field)
    setEditValue(current)
  }

  const cancel = () => {
    setEditField(null)
    setEditValue('')
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.92)',
        border: '1px solid rgba(0,0,0,0.07)',
        boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
      }}
    >
      {/* Card header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-black/5">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{plan.emoji}</span>
          <div>
            <h2 className="text-base font-semibold" style={{ color: '#0f0f1a' }}>
              {plan.title}
            </h2>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: status.bg, color: status.color, fontSize: '10px' }}
            >
              {status.label}
            </span>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="px-5 py-4 flex flex-col gap-3">
        <DetailRow
          icon={<MapPin size={14} />}
          label="Activity"
          value={plan.activity}
          isEditing={editField === 'activity'}
          editValue={editValue}
          onEdit={() => startEdit('activity', plan.activity)}
          onEditChange={setEditValue}
          onCommit={() => commit('activity')}
          onCancel={cancel}
        />
        <DetailRow
          icon={<Calendar size={14} />}
          label="Date"
          value={plan.date}
          isEditing={editField === 'date'}
          editValue={editValue}
          onEdit={() => startEdit('date', plan.date)}
          onEditChange={setEditValue}
          onCommit={() => commit('date')}
          onCancel={cancel}
        />
        <DetailRow
          icon={<Clock size={14} />}
          label="Time"
          value={plan.time}
          isEditing={editField === 'time'}
          editValue={editValue}
          onEdit={() => startEdit('time', plan.time)}
          onEditChange={setEditValue}
          onCommit={() => commit('time')}
          onCancel={cancel}
        />
        <DetailRow
          icon={<Users size={14} />}
          label="Who"
          value={plan.participants.join(' + ')}
          isEditing={editField === 'participant'}
          editValue={editValue}
          editPlaceholder="Add a name..."
          onEdit={() => startEdit('participant', '')}
          onEditChange={setEditValue}
          onCommit={() => commit('participant')}
          onCancel={cancel}
          addMode
        />
      </div>

      {/* Action buttons */}
      {editField === null && (
        <div className="px-5 pb-5 flex flex-wrap gap-2">
          <ActionButton icon={<Pencil size={11} />} label="Change activity" onClick={() => startEdit('activity', plan.activity)} />
          <ActionButton icon={<Clock size={11} />} label="Change time" onClick={() => startEdit('time', plan.time)} />
          <ActionButton icon={<UserPlus size={11} />} label="Add friend" onClick={() => startEdit('participant', '')} />
          <ActionButton icon={<HelpCircle size={11} />} label="Why this?" onClick={onScrollToLog} accent />
        </div>
      )}
    </div>
  )
}

interface DetailRowProps {
  icon: React.ReactNode
  label: string
  value: string
  isEditing: boolean
  editValue: string
  editPlaceholder?: string
  onEdit: () => void
  onEditChange: (v: string) => void
  onCommit: () => void
  onCancel: () => void
  addMode?: boolean
}

function DetailRow({ icon, label, value, isEditing, editValue, editPlaceholder, onEdit, onEditChange, onCommit, onCancel, addMode }: DetailRowProps) {
  return (
    <div className="flex items-center gap-3">
      <span style={{ color: 'rgba(0,0,0,0.35)' }}>{icon}</span>
      <span className="text-xs w-14 flex-shrink-0" style={{ color: 'rgba(0,0,0,0.35)' }}>{label}</span>
      {isEditing ? (
        <div className="flex items-center gap-2 flex-1">
          <input
            autoFocus
            className="flex-1 text-sm bg-transparent outline-none border-b"
            style={{ color: '#0f0f1a', borderColor: 'rgba(139,92,246,0.4)' }}
            value={editValue}
            placeholder={editPlaceholder ?? value}
            onChange={e => onEditChange(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') onCommit()
              if (e.key === 'Escape') onCancel()
            }}
          />
          <button onClick={onCommit} style={{ color: '#7C3AED' }}><Check size={13} /></button>
          <button onClick={onCancel} style={{ color: 'rgba(0,0,0,0.30)' }}><X size={13} /></button>
        </div>
      ) : (
        <button
          className="text-sm font-medium text-left flex-1 transition-colors duration-150"
          style={{ color: addMode && value === '' ? 'rgba(0,0,0,0.25)' : '#0f0f1a' }}
          onClick={onEdit}
        >
          {addMode ? '+ Add friend' : value}
        </button>
      )}
    </div>
  )
}

interface ActionButtonProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
  accent?: boolean
}

function ActionButton({ icon, label, onClick, accent }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150"
      style={{
        background: accent ? 'rgba(139,92,246,0.06)' : 'rgba(0,0,0,0.04)',
        border: accent ? '1px solid rgba(139,92,246,0.20)' : '1px solid rgba(0,0,0,0.08)',
        color: accent ? '#7C3AED' : 'rgba(0,0,0,0.55)',
      }}
    >
      {icon}
      {label}
    </button>
  )
}
