import { AuthService } from "./core/services/auth.service"
import { AuthRepository } from "./repositories/auth"
import { Auth } from "./models/auth"

// Export types with explicit naming to avoid ambiguity
export * from "./types"
// Re-export specific workflow items
export { AuthWorkflow } from "./workflows/auth"
export * from "./core/services/auth.service"
export * from "./models/auth"
export * from "./repositories/auth"

// Define service and repository
export const service = AuthService
export const repository = AuthRepository
export const models = [Auth]

// Export everything needed for the module
export default {
  service: AuthService,
  models: [Auth],
  // Define linkable entities
  linkable: {
    auth: {
      table: "auth",
      model: Auth,
      modelKey: "id",
    },
  },
}
