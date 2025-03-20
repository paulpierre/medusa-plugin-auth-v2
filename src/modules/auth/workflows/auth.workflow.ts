import { MedusaContainer } from "@medusajs/medusa"
import { AuthWorkflowData, AuthWorkflowOptions, AuthWorkflowResult } from "./types"
import { getConfig } from "../loaders/config"
import { AuthProviderConfigs } from "../types/config"

export const AUTH_WORKFLOW_ID = "auth"

enum AuthWorkflowSteps {
  INITIALIZE = "initialize",
  AUTHENTICATE = "authenticate",
  TRANSFORM_PROFILE = "transform_profile",
  CREATE_OR_UPDATE_USER = "create_or_update_user",
  FINALIZE = "finalize",
}

export class AuthWorkflow {
  protected readonly container: MedusaContainer

  constructor(container: MedusaContainer) {
    this.container = container
  }

  getId(): string {
    return AUTH_WORKFLOW_ID
  }

  getSteps() {
    return [
      {
        id: AuthWorkflowSteps.INITIALIZE,
        next: [AuthWorkflowSteps.AUTHENTICATE],
        handler: new InitializeStepHandler(this.container),
      },
      {
        id: AuthWorkflowSteps.AUTHENTICATE,
        next: [AuthWorkflowSteps.TRANSFORM_PROFILE],
        handler: new AuthenticateStepHandler(this.container),
      },
      {
        id: AuthWorkflowSteps.TRANSFORM_PROFILE,
        next: [AuthWorkflowSteps.CREATE_OR_UPDATE_USER],
        handler: new TransformProfileStepHandler(this.container),
      },
      {
        id: AuthWorkflowSteps.CREATE_OR_UPDATE_USER,
        next: [AuthWorkflowSteps.FINALIZE],
        handler: new CreateOrUpdateUserStepHandler(this.container),
      },
      {
        id: AuthWorkflowSteps.FINALIZE,
        next: [],
        handler: new FinalizeStepHandler(this.container),
      },
    ]
  }

  async run(data: AuthWorkflowData, options: AuthWorkflowOptions): Promise<AuthWorkflowResult> {
    let currentData = data
    const steps = this.getSteps()
    const context = { options }

    for (const step of steps) {
      try {
        const stepResult = await step.handler.handle(currentData, context)
        
        // Check if the step returned an AuthWorkflowResult (with success property)
        if (stepResult && 'success' in stepResult) {
          // Early return if it's a result
          return stepResult as AuthWorkflowResult
        }
        
        // Otherwise continue with the updated data
        currentData = stepResult as AuthWorkflowData
      } catch (error) {
        return {
          success: false,
          error: error as Error,
        }
      }
    }

    // If we reach here, we need to transform the data into a result
    return {
      success: true,
      ...currentData
    } as AuthWorkflowResult
  }
}

interface StepContext {
  options: AuthWorkflowOptions
}

interface StepHandler {
  handle(data: AuthWorkflowData, context: StepContext): Promise<AuthWorkflowData | AuthWorkflowResult>
}

class InitializeStepHandler implements StepHandler {
  protected readonly container: MedusaContainer

  constructor(container: MedusaContainer) {
    this.container = container
  }

  async handle(data: AuthWorkflowData, context: StepContext): Promise<AuthWorkflowData> {
    try {
      const config = getConfig(this.container)
      const provider = context.options.provider
      const providerConfig = config.providers[provider as keyof AuthProviderConfigs]

      if (!providerConfig) {
        throw new Error(`Provider ${provider} not configured`)
      }

      return {
        ...data,
        provider,
        metadata: {
          ...data.metadata,
          provider,
          config: providerConfig,
        },
      }
    } catch (error) {
      return {
        ...data,
        error: error as Error,
        metadata: {
          ...data.metadata,
          provider: context.options.provider,
        },
      }
    }
  }
}

class AuthenticateStepHandler implements StepHandler {
  protected readonly container: MedusaContainer

  constructor(container: MedusaContainer) {
    this.container = container
  }

  async handle(data: AuthWorkflowData, context: StepContext): Promise<AuthWorkflowData> {
    try {
      if (data.error) {
        return data
      }

      // This step will be handled by workflow hooks
      return {
        ...data,
        provider: context.options.provider,
      }
    } catch (error) {
      return {
        ...data,
        error: error as Error,
      }
    }
  }
}

class TransformProfileStepHandler implements StepHandler {
  protected readonly container: MedusaContainer

  constructor(container: MedusaContainer) {
    this.container = container
  }

  async handle(data: AuthWorkflowData, context: StepContext): Promise<AuthWorkflowData> {
    try {
      if (data.error || !data.profile) {
        return data
      }

      // This step will be handled by workflow hooks
      return {
        ...data,
        provider: context.options.provider,
      }
    } catch (error) {
      return {
        ...data,
        error: error as Error,
      }
    }
  }
}

class CreateOrUpdateUserStepHandler implements StepHandler {
  protected readonly container: MedusaContainer

  constructor(container: MedusaContainer) {
    this.container = container
  }

  async handle(data: AuthWorkflowData, context: StepContext): Promise<AuthWorkflowData> {
    try {
      if (data.error || !data.profile) {
        return data
      }

      // This step will be handled by workflow hooks
      return {
        ...data,
        provider: context.options.provider,
      }
    } catch (error) {
      return {
        ...data,
        error: error as Error,
      }
    }
  }
}

class FinalizeStepHandler implements StepHandler {
  protected readonly container: MedusaContainer

  constructor(container: MedusaContainer) {
    this.container = container
  }

  async handle(data: AuthWorkflowData, _context: StepContext): Promise<AuthWorkflowResult> {
    if (data.error) {
      return {
        success: false,
        error: data.error,
      }
    }

    if (!data.user) {
      return {
        success: false,
        error: new Error("No user found after authentication"),
      }
    }

    return {
      success: true,
      user: data.user,
    }
  }
}
