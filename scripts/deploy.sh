#!/bin/bash

# Autostock Backend Deployment Script
set -e

echo "🚀 Starting Autostock Backend Deployment..."

# Check if required environment variables are set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is required"
    exit 1
fi

if [ -z "$JWT_SECRET" ]; then
    echo "❌ ERROR: JWT_SECRET environment variable is required"
    exit 1
fi

# Install dependencies and build
echo "📦 Installing dependencies..."
npm ci --only=production

echo "🔨 Building application..."
npm run build

echo "🗃️  Generating Prisma client..."
npm run prisma:generate

echo "🔄 Running database migrations..."
npm run deploy:migrate

echo "🌱 Seeding database (if needed)..."
npm run prisma:seed || echo "⚠️  Seeding failed or already complete"

echo "✅ Deployment complete! Application ready to start."
echo "💡 Run 'npm start' to start the server"
