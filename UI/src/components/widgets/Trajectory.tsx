import type { TrajectoryStep } from '../../data/dashboardData'

interface Props {
  steps: TrajectoryStep[]
  onFocusNode: (nodeId: string) => void
}

export function Trajectory({ steps, onFocusNode }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-widest font-medium mb-2" style={{ color: 'rgba(0,0,0,0.35)' }}>Trajectory</span>
      <div className="flex flex-col">
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1
          return (
            <button
              key={i}
              onClick={() => onFocusNode(step.nodeId)}
              className="flex gap-3 text-left group"
            >
              {/* Timeline line + dot */}
              <div className="flex flex-col items-center flex-shrink-0 w-4">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 transition-all duration-150"
                  style={{
                    backgroundColor: step.future
                      ? 'transparent'
                      : step.current
                        ? '#0f0f1a'
                        : 'rgba(0,0,0,0.2)',
                    border: step.future ? '1.5px dashed rgba(0,0,0,0.25)' : 'none',
                    boxShadow: step.current ? '0 0 6px rgba(0,0,0,0.3)' : 'none',
                  }}
                />
                {!isLast && (
                  <div
                    className="w-px flex-1 my-1"
                    style={{
                      background: step.future
                        ? 'rgba(0,0,0,0.10)'
                        : 'rgba(0,0,0,0.15)',
                      minHeight: '20px',
                    }}
                  />
                )}
              </div>

              {/* Content */}
              <div className="pb-3 flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className="text-xs font-semibold"
                    style={{
                      color: step.current
                        ? '#0f0f1a'
                        : step.future
                          ? 'rgba(0,0,0,0.35)'
                          : 'rgba(0,0,0,0.50)',
                    }}
                  >
                    {step.label}
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: step.current ? 'rgba(0,0,0,0.40)' : 'rgba(0,0,0,0.28)', fontSize: '10px' }}
                  >
                    {step.year}
                  </span>
                </div>
                <p
                  className="text-xs leading-relaxed transition-colors duration-150"
                  style={{
                    color: step.current
                      ? 'rgba(0,0,0,0.55)'
                      : 'rgba(0,0,0,0.35)',
                  }}
                >
                  {step.description}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
