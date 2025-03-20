import { createAdminApp } from "@medusajs/admin-next";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Create the admin dashboard
createAdminApp({
  // Set the MEDUSA_BACKEND_URL when present in the environment - otherwise use the default
  backend: process.env.MEDUSA_BACKEND_URL || "http://localhost:9000",
  // Set the development server port when present in the environment - otherwise use the default
  port: process.env.PORT ? Number(process.env.PORT) : 7001,
  // Optional: Add custom parameters
  env: {
    name: "medusa-auth-admin",
  },
});
