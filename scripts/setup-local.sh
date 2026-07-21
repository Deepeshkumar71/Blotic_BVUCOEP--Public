#!/bin/bash

# Blotic BVUCOEP - Local Development Setup Script
# This script sets up your local Supabase environment

echo "🚀 Setting up Blotic BVUCOEP local development environment..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "   npm install -g supabase"
    echo "   Or visit: https://supabase.com/docs/guides/cli/getting-started"
    exit 1
fi

echo "✅ Supabase CLI found"

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

echo "✅ Docker is running"

# Start Supabase local development
echo "🔄 Starting Supabase local development environment..."
supabase start

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Local development environment is ready!"
    echo ""
    echo "📊 Supabase Studio: http://localhost:54323"
    echo "🔗 API URL: http://localhost:54321"
    echo "📧 Inbucket (Email testing): http://localhost:54324"
    echo ""
    echo "🔑 To get your local API keys:"
    echo "   supabase status"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Update your .env.local with local API keys"
    echo "   2. Run 'npm run dev' to start your React app"
    echo "   3. Visit http://localhost:3000 to see your app"
    echo ""
else
    echo "❌ Failed to start Supabase local environment"
    echo "💡 Try running: supabase stop && supabase start"
    exit 1
fi
