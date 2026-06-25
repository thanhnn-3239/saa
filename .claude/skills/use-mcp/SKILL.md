---
name: tkm:use-mcp
description: "Access and execute MCP server capabilities with intelligent tool selection — discovers available tools and picks the best match for the current request."
argument-hint: "[task]"
metadata:
  author: takumi-agent-kit
  version: "1.0.0"
---

# Wielding Guild Tools

The skilled craftsman does not reinvent every instrument. The guild provides tools forged by specialists — each built for a specific kind of work, each more capable than a general-purpose substitute.
This skill wields those tools: MCP operations executed via Gemini CLI to preserve the context budget for the work that matters.

## Execution Steps

1. **Execute task via Gemini CLI** (using stdin pipe for MCP support):
   ```bash
   # IMPORTANT: Use stdin piping, NOT -p flag (deprecated, skips MCP init)
   # Read model from .claude/.sk.json: gemini.model (default: gemini-3-flash-preview)
   echo "$ARGUMENTS. Return JSON only per GEMINI.md instructions." | gemini -y -m <gemini.model>
   ```

2. **Fallback to mcp-manager subagent** (if Gemini CLI unavailable):
   - Use `mcp-manager` subagent to discover and execute tools
   - **DO NOT** create ANY new scripts
   - The subagent can only use MCP tools if any to achieve this task
   - If the subagent can't find any suitable tools, just report it back to the main agent to move on to the next step

## Important Notes

- **MUST use stdin piping** - the deprecated `-p` flag skips MCP initialization
- Use `-y` flag to auto-approve tool execution
- **GEMINI.md auto-loaded**: Gemini CLI automatically loads `GEMINI.md` from project root, enforcing JSON-only response format
- **Parseable output**: Responses are structured JSON: `{"server":"name","tool":"name","success":true,"result":<data>,"error":null}`

## Anti-Pattern (DO NOT USE)

```bash
# BROKEN - deprecated -p flag skips MCP server connections!
gemini -y -m <gemini.model> -p "..."

# ALSO BROKEN - --model flag with -p
gemini -y -p "..." --model gemini-3-flash-preview
```
