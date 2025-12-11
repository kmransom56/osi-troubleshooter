# Network MCP Servers

This repository contains Model Context Protocol (MCP) servers for Fortinet and Meraki network devices, enabling natural language queries of network environments across multiple AI tools.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Fortinet API Token (from FortiGate)
- Meraki API Key (from Meraki Dashboard)
- Python 3.7+ (for FortiGate API Discovery Tool)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/network-mcp-servers.git
   cd network-mcp-servers
   ```

2. **Set up environment variables:**
   ```bash
   # Copy and edit environment files
   cp fortinet-server/.env.example fortinet-server/.env
   cp meraki-server/.env.example meraki-server/.env

   # Edit with your API credentials
   nano fortinet-server/.env
   nano meraki-server/.env
   ```

3. **Build the servers:**
   ```bash
   npm run build:all
   ```

4. **Use the launcher scripts:**
   ```bash
   # Launch Fortinet server
   ./launch-fortinet.sh

   # Launch Meraki server
   ./launch-meraki.sh
   ```

## 🛠️ Available Tools

### Fortinet MCP Server
- `get_system_status` - Get FortiGate system status and performance
- `get_managed_switches` - List FortiSwitch devices
- `get_access_points` - List FortiAP access points
- `get_connected_devices` - Get connected user devices
- `get_firewall_policies` - List firewall policies
- `get_interfaces` - Get network interfaces
- `get_vpn_tunnels` - List IPsec VPN tunnels
- `get_dhcp_leases` - Get DHCP lease information
- `get_switch_ports` - Get switch port statistics
- `query_api_endpoint` - Query any FortiGate API endpoint

### Meraki MCP Server
- `get_organizations` - List accessible organizations
- `get_networks` - Get networks for an organization
- `get_devices` - List devices in an organization
- `get_network_devices` - List devices in a specific network
- `get_clients` - Get connected clients
- `get_device_details` - Get detailed device information
- `get_organization_inventory` - Get hardware inventory
- `get_network_ssids` - List wireless SSIDs
- `get_switch_ports` - Get switch port status
- `query_api_endpoint` - Query any Meraki API endpoint

### FortiGate API Discovery Tool
- **Complete API Discovery**: Automatically discovers all available FortiGate endpoints
- **Schema Documentation**: Retrieves complete API schemas from your FortiGate
- **Endpoint Testing**: Tests key network mapping endpoints with real data
- **Client Generation**: Auto-generates Python client code for discovered endpoints
- **Version-Specific**: Adapts to your exact FortiOS version and available features

```bash
# Run complete API discovery
python fortigate-api-discovery.py 192.168.0.254 YOUR_API_TOKEN

# Results: 2 FortiAPs, 18 connected devices, 7.6MB of API documentation
```

## 🛠️ Configuration for AI Tools

### Windsurf / Cline
Add to `cline_mcp_settings.json`:
```json
{
  "mcpServers": {
    "fortinet": {
      "command": "node",
      "args": ["/path/to/network-mcp-servers/fortinet-server/build/index.js"],
      "env": {
        "FORTIGATE_HOST": "your-fortigate-ip",
        "FORTIGATE_PORT": "10443",
        "FORTIGATE_API_TOKEN": "your-api-token",
        "FORTIGATE_VERIFY_SSL": "false"
      }
    },
    "meraki": {
      "command": "node",
      "args": ["/path/to/network-mcp-servers/meraki-server/build/index.js"],
      "env": {
        "MERAKI_API_KEY": "your-meraki-api-key"
      }
    }
  }
}
```

### Claude Desktop
Add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "fortinet": {
      "command": "node",
      "args": ["/path/to/network-mcp-servers/fortinet-server/build/index.js"],
      "env": {
        "FORTIGATE_HOST": "your-fortigate-ip",
        "FORTIGATE_PORT": "10443",
        "FORTIGATE_API_TOKEN": "your-api-token",
        "FORTIGATE_VERIFY_SSL": "false"
      }
    },
    "meraki": {
      "command": "node",
      "args": ["/path/to/network-mcp-servers/meraki-server/build/index.js"],
      "env": {
        "MERAKI_API_KEY": "your-meraki-api-key"
      }
    }
  }
}
```

### Cursor
Configure through Cursor Settings → MCP → Add Server, pointing to the built server files.

### GitHub Copilot CLI
```bash
github-copilot-cli mcp add fortinet "node /path/to/network-mcp-servers/fortinet-server/build/index.js"
github-copilot-cli mcp add meraki "node /path/to/network-mcp-servers/meraki-server/build/index.js"
```

## 📖 Usage Examples

### MCP Server Usage
Once configured, you can ask natural language questions like:

- "Get the current FortiGate system status"
- "Show me all managed switches"
- "List all Meraki organizations I have access to"
- "Get client connections for network [ID]"
- "What firewall policies are configured?"
- "Show me the switch port statistics"

### FortiGate API Discovery Tool Usage

#### Quick Discovery
```bash
# Run complete API discovery on your FortiGate
python fortigate-api-discovery.py 192.168.0.254 YOUR_API_TOKEN

# Custom port and output directory
python fortigate-api-discovery.py 192.168.0.254 YOUR_API_TOKEN -p 10443 -o my_docs
```

#### What It Discovers
- **System Info**: FortiGate model, version, serial number
- **Network Devices**: FortiSwitches, FortiAPs, connected clients
- **API Schemas**: Complete endpoint documentation (7.6MB+)
- **Working Endpoints**: Tests which endpoints are functional
- **Generated Client**: Auto-generated Python API client

#### Sample Results
```
[START] Starting FortiGate API Discovery...
   Target: 192.168.0.254
[OK] Connected to FortiGate FGT61FTK20020975
   Version: v7.6.4
[OK] wifi/managed_ap/select: 2 items
[OK] user/device/query: 18 items
[DONE] Discovery complete!
```

#### Use Generated Client
```python
# Use the auto-generated client
from fortigate_api_docs/generated_client import FortiGateAPIClient

client = FortiGateAPIClient("192.168.0.254", "YOUR_TOKEN")
devices = client.get_connected_clients()
aps = client.get_managed_aps()
switches = client.get_managed_switches()
```

## 🔧 Development

### Project Structure
```
network-mcp-servers/
├── fortinet-server/          # Fortinet MCP server
│   ├── src/index.ts         # Server implementation
│   ├── build/               # Compiled JavaScript
│   └── package.json
├── meraki-server/           # Meraki MCP server
│   ├── src/index.ts         # Server implementation
│   ├── build/               # Compiled JavaScript
│   └── package.json
├── fortigate-api-discovery.py    # FortiGate API discovery tool
├── FortiGate_API_Development_Guide.md  # Comprehensive development guide
├── launch-fortinet.sh       # Launcher script
├── launch-meraki.sh         # Launcher script
├── package.json             # Root package.json with build scripts
└── README.md
```

### Building
```bash
# Build all servers
npm run build:all

# Build individual servers
cd fortinet-server && npm run build
cd meraki-server && npm run build
```

### Testing
```bash
# Test Fortinet server
cd fortinet-server && npm run inspector

# Test Meraki server
cd meraki-server && npm run inspector
```

## 🔐 Security Notes

- Store API keys securely using environment variables
- Never commit API keys to version control
- Use HTTPS for production deployments
- Consider IP restrictions on API keys when possible

## 📝 API References

- [Fortinet FortiOS REST API](https://docs.fortinet.com/product/fortigate/7.4)
- [Meraki REST API](https://developer.cisco.com/meraki/api-v1/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details
