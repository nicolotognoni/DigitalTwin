import type { GraphNode, GraphLink, ProfileData } from './graphData'

// ─── FEDERICO ────────────────────────────────────────────────────────────────

const federicoNodes: GraphNode[] = [
  {
    id: 'federico', label: 'Federico', group: 'self', val: 20, memories: 42,
    owner: 'federico',
    insight: 'This is your identity as AI perceives it — assembled from patterns in your conversations, questions, decisions, and dreams.',
    x: 0, y: 0,
  },
  {
    id: 'financial-independence', label: 'Financial Freedom', group: 'goals', val: 8, memories: 9,
    owner: 'federico',
    insight: "Financial freedom is your north star. Everything you're building — from crypto investments to startups — seems oriented around this core desire to be truly free, not just financially comfortable.",
    x: 160, y: -180,
  },
  {
    id: 'career-transition', label: 'Career Transition', group: 'goals', val: 7, memories: 7,
    owner: 'federico',
    insight: "You're actively engineering an exit from traditional employment. The frustration isn't just about a bad job — it's the signal of someone who's outgrown the path they're on.",
    x: 230, y: -90,
  },
  {
    id: 'job-dissatisfaction', label: 'Job Dissatisfaction', group: 'problems', val: 6, memories: 5,
    owner: 'federico', privacy: 'private',
    insight: "Your dissatisfaction at Furious Squad goes beyond poor management. It's about doing work that doesn't match who you're becoming. The ERP world feels like a waiting room, not a destination.",
    x: -210, y: -140,
  },
  {
    id: 'crypto', label: 'Crypto', group: 'interests', val: 9, memories: 14,
    owner: 'federico',
    insight: "Crypto isn't just an investment for you — it's your primary lens for the future. You're betting on it with both your money and your time. With 67% of savings allocated and a startup in the works, this is your main bet.",
    x: 250, y: 20,
  },
  {
    id: 'geopolitics', label: 'Geopolitics & IR', group: 'interests', val: 6, memories: 4,
    owner: 'federico',
    insight: 'Your IR background gives you a macro lens that few crypto builders have. Tokenomics, global monetary policy, market structure — this is your native language, even if you don\'t always see it as an "edge".',
    x: 180, y: 90,
  },
  {
    id: 'philosophy', label: 'Philosophy', group: 'interests', val: 5, memories: 3,
    owner: 'federico',
    insight: "Your curiosity about humanity's place in the universe suggests you're asking bigger questions than most. The practical work you're doing may be a concrete answer to those abstract questions.",
    x: -130, y: -240,
  },
  {
    id: 'crypto-index', label: 'Crypto Index Startup', group: 'projects', val: 8, memories: 6,
    owner: 'federico',
    insight: "The crypto index project with Nicolò is where your biggest ambitions converge. It combines financial independence, product-building, and technical growth into one bet.",
    x: 200, y: 190,
  },
  {
    id: 'wallet-tracker', label: 'Universal Wallet Viewer', group: 'projects', val: 7, memories: 5,
    owner: 'federico',
    insight: "The Wallet Viewer reflects your product instincts — you spotted a real gap and started building, even before you had the technical skills to do it alone.",
    x: 290, y: 140,
  },
  {
    id: 'economics', label: 'Economics Background', group: 'skills', val: 6, memories: 4,
    owner: 'federico',
    insight: "Your economics degree is more valuable than you might think. In a space full of engineers who don't understand markets, you bring macro fluency and market design intuition that's genuinely rare.",
    x: 80, y: 260,
  },
  {
    id: 'product-mindset', label: 'Product Mindset', group: 'skills', val: 7, memories: 5,
    owner: 'federico',
    insight: "You've discovered you love product work — bridging user needs and technical solutions. This is probably your strongest professional asset right now.",
    x: -30, y: 280,
  },
  {
    id: 'solana-dev', label: 'Solana Dev', group: 'skills', val: 5, memories: 3,
    owner: 'federico',
    insight: "Learning Solana from zero shows real commitment. You're closing the gap between the person who has the vision and the person who can build it.",
    x: -140, y: 240,
  },
  {
    id: 'japan-trip', label: 'Japan Trip', group: 'lifestyle', val: 5, memories: 4,
    owner: 'federico',
    insight: "Japan in May feels like more than a vacation. It's a reward for staying the course through a period of real uncertainty.",
    x: -250, y: -30,
  },
  {
    id: 'fitness', label: 'Fitness Journey', group: 'lifestyle', val: 4, memories: 4,
    owner: 'federico', privacy: 'private',
    insight: "You want to lose weight not for aesthetics, but to feel better in your body. That's a healthy relationship with fitness — sustainable, not obsessive.",
    x: -280, y: 70,
  },
  {
    id: 'milan-life', label: 'Milan / Cesena', group: 'lifestyle', val: 4, memories: 3,
    owner: 'federico',
    insight: "Living between Cesena and Milan — between roots and ambition — mirrors the broader transition you're navigating across every dimension of life.",
    x: -230, y: 160,
  },
]

const federicoLinks: GraphLink[] = [
  { source: 'federico', target: 'financial-independence' },
  { source: 'federico', target: 'career-transition' },
  { source: 'federico', target: 'job-dissatisfaction' },
  { source: 'federico', target: 'crypto' },
  { source: 'federico', target: 'geopolitics' },
  { source: 'federico', target: 'philosophy' },
  { source: 'job-dissatisfaction', target: 'career-transition' },
  { source: 'career-transition', target: 'crypto' },
  { source: 'crypto', target: 'crypto-index' },
  { source: 'crypto', target: 'wallet-tracker' },
  { source: 'crypto', target: 'financial-independence' },
  { source: 'economics', target: 'crypto' },
  { source: 'economics', target: 'geopolitics' },
  { source: 'product-mindset', target: 'wallet-tracker' },
  { source: 'product-mindset', target: 'crypto-index' },
  { source: 'solana-dev', target: 'crypto-index' },
  { source: 'financial-independence', target: 'japan-trip' },
  { source: 'career-transition', target: 'crypto-index' },
]

// ─── FRANCESCO ───────────────────────────────────────────────────────────────

const francescoNodes: GraphNode[] = [
  {
    id: 'francesco', label: 'Francesco', group: 'self', val: 20, memories: 38,
    owner: 'francesco',
    insight: "Your identity is assembled from precision — you're someone who needs to understand the whole system before touching any part of it.",
    x: 0, y: 0,
  },
  {
    id: 'finish-phd', label: 'Complete PhD', group: 'goals', val: 8, memories: 8,
    owner: 'francesco',
    insight: "The PhD isn't just a degree — it's proof to yourself that you can finish something hard. Everything else waits for that.",
    x: 160, y: -180,
  },
  {
    id: 'work-life-balance', label: 'Work-Life Balance', group: 'goals', val: 6, memories: 5,
    owner: 'francesco',
    insight: "You know what burnout looks like. You've built a life — Manuela, D&D, board games — specifically to protect yourself from it.",
    x: 230, y: -90,
  },
  {
    id: 'debug-stress', label: 'Debug Stress', group: 'problems', val: 6, memories: 6,
    owner: 'francesco',
    insight: "The hours lost to unexplainable bugs aren't just frustrating — they're an attack on your sense of control. You debug until you understand why, not just until it works.",
    x: -210, y: -140,
  },
  {
    id: 'academic-pressure', label: 'Academic Pressure', group: 'problems', val: 5, memories: 4,
    owner: 'francesco',
    insight: "Deadlines, reviewers, advisors — academic pressure is invisible to outsiders. You carry it quietly, but it shapes everything.",
    x: -130, y: -240,
  },
  {
    id: 'guibrushr', label: 'GUIBRUSHR', group: 'projects', val: 8, memories: 7,
    owner: 'francesco',
    insight: "You built a tool that only you fully understand — and that's the point. GUIBRUSHR is the most honest expression of how your mind works.",
    x: 200, y: 190,
  },
  {
    id: 'exoplanet-research', label: 'Exoplanet Research', group: 'projects', val: 7, memories: 6,
    owner: 'francesco',
    insight: "Characterizing atmospheres of planets hundreds of light-years away. Most people don't realize that's a real job. It is. And you're good at it.",
    x: 290, y: 140,
  },
  {
    id: 'python-coding', label: 'Python & Dev', group: 'skills', val: 8, memories: 9,
    owner: 'francesco',
    insight: "Python is your mother tongue. You don't write it to show off — you write it to think.",
    x: 80, y: 260,
  },
  {
    id: 'server-life', label: 'Servers & SSH', group: 'skills', val: 5, memories: 4,
    owner: 'francesco',
    insight: "You live in terminals named after Star Wars characters. That's just your life now and you've made peace with it.",
    x: -30, y: 280,
  },
  {
    id: 'dnd', label: 'D&D — Xocotl', group: 'interests', val: 7, memories: 5,
    owner: 'francesco',
    insight: "Xocotl the Tiefling Warlock is the part of you that gets to make decisions without consequence. That's what role-playing is for.",
    x: 250, y: 20,
  },
  {
    id: 'board-games', label: 'Board Games', group: 'interests', val: 6, memories: 5,
    owner: 'francesco',
    insight: "Catan, Wyrmspan, Talisman — board games are where your analytical mind is an asset instead of a liability. Also a good excuse to see everyone.",
    x: 180, y: 90,
  },
  {
    id: 'astrophysics', label: 'Astrophysics', group: 'interests', val: 7, memories: 6,
    owner: 'francesco',
    insight: "You chose a field that deals with questions no one will answer in your lifetime. That says something about how you think about depth vs. impact.",
    x: -140, y: 240,
  },
  {
    id: 'torino-life', label: 'Torino', group: 'lifestyle', val: 4, memories: 3,
    owner: 'francesco',
    insight: "Torino for the PhD — a city you chose by circumstance but stayed in by inertia and affection. Manuela made it home.",
    x: -230, y: 160,
  },
  {
    id: 'manuela', label: 'Manuela', group: 'lifestyle', val: 5, memories: 4,
    owner: 'francesco',
    insight: "She's Colombian, you're from Romagna, you met in Torino. The overlap made sense in a way that's hard to explain but easy to feel.",
    x: -250, y: -30,
  },
  {
    id: 'mountain-travel', label: 'Mountains & Travel', group: 'lifestyle', val: 4, memories: 3,
    owner: 'francesco',
    insight: "The mountains near Torino are your reset button. When the code stops making sense, altitude helps.",
    x: -280, y: 70,
  },
]

const francescoLinks: GraphLink[] = [
  { source: 'francesco', target: 'finish-phd' },
  { source: 'francesco', target: 'work-life-balance' },
  { source: 'francesco', target: 'debug-stress' },
  { source: 'francesco', target: 'guibrushr' },
  { source: 'francesco', target: 'dnd' },
  { source: 'francesco', target: 'astrophysics' },
  { source: 'finish-phd', target: 'exoplanet-research' },
  { source: 'finish-phd', target: 'guibrushr' },
  { source: 'debug-stress', target: 'academic-pressure' },
  { source: 'python-coding', target: 'guibrushr' },
  { source: 'python-coding', target: 'server-life' },
  { source: 'dnd', target: 'board-games' },
  { source: 'astrophysics', target: 'exoplanet-research' },
  { source: 'manuela', target: 'torino-life' },
  { source: 'mountain-travel', target: 'work-life-balance' },
]

// ─── COMPARE MODE ─────────────────────────────────────────────────────────────

// Federico's 6 representative nodes, shifted left
const compareNodesFederico: GraphNode[] = [
  { ...federicoNodes.find(n => n.id === 'financial-independence')!, x: -170, y: -130 },
  { ...federicoNodes.find(n => n.id === 'crypto')!, x: -160, y: 20 },
  { ...federicoNodes.find(n => n.id === 'crypto-index')!, x: -120, y: 140 },
  { ...federicoNodes.find(n => n.id === 'product-mindset')!, x: -190, y: 60 },
  { ...federicoNodes.find(n => n.id === 'job-dissatisfaction')!, x: -130, y: -170 },
  { ...federicoNodes.find(n => n.id === 'career-transition')!, x: -190, y: -60 },
]

// Francesco's 6 representative nodes, shifted right
const compareNodesFrancesco: GraphNode[] = [
  { ...francescoNodes.find(n => n.id === 'finish-phd')!, x: 170, y: -130 },
  { ...francescoNodes.find(n => n.id === 'guibrushr')!, x: 120, y: 140 },
  { ...francescoNodes.find(n => n.id === 'python-coding')!, x: 190, y: 60 },
  { ...francescoNodes.find(n => n.id === 'debug-stress')!, x: 130, y: -170 },
  { ...francescoNodes.find(n => n.id === 'dnd')!, x: 160, y: 20 },
  { ...francescoNodes.find(n => n.id === 'work-life-balance')!, x: 190, y: -60 },
]

// 5 bridge nodes, centered
const bridgeNodes: GraphNode[] = [
  {
    id: 'bridge-builders', label: 'You both build from zero', group: 'bridge', val: 10, memories: 0,
    owner: 'bridge',
    insight: '',
    federicoLine: 'Builds crypto products & startup tools without waiting for a team',
    francescoLine: 'Builds GUIBRUSHR & research pipelines without waiting for guidance',
    connectionLine: 'Neither waits for permission to create something.',
    x: 0, y: -90,
  },
  {
    id: 'bridge-natives', label: 'Tech is your shared language', group: 'bridge', val: 9, memories: 0,
    owner: 'bridge',
    insight: '',
    federicoLine: 'Learns Solana to build his own startup from scratch',
    francescoLine: 'Lives in Python pipelines and Star Wars-named servers',
    connectionLine: 'You both think in systems. Code is how you make ideas real.',
    x: 40, y: 30,
  },
  {
    id: 'bridge-friction', label: 'Both fighting the wrong battle', group: 'bridge', val: 9, memories: 0,
    owner: 'bridge',
    insight: '',
    federicoLine: 'Stuck in ERP work that bores him — waiting for the exit',
    francescoLine: 'Deep in PhD pressure that exhausts him — waiting for the finish',
    connectionLine: "You're both in a place that's not your destination.",
    x: -40, y: 30,
  },
  {
    id: 'bridge-drive', label: 'Different stars, same hunger', group: 'bridge', val: 10, memories: 0,
    owner: 'bridge',
    insight: '',
    federicoLine: 'Chases financial freedom — the ability to choose his own path',
    francescoLine: 'Chases knowledge — the ability to understand things fully',
    connectionLine: 'The ambition looks different. The drive is identical.',
    x: 0, y: 110,
  },
  {
    id: 'bridge-circle', label: 'Same world, different cities', group: 'bridge', val: 8, memories: 0,
    owner: 'bridge',
    insight: '',
    federicoLine: 'Milan / Cesena — between his girlfriend and his roots',
    francescoLine: 'Torino — between his research and Manuela',
    connectionLine: 'Same circle, same conversations. Just in different apartments.',
    x: 0, y: 0,
  },
]

const compareLinks: GraphLink[] = [
  // Bridge: builders
  { source: 'crypto-index', target: 'bridge-builders' },
  { source: 'guibrushr', target: 'bridge-builders' },
  // Bridge: tech natives
  { source: 'product-mindset', target: 'bridge-natives' },
  { source: 'python-coding', target: 'bridge-natives' },
  // Bridge: friction
  { source: 'job-dissatisfaction', target: 'bridge-friction' },
  { source: 'debug-stress', target: 'bridge-friction' },
  // Bridge: drive
  { source: 'financial-independence', target: 'bridge-drive' },
  { source: 'finish-phd', target: 'bridge-drive' },
  // Bridge: circle
  { source: 'career-transition', target: 'bridge-circle' },
  { source: 'dnd', target: 'bridge-circle' },
  // Internal compare links (same-person)
  { source: 'crypto', target: 'crypto-index' },
  { source: 'job-dissatisfaction', target: 'career-transition' },
  { source: 'finish-phd', target: 'guibrushr' },
  { source: 'debug-stress', target: 'work-life-balance' },
]

// ─── EXPORT ──────────────────────────────────────────────────────────────────

export const profiles: Record<string, ProfileData> = {
  federico: { nodes: federicoNodes, links: federicoLinks },
  francesco: { nodes: francescoNodes, links: francescoLinks },
  compare: {
    nodes: [...compareNodesFederico, ...compareNodesFrancesco, ...bridgeNodes],
    links: compareLinks,
  },
}
