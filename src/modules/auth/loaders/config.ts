import { MedusaContainer } from "@medusajs/medusa"
import { AuthConfig } from "../types/config"
import { ConfigValidator } from "../validators/config"

export const MEDUSA_AUTH_CONFIG_KEY = "auth_config"

/**
 * Partial default configuration values.
 * Note: Required values like secrets must be provided by the user.
 */
const defaultConfig: Partial<Omit<AuthConfig, "providers" | "session" | "jwt">> = {
  redirect: {
    success: "/",
    failure: "/auth/login",
  },
}

/**
 * Default session configuration without secrets
 */
const defaultSessionConfig = {
  name: "medusa_auth_session",
  ttl: 24 * 60 * 60 * 1000, // 24 hours
  domain: undefined,
}

/**
 * Loads and validates the auth configuration
 */
export async function loadConfig(
  container: MedusaContainer,
  config?: AuthConfig
): Promise<void> {
  try {
    if (!config) {
      throw new Error("Auth configuration is required")
    }

    // Merge provided config with defaults, ensuring required fields are preserved
    const mergedConfig: AuthConfig = {
      ...defaultConfig,
      ...config,
      session: config.session && {
        ...defaultSessionConfig,
        ...config.session,
      },
      jwt: config.jwt,
      redirect: {
        ...defaultConfig.redirect,
        ...config?.redirect,
      },
      // Providers must be provided by the user
      providers: config.providers,
    }

    // Validate the configuration
    ConfigValidator.validate(mergedConfig)

    // Register the config in the container
    container.register(MEDUSA_AUTH_CONFIG_KEY, {
      resolve: () => mergedConfig,
    })
  } catch (error) {
    // Enhance error message for better debugging
    throw new Error(
      `Failed to load auth configuration: ${(error as Error).message}`
    )
  }
}

/**
 * Retrieves the auth configuration from the container
 */
export function getConfig(container: MedusaContainer): AuthConfig {
  try {
    const configResolver = container.resolve<{ resolve: () => AuthConfig }>(MEDUSA_AUTH_CONFIG_KEY)
    if (!configResolver) {
      throw new Error("Auth configuration not found in container")
    }
    return configResolver.resolve()
  } catch (error) {
    throw new Error(`Failed to retrieve auth configuration: ${(error as Error).message}`)
  }
}
