export interface FileAttachment {
  type: 'image' | 'pdf' | 'docx'
  filename: string
  base64: string
  mimeType: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  files?: FileAttachment[]
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
}


