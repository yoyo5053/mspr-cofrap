import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authenticate } from '../services/api'
import {
    Eye, EyeOff, AlertCircle,
    ShieldCheck, Smartphone, Zap, ArrowRight, ChevronLeft,
} from 'lucide-react'

import AuthLayout from '../components/AuthLayout'
import Stepper from '../components/Stepper'
import PageHeading from '../components/PageHeading'
import StepTransition from '../components/StepTransition'
import Spinner from '../components/Spinner'
import { primaryBtnStyle, backBtnStyle, labelStyle } from '../components/styles'

const FEATURES = [
    {
        icon: ShieldCheck,
        title: 'Authentification sécurisée',
        desc: 'Mot de passe 24 caractères généré automatiquement, chiffré AES-256 en base de données.',
    },
    {
        icon: Smartphone,
        title: 'Double authentification',
        desc: 'Protection TOTP obligatoire avec rotation automatique des credentials tous les 6 mois.',
    },
    {
        icon: Zap,
        title: 'Architecture serverless',
        desc: 'Déployé sur OpenFaaS et Kubernetes : scalabilité et haute disponibilité garanties.',
    },
]

const MARKETING = {
    title: (
        <>
            La sécurité d'entreprise,<br/>
            <span style={{
                background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
            }}>
                simplifiée pour vos équipes.
            </span>
        </>
    ),
    subtitle: "Authentification multi-facteurs, chiffrement de bout en bout et architecture serverless, pensés pour les exigences des entreprises modernes.",
    features: FEATURES,
    stats: [
        { value: '99.99%', label: 'Disponibilité SLA' },
        { value: 'AES-256', label: 'Chiffrement' },
        { value: '24/7', label: 'Support dédié' },
    ],
}

export default function Login() {
    const navigate = useNavigate()
    const [step, setStep] = useState(1)
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [totpCode, setTotpCode] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleStep1 = (e) => {
        e.preventDefault()
        if (!username || !password) { setError('Veuillez remplir tous les champs.'); return }
        setError('')
        setStep(2)
    }

    const handleLogin = async (e) => {
        e.preventDefault()
        if (totpCode.length !== 6) { setError('Le code doit contenir 6 chiffres.'); return }
        setLoading(true); setError('')
        try {
            const data = await authenticate(username, password, totpCode)
            sessionStorage.setItem('username', username)
            sessionStorage.setItem('gendate', data.gendate)
            if (data.expired) { navigate('/renew'); return }
            navigate('/dashboard')
        } catch {
            setError('Identifiants incorrects ou code 2FA invalide.')
        } finally { setLoading(false) }
    }

    const back = () => { setStep(1); setError(''); setTotpCode('') }

    return (
        <AuthLayout marketing={MARKETING}>

            <Stepper steps={['Identifiants', 'Vérification 2FA']} current={step}/>

            <StepTransition stepKey={step}>
                <PageHeading
                    eyebrow={step === 1 ? 'Bienvenue' : 'Sécurité renforcée'}
                    title={step === 1 ? 'Connectez-vous à votre compte' : 'Vérifiez votre identité'}
                    subtitle={step === 1
                        ? "Accédez à votre espace sécurisé COFRAP avec vos identifiants professionnels."
                        : <>Saisissez le code à 6 chiffres généré par votre application d'authentification pour <strong style={{ color: 'var(--text-1)', fontWeight: '600' }}>{username}</strong>.</>}
                />

                {error && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '9px 11px', marginBottom: '16px',
                        borderRadius: 'var(--radius)',
                        background: 'rgba(220,38,38,0.05)',
                        border: '1px solid rgba(220,38,38,0.12)',
                        fontSize: '12.5px', color: 'var(--danger)',
                    }}>
                        <AlertCircle size={13} strokeWidth={2} style={{ flexShrink: 0 }}/>
                        {error}
                    </div>
                )}

                {/* ── Step 1 ── */}
                {step === 1 && (
                    <form onSubmit={handleStep1}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                            <div>
                                <label className="label" style={labelStyle}>Nom d'utilisateur</label>
                                <input
                                    className="input"
                                    type="text"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    placeholder="michel.ranu"
                                    autoFocus
                                    style={{ height: '42px', fontSize: '14px' }}
                                />
                            </div>

                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '7px' }}>
                                    <label className="label" style={{ ...labelStyle, marginBottom: 0 }}>Mot de passe</label>
                                    <Link to="/recover" style={{
                                        fontSize: '12px', color: 'var(--accent)',
                                        textDecoration: 'none', fontWeight: '500',
                                        letterSpacing: '-0.005em',
                                    }}>
                                        Mot de passe oublié ?
                                    </Link>
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        className="input"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="••••••••••••••••••••••••"
                                        style={{ paddingRight: '42px', height: '42px', fontSize: '14px' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(v => !v)}
                                        style={{
                                            position: 'absolute', right: '12px', top: '50%',
                                            transform: 'translateY(-50%)', background: 'none',
                                            border: 'none', cursor: 'pointer',
                                            color: 'var(--text-3)', display: 'flex', padding: 0,
                                        }}
                                    >
                                        {showPassword ? <EyeOff size={16} strokeWidth={1.75}/> : <Eye size={16} strokeWidth={1.75}/>}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary btn-full" style={primaryBtnStyle}>
                            Continuer <ArrowRight size={15} strokeWidth={2.25}/>
                        </button>

                        <div style={{
                            marginTop: '28px', paddingTop: '22px',
                            borderTop: '1px solid var(--border)',
                            textAlign: 'center',
                        }}>
                            <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>Pas encore de compte ? </span>
                            <Link to="/create-account" style={{ fontSize: '13px', color: 'var(--accent)', textDecoration: 'none', fontWeight: '600' }}>
                                Créer un accès
                            </Link>
                        </div>
                    </form>
                )}

                {/* ── Step 2 ── */}
                {step === 2 && (
                    <form onSubmit={handleLogin}>
                        <div style={{ marginBottom: '24px' }}>
                            <label className="label" style={labelStyle}>Code d'authentification</label>
                            <input
                                className="input"
                                type="text"
                                value={totpCode}
                                onChange={e => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="000 000"
                                maxLength={6}
                                autoFocus
                                style={{
                                    textAlign: 'center',
                                    fontSize: '26px',
                                    fontWeight: '600',
                                    letterSpacing: '0.28em',
                                    height: '58px',
                                    fontVariantNumeric: 'tabular-nums',
                                }}
                            />
                            <p style={{
                                marginTop: '10px', fontSize: '12.5px',
                                color: 'var(--text-2)', textAlign: 'center', lineHeight: '1.55',
                            }}>
                                Ouvrez Google Authenticator, code renouvelé toutes les 30 secondes.
                            </p>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-full"
                            disabled={loading || totpCode.length !== 6}
                            style={primaryBtnStyle}
                        >
                            {loading
                                ? <><Spinner/> Vérification...</>
                                : <>Se connecter <ArrowRight size={15} strokeWidth={2.25}/></>
                            }
                        </button>

                        <button type="button" onClick={back} style={backBtnStyle}
                            onMouseOver={e => e.currentTarget.style.color = 'var(--text-1)'}
                            onMouseOut={e => e.currentTarget.style.color = 'var(--text-2)'}
                        >
                            <ChevronLeft size={14}/> Retour
                        </button>
                    </form>
                )}
            </StepTransition>
        </AuthLayout>
    )
}
