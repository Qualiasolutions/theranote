'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Send,
  Loader2,
  Sparkles,
  Copy,
  Check,
  Trash2,
  RotateCcw,
  FileText,
  Target,
  ClipboardList,
  User,
  Bot,
} from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatInterfaceProps {
  context?: {
    currentStudent?: string
    discipline?: string
    recentGoals?: string[]
  }
}

const QUICK_PROMPTS = [
  {
    icon: FileText,
    label: 'Write SOAP Note',
    prompt: 'Help me write a SOAP note for a speech therapy session. The student worked on articulation of /r/ sounds.',
  },
  {
    icon: Target,
    label: 'Suggest Goals',
    prompt: 'Suggest 3 measurable IEP goals for a 4-year-old with expressive language delays.',
  },
  {
    icon: ClipboardList,
    label: 'Session Ideas',
    prompt: 'Give me 5 engaging activity ideas for an OT session focusing on fine motor skills.',
  },
]

export function ChatInterface({ context }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Create placeholder for assistant response
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, assistantMessage])

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          context,
        }),
      })

      if (!response.ok) throw new Error('Failed to get response')

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No reader available')

      const decoder = new TextDecoder()
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        fullContent += chunk

        // Update the assistant message with streamed content
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMessage.id
              ? { ...m, content: fullContent }
              : m
          )
        )
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMessage.id
            ? { ...m, content: 'Sorry, I encountered an error. Please try again.' }
            : m
        )
      )
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const clearChat = () => {
    setMessages([])
  }

  const regenerateLastResponse = () => {
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')
    if (lastUserMessage) {
      // Remove last assistant message
      setMessages(prev => prev.slice(0, -1))
      sendMessage(lastUserMessage.content)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-indigo-50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-violet-100 rounded-lg">
            <Sparkles className="h-4 w-4 text-violet-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">TheraNote AI</h2>
            <p className="text-xs text-gray-500">Your clinical documentation assistant</p>
          </div>
        </div>
        {messages.length > 0 && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={regenerateLastResponse}
              disabled={isLoading || messages.length < 2}
              className="h-7 px-2 text-gray-500 hover:text-gray-700"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="h-7 px-2 text-gray-500 hover:text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="p-3 bg-violet-100 rounded-2xl mb-4">
              <Sparkles className="h-8 w-8 text-violet-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              How can I help you today?
            </h3>
            <p className="text-sm text-gray-500 mb-6 max-w-md">
              I can help you write documentation, suggest goals, plan sessions, and answer clinical questions.
            </p>
            <div className="grid gap-2 w-full max-w-md">
              {QUICK_PROMPTS.map((prompt, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => sendMessage(prompt.prompt)}
                  className="flex items-center gap-3 p-3 text-left rounded-lg border border-gray-200 hover:border-violet-300 hover:bg-violet-50/50 transition-colors group"
                >
                  <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-violet-100 transition-colors">
                    <prompt.icon className="h-4 w-4 text-gray-600 group-hover:text-violet-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    {prompt.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-violet-600" />
                  </div>
                )}
                <div
                  className={cn(
                    'group relative max-w-[80%] rounded-2xl px-4 py-2.5',
                    message.role === 'user'
                      ? 'bg-violet-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  )}
                >
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">
                    {message.content || (
                      <span className="flex items-center gap-2 text-gray-500">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Thinking...
                      </span>
                    )}
                  </div>
                  {message.role === 'assistant' && message.content && (
                    <button
                      onClick={() => copyToClipboard(message.content, message.id)}
                      className="absolute -right-8 top-2 opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-gray-200 transition-all"
                    >
                      {copiedId === message.id ? (
                        <Check className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-gray-400" />
                      )}
                    </button>
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-100 bg-gray-50/50">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about clinical documentation..."
              disabled={isLoading}
              rows={1}
              className={cn(
                'w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 pr-12 text-sm',
                'focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'placeholder:text-gray-400'
              )}
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
          </div>
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="h-12 w-12 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="mt-2 text-xs text-gray-400 text-center">
          AI assists with formatting only. Always verify clinical content with your professional judgment.
        </p>
      </form>
    </div>
  )
}
