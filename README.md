# Medusa Authentication Plugin (v2)

<p align="center">
  <a href="https://www.medusajs.com">
    <img alt="Medusa" src="https://user-images.githubusercontent.com/7554214/153162406-bf8fd16f-aa98-4604-b87b-e13ab4baf604.png" width="100" />
  </a>
</p>

<h1 align="center">
  Medusa Authentication Plugin
</h1>

<p align="center">
  <a href="https://docs.medusajs.com">Documentation</a> |
  <a href="https://github.com/medusajs/medusa/issues">Issues</a>
</p>

## Features

- 🔐 Google OAuth Authentication (fully implemented)
- 🖼️ Beautiful Success & Error Pages
- 🔄 Enhanced Profile Data with Avatar Display
- 📱 Mobile-Friendly Interface
- 🛡️ TypeScript Support
- 🐳 Docker Test Environment Included

## Screenshots

### Initial Login Screen
<p align="center">
  <img src="https://github.com/paulpierre/medusa-plugin-auth-v2/blob/main/uploads/2.png?raw=true" alt="Initial Login Screen" width="600" />
</p>

### Successful Authentication Screen
<p align="center">
  <img src="https://github.com/paulpierre/medusa-plugin-auth-v2/blob/main/uploads/1.png?raw=true" alt="Successful Authentication Screen" width="600" />
</p>

## Prerequisites

- [Medusa backend](https://docs.medusajs.com/development/backend/install)
- [Medusa admin](https://docs.medusajs.com/admin/quickstart)

## Quick Start with Docker

The plugin comes with a complete test environment using Docker Compose, which includes:
- Medusa backend with the auth plugin pre-configured
- Admin dashboard
- PostgreSQL database
- Redis for caching

### Running the Docker Environment

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd medusa-plugin-auth-v2

# Start the Docker environment
docker-compose up -d
```

Access the services:
- Medusa Backend: http://localhost:9000
- Medusa Admin: http://localhost:7001
- Authentication URLs:
  - Start Google OAuth: http://localhost:9000/store/auth/google
  - Success Page: http://localhost:9000/auth/success
  - Error Page: http://localhost:9000/auth/error

### Testing OAuth Flow

1. Configure your OAuth credentials in a `.env` file (see `.env-example`)
2. Restart the Docker containers to apply the changes
3. Navigate to http://localhost:9000/store/auth/google to start the OAuth flow
4. After successful authentication, you'll be redirected to the success page

## Installation (without Docker)

```bash
npm install medusa-plugin-auth-v2
# or
yarn add medusa-plugin-auth-v2
```

## Configuration

Add the plugin to your `medusa-config.js` or `medusa-config.ts`:

```javascript
const { defineConfig } = require('@medusajs/medusa')

module.exports = defineConfig({
  plugins: [
    // ... other plugins
    {
      resolve: "medusa-plugin-auth-v2",
      options: {
        // JWT settings
        jwt: {
          secret: process.env.JWT_SECRET,
          expiresIn: "7d"
        },
        // Cookie settings
        cookie: {
          name: "medusa-auth",
          secure: process.env.NODE_ENV === "production",
          maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
        },
        // OAuth provider configurations
        google: {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.GOOGLE_CALLBACK_URL,
          // Strategy options
          strategyOptions: {
            scope: ["profile", "email"]
          }
        }
      }
    }
  ]
})
```

## Authentication Flow

The plugin provides these endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/store/auth/google` | GET/POST | Starts Google OAuth flow |
| `/store/auth/google/callback` | GET | Google OAuth callback handler |
| `/auth/success` | GET | Success page with user profile information |
| `/auth/error` | GET | Error page with detailed error information |

## Migration from v1 to v2

If you're migrating from the v1 version of the plugin, please see our detailed [Migration Guide](MIGRATION.md).

### Key Changes

1. **File-based Routes**: Routes now use Medusa v2's file-based routing system
2. **Function-based Subscribers**: Subscribers now use functions instead of classes
3. **Container API Changes**: Container registration and resolution patterns have changed
4. **New Success/Error Pages**: Enhanced pages with user details and error information
5. **Enhanced Profile Data**: Better handling of user profile information

## Troubleshooting

### Common Issues

1. **Profile Picture Not Displaying**: Add `referrerpolicy="no-referrer"` to image tags for Google profile pictures
2. **"resolver.resolve is not a function"**: This indicates a container resolution issue in Medusa v2
3. **Authentication Flow Starts But Never Completes**: Check that your callback URLs are correctly configured

### Docker Environment Issues

1. **Port Conflicts**: If ports 9000 or 7001 are already in use, modify the `docker-compose.yml` file
2. **Environment Variables**: Ensure all required variables are set in your `.env` file
3. **Container Rebuilding**: Use `docker-compose up -d --build` to rebuild containers after code changes

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License (C) 2025 [Paul Pierre](https://github.com/paulpierre)
