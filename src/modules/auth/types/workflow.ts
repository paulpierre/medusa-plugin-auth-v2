import { EntityManager } from "typeorm"
import { AuthConfig } from "./config"
import { User } from "@medusajs/medusa"
import { AuthProfile as BaseAuthProfile, TransformedProfile as BaseTransformedProfile } from "../strategies/base-strategy"

/**
 * Re-exported from base-strategy.ts for compatibility
 */
export type AuthProfile = BaseAuthProfile

/**
 * Re-exported from base-strategy.ts for compatibility
 */
export type TransformedProfile = BaseTransformedProfile

export interface AuthWorkflowData {
  userId?: string
  email?: string
  provider?: string
  accessToken?: string
  refreshToken?: string
  metadata?: Record<string, unknown>
  profile?: AuthProfile
  transformedProfile?: TransformedProfile
  user?: User
  error?: Error
  strategy?: any
}

export interface AuthWorkflowOptions {
  manager: EntityManager
  config: AuthConfig
  authData?: Record<string, unknown>
  error?: Error
}

/**
 * Authentication event data structure
 */
export interface AuthEventData {
  /**
   * Optional user identifier
   */
  userId?: string
  /**
   * User email
   */
  email?: string
  /**
   * Authentication provider (e.g., "facebook", "google")
   */
  provider?: string
  /**
   * OAuth access token
   */
  accessToken?: string
  /**
   * OAuth refresh token
   */
  refreshToken?: string
  /**
   * Additional metadata
   */
  metadata?: Record<string, unknown>
  /**
   * User profile from authentication provider
   */
  profile?: AuthProfile
  /**
   * Transformed user profile
   */
  transformedProfile?: TransformedProfile
  /**
   * User entity if authenticated
   */
  user?: User
  /**
   * Error if any occurred during authentication
   */
  error?: Error
  /**
   * Allows additional properties
   */
  [key: string]: unknown
  /**
   * Whether the authentication was successful
   */
  valid?: boolean
  /**
   * List of errors if authentication failed
   */
  errors?: string[]
  /**
   * Name of the authentication strategy
   */
  strategyName?: string
  /**
   * Additional options
   */
  options?: Record<string, unknown>
}
