# Portable OSI Troubleshooter Guide

This application is packaged using `uv` and exposes a FastAPI interface for corporate network usage.

## Prerequisites

1.  **Python 3.12** (managed by uv)
2.  **uv** (Package Manager) - [Install Guide](https://github.com/astral-sh/uv)

## How to Run Portably

1.  **Copy this folder** (`osi_troubleshooter`) to your target machine.
2.  Open a terminal in the folder.
3.  Run the API server:
    ```bash
    uv run main.py
    ```
    This will automatically:
    - Create a virtual environment `.venv`.
    - Install all dependencies (`fastapi`, `pysnmp`, `paramiko`, etc.).
    - Start the server on `http://0.0.0.0:8000`.

## API Usage

The application exposes the following endpoints for external integrations:

*   **SNMP Check**:
    - `POST /api/snmp/check`
    - Body: `{"ip": "1.2.3.4", "community": "public", "oid": "1.3.6..."}`

*   **VLAN Audit**:
    - `POST /api/vlan/audit`
    - Body: `{"ip": "1.2.3.4", "username": "admin", "password": "...", "command": "show vlan"}`

## MCP Integration (Fortinet & Meraki)

The application now includes a bridge to local MCP servers.

*   **List Tools**:
    - `GET /api/mcp/fortinet/tools`
    - `GET /api/mcp/meraki/tools`

*   **Execute Tool**:
    - `POST /api/mcp/fortinet/call/{tool_name}`
    - Body: `{"arguments": { "param1": "value" }}`

These endpoints run the Node.js MCP servers as subprocesses and proxy the JSON-RPC calls.

## Network MCP Servers (Fortinet & Meraki)

The repository includes custom MCP servers in `network-mcp-servers/`.

**Requirements:**
- **Node.js**: These servers are written in TypeScript/Node.js. Ensure `node` and `npm` are installed.

**Setup:**
1. `cd network-mcp-servers/fortinet-server`
2. `npm install`
3. `npm run build` (if required) or `node build/index.js`

**Integration:**
To use these with AutoGen, you typically run them as a subprocess.
