import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { generatePassword, generate2FA } from '../services/api'
import {
    AlertCircle, ArrowRight, ChevronLeft, AlertTriangle,
    RefreshCw, KeyRound, ShieldCheck, Check,
} from 'lucide-react'

import AuthLayout from '../components/AuthLayout'
import Stepper from '../components/Stepper'
import PageHeading from '../components/PageHeading'
import StepTransition from '../components/StepTransition'
import QRDisplay from '../components/QRDisplay'
import ConfirmCheckbox from '../components/ConfirmCheckbox'
import InfoBox from '../components/InfoBox'
import Spinner from '../components/Spinner'
import BackupCodesDisplay from '../components/BackupCodesDisplay'
import { primaryBtnStyle, backBtnStyle } from '../components/styles'

const FEATURES = [
    {
        icon: RefreshCw,
        title: 'Rotation guidée',
        desc: 'Renouvellement en trois étapes : un nouveau mot de passe et un nouveau secret 2FA sont générés.',
    },
    {
        icon: KeyRound,
        title: 'Continuité préservée',
        desc: 'Vos données et préférences restent intactes. Seuls vos identifiants sont remplacés.',
    },
    {
        icon: ShieldCheck,
        title: 'Conformité maintenue',
        desc: 'La rotation tous les six mois respecte la politique de sécurité interne et les exigences RGPD.',
    },
]

const MARKETING = {
    title: (
        <>
            Renouvelez vos identifiants<br/>
            <span style={{
                background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
            }}>
                sans interruption de service.
            </span>
        </>
    ),
    subtitle: "La rotation périodique de vos credentials est une exigence de sécurité. Notre processus la rend rapide, sûre et transparente pour vos équipes.",
    features: FEATURES,
    stats: [
        { value: '< 1 min', label: 'Durée moyenne' },
        { value: '0',       label: 'Interruption' },
        { value: '100%',    label: 'Chiffré' },
    ],
}

const STEP_META = {
    1: { eyebrow: 'Renouvellement',       title: 'Renouvelez vos identifiants', subtitle: "Cette opération remplace votre mot de passe et votre code 2FA actuels. Vos données et préférences sont préservées." },
    2: { eyebrow: 'Nouveau mot de passe', title: 'Récupérez vos identifiants',  subtitle: "Scannez ce QR code à usage unique avec votre appareil photo ou gestionnaire de mots de passe." },
    3: { eyebrow: 'Nouveau code 2FA',     title: 'Reconfigurez la 2FA',         subtitle: "Supprimez l'ancien compte dans votre application, puis scannez ce nouveau QR code." },
    4: { eyebrow: 'Codes de secours',     title: 'Nouveaux codes de secours',   subtitle: "Vos anciens codes sont invalidés. Voici les 10 nouveaux codes, sauvegardez-les dès maintenant." },
}

export default function Renew() {
    const navigate = useNavigate()
    const [username, setUsername] = useState('')
    const [step, setStep] = useState(1)
    const [passwordQR, setPasswordQR] = useState('')
    const [tfaQR, setTfaQR] = useState('')
    const [backupCodes, setBackupCodes] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [confirmed, setConfirmed] = useState(false)

    useEffect(() => {
        const u = sessionStorage.getItem('username')
        if (!u) { navigate('/login'); return }
        setUsername(u)
    }, [navigate])

    const handleStart = async () => {
        if (!confirmed) { setError('Confirmez que vous souhaitez renouveler vos identifiants.'); return }
        setLoading(true); setError('')
        try {
            const data = await generatePassword(username)
            setPasswordQR(data.qr_code)
            setConfirmed(false)
            setStep(2)
        } catch {
            setError('Erreur lors de la génération du nouveau mot de passe.')
        } finally { setLoading(false) }
    }

    const handleGenerate2FA = async () => {
        if (!confirmed) { setError('Confirmez que vous avez scanné le QR code.'); return }
        setLoading(true); setError('')
        try {
            const data = await generate2FA(username)
            setTfaQR(data.qr_code)
            setBackupCodes(data.backup_codes || [])
            setConfirmed(false)
            setStep(3)
        } catch {
            setError('Erreur lors de la génération du nouveau secret 2FA.')
        } finally { setLoading(false) }
    }

    const goToBackupCodes = () => {
        if (!confirmed) { setError('Confirmez que vous avez configuré votre application 2FA.'); return }
        setConfirmed(false)
        setError('')
        setStep(4)
    }

    const handleFinish = () => {
        if (!confirmed) { setError('Confirmez que vous avez sauvegardé vos nouveaux codes de secours.'); return }
        sessionStorage.clear()
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

            <Stepper steps={['Confirmation', 'Mot de passe', '2FA', 'Secours']} current={step}/>

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

                {/* ── Step 1 : confirmation ── */}
                {step === 1 && (
                    <div>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '14px 16px', marginBottom: '18px',
                            background: 'var(--bg-3)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius)',
                        }}>
                            <div style={{
                                width: '36px', height: '36px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--accent) 0%, #7c3aed 100%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontSize: '14px', fontWeight: '600',
                                flexShrink: 0,
                            }}>
                                {username.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: '11.5px', color: 'var(--text-3)', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: '500', marginBottom: '2px' }}>
                                    Compte concerné
                                </p>
                                <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-1)', letterSpacing: '-0.005em', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {username}
                                </p>
                            </div>
                        </div>

                        <InfoBox tone="amber" icon={AlertTriangle}>
                            <strong style={{ color: 'var(--text-1)', fontWeight: '600' }}>Cette action est irréversible.</strong> Votre ancien mot de passe et votre ancien code 2FA seront immédiatement invalidés.
                        </InfoBox>

                        <ConfirmCheckbox
                            checked={confirmed}
                            onChange={() => { setConfirmed(!confirmed); setError('') }}
                            label="Je comprends que mes identifiants actuels seront remplacés."
                        />

                        <button onClick={handleStart} disabled={loading} className="btn btn-primary btn-full" style={primaryBtnStyle}>
                            {loading
                                ? <><Spinner/> Préparation...</>
                                : <>Lancer le renouvellement <ArrowRight size={15} strokeWidth={2.25}/></>
                            }
                        </button>

                        <div style={{
                            marginTop: '24px', paddingTop: '20px',
                            borderTop: '1px solid var(--border)',
                            textAlign: 'center',
                        }}>
                            <Link to="/dashboard" style={{ fontSize: '13px', color: 'var(--text-2)', textDecoration: 'none', fontWeight: '500' }}>
                                Annuler et retourner au tableau de bord
                            </Link>
                        </div>
                    </div>
                )}

                {/* ── Step 2 : new password QR ── */}
                {step === 2 && (
                    <div>
                        <QRDisplay
                            src={passwordQR}
                            alt="QR code nouveau mot de passe"
                            warning="QR à usage unique, ne quittez pas la page avant de l'avoir scanné."
                        />

                        <ConfirmCheckbox
                            checked={confirmed}
                            onChange={() => { setConfirmed(!confirmed); setError('') }}
                            label="J'ai bien scanné ou enregistré mon nouveau mot de passe."
                        />

                        <button onClick={handleGenerate2FA} disabled={loading} className="btn btn-primary btn-full" style={primaryBtnStyle}>
                            {loading
                                ? <><Spinner/> Génération 2FA...</>
                                : <>Continuer vers la 2FA <ArrowRight size={15} strokeWidth={2.25}/></>
                            }
                        </button>

                        <button type="button" onClick={back} style={backBtnStyle}
                            onMouseOver={e => e.currentTarget.style.color = 'var(--text-1)'}
                            onMouseOut={e => e.currentTarget.style.color = 'var(--text-2)'}
                        >
                            <ChevronLeft size={14}/> Retour
                        </button>
                    </div>
                )}

                {/* ── Step 3 : new 2FA QR ── */}
                {step === 3 && (
                    <div>
                        <QRDisplay
                            src={tfaQR}
                            alt="QR code nouveau 2FA"
                            warning="Supprimez l'ancien code 2FA avant de scanner le nouveau."
                        />

                        <InfoBox tone="blue">
                            Dans <strong style={{ color: 'var(--text-1)', fontWeight: '600' }}>Google Authenticator</strong> ou <strong style={{ color: 'var(--text-1)', fontWeight: '600' }}>Authy</strong>, supprimez l'ancien compte COFRAP puis scannez ce nouveau QR code.
                        </InfoBox>

                        <ConfirmCheckbox
                            checked={confirmed}
                            onChange={() => { setConfirmed(!confirmed); setError('') }}
                            label="J'ai reconfiguré mon application d'authentification."
                        />

                        <button onClick={goToBackupCodes} className="btn btn-primary btn-full" style={primaryBtnStyle}>
                            Continuer <ArrowRight size={15} strokeWidth={2.25}/>
                        </button>

                        <button type="button" onClick={back} style={backBtnStyle}
                            onMouseOver={e => e.currentTarget.style.color = 'var(--text-1)'}
                            onMouseOut={e => e.currentTarget.style.color = 'var(--text-2)'}
                        >
                            <ChevronLeft size={14}/> Retour
                        </button>
                    </div>
                )}

                {/* ── Step 4 : New backup codes ── */}
                {step === 4 && (
                    <div>
                        <BackupCodesDisplay codes={backupCodes}/>

                        <InfoBox tone="amber" icon={AlertTriangle}>
                            <strong style={{ color: 'var(--text-1)', fontWeight: '600' }}>Vos anciens codes sont désormais invalidés.</strong> Conservez ces nouveaux codes hors-ligne, ils ne seront plus jamais affichés.
                        </InfoBox>

                        <ConfirmCheckbox
                            checked={confirmed}
                            onChange={() => { setConfirmed(!confirmed); setError('') }}
                            label="J'ai sauvegardé mes nouveaux codes de secours."
                        />

                        <button
                            onClick={handleFinish}
                            disabled={!confirmed}
                            className="btn btn-primary btn-full"
                            style={{ ...primaryBtnStyle, background: 'var(--success)', borderColor: 'var(--success)' }}
                        >
                            <Check size={15} strokeWidth={2.5}/> Terminer le renouvellement
                        </button>
                    </div>
                )}
            </StepTransition>
        </AuthLayout>
    )
}
