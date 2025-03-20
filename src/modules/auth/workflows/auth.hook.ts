import { MedusaContainer } from "@medusajs/types"
import { BaseStrategy } from "../strategies/base-strategy"
import { AuthWorkflowData } from "./types"
import { User } from "@medusajs/medusa"
import { EventBusService } from "@medusajs/medusa"

export class AuthHook {
  protected readonly container: MedusaContainer

  constructor(options: { container: MedusaContainer }) {
    this.container = options.container
  }

  async beforeAuthenticate(
    data: AuthWorkflowData, 
    options?: { provider?: string }
  ): Promise<AuthWorkflowData> {
    try {
      const provider = options?.provider || data.provider
      if (!provider) {
        throw new Error("Provider is required")
      }

      const strategy = this.container.resolve<BaseStrategy>(`auth_${provider}`)
      if (!strategy) {
        throw new Error(`Strategy for provider ${provider} not found`)
      }

      return {
        ...data,
        strategy,
        provider,
        metadata: {
          ...data.metadata,
          provider,
        },
      }
    } catch (error) {
      return {
        ...data,
        error: error as Error,
        metadata: {
          ...data.metadata,
          isError: true,
          errorMessage: (error as Error).message,
        },
      }
    }
  }

  async authenticate(
    data: AuthWorkflowData,
    _options?: { provider?: string }
  ): Promise<AuthWorkflowData> {
    try {
      if (data.error || !data.strategy) {
        return data
      }

      // Here we're making a clean copy of the data object to pass to the strategy
      // to ensure type compatibility
      const authData: Record<string, unknown> = {
        ...(data.metadata || {}),
        provider: data.provider
      }
      
      const result = await data.strategy.authenticate(authData)
      return {
        ...data,
        ...(result || {}),
        metadata: {
          ...data.metadata,
          ...(result?.metadata || {}),
        },
      }
    } catch (error) {
      return {
        ...data,
        error: error as Error,
        metadata: {
          ...data.metadata,
          isError: true,
          errorMessage: (error as Error).message,
        },
      }
    }
  }

  async transformProfile(
    data: AuthWorkflowData,
    _options?: { provider?: string }
  ): Promise<AuthWorkflowData> {
    try {
      if (data.error || !data.strategy || !data.profile) {
        return data
      }

      const transformedProfile = await data.strategy.transformProfile(data.profile)
      return {
        ...data,
        transformedProfile,
        metadata: {
          ...data.metadata,
          transformedProfile,
        },
      }
    } catch (error) {
      return {
        ...data,
        error: error as Error,
        metadata: {
          ...data.metadata,
          isError: true,
          errorMessage: (error as Error).message,
        },
      }
    }
  }

  async createOrUpdateUser(
    data: AuthWorkflowData,
    _options?: { provider?: string }
  ): Promise<AuthWorkflowData> {
    try {
      if (data.error || !data.transformedProfile) {
        return data
      }

      const userService = this.container.resolve("userService")
      
      let user: User | undefined
      // Try to find an existing user
      if (data.transformedProfile.email) {
        user = await userService.retrieveByEmail(data.transformedProfile.email).catch(() => undefined)
      }

      // Create or update user
      if (!user) {
        // Create new user
        user = await userService.create({
          email: data.transformedProfile.email,
          first_name: data.transformedProfile.first_name,
          last_name: data.transformedProfile.last_name,
          metadata: {
            ...(data.transformedProfile.metadata || {}),
            provider: data.provider,
          },
        })
      } else {
        // Update existing user
        user = await userService.update(user.id, {
          metadata: {
            ...(user.metadata || {}),
            ...(data.transformedProfile.metadata || {}),
            provider: data.provider,
          },
        })
      }

      if (!user) {
        throw new Error("Failed to create or update user")
      }

      return {
        ...data,
        user,
        metadata: {
          ...data.metadata,
          userId: user.id,
        },
      }
    } catch (error) {
      return {
        ...data,
        error: error as Error,
        metadata: {
          ...data.metadata,
          isError: true,
          errorMessage: (error as Error).message,
        },
      }
    }
  }

  async finalize(
    data: AuthWorkflowData,
    _options?: { provider?: string }
  ): Promise<AuthWorkflowData> {
    try {
      if (data.error) {
        // Handle error case
        return {
          ...data,
          metadata: {
            ...data.metadata,
            finalized: true,
            success: false,
          },
        }
      }

      if (!data.user) {
        throw new Error("User is required to finalize authentication")
      }

      // Generate token or session if needed
      const authService = this.container.resolve("authService")
      const token = await authService.createToken(data.user.id)

      // Create a clean copy of the return data with the token
      const finalData: AuthWorkflowData = {
        ...data,
        token,
        metadata: {
          ...data.metadata,
          finalized: true,
          success: true,
          token,
        },
      }

      // Emit event if eventBus is available
      try {
        const eventBus = this.container.resolve<EventBusService>("eventBusService")
        if (eventBus) {
          await eventBus.emit("auth.success", {
            id: data.user.id,
            email: data.user.email,
            provider: data.provider,
          })
        }
      } catch (error) {
        // Silently handle event emission errors
        console.error("Failed to emit auth.success event:", error)
      }

      return finalData
    } catch (error) {
      return {
        ...data,
        error: error as Error,
        metadata: {
          ...data.metadata,
          isError: true,
          errorMessage: (error as Error).message,
          finalized: true,
          success: false,
        },
      }
    }
  }
}
