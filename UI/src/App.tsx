import { useState, useCallback } from 'react'
import './index.css'
import { Header } from './components/Header'
import { DigitalTwin } from './components/DigitalTwin'
import { Sidebar } from './components/Sidebar'
import { PlansView } from './components/PlansView'
import type { Mode, NodePrivacy } from './data/graphData'

type AppView = 'twin' | 'plans'

function App() {
  const [view, setView] = useState<AppView>('twin')
  const [mode, setMode] = useState<Mode>('federico')
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null)
  const [privacyOverrides, setPrivacyOverrides] = useState<Map<string, NodePrivacy>>(new Map())
  const [friendPreview, setFriendPreview] = useState(false)

  const toggleNodePrivacy = useCallback((nodeId: string, current: NodePrivacy) => {
    setPrivacyOverrides(prev => {
      const next = new Map(prev)
      next.set(nodeId, current === 'private' ? 'public' : 'private')
      return next
    })
  }, [])

  return (
    <div className="flex flex-col w-full h-screen" style={{ background: '#f8f8fc' }}>
      <Header
        view={view}
        onViewChange={setView}
        mode={mode}
        onModeChange={(m) => { setMode(m); setFocusNodeId(null); setFriendPreview(false) }}
        friendPreview={friendPreview}
        onFriendPreviewChange={setFriendPreview}
      />
      <div className="flex flex-1 overflow-hidden">
        {view === 'plans' ? (
          <PlansView />
        ) : (
          <>
            <Sidebar mode={mode} onFocusNode={setFocusNodeId} />
            <DigitalTwin
              mode={mode}
              focusNodeId={focusNodeId}
              privacyOverrides={privacyOverrides}
              friendPreview={friendPreview}
              onTogglePrivacy={toggleNodePrivacy}
            />
          </>
        )}
      </div>
    </div>
  )
}

export default App
