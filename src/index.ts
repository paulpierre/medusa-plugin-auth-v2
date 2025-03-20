import { BaseStrategy } from "./modules/auth/strategies/base-strategy"
import { GoogleOAuth2Strategy } from "./modules/auth/strategies/google-strategy"
import { FacebookOAuth2Strategy } from "./modules/auth/strategies/facebook-strategy"
import { GitHubOAuth2Strategy } from "./modules/auth/strategies/github-strategy"
import { LinkedInOAuth2Strategy } from "./modules/auth/strategies/linkedin-strategy"
import { MicrosoftOAuth2Strategy } from "./modules/auth/strategies/microsoft-strategy"
import { TwitterOAuth2Strategy } from "./modules/auth/strategies/twitter-strategy"
import { AuthService } from "./modules/auth/core/services/auth.service"
import { AuthUtils } from "./modules/auth/core/services/auth-utils"
import authStrategiesLoader from "./loaders/auth-strategies"
import baseSubscriber from "./subscribers/base-subscriber"
import authSubscriber from "./subscribers/auth-subscriber"

// A more reliable way to track initialization using a Symbol
const LOADED_MARKER = Symbol.for('medusa-plugin-auth-v2:loaded');

(global as any)[LOADED_MARKER] = (global as any)[LOADED_MARKER] || {
  initialized: false
};

/**
 * Medusa plugin for OAuth2 authentication
 * V2 compatible plugin definition
 */
export default {
  // Plugin identification - required for Medusa v2
  name: "medusa-plugin-auth-v2",
  version: "2.0.0",

  // Register loaders - must come first to register strategies
  loaders: [
    // Wrapper to prevent duplicate registration
    async (container, options) => {
      const globalState = (global as any)[LOADED_MARKER];

      if (!globalState.initialized) {
        console.log("[AUTH PLUGIN] First initialization - registering strategies");
        globalState.initialized = true;
        return await authStrategiesLoader(container, options);
      } else {
        console.log("[AUTH PLUGIN] Plugin already initialized - skipping strategy registration");
        return;
      }
    }
  ],

  // Register subscribers - using function-based subscribers
  subscribers: [
    baseSubscriber,
    authSubscriber
  ],

  // Re-export strategies for reference
  strategies: {
    base: BaseStrategy,
    google: GoogleOAuth2Strategy,
    facebook: FacebookOAuth2Strategy,
    github: GitHubOAuth2Strategy,
    linkedin: LinkedInOAuth2Strategy,
    microsoft: MicrosoftOAuth2Strategy,
    twitter: TwitterOAuth2Strategy
  },

  // Re-export services
  services: {
    authService: AuthService
  },

  // Re-export utils
  utils: {
    authUtils: AuthUtils
  },

  // Required v2 keywords for plugin identification
  keywords: [
    "medusa-plugin",
    "medusa-v2",
    "auth",
    "oauth"
  ]
}
