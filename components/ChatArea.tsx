'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, FileText, Download, Image as ImageIcon } from 'lucide-react'
import { Conversation, Message, FileAttachment } from '@/types'
import ReactMarkdown from 'react-markdown'

interface ChatAreaProps {
  conversation: Conversation | undefined
  onSendMessage: (content: string) => void
  isLoading?: boolean
  isStreaming?: boolean
}

export default function ChatArea({
  conversation,
  onSendMessage,
  isLoading = false,
  isStreaming = false,
}: ChatAreaProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [conversation?.messages, isLoading])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    onSendMessage(input)
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'
    }
  }

  const suggestedPrompts = [
    "Analyze the guest card leads",
    "Show me market rent comparisons",
    "What's the vacancy analysis?",
    "Portfolio overview"
  ]

  return (
    <main className="flex-1 flex flex-col h-full bg-chat-bg">
      {/* Header */}
      <div className="px-4 py-3 border-b border-chat-border/30 bg-chat-sidebar/50">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-accent-teal" />
          <span className="text-sm font-medium text-gray-300">Chat Assistant</span>
        </div>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {(!conversation || conversation.messages.length === 0) ? (
          <WelcomeScreen 
            onPromptClick={onSendMessage} 
            prompts={suggestedPrompts}
          />
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-6">
            {conversation.messages.map((message, index) => (
              <MessageBubble 
                key={message.id} 
                message={message}
                isLatest={index === conversation.messages.length - 1}
                isStreaming={isStreaming && index === conversation.messages.length - 1 && message.role === 'assistant'}
              />
            ))}
            {isLoading && !isStreaming && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-chat-border/30">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="relative bg-chat-input rounded-2xl border border-chat-border/50 focus-within:border-accent-teal/50 transition-colors">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your property portfolio..."
              className="w-full bg-transparent text-gray-100 placeholder-gray-500 px-4 py-3 pr-12 resize-none focus:outline-none rounded-2xl max-h-[200px]"
              rows={1}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={`
                absolute right-2 bottom-2 p-2 rounded-lg transition-all duration-200
                ${input.trim() && !isLoading
                  ? 'bg-accent-teal hover:bg-accent-teal-hover text-white' 
                  : 'bg-chat-border/50 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              <Send size={18} />
            </button>
          </div>
          <p className="text-xs text-gray-600 text-center mt-2">
            AI can make mistakes. Verify important financial data.
          </p>
        </form>
      </div>
    </main>
  )
}

function WelcomeScreen({ 
  onPromptClick, 
  prompts 
}: { 
  onPromptClick: (prompt: string) => void
  prompts: string[]
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4">
      <div className="mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-teal via-teal-400 to-emerald-500 flex items-center justify-center mb-4 mx-auto glow-teal">
          <Sparkles size={32} className="text-white" />
        </div>
        <h1 className="text-2xl font-semibold text-center text-gray-100 mb-2">
          Lead Analysis Assistant
        </h1>
        <p className="text-gray-500 text-center max-w-md">
          Ask questions about guest leads, market comparisons, 
          vacancy trends, and portfolio insights.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full">
        {prompts.map((prompt, index) => (
          <button
            key={index}
            onClick={() => onPromptClick(prompt)}
            className="text-left px-4 py-3 rounded-xl border border-chat-border/50 hover:bg-chat-hover hover:border-accent-teal/30 transition-all duration-200 group"
          >
            <span className="text-sm text-gray-300 group-hover:text-gray-100">
              {prompt}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function MessageBubble({ 
  message, 
  isLatest,
  isStreaming = false
}: { 
  message: Message
  isLatest: boolean
  isStreaming?: boolean
}) {
  const isUser = message.role === 'user'

  return (
    <div className={`mb-6 animate-fade-in ${isLatest ? 'message-appear' : ''}`}>
      <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''}`}>
        {/* Avatar */}
        <div className={`
          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
          ${isUser 
            ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
            : 'bg-gradient-to-br from-accent-teal to-emerald-500'
          }
        `}>
          {isUser ? (
            <span className="text-white text-sm font-medium">U</span>
          ) : (
            <Sparkles size={16} className="text-white" />
          )}
        </div>

        {/* Message Content */}
        <div className={`flex-1 ${isUser ? 'text-right' : ''}`}>
          <span className="text-xs text-gray-500 mb-1 block">
            {isUser ? 'You' : 'Assistant'}
            {isStreaming && <span className="ml-2 text-accent-teal">● Streaming...</span>}
          </span>
          <div className={`
            inline-block text-left rounded-2xl px-4 py-3 max-w-full
            ${isUser 
              ? 'bg-blue-600 text-white rounded-tr-sm' 
              : 'bg-chat-input text-gray-200 rounded-tl-sm'
            }
          `}>
            {isUser ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown
                  components={{
                    img: ({ src, alt }) => {
                      // Handle base64 images
                      if (src?.startsWith('data:image')) {
                        return (
                          <div className="my-4 rounded-lg overflow-hidden border border-chat-border/50 bg-[#1a1a1a]">
                            <div className="flex items-center justify-between px-3 py-2 bg-chat-sidebar/50 border-b border-chat-border/30">
                              <span className="text-xs text-gray-400">📊 {alt || 'Generated Chart'}</span>
                              <a
                                href={src}
                                download={`${alt || 'chart'}.png`}
                                className="text-xs text-accent-teal hover:underline"
                              >
                                Download
                              </a>
                            </div>
                            <img
                              src={src}
                              alt={alt || 'Chart'}
                              className="w-full max-h-[600px] object-contain p-2"
                            />
                          </div>
                        )
                      }
                      return <img src={src} alt={alt} className="max-w-full rounded" />
                    },
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-4">
                        <table className="min-w-full text-sm border-collapse">
                          {children}
                        </table>
                      </div>
                    ),
                    thead: ({ children }) => (
                      <thead className="border-b border-chat-border">{children}</thead>
                    ),
                    th: ({ children }) => (
                      <th className="px-3 py-2 text-left text-gray-400 font-medium">{children}</th>
                    ),
                    td: ({ children }) => (
                      <td className="px-3 py-2 text-gray-300">{children}</td>
                    ),
                    tr: ({ children }) => (
                      <tr className="border-b border-chat-border/50">{children}</tr>
                    ),
                    code: ({ className, children, ...props }) => {
                      const isInline = !className
                      return isInline ? (
                        <code className="bg-chat-border/50 px-1.5 py-0.5 rounded text-accent-teal text-sm" {...props}>
                          {children}
                        </code>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      )
                    },
                    pre: ({ children }) => (
                      <pre className="bg-[#1a1a1a] rounded-lg p-4 overflow-x-auto my-3 text-sm">
                        {children}
                      </pre>
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
                {isStreaming && (
                  <span className="inline-block w-2 h-4 bg-accent-teal animate-pulse ml-0.5 align-middle" />
                )}
                
                {/* Render file attachments */}
                {message.files && message.files.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {message.files.map((file, index) => (
                      <FileAttachmentDisplay key={index} file={file} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Component to display file attachments
function FileAttachmentDisplay({ file }: { file: FileAttachment }) {
  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = `data:${file.mimeType};base64,${file.base64}`
    link.download = file.filename
    link.click()
  }

  if (file.type === 'image') {
    return (
      <div className="border border-chat-border/50 rounded-lg overflow-hidden bg-[#1a1a1a]">
        <div className="flex items-center justify-between px-3 py-2 bg-chat-sidebar/50 border-b border-chat-border/30">
          <div className="flex items-center gap-2">
            <ImageIcon size={14} className="text-green-400" />
            <span className="text-xs text-gray-400">{file.filename}</span>
          </div>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white bg-chat-input rounded transition-colors"
          >
            <Download size={12} />
            Download
          </button>
        </div>
        <div className="p-2">
          <img 
            src={`data:${file.mimeType};base64,${file.base64}`}
            alt={file.filename}
            className="max-w-full rounded-lg shadow-lg"
            style={{ maxHeight: '400px' }}
          />
        </div>
      </div>
    )
  }

  if (file.type === 'pdf') {
    return (
      <div className="border border-chat-border/50 rounded-lg overflow-hidden bg-[#1a1a1a]">
        <div className="flex items-center justify-between px-3 py-2 bg-chat-sidebar/50 border-b border-chat-border/30">
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-red-400" />
            <span className="text-xs text-gray-400">{file.filename}</span>
          </div>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white bg-chat-input rounded transition-colors"
          >
            <Download size={12} />
            Download PDF
          </button>
        </div>
        <div className="p-2">
          <iframe
            src={`data:${file.mimeType};base64,${file.base64}`}
            className="w-full rounded-lg"
            style={{ height: '400px' }}
            title={file.filename}
          />
        </div>
      </div>
    )
  }

  if (file.type === 'docx') {
    return (
      <div className="border border-chat-border/50 rounded-lg overflow-hidden bg-[#1a1a1a]">
        <div className="flex items-center justify-between px-4 py-3 bg-chat-sidebar/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <FileText size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-200">{file.filename}</p>
              <p className="text-xs text-gray-500">Word Document</p>
            </div>
          </div>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
          >
            <Download size={14} />
            Download
          </button>
        </div>
      </div>
    )
  }

  return null
}

function TypingIndicator() {
  return (
    <div className="mb-6 animate-fade-in">
      <div className="flex gap-4">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-accent-teal to-emerald-500 flex items-center justify-center">
          <Sparkles size={16} className="text-white" />
        </div>
        <div>
          <span className="text-xs text-gray-500 mb-1 block">Assistant</span>
          <div className="inline-block bg-chat-input rounded-2xl rounded-tl-sm px-4 py-3">
            <div className="flex gap-1.5">
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

