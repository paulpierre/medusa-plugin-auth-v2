#!/bin/bash

# Run migrations first
echo "Running database migrations..."
medusa migrations run

# Bring down previous containers
docker-compose down -v

# Start development containers
echo "Starting Docker containers..."
docker-compose up --build
