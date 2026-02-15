const AUTH_COOKIE_NAME = 'dropship-session'
const TOKEN_EXPIRY_DAYS = 30
const TOKEN_REFRESH_THRESHOLD_DAYS = 7

const encoder = new TextEncoder()

let cachedKey: CryptoKey | null = null
let cachedSecret: string | null = null

async function getKey(): Promise<CryptoKey> {
  const secret = process.env.AUTH_PASSWORD || 'Dxrk'
  if (cachedKey && cachedSecret === secret) return cachedKey
  const keyMaterial = encoder.encode(secret)
  cachedKey = await crypto.subtle.importKey(
    'raw',
    keyMaterial,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
  cachedSecret = secret
  return cachedKey
}

export async function signToken(payload: Record<string, unknown>, expiryDays?: number): Promise<string> {
  const key = await getKey()
  const days = expiryDays || TOKEN_EXPIRY_DAYS
  const data = JSON.stringify({
    ...payload,
    exp: Date.now() + days * 24 * 60 * 60 * 1000,
    iat: Date.now(),
  })
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(data)
  )
  const sigHex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  const dataB64 = btoa(data)
  return `${dataB64}.${sigHex}`
}

export async function verifyToken(
  token: string
): Promise<Record<string, unknown> | null> {
  try {
    const [dataB64, sigHex] = token.split('.')
    if (!dataB64 || !sigHex) return null

    const data = atob(dataB64)
    const key = await getKey()
    const sigBytes = new Uint8Array(
      sigHex.match(/.{2}/g)!.map((byte) => parseInt(byte, 16))
    )

    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      encoder.encode(data)
    )

    if (!valid) return null

    const payload = JSON.parse(data)
    if (payload.exp && Date.now() > payload.exp) return null

    return payload
  } catch {
    return null
  }
}

/**
 * Check if a token needs refreshing (within REFRESH_THRESHOLD_DAYS of expiry).
 * Returns true if the token should be renewed.
 */
export function tokenNeedsRefresh(payload: Record<string, unknown>): boolean {
  if (!payload.exp) return false
  const exp = payload.exp as number
  const remaining = exp - Date.now()
  const thresholdMs = TOKEN_REFRESH_THRESHOLD_DAYS * 24 * 60 * 60 * 1000
  return remaining < thresholdMs
}

export { AUTH_COOKIE_NAME, TOKEN_EXPIRY_DAYS, TOKEN_REFRESH_THRESHOLD_DAYS }
