"use client"

import { useEffect, useRef } from "react"
import { Sparkles, Send, Loader2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useAiChat } from "@/hooks/useAiChat"
import { ChatCards } from "@/components/chat/chat-cards"
import type { ChatMessage } from "@/types/chat"

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user"

  return (
    <div
      className={`flex w-full ${
        isUser ? "justify-end" : "justify-start"
      } mb-4`}
    >
      <div
        className={`max-w-[80%] rounded-lg px-4 py-3 ${
          isUser
            ? "bg-[#FF9933] text-white"
            : "bg-zinc-900 border border-zinc-800 text-white"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        {message.data && message.category && (
          <ChatCards data={message.data} category={message.category} />
        )}
      </div>
    </div>
  )
}

function ThinkingIndicator() {
  return (
    <div className="flex justify-start mb-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
          <span className="text-sm text-zinc-400">Thinking...</span>
        </div>
      </div>
    </div>
  )
}

export default function UpdatesPage() {
  const { messages, input, setInput, isLoading, sendMessage } = useAiChat()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      sendMessage(input)
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-180px)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800 flex-shrink-0">
        <Sparkles className="h-6 w-6 text-[#FF9933]" />
        <h1 className="text-2xl font-bold text-white">Yi Assistant</h1>
      </div>

      {/* Scrollable Chat Area */}
      <div className="flex-1 overflow-y-auto pr-2 mb-4 custom-scrollbar min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Sparkles className="h-12 w-12 text-zinc-600 mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              Welcome to Yi Assistant
            </h2>
            <p className="text-zinc-400 max-w-md">
              Ask me anything about members, events, or offers. Try asking:
              "Find events in Mumbai" or "Who works in technology?"
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((message) => (
              <ChatBubble key={message.id} message={message} />
            ))}
            {isLoading && <ThinkingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Sticky Input Area */}
      <form onSubmit={handleSubmit} className="sticky bottom-0 bg-background pt-4 border-t border-zinc-800">
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              // Auto-resize textarea
              e.target.style.height = "auto"
              e.target.style.height = `${e.target.scrollHeight}px`
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about members, events, or offers..."
            className="min-h-[60px] max-h-[200px] resize-none"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="h-[60px] w-[60px] p-0 bg-[#FF9933] hover:bg-[#FF9933]/90 text-white flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
