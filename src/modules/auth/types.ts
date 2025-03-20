import { User } from "@medusajs/medusa"
import { StepResponse } from "@medusajs/workflows-sdk"
import { MedusaContainer } from "@medusajs/types"

export interface AuthProfile {
  id: string
  email: string
  firstName?: string
  lastName?: string
  displayName?: string
  provider?: string
  metadata?: Record<string, any>
}

export interface AuthStrategy {
  authenticate: (data: Record<string, unknown>) => Promise<Record<string, unknown>>
  transformProfile: (profile: AuthProfile) => Promise<User>
  getStrategyName: () => string
  initialize: (container: MedusaContainer) => Promise<void>
}

export interface AuthModule {
  linkable: {
    auth: boolean
  }
}

export interface AuthOptions {
  clientID: string
  clientSecret: string
  callbackURL: string
  scope?: string[]
}

export interface AuthenticateResult {
  success: boolean
  user?: User
  error?: Error
}

export interface AuthWorkflowData {
  provider: string
  accessToken?: string
  refreshToken?: string
  user?: User
  error?: Error
  strategy?: AuthStrategy
  profile?: AuthProfile
  transformedProfile?: Record<string, unknown>
  data?: Record<string, unknown>
}

export interface AuthWorkflowOptions {
  provider: string
  container: MedusaContainer
  authData?: Record<string, unknown>
}

export interface AuthWorkflowResult {
  success: boolean
  user?: User
  error?: Error
  data?: Record<string, unknown>
}

export interface AuthWorkflowStepResult extends StepResponse<AuthWorkflowData> {}

// Additional types needed for auth events
export type AuthEventData = {
  provider: string
  accessToken?: string
  refreshToken?: string
  user?: User
  error?: Error
  profile?: AuthProfile
  metadata?: Record<string, any>
}
