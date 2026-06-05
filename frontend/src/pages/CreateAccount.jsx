import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { generatePassword, generate2FA } from '../services/api'
import {
    AlertCircle, ArrowRight, ChevronLeft, AlertTriangle,
    KeyRound, Smartphone, ShieldCheck, Check,
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
import { primaryBtnStyle, backBtnStyle, labelStyle } from '../components/styles'

const FEATURES = [
    {
        icon: KeyRound,
        title: 'Génération automatique',
        desc: 'Mot de passe de 24 caractères généré côté serveur, chiffré AES-256 et jamais affiché en clair.',
    },
    {
        icon: Smartphone,
        title: 'Connexion par code',
        desc: 'Compatible Google Authenticator, Authy, 1Password : configuration en moins de 30 secondes.',
    },
    {
        icon: ShieldCheck,
        title: "Conformité d'entreprise",
        desc: 'Rotation automatique des credentials tous les 6 mois et audit trail complet de chaque connexion.',
    },
]

const MARKETING = {
    title: (
        <>
            Créez votre accès<br/>
            <span style={{
                background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
            }}>
                en moins d'une minute.
            </span>
        </>
    ),
    subtitle: "Un parcours d'inscription pensé pour les exigences des entreprises modernes, mot de passe fort généré automatiquement, vérification renforcée obligatoire et zéro friction.", 
    features: FEATURES,
    stats: [
        { value: '24 car.', label: 'Mot de passe' },
        { value: '30 sec.', label: 'Configuration du code de sécurité' },
        { value: '6 mois', label: 'Rotation auto' },
    ],
}

const STEP_META = {
    1: { eyebrow: 'Bienvenue',               title: 'Créez votre compte',          subtitle: "Un identifiant unique, un mot de passe sécurisé généré automatiquement." },
    2: { eyebrow: 'Mot de passe',            title: 'Récupérez vos identifiants',  subtitle: "Scannez le QR code à usage unique avec votre appareil photo ou gestionnaire de mots de passe." },
    3: { eyebrow: 'Sécurité renforcée', title: 'Activez le code de sécurité', subtitle: "Ajoutez une couche de sécurité supplémentaire avec votre application d'authentification." },
    4: { eyebrow: 'Codes de secours',        title: 'Sauvegardez vos 10 codes',    subtitle: "Ces codes vous permettront de récupérer votre compte si vous perdez votre téléphone. Ils ne seront plus jamais affichés." },
}

export default function CreateAccount() {
    const navigate = useNavigate()
    const [step, setStep] = useState(1)
    const [username, setUsername] = useState('')
    const [passwordQR, setPasswordQR] = useState('')
    const [tfaQR, setTfaQR] = useState('')
    const [backupCodes, setBackupCodes] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [confirmed, setConfirmed] = useState(false)

    const handleGeneratePassword = async (e) => {
        e.preventDefault()
        if (!username.trim()) { setError("Veuillez entrer un nom d'utilisateur."); return }
        setLoading(true); setError('')
        try {
            const data = await generatePassword(username)
            setPasswordQR(data.qr_code)
            setStep(2)
        } catch {
            setError("Ce nom d'utilisateur est déjà pris ou une erreur est survenue.")
        } finally { setLoading(false) }
    }

    const handleGenerate2FA = async () => {
        if (!confirmed) { setError('Veuillez confirmer que vous avez scanné le QR code.'); return }
        setLoading(true); setError('')
        try {
            const data = await generate2FA(username)
            setTfaQR(data.qr_code)
            setBackupCodes(data.backup_codes || [])
            setConfirmed(false)
            setStep(3)
        } catch {
            setError('Une erreur est survenue lors de la génération du code de sécurité.')
        } finally { setLoading(false) }
    }

    const goToBackupCodes = () => {
        if (!confirmed) { setError('Veuillez confirmer que vous avez configuré votre application de sécurité.'); return }
        setConfirmed(false)
        setError('')
        setStep(4)
    }

    const handleFinish = () => {
        if (!confirmed) { setError('Veuillez confirmer que vous avez sauvegardé vos codes de secours.'); return }
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

            <Stepper steps={['Identifiant', 'Mot de passe', 'Sécurité', 'Secours']} current={step}/> 

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

                {/* ── Step 1 : username ── */}
                {step === 1 && (
                    <form onSubmit={handleGeneratePassword}>
                        <div style={{ marginBottom: '20px' }}>
                            <label className="label" style={labelStyle}>Nom d'utilisateur</label>
                            <input
                                className="input"
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                placeholder="ex: jean.dupont"
                                autoFocus
                                style={{ height: '42px', fontSize: '14px' }}
                            />
                        </div>

                        <InfoBox tone="amber" icon={AlertTriangle}>
                            Votre mot de passe sera transmis via un QR code à usage unique. Préparez votre appareil photo ou votre gestionnaire de mots de passe.
                        </InfoBox>

                        <button type="submit" disabled={loading} className="btn btn-primary btn-full" style={primaryBtnStyle}>
                            {loading
                                ? <><Spinner/> Génération en cours...</>
                                : <>Générer mon mot de passe <ArrowRight size={15} strokeWidth={2.25}/></>
                            }
                        </button>

                        <div style={{
                            marginTop: '28px', paddingTop: '22px',
                            borderTop: '1px solid var(--border)',
                            textAlign: 'center',
                        }}>
                            <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>Déjà un compte ? </span>
                            <Link to="/login" style={{ fontSize: '13px', color: 'var(--accent)', textDecoration: 'none', fontWeight: '600' }}>
                                Se connecter
                            </Link>
                        </div>
                    </form>
                )}

                {/* ── Step 2 : password QR ── */}
                {step === 2 && (
                    <div>
                        <QRDisplay
                            src={passwordQR}
                            alt="QR code mot de passe"
                            warning="QR à usage unique, ne quittez pas la page avant de l'avoir scanné."
                        />

                        <ConfirmCheckbox
                            checked={confirmed}
                            onChange={() => { setConfirmed(!confirmed); setError('') }}
                            label="J'ai bien scanné ou photographié le QR code de mon mot de passe."
                        />

                        <button onClick={handleGenerate2FA} disabled={loading} className="btn btn-primary btn-full" style={primaryBtnStyle}>
                            {loading
                                ? <><Spinner/> Génération du code de sécurité...</>
                                : <>Continuer vers la sécurité <ArrowRight size={15} strokeWidth={2.25}/></>
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

                {/* ── Step 3 : QR code de sécurité ── */}
                {step === 3 && (
                    <div>
                        <QRDisplay
                            src={tfaQR}
                            alt="QR code de sécurité"
                            warning="Configurez votre application avant de continuer."
                        />

                        <InfoBox tone="blue">
                            Ouvrez <strong style={{ color: 'var(--text-1)', fontWeight: '600' }}>Google Authenticator</strong> ou <strong style={{ color: 'var(--text-1)', fontWeight: '600' }}>Authy</strong>, appuyez sur "+" et scannez ce QR code. Un code à 6 chiffres sera généré toutes les 30 secondes.
                        </InfoBox>

                        <ConfirmCheckbox
                            checked={confirmed}
                            onChange={() => { setConfirmed(!confirmed); setError('') }}
                            label="J'ai configuré mon application d'authentification."
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

                {/* ── Step 4 : Backup codes ── */}
                {step === 4 && (
                    <div>
                        <BackupCodesDisplay codes={backupCodes}/>

                        <InfoBox tone="amber" icon={AlertTriangle}>
                            <strong style={{ color: 'var(--text-1)', fontWeight: '600' }}>Conservez ces codes hors-ligne.</strong> Si vous perdez votre téléphone, ils sont le seul moyen de récupérer votre compte sans intervention administrateur. Chaque code n'est utilisable qu'une fois.
                        </InfoBox>

                        <ConfirmCheckbox
                            checked={confirmed}
                            onChange={() => { setConfirmed(!confirmed); setError('') }}
                            label="J'ai sauvegardé mes codes de secours en lieu sûr."
                        />

                        <button
                            onClick={handleFinish}
                            disabled={!confirmed}
                            className="btn btn-primary btn-full"
                            style={{ ...primaryBtnStyle, background: 'var(--success)', borderColor: 'var(--success)' }}
                        >
                            <Check size={15} strokeWidth={2.5}/> Terminer et se connecter
                        </button>
                    </div>
                )}
            </StepTransition>
        </AuthLayout>
    )
}
