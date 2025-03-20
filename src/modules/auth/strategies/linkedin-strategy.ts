import { MedusaContainer } from "@medusajs/types"
import { OAuth2BaseStrategy, OAuth2Options } from "./oauth2-strategy"
import { AuthEventData } from "../types/workflow"
import { AuthProfile, TransformedProfile } from "./base-strategy"
import { Request } from "express"
import { Strategy as LinkedInStrategy, Profile } from "passport-linkedin-oauth2"

export interface LinkedInConfig extends OAuth2Options {
  scope?: string[]
}

export class LinkedInOAuth2Strategy extends OAuth2BaseStrategy {
  protected strategy: LinkedInStrategy

  constructor(container: MedusaContainer, config: LinkedInConfig) {
    super(container, "linkedin", {
      clientID: config.clientID,
      clientSecret: config.clientSecret,
      callbackURL: config.callbackURL,
      scope: config.scope || ["r_liteprofile", "r_emailaddress"]
    })

    const strategyConfig = {
      clientID: this.getOAuth2Config().clientID,
      clientSecret: this.getOAuth2Config().clientSecret,
      callbackURL: this.getOAuth2Config().callbackURL,
      scope: this.getOAuth2Config().scope as string[]
    }

    this.strategy = new LinkedInStrategy(
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
      const linkedInProfile = await this.getProfile(accessToken)
      const transformedProfile = await this.transformProfile(linkedInProfile)

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
    const url = "https://api.linkedin.com/v2/me?projection=(id,firstName,lastName,profilePicture(displayImage~:playableStreams))"
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "cache-control": "no-cache",
      "X-Restli-Protocol-Version": "2.0.0"
    }

    const response = await fetch(url, { headers })
    if (!response.ok) {
      throw new Error("Failed to fetch LinkedIn profile")
    }

    const data = await response.json() as Record<string, any>
    
    // Get email in a separate request as it requires different endpoint
    const emailUrl = "https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))"
    const emailResponse = await fetch(emailUrl, { headers })
    const emailData = await emailResponse.json() as Record<string, any>
    const email = emailData?.elements?.[0]?.["handle~"]?.emailAddress || ""

    const authProfile: AuthProfile = {
      id: data.id,
      email: email,
      firstName: data.firstName?.localized?.en_US || "",
      lastName: data.lastName?.localized?.en_US || "",
      displayName: `${data.firstName?.localized?.en_US || ""} ${data.lastName?.localized?.en_US || ""}`.trim(),
      provider: this.provider,
      metadata: {
        raw: {
          ...data,
          email: emailData
        }
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

    const url = "https://www.linkedin.com/oauth/v2/accessToken"
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString()
    })

    if (!response.ok) {
      throw new Error("Failed to get access token from LinkedIn")
    }

    const data = await response.json() as { access_token?: string }
    if (!data.access_token) {
      throw new Error("No access token received from LinkedIn")
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
