export type NodeGroup =
  | 'self'
  | 'goals'
  | 'problems'
  | 'interests'
  | 'projects'
  | 'skills'
  | 'lifestyle'
  | 'bridge'

export type NodeOwner = 'federico' | 'francesco' | 'bridge'

export type NodePrivacy = 'public' | 'private'

export function getEffectivePrivacy(node: GraphNode, overrides: Map<string, NodePrivacy>): NodePrivacy {
  return overrides.get(node.id) ?? node.privacy ?? 'public'
}

export interface GraphNode {
  id: string
  label: string
  group: NodeGroup
  val: number
  insight: string
  memories: number
  owner?: NodeOwner
  privacy?: NodePrivacy
  // Bridge node extra fields
  federicoLine?: string
  francescoLine?: string
  connectionLine?: string
  x?: number
  y?: number
  fx?: number
  fy?: number
}

export interface GraphLink {
  source: string
  target: string
}

export interface ProfileData {
  nodes: GraphNode[]
  links: GraphLink[]
}

export const GROUP_COLORS: Record<NodeGroup, string> = {
  self: '#7C3AED',
  goals: '#F59E0B',
  problems: '#EF4444',
  interests: '#3B82F6',
  projects: '#8B5CF6',
  skills: '#10B981',
  lifestyle: '#14B8A6',
  bridge: '#EC4899',
}

export const GROUP_LABELS: Record<NodeGroup, string> = {
  self: 'Identity',
  goals: 'Goals',
  problems: 'Friction',
  interests: 'Interests',
  projects: 'Projects',
  skills: 'Skills',
  lifestyle: 'Lifestyle',
  bridge: 'Connessione',
}

export type Mode = 'federico' | 'francesco' | 'compare'
