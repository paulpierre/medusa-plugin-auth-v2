import { AuthConfig } from "../types/config"

export class ConfigValidator {
  private static validateSession(config: AuthConfig): void {
    if (config.session) {
      if (!config.session.secret) {
        throw new Error("Auth session secret is required when session is enabled")
      }

      if (config.session.ttl && typeof config.session.ttl !== "number") {
        throw new Error("Auth session TTL must be a number")
      }
    }
  }

  private static validateJWT(config: AuthConfig): void {
    if (config.jwt) {
      if (!config.jwt.secret) {
        throw new Error("JWT secret is required when JWT is enabled")
      }

      if (config.jwt.ttl && typeof config.jwt.ttl !== "number") {
        throw new Error("JWT TTL must be a number")
      }
    }
  }

  private static validateRedirect(config: AuthConfig): void {
    if (config.redirect) {
      if (config.redirect.success && typeof config.redirect.success !== "string") {
        throw new Error("Success redirect URL must be a string")
      }

      if (config.redirect.failure && typeof config.redirect.failure !== "string") {
        throw new Error("Failure redirect URL must be a string")
      }
    }
  }

  private static validateProviders(config: AuthConfig): void {
    if (!config.providers || Object.keys(config.providers).length === 0) {
      throw new Error("At least one auth provider must be configured")
    }

    const providers = config.providers
    Object.entries(providers).forEach(([provider, options]) => {
      if (!options) {
        throw new Error(`Invalid configuration for provider: ${provider}`)
      }

      // Common OAuth2 validations
      if (!options.clientID) {
        throw new Error(`Client ID is required for provider: ${provider}`)
      }

      if (!options.clientSecret) {
        throw new Error(`Client secret is required for provider: ${provider}`)
      }

      if (!options.callbackURL) {
        throw new Error(`Callback URL is required for provider: ${provider}`)
      }

      // Provider-specific validations
      switch (provider) {
        case "twitter":
          if (!(options as any).consumerKey || !(options as any).consumerSecret) {
            throw new Error("Twitter requires consumerKey and consumerSecret")
          }
          break
        case "microsoft":
          if ((options as any).tenant && typeof (options as any).tenant !== "string") {
            throw new Error("Microsoft tenant must be a string")
          }
          break
      }
    })
  }

  public static validate(config: AuthConfig): void {
    this.validateSession(config)
    this.validateJWT(config)
    this.validateRedirect(config)
    this.validateProviders(config)
  }
}
