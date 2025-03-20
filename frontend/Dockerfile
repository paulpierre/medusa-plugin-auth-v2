FROM node:16-alpine

WORKDIR /app

# Copy all files
COPY . .

# Install dependencies
RUN npm install

# Expose the port
EXPOSE 8000

# Start the application
CMD ["npm", "start"]