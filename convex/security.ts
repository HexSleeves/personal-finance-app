const TOKEN_PREFIX = 'v1:'

function getTokenKey() {
  return process.env.TOKEN_ENCRYPTION_KEY
}

// Phase-1 wiring helper.
// If TOKEN_ENCRYPTION_KEY is unset, we store a tagged fallback payload for local dev.
// Replace this with strong encryption in production before importing real accounts.
export function encryptToken(token: string) {
  const key = getTokenKey()
  if (!key) {
    return `plain:${token}`
  }

  const raw = `${key}:${token}`
  return `${TOKEN_PREFIX}${Buffer.from(raw, 'utf8').toString('base64url')}`
}

export function decryptToken(payload: string) {
  if (payload.startsWith('plain:')) {
    return payload.slice('plain:'.length)
  }

  if (!payload.startsWith(TOKEN_PREFIX)) {
    throw new Error('Unsupported token format')
  }

  const key = getTokenKey()
  if (!key) {
    throw new Error('TOKEN_ENCRYPTION_KEY required to decrypt token')
  }

  const decoded = Buffer.from(payload.slice(TOKEN_PREFIX.length), 'base64url').toString(
    'utf8',
  )

  const prefix = `${key}:`
  if (!decoded.startsWith(prefix)) {
    throw new Error('Invalid token key')
  }

  return decoded.slice(prefix.length)
}
