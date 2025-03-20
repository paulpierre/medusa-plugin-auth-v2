import { MedusaContainer } from "@medusajs/types"
import { AuthEventData } from "../../types/workflow"
import { IAuthStrategy } from "../../strategies/base-strategy"
import { PassportStrategy } from "../../types/strategy"

export class PassportService {
  protected readonly container: MedusaContainer
  protected readonly strategies: Map<string, PassportStrategy>

  constructor(container: MedusaContainer) {
    this.container = container
    this.strategies = new Map()
  }

  registerStrategy(provider: string, strategy: PassportStrategy): void {
    this.strategies.set(provider, strategy)
  }

  getStrategy(provider: string): PassportStrategy | undefined {
    return this.strategies.get(provider)
  }

  authenticate(provider: string, data: AuthEventData): Promise<Partial<AuthEventData>> {
    const strategy = this.getStrategy(provider)
    if (!strategy) {
      return Promise.reject(new Error(`Provider ${provider} is not supported`))
    }

    return new Promise<Partial<AuthEventData>>((resolve, reject) => {
      strategy.authenticate(data)
        .then(result => resolve(result || {}))
        .catch(error => reject(error))
    })
  }

  async handleCallback(
    provider: string,
    data: AuthEventData,
    authStrategy: IAuthStrategy
  ): Promise<Partial<AuthEventData>> {
    try {
      const result = await authStrategy.authenticate(data)
      if (!result) {
        throw new Error("Authentication failed")
      }

      const authResult = await authStrategy.afterAuth(result)
      if (!authResult) {
        throw new Error("After auth failed")
      }

      const successResult = await authStrategy.onSuccess(authResult)
      return successResult || {}
    } catch (error) {
      const errorData: AuthEventData = {
        provider,
        error: error instanceof Error ? error : new Error("Unknown error"),
        ...data
      }
      const errorResult = await authStrategy.onError(errorData)
      return errorResult || {}
    }
  }
}
