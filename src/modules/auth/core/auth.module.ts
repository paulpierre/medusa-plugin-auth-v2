import { AuthService } from "./services/auth.service"
import { AuthRouter } from "./api/auth.router"
import { MedusaContainer } from "@medusajs/types"
import { PassportService } from "./services/passport.service"
import { AuthUtils } from "./services/auth-utils"

export interface AuthModuleOptions {
  providers: string[]
}

export class AuthModule {
  private readonly container: MedusaContainer
  private readonly options: AuthModuleOptions

  constructor(container: MedusaContainer, options: AuthModuleOptions) {
    this.container = container
    this.options = options
  }

  async init(): Promise<{
    router: { routes: any }[];
    services: Record<string, any>;
    loaders: Record<string, any>;
  }> {
    // Initialize services
    const passportService = new PassportService(this.container)
    const authUtils = new AuthUtils(this.container)
    const authService = new AuthService(this.container)

    // Register services as resolvers
    this.container.register({
      passportService: {
        resolve: () => passportService
      },
      authService: {
        resolve: () => authService
      },
      authUtils: {
        resolve: () => authUtils
      }
    })

    // Skip registering the auth router - we're using explicit API routes instead
    // const authRouter = new AuthRouter(this.container)

    return {
      router: [
        // No router here to avoid conflicts with explicit API routes
        // {
        //   routes: authRouter.getRouter(),
        // },
      ],
      services: {
        passportService,
        authService,
        authUtils
      },
      loaders: {
        providers: this.options.providers
      }
    }
  }
}

export default AuthModule
