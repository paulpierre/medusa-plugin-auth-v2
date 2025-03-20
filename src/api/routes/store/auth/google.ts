import { Router } from "express"
import { MedusaContainer } from "@medusajs/types"
import { GoogleOAuth2Strategy } from "../../../../modules/auth/strategies/google-strategy"

/**
 * @swagger
 * /auth/google:
 *   get:
 *     description: Initiates the Google OAuth2 authentication flow
 *     responses:
 *       302:
 *         description: Redirects to Google login
 */
export default (router: Router, container: MedusaContainer): void => {
  console.log("[GOOGLE AUTH] Registering routes: /google, /google/callback, /google/test")

  try {
    const googleStrategy = container.resolve<GoogleOAuth2Strategy>("googleOAuth2Strategy")

    if (!googleStrategy) {
      console.error("[GOOGLE AUTH] Failed to resolve googleOAuth2Strategy")
      return
    }

    console.log("[GOOGLE AUTH] Strategy resolved successfully")

    // Initiate Google OAuth flow
    router.get("/google", (req, res) => {
      console.log("[GOOGLE AUTH] Route /google called at", new Date().toISOString())
      try {
        googleStrategy.authenticateRequest(req)
      } catch (error) {
        console.error("[GOOGLE AUTH] Error in /google route:", error)
        res.status(500).json({ error: error.message })
      }
    })

    // Google OAuth callback handler
    router.get("/google/callback", async (req, res) => {
      console.log("[GOOGLE AUTH] Callback route called with code:", req.query.code ? "present" : "not present")

      try {
        // Process the authentication
        const authData = await googleStrategy.authenticate(req)
        console.log("[GOOGLE AUTH] Authentication successful, processing afterAuth")

        // Handle post-authentication actions
        const result = await googleStrategy.afterAuth(authData)

        // Determine where to redirect
        const redirectUrl = result.redirect ||
                           process.env.FRONTEND_URL ||
                           "http://localhost:8000/auth/callback"

        console.log("[GOOGLE AUTH] Redirecting to:", redirectUrl)
        res.redirect(redirectUrl)
      } catch (error) {
        console.error("[GOOGLE AUTH] Callback error:", error)
        const errorRedirect = process.env.FRONTEND_URL
                           ? `${process.env.FRONTEND_URL}/auth/error`
                           : "http://localhost:8000/auth/error"
        res.redirect(`${errorRedirect}?error=${encodeURIComponent(error.message)}`)
      }
    })

    // Test endpoint to verify route registration
    router.get("/google/test", (req, res) => {
      console.log("[GOOGLE AUTH] Test route called")
      res.json({
        success: true,
        message: "Google Auth routes are properly registered",
        config: {
          callbackUrl: googleStrategy.getOAuth2Config().callbackURL,
          clientIdPrefix: googleStrategy.getOAuth2Config().clientID.substring(0, 8) + "..."
        }
      })
    })

    console.log("[GOOGLE AUTH] Routes registered successfully")
  } catch (error) {
    console.error("[GOOGLE AUTH] Error setting up routes:", error)
  }
}