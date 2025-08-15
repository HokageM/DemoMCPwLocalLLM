import asyncio
import ollama
from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client

MCP_URL = "http://localhost:8000/mcp"
OLLAMA_MODEL = "qwen3:1.7b"

def mcp_tool_to_ollama(tool):
    return {
        "type": "function",
        "function": {
            "name": tool.name,
            "description": tool.description or "",
            "parameters": tool.inputSchema,
        },
    }

async def main():
    async with streamablehttp_client(MCP_URL) as (read_stream, write_stream, _):
        async with ClientSession(read_stream, write_stream) as session:
            await session.initialize()

            # Get MCP tools and adapt for Ollama
            tools_resp = await session.list_tools()
            tools = tools_resp.tools or []
            ollama_tools = [mcp_tool_to_ollama(t) for t in tools]
            print("Available tools:", [t["function"]["name"] for t in ollama_tools])

            # Initial user message
            messages = [{"role": "user", "content": "What is 45432542 plus 87468748?"}]

            # Ask Ollama with tools
            resp = ollama.chat(
                model=OLLAMA_MODEL,
                messages=messages,
                tools=ollama_tools,
            )

            msg = resp.get("message", {})
            content = msg.get("content", "")
            tool_calls = msg.get("tool_calls", [])

            # If there’s a tool call, run it
            if tool_calls:
                for call in tool_calls:
                    fn = call.get("function", {})
                    tool_name = fn.get("name")
                    raw_args = fn.get("arguments") or "{}"

                    print("Tool:", tool_name)
                    print("Args:", raw_args)

                    # Call MCP tool
                    result = await session.call_tool(tool_name, raw_args)
                    tool_output = "\n".join(
                        [c.text for c in (result.content or []) if getattr(c, "text", None)]
                    )

                    print("Tool output:", tool_output)
            else:
                print(content)

if __name__ == "__main__":
    asyncio.run(main())
