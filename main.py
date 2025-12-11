from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel
from typing import Optional, Dict, Any
import uvicorn
import logging
import os
import sys

# Import local modules
try:
    from snmp_utils import fetch_snmp_counters
    from vlan_utils import fetch_vlan_config
    from mcp_bridge import fortinet_client, meraki_client
except ImportError:
    sys.path.append(os.path.dirname(__file__))
    from snmp_utils import fetch_snmp_counters
    from vlan_utils import fetch_vlan_config
    from mcp_bridge import fortinet_client, meraki_client

app = FastAPI(
    title="OSI Troubleshooter API",
    description="Network diagnostic tools exposed as a REST API (SNMP, VLAN, Fortinet, Meraki).",
    version="1.1.0"
)

# Request Models
class SnmpRequest(BaseModel):
    ip: str
    community: str
    oid: str

class VlanRequest(BaseModel):
    ip: str
    username: str
    password: str
    command: Optional[str] = "show vlan brief"

class ToolCallRequest(BaseModel):
    arguments: Dict[str, Any]

# Endpoints
@app.get("/")
def read_root():
    return {"status": "operational", "message": "OSI Troubleshooter API is running"}

@app.post("/api/snmp/check")
async def check_snmp(request: SnmpRequest):
    """Fetch SNMP counters."""
    try:
        logging.info(f"Checking SNMP on {request.ip}")
        result = fetch_snmp_counters(request.ip, request.community, request.oid)
        return {"ip": request.ip, "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/vlan/audit")
async def audit_vlan(request: VlanRequest):
    """Fetch VLAN config via SSH."""
    try:
        logging.info(f"Auditing VLAN on {request.ip}")
        result = fetch_vlan_config(request.ip, request.username, request.password, request.command)
        return {"ip": request.ip, "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- MCP Server Proxies ---

@app.get("/api/mcp/{server}/tools")
async def list_mcp_tools(server: str):
    """List available tools for a specific MCP server (fortinet or meraki)."""
    if server == "fortinet":
        client = fortinet_client
    elif server == "meraki":
        client = meraki_client
    else:
        raise HTTPException(status_code=404, detail="Server not found")
    
    return await client.list_tools()

@app.post("/api/mcp/{server}/call/{tool_name}")
async def call_mcp_tool(server: str, tool_name: str, payload: ToolCallRequest = Body(...)):
    """Call a specific tool on an MCP server."""
    if server == "fortinet":
        client = fortinet_client
    elif server == "meraki":
        client = meraki_client
    else:
        raise HTTPException(status_code=404, detail="Server not found")
        
    result = await client.call_tool(tool_name, payload.arguments)
    return result

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
