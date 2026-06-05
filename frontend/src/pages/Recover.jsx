import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { recoverWithBackupCode } from '../services/api'
import {
    AlertCircle, ArrowRight, ChevronLeft, AlertTriangle,
    LifeBuoy, KeyRound, ShieldCheck, Check,
} from 'lucide-react'

import AuthLayout from '../components/AuthLayout'
import Stepper from '../components/Stepper'
import PageHeading from '../components/PageHeading'
import StepTransition from '../components/StepTransition'
import QRDisplay from '../components/QRDisplay'
import ConfirmCheckbox from '../components/ConfirmCheckbox'
import InfoBox from '../components/InfoBox'
import Spinner from '../components/Spinner'
import { primaryBtnStyle, backBtnStyle, labelStyle } from '../components/styles'

const FEATURES = [
    {
        icon: LifeBuoy,
        title: 'Récupération auto-gérée',
        desc: "Utilisez un de vos 10 codes de secours imprimés lors de la création du compte, sans intervention administrateur.",
    },
    {
        icon: KeyRound,
        title: 'Mot de passe régénéré',
        desc: "Un nouveau mot de passe à 24 caractères est généré, l'ancien est immédiatement invalidé.",
    },
    {
        icon: ShieldCheck,
        title: 'Sécurité préservée',
        desc: "Votre configuration d'application reste valide, vous n'avez rien à reconfigurer côté téléphone.",
    },
]

const MARKETING = {
    title: (
        <>
            Récupérez votre accès<br/>
            <span style={{
                background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
            }}>
                avec un code de secours.
            </span>
        </>
    ),
    subtitle: "Les codes de secours sont une bouée de sécurité, à n'utiliser qu'en dernier recours. Chaque code ne fonctionne qu'une seule fois.",
    features: FEATURES,
    stats: [
        { value: '1 code',  label: 'Suffit à récupérer' },
        { value: '24 car.', label: 'Nouveau mot de passe' },
        { value: '0',       label: 'Pas de reconfiguration nécessaire' },
    ],
}

const STEP_META = {
    1: { eyebrow: 'Récupération', title: "Vérifions votre identité",       subtitle: "Saisissez votre nom d'utilisateur et l'un de vos codes de secours pour générer un nouveau mot de passe." },
    2: { eyebrow: 'Nouveau mot de passe', title: 'Récupérez vos identifiants', subtitle: "Scannez ce QR code à usage unique. Votre ancien mot de passe est désormais invalide." },
}

const formatBackupCode = (raw) => {
    const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
    return clean.length > 4 ? `${clean.slice(0, 4)}-${clean.slice(4)}` : clean
}

export default function Recover() {
    const navigate = useNavigate()
    const [step, setStep] = useState(1)
    const [username, setUsername] = useState('')
    const [backupCode, setBackupCode] = useState('')
    const [passwordQR, setPasswordQR] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [confirmed, setConfirmed] = useState(false)

    const handleRecover = async (e) => {
        e.preventDefault()
        if (!username.trim()) { setError("Entrez votre nom d'utilisateur."); return }
        if (backupCode.replace('-', '').length !== 8) { setError('Le code de secours doit contenir 8 caractères.'); return }
        setLoading(true); setError('')
        try {
            const data = await recoverWithBackupCode(username, backupCode)
            if (!data.qr_code) {
                setError('Code de secours invalide ou utilisateur inconnu.')
                return
            }
            setPasswordQR(data.qr_code)
            setConfirmed(false)
            setStep(2)
        } catch (error) {
            setError('Code de secours invalide ou utilisateur inconnu.')
        } finally { setLoading(false) }
    }

    const handleFinish = () => {
        if (!confirmed) { setError('Confirmez que vous avez scanné le QR code.'); return }
        navigate('/login')
    }

    const back = () => {
        if (step === 1) return
        setStep(step - 1)
        setError('')
        setConfirmed(false)
    }

    const meta = STEP_META[step]

    return (
        <AuthLayout marketing={MARKETING}>

            <Stepper steps={['Vérification', 'Nouveau mot de passe']} current={step}/>

            <StepTransition stepKey={step}>
                <PageHeading eyebrow={meta.eyebrow} title={meta.title} subtitle={meta.subtitle}/>

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

                {/* ── Step 1 : credentials + backup code ── */}
                {step === 1 && (
                    <form onSubmit={handleRecover}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
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
                                <label className="label" style={labelStyle}>Code de secours</label>
                                <input
                                    className="input"
                                    type="text"
                                    value={backupCode}
                                    onChange={e => setBackupCode(formatBackupCode(e.target.value))}
                                    placeholder="XXXX-XXXX"
                                    maxLength={9}
                                    style={{
                                        height: '48px',
                                        fontSize: '18px',
                                        fontWeight: '600',
                                        letterSpacing: '0.18em',
                                        textAlign: 'center',
                                        fontFamily: "'SF Mono', Menlo, Consolas, monospace",
                                        fontVariantNumeric: 'tabular-nums',
                                    }}
                                />
                                <p style={{ marginTop: '6px', fontSize: '11.5px', color: 'var(--text-3)', textAlign: 'center' }}>
                                    Format XXXX-XXXX, à usage unique.
                                </p>
                            </div>
                        </div>

                        <InfoBox tone="amber" icon={AlertTriangle}>
                            <strong style={{ color: 'var(--text-1)', fontWeight: '600' }}>Le code utilisé sera brûlé.</strong> Il ne fonctionnera plus après cette opération. Votre code de sécurité reste inchangé.
                        </InfoBox>

                        <button type="submit" disabled={loading} className="btn btn-primary btn-full" style={primaryBtnStyle}>
                            {loading
                                ? <><Spinner/> Vérification...</>
                                : <>Récupérer mon accès <ArrowRight size={15} strokeWidth={2.25}/></>
                            }
                        </button>

                        <div style={{
                            marginTop: '24px', paddingTop: '20px',
                            borderTop: '1px solid var(--border)',
                            textAlign: 'center',
                        }}>
                            <Link to="/login" style={{ fontSize: '13px', color: 'var(--text-2)', textDecoration: 'none', fontWeight: '500' }}>
                                Retour à la connexion
                            </Link>
                        </div>
                    </form>
                )}

                {/* ── Step 2 : new password QR ── */}
                {step === 2 && (
                    <div>
                        <QRDisplay
                            src={passwordQR}
                            alt="QR code nouveau mot de passe"
                            warning="QR à usage unique, ne quittez pas la page avant de l'avoir scanné."
                        />

                        <InfoBox tone="blue">
                            Votre nouveau mot de passe est généré. Pour vous reconnecter, utilisez ce mot de passe <strong style={{ color: 'var(--text-1)', fontWeight: '600' }}>+ votre code de sécurité habituel</strong>. Aucune reconfiguration nécessaire côté téléphone.
                        </InfoBox>

                        <ConfirmCheckbox
                            checked={confirmed}
                            onChange={() => { setConfirmed(!confirmed); setError('') }}
                            label="J'ai bien scanné ou enregistré mon nouveau mot de passe."
                        />

                        <button
                            onClick={handleFinish}
                            disabled={!confirmed}
                            className="btn btn-primary btn-full"
                            style={{ ...primaryBtnStyle, background: 'var(--success)', borderColor: 'var(--success)' }}
                        >
                            <Check size={15} strokeWidth={2.5}/> Aller à la connexion
                        </button>

                        <button type="button" onClick={back} style={backBtnStyle}
                            onMouseOver={e => e.currentTarget.style.color = 'var(--text-1)'}
                            onMouseOut={e => e.currentTarget.style.color = 'var(--text-2)'}
                        >
                            <ChevronLeft size={14}/> Retour
                        </button>
                    </div>
                )}
            </StepTransition>
        </AuthLayout>
    )
}
