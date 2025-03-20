const { execSync } = require("child_process");
const path = require("path");

/**
 * Seeds the database with initial data.
 * This script can be run directly or called from the entrypoint script.
 */
async function seedDatabase() {
  console.log("Checking for existing admin users...");

  try {
    // Running migrations first to ensure database is ready
    console.log("Running database migrations...");
    execSync("medusa migrations run", { stdio: "inherit" });

    // Check if we need to seed the database
    // For now, we'll just create an admin user if the command is provided
    if (process.argv.includes("--with-admin")) {
      // Setting up an admin user with retry logic
      console.log("Setting up admin user...");

      const MAX_RETRIES = 3;
      let retryCount = 0;
      let success = false;

      while (!success && retryCount < MAX_RETRIES) {
        try {
          console.log(`Attempt ${retryCount + 1} to create admin user...`);
          execSync("medusa user -e admin@medusa-test.com -p medusa123", {
            stdio: "inherit",
          });
          success = true;
          console.log("Admin user created successfully!");
        } catch (err) {
          retryCount++;
          if (retryCount >= MAX_RETRIES) {
            console.log(
              "Failed to create admin user after maximum retry attempts."
            );
            // Don't fail the entire process if user creation fails
            // This might be because the user already exists
          } else {
            console.log(
              `Retrying in 5 seconds... (Attempt ${
                retryCount + 1
              } of ${MAX_RETRIES})`
            );
            await new Promise((resolve) => setTimeout(resolve, 5000));
          }
        }
      }
    }

    console.log("Database initialization complete!");
  } catch (error) {
    console.error("Error during database migration:", error);
    // Don't exit with error code as migrations might be applied but user creation failed
    console.log("Continuing despite errors...");
  }
}

// If this script is run directly
if (require.main === module) {
  seedDatabase().catch((err) => {
    console.error("Failed to seed database:", err);
    // Don't exit with error code
    console.log("Continuing despite errors...");
  });
}

module.exports = { seedDatabase };
