import {
  User,
} from "@medusajs/medusa"
import { SubscriberContext } from "./base-subscriber"
import { AuthService } from "../modules/auth/core/services/auth.service"

// Define the subscriber config type
export type SubscriberConfig = {
  event_names: string[];
  subscriber_config: {
    identifier: string;
  };
}

export const AuthEvents = {
  AUTHENTICATED: "auth.authenticated",
  AUTHENTICATION_ERROR: "auth.error",
  USER_CREATED: "auth.user.created",
  USER_UPDATED: "auth.user.updated",
  PROFILE_TRANSFORMED: "auth.profile.transformed",
  AUTH_FLOW_STARTED: "auth.flow.started",
  AUTH_FLOW_COMPLETED: "auth.flow.completed",
  AUTH_STRATEGY_RESOLVED: "auth.strategy.resolved",
  AUTH_PROFILE_VALIDATED: "auth.profile.validated",
} as const

export type AuthEventData = {
  [AuthEvents.AUTHENTICATED]: {
    user: User
    provider: string
  }
  [AuthEvents.AUTHENTICATION_ERROR]: {
    error: Error
    provider: string
  }
  [AuthEvents.USER_CREATED]: {
    user: User
    provider: string
  }
  [AuthEvents.USER_UPDATED]: {
    user: User
    provider: string
  }
  [AuthEvents.PROFILE_TRANSFORMED]: {
    profile: Record<string, any>
    transformedProfile: Record<string, any>
    provider: string
  }
  [AuthEvents.AUTH_FLOW_STARTED]: {
    provider: string
    options: Record<string, any>
  }
  [AuthEvents.AUTH_FLOW_COMPLETED]: {
    success: boolean
    user?: User
    error?: Error
    provider: string
  }
  [AuthEvents.AUTH_STRATEGY_RESOLVED]: {
    provider: string
    strategyName: string
  }
  [AuthEvents.AUTH_PROFILE_VALIDATED]: {
    profile: Record<string, any>
    provider: string
    valid: boolean
    errors?: string[]
  }
}

// Medusa v2 subscriber configuration
export const config: SubscriberConfig = {
  event_names: Object.values(AuthEvents),
  subscriber_config: {
    identifier: "auth-subscriber"
  }
}

// Medusa v2 subscribers need to export event handlers directly
type EventHandlerMap = {
  [key: string]: (data: any, eventName: string) => Promise<void>
}

// Medusa v2 subscribers are functions, not classes
export default function authSubscriber({ eventBusService }) {
  async function handleAuthenticated(data: AuthEventData[typeof AuthEvents.AUTHENTICATED], eventName: string): Promise<void> {
    const { user, provider } = data
    console.log(`User ${user.email} authenticated successfully via ${provider}`)
  }

  async function handleAuthenticationError(data: AuthEventData[typeof AuthEvents.AUTHENTICATION_ERROR], eventName: string): Promise<void> {
    const { error, provider } = data
    console.error(`Authentication error with provider ${provider}:`, error.message)
  }

  async function handleUserCreated(data: AuthEventData[typeof AuthEvents.USER_CREATED], eventName: string): Promise<void> {
    const { user, provider } = data
    console.log(`New user ${user.email} created via ${provider}`)
  }

  async function handleUserUpdated(data: AuthEventData[typeof AuthEvents.USER_UPDATED], eventName: string): Promise<void> {
    const { user, provider } = data
    console.log(`User ${user.email} updated via ${provider}`)
  }

  async function handleProfileTransformed(data: AuthEventData[typeof AuthEvents.PROFILE_TRANSFORMED], eventName: string): Promise<void> {
    const { provider } = data
    console.log(`Profile transformed for provider ${provider}`)
  }

  async function handleAuthFlowStarted(data: AuthEventData[typeof AuthEvents.AUTH_FLOW_STARTED], eventName: string): Promise<void> {
    const { provider, options } = data
    console.log(`Authentication flow started for provider ${provider} with options:`, options)
  }

  async function handleAuthFlowCompleted(data: AuthEventData[typeof AuthEvents.AUTH_FLOW_COMPLETED], eventName: string): Promise<void> {
    const { success, user, error, provider } = data
    if (success && user) {
      console.log(`Authentication flow completed successfully for user ${user.email} via ${provider}`)
    } else if (error) {
      console.error(`Authentication flow failed for provider ${provider}:`, error.message)
    }
  }

  async function handleAuthStrategyResolved(data: AuthEventData[typeof AuthEvents.AUTH_STRATEGY_RESOLVED], eventName: string): Promise<void> {
    const { provider, strategyName } = data
    console.log(`Resolved auth strategy ${strategyName} for provider ${provider}`)
  }

  async function handleAuthProfileValidated(data: AuthEventData[typeof AuthEvents.AUTH_PROFILE_VALIDATED], eventName: string): Promise<void> {
    const { provider, valid, errors } = data
    if (valid) {
      console.log(`Profile validation successful for provider ${provider}`)
    } else {
      console.error(`Profile validation failed for provider ${provider}:`, errors)
    }
  }

  // Create handler map for Medusa v2
  const handlers: EventHandlerMap = {
    [AuthEvents.AUTHENTICATED]: handleAuthenticated,
    [AuthEvents.AUTHENTICATION_ERROR]: handleAuthenticationError,
    [AuthEvents.USER_CREATED]: handleUserCreated,
    [AuthEvents.USER_UPDATED]: handleUserUpdated,
    [AuthEvents.PROFILE_TRANSFORMED]: handleProfileTransformed,
    [AuthEvents.AUTH_FLOW_STARTED]: handleAuthFlowStarted,
    [AuthEvents.AUTH_FLOW_COMPLETED]: handleAuthFlowCompleted,
    [AuthEvents.AUTH_STRATEGY_RESOLVED]: handleAuthStrategyResolved,
    [AuthEvents.AUTH_PROFILE_VALIDATED]: handleAuthProfileValidated,
  }

  // Return handlers directly - each key matches an event name
  return handlers
}
