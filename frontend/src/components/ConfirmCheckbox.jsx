export default function ConfirmCheckbox({ checked, onChange, label }) {
    return (
        <div
            onClick={onChange}
            style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 14px', marginBottom: '16px',
                background: checked ? 'rgba(26,111,212,0.06)' : 'var(--bg-2)',
                border: `1px solid ${checked ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                transition: 'all 0.15s',
            }}
        >
            <div style={{
                width: '18px', height: '18px', borderRadius: '4px',
                background: checked ? 'var(--accent)' : 'var(--bg-2)',
                border: `1.5px solid ${checked ? 'var(--accent)' : 'var(--border-hover)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.15s',
            }}>
                {checked && (
                    <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                )}
            </div>
            <span style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: '1.45' }}>{label}</span>
        </div>
    )
}
