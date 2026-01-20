#!/bin/bash

# Recepcionista-v2 Startup Script

echo "🚀 Starting Recepcionista-v2..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Check if .env.local exists
if [ ! -f "apps/web/.env.local" ]; then
  echo "⚠️  Warning: apps/web/.env.local not found"
  echo "   Please copy ENV_TEMPLATE.md and create .env.local with your API keys"
fi

# Start the dev server
echo "🌐 Starting development server..."
npm run dev
