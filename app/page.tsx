'use client'

import { useState, useCallback } from 'react'
import ChatArea from '@/components/ChatArea'
import DataTables from '@/components/DataTables'
import { Message, Conversation, FileAttachment } from '@/types'
import { Sparkles } from 'lucide-react'

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')

  // Create a simple conversation object from messages
  const currentConversation: Conversation | undefined = messages.length > 0 
    ? {
        id: '1',
        title: 'Current Chat',
        messages,
        createdAt: new Date(),
      }
    : undefined

  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    }

    // Add user message
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setIsLoading(true)
    setStreamingContent('')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      // Check if response is streaming (SSE) or JSON error
      const contentType = response.headers.get('content-type')
      
      if (contentType?.includes('application/json')) {
        // Non-streaming error response
        const data = await response.json()
        let errorContent = `⚠️ **Error:** ${data.error}`
        
        // Provide helpful context based on error type
        if (response.status === 429 || data.error?.includes('Rate limit')) {
          errorContent = `⏳ **Rate Limit Exceeded**\n\nThe API is temporarily rate limited. Please wait ${data.retryAfter || 30} seconds and try again.\n\n*This happens when too many requests are made in a short period.*`
        } else if (response.status === 401 || data.error?.includes('API key')) {
          errorContent = `🔑 **API Key Error**\n\nMake sure to add your Anthropic API key to \`.env.local\`:\n\`\`\`\nANTHROPIC_API_KEY=your-api-key-here\n\`\`\``
        }
        
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: errorContent,
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, errorMessage])
        setIsLoading(false)
        return
      }

      // Handle SSE streaming response
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      const decoder = new TextDecoder()
      let accumulatedContent = ''
      let toolsUsed: string[] = []
      let attachedFiles: FileAttachment[] = []

      // Add placeholder message for streaming
      const aiMessageId = (Date.now() + 1).toString()
      const placeholderMessage: Message = {
        id: aiMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        files: [],
      }
      setMessages(prev => [...prev, placeholderMessage])
      setIsStreaming(true)

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break
        
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            
            if (data === '[DONE]') {
              // Stream complete
              continue
            }
            
            try {
              const parsed = JSON.parse(data)
              
              switch (parsed.type) {
                case 'text':
                  // Append text delta to accumulated content
                  accumulatedContent += parsed.content
                  setStreamingContent(accumulatedContent)
                  // Update the message in place
                  setMessages(prev => 
                    prev.map(m => 
                      m.id === aiMessageId 
                        ? { ...m, content: accumulatedContent }
                        : m
                    )
                  )
                  break
                  
                case 'tools_used':
                  toolsUsed = parsed.tools
                  console.log('Tools used:', toolsUsed)
                  break
                  
                case 'file':
                  // Handle file attachments (images, PDFs, DOCX)
                  const fileAttachment: FileAttachment = {
                    type: parsed.fileType,
                    filename: parsed.filename,
                    base64: parsed.base64,
                    mimeType: parsed.mimeType
                  }
                  attachedFiles.push(fileAttachment)
                  console.log('File received:', parsed.filename, parsed.fileType)
                  // Update message with file
                  setMessages(prev => 
                    prev.map(m => 
                      m.id === aiMessageId 
                        ? { ...m, files: [...attachedFiles] }
                        : m
                    )
                  )
                  break
                  
                case 'error':
                  accumulatedContent += `\n\n⚠️ Error: ${parsed.error}`
                  setMessages(prev => 
                    prev.map(m => 
                      m.id === aiMessageId 
                        ? { ...m, content: accumulatedContent }
                        : m
                    )
                  )
                  break
                  
                case 'message_start':
                case 'content_start':
                case 'message_delta':
                  // Handle these silently
                  break
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }

      // Finalize the message
      setIsStreaming(false)
      if (accumulatedContent) {
        setMessages(prev => 
          prev.map(m => 
            m.id === aiMessageId 
              ? { ...m, content: accumulatedContent }
              : m
          )
        )
      }
      
      setStreamingContent('')
      
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '⚠️ **Error:** Failed to connect to the API. Please check your connection and try again.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
      setStreamingContent('')
    }
  }, [messages, isLoading])

  return (
    <div className="flex flex-col h-screen bg-chat-bg">
      {/* Top Navigation */}
      <nav className="flex items-center justify-center px-6 py-3 border-b border-chat-border/30 bg-chat-sidebar">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-teal to-emerald-500 flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <h1 className="text-lg font-semibold text-gray-100">Lead Analysis</h1>
        </div>
      </nav>

      {/* Side by Side Layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left: Data Tables (3/5 = 60%) */}
        <div className="w-3/5 border-r border-chat-border/30 overflow-hidden">
          <DataTables />
        </div>
        
        {/* Right: Chat (2/5 = 40%) */}
        <div className="w-2/5 overflow-hidden">
          <ChatArea
            conversation={currentConversation}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            isStreaming={isStreaming}
          />
        </div>
      </main>
    </div>
  )
}
