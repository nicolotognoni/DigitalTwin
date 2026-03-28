export interface SummaryItem {
  text: string
  nodeId: string
}

export interface GoalRow {
  goal: string
  behavior: string
  alignment: 'yes' | 'moving' | 'partial' | 'slow'
  nodeId: string
}

export interface TrajectoryStep {
  year: string
  label: string
  description: string
  nodeId: string
  current?: boolean
  future?: boolean
}

// ─── FEDERICO ────────────────────────────────────────────────────────────────

export const federicoSummary: SummaryItem[] = [
  {
    text: 'You are actively transitioning toward crypto while feeling real friction in your current job.',
    nodeId: 'career-transition',
  },
  {
    text: 'Your north star is financial independence — it shapes how you evaluate almost every decision.',
    nodeId: 'financial-independence',
  },
  {
    text: "You're building two products simultaneously while working a full-time job that bores you.",
    nodeId: 'crypto-index',
  },
  {
    text: "Your IR background is an underutilized edge — you understand markets in a way most builders don't.",
    nodeId: 'economics',
  },
]

export const federicoGoals: GoalRow[] = [
  {
    goal: 'Financial Freedom',
    behavior: 'Working 34k/year job',
    alignment: 'partial',
    nodeId: 'financial-independence',
  },
  {
    goal: 'Crypto Career',
    behavior: 'Learning Solana, building startup',
    alignment: 'moving',
    nodeId: 'crypto',
  },
  {
    goal: 'Product Builder',
    behavior: 'Feature analysis at Furious',
    alignment: 'partial',
    nodeId: 'product-mindset',
  },
  {
    goal: 'Fitness (80kg)',
    behavior: '2×/week dumbbells + walks',
    alignment: 'slow',
    nodeId: 'fitness',
  },
]

export const federicoTrajectory: TrajectoryStep[] = [
  {
    year: '2022',
    label: 'Foundation',
    description: 'Economics degree. CSM at Certideal. Paris experience.',
    nodeId: 'economics',
  },
  {
    year: '2024',
    label: 'Friction',
    description: 'Furious Squad. ERP work. Dissatisfaction grows.',
    nodeId: 'job-dissatisfaction',
  },
  {
    year: '2025',
    label: 'Building',
    description: 'Crypto index startup + Wallet Tracker. Learning Solana.',
    nodeId: 'crypto-index',
    current: true,
  },
  {
    year: '2025+',
    label: '→ Freedom',
    description: 'Financial independence. Crypto career. Own products.',
    nodeId: 'financial-independence',
    future: true,
  },
]

export const askTwinResponses: { keywords: string[]; response: string; nodeId: string }[] = [
  {
    keywords: ['crypto', 'startup', 'solana', 'web3'],
    response:
      "Your data suggests crypto is your clearest path. You're already investing 67% of savings in it and building a startup. The gap is technical — close it.",
    nodeId: 'crypto',
  },
  {
    keywords: ['job', 'work', 'furious', 'quit', 'leave'],
    response:
      "Your dissatisfaction at Furious Squad is a signal, not a problem. You've outgrown it. The question isn't whether to leave — it's when and how.",
    nodeId: 'job-dissatisfaction',
  },
  {
    keywords: ['money', 'finance', 'freedom', 'independence'],
    response:
      "Financial independence is your north star but your current behavior is cautious. The startup is the lever — not the salary.",
    nodeId: 'financial-independence',
  },
  {
    keywords: ['japan', 'travel', 'trip'],
    response:
      "Japan in May is your reward for staying the course. Go, reset, come back with more energy for the startup.",
    nodeId: 'japan-trip',
  },
  {
    keywords: ['product', 'build', 'tool'],
    response:
      "You already think like a product person. The work at Furious is training — even if it feels like a cage. Use it.",
    nodeId: 'product-mindset',
  },
]

export const askTwinDefaultResponse =
  "Based on your patterns, you're in a transition phase. The friction you feel is the gap between where you are and where you're going. That's normal. Keep building."

// ─── FRANCESCO ───────────────────────────────────────────────────────────────

export const francescoSummary: SummaryItem[] = [
  {
    text: 'You are deep in a PhD that demands everything from you — and you chose it because deep problems are the only ones worth solving.',
    nodeId: 'finish-phd',
  },
  {
    text: "You built GUIBRUSHR not because someone asked you to — but because you couldn't not build it.",
    nodeId: 'guibrushr',
  },
  {
    text: 'D&D is where you get to be decisive without consequence. The rest of your life is precise and deliberate.',
    nodeId: 'dnd',
  },
  {
    text: "The debug sessions that last until 3 AM aren't just work — they're how you think.",
    nodeId: 'debug-stress',
  },
]

export const francescoGoals: GoalRow[] = [
  {
    goal: 'Complete PhD',
    behavior: 'Active research on exoplanets',
    alignment: 'moving',
    nodeId: 'finish-phd',
  },
  {
    goal: 'Work-Life Balance',
    behavior: 'D&D, board games, Manuela',
    alignment: 'yes',
    nodeId: 'work-life-balance',
  },
  {
    goal: 'Research Impact',
    behavior: 'GUIBRUSHR tool development',
    alignment: 'moving',
    nodeId: 'exoplanet-research',
  },
  {
    goal: 'Stay sane',
    behavior: 'Mountains + travel when possible',
    alignment: 'partial',
    nodeId: 'mountain-travel',
  },
]
