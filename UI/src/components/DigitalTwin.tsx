import { useCallback, useRef, useState, useEffect } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import type { ForceGraphMethods } from 'react-force-graph-2d'
import { GROUP_COLORS, getEffectivePrivacy } from '../data/graphData'
import type { GraphNode, Mode, NodePrivacy } from '../data/graphData'
import { profiles } from '../data/profiles'
import { InsightPanel } from './InsightPanel'
import { Legend } from './Legend'

// Convert #RRGGBB hex to rgba(r,g,b,a)
function hexAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}


interface Props {
  mode: Mode
  focusNodeId?: string | null
  privacyOverrides: Map<string, NodePrivacy>
  friendPreview: boolean
  onTogglePrivacy: (nodeId: string, current: NodePrivacy) => void
}

export function DigitalTwin({ mode, focusNodeId, privacyOverrides, friendPreview, onTogglePrivacy }: Props) {
  const fgRef = useRef<ForceGraphMethods | undefined>(undefined)
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null)
  const [graphData, setGraphData] = useState(profiles[mode])

  // Track dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        })
      }
    }
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Animate transition when mode changes
  useEffect(() => {
    setSelectedNode(null)
    setGraphData({ ...profiles[mode] })
    setTimeout(() => {
      if (fgRef.current) {
        fgRef.current.d3ReheatSimulation()
        fgRef.current.centerAt(0, 0, 800)
        fgRef.current.zoom(mode === 'compare' ? 2.2 : 1.4, 800)
      }
    }, 50)
  }, [mode])

  // Focus a specific node from sidebar click
  useEffect(() => {
    if (!focusNodeId || !fgRef.current) return
    const node = graphData.nodes.find(n => n.id === focusNodeId)
    if (!node) return
    setSelectedNode(node)
    fgRef.current.centerAt(node.x ?? 0, node.y ?? 0, 600)
    fgRef.current.zoom(mode === 'compare' ? 2.8 : 3, 600)
  }, [focusNodeId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Configure d3 forces after graph mounts or mode changes
  useEffect(() => {
    if (!fgRef.current || dimensions.width === 0) return
    const isCompare = mode === 'compare'
    const charge = fgRef.current.d3Force('charge') as { strength: (n: number) => void } | undefined
    charge?.strength(isCompare ? -180 : -600)
    const link = fgRef.current.d3Force('link') as { distance: (n: number) => void } | undefined
    link?.distance(isCompare ? 70 : 140)
    fgRef.current.d3ReheatSimulation()
  }, [dimensions.width, mode])

  // Pin center node(s) after engine settles
  const handleEngineStop = useCallback(() => {
    const profile = profiles[mode]
    profile.nodes.forEach((n) => {
      if (n.id === 'federico' || n.id === 'francesco') {
        // In compare mode don't pin, let them float with their cluster
        if (mode !== 'compare') {
          n.fx = 0
          n.fy = 0
        }
      }
    })
  }, [mode])

  const handleNodeClick = useCallback(
    (node: object) => {
      const n = node as GraphNode
      const isCenterNode = (n.id === 'federico' && mode === 'federico') ||
                           (n.id === 'francesco' && mode === 'francesco')
      if (isCenterNode) {
        setSelectedNode(null)
        return
      }
      // Block clicks on placeholder nodes in friend preview
      if (friendPreview && getEffectivePrivacy(n, privacyOverrides) === 'private') return
      setSelectedNode(n)
      if (fgRef.current) {
        fgRef.current.centerAt(n.x ?? 0, n.y ?? 0, 600)
        fgRef.current.zoom(mode === 'compare' ? 1.8 : 2.2, 600)
      }
    },
    [mode, friendPreview, privacyOverrides]
  )

  const handleBackgroundClick = useCallback(() => {
    setSelectedNode(null)
    if (fgRef.current) {
      fgRef.current.centerAt(0, 0, 600)
      fgRef.current.zoom(mode === 'compare' ? 2.2 : 1.4, 600)
    }
  }, [mode])

  // Custom node rendering
  const paintNode = useCallback(
    (node: object, ctx: CanvasRenderingContext2D) => {
      const n = node as GraphNode
      const color = GROUP_COLORS[n.group]
      const x = n.x ?? 0
      const y = n.y ?? 0
      const isCenterNode = (n.id === 'federico' && mode !== 'compare') ||
                           (n.id === 'francesco' && mode !== 'compare')
      const isBridge = n.owner === 'bridge'
      const isSelected = selectedNode?.id === n.id
      const isHovered = hoveredNode?.id === n.id
      const radius = isCenterNode ? 18 : isBridge ? 14 : Math.sqrt(n.val) * 4

      // Privacy state (only meaningful for non-bridge, non-center nodes in federico mode)
      const effectivePrivacy = (!isBridge && !isCenterNode && mode === 'federico')
        ? getEffectivePrivacy(n, privacyOverrides)
        : 'public'
      const isGhost = effectivePrivacy === 'private' && !friendPreview
      const isPlaceholder = effectivePrivacy === 'private' && friendPreview

      // ── PLACEHOLDER (friend sees locked bubble) ────────────────────────────
      if (isPlaceholder) {
        // Node circle — barely visible
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, 2 * Math.PI)
        ctx.fillStyle = 'rgba(255,255,255,0.04)'
        ctx.fill()
        ctx.strokeStyle = 'rgba(255,255,255,0.10)'
        ctx.lineWidth = 1
        ctx.stroke()

        // Centred lock emoji
        ctx.font = `${radius * 0.9}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.globalAlpha = 0.35
        ctx.fillText('🔒', x, y - radius * 0.1)
        ctx.globalAlpha = 1.0

        // "Private" label
        const fontSize = 8
        ctx.font = `italic 400 ${fontSize}px Inter, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        const labelY = y + radius + 10
        const text = 'Private'
        const textWidth = ctx.measureText(text).width
        ctx.fillStyle = 'rgba(248, 248, 252, 0.88)'
        ctx.fillRect(x - textWidth / 2 - 3, labelY - 7, textWidth + 6, 14)
        ctx.fillStyle = 'rgba(0,0,0,0.22)'
        ctx.fillText(text, x, labelY)
        return
      }

      // ── GHOST (owner sees faint dashed node) ──────────────────────────────
      if (isGhost) {
        // Selection ring still visible so it remains navigable
        if (isSelected) {
          ctx.beginPath()
          ctx.arc(x, y, radius + 5, 0, 2 * Math.PI)
          ctx.strokeStyle = hexAlpha(color, 0.4)
          ctx.lineWidth = 1.5
          ctx.stroke()
        }

        // Node circle — low opacity fill
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, 2 * Math.PI)
        ctx.fillStyle = hexAlpha(color, 0.22)
        ctx.fill()

        // Dashed border
        ctx.setLineDash([3, 3])
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, 2 * Math.PI)
        ctx.strokeStyle = hexAlpha(color, 0.55)
        ctx.lineWidth = 1.5
        ctx.stroke()
        ctx.setLineDash([])

        // Lock badge — top-right corner (emoji)
        ctx.font = `${radius * 0.65}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.globalAlpha = 0.55
        ctx.fillText('🔒', x + radius * 0.55, y - radius * 0.55)
        ctx.globalAlpha = 1.0

        // Label
        const fontSize = 9
        ctx.font = `400 ${fontSize}px Inter, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        const labelY = y + radius + 10
        const text = n.label
        const textWidth = ctx.measureText(text).width
        ctx.fillStyle = 'rgba(248, 248, 252, 0.88)'
        ctx.fillRect(x - textWidth / 2 - 3, labelY - 7, textWidth + 6, 14)
        ctx.fillStyle = 'rgba(0,0,0,0.45)'
        ctx.fillText(text, x, labelY)
        return
      }

      // ── NORMAL rendering ───────────────────────────────────────────────────

      // Owner ring for compare mode
      if (mode === 'compare' && !isBridge) {
        const ringColor = n.owner === 'federico'
          ? 'rgba(99,102,241,0.5)'   // indigo for Federico
          : 'rgba(16,185,129,0.5)'   // green for Francesco
        ctx.beginPath()
        ctx.arc(x, y, radius + 4, 0, 2 * Math.PI)
        ctx.strokeStyle = ringColor
        ctx.lineWidth = 2
        ctx.stroke()
      }

      // Bridge node pulsing glow
      if (isBridge) {
        const glowRadius = radius + 18
        const gradient = ctx.createRadialGradient(x, y, radius, x, y, glowRadius)
        gradient.addColorStop(0, hexAlpha(color, 0.35))
        gradient.addColorStop(1, hexAlpha(color, 0))
        ctx.beginPath()
        ctx.arc(x, y, glowRadius, 0, 2 * Math.PI)
        ctx.fillStyle = gradient
        ctx.fill()
      }

      // Glow for selected/hovered
      if (isSelected || isHovered) {
        const glowRadius = radius + (isSelected ? 12 : 6)
        const gradient = ctx.createRadialGradient(x, y, radius, x, y, glowRadius)
        gradient.addColorStop(0, hexAlpha(color, 0.25))
        gradient.addColorStop(1, hexAlpha(color, 0))
        ctx.beginPath()
        ctx.arc(x, y, glowRadius, 0, 2 * Math.PI)
        ctx.fillStyle = gradient
        ctx.fill()
      }

      // Selection ring
      if (isSelected) {
        ctx.beginPath()
        ctx.arc(x, y, radius + 5, 0, 2 * Math.PI)
        ctx.strokeStyle = color
        ctx.lineWidth = 1.5
        ctx.stroke()
      }

      // Node circle
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, 2 * Math.PI)

      if (isCenterNode) {
        const grad = ctx.createRadialGradient(x - 4, y - 4, 1, x, y, radius)
        grad.addColorStop(0, '#A78BFA')
        grad.addColorStop(1, '#7C3AED')
        ctx.fillStyle = grad
      } else if (isBridge) {
        const grad = ctx.createRadialGradient(x - 3, y - 3, 1, x, y, radius)
        grad.addColorStop(0, hexAlpha(color, 1))
        grad.addColorStop(1, hexAlpha(color, 0.7))
        ctx.fillStyle = grad
      } else {
        ctx.fillStyle = isSelected ? color : hexAlpha(color, 0.8)
      }
      ctx.fill()

      // Inner ring for regular nodes
      if (!isCenterNode && !isBridge) {
        ctx.beginPath()
        ctx.arc(x, y, radius * 0.6, 0, 2 * Math.PI)
        ctx.fillStyle = hexAlpha(color, 0.2)
        ctx.fill()
      }

      // Label
      const fontSize = isCenterNode ? 11 : isBridge ? 8 : 9
      ctx.font = `${isCenterNode || isSelected || isBridge ? '600' : '400'} ${fontSize}px Inter, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      const labelY = y + radius + 10
      const text = n.label

      // Label background (skip for center node — it has enough contrast with bold purple text)
      const textWidth = ctx.measureText(text).width
      if (!isCenterNode) {
        ctx.fillStyle = 'rgba(248, 248, 252, 0.88)'
        ctx.fillRect(x - textWidth / 2 - 3, labelY - 7, textWidth + 6, 14)
      }

      // Label text
      ctx.fillStyle = isSelected ? color : isCenterNode ? '#7C3AED' : isBridge ? color : hexAlpha(color, 0.85)
      ctx.fillText(text, x, labelY)
    },
    [selectedNode, hoveredNode, mode, privacyOverrides, friendPreview]
  )

  // Custom link rendering
  const paintLink = useCallback(
    (link: object, ctx: CanvasRenderingContext2D) => {
      const l = link as { source: GraphNode | string; target: GraphNode | string }
      if (typeof l.source === 'string' || typeof l.target === 'string') return
      const src = l.source as GraphNode
      const tgt = l.target as GraphNode
      const sourceColor = GROUP_COLORS[src.group] ?? '#ffffff'
      const sx = src.x ?? 0
      const sy = src.y ?? 0
      const tx = tgt.x ?? 0
      const ty = tgt.y ?? 0

      const isRelated =
        selectedNode &&
        (src.id === selectedNode.id || tgt.id === selectedNode.id)
      const isBridgeLink = src.owner === 'bridge' || tgt.owner === 'bridge'

      // Privacy: check if either endpoint is private
      const srcPrivate = mode === 'federico' && getEffectivePrivacy(src, privacyOverrides) === 'private'
      const tgtPrivate = mode === 'federico' && getEffectivePrivacy(tgt, privacyOverrides) === 'private'
      const hasPrivateEnd = srcPrivate || tgtPrivate

      ctx.beginPath()
      ctx.moveTo(sx, sy)
      ctx.lineTo(tx, ty)

      if (hasPrivateEnd) {
        if (friendPreview) {
          // Friend preview: nearly invisible
          ctx.strokeStyle = hexAlpha(sourceColor, 0.04)
          ctx.lineWidth = 0.6
        } else {
          // Ghost: dashed, low opacity
          ctx.setLineDash([4, 4])
          ctx.strokeStyle = hexAlpha(sourceColor, 0.08)
          ctx.lineWidth = 0.8
        }
      } else {
        ctx.strokeStyle = isRelated
          ? hexAlpha(sourceColor, 0.7)
          : isBridgeLink
            ? hexAlpha('#EC4899', 0.2)
            : hexAlpha(sourceColor, 0.15)
        ctx.lineWidth = isRelated ? 1.5 : isBridgeLink ? 1 : 0.8
      }

      ctx.stroke()
      ctx.setLineDash([])
    },
    [selectedNode, mode, privacyOverrides, friendPreview]
  )

  return (
    <div ref={containerRef} className="relative flex-1 overflow-hidden" style={{ background: '#f8f8fc' }}>
      {dimensions.width > 0 && (
        <ForceGraph2D
          ref={fgRef}
          graphData={graphData}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="#f8f8fc"
          nodeCanvasObject={paintNode}
          nodeCanvasObjectMode={() => 'replace'}
          linkCanvasObject={paintLink}
          linkCanvasObjectMode={() => 'replace'}
          onNodeClick={handleNodeClick}
          onBackgroundClick={handleBackgroundClick}
          onNodeHover={(node) => setHoveredNode(node as GraphNode | null)}
          onEngineStop={handleEngineStop}
          nodeRelSize={6}
          linkDirectionalParticles={2}
          linkDirectionalParticleWidth={1.5}
          linkDirectionalParticleColor={(link) => {
            const l = link as { source: GraphNode | string; target: GraphNode | string }
            if (typeof l.source === 'string') return 'rgba(255,255,255,0.3)'
            const src = l.source as GraphNode
            if (src.owner === 'bridge') return 'rgba(236,72,153,0.5)'
            return GROUP_COLORS[src.group] ?? 'rgba(255,255,255,0.3)'
          }}
          d3AlphaDecay={0.015}
          d3VelocityDecay={0.25}
          cooldownTicks={200}
          warmupTicks={80}
        />
      )}

      <Legend mode={mode} friendPreview={friendPreview} />

      {friendPreview && (
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs pointer-events-none"
          style={{
            background: 'rgba(251,191,36,0.07)',
            border: '1px solid rgba(251,191,36,0.15)',
            color: 'rgba(251,191,36,0.55)',
          }}
        >
          Viewing as a friend — private nodes are hidden
        </div>
      )}

      {!selectedNode && (
        <div className="absolute bottom-6 right-6 text-xs italic text-right" style={{ color: 'rgba(0,0,0,0.25)' }}>
          {mode === 'compare' ? 'Click a bridge node to see the connection' : 'Click any node to explore'}
        </div>
      )}

      <InsightPanel
        node={selectedNode}
        onClose={() => setSelectedNode(null)}
        mode={mode}
        privacy={selectedNode ? getEffectivePrivacy(selectedNode, privacyOverrides) : 'public'}
        onTogglePrivacy={() => {
          if (selectedNode) {
            onTogglePrivacy(selectedNode.id, getEffectivePrivacy(selectedNode, privacyOverrides))
          }
        }}
      />
    </div>
  )
}
