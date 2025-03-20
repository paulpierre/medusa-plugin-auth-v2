import { IAuthStrategy } from "../../strategies/base-strategy"
import { AuthEventData } from "../../types/workflow"

export interface WorkflowHook<T> {
  beforeAuth?(data: T): Promise<Partial<T>>
  authenticate(data: T): Promise<Partial<T>>
  afterAuth?(data: T): Promise<Partial<T>>
  onSuccess?(data: T): Promise<Partial<T>>
  onError?(data: T): Promise<Partial<T>>
}

// Auth hook implementing Medusa v2 workflow pattern
export class AuthHook implements WorkflowHook<AuthEventData> {
  private readonly provider: string
  private readonly strategy: IAuthStrategy

  constructor(provider: string, strategy: IAuthStrategy) {
    this.provider = provider
    this.strategy = strategy
  }

  async beforeAuth(data: AuthEventData): Promise<Partial<AuthEventData>> {
    return {
      ...data,
      provider: this.provider,
      metadata: {
        ...data.metadata,
        status: "pending"
      }
    }
  }

  async authenticate(data: AuthEventData): Promise<Partial<AuthEventData>> {
    try {
      return await this.strategy.authenticate(data)
    } catch (error) {
      return {
        ...data,
        error: error as Error,
        metadata: {
          ...data.metadata,
          status: "error"
        }
      }
    }
  }

  async afterAuth(data: AuthEventData): Promise<Partial<AuthEventData>> {
    try {
      return await this.strategy.afterAuth(data)
    } catch (error) {
      return {
        ...data,
        error: error as Error,
        metadata: {
          ...data.metadata,
          status: "error"
        }
      }
    }
  }

  async onSuccess(data: AuthEventData): Promise<Partial<AuthEventData>> {
    try {
      return await this.strategy.onSuccess(data)
    } catch (error) {
      return {
        ...data,
        error: error as Error,
        metadata: {
          ...data.metadata,
          status: "error"
        }
      }
    }
  }

  async onError(data: AuthEventData): Promise<Partial<AuthEventData>> {
    try {
      return await this.strategy.onError(data)
    } catch (error) {
      return {
        ...data,
        error: error as Error,
        metadata: {
          ...data.metadata,
          status: "error"
        }
      }
    }
  }
}
