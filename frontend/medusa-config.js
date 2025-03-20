const dotenv = require("dotenv");

let ENV_FILE_NAME = "";
switch (process.env.NODE_ENV) {
  case "production":
    ENV_FILE_NAME = ".env.production";
    break;
  case "staging":
    ENV_FILE_NAME = ".env.staging";
    break;
  case "test":
    ENV_FILE_NAME = ".env.test";
    break;
  case "development":
  default:
    ENV_FILE_NAME = ".env";
    break;
}

try {
  dotenv.config({ path: process.cwd() + "/" + ENV_FILE_NAME });
} catch (e) {}

// CORS when consuming Medusa from admin
const ADMIN_CORS = process.env.ADMIN_CORS || "http://localhost:7000";

// CORS to avoid issues when consuming Medusa from a client
const STORE_CORS = process.env.STORE_CORS || "http://localhost:8000";

// Database URL
const DATABASE_URL =
  process.env.DATABASE_URL || "postgres://localhost/medusa-store";

// Medusa uses Redis, so this needs to be set
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Auth callback URLs
const STORE_URL = process.env.STORE_URL || "http://localhost:8000";
const ADMIN_URL = process.env.ADMIN_URL || "http://localhost:7000";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:9000";

const plugins = [
  `medusa-fulfillment-manual`,
  `medusa-payment-manual`,
  {
    resolve: `@medusajs/file-local`,
    options: {
      upload_dir: "uploads",
    },
  },
  {
    resolve: "@medusajs/admin",
    /** @type {import('@medusajs/admin').PluginOptions} */
    options: {
      path: "/app",
      serve: process.env.NODE_ENV === "development",
    },
  },
  {
    resolve: `medusa-plugin-auth-v2`,
    options: {
      // Enable debug mode for detailed logs
      debug: true,

      // General authentication options
      strict: true, // Require authentication for protected routes
      cookieName: "medusa_auth_token",
      cookieOptions: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      },

      // Google OAuth configuration
      providersOptions: {
        google: {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackUrl: process.env.AUTH_STORE_CALLBACK_URL,
          authPath: "/store/auth/google",
          callbackPath: "/store/auth/google/callback",
          scope: ["email", "profile"],
          expiresIn: 24 * 60 * 60 * 1000, // 24 hours
          // Custom profile handler if needed
          /*
          async profileHandler(profile) {
            return {
              email: profile.emails[0].value,
              first_name: profile.name.givenName,
              last_name: profile.name.familyName,
              avatar: profile.photos?.[0]?.value
            }
          }
          */
        },
      },
    },
  },
];

/** @type {import('@medusajs/medusa').ConfigModule} */
module.exports = {
  projectConfig: {
    redis_url: REDIS_URL,
    database_url: DATABASE_URL,
    database_type: process.env.DATABASE_TYPE || "postgres",
    store_cors: STORE_CORS,
    admin_cors: ADMIN_CORS,
    jwtSecret: process.env.JWT_SECRET,
    cookie_secret: process.env.COOKIE_SECRET,
  },
  plugins,
};
