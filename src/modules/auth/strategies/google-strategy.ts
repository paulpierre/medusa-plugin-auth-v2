import { MedusaContainer } from "@medusajs/types"
import { OAuth2BaseStrategy, OAuth2Options } from "./oauth2-strategy"
import { AuthEventData } from "../types/workflow"
import { AuthProfile, TransformedProfile } from "./base-strategy"
import { Request } from "express"
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20"

export interface GoogleConfig extends OAuth2Options {
  scope?: string[]
}

export class GoogleOAuth2Strategy extends OAuth2BaseStrategy {
  protected strategy: GoogleStrategy

  constructor(container: MedusaContainer, config: GoogleConfig) {
    super(container, "google", {
      clientID: config.clientID,
      clientSecret: config.clientSecret,
      callbackURL: config.callbackURL,
      scope: config.scope || ["profile", "email"]
    })

    const strategyConfig = {
      clientID: this.getOAuth2Config().clientID,
      clientSecret: this.getOAuth2Config().clientSecret,
      callbackURL: this.getOAuth2Config().callbackURL,
      scope: this.getOAuth2Config().scope as string[]
    }

    this.strategy = new GoogleStrategy(
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
      console.log("[GOOGLE STRATEGY] Raw profile from Google:", JSON.stringify(profile, null, 2));

      // Enhanced profile transformation with more fields
      const transformedProfile: TransformedProfile = {
        id: profile.id,
        email: profile.emails?.[0]?.value || "",
        first_name: profile.name?.givenName || "",
        last_name: profile.name?.familyName || "",
        displayName: profile.displayName || "",
        provider: this.provider,
        picture: profile.photos?.[0]?.value || "",
        locale: profile._json?.locale || "",
        verified: profile._json?.email_verified || false,
        metadata: {
          raw: profile,
          accessToken,
          refreshToken,
          _json: profile._json || {},
          photos: profile.photos || [],
          emails: profile.emails || [],
          isAuthenticated: true,
          authenticatedAt: new Date().toISOString()
        }
      }
      const authProfile = this.transformToAuthProfile(transformedProfile)
      done(null, authProfile)
    } catch (error) {
      console.error("[GOOGLE STRATEGY] Error in validateCallback:", error);
      done(error)
    }
  }

  public authenticateRequest(req: Request): void {
    console.log("[GOOGLE STRATEGY] authenticateRequest called");

    try {
      const config = this.getOAuth2Config();

      // Get Express response from req
      const res = req.res;
      if (!res) {
        console.error("[GOOGLE STRATEGY] Response object not available on request");
        throw new Error("Response object not available on request");
      }

      // Build the authorization URL manually
      const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      authUrl.searchParams.append("client_id", config.clientID);
      authUrl.searchParams.append("redirect_uri", config.callbackURL);
      authUrl.searchParams.append("response_type", "code");
      authUrl.searchParams.append("scope", (config.scope as string[]).join(" "));
      authUrl.searchParams.append("access_type", "offline");
      authUrl.searchParams.append("prompt", "consent");

      // Add state parameter for security
      const state = Math.random().toString(36).substring(2, 15);
      authUrl.searchParams.append("state", state);

      console.log("[GOOGLE STRATEGY] Redirecting to Google auth URL:", authUrl.toString());

      // Redirect using Express
      res.redirect(authUrl.toString());
    } catch (error) {
      console.error("[GOOGLE STRATEGY] Error in authenticateRequest:", error);
      throw error;
    }
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

  async authenticate(reqOrData: Request | any): Promise<Partial<AuthEventData>> {
    console.log("[GOOGLE STRATEGY] authenticate called with:", typeof reqOrData);

    try {
      // Case 1: Express Request with query parameters
      if (reqOrData instanceof Request && 'query' in reqOrData && reqOrData.query) {
        const code = reqOrData.query['code'];
        if (code && typeof code === 'string') {
          console.log("[GOOGLE STRATEGY] Processing from Express Request with query params");
          return this.handleAuthenticationCode(code);
        }
      }

      // Case 2: Object with code property (from API routes)
      if (reqOrData && typeof reqOrData === 'object' && 'code' in reqOrData) {
        console.log("[GOOGLE STRATEGY] Processing from object with code");
        const code = reqOrData.code as string;
        return this.handleAuthenticationCode(code);
      }

      // Case 3: Already processed AuthEventData
      if (reqOrData && typeof reqOrData === 'object' && 'provider' in reqOrData && reqOrData.provider === this.provider) {
        console.log("[GOOGLE STRATEGY] Passing through existing AuthEventData");
        return reqOrData as AuthEventData;
      }

      throw new Error("Invalid authentication request format");
    } catch (error) {
      console.error("[GOOGLE STRATEGY] Error in authenticate method:", error);
      throw error;
    }
  }

  // Helper method to process authentication code
  private async handleAuthenticationCode(code: string): Promise<Partial<AuthEventData>> {
    if (!code) {
      throw new Error("Authorization code is required");
    }

    console.log("[GOOGLE STRATEGY] Getting access token with code");
    const accessToken = await this.getAccessToken(code);

    console.log("[GOOGLE STRATEGY] Getting profile with access token");
    const googleProfile = await this.getProfile(accessToken);

    console.log("[GOOGLE STRATEGY] Transforming profile");
    const transformedProfile = await this.transformProfile(googleProfile);

    return {
      provider: this.provider,
      accessToken,
      profile: this.transformToAuthProfile(transformedProfile)
    };
  }

  protected async getProfile(accessToken: string): Promise<AuthProfile> {
    const url = "https://www.googleapis.com/oauth2/v3/userinfo"
    const headers = {
      Authorization: `Bearer ${accessToken}`
    }

    const response = await fetch(url, { headers })
    if (!response.ok) {
      throw new Error("Failed to fetch Google profile")
    }

    const data = await response.json() as Record<string, any>

    const authProfile: AuthProfile = {
      id: data.sub,
      email: data.email || "",
      firstName: data.given_name || "",
      lastName: data.family_name || "",
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
      code,
      grant_type: "authorization_code",
      redirect_uri: config.callbackURL
    })

    const url = "https://oauth2.googleapis.com/token"
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString()
    })

    if (!response.ok) {
      const errorData = await response.text();
      console.error("[GOOGLE STRATEGY] Token exchange error:", errorData);
      throw new Error(`Failed to get access token from Google: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as { access_token?: string }
    if (!data.access_token) {
      throw new Error("No access token received from Google")
    }

    return data.access_token
  }

  async afterAuth(data: AuthEventData): Promise<any> {
    console.log("[GOOGLE STRATEGY] afterAuth called");

    try {
      // This is where you would typically create or update a customer account
      // and generate a JWT token for authenticated sessions

      // Mock implementation for testing
      const result = {
        success: true,
        token: "mock_jwt_token_" + Date.now(),
        customer: {
          id: "cus_" + Math.random().toString(36).substring(2, 10),
          email: data.profile?.email || "customer@example.com"
        },
        redirect: process.env.GOOGLE_AUTH_SUCCESS_REDIRECT ||
                  "/auth/success?email=" + encodeURIComponent(data.profile?.email || "")
      };

      console.log("[GOOGLE STRATEGY] afterAuth completed with success");
      return result;
    } catch (error) {
      console.error("[GOOGLE STRATEGY] Error in afterAuth:", error);
      return {
        success: false,
        error: error.message
      };
    }
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

  // Add this method to expose the OAuth2 config
  public getOAuth2Config(): OAuth2Options {
    return super.getOAuth2Config();
  }
}
