# Medusa Auth Plugin Demo Frontend

This is a simple frontend demonstration of the Google authentication flow using the `medusa-plugin-auth-v2` plugin.

## Overview

This frontend provides:

- A simple login form with Google authentication option
- A callback page to handle OAuth responses
- Integration with the Medusa backend for authentication

## Setup

1. Ensure you have set up Google OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or use an existing one
   - Configure the OAuth consent screen
   - Create OAuth credentials (Web application type)
   - Add authorized redirect URIs (e.g., `http://localhost:8000/callback`)

2. Set environment variables:
   - Update the `.env` file in the root directory with your Google OAuth credentials:
     ```
     GOOGLE_CLIENT_ID=your_client_id
     GOOGLE_CLIENT_SECRET=your_client_secret
     ```

## Running the Demo

### With Docker

The easiest way to run the demo is using Docker Compose from the root directory:

```bash
docker-compose up
```

This will start both the backend and frontend services.

### Manually

If you prefer to run the frontend separately:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

The frontend will be available at http://localhost:8000.

## Testing the Authentication Flow

1. Visit http://localhost:8000
2. Click the "Sign in with Google" button
3. Complete the Google authentication process
4. You'll be redirected back to the callback page
5. Upon successful authentication, you'll be redirected to the account page

## Debugging

If you encounter any issues:

1. Check the browser console for frontend errors
2. Check the backend logs for authentication errors
3. Verify your Google OAuth credentials and redirect URIs
4. Ensure CORS is properly configured

## Customization

You can customize the authentication flow by modifying the following files:

- `google-auth-button.jsx`: The Google sign-in button component
- `auth-callback.jsx`: The OAuth callback handler component
- `index.html`: The main page layout