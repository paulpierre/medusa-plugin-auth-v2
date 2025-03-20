const dotenv = require("dotenv");
const path = require("path");

let ENV_FILE_NAME = ".env";

try {
  dotenv.config({ path: process.cwd() + "/" + ENV_FILE_NAME });
} catch (e) {
  console.error("Failed to load environment variables:", e);
}

// This is critical for testing the plugin locally
// We're treating the current directory itself as the plugin
module.exports = {
  projectConfig: {
    redis_url: process.env.REDIS_URL || "redis://redis:6379",
    database_url: process.env.DATABASE_URL,
    database_type: "postgres",
    store_cors: process.env.STORE_CORS || "http://localhost:8000",
    admin_cors: process.env.ADMIN_CORS || "http://localhost:7000",
    jwt_secret: process.env.JWT_SECRET || "supersecret",
    cookie_secret: process.env.COOKIE_SECRET || "supersecret",
  },
  modules: [
    {
      resolve: "@medusajs/event-bus-local",
    },
    {
      resolve: "@medusajs/cache-inmemory",
      options: {
        ttl: 30,
      },
    },
    {
      resolve: "@medusajs/cache-redis",
      options: {
        redisUrl: process.env.REDIS_URL || "redis://redis:6379",
        ttl: 30,
      },
    },
  ],
  plugins: [
    // Standard plugins
    {
      resolve: "medusa-fulfillment-manual",
      options: {},
    },
    {
      resolve: "medusa-payment-manual",
      options: {},
    },
    // Our local auth plugin (using current directory)
    {
      resolve: ".",
      options: {
        debug: true,
        providers: {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackUrl:
              process.env.GOOGLE_CALLBACK_URL ||
              "http://localhost:9000/store/auth/google/callback",
            authPath: "/store/auth/google",
            callbackPath: "/store/auth/google/callback",
            scope: ["email", "profile"],
          },
          facebook: {
            clientId: process.env.FACEBOOK_CLIENT_ID,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
            callbackUrl: process.env.FACEBOOK_CALLBACK_URL,
          },
          github: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            callbackUrl: process.env.GITHUB_CALLBACK_URL,
          },
        },
        session: {
          secret: process.env.COOKIE_SECRET || "supersecret",
          name: "medusa_auth_session",
          ttl: 86400000, // 24 hours
        },
        jwt: {
          secret: process.env.JWT_SECRET || "supersecret",
          ttl: 86400000, // 24 hours
        },
        cookie: {
          name: "medusa_auth_token",
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          maxAge: 86400000, // 24 hours
        },
        redirect: {
          success: "/",
          failure: "/",
        },
      },
    },
  ],
};
