export default function MarketingPanel({ title, subtitle, features, stats, illustration, centered, hidden }) {
    if (hidden) return null

    return (
        <div style={{
            flex: 1,
            background: 'var(--accent-dark)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '80px 96px',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Background gradients */}
            <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `
                    radial-gradient(ellipse 80% 60% at 20% 30%, rgba(56,142,255,0.28) 0%, transparent 60%),
                    radial-gradient(ellipse 60% 50% at 85% 80%, rgba(124,58,237,0.18) 0%, transparent 55%),
                    radial-gradient(ellipse 50% 40% at 90% 10%, rgba(26,111,212,0.20) 0%, transparent 50%)
                `,
            }}/>

            <div style={{
                position: 'relative', zIndex: 1,
                width: '100%', maxWidth: '560px',
                margin: '0 auto',
                textAlign: centered ? 'center' : 'left',
            }}>
                {illustration}

                <h2 style={{
                    fontSize: '44px',
                    fontWeight: '600',
                    color: '#ffffff',
                    letterSpacing: '-0.035em',
                    lineHeight: '1.08',
                    marginBottom: '20px',
                }}>
                    {title}
                </h2>

                {subtitle && (
                    <p style={{
                        fontSize: '16px',
                        color: 'rgba(255,255,255,0.62)',
                        lineHeight: '1.6',
                        letterSpacing: '-0.005em',
                        marginBottom: features ? '48px' : 0,
                        maxWidth: '480px',
                        marginLeft: centered ? 'auto' : 0,
                        marginRight: centered ? 'auto' : 0,
                    }}>
                        {subtitle}
                    </p>
                )}

                {features && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {features.map((f, i) => (
                            <FeatureItem key={i} first={i === 0} {...f}/>
                        ))}
                    </div>
                )}

                {stats && (
                    <div style={{
                        marginTop: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '24px',
                        flexWrap: 'wrap',
                        justifyContent: centered ? 'center' : 'flex-start',
                    }}>
                        {stats.map((s, i) => (
                            <span key={i} style={{ display: 'contents' }}>
                                {i > 0 && <StatDivider/>}
                                <Stat {...s}/>
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function FeatureItem({ icon: Icon, title, desc, first }) {
    return (
        <div style={{
            display: 'flex', gap: '20px', alignItems: 'flex-start',
            padding: '20px 4px',
            borderTop: first ? '1px solid rgba(255,255,255,0.10)' : 'none',
            borderBottom: '1px solid rgba(255,255,255,0.10)',
        }}>
            <div style={{
                width: '44px', height: '44px',
                borderRadius: '12px', flexShrink: 0,
                background: 'linear-gradient(135deg, rgba(96,165,250,0.20) 0%, rgba(167,139,250,0.18) 100%)',
                border: '1px solid rgba(255,255,255,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 12px rgba(0,0,0,0.15)',
            }}>
                <Icon size={20} color="#ffffff" strokeWidth={1.75}/>
            </div>
            <div style={{ flex: 1, paddingTop: '2px', textAlign: 'left' }}>
                <div style={{
                    fontSize: '15.5px', fontWeight: '600',
                    color: '#ffffff',
                    marginBottom: '6px',
                    letterSpacing: '-0.015em',
                }}>
                    {title}
                </div>
                <div style={{
                    fontSize: '13.5px',
                    color: 'rgba(255,255,255,0.58)',
                    lineHeight: '1.6',
                    letterSpacing: '-0.003em',
                }}>
                    {desc}
                </div>
            </div>
        </div>
    )
}

function Stat({ value, label }) {
    return (
        <div>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.50)', marginTop: '4px', letterSpacing: '0.005em' }}>{label}</div>
        </div>
    )
}

function StatDivider() {
    return <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.10)' }}/>
}
