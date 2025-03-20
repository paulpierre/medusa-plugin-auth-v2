// This file is intentionally empty for Medusa v2
// File-based routing is used instead of Express-style routing

import { Router } from "express"
import { MedusaContainer } from "@medusajs/types"

/**
 * For Medusa v2 we use file-based routing, but the loader still expects
 * a router function that returns a router or middleware
 *
 * @param rootRouter - Express Router
 * @param container - Medusa Container
 * @returns Express Router middleware that does nothing
 */
export default (rootRouter: Router, container: MedusaContainer) => {
  console.log("[API] API routes are defined in route.ts files for Medusa v2")

  // Return a noop middleware function to satisfy Express router
  return (req, res, next) => {
    next()
  }
}