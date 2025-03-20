import { EntityManager } from "typeorm"
import { User } from "@medusajs/medusa"
import { MedusaContainer } from "@medusajs/medusa"
import { BaseStrategy, AuthProfile, TransformedProfile } from "../strategies/base-strategy"

export interface UserService {
  withTransaction(transactionManager: EntityManager): this
  retrieveByEmail(email: string): Promise<User>
  update(userId: string, update: Partial<User>): Promise<User>
  create(data: Partial<User>): Promise<User>
}

export interface AuthWorkflowData {
  strategy?: BaseStrategy
  profile?: AuthProfile
  transformedProfile?: TransformedProfile
  user?: User
  error?: Error
  provider?: string
  container?: MedusaContainer
  token?: string
  metadata?: Record<string, unknown>
  // Allow additional properties
  [key: string]: unknown
}

export interface AuthWorkflowOptions {
  provider: string
  authData?: Record<string, unknown>
  container?: MedusaContainer
}

export interface AuthWorkflowResult {
  success: boolean
  user?: User
  token?: string
  error?: Error
}
