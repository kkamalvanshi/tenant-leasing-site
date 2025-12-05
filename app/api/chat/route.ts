import { NextRequest } from 'next/server'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

// MCP Server - tenant-leasing MCP via SSE
const MCP_SERVER_URL = 'https://tenant-leasing-mcp.onrender.com/sse'

// File attachment types
interface FileAttachment {
  type: 'image' | 'pdf' | 'docx'
  filename: string
  base64: string
  mimeType: string
}

// Define MCP tools that Claude can use (matching tenant-leasing MCP server)
const MCP_TOOLS = [
  {
    name: "get_schema",
    description: "Get the full database schema showing all tables and columns. Use this first to understand the data model before writing queries.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: []
    }
  },
  {
    name: "query_database",
    description: "Execute a SQL query on the tenant leasing database. Available tables: guest_cards (prospective tenant inquiries), nearby_units (comparable rental listings). Only SELECT queries are allowed.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "SQL SELECT query to execute"
        }
      },
      required: ["query"]
    }
  },
  {
    name: "guest_card_summary",
    description: "Get a comprehensive summary of all guest cards/inquiries. Shows total inquiries, activity breakdown, and prospect quality metrics.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: []
    }
  },
  {
    name: "qualified_prospects",
    description: "Find qualified prospects based on income and credit requirements.",
    input_schema: {
      type: "object" as const,
      properties: {
        min_income: {
          type: "number",
          description: "Minimum monthly income (default: 7200 = 3x $2,400 rent)"
        },
        min_credit: {
          type: "string",
          description: "Minimum credit score threshold (default: 660)"
        }
      },
      required: []
    }
  },
  {
    name: "market_rent_analysis",
    description: "Analyze nearby rental market conditions and pricing. Shows rent distribution, comparisons, and market positioning.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: []
    }
  },
  {
    name: "generate_leasing_email",
    description: "Generate a professional leasing update email based on actual guest card and market data.",
    input_schema: {
      type: "object" as const,
      properties: {
        recipient_name: { type: "string", description: "Name of email recipient" },
        sender_name: { type: "string", description: "Name of sender" },
        current_rate: { type: "number", description: "Current advertised rent rate" },
        previous_rate: { type: "number", description: "Previous rent rate" },
        showings_confirmed: { type: "number", description: "Number of confirmed showings" },
        showings_attended: { type: "number", description: "Number who actually showed up" },
        interested_parties: { type: "number", description: "Number who seemed interested" },
        pending_applications: { type: "number", description: "Current pending applications" },
        withdrawn_applications: { type: "number", description: "Applications that were withdrawn" },
        upcoming_showings: { type: "number", description: "Scheduled upcoming showings" }
      },
      required: []
    }
  },
  {
    name: "create_market_report",
    description: "Generate a comprehensive visual report with charts showing insights from guest cards and nearby advertised units.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: []
    }
  },
  {
    name: "create_individual_chart",
    description: "Generate a specific chart. Types: rent_histogram, credit_pie, pet_bar, budget_histogram, price_comparison, activity_pie, income_vs_rent, similarity_rent",
    input_schema: {
      type: "object" as const,
      properties: {
        chart_type: {
          type: "string",
          description: "Type of chart to create",
          enum: ["rent_histogram", "credit_pie", "pet_bar", "budget_histogram", "price_comparison", "activity_pie", "income_vs_rent", "similarity_rent"]
        }
      },
      required: ["chart_type"]
    }
  }
]

const SYSTEM_PROMPT = `You are a helpful tenant leasing assistant connected to the "tenant-leasing" MCP server at ${MCP_SERVER_URL}.

You have access to two main data tables:
1. **guest_cards** - Prospective tenant inquiries with name, interest date, last activity, status, move-in preference, max rent, bed/bath preference, pet preference, monthly income, and credit score
2. **nearby_units** - Market comparison data showing similar units nearby with similarity %, beds, baths, sqft, location, last advertised date, and rent

Available MCP Tools:
1. **get_schema** - View database structure (use this first to understand the data)
2. **query_database** - Run SQL queries on guest_cards and nearby_units tables
3. **guest_card_summary** - Get comprehensive overview of all prospects
4. **qualified_prospects** - Find prospects meeting income/credit criteria (3x rent rule)
5. **market_rent_analysis** - Analyze nearby rental market conditions and pricing
6. **generate_leasing_email** - Create professional leasing update emails based on real data
7. **create_market_report** - Generate visual report with multiple charts
8. **create_individual_chart** - Create specific charts (rent_histogram, credit_pie, pet_bar, budget_histogram, price_comparison, activity_pie, income_vs_rent, similarity_rent)

When answering questions:
- ALWAYS use tools to get real data - never make up numbers
- Be concise and actionable
- Use markdown formatting for tables and lists
- For complex analysis, use query_database with appropriate SQL
- Reference actual values from the database
- The subject property baseline rent is $2,400`

// MCP Client singleton with connection management
let mcpClient: Client | null = null
let mcpConnected = false

async function getMCPClient(): Promise<Client> {
  if (mcpClient && mcpConnected) {
    return mcpClient
  }

  console.log(`[MCP] Connecting to ${MCP_SERVER_URL}`)
  
  // Create SSE transport to the tenant-leasing MCP server
  const transport = new SSEClientTransport(new URL(MCP_SERVER_URL))
  
  // Create MCP client
  mcpClient = new Client({
    name: 'webui-client',
    version: '1.0.0'
  }, {
    capabilities: {}
  })
  
  // Connect to the server
  await mcpClient.connect(transport)
  mcpConnected = true
  
  console.log('[MCP] ✓ Connected to tenant-leasing MCP server')
  
  // List available tools
  const tools = await mcpClient.listTools()
  console.log('[MCP] Available tools:', tools.tools.map(t => t.name))
  
  return mcpClient
}

// Call MCP tool via the official SDK
async function callMCPTool(toolName: string, toolInput: Record<string, unknown>): Promise<string> {
  console.log(`[MCP] Calling tool: ${toolName}`)
  
  try {
    const client = await getMCPClient()
    
    // Call the tool
    const result = await client.callTool({
      name: toolName,
      arguments: toolInput
    })
    
    console.log(`[MCP] ✓ Tool ${toolName} completed`)
    
    // Extract text content from result
    if (result.content && Array.isArray(result.content)) {
      const textContent = result.content.find((c: { type: string }) => c.type === 'text')
      if (textContent && 'text' in textContent) {
        return textContent.text as string
      }
      return JSON.stringify(result.content)
    }
    
    return JSON.stringify(result)
  } catch (error) {
    console.error('[MCP] Error calling tool:', error)
    // Reset connection on error
    mcpClient = null
    mcpConnected = false
    return `Error: Failed to call tool "${toolName}". ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}

// Process tool calls (non-streaming) and return the final messages array
async function processToolCalls(
  apiKey: string,
  initialMessages: Array<{role: string; content: string | unknown[]}>
): Promise<{messages: Array<{role: string; content: unknown}>; toolsUsed: string[]; generatedFiles: FileAttachment[]}> {
  const conversationMessages = [...initialMessages]
  const toolsUsed: string[] = []
  const generatedFiles: FileAttachment[] = []
  
  let response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: MCP_TOOLS,
      messages: conversationMessages,
    }),
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  let data = await response.json()
  let loopCount = 0
  const maxLoops = 10

  while (data.stop_reason === 'tool_use' && loopCount < maxLoops) {
    loopCount++
    
    const toolUses = data.content.filter((block: { type: string }) => block.type === 'tool_use')
    console.log(`[Chat] Tool use loop ${loopCount}, ${toolUses.length} tools to execute via MCP`)
    
    conversationMessages.push({
      role: 'assistant',
      content: data.content
    })
    
    const toolResults = []
    for (const toolUse of toolUses) {
      console.log(`[Chat] Calling MCP tool: ${toolUse.name}`)
      toolsUsed.push(toolUse.name)
      
      // Call the tool via MCP SDK
      const result = await callMCPTool(toolUse.name, toolUse.input || {})
      
      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: result
      })
    }
    
    conversationMessages.push({
      role: 'user',
      content: toolResults
    })
    
    response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        tools: MCP_TOOLS,
        messages: conversationMessages,
      }),
    })
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    
    data = await response.json()
  }

  return { messages: conversationMessages, toolsUsed, generatedFiles }
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()
    
    const apiKey = process.env.ANTHROPIC_API_KEY
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured. Add it to your .env.local file.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const initialMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    }))

    // First, process any tool calls via MCP
    let finalMessages = initialMessages
    let toolsUsed: string[] = []
    let generatedFiles: FileAttachment[] = []
    
    try {
      const result = await processToolCalls(apiKey, initialMessages)
      finalMessages = result.messages
      toolsUsed = result.toolsUsed
      generatedFiles = result.generatedFiles
    } catch (error) {
      console.error('Error processing tools:', error)
      // Continue with original messages if tool processing fails
    }

    // Now stream the final response
    const streamResponse = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        stream: true,
        messages: finalMessages,
      }),
    })

    if (!streamResponse.ok) {
      const errorData = await streamResponse.text()
      console.error('Anthropic streaming API error:', errorData)
      return new Response(
        JSON.stringify({ error: `API error: ${streamResponse.status}` }),
        { status: streamResponse.status, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create a ReadableStream to process and forward SSE events
    const encoder = new TextEncoder()
    
    const stream = new ReadableStream({
      async start(controller) {
        const reader = streamResponse.body?.getReader()
        if (!reader) {
          controller.close()
          return
        }
        
        const decoder = new TextDecoder()
        let buffer = ''
        
        // Send MCP server info at the start
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'mcp_server', 
          url: MCP_SERVER_URL 
        })}\n\n`))
        
        // Send tools used info at the start if any
        if (toolsUsed.length > 0) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'tools_used', 
            tools: toolsUsed 
          })}\n\n`))
        }
        
        // Send generated files if any
        if (generatedFiles.length > 0) {
          for (const file of generatedFiles) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'file',
              fileType: file.type,
              filename: file.filename,
              base64: file.base64,
              mimeType: file.mimeType
            })}\n\n`))
          }
        }
        
        try {
          while (true) {
            const { done, value } = await reader.read()
            
            if (done) {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'))
              controller.close()
              break
            }
            
            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''
            
            for (const line of lines) {
              if (line.startsWith('event: ')) continue
              
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim()
                if (!data || data === '') continue
                
                try {
                  const parsed = JSON.parse(data)
                  
                  switch (parsed.type) {
                    case 'message_start':
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                        type: 'message_start',
                        id: parsed.message?.id
                      })}\n\n`))
                      break
                      
                    case 'content_block_start':
                      if (parsed.content_block?.type === 'text') {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                          type: 'content_start',
                          index: parsed.index
                        })}\n\n`))
                      }
                      break
                      
                    case 'content_block_delta':
                      if (parsed.delta?.type === 'text_delta') {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                          type: 'text', 
                          content: parsed.delta.text 
                        })}\n\n`))
                      }
                      break
                      
                    case 'content_block_stop':
                      break
                      
                    case 'message_delta':
                      if (parsed.delta?.stop_reason) {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                          type: 'message_delta',
                          stop_reason: parsed.delta.stop_reason
                        })}\n\n`))
                      }
                      break
                      
                    case 'message_stop':
                      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                      break
                      
                    case 'ping':
                      break
                      
                    case 'error':
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                        type: 'error',
                        error: parsed.error?.message || 'Unknown error'
                      })}\n\n`))
                      break
                  }
                } catch {
                  // Ignore JSON parse errors
                }
              }
            }
          }
        } catch (error) {
          console.error('Stream reading error:', error)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'error',
            error: 'Stream reading failed'
          })}\n\n`))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to process request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
