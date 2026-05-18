import { Link, useNavigate } from 'react-router-dom'
import { Home, ArrowLeft, Compass, FileQuestion } from 'lucide-react'

import AuthLayout from '../components/AuthLayout'
import PageHeading from '../components/PageHeading'

const MARKETING = {
    centered: true,
    illustration: (
        <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '120px', height: '120px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(96,165,250,0.20) 0%, rgba(167,139,250,0.18) 100%)',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 24px rgba(0,0,0,0.25)',
            marginBottom: '36px',
        }}>
            <Compass size={52} color="#ffffff" strokeWidth={1.25}/>
        </div>
    ),
    title: (
        <>
            Cette destination<br/>
            <span style={{
                background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
            }}>
                n'existe pas.
            </span>
        </>
    ),
    subtitle: "Le lien que vous avez suivi est peut-être expiré, ou la ressource a été déplacée. Notre équipe veille à maintenir tous les chemins valides.",
}

export default function NotFound() {
    const navigate = useNavigate()

    return (
        <AuthLayout marketing={MARKETING}>

            {/* Big 404 mark */}
            <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '14px',
                marginBottom: '28px',
            }}>
                <div style={{
                    width: '52px', height: '52px',
                    borderRadius: 'var(--radius-lg)',
                    background: 'rgba(26,111,212,0.08)',
                    border: '1px solid rgba(26,111,212,0.18)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <FileQuestion size={24} color="var(--accent)" strokeWidth={1.75}/>
                </div>
                <span style={{
                    fontSize: '52px', fontWeight: '600',
                    color: 'var(--text-1)',
                    letterSpacing: '-0.04em',
                    lineHeight: 1,
                    fontVariantNumeric: 'tabular-nums',
                }}>
                    404
                </span>
            </div>

            <PageHeading
                eyebrow="Erreur"
                title={<>Page <span style={{
                    background: 'linear-gradient(135deg, var(--accent) 0%, #7c3aed 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                }}>introuvable</span></>}
                subtitle="L'adresse demandée n'existe pas ou a été déplacée. Vérifiez l'URL ou retournez à votre espace COFRAP."
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Link
                    to="/login"
                    className="btn btn-primary btn-full"
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        height: '44px', fontSize: '14px', fontWeight: '600', letterSpacing: '-0.005em',
                        textDecoration: 'none',
                    }}
                >
                    <Home size={15} strokeWidth={2}/>
                    Retour à la connexion
                </Link>

                <button
                    onClick={() => navigate(-1)}
                    style={{
                        width: '100%', height: '40px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        background: 'transparent', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        color: 'var(--text-2)',
                        fontSize: '13.5px', fontWeight: '500',
                        cursor: 'pointer',
                        letterSpacing: '-0.005em',
                        transition: 'all 0.15s',
                    }}
                    onMouseOver={e => { e.currentTarget.style.color = 'var(--text-1)'; e.currentTarget.style.background = 'var(--bg-3)' }}
                    onMouseOut={e => { e.currentTarget.style.color = 'var(--text-2)'; e.currentTarget.style.background = 'transparent' }}
                >
                    <ArrowLeft size={14} strokeWidth={2}/>
                    Page précédente
                </button>
            </div>

            <div style={{
                marginTop: '28px',
                padding: '14px 16px',
                background: 'var(--bg-3)',
                borderRadius: 'var(--radius)',
                fontSize: '12.5px',
                color: 'var(--text-2)',
                lineHeight: '1.55',
            }}>
                Besoin d'aide ? Contactez l'équipe support à <strong style={{ color: 'var(--text-1)', fontWeight: '600' }}>support@cofrap.fr</strong>
            </div>
        </AuthLayout>
    )
}
