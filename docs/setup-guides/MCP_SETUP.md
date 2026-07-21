# Model Context Protocol (MCP) Implementation

This document describes the Model Context Protocol implementation for the Blotic website.

## What is Model Context Protocol?

Model Context Protocol (MCP) is an open standard that allows AI applications to connect to external systems, providing access to data, tools, and workflows. Think of it as a "USB-C port for AI" - a standardized way for AI models to interact with external resources.

## MCP Server Implementation

The Blotic website includes an MCP server that exposes tools and resources related to the application.

### Available Tools

1. **get_user_info** - Retrieve user profile information by user ID
2. **get_events** - Retrieve upcoming events
3. **get_core_team** - Retrieve information about core team members

### Available Resources

1. **blotic://stats** - Application statistics including user counts, event counts, and role distribution

## Running the MCP Server

The MCP server runs on port 3002 and can be started using:

```bash
npm run mcp-server
```

For development with auto-reload:

```bash
npm run mcp-server:dev
```

## Connecting to the MCP Server

The MCP server is available at `http://localhost:3002/mcp` and supports Streamable HTTP transport.

### Health Check Endpoint

A health check endpoint is available at `http://localhost:3002/mcp/health` to verify the server is running.

## Example Usage

To test the MCP server, you can run:

```bash
node server/mcp-test-client.ts
```

This will perform a health check and verify the server is responding correctly.

## Integration with AI Assistants

The MCP server can be connected to AI assistants like Claude Desktop by configuring the MCP server in the client application. The server exposes tools and resources that AI assistants can use to access Blotic website data.

## Extending the MCP Server

To add new tools or resources to the MCP server:

1. Edit `server/mcp-server.ts`
2. Add new tool implementations using `server.registerTool()`
3. Add new resources using `server.registerResource()`
4. Restart the MCP server

### Example Tool Implementation

```typescript
server.registerTool(
  'tool_name',
  {
    title: 'Tool Title',
    description: 'Tool description',
    inputSchema: { parameter: z.string() },
    outputSchema: { result: z.string() }
  },
  async ({ parameter }) => {
    // Implementation here
    const output = { result: `Processed: ${parameter}` };
    return {
      content: [{ type: 'text', text: JSON.stringify(output) }],
      structuredContent: output
    };
  }
);
```

### Example Resource Implementation

```typescript
server.registerResource(
  'resource-name',
  'blotic://resource-path',
  {
    title: 'Resource Title',
    description: 'Resource description',
    mimeType: 'application/json'
  },
  async () => {
    // Implementation here
    return {
      contents: [
        {
          uri: 'blotic://resource-path',
          text: JSON.stringify({ data: 'resource data' }),
          mimeType: 'application/json'
        }
      ]
    };
  }
);
```

## Security Considerations

The MCP server uses the same Supabase service role key as the main application server, so it has administrative access to the database. Ensure the MCP server is only accessible from trusted sources.

## Troubleshooting

If the MCP server is not responding:

1. Check that the server is running: `npm run mcp-server`
2. Verify the port (3002) is not blocked by firewall
3. Check the console output for error messages
4. Ensure all environment variables are properly configured

For connection issues with AI assistants:

1. Verify the MCP server URL is correct
2. Check that the transport protocol is supported
3. Ensure the AI assistant supports MCP connections