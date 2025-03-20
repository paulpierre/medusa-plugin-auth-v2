export interface AuthProviderConfig {
  clientId: string
  clientSecret: string
  callbackUrl: string
  scope?: string[]
  additionalOptions?: Record<string, unknown>
}

export interface AuthProviderConfigs {
  google?: AuthProviderConfig
  facebook?: AuthProviderConfig
  twitter?: AuthProviderConfig
  github?: AuthProviderConfig
  linkedin?: AuthProviderConfig
  microsoft?: AuthProviderConfig
}

export interface SessionConfig {
  name?: string
  secret: string
  ttl?: number
  domain?: string
}

export interface JWTConfig {
  secret: string
  ttl?: number
}

export interface RedirectConfig {
  success?: string
  failure?: string
}

export interface AuthConfig {
  /**
   * Cookie settings for the auth session
   */
  session?: SessionConfig
  /**
   * OAuth provider configurations
   */
  providers: AuthProviderConfigs
  /**
   * JWT configuration for token generation
   */
  jwt?: JWTConfig
  /**
   * Redirect URLs for auth outcomes
   */
  redirect?: RedirectConfig
}

/**
 * Auth module options extending the base AuthConfig
 * Used when initializing the auth module
 */
export interface AuthOptions extends AuthConfig {
  /**
   * Optional additional configuration specific to module initialization
   */
  enabledProviders?: string[]
  apiPath?: string
  cookieName?: string
  cookieMaxAge?: number
  debug?: boolean
}
