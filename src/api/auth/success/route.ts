import type { MedusaRequest, MedusaResponse } from "@medusajs/medusa"

/**
 * @swagger
 * /auth/success:
 *   get:
 *     description: Success page for successful authentication
 *     parameters:
 *       - in: query
 *         name: email
 *         required: false
 *         description: The authenticated user's email
 *     responses:
 *       200:
 *         description: Returns an HTML success page
 */
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  console.log("[AUTH SUCCESS] Success page accessed at", new Date().toISOString())

  // Default values
  let userData = {
    email: req.query.email as string || "your account",
    id: "Unknown",
    name: "Unknown User",
    firstName: "",
    lastName: "",
    displayName: "",
    picture: "",
    provider: "google",
    sessionId: req.sessionID || "None",
    rawProfile: {}
  }

  // Try to get full data from session if available
  if (req.session && (req.session as any).authData) {
    const authData = (req.session as any).authData;
    console.log("[AUTH SUCCESS] Session data found:", JSON.stringify(authData, null, 2));

    if (authData.profile) {
      // Log the profile picture URL for debugging
      const pictureUrl = authData.profile.picture ||
                        authData.profile.metadata?.raw?.picture ||
                        authData.profile.photos?.[0]?.value ||
                        "";
      console.log("[AUTH SUCCESS] Profile picture URL:", pictureUrl);

      userData = {
        ...userData,
        email: authData.profile.email || userData.email,
        id: authData.profile.id || userData.id,
        name: authData.profile.displayName || `${authData.profile.firstName || ""} ${authData.profile.lastName || ""}`.trim() || userData.name,
        firstName: authData.profile.firstName || "",
        lastName: authData.profile.lastName || "",
        displayName: authData.profile.displayName || "",
        picture: pictureUrl,
        provider: authData.provider || userData.provider,
        rawProfile: authData.profile
      }

      // Additional logging to debug picture URL
      console.log("[AUTH SUCCESS] Final picture URL being used:", userData.picture);
    }
  } else {
    console.log("[AUTH SUCCESS] No session data found. Using query parameters only.");
  }

  // Create a simple HTML success page with more detailed user information
  const htmlContent = `
  <!DOCTYPE html>
  <html>
    <head>
      <title>Authentication Successful</title>
      <style>
        body {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #f9f9f9;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          padding: 20px;
        }
        .success-container {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          padding: 40px;
          text-align: center;
          width: 100%;
          max-width: 700px;
        }
        h1 {
          color: #333;
          margin-top: 0;
        }
        .success-message {
          background-color: #f0fff4;
          border: 1px solid #c6f6d5;
          padding: 15px;
          border-radius: 6px;
          margin: 20px 0;
          color: #38a169;
        }
        .user-info {
          text-align: left;
          background-color: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 6px;
          padding: 20px;
          margin: 20px 0;
        }
        .user-info h2 {
          margin-top: 0;
          color: #333;
          font-size: 18px;
        }
        .profile-section {
          display: flex;
          align-items: center;
          margin-bottom: 20px;
        }
        .profile-picture {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          object-fit: cover;
          margin-right: 20px;
          border: 3px solid #38a169;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .profile-picture-placeholder {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background-color: #38a169;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 20px;
          font-size: 36px;
          font-weight: bold;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .profile-details {
          flex: 1;
        }
        .field {
          margin-bottom: 10px;
        }
        .field-label {
          font-weight: bold;
          display: inline-block;
          width: 120px;
          color: #6c757d;
        }
        .field-value {
          font-family: monospace;
          word-break: break-all;
        }
        .highlight {
          font-weight: bold;
          color: #2f855a;
        }
        .back-link {
          display: inline-block;
          background-color: #38a169;
          color: white;
          padding: 12px 20px;
          text-decoration: none;
          border-radius: 4px;
          font-weight: 500;
          margin-top: 10px;
          transition: background-color 0.2s;
        }
        .back-link:hover {
          background-color: #2f855a;
        }
        .raw-data {
          background-color: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 4px;
          padding: 15px;
          margin-top: 20px;
          text-align: left;
          max-height: 200px;
          overflow-y: auto;
          font-family: monospace;
          font-size: 12px;
          white-space: pre-wrap;
        }
      </style>
    </head>
    <body>
      <div class="success-container">
        <h1>Authentication Successful</h1>
        <div class="success-message">
          You have successfully authenticated via <span class="highlight">${userData.provider}</span>
        </div>

        <div class="user-info">
          <div class="profile-section">
            ${userData.picture
              ? `<img src="${userData.picture}" alt="Profile" class="profile-picture"
                  referrerpolicy="no-referrer" crossorigin="anonymous"
                  onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><rect width=%22100%22 height=%22100%22 fill=%22%2338a169%22 /><text x=%2250%22 y=%2265%22 font-size=%2236%22 fill=%22white%22 text-anchor=%22middle%22>${userData.firstName.charAt(0) || userData.email.charAt(0).toUpperCase()}</text></svg>';" />`
              : `<div class="profile-picture-placeholder">${userData.firstName.charAt(0) || userData.email.charAt(0).toUpperCase()}</div>`
            }
            <div class="profile-details">
              <h2>${userData.name}</h2>
              <div class="field">
                <span class="field-label">Email:</span>
                <span class="field-value">${userData.email}</span>
              </div>
              <div class="field">
                <span class="field-label">User ID:</span>
                <span class="field-value">${userData.id}</span>
              </div>
              <div class="field">
                <span class="field-label">Session ID:</span>
                <span class="field-value">${userData.sessionId}</span>
              </div>
            </div>
          </div>

          <div class="field">
            <span class="field-label">First Name:</span>
            <span class="field-value">${userData.firstName || "Not provided"}</span>
          </div>
          <div class="field">
            <span class="field-label">Last Name:</span>
            <span class="field-value">${userData.lastName || "Not provided"}</span>
          </div>
          <div class="field">
            <span class="field-label">Display Name:</span>
            <span class="field-value">${userData.displayName || "Not provided"}</span>
          </div>
          <div class="field">
            <span class="field-label">Provider:</span>
            <span class="field-value">${userData.provider}</span>
          </div>

          <div class="raw-data">
            <strong>Raw Profile Data:</strong>
            ${JSON.stringify(userData.rawProfile, null, 2)}
          </div>
        </div>

        <p>You can now continue using the application.</p>
        <a href="/" class="back-link">Go to Dashboard</a>
      </div>
    </body>
  </html>
  `

  // Send the success page
  res.setHeader('Content-Type', 'text/html')
  return res.status(200).send(htmlContent)
}