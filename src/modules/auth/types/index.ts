import { MedusaContainer } from "@medusajs/medusa"
import { AuthProviderConfigs } from "./config"

/**
 * Configuration options for the auth module
 */
export interface AuthOptions {
  /**
   * JWT secret for token signing
   */
  jwt_secret?: string

  /**
   * Cookie options for auth tokens
   */
  cookie?: {
    /**
     * Name of the cookie
     */
    name: string
    /**
     * Maximum age of the cookie in milliseconds
     */
    maxAge: number
    /**
     * Whether the cookie should be transmitted over a secure protocol
     */
    secure: boolean
  }

  /**
   * OAuth provider configurations
   */
  providers?: AuthProviderConfigs

  /**
   * Success and failure redirect URLs
   */
  redirect?: {
    success?: string
    failure?: string
  }

  /**
   * OAuth client ID
   * @deprecated Use providers instead
   */
  clientID?: string
  
  /**
   * OAuth client secret
   * @deprecated Use providers instead
   */
  clientSecret?: string
  
  /**
   * OAuth callback URL
   * @deprecated Use providers instead
   */
  callbackURL?: string
}

/**
 * Authentication result interface
 */
export interface AuthenticateResult {
  /**
   * Whether the authentication was successful
   */
  success: boolean
  /**
   * The authenticated user
   */
  user?: Record<string, unknown>
  /**
   * The authentication token
   */
  token?: string
  /**
   * Error message or object if authentication failed
   */
  error?: string | Error
  /**
   * Additional properties can be added
   */
  [key: string]: unknown
}

/**
 * Interface for authentication strategies
 */
export interface AuthStrategy {
  /**
   * Authenticate a user with the provided credentials
   * @param data - Authentication data
   */
  authenticate(data: Record<string, unknown>): Promise<AuthenticateResult>
  
  /**
   * Validate a user token or payload
   * @param payload - Data to validate
   */
  validateUser(payload: Record<string, unknown>): Promise<boolean>
}

// Ensure the AuthenticateResult is properly compatible with Record<string, unknown>
type VerifyAuthResultType = AuthenticateResult extends Record<string, unknown> ? true : false
export const _TYPE_CHECK_AUTH_RESULT: VerifyAuthResultType = true;

export interface AuthModule {
  /**
   * Unique identifier for the module
   */
  id: string
  /**
   * Load the module
   * @param container - Medusa container
   * @param options - Options for the module
   * @returns A promise resolving to the loaded module
   */
  load: (container: MedusaContainer, options?: AuthOptions) => {
    /**
     * Services provided by the module
     */
    services: Array<{
      /**
       * Name of the service
       */
      name: string
      /**
       * Instance of the service
       */
      instance: any
    }>
    /**
     * Routers provided by the module
     */
    routers: Array<{
      /**
       * Name of the router
       */
      name: string
      /**
       * Instance of the router
       */
      instance: any
    }>
    /**
     * Default configuration for the module
     */
    defaultConfig: AuthOptions
  }
}
