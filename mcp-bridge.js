#!/usr/bin/env node
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

async function run() {
  const REMOTE_URL = process.env.MCP_REMOTE_URL || "https://api.classgrid.in";
  const TOKEN = process.env.MCP_API_KEY || "dev-key-123";

  console.error(`Connecting to Classgrid MCP Server at ${REMOTE_URL}...`);

  // 1. Setup Remote SSE Transport
  const sseUrl = new URL(`${REMOTE_URL}/api/mcp/sse?token=${TOKEN}`);
  const sseTransport = new SSEClientTransport(sseUrl);

  // 2. Setup Local Stdio Transport (Claude/Cursor communicates here)
  const stdioTransport = new StdioServerTransport();

  // 3. Start Transports
  await sseTransport.start();
  await stdioTransport.start();

  console.error(`Bridge connected!`);

  // 4. Pipe messages directly between them
  sseTransport.onmessage = (msg) => {
    stdioTransport.send(msg);
  };

  stdioTransport.onmessage = (msg) => {
    sseTransport.send(msg);
  };

  sseTransport.onclose = () => {
    console.error("Remote SSE closed.");
    process.exit(0);
  };

  stdioTransport.onclose = () => {
    console.error("Local Stdio closed.");
    process.exit(0);
  };
}

run().catch((err) => {
  console.error("Bridge Error:", err);
  process.exit(1);
});
