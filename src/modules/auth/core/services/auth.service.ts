import { MedusaContainer } from "@medusajs/types"
import { AuthEventData } from "../../types/workflow"
import { AuthProfile, IAuthStrategy, TransformedProfile } from "../../strategies/base-strategy"
import { Request } from "express"

export class AuthService {
  private container: MedusaContainer
  private strategies: Map<string, IAuthStrategy>

  constructor(container: MedusaContainer) {
    this.container = container
    this.strategies = new Map()
    this.loadStrategies()
  }

  private loadStrategies(): void {
    // Load strategies from container
    const strategyKeys = Object.keys(this.container).filter(key => key.endsWith("Strategy"))
    for (const key of strategyKeys) {
      const strategy = this.container.resolve<IAuthStrategy>(key)
      const provider = key.replace("Strategy", "").toLowerCase()
      this.registerStrategy(provider, strategy)
    }
  }

  registerStrategy(name: string, strategy: IAuthStrategy): void {
    this.strategies.set(name, strategy)
  }

  async authenticate(provider: string, req: Request): Promise<AuthEventData> {
    const strategy = this.strategies.get(provider)
    if (!strategy) {
      throw new Error(`Authentication strategy not found for provider: ${provider}`)
    }

    try {
      // Check if this is the initial auth request or a callback with 'code'
      if (!req.query.code) {
        // Initial auth request - trigger the OAuth flow
        strategy.authenticateRequest(req)
        // This is important - return an empty object as the OAuth redirect
        // will handle the response, and we shouldn't try to process further
        return { provider } as AuthEventData
      } else {
        // This is a callback request with authorization code
        const result = await strategy.authenticate(req)
        return {
          provider,
          ...result,
        }
      }
    } catch (error) {
      throw new Error(`Authentication failed: ${(error as Error).message}`)
    }
  }

  async validateCallback(provider: string, accessToken: string, refreshToken: string, profile: any): Promise<AuthProfile> {
    const strategy = this.strategies.get(provider)
    if (!strategy) {
      throw new Error(`Authentication strategy not found for provider: ${provider}`)
    }

    return new Promise((resolve, reject) => {
      strategy.validateCallback(accessToken, refreshToken, profile, (error: any, user?: any) => {
        if (error) {
          reject(error)
        } else if (!user) {
          reject(new Error("No user returned from validation"))
        } else {
          resolve(user)
        }
      })
    })
  }

  async transformProfile(provider: string, profile: TransformedProfile): Promise<AuthProfile> {
    const strategy = this.strategies.get(provider)
    if (!strategy) {
      throw new Error(`Authentication strategy not found for provider: ${provider}`)
    }

    return {
      id: profile.id,
      email: profile.email,
      firstName: profile.first_name,
      lastName: profile.last_name,
      displayName: profile.displayName,
      provider,
      metadata: profile.metadata
    }
  }
}
