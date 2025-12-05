'use client'

import { MessageSquarePlus, Building2 } from 'lucide-react'
import { Conversation } from '@/types'

interface SidebarProps {
  conversations: Conversation[]
  activeConversationId: string | null
  onSelectConversation: (id: string) => void
  onNewChat: () => void
  onDeleteConversation: (id: string) => void
  isOpen: boolean
  onToggle: () => void
}

export default function Sidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  isOpen,
  onToggle,
}: SidebarProps) {
  if (!isOpen) return null

  return (
    <aside className="w-64 bg-chat-sidebar flex flex-col h-full border-r border-chat-border/50">
      {/* Header */}
      <div className="p-3 border-b border-chat-border/50">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg border border-chat-border/50 hover:bg-chat-hover transition-all duration-200 group"
        >
          <MessageSquarePlus size={18} className="text-gray-400 group-hover:text-accent-teal transition-colors" />
          <span className="text-sm text-gray-200">New Chat</span>
        </button>
      </div>

      {/* Empty space */}
      <div className="flex-1" />

      {/* Footer */}
      <div className="p-3 border-t border-chat-border/50">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-teal to-teal-400 flex items-center justify-center">
            <Building2 size={16} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-200">Financial Analysis</p>
            <p className="text-xs text-gray-500">Property Portfolio AI</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

