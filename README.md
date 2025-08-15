# Demo MCP (Client/Server) with Local LLM

This is a demo project showing how to create an **MCP client** with a **local LLM** in both Python and TypeScript.  
It also demonstrates how to configure an **MCP server** in Python (with FastAPI) and in TypeScript.

The workflow is as follows:
1. The MCP client requests a list of available tools from the MCP server.
2. The local LLM decides which tool to use based on the given prompt.
3. If a tool is selected, the client calls the tool on the server and returns the result.

All combinations of clients in `{Python, TypeScript}` and servers in `{Python, TypeScript}` are supported.

---

## Table of Contents

1. [Ollama Model](#ollama-model)  
2. [MCP Client](#mcp-client)  
   - [Python](#python)  
   - [TypeScript](#typescript)  
3. [MCP Server](#mcp-server)  
   - [Python and FastAPI](#python-and-fastapi)  
   - [TypeScript](#typescript-1)  

---

## Ollama Model

For the demo, a small, lightweight model is used.  
I selected a model that **returns tool arguments in the correct data types** instead of as strings.  

For example:  

❌ Problem with some models (e.g., `llama3.2`):  
```json
{"a":"4","b":"8"}
```

✅ Desired output:  
```json
{"a":4,"b":8}
```

This avoids having to manually parse and convert argument values.

Pull the model with (requires [OLLAMA](https://github.com/ollama/ollama)):
```bash
ollama pull gwen3:1.7b
```

---

## MCP Client

> Make sure an MCP server is running locally at `http://localhost:8000/mcp`.

For the demo, the prompt used is:  
```
What is 45432542 plus 87468748?
```

### Python

```bash
cd client/py
pip install -r requirements.txt
python mcp_client.py
```

Example output:
```bash
Available tools: ['root__get', 'add', 'multiply']
Tool: add
Args: {'a': 45432542, 'b': 87468748}
Tool output: {
  "operation": "add",
  "a": 45432542,
  "b": 87468748,
  "result": 132901290
}
```

### TypeScript

```bash
cd client/ts
npm install
npm run start
```

Example output:
```bash
Available tools: [ 'root__get', 'add', 'multiply' ]
Tool: add
Args: {"a":45432542,"b":87468748}
Tool output: {
  "operation": "add",
  "a": 45432542,
  "b": 87468748,
  "result": 132901290
}
```

---

## MCP Server

### Python and FastAPI

This example shows how to add MCP endpoints to an existing FastAPI application.

```bash
cd server/py
pip install -r requirements.txt
python mcp_server.py
```

---

### TypeScript

```bash
cd server/ts
npm install
```

First start the math API (runs on `http://localhost:3333`):
```bash
npm run api
```

Then start the MCP server:
```bash
npm run mcp
```

> In this TypeScript approach, tools need to be defined manually.  
> Currently, there is no direct equivalent to **FastAPI-MCP** in the TypeScript ecosystem.
