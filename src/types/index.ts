import { User } from "@medusajs/medusa"

// Simple AuthProfile interface for external use
export interface AuthProfile {
  id: string
  emails: { value: string; type?: string }[]
  displayName?: string
  name?: {
    givenName?: string
    familyName?: string
  }
  photos?: { value: string }[]
  provider: string
}

export interface AuthStrategy {
  validateCallback: (
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (error: any, user?: any, info?: any) => void
  ) => void
  transformProfile: (profile: any) => Promise<User>
}

export interface AuthOptions {
  providers: {
    [key: string]: {
      clientID: string
      clientSecret: string
      callbackUrl: string
      authorizationURL?: string
      tokenURL?: string
      profileURL?: string
      scope?: string[]
    }
  }
}
