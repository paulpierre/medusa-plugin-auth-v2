import { MedusaContainer } from "@medusajs/types"
import { OAuth2BaseStrategy, OAuth2Options } from "./oauth2-strategy"
import { AuthEventData } from "../types/workflow"
import { AuthProfile, TransformedProfile } from "./base-strategy"
import { Request } from "express"
import { Strategy as TwitterStrategy, Profile } from "passport-twitter"

export interface TwitterConfig extends OAuth2Options {
  consumerKey?: string
  consumerSecret?: string
}

type TwitterProfile = {
  id: string
  displayName?: string
  username?: string
  name?: {
    familyName?: string
    givenName?: string
  }
  emails?: Array<{ value: string }>
  photos?: Array<{ value: string }>
  _json?: {
    profile_image_url_https?: string
    email?: string
  }
}

export class TwitterOAuth2Strategy extends OAuth2BaseStrategy {
  protected strategy: TwitterStrategy
  private consumerKey: string
  private consumerSecret: string

  constructor(container: MedusaContainer, config: TwitterConfig) {
    super(container, "twitter", {
      clientID: config.clientID || config.consumerKey || "",
      clientSecret: config.clientSecret || config.consumerSecret || "",
      callbackURL: config.callbackURL
    })

    this.consumerKey = config.consumerKey || config.clientID || ""
    this.consumerSecret = config.consumerSecret || config.clientSecret || ""

    const strategyConfig = {
      consumerKey: this.consumerKey,
      consumerSecret: this.consumerSecret,
      callbackURL: this.getOAuth2Config().callbackURL,
      includeEmail: true,
      passReqToCallback: false as const
    }

    this.strategy = new TwitterStrategy(
      strategyConfig,
      (token: string, tokenSecret: string, profile: Profile, done: (error: any, user?: any) => void) => {
        this.validateCallback(token, tokenSecret, profile as TwitterProfile, done)
      }
    )
  }

  async validateCallback(
    token: string,
    tokenSecret: string,
    profile: TwitterProfile,
    done: (error: any, user?: any) => void
  ): Promise<void> {
    try {
      const transformedProfile: TransformedProfile = {
        id: profile.id,
        email: profile.emails?.[0]?.value || profile._json?.email || "",
        first_name: profile.name?.givenName || "",
        last_name: profile.name?.familyName || "",
        displayName: profile.displayName || profile.username || "",
        provider: this.provider,
        metadata: {
          raw: profile,
          token,
          tokenSecret,
          profileImage: profile._json?.profile_image_url_https,
          username: profile.username
        }
      }
      const authProfile = this.transformToAuthProfile(transformedProfile)
      done(null, authProfile)
    } catch (error) {
      done(error)
    }
  }

  public authenticateRequest(req: Request): void {
    this.strategy.authenticate(req)
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
      const token = query?.oauth_token as string | undefined
      const verifier = query?.oauth_verifier as string | undefined

      if (!token || !verifier) {
        throw new Error("OAuth token and verifier are required")
      }

      return new Promise((resolve, reject) => {
        const handleResponse = (error: any, profile?: TwitterProfile, info?: any) => {
          if (error) {
            reject(error)
            return
          }

          if (!profile) {
            reject(new Error("Failed to get Twitter profile"))
            return
          }

          this.transformProfile({
            id: profile.id,
            email: profile.emails?.[0]?.value || profile._json?.email || "",
            firstName: profile.name?.givenName || "",
            lastName: profile.name?.familyName || "",
            displayName: profile.displayName || profile.username || "",
            provider: this.provider,
            metadata: {
              raw: profile,
              token: info?.token,
              tokenSecret: info?.tokenSecret,
              profileImage: profile._json?.profile_image_url_https,
              username: profile.username
            }
          })
          .then(transformedProfile => {
            resolve({
              provider: this.provider,
              accessToken: info?.token,
              profile: this.transformToAuthProfile(transformedProfile)
            })
          })
          .catch(reject)
        }

        // Attach the callback to the request object
        const req = reqOrData as Request & { _passport?: { instance: { _strategy: (name: string) => any } } }
        if (!req._passport) {
          req._passport = { instance: { _strategy: () => this.strategy } }
        }

        // Call authenticate with the request object
        this.strategy.authenticate(req, handleResponse)
      })
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
