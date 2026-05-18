const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:8080'

export const generatePassword = async (username) => {
    const response = await fetch(`${GATEWAY_URL}/function/generate-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
    })
    if (!response.ok) throw new Error('Erreur generate-password')
    return response.json()
}

export const generate2FA = async (username) => {
    const response = await fetch(`${GATEWAY_URL}/function/generate-2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
    })
    if (!response.ok) throw new Error('Erreur generate-2fa')
    return response.json()
}

export const authenticate = async (username, password, totpCode) => {
    const response = await fetch(`${GATEWAY_URL}/function/authenticate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, totp_code: totpCode })
    })
    if (!response.ok) throw new Error('Erreur authenticate')
    return response.json()
}