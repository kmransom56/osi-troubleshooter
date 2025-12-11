#!/bin/bash

# Network MCP Servers - Meraki Server Launcher
# This script launches the Meraki MCP server with proper environment variables

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$SCRIPT_DIR/meraki-server"

echo "🚀 Launching Meraki MCP Server..."
echo "📁 Server directory: $SERVER_DIR"

# Check if .env file exists
if [ ! -f "$SERVER_DIR/.env" ]; then
    echo "❌ Error: $SERVER_DIR/.env file not found!"
    echo "Please create .env file with your Meraki API credentials:"
    echo "MERAKI_API_KEY=your-meraki-api-key"
    echo "MERAKI_BASE_URL=https://api.meraki.com/api/v1"
    exit 1
fi

# Load environment variables
set -a
source "$SERVER_DIR/.env"
set +a

# Check required environment variables
if [ -z "$MERAKI_API_KEY" ]; then
    echo "❌ Error: MERAKI_API_KEY not set in .env file"
    exit 1
fi

# Set defaults
export MERAKI_BASE_URL=${MERAKI_BASE_URL:-https://api.meraki.com/api/v1}

echo "🔧 Configuration:"
echo "   API URL: $MERAKI_BASE_URL"
echo "   API Key: ${MERAKI_API_KEY:0:10}..."

# Check if server is built
if [ ! -f "$SERVER_DIR/build/index.js" ]; then
    echo "🔨 Building server..."
    cd "$SERVER_DIR"
    npm run build
    cd "$SCRIPT_DIR"
fi

echo "🌐 Starting Meraki MCP Server..."
echo "📡 Listening on stdio..."
echo ""

# Launch the server
cd "$SERVER_DIR"
exec node build/index.js
