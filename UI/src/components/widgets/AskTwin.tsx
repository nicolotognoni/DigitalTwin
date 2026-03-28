import { useState, useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import { askTwinResponses, askTwinDefaultResponse } from '../../data/dashboardData'

interface Props {
  onFocusNode: (nodeId: string) => void
}

export function AskTwin({ onFocusNode }: Props) {
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState<string | null>(null)
  const [responseNodeId, setResponseNodeId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = () => {
    const q = query.toLowerCase().trim()
    if (!q) return

    const match = askTwinResponses.find(r =>
      r.keywords.some(k => q.includes(k))
    )

    if (match) {
      setResponse(match.response)
      setResponseNodeId(match.nodeId)
      onFocusNode(match.nodeId)
    } else {
      setResponse(askTwinDefaultResponse)
      setResponseNodeId(null)
    }
    setQuery('')
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs uppercase tracking-widest font-medium" style={{ color: 'rgba(0,0,0,0.35)' }}>Ask Your Twin</span>

      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg"
        style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)' }}
      >
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="What should I do next?"
          className="flex-1 bg-transparent text-xs outline-none" style={{ color: 'rgba(0,0,0,0.65)', caretColor: 'rgba(0,0,0,0.65)' }}
        />
        <button
          onClick={handleSubmit}
          className="transition-colors flex-shrink-0" style={{ color: 'rgba(0,0,0,0.30)' }}
        >
          <ArrowRight size={14} />
        </button>
      </div>

      {response && (
        <div
          className="px-3 py-2.5 rounded-lg"
          style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.07)' }}
        >
          <p className="text-xs leading-relaxed italic" style={{ color: 'rgba(0,0,0,0.60)' }}>"{response}"</p>
          {responseNodeId && (
            <button
              onClick={() => onFocusNode(responseNodeId)}
              className="mt-2 text-xs transition-colors" style={{ color: 'rgba(0,0,0,0.35)' }}
            >
              → view in graph
            </button>
          )}
        </div>
      )}
    </div>
  )
}
