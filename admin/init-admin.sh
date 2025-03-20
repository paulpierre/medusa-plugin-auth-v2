#!/bin/bash

# Initialize Medusa Admin Dashboard
echo "Initializing Medusa Admin Dashboard..."

# Check if medusa-admin is installed globally
if ! command -v medusa-admin &> /dev/null
then
    echo "medusa-admin not found, installing..."
    npm install -g @medusajs/admin-next
fi

# Create the admin directory structure if it doesn't exist
mkdir -p ./src/components
mkdir -p ./src/pages
mkdir -p ./public

# Create basic configuration files if they don't exist
if [ ! -f "./jsconfig.json" ]; then
    echo '{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}' > jsconfig.json
    echo "Created jsconfig.json"
fi

echo "Admin dashboard initialization complete!"