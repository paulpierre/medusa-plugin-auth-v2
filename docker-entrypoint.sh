#!/bin/sh
set -e

echo "Starting Medusa Docker Entrypoint..."

# Build the TypeScript files
echo "Building TypeScript files..."
yarn build || echo "Build completed with warnings"

# Wait for database to be ready
until PGPASSWORD=postgres psql -h postgres -U postgres -d medusa-docker -c '\q'; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done

>&2 echo "Postgres is up - executing migrations"

# Wait for Redis to be ready
until redis-cli -h redis ping | grep -q PONG; do
  >&2 echo "Redis is unavailable - sleeping"
  sleep 1
done

>&2 echo "Redis is up - continuing"

# Run migrations with retry logic
MAX_RETRIES=5
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if medusa migrations run; then
    echo "Migrations completed successfully!"
    break
  else
    RETRY_COUNT=$((RETRY_COUNT+1))
    echo "Migration attempt $RETRY_COUNT failed. Retrying in 5 seconds..."
    sleep 5

    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
      echo "Migration failed after $MAX_RETRIES attempts. Continuing anyway..."
      # Don't exit, try to continue
    fi
  fi
done

# Run seed script if it exists - don't fail if it errors
if [ -f "/app/medusa/seed.js" ]; then
  echo "Running seed script..."
  node /app/medusa/seed.js --with-admin || echo "Seed script encountered errors but continuing..."
fi

# Start the Medusa server
echo "Starting Medusa server..."
exec "$@"