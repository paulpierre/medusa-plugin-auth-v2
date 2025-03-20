import { MedusaRequest, MedusaResponse } from "@medusajs/medusa"

export async function GET(
  _req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  res.json({
    message: "Plugin is running",
  })
}
