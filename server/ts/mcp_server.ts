import express from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

const MATH_API_BASE = "http://127.0.0.1:3333"; // Math API

async function callApi<T = unknown>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${MATH_API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Math API ${path} failed: ${res.status} ${res.statusText} — ${text}`);
  }
  return (await res.json()) as T;
}

function buildServer() {
  const server = new McpServer({ name: "mcp-math", version: "1.0.0" });

  server.registerTool(
    "add",
    {
      title: "Add two numbers",
      description: "Calls the Math API /add endpoint",
      inputSchema: { a: z.number(), b: z.number() },
    },
    async ({ a, b }) => {
      const data = await callApi("/add", { a, b });
      return { content: [{ type: "text", text: JSON.stringify(data) }] };
    }
  );

  server.registerTool(
    "multiply",
    {
      title: "Multiply two numbers",
      description: "Calls the Math API /multiply endpoint",
      inputSchema: { a: z.number(), b: z.number() },
    },
    async ({ a, b }) => {
      const data = await callApi("/multiply", { a, b });
      return { content: [{ type: "text", text: JSON.stringify(data) }] };
    }
  );

  return server;
}

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "*",
    exposedHeaders: ["Mcp-Session-Id"],
    allowedHeaders: ["Content-Type", "mcp-session-id"],
  })
);

const transports: Record<string, StreamableHTTPServerTransport> = {};

// POST /mcp → client-to-server (JSON-RPC over HTTP)
app.post("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  let transport: StreamableHTTPServerTransport;

  if (sessionId && transports[sessionId]) {
    transport = transports[sessionId];
  } else if (!sessionId && isInitializeRequest(req.body)) {
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (newId) => {
        transports[newId] = transport;
        res.setHeader("Mcp-Session-Id", newId);
        res.setHeader("Cache-Control", "no-store");
      },
      enableDnsRebindingProtection: true,
      allowedHosts: ["127.0.0.1", "localhost", "127.0.0.1:8000", "localhost:8000"],
    });

    transport.onclose = () => {
      if (transport.sessionId) delete transports[transport.sessionId];
    };

    const server = buildServer();
    await server.connect(transport);
  } else {
    res.status(400).json({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Bad Request: No valid session ID provided" },
      id: null,
    });
    return;
  }

  await transport.handleRequest(req, res, req.body);
});

// GET /mcp → server-to-client notifications (SSE)
app.get("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  const transport = sessionId ? transports[sessionId] : undefined;
  if (!transport) {
    res.status(400).send("Invalid or missing session ID");
    return;
  }
  await transport.handleRequest(req, res);
});

// DELETE /mcp → terminate session
app.delete("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  const transport = sessionId ? transports[sessionId] : undefined;
  if (!transport) {
    res.status(400).send("Invalid or missing session ID");
    return;
  }
  transport.close();
  delete transports[sessionId];
  res.status(204).end();
});

const PORT = 8000;
app.listen(PORT, () => {
  console.log(`MCP server listening at http://localhost:${PORT}/mcp`);
});
