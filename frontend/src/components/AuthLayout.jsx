import logoUrl from '../assets/logo.png'
import useIsMobile from '../hooks/useIsMobile'
import MarketingPanel from './MarketingPanel'

export default function AuthLayout({ children, marketing }) {
    const isMobile = useIsMobile()

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex' }}>

            {/* ── Left panel ── */}
            <div style={{
                width: isMobile ? '100%' : '480px',
                flexShrink: 0,
                background: 'var(--bg-2)',
                borderRight: isMobile ? 'none' : '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                padding: isMobile ? '32px 24px' : '40px 56px',
                minHeight: '100vh',
            }}>

                <div style={{
                    marginBottom: isMobile ? '40px' : '56px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    <img src={logoUrl} alt="COFRAP" style={{ height: isMobile ? '60px' : '78px', objectFit: 'contain', display: 'block' }}/>
                </div>

                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    paddingBottom: '40px',
                }}>
                    {children}
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-3)', letterSpacing: '0.01em' }}>
                    COFRAP © 2026 · Solutions logicielles, performance durable.
                </div>
            </div>

            {/* ── Right panel ── */}
            <MarketingPanel {...marketing} hidden={isMobile}/>
        </div>
    )
}
