import { MedusaContainer } from "@medusajs/types"
import { OAuth2BaseStrategy, OAuth2Options } from "./oauth2-strategy"
import { AuthEventData } from "../types/workflow"
import { AuthProfile, TransformedProfile } from "./base-strategy"
import { Request } from "express"
import { Strategy as FacebookStrategy, Profile, StrategyOptions } from "passport-facebook"

export interface FacebookConfig extends OAuth2Options {
  graphApiVersion?: string
}

export class FacebookOAuth2Strategy extends OAuth2BaseStrategy {
  protected readonly graphApiVersion: string
  protected strategy: FacebookStrategy

  constructor(
    container: MedusaContainer,
    config: FacebookConfig
  ) {
    super(container, "facebook", {
      clientID: config.clientID,
      clientSecret: config.clientSecret,
      callbackURL: config.callbackURL,
      graphApiVersion: config.graphApiVersion || "v12.0"
    })

    this.graphApiVersion = this.getOAuth2Config().graphApiVersion as string || "v12.0"

    const strategyConfig: StrategyOptions = {
      clientID: this.getOAuth2Config().clientID,
      clientSecret: this.getOAuth2Config().clientSecret,
      callbackURL: this.getOAuth2Config().callbackURL,
      profileFields: ["id", "emails", "name", "displayName"],
      graphAPIVersion: this.graphApiVersion
    }

    this.strategy = new FacebookStrategy(
      strategyConfig,
      this.validateCallback.bind(this)
    )
  }

  async validateCallback(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
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

  authenticateRequest(req: Request): void {
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
      const fbProfile = await this.getProfile(accessToken)
      const transformedProfile = await this.transformProfile(fbProfile)

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
    const fields = ["id", "email", "first_name", "last_name", "name"].join(",")
    const url = `https://graph.facebook.com/${this.graphApiVersion}/me?fields=${fields}&access_token=${accessToken}`
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error("Failed to fetch Facebook profile")
    }

    const data = await response.json() as Record<string, any>
    
    const authProfile: AuthProfile = {
      id: data.id,
      email: data.email || "",
      firstName: data.first_name || "",
      lastName: data.last_name || "",
      displayName: data.name || "",
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
      redirect_uri: config.callbackURL,
      code
    })

    const url = `https://graph.facebook.com/${this.graphApiVersion}/oauth/access_token?${params.toString()}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error("Failed to get access token from Facebook")
    }

    const data = await response.json() as { access_token?: string }
    if (!data.access_token) {
      throw new Error("No access token received from Facebook")
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
