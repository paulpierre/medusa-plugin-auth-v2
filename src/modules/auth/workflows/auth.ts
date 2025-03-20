import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowData
} from "@medusajs/workflows-sdk"
import { MedusaContainer } from "@medusajs/types"
import { AuthHook } from "./auth.hook"
import { User } from "@medusajs/medusa"
import {
  BaseStrategy,
  AuthProfile,
  TransformedProfile
} from "../strategies/base-strategy"

export type AuthWorkflowState = {
  strategy?: BaseStrategy
  profile?: AuthProfile
  transformedProfile?: TransformedProfile
  user?: User
  error?: Error
  data?: Record<string, unknown>
  container: MedusaContainer
  provider: string
}

export type AuthWorkflowOptions = {
  provider: string
  authData?: Record<string, unknown>
  container: MedusaContainer
}

// Step 1: Before Authentication
export const beforeAuthenticateStep = createStep<AuthWorkflowState, AuthWorkflowOptions, AuthWorkflowState>(
  "before-authenticate",
  async (input: AuthWorkflowOptions): Promise<StepResponse<AuthWorkflowState>> => {
    // Create AuthHook with container
    const authHook = new AuthHook({ container: input.container })
    // Initialize with empty data and pass provider in options
    const result = await authHook.beforeAuthenticate({}, { provider: input.provider })
    return new StepResponse({
      ...result,
      container: input.container,
      provider: input.provider
    })
  }
)

// Step 2: Authentication
export const authenticateStep = createStep<AuthWorkflowState, AuthWorkflowState, AuthWorkflowState>(
  "authenticate",
  async (input: AuthWorkflowState): Promise<StepResponse<AuthWorkflowState>> => {
    const authHook = new AuthHook({ container: input.container })
    const result = await authHook.authenticate(input, { provider: input.provider })
    return new StepResponse({
      ...result,
      container: input.container,
      provider: input.provider
    })
  }
)

// Step 3: Transform Profile
export const transformProfileStep = createStep<AuthWorkflowState, AuthWorkflowState, AuthWorkflowState>(
  "transform-profile",
  async (input: AuthWorkflowState): Promise<StepResponse<AuthWorkflowState>> => {
    const authHook = new AuthHook({ container: input.container })
    const result = await authHook.transformProfile(input, { provider: input.provider })
    return new StepResponse({
      ...result,
      container: input.container,
      provider: input.provider
    })
  }
)

// Step 4: Create or Update User
export const createOrUpdateUserStep = createStep<AuthWorkflowState, AuthWorkflowState, AuthWorkflowState>(
  "create-or-update-user",
  async (input: AuthWorkflowState): Promise<StepResponse<AuthWorkflowState>> => {
    const authHook = new AuthHook({ container: input.container })
    const result = await authHook.createOrUpdateUser(input, { provider: input.provider })
    return new StepResponse({
      ...result,
      container: input.container,
      provider: input.provider
    })
  },
  async (input: AuthWorkflowState | undefined) => {
    if (!input?.user?.id) return
    const userService = input.container.resolve("userService")
    await userService.delete(input.user.id)
  }
)

// Step 5: Finalize
export const finalizeStep = createStep<AuthWorkflowState, AuthWorkflowState, AuthWorkflowState>(
  "finalize",
  async (input: AuthWorkflowState): Promise<StepResponse<AuthWorkflowState>> => {
    const authHook = new AuthHook({ container: input.container })
    const result = await authHook.finalize(input, { provider: input.provider })
    return new StepResponse({
      ...result,
      container: input.container,
      provider: input.provider
    })
  }
)

// Main Authentication Workflow
export const AuthWorkflow = createWorkflow<AuthWorkflowState, AuthWorkflowOptions, Record<string, Function>>(
  "auth",
  (input: WorkflowData<AuthWorkflowState>) => {
    // Get initial data with proper type assertion
    const initialData = input.data as WorkflowData<Record<string, unknown>>

    const options: AuthWorkflowOptions = {
      container: input.container as MedusaContainer,
      provider: input.provider as string,
      authData: initialData // Use properly typed data
    }

    const beforeAuthResult = beforeAuthenticateStep(options) as WorkflowData<AuthWorkflowState>
    const authState = beforeAuthResult.data as AuthWorkflowState
    if (!authState) throw new Error("Before authenticate step failed")

    const authResult = authenticateStep(authState)
    if (!authResult?.data) throw new Error("Authentication step failed")

    const transformState = authResult.data as AuthWorkflowState
    const transformResult = transformProfileStep(transformState)
    if (!transformResult?.data) throw new Error("Transform profile step failed")

    const createUserState = transformResult.data as AuthWorkflowState
    const createUserResult = createOrUpdateUserStep(createUserState)
    if (!createUserResult?.data) throw new Error("Create user step failed")

    const finalizeState = createUserResult.data as AuthWorkflowState
    const finalizeResult = finalizeStep(finalizeState)
    if (!finalizeResult?.data) throw new Error("Finalize step failed")

    const state = finalizeResult.data as AuthWorkflowState

    return {
      provider: state.provider,
      container: state.container,
      authData: state.data,
      __type: "auth",
      __step__: "finalize"
    } as WorkflowData<AuthWorkflowOptions>
  }
)
