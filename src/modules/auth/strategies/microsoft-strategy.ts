import { MedusaContainer } from "@medusajs/types"
import { OAuth2BaseStrategy, OAuth2Options } from "./oauth2-strategy"
import { AuthEventData } from "../types/workflow"
import { AuthProfile, TransformedProfile } from "./base-strategy"
import { Request } from "express"
import { Strategy as MicrosoftStrategy } from "passport-microsoft"

export interface MicrosoftConfig extends OAuth2Options {
  scope?: string[]
  tenant?: string
}

type MicrosoftProfile = {
  id: string
  displayName?: string
  name?: {
    familyName?: string
    givenName?: string
  }
  emails?: Array<{ value: string }>
  _json?: {
    tid?: string
    userPrincipalName?: string
  }
  photos?: Array<{ value: string }>
}

export class MicrosoftOAuth2Strategy extends OAuth2BaseStrategy {
  protected strategy: MicrosoftStrategy
  private tenant: string

  constructor(container: MedusaContainer, config: MicrosoftConfig) {
    super(container, "microsoft", {
      clientID: config.clientID,
      clientSecret: config.clientSecret,
      callbackURL: config.callbackURL,
      scope: config.scope || ["user.read"]
    })

    this.tenant = config.tenant || "common"

    const strategyConfig = {
      clientID: this.getOAuth2Config().clientID,
      clientSecret: this.getOAuth2Config().clientSecret,
      callbackURL: this.getOAuth2Config().callbackURL,
      scope: this.getOAuth2Config().scope as string[],
      tenant: this.tenant
    }

    this.strategy = new MicrosoftStrategy(
      strategyConfig,
      this.validateCallback.bind(this)
    )
  }

  async validateCallback(
    accessToken: string,
    refreshToken: string,
    profile: MicrosoftProfile,
    done: (error: any, user?: any) => void
  ): Promise<void> {
    try {
      const transformedProfile: TransformedProfile = {
        id: profile.id,
        email: profile.emails?.[0]?.value || "",
        first_name: profile.name?.givenName || "",
        last_name: profile.name?.familyName || "",
        displayName: profile.displayName || "",
        provider: this.provider,
        metadata: {
          raw: profile,
          accessToken,
          refreshToken
        }
      }
      const authProfile = this.transformToAuthProfile(transformedProfile)
      done(null, authProfile)
    } catch (error) {
      done(error)
    }
  }

  public authenticateRequest(req: Request): void {
    this.strategy.authenticate(req, { session: false })
  }

  async transformProfile(profile: AuthProfile): Promise<TransformedProfile> {
    return {
      id: profile.id,
      email: profile.email,
      first_name: profile.firstName,
      last_name: profile.lastName,
      displayName: profile.displayName,
      provider: profile.provider,
      metadata: profile.metadata
    }
  }

  async authenticate(reqOrData: Request | AuthEventData): Promise<Partial<AuthEventData>> {
    if (reqOrData instanceof Request) {
      const query = reqOrData.query as Record<string, unknown>
      const code = query?.code as string | undefined

      if (!code) {
        throw new Error("Authorization code is required")
      }

      const accessToken = await this.getAccessToken(code)
      const microsoftProfile = await this.getProfile(accessToken)
      const transformedProfile = await this.transformProfile(microsoftProfile)

      return {
        provider: this.provider,
        accessToken,
        profile: this.transformToAuthProfile(transformedProfile)
      }
    }

    // Handle direct AuthEventData
    if (!this.isAuthEventData(reqOrData)) {
      throw new Error("Invalid auth data format")
    }

    return reqOrData
  }

  private isAuthEventData(data: any): data is AuthEventData {
    return data && typeof data === 'object' && 'provider' in data
  }

  protected async getProfile(accessToken: string): Promise<AuthProfile> {
    const url = "https://graph.microsoft.com/v1.0/me"
    const headers = {
      Authorization: `Bearer ${accessToken}`
    }

    const response = await fetch(url, { headers })
    if (!response.ok) {
      throw new Error("Failed to fetch Microsoft profile")
    }

    const data = await response.json() as Record<string, any>
    
    const authProfile: AuthProfile = {
      id: data.id,
      email: data.mail || data.userPrincipalName || "",
      firstName: data.givenName || "",
      lastName: data.surname || "",
      displayName: data.displayName || "",
      provider: this.provider,
      metadata: {
        raw: data
      }
    }

    return authProfile
  }

  protected async getAccessToken(code: string): Promise<string> {
    const config = this.getOAuth2Config()
    const params = new URLSearchParams({
      client_id: config.clientID,
      client_secret: config.clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: config.callbackURL
    })

    const url = `https://login.microsoftonline.com/${this.tenant}/oauth2/v2.0/token`
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString()
    })

    if (!response.ok) {
      throw new Error("Failed to get access token from Microsoft")
    }

    const data = await response.json() as { access_token?: string }
    if (!data.access_token) {
      throw new Error("No access token received from Microsoft")
    }

    return data.access_token
  }

  async afterAuth(data: AuthEventData): Promise<Partial<AuthEventData>> {
    return data
  }

  async onSuccess(data: AuthEventData): Promise<Partial<AuthEventData>> {
    return {
      ...data,
      metadata: {
        ...data.metadata,
        status: "success"
      }
    }
  }

  async onError(data: AuthEventData): Promise<Partial<AuthEventData>> {
    return {
      ...data,
      metadata: {
        ...data.metadata,
        status: "error"
      }
    }
  }
}
