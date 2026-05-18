export default function Stepper({ steps, current }) {
    return (
        <div style={{ marginBottom: '36px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: steps.length === 2 ? '14px' : '12px' }}>
                {steps.map((_, i) => (
                    <span key={i} style={{ display: 'contents' }}>
                        <StepCircle index={i + 1} current={current}/>
                        {i < steps.length - 1 && <ProgressBar filled={current > i + 1}/>}
                    </span>
                ))}
            </div>

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '10px',
                paddingLeft: '2px',
                paddingRight: '2px',
            }}>
                {steps.map((label, i) => (
                    <StepLabel
                        key={i}
                        text={label}
                        active={current === i + 1}
                        reached={current >= i + 1}
                    />
                ))}
            </div>
        </div>
    )
}

function StepCircle({ index, current }) {
    const reached = current >= index
    const completed = current > index
    return (
        <div style={{
            width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
            background: reached ? 'var(--accent)' : 'var(--bg-2)',
            border: `1.5px solid ${reached ? 'var(--accent)' : 'var(--border-hover)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: reached ? '0 0 0 4px rgba(26,111,212,0.10)' : 'none',
            transition: 'all 0.25s ease',
        }}>
            {completed ? (
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
            ) : (
                <span style={{
                    fontSize: '12px', fontWeight: '600',
                    color: reached ? 'white' : 'var(--text-3)',
                }}>{index}</span>
            )}
        </div>
    )
}

function ProgressBar({ filled }) {
    return (
        <div style={{
            flex: 1, height: '2px',
            background: 'var(--border)',
            borderRadius: '2px',
            overflow: 'hidden',
            position: 'relative',
        }}>
            <div style={{
                position: 'absolute', top: 0, left: 0, bottom: 0,
                width: '100%',
                background: 'var(--accent)',
                transformOrigin: 'left center',
                transform: filled ? 'scaleX(1)' : 'scaleX(0)',
                transition: 'transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
            }}/>
        </div>
    )
}

function StepLabel({ text, active, reached }) {
    return (
        <span style={{
            fontSize: '11.5px',
            fontWeight: active ? '600' : '500',
            color: reached ? 'var(--text-1)' : 'var(--text-3)',
            letterSpacing: '0.01em',
            transition: 'color 0.2s',
        }}>{text}</span>
    )
}
