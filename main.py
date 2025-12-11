from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import uvicorn
import logging

# Import existing utility functions
# Ensure they are in the same directory or properly pacakged
try:
    from snmp_utils import fetch_snmp_counters
    from vlan_utils import fetch_vlan_config
except ImportError:
    # For local running without proper package structure
    import sys
    import os
    sys.path.append(os.path.dirname(__file__))
    from snmp_utils import fetch_snmp_counters
    from vlan_utils import fetch_vlan_config

app = FastAPI(
    title="OSI Troubleshooter API",
    description="Network diagnostic tools exposed as a REST API.",
    version="1.0.0"
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

# Endpoints
@app.get("/")
def read_root():
    return {"status": "operational", "message": "OSI Troubleshooter API is running"}

@app.post("/api/snmp/check")
async def check_snmp(request: SnmpRequest):
    """
    Fetch SNMP counters or data from a target device.
    """
    try:
        logging.info(f"Checking SNMP on {request.ip} for OID {request.oid}")
        result = fetch_snmp_counters(request.ip, request.community, request.oid)
        return {"ip": request.ip, "oid": request.oid, "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/vlan/audit")
async def audit_vlan(request: VlanRequest):
    """
    Fetch VLAN configuration via SSH.
    """
    try:
        logging.info(f"Auditing VLAN on {request.ip}")
        result = fetch_vlan_config(request.ip, request.username, request.password, request.command)
        return {"ip": request.ip, "command": request.command, "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    # Portable runner
    uvicorn.run(app, host="0.0.0.0", port=8000)
