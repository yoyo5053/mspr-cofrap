export default function PageHeading({ eyebrow, title, subtitle }) {
    return (
        <div style={{ marginBottom: '28px' }}>
            {eyebrow && (
                <p style={{
                    fontSize: '11px', fontWeight: '600',
                    color: 'var(--accent)',
                    letterSpacing: '0.14em', textTransform: 'uppercase',
                    marginBottom: '10px',
                }}>
                    {eyebrow}
                </p>
            )}
            <h1 style={{
                fontSize: '30px', fontWeight: '600',
                color: 'var(--text-1)',
                letterSpacing: '-0.025em',
                lineHeight: '1.15',
                marginBottom: '10px',
            }}>
                {title}
            </h1>
            {subtitle && (
                <p style={{
                    fontSize: '14px',
                    color: 'var(--text-2)',
                    lineHeight: '1.55',
                    letterSpacing: '-0.005em',
                }}>
                    {subtitle}
                </p>
            )}
        </div>
    )
}
