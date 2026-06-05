const DEFAULT_FACEBOOK_ACCOUNT_NAMES: Record<string, string> = {
  '1326058508860197': 'Guia do Volante',
  '1772581277320489': 'Retro Mundial Ads',
}

function parseAccountNameOverrides() {
  const raw = process.env.FACEBOOK_ACCOUNT_NAMES
  if (!raw) return {}

  try {
    const parsed = JSON.parse(raw) as Record<string, string>
    return Object.fromEntries(
      Object.entries(parsed).map(([id, name]) => [id.trim(), name.trim()])
    )
  } catch {
    return Object.fromEntries(
      raw
        .split(',')
        .map((item) => item.split('='))
        .filter(([id, name]) => id?.trim() && name?.trim())
        .map(([id, name]) => [id.trim(), name.trim()])
    )
  }
}

export function resolveFacebookAccountName(
  accountId: string,
  candidateName?: string | null,
  existingName?: string | null
) {
  const cleanAccountId = accountId.trim()
  const overrides = parseAccountNameOverrides()
  const configuredName =
    overrides[cleanAccountId] || DEFAULT_FACEBOOK_ACCOUNT_NAMES[cleanAccountId]

  if (configuredName) return configuredName

  const cleanCandidate = candidateName?.trim()
  if (cleanCandidate && cleanCandidate !== cleanAccountId) return cleanCandidate

  const cleanExisting = existingName?.trim()
  if (cleanExisting && cleanExisting !== cleanAccountId) return cleanExisting

  return cleanAccountId
}
