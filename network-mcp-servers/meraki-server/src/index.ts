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

const MERAKI_API_KEY = process.env.MERAKI_API_KEY;
const MERAKI_BASE_URL = process.env.MERAKI_BASE_URL || 'https://api.meraki.com/api/v1';

if (!MERAKI_API_KEY) {
  throw new Error('MERAKI_API_KEY environment variable is required');
}

interface MerakiOrganization {
  id: string;
  name: string;
  url: string;
}

interface MerakiNetwork {
  id: string;
  organizationId: string;
  name: string;
  productTypes: string[];
  timeZone: string;
  tags: string[];
}

interface MerakiDevice {
  serial: string;
  name: string;
  networkId: string;
  model: string;
  mac: string;
  lanIp: string;
  tags: string[];
  beaconIdParams: any;
}

interface MerakiClient {
  id: string;
  mac: string;
  description: string;
  ip: string;
  user: string;
  firstSeen: number;
  lastSeen: number;
  manufacturer: string;
  os: string;
  recentDeviceSerial: string;
  recentDeviceName: string;
  recentDeviceMac: string;
  ssid: string;
  status: string;
  notes: string;
  ip6: string;
  ip6Local: string;
}

class MerakiServer {
  private server: Server;
  private axiosInstance: AxiosInstance;

  constructor() {
    this.server = new Server(
      {
        name: 'meraki-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.axiosInstance = axios.create({
      baseURL: MERAKI_BASE_URL,
      headers: {
        'X-Cisco-Meraki-API-Key': MERAKI_API_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    this.setupToolHandlers();

    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private async makeRequest<T = any>(endpoint: string): Promise<T> {
    try {
      const response = await this.axiosInstance.get(endpoint);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new McpError(
          ErrorCode.InternalError,
          `Meraki API error: ${error.response?.status} - ${error.response?.data?.errors?.[0] || error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'get_organizations',
          description: 'Get list of Meraki organizations accessible with the API key',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          },
        },
        {
          name: 'get_networks',
          description: 'Get networks for a specific organization',
          inputSchema: {
            type: 'object',
            properties: {
              organizationId: {
                type: 'string',
                description: 'Organization ID'
              }
            },
            required: ['organizationId']
          },
        },
        {
          name: 'get_devices',
          description: 'Get devices for a specific organization',
          inputSchema: {
            type: 'object',
            properties: {
              organizationId: {
                type: 'string',
                description: 'Organization ID'
              }
            },
            required: ['organizationId']
          },
        },
        {
          name: 'get_network_devices',
          description: 'Get devices for a specific network',
          inputSchema: {
            type: 'object',
            properties: {
              networkId: {
                type: 'string',
                description: 'Network ID'
              }
            },
            required: ['networkId']
          },
        },
        {
          name: 'get_clients',
          description: 'Get clients connected to a specific network',
          inputSchema: {
            type: 'object',
            properties: {
              networkId: {
                type: 'string',
                description: 'Network ID'
              },
              timespan: {
                type: 'number',
                description: 'Timespan in seconds to look back for client data (default: 86400 = 24 hours)'
              }
            },
            required: ['networkId']
          },
        },
        {
          name: 'get_device_details',
          description: 'Get detailed information about a specific device',
          inputSchema: {
            type: 'object',
            properties: {
              serial: {
                type: 'string',
                description: 'Device serial number'
              }
            },
            required: ['serial']
          },
        },
        {
          name: 'get_organization_inventory',
          description: 'Get hardware inventory for an organization',
          inputSchema: {
            type: 'object',
            properties: {
              organizationId: {
                type: 'string',
                description: 'Organization ID'
              }
            },
            required: ['organizationId']
          },
        },
        {
          name: 'get_network_ssids',
          description: 'Get SSID configurations for a wireless network',
          inputSchema: {
            type: 'object',
            properties: {
              networkId: {
                type: 'string',
                description: 'Network ID'
              }
            },
            required: ['networkId']
          },
        },
        {
          name: 'get_switch_ports',
          description: 'Get switch port statuses for a specific device',
          inputSchema: {
            type: 'object',
            properties: {
              serial: {
                type: 'string',
                description: 'Switch serial number'
              }
            },
            required: ['serial']
          },
        },
        {
          name: 'query_api_endpoint',
          description: 'Query any Meraki API endpoint directly',
          inputSchema: {
            type: 'object',
            properties: {
              endpoint: {
                type: 'string',
                description: 'API endpoint path (e.g., /organizations)'
              }
            },
            required: ['endpoint']
          },
        }
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case 'get_organizations': {
          const data = await this.makeRequest<MerakiOrganization[]>('/organizations');
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(data, null, 2),
              },
            ],
          };
        }

        case 'get_networks': {
          const organizationId = String(request.params.arguments?.organizationId);
          if (!organizationId) {
            throw new McpError(ErrorCode.InvalidParams, 'Organization ID is required');
          }
          const data = await this.makeRequest<MerakiNetwork[]>(`/organizations/${organizationId}/networks`);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(data, null, 2),
              },
            ],
          };
        }

        case 'get_devices': {
          const organizationId = String(request.params.arguments?.organizationId);
          if (!organizationId) {
            throw new McpError(ErrorCode.InvalidParams, 'Organization ID is required');
          }
          const data = await this.makeRequest<MerakiDevice[]>(`/organizations/${organizationId}/devices`);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(data, null, 2),
              },
            ],
          };
        }

        case 'get_network_devices': {
          const networkId = String(request.params.arguments?.networkId);
          if (!networkId) {
            throw new McpError(ErrorCode.InvalidParams, 'Network ID is required');
          }
          const data = await this.makeRequest<MerakiDevice[]>(`/networks/${networkId}/devices`);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(data, null, 2),
              },
            ],
          };
        }

        case 'get_clients': {
          const networkId = String(request.params.arguments?.networkId);
          const timespan = request.params.arguments?.timespan || 86400;
          if (!networkId) {
            throw new McpError(ErrorCode.InvalidParams, 'Network ID is required');
          }
          const data = await this.makeRequest<MerakiClient[]>(`/networks/${networkId}/clients?timespan=${timespan}`);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(data, null, 2),
              },
            ],
          };
        }

        case 'get_device_details': {
          const serial = String(request.params.arguments?.serial);
          if (!serial) {
            throw new McpError(ErrorCode.InvalidParams, 'Device serial is required');
          }
          const data = await this.makeRequest(`/devices/${serial}`);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(data, null, 2),
              },
            ],
          };
        }

        case 'get_organization_inventory': {
          const organizationId = String(request.params.arguments?.organizationId);
          if (!organizationId) {
            throw new McpError(ErrorCode.InvalidParams, 'Organization ID is required');
          }
          const data = await this.makeRequest(`/organizations/${organizationId}/inventory/devices`);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(data, null, 2),
              },
            ],
          };
        }

        case 'get_network_ssids': {
          const networkId = String(request.params.arguments?.networkId);
          if (!networkId) {
            throw new McpError(ErrorCode.InvalidParams, 'Network ID is required');
          }
          const data = await this.makeRequest(`/networks/${networkId}/wireless/ssids`);
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
          const serial = String(request.params.arguments?.serial);
          if (!serial) {
            throw new McpError(ErrorCode.InvalidParams, 'Device serial is required');
          }
          const data = await this.makeRequest(`/devices/${serial}/switch/ports`);
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
    console.error('Meraki MCP server running on stdio');
  }
}

const server = new MerakiServer();
server.run().catch(console.error);
