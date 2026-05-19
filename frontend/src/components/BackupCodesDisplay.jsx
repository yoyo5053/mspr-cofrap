import { useState } from 'react'
import { Copy, Download, Printer, Check } from 'lucide-react'

export default function BackupCodesDisplay({ codes }) {
    const [copied, setCopied] = useState(false)

    const formatPlainText = () => {
        const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
        return [
            'COFRAP - Codes de secours',
            `Generes le ${date}`,
            '',
            ...codes,
            '',
            'IMPORTANT',
            '- Chaque code ne fonctionne qu une seule fois.',
            '- Conservez ces codes en lieu sur (gestionnaire de mots de passe, coffre-fort).',
            '- En cas de perte du telephone 2FA, utilisez un code pour reinitialiser votre mot de passe.',
            '',
        ].join('\n')
    }

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(codes.join('\n'))
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            /* clipboard unavailable, no-op */
        }
    }

    const handleDownload = () => {
        const blob = new Blob([formatPlainText()], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `cofrap-backup-codes-${Date.now()}.txt`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const handlePrint = () => {
        const win = window.open('', '_blank')
        if (!win) return
        const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><title>Codes de secours COFRAP</title>
<style>
  body { font-family: -apple-system, system-ui, sans-serif; padding: 40px; color: #0f172a; }
  h1 { font-size: 18px; margin-bottom: 4px; letter-spacing: -0.01em; }
  .sub { color: #475569; font-size: 13px; margin-bottom: 24px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; margin-bottom: 24px; }
  .code { font-family: 'SF Mono', Menlo, Consolas, monospace; font-size: 16px; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; }
  .note { font-size: 12px; color: #475569; line-height: 1.6; border-top: 1px solid #e2e8f0; padding-top: 16px; }
</style></head><body>
<h1>COFRAP - Codes de secours</h1>
<p class="sub">Generes le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
<div class="grid">${codes.map(c => `<div class="code">${c}</div>`).join('')}</div>
<p class="note"><strong>Important :</strong> chaque code ne fonctionne qu une seule fois. Conservez-les hors-ligne. En cas de perte du telephone 2FA, un code permet de reinitialiser votre mot de passe.</p>
</body></html>`
        win.document.write(html)
        win.document.close()
        win.focus()
        setTimeout(() => win.print(), 200)
    }

    return (
        <div style={{ marginBottom: '18px' }}>
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '6px 10px',
                padding: '14px',
                background: 'var(--bg-3)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                marginBottom: '12px',
            }}>
                {codes.map((code, i) => (
                    <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '7px 10px',
                        background: 'var(--bg-2)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        fontFamily: "'SF Mono', Menlo, Consolas, monospace",
                        fontSize: '13.5px',
                        fontWeight: '500',
                        color: 'var(--text-1)',
                        letterSpacing: '0.04em',
                        fontVariantNumeric: 'tabular-nums',
                    }}>
                        <span style={{ color: 'var(--text-3)', fontSize: '11px', minWidth: '14px' }}>
                            {(i + 1).toString().padStart(2, '0')}
                        </span>
                        {code}
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
                <ActionBtn icon={copied ? Check : Copy} label={copied ? 'Copié' : 'Copier'} onClick={handleCopy}/>
                <ActionBtn icon={Download} label="Télécharger" onClick={handleDownload}/>
                <ActionBtn icon={Printer} label="Imprimer" onClick={handlePrint}/>
            </div>
        </div>
    )
}

function ActionBtn({ icon: Icon, label, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={{
                flex: 1,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                height: '34px',
                background: 'var(--bg-2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                color: 'var(--text-2)',
                fontSize: '12.5px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.15s',
                letterSpacing: '-0.005em',
            }}
            onMouseOver={e => { e.currentTarget.style.color = 'var(--text-1)'; e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.background = 'var(--bg-3)' }}
            onMouseOut={e => { e.currentTarget.style.color = 'var(--text-2)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-2)' }}
        >
            <Icon size={13} strokeWidth={1.75}/>
            {label}
        </button>
    )
}
