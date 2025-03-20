import { MedusaContainer } from "@medusajs/types"
import { Request } from "express"
import { AuthEventData } from "../types/workflow"

export interface BaseProfile {
  id: string
  email: string
  displayName: string
  provider: string
  picture?: string
  locale?: string
  verified?: boolean
  metadata: Record<string, unknown>
}

export interface AuthProfile extends BaseProfile {
  firstName: string
  lastName: string
}

export interface TransformedProfile extends BaseProfile {
  first_name: string
  last_name: string
}

export interface IAuthStrategy {
  validateCallback(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (error: any, user?: any) => void
  ): Promise<void>

  authenticateRequest(req: Request): void

  authenticate(reqOrData: Request | AuthEventData): Promise<Partial<AuthEventData>>

  transformProfile(profile: AuthProfile): Promise<TransformedProfile>

  afterAuth(data: AuthEventData): Promise<Partial<AuthEventData>>

  onSuccess(data: AuthEventData): Promise<Partial<AuthEventData>>

  onError(data: AuthEventData): Promise<Partial<AuthEventData>>
}

export abstract class BaseStrategy implements IAuthStrategy {
  protected container: MedusaContainer
  protected provider: string
  protected config: Record<string, unknown>

  constructor(container: MedusaContainer, provider: string, config: Record<string, unknown>) {
    this.container = container
    this.provider = provider
    this.config = config
  }

  abstract validateCallback(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (error: any, user?: any) => void
  ): Promise<void>

  abstract authenticateRequest(req: Request): void

  abstract authenticate(reqOrData: Request | AuthEventData): Promise<Partial<AuthEventData>>

  abstract transformProfile(profile: AuthProfile): Promise<TransformedProfile>

  abstract afterAuth(data: AuthEventData): Promise<Partial<AuthEventData>>

  abstract onSuccess(data: AuthEventData): Promise<Partial<AuthEventData>>

  abstract onError(data: AuthEventData): Promise<Partial<AuthEventData>>

  protected getConfig<T extends Record<string, unknown>>(): T {
    return this.config as T
  }

  protected transformToAuthProfile(transformed: TransformedProfile): AuthProfile {
    const authProfile: AuthProfile = {
      id: transformed.id,
      email: transformed.email,
      firstName: transformed.first_name,
      lastName: transformed.last_name,
      displayName: transformed.displayName,
      provider: transformed.provider,
      picture: transformed.picture,
      locale: transformed.locale,
      verified: transformed.verified,
      metadata: transformed.metadata
    }
    return authProfile
  }

  protected transformToTransformedProfile(auth: AuthProfile): TransformedProfile {
    const transformedProfile: TransformedProfile = {
      id: auth.id,
      email: auth.email,
      first_name: auth.firstName,
      last_name: auth.lastName,
      displayName: auth.displayName,
      provider: auth.provider,
      picture: auth.picture,
      locale: auth.locale,
      verified: auth.verified,
      metadata: auth.metadata
    }
    return transformedProfile
  }
}
