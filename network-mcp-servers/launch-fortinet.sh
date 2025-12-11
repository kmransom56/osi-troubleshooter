#!/bin/bash

# Network MCP Servers - Fortinet Server Launcher
# This script launches the Fortinet MCP server with proper environment variables

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$SCRIPT_DIR/fortinet-server"

echo "🚀 Launching Fortinet MCP Server..."
echo "📁 Server directory: $SERVER_DIR"

# Check if .env file exists
if [ ! -f "$SERVER_DIR/.env" ]; then
    echo "❌ Error: $SERVER_DIR/.env file not found!"
    echo "Please create .env file with your Fortinet API credentials:"
    echo "FORTIGATE_HOST=your-fortigate-ip"
    echo "FORTIGATE_PORT=10443"
    echo "FORTIGATE_API_TOKEN=your-api-token"
    echo "FORTIGATE_VERIFY_SSL=false"
    exit 1
fi

# Load environment variables
set -a
source "$SERVER_DIR/.env"
set +a

# Check required environment variables
if [ -z "$FORTIGATE_API_TOKEN" ]; then
    echo "❌ Error: FORTIGATE_API_TOKEN not set in .env file"
    exit 1
fi

if [ -z "$FORTIGATE_HOST" ]; then
    echo "❌ Error: FORTIGATE_HOST not set in .env file"
    exit 1
fi

# Set defaults
export FORTIGATE_PORT=${FORTIGATE_PORT:-10443}
export FORTIGATE_VERIFY_SSL=${FORTIGATE_VERIFY_SSL:-false}

echo "🔧 Configuration:"
echo "   Host: $FORTIGATE_HOST:$FORTIGATE_PORT"
echo "   SSL Verify: $FORTIGATE_VERIFY_SSL"
echo "   API Token: ${FORTIGATE_API_TOKEN:0:10}..."

# Check if server is built
if [ ! -f "$SERVER_DIR/build/index.js" ]; then
    echo "🔨 Building server..."
    cd "$SERVER_DIR"
    npm run build
    cd "$SCRIPT_DIR"
fi

echo "🌐 Starting Fortinet MCP Server..."
echo "📡 Listening on stdio..."
echo ""

# Launch the server
cd "$SERVER_DIR"
exec node build/index.js
