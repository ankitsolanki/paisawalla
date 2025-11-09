#!/bin/bash

# Setup script to create .env files from .env.example

echo "🚀 Setting up environment files..."

# Backend .env
if [ ! -f "backend/.env" ]; then
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        echo "✅ Created backend/.env from .env.example"
        echo "⚠️  Please edit backend/.env and add your MongoDB URI and reCAPTCHA keys"
    else
        echo "❌ backend/.env.example not found"
    fi
else
    echo "ℹ️  backend/.env already exists, skipping..."
fi

# Frontend .env
if [ ! -f "frontend/.env" ]; then
    if [ -f "frontend/.env.example" ]; then
        cp frontend/.env.example frontend/.env
        echo "✅ Created frontend/.env from .env.example"
        echo "⚠️  Please edit frontend/.env and add your API URL and reCAPTCHA site key"
    else
        echo "❌ frontend/.env.example not found"
    fi
else
    echo "ℹ️  frontend/.env already exists, skipping..."
fi

echo ""
echo "📝 Next steps:"
echo "1. Edit backend/.env - Add MongoDB URI and reCAPTCHA keys"
echo "2. Edit frontend/.env - Add API URL and reCAPTCHA site key"
echo "3. Start MongoDB (if using local)"
echo "4. Run: cd backend && npm run dev"
echo "5. Run: cd frontend && npm run dev"

