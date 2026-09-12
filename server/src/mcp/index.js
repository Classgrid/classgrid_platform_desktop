import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { getMcpTools, handleToolCall } from './tools.js';

// Initialize the MCP Server
export const mcpServer = new Server(
  {
    name: 'classgrid-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register the ListTools handler
mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: getMcpTools(),
  };
});

// Register the CallTool handler
mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    return await handleToolCall(name, args);
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: error.message }],
    };
  }
});

// Create Express Middleware/Routes for MCP SSE
export const createMcpRouter = (expressRouter) => {
  let transport = null;

  // The primary endpoint where the AI establishes the SSE connection
  expressRouter.get('/mcp/sse', async (req, res) => {
    transport = new SSEServerTransport('/mcp/messages', res);
    await mcpServer.connect(transport);
  });

  // The endpoint where the AI posts messages/tool calls back to the server
  expressRouter.post('/mcp/messages', async (req, res) => {
    if (!transport) {
      return res.status(503).send('SSE transport not initialized. Connect to /mcp/sse first.');
    }
    await transport.handlePostMessage(req, res);
  });

  return expressRouter;
};
