import type { MedusaRequest, MedusaResponse } from "@medusajs/medusa"

/**
 * @swagger
 * /auth/error:
 *   get:
 *     description: Error page for authentication failures
 *     parameters:
 *       - in: query
 *         name: error
 *         required: false
 *         description: The error message
 *     responses:
 *       200:
 *         description: Returns an HTML error page
 */
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  console.log("[AUTH ERROR] Error page accessed at", new Date().toISOString())

  // Get error message from query params
  const errorMessage = req.query.error || "Authentication failed"

  // Create a simple HTML error page
  const htmlContent = `
  <!DOCTYPE html>
  <html>
    <head>
      <title>Authentication Error</title>
      <style>
        body {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #f9f9f9;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
        }
        .error-container {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          padding: 40px;
          text-align: center;
          max-width: 500px;
        }
        h1 {
          color: #333;
          margin-top: 0;
        }
        .error-message {
          background-color: #fff5f5;
          border: 1px solid #ffecec;
          padding: 15px;
          border-radius: 6px;
          margin: 20px 0;
          color: #e53e3e;
        }
        .back-link {
          display: inline-block;
          background-color: #4a4a4a;
          color: white;
          padding: 12px 20px;
          text-decoration: none;
          border-radius: 4px;
          font-weight: 500;
          margin-top: 10px;
          transition: background-color 0.2s;
        }
        .back-link:hover {
          background-color: #333;
        }
      </style>
    </head>
    <body>
      <div class="error-container">
        <h1>Authentication Error</h1>
        <div class="error-message">
          ${typeof errorMessage === 'string' ? errorMessage : 'Unknown error'}
        </div>
        <p>There was a problem authenticating your account. Please try again later.</p>
        <a href="/" class="back-link">Back to Homepage</a>
      </div>
    </body>
  </html>
  `

  // Send the error page
  res.setHeader('Content-Type', 'text/html')
  return res.status(200).send(htmlContent)
}