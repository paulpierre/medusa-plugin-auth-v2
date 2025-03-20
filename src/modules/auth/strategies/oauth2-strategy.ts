import { MedusaContainer } from "@medusajs/types"
import { BaseStrategy, AuthProfile, TransformedProfile } from "./base-strategy"
import { Request } from "express"
import { AuthEventData } from "../types/workflow"

export interface OAuth2Options extends Record<string, unknown> {
  clientID: string
  clientSecret: string
  callbackURL: string
}

export abstract class OAuth2BaseStrategy extends BaseStrategy {
  constructor(container: MedusaContainer, provider: string, config: OAuth2Options) {
    super(container, provider, config)
  }

  abstract validateCallback(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (error: any, user?: any) => void
  ): Promise<void>

  abstract authenticateRequest(req: Request): void

  abstract transformProfile(profile: AuthProfile): Promise<TransformedProfile>

  abstract authenticate(reqOrData: Request | AuthEventData): Promise<Partial<AuthEventData>>

  protected getOAuth2Config(): OAuth2Options {
    return this.config as OAuth2Options
  }
}
