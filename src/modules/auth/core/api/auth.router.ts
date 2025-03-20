import { Router } from "express"
import { AuthService } from "../services/auth.service"
import { AuthProfile } from "../../strategies/base-strategy"
import { MedusaContainer } from "@medusajs/types"
import { Request, Response } from "express"
import { ConfigModule } from "@medusajs/medusa"
import session from "express-session"

export interface AuthRequest extends Request {
  session: session.Session & {
    authError?: Error
    authProfile?: AuthProfile
  }
}

export class AuthRouter {
  protected readonly router: Router
  protected readonly container: MedusaContainer
  protected readonly authService: AuthService
  protected readonly cookieSecret: string

  constructor(container: MedusaContainer) {
    this.container = container
    this.router = Router()
    this.authService = container.resolve<AuthService>("authService")
    const config = container.resolve<ConfigModule>("configModule")
    this.cookieSecret = config.projectConfig?.cookie_secret || "default_secret"
    this.setupRoutes()
  }

  protected setupRoutes(): void {
    // Configure session middleware
    this.router.use(
      session({
        secret: this.cookieSecret,
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: process.env.NODE_ENV === "production",
          maxAge: 24 * 60 * 60 * 1000 // 24 hours
        }
      })
    )

    // Fix routes by using proper router methods
    this.router.get("/auth/:provider", (req, res, next) => {
      // Skip if it's our dedicated Google route
      if (req.params.provider === "google" && req.path.startsWith("/store/")) {
        return next()
      }
      this.handleAuth(req as AuthRequest, res)
    })

    this.router.get("/auth/:provider/callback", (req, res, next) => {
      // Skip if it's our dedicated Google callback route
      if (req.params.provider === "google" && req.path.startsWith("/store/")) {
        return next()
      }
      this.handleCallback(req as AuthRequest, res)
    })

    this.router.get("/auth/success", (req, res) => this.handleSuccess(req as AuthRequest, res))
    this.router.get("/auth/error", (req, res) => this.handleError(req as AuthRequest, res))
  }

  protected async handleAuth(req: AuthRequest, res: Response): Promise<void> {
    const { provider } = req.params

    try {
      // Just initiate authentication - do not end the response
      // This allows Passport to redirect to the OAuth provider
      await this.authService.authenticate(provider, req)
      // Remove res.end() to allow redirect to happen
    } catch (error) {
      req.session.authError = error as Error
      res.redirect("/auth/error")
    }
  }

  protected async handleCallback(req: AuthRequest, res: Response): Promise<void> {
    const { provider } = req.params

    try {
      const result = await this.authService.authenticate(provider, req)
      if (!result?.profile) {
        throw new Error("Authentication failed: No profile returned")
      }

      req.session.authProfile = result.profile as AuthProfile
      res.redirect("/auth/success")
    } catch (error) {
      req.session.authError = error as Error
      res.redirect("/auth/error")
    }
  }

  protected handleSuccess(req: AuthRequest, res: Response): void {
    const profile = req.session.authProfile
    if (!profile) {
      return res.redirect("/auth/error")
    }
    res.json({ success: true, profile })
  }

  protected handleError(req: AuthRequest, res: Response): void {
    const error = req.session.authError
    res.status(401).json({
      success: false,
      error: error?.message || "Authentication failed"
    })
  }

  getRouter(): Router {
    return this.router
  }
}
