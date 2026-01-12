#!/bin/bash

# WhatsAI - Local Setup Script
echo "🚀 Starting WhatsAI local setup..."

# Check dependencies
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed. Aborting." >&2; exit 1; }

# Install dependencies
echo "📦 Installing project dependencies..."
npm install

# Check if Ollama is running
echo "🤖 Checking for local Ollama instance..."
if curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "✅ Ollama detected!"
else
    echo "⚠️ Ollama not detected at http://localhost:11434"
    echo "   Please install it from https://ollama.ai for local AI insights."
fi

echo "✨ Setup complete! Run 'npm run dev' to start the application."
