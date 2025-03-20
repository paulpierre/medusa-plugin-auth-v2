import { MedusaContainer } from "@medusajs/medusa"
import { AuthWorkflow } from "./auth.workflow"
import { AuthHook } from "./hooks/auth.hook"

export async function registerWorkflows(container: MedusaContainer): Promise<void> {
  const workflowManager = container.resolve("workflowManager")

  // Register the auth workflow
  const authWorkflow = new AuthWorkflow(container)
  await workflowManager.register(authWorkflow)

  // Register the auth hook
  // The AuthHook requires provider and strategy arguments
  // Create a default hook with a base provider and a strategy to be populated later
  const defaultProvider = "default"
  const strategyManager = container.resolve("strategyManager")
  const defaultStrategy = strategyManager.getStrategy(defaultProvider)

  const authHook = new AuthHook(defaultProvider, defaultStrategy)
  await workflowManager.registerHook(authHook)
}
