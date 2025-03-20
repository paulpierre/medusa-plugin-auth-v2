import { Request } from "express"
import { MedusaContainer } from "@medusajs/types"
import { AuthEventData } from "./workflow"
import { AuthProfile, TransformedProfile } from "../strategies/base-strategy"

export interface PassportStrategy {
  name: string
  container: MedusaContainer
  init(): Promise<void>
  validateCallback(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (error: any, user?: any) => void
  ): Promise<void>
  authenticateRequest(req: Request): void
  authenticate(reqOrData: Request | AuthEventData): Promise<Partial<AuthEventData>>
  transformProfile(profile: AuthProfile): Promise<TransformedProfile>
  afterAuth(data: AuthEventData): Promise<Partial<AuthEventData>>
  onSuccess(data: AuthEventData): Promise<Partial<AuthEventData>>
  onError(data: AuthEventData): Promise<Partial<AuthEventData>>
}
