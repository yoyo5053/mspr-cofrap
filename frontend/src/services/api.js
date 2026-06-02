import { logInfo, logWarn, logError } from './logger'

const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:8000'

async function fetchWithLogging(endpoint, body, actionName) {
    const url = `${GATEWAY_URL}${endpoint}`
    logInfo(`${actionName} start`, { url, body })
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })

    if (!response.ok) {
        const text = await response.text()
        logError(`${actionName} failed`, { status: response.status, statusText: response.statusText, body: text })
        throw new Error(`${actionName} erreur ${response.status}`)
    }

    const data = await response.json()
    logInfo(`${actionName} success`, { url, data })
    return data
}

export const generatePassword = async (username) => {
    return fetchWithLogging('/function/generate-password', { username }, 'generatePassword')
}

export const generate2FA = async (username) => {
    return fetchWithLogging('/function/generate-2fa', { username }, 'generate2FA')
}

export const authenticate = async (username, password, totpCode) => {
    return fetchWithLogging('/function/authenticate', { username, password, totp_code: totpCode }, 'authenticate')
}

export const recoverWithBackupCode = async (username, backupCode) => {
    return fetchWithLogging('/function/recover-with-backup-code', { username, backup_code: backupCode }, 'recoverWithBackupCode')
}
