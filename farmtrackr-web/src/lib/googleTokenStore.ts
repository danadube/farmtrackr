import { prisma } from './prisma'

const DEFAULT_TOKEN_KEY = 'google-primary-account'

export interface StoredGoogleTokenInput {
  key?: string
  provider?: string
  accountEmail?: string | null
  scopes?: string[]
  accessToken: string
  refreshToken?: string | null
  tokenType?: string | null
  expiryDate?: Date | null
}

export async function getGoogleOAuthToken(key: string = DEFAULT_TOKEN_KEY) {
  return prisma.googleOAuthToken.findUnique({
    where: { key },
  })
}

export async function saveGoogleOAuthToken({
  key = DEFAULT_TOKEN_KEY,
  provider = 'google',
  accountEmail = null,
  scopes = [],
  accessToken,
  refreshToken = null,
  tokenType = null,
  expiryDate = null,
}: StoredGoogleTokenInput) {
  return prisma.googleOAuthToken.upsert({
    where: { key },
    update: {
      provider,
      accountEmail: accountEmail ?? null,
      scopes,
      accessToken,
      refreshToken: refreshToken ?? null,
      tokenType,
      expiryDate,
    },
    create: {
      key,
      provider,
      accountEmail: accountEmail ?? null,
      scopes,
      accessToken,
      refreshToken: refreshToken ?? null,
      tokenType,
      expiryDate,
    },
  })
}

export async function deleteGoogleOAuthToken(key: string = DEFAULT_TOKEN_KEY) {
  return prisma.googleOAuthToken.deleteMany({
    where: { key },
  })
}


