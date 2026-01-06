#!/bin/bash

# Enhanced HR - Workspace Setup Script
# Run this when starting a new Conductor workspace

set -e  # Exit on any error

echo "🚀 Setting up Enhanced HR workspace..."

# 1. Copy environment variables
ENV_SOURCE="/Users/rustylindquist/conductor/.env.local"
if [ -f "$ENV_SOURCE" ]; then
    cp "$ENV_SOURCE" .env.local
    echo "✅ Environment variables copied"
else
    echo "⚠️  Warning: $ENV_SOURCE not found. You'll need to set up .env.local manually."
fi

# 2. Install dependencies
echo "📦 Installing dependencies..."
npm install

# 3. Start Supabase (in background)
echo "🗄️  Starting local Supabase..."
npx supabase start

# 4. Start dev server
echo "🌐 Starting dev server..."
echo "   Your app will be available at http://localhost:3000"
npm run dev
