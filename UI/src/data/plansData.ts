export type AgentType = 'twin' | 'planner' | 'specialist'
export type PlanAction = 'change_time' | 'change_activity' | 'change_date' | 'add_participant' | 'suggest'
export type PlanStatus = 'draft' | 'ready' | 'confirmed'

export interface Agent {
  id: string
  label: string
  type: AgentType
  emoji: string
  color: string
  description: string
}

export interface PlanChange {
  id: string
  agentId: string
  agentLabel: string
  agentEmoji: string
  agentColor: string
  action: PlanAction
  value: string
  reason: string
  timestamp: string
}

export interface Plan {
  id: string
  title: string
  emoji: string
  activity: string
  time: string
  date: string
  location: string
  participants: string[]
  status: PlanStatus
  changes: PlanChange[]
  updatedAt: string
}

export const ALL_AGENTS: Agent[] = [
  {
    id: 'federico_twin',
    label: 'Federico Twin',
    type: 'twin',
    emoji: '🧠',
    color: '#8B5CF6',
    description: 'Your preferences & goals',
  },
  {
    id: 'francesco_twin',
    label: 'Francesco Twin',
    type: 'twin',
    emoji: '🧠',
    color: '#10B981',
    description: "Francesco's availability & style",
  },
  {
    id: 'planner',
    label: 'Planner',
    type: 'planner',
    emoji: '🎯',
    color: '#F59E0B',
    description: 'Builds & optimises the plan',
  },
  {
    id: 'product',
    label: 'Product Agent',
    type: 'specialist',
    emoji: '📦',
    color: '#3B82F6',
    description: 'Product & strategy thinking',
  },
  {
    id: 'dev',
    label: 'Dev Agent',
    type: 'specialist',
    emoji: '⚙️',
    color: '#6366F1',
    description: 'Technical execution',
  },
]

export const AGENT_SUGGESTIONS: Record<string, string[]> = {
  organizza:  ['federico_twin', 'francesco_twin', 'planner'],
  organize:   ['federico_twin', 'francesco_twin', 'planner'],
  cena:       ['federico_twin', 'francesco_twin', 'planner'],
  dinner:     ['federico_twin', 'francesco_twin', 'planner'],
  startup:    ['federico_twin', 'planner', 'product', 'dev'],
  crypto:     ['federico_twin', 'planner', 'product'],
  build:      ['federico_twin', 'dev', 'product'],
  lavoro:     ['federico_twin', 'planner', 'product'],
  product:    ['federico_twin', 'product', 'planner'],
}

export const MOCK_PLANS: Plan[] = [
  {
    id: 'plan_1',
    title: 'Dinner + board games',
    emoji: '🍽️',
    activity: 'Dinner + board games',
    time: '20:30',
    date: 'Saturday',
    location: 'TBD',
    participants: ['Federico', 'Francesco'],
    status: 'ready',
    updatedAt: '2 min ago',
    changes: [
      {
        id: 'c1',
        agentId: 'francesco_twin',
        agentLabel: 'Francesco Twin',
        agentEmoji: '🧠',
        agentColor: '#10B981',
        action: 'change_time',
        value: '20:30',
        reason: 'Preferisco dopo le 19',
        timestamp: '5 min ago',
      },
      {
        id: 'c2',
        agentId: 'planner',
        agentLabel: 'Planner',
        agentEmoji: '🎯',
        agentColor: '#F59E0B',
        action: 'change_activity',
        value: 'board games',
        reason: 'Matches shared strategy game interest',
        timestamp: '3 min ago',
      },
    ],
  },
  {
    id: 'plan_2',
    title: 'Crypto startup sprint',
    emoji: '🚀',
    activity: 'Product planning + dev sync',
    time: '10:00',
    date: 'Monday',
    location: 'Remote',
    participants: ['Federico', 'Nicolò'],
    status: 'draft',
    updatedAt: 'yesterday',
    changes: [
      {
        id: 'c3',
        agentId: 'planner',
        agentLabel: 'Planner',
        agentEmoji: '🎯',
        agentColor: '#F59E0B',
        action: 'suggest',
        value: 'Add Dev Agent',
        reason: 'Technical scope requires dev review',
        timestamp: 'yesterday',
      },
    ],
  },
  {
    id: 'plan_3',
    title: 'Film night',
    emoji: '🎬',
    activity: 'Film night',
    time: '21:00',
    date: 'Sunday',
    location: "Federico's place",
    participants: ['Federico'],
    status: 'draft',
    updatedAt: '3 days ago',
    changes: [],
  },
]
