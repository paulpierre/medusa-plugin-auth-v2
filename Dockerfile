FROM node:20-alpine

WORKDIR /app/medusa

# Install required dependencies for building
RUN apk add --no-cache python3 make g++ git postgresql-client curl redis

# Install global dependencies
RUN npm install -g npm@latest
RUN npm install -g @medusajs/medusa-cli@latest
RUN npm install -g @babel/cli typescript

# Copy package files first to leverage Docker cache
COPY package.json tsconfig.json ./

# Modify package.json to disable the prepare script during Docker build
RUN sed -i 's/"prepare": "cross-env NODE_ENV=production npm run build"/"prepare": "echo Skipping prepare script during Docker build"/' package.json

# Install dependencies with legacy peer deps flag
RUN yarn install --network-timeout 1000000 --legacy-peer-deps

# Copy the rest of the files
COPY . .

# Install required plugins and modules
RUN yarn add medusa-fulfillment-manual medusa-payment-manual @medusajs/cache-redis @medusajs/cache-inmemory @medusajs/framework

# Make sure the entrypoint is executable
RUN chmod +x /app/medusa/docker-entrypoint.sh

# Create build directory
RUN mkdir -p /app/medusa/dist

# Expose the port
EXPOSE 9000

# Use entrypoint script for migrations and startup
ENTRYPOINT ["/app/medusa/docker-entrypoint.sh"]
CMD ["yarn", "start"]
