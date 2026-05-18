import { AlertTriangle } from 'lucide-react'

export default function QRDisplay({ src, alt, warning, loading }) {
    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            marginBottom: '20px',
        }}>
            <div style={{
                padding: '14px',
                background: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-md)',
            }}>
                {src ? (
                    <img
                        src={`data:image/png;base64,${src}`}
                        alt={alt}
                        style={{
                            width: '180px', height: '180px', display: 'block',
                            animation: 'fadeIn 0.4s ease',
                        }}
                    />
                ) : (
                    <div style={{
                        width: '180px', height: '180px',
                        borderRadius: 'var(--radius)',
                        background: 'linear-gradient(90deg, var(--bg-3) 0%, var(--border) 50%, var(--bg-3) 100%)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 1.4s linear infinite',
                    }}/>
                )}
            </div>

            {warning && (
                <div style={{
                    marginTop: '12px',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    fontSize: '11.5px',
                    color: 'var(--danger)',
                    letterSpacing: '-0.005em',
                    textAlign: 'center',
                }}>
                    <AlertTriangle size={13} strokeWidth={2}/>
                    {warning}
                </div>
            )}
        </div>
    )
}
