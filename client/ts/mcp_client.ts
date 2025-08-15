import ollama from 'ollama';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const MCP_URL = 'http://localhost:8000/mcp';
const OLLAMA_MODEL = 'qwen3:1.7b';

// Convert an MCP tool to Ollama tool schema
function mcpToolToOllama(tool: {
  name: string;
  description?: string | null;
  inputSchema?: unknown;
}) {
  return {
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description ?? '',
      parameters: tool.inputSchema ?? { type: 'object', properties: {} },
    },
  };
}

async function main() {
  const client = new Client({ name: 'ts-mcp-client', version: '1.0.0' });
  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL));
  await client.connect(transport);

  const toolsResp = await client.listTools();
  const mcpTools = toolsResp.tools ?? [];
  const ollamaTools = mcpTools.map(mcpToolToOllama);

  console.log(
    'Available tools:',
    ollamaTools.map((t) => t.function.name)
  );

  const messages = [
    { role: 'user' as const, content: 'What is 45432542 plus 87468748?' },
  ];

  const resp = await ollama.chat({
    model: OLLAMA_MODEL,
    messages,
    tools: ollamaTools,
    stream: false,
  });

  const msg = resp.message ?? {};
  const content = msg.content ?? '';
  const toolCalls = (msg as any).tool_calls as
    | Array<{ function: { name: string; arguments: any } }>
    | undefined;

  if (toolCalls && toolCalls.length > 0) {
    for (const call of toolCalls) {
      const fn = call.function ?? {};
      const toolName = fn.name;
      const argsObj = fn.arguments ?? {};

      console.log('Tool:', toolName);
      console.log('Args:', JSON.stringify(argsObj));

      const result = await client.callTool({
        name: toolName,
        arguments: argsObj,
      });

      const toolOutput =
        (result.content ?? [])
          .filter((c: any) => c?.type === 'text' && typeof c.text === 'string')
          .map((c: any) => c.text)
          .join('\n') || '';

      console.log('Tool output:', toolOutput);
    }
  } else {
    console.log(content);
  }

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
