#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import axios, { AxiosInstance } from 'axios';

const FORTIGATE_HOST = process.env.FORTIGATE_HOST || '192.168.0.254';
const FORTIGATE_PORT = process.env.FORTIGATE_PORT || '10443';
const FORTIGATE_API_TOKEN = process.env.FORTIGATE_API_TOKEN;
const FORTIGATE_VERIFY_SSL = process.env.FORTIGATE_VERIFY_SSL !== 'false';

if (!FORTIGATE_API_TOKEN) {
  throw new Error('FORTIGATE_API_TOKEN environment variable is required');
}

interface FortiGateResponse<T = any> {
  http_status: number;
  results: T[];
  vdom: string;
  path: string;
  name: string;
  status: string;
  serial: string;
  version: string;
  build: number;
}

class FortinetServer {
  private server: Server;
  private axiosInstance: AxiosInstance;

  constructor() {
    this.server = new Server(
      {
        name: 'fortinet-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.axiosInstance = axios.create({
      baseURL: `https://${FORTIGATE_HOST}:${FORTIGATE_PORT}/api/v2`,
      headers: {
        'Authorization': `Bearer ${FORTIGATE_API_TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      httpsAgent: FORTIGATE_VERIFY_SSL ? undefined : new (require('https').Agent)({
        rejectUnauthorized: false
      })
    });

    this.setupToolHandlers();

    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private async makeRequest<T = any>(endpoint: string): Promise<FortiGateResponse<T>> {
    try {
      const response = await this.axiosInstance.get(endpoint);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new McpError(
          ErrorCode.InternalError,
          `FortiGate API error: ${error.response?.status} - ${error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'get_system_status',
          description: 'Get FortiGate system status including version, hostname, CPU/memory usage',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          },
        },
        {
          name: 'get_managed_switches',
          description: 'Get information about managed FortiSwitch devices',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          },
        },
        {
          name: 'get_access_points',
          description: 'Get information about managed FortiAP access points',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          },
        },
        {
          name: 'get_connected_devices',
          description: 'Get information about connected user devices and endpoints',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          },
        },
        {
          name: 'get_firewall_policies',
          description: 'Get firewall policy configurations',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          },
        },
        {
          name: 'get_interfaces',
          description: 'Get network interface configurations and status',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          },
        },
        {
          name: 'get_vpn_tunnels',
          description: 'Get IPsec VPN tunnel status and configurations',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          },
        },
        {
          name: 'get_dhcp_leases',
          description: 'Get DHCP lease information',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          },
        },
        {
          name: 'get_switch_ports',
          description: 'Get switch port statistics and status',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          },
        },
        {
          name: 'query_api_endpoint',
          description: 'Query any FortiGate API endpoint directly',
          inputSchema: {
            type: 'object',
            properties: {
              endpoint: {
                type: 'string',
                description: 'API endpoint path (e.g., /monitor/system/status)'
              }
            },
            required: ['endpoint']
          },
        }
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case 'get_system_status': {
          const data = await this.makeRequest('/monitor/system/status');
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(data, null, 2),
              },
            ],
          };
        }

        case 'get_managed_switches': {
          const data = await this.makeRequest('/monitor/switch-controller/managed-switch/select/');
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(data, null, 2),
              },
            ],
          };
        }

        case 'get_access_points': {
          const data = await this.makeRequest('/monitor/wifi/managed_ap/select/');
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(data, null, 2),
              },
            ],
          };
        }

        case 'get_connected_devices': {
          const data = await this.makeRequest('/monitor/user/device/query');
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(data, null, 2),
              },
            ],
          };
        }

        case 'get_firewall_policies': {
          const data = await this.makeRequest('/cmdb/firewall/policy');
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(data, null, 2),
              },
            ],
          };
        }

        case 'get_interfaces': {
          const data = await this.makeRequest('/cmdb/system/interface');
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(data, null, 2),
              },
            ],
          };
        }

        case 'get_vpn_tunnels': {
          const data = await this.makeRequest('/monitor/vpn/ipsec');
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(data, null, 2),
              },
            ],
          };
        }

        case 'get_dhcp_leases': {
          const data = await this.makeRequest('/monitor/system/dhcp/lease');
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(data, null, 2),
              },
            ],
          };
        }

        case 'get_switch_ports': {
          const data = await this.makeRequest('/monitor/switch-controller/managed-switch/select/?port_stats=true');
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(data, null, 2),
              },
            ],
          };
        }

        case 'query_api_endpoint': {
          const endpoint = String(request.params.arguments?.endpoint);
          if (!endpoint) {
            throw new McpError(ErrorCode.InvalidParams, 'Endpoint is required');
          }
          const data = await this.makeRequest(endpoint);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(data, null, 2),
              },
            ],
          };
        }

        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`
          );
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Fortinet MCP server running on stdio');
  }
}

const server = new FortinetServer();
server.run().catch(console.error);
