# MedusaJS Auth Plugin Migration Strategy (v1 to v2)

## Overview

This document outlines the comprehensive strategy for migrating the `medusa-plugin-auth` from MedusaJS v1 to v2. The migration focuses on adopting the new modular architecture while maintaining the plugin's core authentication functionality.

## Current Plugin Analysis

### Plugin being migrated: medusa-plugin-auth

### Existing Structure (v1)

```plaintext
src/
  /api              # API routes for auth endpoints (Express router-based)
  /auth-strategies  # Implementation of various OAuth strategies
  /core            # Core authentication logic
  /loaders         # Plugin initialization
  /types           # TypeScript definitions
  /services        # Services following v1 pattern
```

### Key Features

1. Multiple OAuth provider support (Google, Facebook, etc.)
2. PassportJS integration
3. Custom authentication strategies
4. API routes for auth flows
5. TypeORM integration

## Migration Strategy

### 1. Module-First Architecture

Convert the auth plugin to use MedusaJS v2's module-based architecture:

- Create a dedicated auth module
- Implement module-specific configurations
- Establish clear boundaries between components

### 2. Directory Restructuring for v2

New v2-compliant structure:

```plaintext
src/
  /modules          # Module-based architecture (NEW in v2)
    /auth
      /core         # Core auth logic
      /strategies   # OAuth strategies
      /types        # Type definitions
      /utils        # Utility functions
  /api              # File-based API routes (CHANGED in v2)
    /store          # Store API routes
      /auth         # Auth-related routes
        /[provider] # Provider-specific routes (e.g., google, facebook)
          route.ts  # Route handler files
          /callback # Callback routes
            route.ts # Callback route handler
  /workflows        # Auth-related workflows
  /subscribers      # Auth event handlers (now function-based, not class-based)
  /loaders          # Plugin loaders (container pattern changed)
```

### 3. Key V2 Structure Changes

#### API Routes (v1 vs v2)

**V1 (Express Router-Based):**
```typescript
// src/api/routes/store/index.ts
import { Router } from "express"
import authRoutes from "./auth"

export default (router) => {
  const storeRouter = Router()
  router.use("/store", storeRouter)
  authRoutes(storeRouter)
  return storeRouter
}
```

**V2 (File-Based Routing):**
```typescript
// src/api/store/auth/google/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  // Handle GET request
}

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  // Handle POST request
}
```

#### Container API (v1 vs v2)

**V1 (Instance Registration):**
```typescript
// Register a service or strategy
container.registerInstance("googleStrategy", strategy)

// Resolve a service
const strategy = container.hasRegistration("googleStrategy")
  ? container.resolve("googleStrategy")
  : null
```

**V2 (Factory Registration):**
```typescript
// Register a service or strategy
container.register({
  googleOAuth2Strategy: {
    useFactory: () => strategy
  }
})

// Resolve a service
const strategy = container.resolve("googleOAuth2Strategy", { optional: true })
```

#### Subscribers (v1 vs v2)

**V1 (Class-Based):**
```typescript
export default class AuthSubscriber {
  static readonly config = {
    event_names: ["auth.success"],
    subscriber_config: {
      identifier: "auth-subscriber"
    }
  }

  constructor({ eventBusService }) {
    this.eventBusService_ = eventBusService
  }

  async handleEvent(data, eventName) {
    // Handle event
  }
}
```

**V2 (Function-Based):**
```typescript
export const config = {
  event_names: ["auth.success"],
  subscriber_config: {
    identifier: "auth-subscriber"
  }
}

export default function authSubscriber({ eventBusService }) {
  async function handleEvent(data, eventName) {
    // Handle event
  }

  return { handleEvent }
}
```

### 4. Component Updates

#### Auth Module

- Implement as a standalone module
- Add module configuration options
- Create clear interfaces for module interaction

#### API Layer

- **Convert all routes to file-based routing**
- Use `MedusaRequest` and `MedusaResponse` from `@medusajs/framework/http`
- Implement proper error handling
- Add TypeScript type safety

#### Authentication Strategies

- Migrate OAuth strategies to v2
- Update PassportJS integration
- Add strategy-specific configurations

#### Container Registration

- Use `container.register()` with factory pattern instead of `registerInstance()`
- Update service resolution to use proper v2 API

#### Subscribers

- Convert class-based subscribers to function-based subscribers
- Export config as a named export instead of static class property
- Return handler functions object

### 5. Import Path Changes

**V1:**
```typescript
import { EventBusService } from "@medusajs/medusa"
```

**V2:**
```typescript
import { MedusaEventEmitterService } from "@medusajs/event-bus"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
```

## Compatibility Considerations

### Breaking Changes

1. Module-based configuration
2. File-based API routes (vs router-based)
3. Function-based subscribers (vs class-based)
4. Container registration pattern
5. Changed event system

### Backward Compatibility

- Provide migration scripts
- Document breaking changes
- Support transition period

## User Migration Guide

This section helps you migrate from the v1 version of the authentication plugin to the v2 version designed for MedusaJS v2.

### Installation

In v2, you'll need to install the new package:

```bash
npm install medusa-plugin-auth-v2
# or
yarn add medusa-plugin-auth-v2
```

### Configuration

The configuration in your `medusa-config.js` or `medusa-config.ts` has changed to match the v2 plugin format:

```typescript
// v1 configuration
module.exports = {
  plugins: [
    {
      resolve: `medusa-plugin-auth`,
      options: {
        // ... options
      }
    }
  ]
}

// v2 configuration
const { defineConfig } = require('@medusajs/medusa')

module.exports = defineConfig({
  plugins: [
    {
      resolve: `medusa-plugin-auth-v2`,
      options: {
        // Options remain similar
        // JWT and cookie settings are now in their own sections
        jwt: {
          secret: process.env.JWT_SECRET,
          expiresIn: "7d"
        },
        cookie: {
          name: "medusa-auth",
          secure: process.env.NODE_ENV === "production",
          maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
        },
        // Provider configurations remain similar
        google: {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.GOOGLE_CALLBACK_URL,
          // You can now pass strategy options directly
          strategyOptions: {
            scope: ["profile", "email"]
          }
        }
        // Other providers follow the same pattern
      }
    }
  ]
})
```

### URL Changes

The auth endpoints have been updated to match Medusa v2's file-based routing system:

| v1 Endpoint | v2 Endpoint | Purpose |
|-------------|-------------|---------|
| `/store/auth/google` | `/auth/google` | Start Google OAuth flow |
| `/store/auth/google/callback` | `/auth/google/callback` | Google OAuth callback |
| N/A | `/auth/success` | New success page with user details |
| N/A | `/auth/error` | New error page with detailed error info |

### API Usage

If you were using the auth plugin programmatically, the imports and APIs have changed:

```typescript
// v1
import { AuthService } from "medusa-plugin-auth"

// v2
import { AuthService } from "medusa-plugin-auth-v2/dist/modules/auth"
```

### New Features in v2

1. **Enhanced Success and Error Pages**: Detailed pages showing authentication results and user info
2. **Better Type Safety**: Improved TypeScript support throughout
3. **Modular Architecture**: Follows Medusa v2's module-based architecture
4. **File-Based Routing**: Uses the new v2 routing system

### Breaking Changes

1. **No Express Router**: v2 doesn't use Express routers anymore
2. **Container Registration**: The dependency injection container works differently
3. **Event Handlers**: Subscribers use a new format in v2

### Migration Steps

1. Update your package.json to use the new plugin
2. Update your medusa-config.js/ts with the new configuration format
3. Update any custom code that interacts with the auth plugin
4. Test the authentication flow with your providers

### Troubleshooting

#### Common Issues

1. **"resolver.resolve is not a function"** - This could indicate a container resolution issue. Make sure you're using the plugin with Medusa v2.
2. **Authentication flow starts but never completes** - Check that your callback URLs are correctly configured.
3. **OAuth provider not receiving correct scopes** - Use the new strategyOptions configuration to set the correct scopes.

## Technical Implementation Notes

### Challenges and Solutions

#### Challenge 1: Container Resolution in Routes

**Problem:** In v2, the container is accessed differently and strategies weren't properly accessible from the API routes. This resulted in `resolver.resolve is not a function` errors.

**Solution:**
- Implemented a multi-layered strategy resolution approach
- Added more detailed logging for debugging
- Cached strategy instances in global object as a failsafe
- Created a helper function to try multiple resolution methods in sequence

#### Challenge 2: Authentication Flow Redirects

**Problem:** The authentication flow redirects weren't working properly in v2 due to differences in how the response object is handled.

**Solution:**
- Built custom error and success pages with detailed information
- Added more robust error handling
- Updated the `afterAuth` method to use the correct redirect URLs
- Added detailed console logging to track the authentication flow

#### Challenge 3: Strategy Configuration

**Problem:** Strategy configuration in v2 needed to work with both plugin options and environment variables.

**Solution:**
- Updated the strategy loader to first check plugin options, then environment variables
- Added more validation and helpful error messages
- Improved configuration logging with sensitive data masking

#### Challenge 4: Container Resolver Issues in Callback Route

**Problem:** The callback route was encountering errors with "resolver.resolve is not a function" when attempting to access the container in Medusa v2.

**Solution:**
- Simplified the container resolution approach to use direct property access
- Implemented a robust fallback mechanism with direct instance creation
- Used global object caching as a last resort fallback
- Avoided using complex container registration patterns that might cause TypeScript issues

### Technical Lessons

1. **Medusa v2 Container:** The dependency injection container in v2 works differently. It's important to use the recommended patterns for registration and resolution.
   - Avoid manipulating container.cradle directly as it's not allowed in Medusa v2
   - Use container.register with proper registration patterns instead

2. **File-based Routing:** Routes must now be organized in directories that mirror the URL structure, with each endpoint defined in a `route.ts` file.

3. **Error Handling:** Always include comprehensive error handling, especially around authentication flows, with clear user feedback.

4. **Fallback Mechanisms:** When working with critical services like authentication, implement failsafe mechanisms to prevent catastrophic failures.

5. **Subscriber Implementation:**
   - In v2, subscribers must export event handlers directly mapped to event names
   - Each subscriber should return an object where keys are event names and values are handler functions
   - The top-level "handleEvent" pattern from v1 is not sufficient in v2
