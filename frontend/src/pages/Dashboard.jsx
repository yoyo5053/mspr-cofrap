import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
    LogOut, Calendar, Clock, ShieldCheck, Check,
    AlertTriangle, KeyRound, Smartphone, ArrowRight,
    Activity, Lock, RefreshCw,
} from 'lucide-react'
import logoUrl from '../assets/logo.png'
import useIsMobile from '../hooks/useIsMobile'
import Skeleton from '../components/Skeleton'

const TOTAL_DAYS = 183

export default function Dashboard() {
    const navigate = useNavigate()
    const isMobile = useIsMobile()
    const [username, setUsername] = useState('')
    const [gendate, setGendate] = useState(null)
    const [genTimestamp, setGenTimestamp] = useState(null)
    const [daysLeft, setDaysLeft] = useState(null)
    const [daysSince, setDaysSince] = useState(null)
    const [status, setStatus] = useState('green')
    const [ready, setReady] = useState(false)

    useEffect(() => {
        const storedUsername = sessionStorage.getItem('username')
        const storedGendate = sessionStorage.getItem('gendate')

        if (!storedUsername) { navigate('/login'); return }
        setUsername(storedUsername)

        if (storedGendate) {
            const genTs = parseInt(storedGendate)
            setGenTimestamp(genTs)
            const now = Math.floor(Date.now() / 1000)
            const sixMonths = 15778800
            const elapsed = now - genTs
            const remaining = sixMonths - elapsed
            const days = Math.floor(remaining / 86400)
            const elapsedDays = Math.floor(elapsed / 86400)
            setDaysLeft(days)
            setDaysSince(elapsedDays)

            if (days <= 0) setStatus('red')
            else if (days <= 30) setStatus('orange')
            else setStatus('green')

            const date = new Date(genTs * 1000)
            setGendate(date.toLocaleDateString('fr-FR', {
                day: '2-digit', month: 'short', year: 'numeric',
            }))
        }

        const t = setTimeout(() => setReady(true), 300)
        return () => clearTimeout(t)
    }, [navigate])

    const handleLogout = () => { sessionStorage.clear(); navigate('/login') }

    const STATUS = {
        green:  { color: 'var(--success)', bg: 'rgba(22,163,74,0.07)',  border: 'rgba(22,163,74,0.22)', label: 'Sécurisé' },
        orange: { color: 'var(--warning)', bg: 'rgba(217,119,6,0.07)',  border: 'rgba(217,119,6,0.22)', label: 'Action requise' },
        red:    { color: 'var(--danger)',  bg: 'rgba(220,38,38,0.07)',  border: 'rgba(220,38,38,0.22)', label: 'Expiré' },
    }
    const s = STATUS[status]

    const expiryDate = genTimestamp
        ? new Date((genTimestamp + 15778800) * 1000).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
        : null

    const usedPct = daysSince != null ? Math.max(0, Math.min(100, (daysSince / TOTAL_DAYS) * 100)) : 0

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

            {/* ── Navbar ── */}
            <header style={{
                background: 'var(--bg-2)',
                borderBottom: '1px solid var(--border)',
                position: 'sticky', top: 0, zIndex: 10,
            }}>
                <div style={{
                    padding: isMobile ? '14px 20px' : '14px 40px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: '12px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '32px', minWidth: 0 }}>
                        <img src={logoUrl} alt="COFRAP" style={{ height: isMobile ? '32px' : '40px', objectFit: 'contain', display: 'block', flexShrink: 0 }}/>

                        {!isMobile && (
                            <nav style={{ display: 'flex', gap: '4px' }}>
                                <NavItem active>Aperçu</NavItem>
                                <NavItem>Sécurité</NavItem>
                                <NavItem>Activité</NavItem>
                                <NavItem>Paramètres</NavItem>
                            </nav>
                        )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px' }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: isMobile ? '3px' : '5px 14px 5px 5px',
                            background: 'var(--bg-2)',
                            border: '1px solid var(--border)',
                            borderRadius: '99px',
                        }}>
                            <div style={{
                                width: isMobile ? '30px' : '28px',
                                height: isMobile ? '30px' : '28px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--accent) 0%, #7c3aed 100%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontSize: '12px', fontWeight: '600',
                                letterSpacing: '0.01em',
                                flexShrink: 0,
                            }}>
                                {username.charAt(0).toUpperCase()}
                            </div>
                            {!isMobile && (
                                <span style={{ fontSize: '13px', color: 'var(--text-1)', fontWeight: '500', letterSpacing: '-0.005em' }}>
                                    {username}
                                </span>
                            )}
                        </div>

                        <button
                            onClick={handleLogout}
                            title="Déconnexion"
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                height: '36px', padding: isMobile ? '0' : '0 12px',
                                width: isMobile ? '36px' : 'auto',
                                justifyContent: 'center',
                                background: 'transparent', border: '1px solid var(--border)',
                                borderRadius: 'var(--radius)',
                                color: 'var(--text-2)', fontSize: '13px', fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                letterSpacing: '-0.005em',
                                flexShrink: 0,
                            }}
                            onMouseOver={e => { e.currentTarget.style.color = 'var(--text-1)'; e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.background = 'var(--bg-3)' }}
                            onMouseOut={e => { e.currentTarget.style.color = 'var(--text-2)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent' }}
                        >
                            <LogOut size={14} strokeWidth={1.75}/>
                            {!isMobile && 'Déconnexion'}
                        </button>
                    </div>
                </div>
            </header>

            {/* ── Main full-width ── */}
            <main style={{ flex: 1, padding: isMobile ? '28px 20px 48px' : '40px 40px 64px' }}>

                {/* Hero header */}
                <section style={{
                    display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
                    gap: '24px', flexWrap: 'wrap',
                    marginBottom: '36px',
                }}>
                    <div>
                        <p style={{
                            fontSize: '11px', fontWeight: '600',
                            color: 'var(--accent)',
                            letterSpacing: '0.14em', textTransform: 'uppercase',
                            marginBottom: '12px',
                        }}>
                            Tableau de bord
                        </p>
                        <h1 style={{
                            fontSize: isMobile ? '26px' : '32px', fontWeight: '600',
                            color: 'var(--text-1)',
                            letterSpacing: '-0.028em',
                            lineHeight: '1.1',
                            marginBottom: '8px',
                            display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
                        }}>
                            Bonjour,&nbsp;
                            {ready ? (
                                <span style={{
                                    background: 'linear-gradient(135deg, var(--accent) 0%, #7c3aed 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                }}>{username}</span>
                            ) : (
                                <Skeleton width={180} height={isMobile ? 30 : 36} radius="6px" style={{ display: 'inline-block' }}/>
                            )}
                        </h1>
                        <p style={{ fontSize: '14.5px', color: 'var(--text-2)', lineHeight: '1.55' }}>
                            Vue d'ensemble de la sécurité de votre compte et de la validité de vos identifiants.
                        </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button style={iconBtnStyle} title="Actualiser" onClick={() => window.location.reload()}>
                            <RefreshCw size={15} strokeWidth={1.75}/>
                        </button>
                        <Link
                            to="/renew"
                            className="btn btn-primary"
                            style={{
                                height: '40px', padding: '0 16px', gap: '8px',
                                fontSize: '13.5px', fontWeight: '600',
                                textDecoration: 'none',
                                letterSpacing: '-0.005em',
                            }}
                        >
                            Renouveler maintenant
                            <ArrowRight size={14} strokeWidth={2.25}/>
                        </Link>
                    </div>
                </section>

                {/* Alerte conditionnelle */}
                {status !== 'green' && (
                    <section style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        gap: '20px', flexWrap: 'wrap',
                        padding: '16px 20px', marginBottom: '28px',
                        background: s.bg,
                        border: `1px solid ${s.border}`,
                        borderRadius: 'var(--radius-lg)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <AlertTriangle size={18} color={s.color} strokeWidth={2}/>
                            <div>
                                <p style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-1)', letterSpacing: '-0.005em' }}>
                                    {status === 'red' ? 'Vos identifiants ont expiré.' : `Expiration dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}.`}
                                </p>
                                <p style={{ fontSize: '12.5px', color: 'var(--text-2)', marginTop: '2px' }}>
                                    {status === 'red'
                                        ? 'Renouvelez vos identifiants pour continuer à accéder à votre compte.'
                                        : 'Pensez à renouveler vos identifiants avant la date limite.'}
                                </p>
                            </div>
                        </div>
                        <Link
                            to="/renew"
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                fontSize: '13px', fontWeight: '600',
                                color: s.color,
                                textDecoration: 'none',
                                letterSpacing: '-0.005em',
                            }}
                        >
                            Renouveler <ArrowRight size={13} strokeWidth={2.25}/>
                        </Link>
                    </section>
                )}

                {/* ── 4 KPI tiles ── */}
                <section style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '0',
                    marginBottom: '32px',
                    background: 'var(--bg-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                }}>
                    <Kpi
                        label="Statut"
                        value={ready ? s.label : <Skeleton width={120} height={22}/>}
                        valueColor={ready ? s.color : null}
                        dotColor={ready ? s.color : null}
                    />
                    <Kpi
                        label="Date de création"
                        value={ready ? (gendate || 'Non disponible') : <Skeleton width={120} height={22}/>}
                        sublabel={ready && daysSince != null ? `Il y a ${daysSince} jour${daysSince > 1 ? 's' : ''}` : null}
                        divider
                    />
                    <Kpi
                        label="Jours restants"
                        value={ready ? (daysLeft != null ? (daysLeft <= 0 ? '0' : daysLeft.toString()) : '-') : <Skeleton width={80} height={22}/>}
                        sublabel={ready ? `Sur ${TOTAL_DAYS} jours` : null}
                        valueColor={ready ? s.color : null}
                        divider
                    />
                    <Kpi
                        label="Date d'expiration"
                        value={ready ? (expiryDate || 'Non disponible') : <Skeleton width={120} height={22}/>}
                        sublabel={ready ? 'Validité 6 mois' : null}
                        divider
                    />
                </section>

                {/* ── Timeline + Security ── */}
                <section style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : '1.4fr 1fr',
                    gap: '20px',
                    marginBottom: '32px',
                }}>

                    {/* Timeline card */}
                    <div style={cardStyle}>
                        <CardHeader
                            icon={Activity}
                            title="Cycle de vie des identifiants"
                            subtitle="Suivi de la validité sur 6 mois"
                        />

                        <div style={{ padding: '24px 8px 8px' }}>
                            {/* Top label : Aujourd'hui (au-dessus, sauf si expiré) */}
                            <div style={{ position: 'relative', height: '32px', marginBottom: '8px' }}>
                                {status !== 'red' && daysSince != null && (
                                    <div style={{
                                        position: 'absolute',
                                        left: `${usedPct}%`,
                                        transform: 'translateX(-50%)',
                                        textAlign: 'center',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        <p style={{ fontSize: '11.5px', fontWeight: '600', color: 'var(--text-1)', letterSpacing: '-0.005em' }}>
                                            Aujourd'hui
                                        </p>
                                        <p style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '1px' }}>
                                            J+{daysSince}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Bar */}
                            <div style={{ position: 'relative', height: '6px', background: 'var(--bg-3)', borderRadius: '99px' }}>
                                <div style={{
                                    position: 'absolute', top: 0, left: 0,
                                    height: '100%',
                                    width: `${usedPct}%`,
                                    background: s.color,
                                    borderRadius: '99px',
                                    transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                                }}/>
                                {/* Création dot */}
                                <div style={dotStyle('0%', 'var(--accent)', true)}/>
                                {/* Aujourd'hui dot (caché si expiré) */}
                                {status !== 'red' && (
                                    <div style={{ ...dotStyle(`${usedPct}%`, s.color, true), boxShadow: `0 0 0 4px ${s.color}22` }}/>
                                )}
                                {/* Expiration dot */}
                                <div style={dotStyle('100%', status === 'red' ? s.color : 'var(--border-hover)', status === 'red')}/>
                            </div>

                            {/* Bottom labels : Création + Expiration */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px' }}>
                                <div>
                                    <p style={{ fontSize: '11.5px', fontWeight: '600', color: 'var(--text-1)', letterSpacing: '-0.005em' }}>
                                        Création
                                    </p>
                                    <p style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '1px' }}>
                                        {gendate || '-'}
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{
                                        fontSize: '11.5px', fontWeight: '600',
                                        color: status === 'red' ? s.color : 'var(--text-1)',
                                        letterSpacing: '-0.005em',
                                    }}>
                                        {status === 'red' ? 'Expiré' : 'Expiration'}
                                    </p>
                                    <p style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '1px' }}>
                                        {expiryDate || '-'}
                                    </p>
                                </div>
                            </div>

                            {/* Stats footer */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '0',
                                marginTop: '28px',
                                padding: '16px 0 4px',
                                borderTop: '1px solid var(--border)',
                            }}>
                                <div>
                                    <p style={{ fontSize: '11.5px', color: 'var(--text-3)', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: '500', marginBottom: '6px' }}>
                                        Validité consommée
                                    </p>
                                    <p style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-1)', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                                        {usedPct.toFixed(0)}%
                                    </p>
                                </div>
                                <div style={{ paddingLeft: '24px', borderLeft: '1px solid var(--border)' }}>
                                    <p style={{ fontSize: '11.5px', color: 'var(--text-3)', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: '500', marginBottom: '6px' }}>
                                        Restant
                                    </p>
                                    <p style={{ fontSize: '20px', fontWeight: '600', color: s.color, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                                        {daysLeft != null && daysLeft > 0 ? `${daysLeft} jours` : '0 jour'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Security card */}
                    <div style={cardStyle}>
                        <CardHeader
                            icon={ShieldCheck}
                            title="Sécurité du compte"
                            subtitle="Mesures de protection actives"
                        />

                        <SecurityRow
                            icon={KeyRound}
                            label="Mot de passe fort"
                            sublabel="24 caractères, AES-256"
                            status="active"
                        />
                        <SecurityRow
                            icon={Smartphone}
                            label="2FA activée"
                            sublabel="TOTP, rotation 30s"
                            status="active"
                        />
                        <SecurityRow
                            icon={Lock}
                            label="Chiffrement de session"
                            sublabel="TLS 1.3"
                            status="active"
                            last
                        />
                    </div>
                </section>

                {/* ── Footer info ── */}
                <footer style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexWrap: 'wrap', gap: '8px',
                    paddingTop: '24px',
                    borderTop: '1px solid var(--border)',
                    fontSize: '12px', color: 'var(--text-3)',
                    letterSpacing: '0.005em',
                }}>
                    <span>COFRAP © 2026 · Solutions logicielles, performance durable.</span>
                    <span>Session sécurisée · TLS 1.3</span>
                </footer>
            </main>

            <style>{`
                @keyframes pulse-dot {
                    0%, 100% { box-shadow: 0 0 0 0 currentColor; }
                    50% { box-shadow: 0 0 0 6px transparent; }
                }
            `}</style>
        </div>
    )
}

/* ── Subcomponents ── */

const cardStyle = {
    background: 'var(--bg-2)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '20px 22px',
}

const iconBtnStyle = {
    width: '36px', height: '36px',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    color: 'var(--text-2)',
    cursor: 'pointer',
    transition: 'all 0.15s',
}

function NavItem({ children, active }) {
    return (
        <button style={{
            padding: '8px 12px',
            background: active ? 'var(--bg-3)' : 'transparent',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            fontWeight: active ? '600' : '500',
            color: active ? 'var(--text-1)' : 'var(--text-2)',
            cursor: 'pointer',
            letterSpacing: '-0.005em',
            transition: 'all 0.15s',
        }}
            onMouseOver={e => { if (!active) e.currentTarget.style.color = 'var(--text-1)' }}
            onMouseOut={e => { if (!active) e.currentTarget.style.color = 'var(--text-2)' }}
        >
            {children}
        </button>
    )
}

function Kpi({ label, value, sublabel, valueColor, dotColor, divider }) {
    return (
        <div style={{
            padding: '20px 22px',
            borderLeft: divider ? '1px solid var(--border)' : 'none',
            minHeight: '92px',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                {dotColor && (
                    <span style={{
                        width: '7px', height: '7px', borderRadius: '50%',
                        background: dotColor,
                        boxShadow: `0 0 6px ${dotColor}`,
                    }}/>
                )}
                <span style={{
                    fontSize: '11.5px', fontWeight: '500',
                    color: 'var(--text-3)',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                }}>
                    {label}
                </span>
            </div>
            <div>
                <p style={{
                    fontSize: '22px', fontWeight: '600',
                    color: valueColor || 'var(--text-1)',
                    letterSpacing: '-0.025em',
                    lineHeight: '1.15',
                    marginBottom: sublabel ? '3px' : 0,
                    fontVariantNumeric: 'tabular-nums',
                }}>
                    {value}
                </p>
                {sublabel && (
                    <p style={{ fontSize: '12px', color: 'var(--text-3)', letterSpacing: '-0.003em' }}>
                        {sublabel}
                    </p>
                )}
            </div>
        </div>
    )
}

function CardHeader({ icon: Icon, title, subtitle }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            paddingBottom: '18px',
            marginBottom: '4px',
            borderBottom: '1px solid var(--border)',
        }}>
            <div style={{
                width: '36px', height: '36px',
                borderRadius: 'var(--radius)',
                background: 'rgba(26,111,212,0.08)',
                border: '1px solid rgba(26,111,212,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <Icon size={16} color="var(--accent)" strokeWidth={1.75}/>
            </div>
            <div>
                <p style={{ fontSize: '14.5px', fontWeight: '600', color: 'var(--text-1)', letterSpacing: '-0.015em' }}>
                    {title}
                </p>
                <p style={{ fontSize: '12.5px', color: 'var(--text-3)', marginTop: '2px' }}>
                    {subtitle}
                </p>
            </div>
        </div>
    )
}

const dotStyle = (left, color, filled) => ({
    position: 'absolute',
    top: '50%', left,
    transform: 'translate(-50%, -50%)',
    width: '12px', height: '12px', borderRadius: '50%',
    background: filled ? color : 'var(--bg-2)',
    border: `2px solid ${color}`,
    transition: 'left 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
})

function SecurityRow({ icon: Icon, label, sublabel, status, last }) {
    const active = status === 'active'
    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 0',
            borderBottom: last ? 'none' : '1px solid var(--border)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                    width: '32px', height: '32px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(26,111,212,0.06)',
                    border: '1px solid rgba(26,111,212,0.14)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    <Icon size={14} color="var(--accent)" strokeWidth={1.75}/>
                </div>
                <div>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-1)', letterSpacing: '-0.005em' }}>
                        {label}
                    </p>
                    <p style={{ fontSize: '11.5px', color: 'var(--text-3)', marginTop: '1px' }}>
                        {sublabel}
                    </p>
                </div>
            </div>
            {active && (
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    padding: '3px 9px',
                    background: 'rgba(22,163,74,0.08)',
                    border: '1px solid rgba(22,163,74,0.20)',
                    borderRadius: '99px',
                }}>
                    <Check size={10} color="var(--success)" strokeWidth={2.75}/>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--success)', letterSpacing: '0.005em' }}>
                        Actif
                    </span>
                </div>
            )}
        </div>
    )
}
