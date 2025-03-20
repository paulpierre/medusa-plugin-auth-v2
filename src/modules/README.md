# Auth Module for Medusa v2

This directory contains the authentication module for Medusa v2, which follows the modular architecture pattern introduced in Medusa v2.

## Module Structure

```
auth/
├── core/                 # Core authentication functionality
│   ├── services/         # Authentication services
│   ├── types/            # Type definitions
│   └── utils/            # Utility functions
├── strategies/           # OAuth strategies implementation
│   ├── facebook/         # Facebook OAuth strategy
│   ├── github/           # GitHub OAuth strategy
│   ├── google/           # Google OAuth strategy
│   ├── linkedin/         # LinkedIn OAuth strategy
│   ├── microsoft/        # Microsoft OAuth strategy
│   ├── twitter/          # Twitter OAuth strategy
│   └── base/             # Base strategy implementation
├── index.ts              # Module entry point
└── README.md             # Module documentation
```

## Module Pattern

This module follows the Medusa v2 module pattern, which includes:

1. **Clear Boundaries**: All authentication-related code is contained within this module.
2. **Self-contained**: The module doesn't have dependencies on other modules.
3. **Well-defined Interfaces**: The module exports clear interfaces for interaction.
4. **Dependency Injection**: Services use dependency injection for better testability.

## Usage

The module exposes its functionality through services and hooks that can be accessed via Medusa's dependency injection container:

```typescript
import { AuthService } from "medusa-plugin-auth-v2/dist/modules/auth"

// Injected via controller/service constructor
constructor(
  private authService: AuthService
) {}

// Using the service
const userInfo = await this.authService.authenticate(provider, token)
```

## Service Overview

- **AuthService**: Main service for authentication operations
- **PassportService**: Handles Passport.js integration
- **StrategyResolver**: Resolves and manages OAuth strategies

## Strategy Implementation

Each OAuth strategy extends the base strategy classes and implements provider-specific functionality. The strategies follow a common interface for consistency.

## Event System

The module emits events that can be subscribed to for custom behavior:

- `auth.authenticated`: Emitted when a user is successfully authenticated
- `auth.error`: Emitted when an authentication error occurs
- `auth.user.created`: Emitted when a new user is created during authentication
- And more... (see `src/subscribers/auth-subscriber.ts` for full list)
