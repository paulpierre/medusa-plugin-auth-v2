import { AuthProfile } from "../strategies/base-strategy"

declare global {
  namespace Express {
    interface Session {
      authError?: Error
      authProfile?: AuthProfile
    }
  }
}
