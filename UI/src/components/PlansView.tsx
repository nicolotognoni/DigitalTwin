import { useState, useRef, useCallback } from 'react'
import { ClipboardList } from 'lucide-react'
import { PlanList } from './plans/PlanList'
import { PlanCard } from './plans/PlanCard'
import { ChangeLog } from './plans/ChangeLog'
import { AgentSelector } from './plans/AgentSelector'
import { MOCK_PLANS } from '../data/plansData'
import type { Plan, PlanChange } from '../data/plansData'

export function PlansView() {
  const [plans, setPlans] = useState<Plan[]>(MOCK_PLANS)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(plans[0])
  const [activeAgents, setActiveAgents] = useState<string[]>(['federico_twin', 'planner'])
  const [lastQuery] = useState('organizza qualcosa con Francesco')
  const changeLogRef = useRef<HTMLDivElement>(null)

  const handleToggleAgent = useCallback((agentId: string) => {
    setActiveAgents(prev =>
      prev.includes(agentId) ? prev.filter(id => id !== agentId) : [...prev, agentId]
    )
  }, [])

  const handleUpdatePlan = useCallback((updated: Plan, _change: PlanChange) => {
    setPlans(prev => prev.map(p => p.id === updated.id ? updated : p))
    setSelectedPlan(updated)
  }, [])

  const handleNewPlan = useCallback(() => {
    const newPlan: Plan = {
      id: `plan_${Date.now()}`,
      title: 'New plan',
      emoji: '📋',
      activity: '',
      time: '',
      date: '',
      location: '',
      participants: ['Federico'],
      status: 'draft',
      changes: [],
      updatedAt: 'just now',
    }
    setPlans(prev => [newPlan, ...prev])
    setSelectedPlan(newPlan)
  }, [])

  const scrollToLog = () => {
    changeLogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left: plan list */}
      <PlanList
        plans={plans}
        selectedId={selectedPlan?.id ?? null}
        onSelect={plan => setSelectedPlan(plan)}
        onNew={handleNewPlan}
      />

      {/* Right: plan detail */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedPlan ? (
          <>
            <AgentSelector
              activeAgents={activeAgents}
              onToggle={handleToggleAgent}
              query={lastQuery}
            />
            <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-4">
              <PlanCard
                plan={selectedPlan}
                onUpdate={handleUpdatePlan}
                onScrollToLog={scrollToLog}
              />
              <div ref={changeLogRef}>
                <ChangeLog changes={selectedPlan.changes} />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <ClipboardList size={32} style={{ color: 'rgba(0,0,0,0.15)' }} />
            <p className="text-sm" style={{ color: 'rgba(0,0,0,0.30)' }}>
              Select a plan or create one
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
