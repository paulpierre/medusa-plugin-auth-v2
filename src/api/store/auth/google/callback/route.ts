import type { MedusaRequest, MedusaResponse } from "@medusajs/medusa"
import { GoogleOAuth2Strategy } from "../../../../../modules/auth/strategies/google-strategy"

/**
 * @swagger
 * /store/auth/google/callback:
 *   get:
 *     description: Callback endpoint for Google OAuth2 authentication
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         description: Authorization code
 *       - in: query
 *         name: state
 *         required: false
 *         description: State parameter for CSRF protection
 *     responses:
 *       302:
 *         description: Redirects on successful authentication
 */
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  console.log("[GOOGLE AUTH] Callback received at", new Date().toISOString())

  try {
    const { code, state } = req.query
    if (!code) {
      throw new Error("Authorization code not provided")
    }

    // In Medusa v2, the container is available via req.scope
    const container = req.scope
    if (!container) {
      throw new Error("Container not available in request")
    }

    console.log("[GOOGLE AUTH] Attempting to resolve strategy from container")

    // Try to resolve the strategy
    let googleStrategy: GoogleOAuth2Strategy | null = null

    // Following the Medusa v2 architecture, try these methods in order:
    try {
      // 1. First try: Use container property lookup with type safety
      if (container && (container as any).googleOAuth2Strategy) {
        console.log("[GOOGLE AUTH] Found strategy as direct container property")
        googleStrategy = (container as any).googleOAuth2Strategy;
      }
      // 2. Second try: Use global fallback mechanism
      else if ((global as any).medusaPluginAuthV2GoogleStrategy) {
        console.log("[GOOGLE AUTH] Using global fallback strategy")
        googleStrategy = (global as any).medusaPluginAuthV2GoogleStrategy;
      }
      // 3. Third try: Create a new instance as last resort
      else {
        console.log("[GOOGLE AUTH] Creating new strategy instance as fallback")
        // Get configuration from environment
        const googleConfig = {
          clientID: process.env.GOOGLE_CLIENT_ID || "",
          clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
          callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:9000/store/auth/google/callback",
          scope: ["email", "profile"]
        };

        // Only create if we have credentials
        if (googleConfig.clientID && googleConfig.clientSecret) {
          googleStrategy = new GoogleOAuth2Strategy(container, googleConfig);
        }
      }
    } catch (resolveError) {
      console.error("[GOOGLE AUTH] Error resolving strategy:", resolveError)
    }

    if (!googleStrategy) {
      throw new Error("Could not resolve Google OAuth2 strategy")
    }

    console.log("[GOOGLE AUTH] Strategy found, authenticating with code")

    // Based on the GoogleOAuth2Strategy implementation, we should use the authenticate method
    const authResult = await googleStrategy.authenticate({ code })

    console.log("[GOOGLE AUTH] Authentication successful, calling afterAuth")

    // After successful authentication, call afterAuth to handle post-authentication logic
    const result = await googleStrategy.afterAuth(authResult)

    // Store authentication result in session if needed
    if (req.session) {
      // Log the full profile for debugging
      console.log("[GOOGLE AUTH] Full authentication profile data:",
        JSON.stringify(authResult.profile, null, 2));

      // Use a type assertion or modify the session interface to include custom properties
      (req.session as any).authData = {
        profile: authResult.profile,
        provider: "google",
        accessToken: authResult.accessToken,
        isAuthenticated: true,
        authenticatedAt: new Date().toISOString()
      }

      console.log("[GOOGLE AUTH] Session ID:", req.sessionID);
    }

    console.log("[GOOGLE AUTH] Authentication successful for user:",
      authResult?.profile?.email || "unknown")

    // Redirect to the configured success URL or default
    const successRedirect = process.env.GOOGLE_AUTH_SUCCESS_REDIRECT ||
                           result.redirect ||
                           '/account'

    console.log("[GOOGLE AUTH] Redirecting to:", successRedirect)
    return res.redirect(successRedirect)
  } catch (error) {
    console.error("[GOOGLE AUTH] Error in callback route:", error)

    // Redirect to error page with error information if possible
    const errorRedirect = process.env.GOOGLE_AUTH_ERROR_REDIRECT || '/auth/error'

    if (typeof errorRedirect === 'string' && errorRedirect.startsWith('http')) {
      const errorUrl = new URL(errorRedirect)

      if (error instanceof Error) {
        errorUrl.searchParams.append('error', error.message)
      }

      console.log("[GOOGLE AUTH] Redirecting to error URL:", errorUrl.toString())
      return res.redirect(errorUrl.toString())
    }

    console.log("[GOOGLE AUTH] Redirecting to error path:", errorRedirect)
    return res.redirect(errorRedirect)
  }
}