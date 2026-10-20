/**
 * Aurelia Mobile — Authentication URL & Deep Link Parser
 *
 * Handles deep links with format:
 * aurelia://reset-password#access_token=...&refresh_token=...&type=recovery
 * or aurelia://reset-password?code=...
 * or aurelia://reset-password?token_hash=...&type=recovery
 */

export interface ParsedAuthUrl {
  accessToken?: string
  refreshToken?: string
  code?: string
  tokenHash?: string
  type?: string
  error?: string
  errorCode?: string
  errorDescription?: string
}

/**
 * Parses query params and hash fragments from an auth URL or deep link.
 */
export function parseAuthUrl(url: string | null | undefined): ParsedAuthUrl {
  if (!url) return {}

  const result: ParsedAuthUrl = {}

  // Helper to extract key-value pairs from a params string (e.g. "a=1&b=2")
  const parseParams = (paramString: string) => {
    const pairs = paramString.split('&')
    for (const pair of pairs) {
      if (!pair) continue
      const [rawKey, ...valParts] = pair.split('=')
      const rawVal = valParts.join('=')
      if (!rawKey) continue

      const key = decodeURIComponent(rawKey.trim())
      const val = decodeURIComponent(rawVal.replace(/\+/g, ' ').trim())

      switch (key) {
        case 'access_token':
          result.accessToken = val
          break
        case 'refresh_token':
          result.refreshToken = val
          break
        case 'code':
          result.code = val
          break
        case 'token_hash':
          result.tokenHash = val
          break
        case 'type':
          result.type = val
          break
        case 'error':
          result.error = val
          break
        case 'error_code':
          result.errorCode = val
          break
        case 'error_description':
          result.errorDescription = val
          break
      }
    }
  }

  // Check query string: ?key=value
  const queryIndex = url.indexOf('?')
  const hashIndex = url.indexOf('#')

  if (queryIndex !== -1) {
    const end = hashIndex !== -1 && hashIndex > queryIndex ? hashIndex : url.length
    const queryPart = url.substring(queryIndex + 1, end)
    parseParams(queryPart)
  }

  // Check hash fragment: #key=value
  if (hashIndex !== -1) {
    const hashPart = url.substring(hashIndex + 1)
    parseParams(hashPart)
  }

  return result
}

/**
 * Normalizes error messages from Supabase or network exceptions into
 * refined, human-readable user guidance.
 */
export function normalizeAuthError(err: unknown): string {
  if (!err) return 'An unexpected error occurred. Please try again.'

  const message =
    typeof err === 'string'
      ? err
      : (err as { message?: string }).message ||
        (err as { error_description?: string }).error_description ||
        ''

  const lower = message.toLowerCase()

  if (
    lower.includes('network') ||
    lower.includes('fetch') ||
    lower.includes('failed to fetch') ||
    lower.includes('connection')
  ) {
    return 'Unable to connect. Please check your internet connection and try again.'
  }

  if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
    return 'The email or password you entered is incorrect. Please try again.'
  }

  if (lower.includes('user already registered') || lower.includes('already registered')) {
    return 'An account with this email address already exists. Please sign in instead.'
  }

  if (lower.includes('email not confirmed')) {
    return 'Please confirm your email address before signing in. Check your inbox.'
  }

  if (lower.includes('password should be at least') || lower.includes('password is too short')) {
    return 'Password must be at least 6 characters long.'
  }

  if (
    lower.includes('token has expired') ||
    lower.includes('link has expired') ||
    lower.includes('otp has expired') ||
    lower.includes('invalid or has expired')
  ) {
    return 'This password reset link is invalid or has expired. Please request a new one.'
  }

  return message || 'An error occurred during authentication. Please try again.'
}
