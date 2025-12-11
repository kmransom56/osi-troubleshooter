import os
import shutil
import asyncio
from pathlib import Path
from typing import Optional, Dict, Any, List

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

class MCPServerClient:
    def __init__(self, name: str, script_path: str):
        self.name = name
        self.script_path = str(Path(script_path).resolve())
        self.node_path = shutil.which("node")
        if not self.node_path:
            raise RuntimeError("Node.js not found in PATH")
        
        self.params = StdioServerParameters(
            command=self.node_path,
            args=[self.script_path],
            env=os.environ.copy() # Pass environment variables (API keys etc)
        )

    async def list_tools(self) -> List[Dict[str, Any]]:
        """List available tools from the MCP server."""
        try:
            async with stdio_client(self.params) as (read, write):
                async with ClientSession(read, write) as session:
                    await session.initialize()
                    result = await session.list_tools()
                    # Convert to list of dicts for JSON serialization
                    return [
                        {
                            "name": tool.name,
                            "description": tool.description,
                            "inputSchema": tool.inputSchema
                        }
                        for tool in result.tools
                    ]
        except Exception as e:
            return [{"error": str(e)}]

    async def call_tool(self, tool_name: str, arguments: Dict[str, Any] = None) -> Any:
        """Call a specific tool on the MCP server."""
        if arguments is None:
            arguments = {}
        
        try:
            async with stdio_client(self.params) as (read, write):
                async with ClientSession(read, write) as session:
                    await session.initialize()
                    result = await session.call_tool(tool_name, arguments)
                    return result
        except Exception as e:
            return {"error": str(e)}

# Define server instances
# Paths correspond to where we built them
FORTINET_PATH = os.path.join(os.path.dirname(__file__), "network-mcp-servers", "fortinet-server", "build", "index.js")
MERAKI_PATH = os.path.join(os.path.dirname(__file__), "network-mcp-servers", "meraki-server", "build", "index.js")

fortinet_client = MCPServerClient("fortinet", FORTINET_PATH)
meraki_client = MCPServerClient("meraki", MERAKI_PATH)
