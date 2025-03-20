FROM node:18-alpine

WORKDIR /app/admin

# Install dependencies first to leverage Docker cache
COPY package.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Install the Medusa admin CLI globally
RUN npm install -g @medusajs/admin-cli

# Build the application
RUN npm run build

# Expose the port
EXPOSE 7000

# Start the application
CMD ["npm", "run", "start"]