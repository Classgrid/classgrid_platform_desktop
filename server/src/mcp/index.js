/*
 * =========================================================================================
 * 🚨 CRITICAL AI & SYSTEM RULE 🚨
 * NO FRONTEND GITHUB ACTIONS: NEVER create yaml files that build/deploy the frontend to EC2.
 * The frontend is hosted 100% on Vercel. EC2 is only for the backend.
 * =========================================================================================
 */

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

  const checkMcpAuth = (req, res, next) => {
    const token = req.query.token || req.headers['x-mcp-api-key'];
    if (!process.env.MCP_API_KEY) {
      console.warn("⚠️ MCP_API_KEY is not set in environment. Defaulting to insecure 'dev-key-123'");
    }
    const expectedKey = process.env.MCP_API_KEY || 'dev-key-123';
    
    if (token !== expectedKey) {
      return res.status(401).json({ error: "Unauthorized. Invalid MCP token." });
    }
    next();
  };

  // The primary endpoint where the AI establishes the SSE connection
  expressRouter.get('/mcp/sse', checkMcpAuth, async (req, res) => {
    try {
      if (transport) {
        await transport.close();
      }
      await mcpServer.close();
    } catch (e) {
      // Ignore close errors
    }

    transport = new SSEServerTransport('/api/mcp/messages?token=' + req.query.token, res);
    await mcpServer.connect(transport);
  });

  // The endpoint where the AI posts messages/tool calls back to the server
  expressRouter.post('/mcp/messages', checkMcpAuth, async (req, res) => {
    if (!transport) {
      return res.status(503).send('SSE transport not initialized. Connect to /mcp/sse first.');
    }
    await transport.handlePostMessage(req, res);
  });

  return expressRouter;
};
