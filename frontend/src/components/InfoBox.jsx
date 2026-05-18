const PALETTES = {
    amber: { bg: 'rgba(217,119,6,0.06)', border: 'rgba(217,119,6,0.18)', color: 'var(--warning)' },
    blue:  { bg: 'rgba(26,111,212,0.06)', border: 'rgba(26,111,212,0.18)', color: 'var(--accent)' },
    red:   { bg: 'rgba(220,38,38,0.05)',  border: 'rgba(220,38,38,0.18)',  color: 'var(--danger)' },
    green: { bg: 'rgba(22,163,74,0.06)',  border: 'rgba(22,163,74,0.18)',  color: 'var(--success)' },
}

export default function InfoBox({ tone = 'blue', icon: Icon, children }) {
    const palette = PALETTES[tone] || PALETTES.blue
    return (
        <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '10px',
            padding: '12px 14px', marginBottom: '20px',
            background: palette.bg,
            border: `1px solid ${palette.border}`,
            borderRadius: 'var(--radius)',
        }}>
            {Icon && (
                <Icon size={15} strokeWidth={2} style={{ color: palette.color, flexShrink: 0, marginTop: '2px' }}/>
            )}
            <p style={{
                fontSize: '12.5px',
                color: 'var(--text-2)',
                lineHeight: '1.55',
            }}>{children}</p>
        </div>
    )
}
