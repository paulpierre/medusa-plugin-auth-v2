import type { MedusaRequest, MedusaResponse } from "@medusajs/medusa"

/**
 * @swagger
 * /store/auth/google:
 *   get:
 *     description: Initiates the Google OAuth2 authentication flow
 *     responses:
 *       302:
 *         description: Redirects to Google login
 */
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  console.log("[GOOGLE AUTH] Route /store/auth/google called at", new Date().toISOString())

  try {
    // Hard-code the OAuth configuration for direct testing
    const clientId = process.env.GOOGLE_CLIENT_ID
    const callbackUrl = process.env.GOOGLE_CALLBACK_URL || "http://localhost:9000/store/auth/google/callback"
    const scope = ["email", "profile"]

    // Build the authorization URL directly
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
    authUrl.searchParams.append("client_id", clientId)
    authUrl.searchParams.append("redirect_uri", callbackUrl)
    authUrl.searchParams.append("response_type", "code")
    authUrl.searchParams.append("scope", scope.join(" "))
    authUrl.searchParams.append("access_type", "offline")
    authUrl.searchParams.append("prompt", "consent")

    // State parameter for CSRF protection
    const state = Math.random().toString(36).substring(2, 15)
    authUrl.searchParams.append("state", state)

    console.log("[GOOGLE AUTH] Redirecting to:", authUrl.toString())

    // Redirect to Google's authorization page
    return res.redirect(authUrl.toString())
  } catch (error) {
    console.error("[GOOGLE AUTH] Error in auth route:", error)
    if (error instanceof Error) {
      return res.status(500).json({
        type: "error",
        message: error.message
      })
    }
    return res.status(500).json({
      type: "internal_server_error",
      message: "Failed to initiate authentication flow"
    })
  }
}

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  // Handle POST requests the same way as GET for convenience
  return GET(req, res)
}