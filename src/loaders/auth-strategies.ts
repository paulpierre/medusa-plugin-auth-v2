import { MedusaContainer } from "@medusajs/medusa"
import { GoogleOAuth2Strategy } from "../modules/auth/strategies/google-strategy"

// Define the types for Google OAuth config
export type GoogleConfig = {
  clientID: string;
  clientSecret: string;
  callbackURL: string;
  scope?: string[];
}

/**
 * Authentication strategy loader for Medusa v2.
 * Dynamically initializes authentication strategies based on configuration.
 *
 * @param container - The MedusaContainer instance
 * @param options - The plugin options
 */
export default async (container: MedusaContainer, options: Record<string, unknown>) => {
  console.log("[AUTH LOADER] Registering Google auth strategy")

  try {
    // Get configuration for Google OAuth
    let googleConfig = (options.google || {}) as GoogleConfig

    // Get Google config from environment variables if not provided in options
    if (!googleConfig.clientID) {
      googleConfig = {
        clientID: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:9000/store/auth/google/callback",
        scope: ["email", "profile"]
      }
    }

    // Validate Google OAuth config
    if (!googleConfig.clientID || !googleConfig.clientSecret) {
      console.warn("[AUTH LOADER] Missing Google OAuth credentials, skipping registration")
      return
    }

    console.log("[AUTH LOADER] Google config found:", {
      hasClientId: !!googleConfig.clientID,
      hasClientSecret: !!googleConfig.clientSecret,
      callbackURL: googleConfig.callbackURL,
      scope: googleConfig.scope
    })

    // Create the strategy instance
    const googleStrategy = new GoogleOAuth2Strategy(container, googleConfig)

    // Store in global as a fallback mechanism (this is not standard MedusaJS pattern but helps with our particular use case)
    ;(global as any).medusaPluginAuthV2GoogleStrategy = googleStrategy;

    // Following best practices for Medusa v2 container registration
    try {
      // Direct property assignment is the most reliable for our use case
      // This approach is non-standard but ensures the strategy is available
      (container as any).googleOAuth2Strategy = googleStrategy;
      console.log("[AUTH LOADER] Registered strategy as direct container property");

      // Also try standard container registration if available
      // But only use the simplest approach to avoid TypeScript errors
      if (typeof container.register === 'function') {
        try {
          // Use any to bypass TypeScript's strict checking
          (container as any).register("googleOAuth2Strategy", googleStrategy);
          console.log("[AUTH LOADER] Registered using simple registration");
        } catch (error) {
          console.log("[AUTH LOADER] Simple registration failed:", error.message);
        }
      }
    } catch (err) {
      console.error("[AUTH LOADER] Registration attempts had errors:", err);
      console.log("[AUTH LOADER] Will use global fallback if needed");
    }

    console.log("[AUTH LOADER] Google OAuth strategy registered successfully with CLIENT_ID:",
      googleConfig.clientID ? googleConfig.clientID.substring(0, 8) + "..." : "undefined")
  } catch (error) {
    console.error("[AUTH LOADER] Error registering Google OAuth strategy:", error)
  }
}