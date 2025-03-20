#!/bin/bash

# Setup script for Medusa Admin Dashboard
# This script sets up the necessary files and configurations for the Medusa Admin Dashboard

# Set the directory for the admin dashboard
ADMIN_DIR="./admin"

# Create the admin directory if it doesn't exist
mkdir -p $ADMIN_DIR

# Navigate to the admin directory
cd $ADMIN_DIR || exit

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "Creating package.json..."
    cat > package.json << EOF
{
  "name": "medusa-admin",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "medusa-admin develop --hot-reload",
    "build": "medusa-admin build",
    "start": "medusa-admin start"
  },
  "dependencies": {
    "@medusajs/admin-next": "^0.0.1",
    "@medusajs/medusa": "^1.18.0",
    "dotenv": "16.4.5",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "engines": {
    "node": ">=16.0.0"
  }
}
EOF
    echo "package.json created successfully"
fi

# Check if index.js exists
if [ ! -f "index.js" ]; then
    echo "Creating index.js..."
    cat > index.js << EOF
import { createAdminApp } from "@medusajs/admin-next"
import dotenv from "dotenv"

// Load environment variables from .env file
dotenv.config()

// Create the admin dashboard
createAdminApp({
  // Set the MEDUSA_BACKEND_URL when present in the environment - otherwise use the default
  backend: process.env.MEDUSA_BACKEND_URL || "http://localhost:9000",
  // Set the development server port when present in the environment - otherwise use the default
  port: process.env.PORT ? Number(process.env.PORT) : 7001
});
EOF
    echo "index.js created successfully"
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Creating .env..."
    cat > .env << EOF
PORT=7001
MEDUSA_BACKEND_URL=http://backend:9000
EOF
    echo ".env created successfully"
fi

# Create the Dockerfile if it doesn't exist
if [ ! -f "Dockerfile" ]; then
    echo "Creating Dockerfile..."
    cat > Dockerfile << EOF
FROM node:18-alpine

WORKDIR /app/admin

# Install dependencies first to leverage Docker cache
COPY package.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Expose the port
EXPOSE 7001

# Start the application
CMD ["npm", "run", "start"]
EOF
    echo "Dockerfile created successfully"
fi

# Create the development Dockerfile
if [ ! -f "Dockerfile.dev" ]; then
    echo "Creating Dockerfile.dev..."
    cat > Dockerfile.dev << EOF
FROM node:18-alpine

WORKDIR /app/admin

# Expose the port
EXPOSE 7001

# Start development server with hot reloading
CMD ["sh", "-c", "npm install && npm run dev"]
EOF
    echo "Dockerfile.dev created successfully"
fi

# Create .dockerignore if it doesn't exist
if [ ! -f ".dockerignore" ]; then
    echo "Creating .dockerignore..."
    cat > .dockerignore << EOF
node_modules
npm-debug.log
.DS_Store
.env
dist
build
.next
EOF
    echo ".dockerignore created successfully"
fi

echo "Setup complete! You can now build and run the admin dashboard using Docker Compose."
echo "Run 'docker-compose up -d' to start all services, including the admin dashboard."
echo "The admin dashboard will be available at http://localhost:7001"