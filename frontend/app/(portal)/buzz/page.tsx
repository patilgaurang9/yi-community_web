'use client'

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Sparkles } from "lucide-react"
import { ChatCards } from "@/components/buzz/ChatCards"
import type { Message } from "@/types/buzz"

export default function BuzzPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Log API URL on mount for debugging
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_AI_API_URL || "http://127.0.0.1:5000"
    console.log("🔵 API URL configured:", apiUrl)
    console.log("🔵 Environment variable:", process.env.NEXT_PUBLIC_AI_API_URL || "NOT SET (using default)")
  }, [])

  // Auto-scroll to bottom when new messages arrive or loading state changes
  useEffect(() => {
    // Small delay to ensure DOM updates (including ChatCards) are complete
    const timer = setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
    return () => clearTimeout(timer)
  }, [messages, isLoading])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [input])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Use 127.0.0.1 instead of localhost to avoid DNS resolution issues
      const apiUrl = process.env.NEXT_PUBLIC_AI_API_URL || "http://127.0.0.1:5000"
      const requestUrl = `${apiUrl}/api/chat`
      
      console.log("🔵 Sending request to:", requestUrl)
      console.log("🔵 Payload:", { query: userMessage.content })
      
      const response = await fetch(requestUrl, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: userMessage.content,
        }),
      })

      console.log("🟢 Response status:", response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ HTTP error response:", errorText)
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log("✅ Response data:", data)

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.answer || "I'm here to help!",
        category: data.category || "general",
        data: data.data || [],
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("❌ Error sending message:", error)
      const errorDetails = error instanceof Error ? error.message : String(error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Sorry, I'm having trouble connecting to the server. Error: ${errorDetails}. Please make sure the backend is running on port 5000.`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] max-w-3xl mx-auto">
      {/* Header - Sticky Top */}
      <div className="flex-shrink-0 pb-6 border-b border-zinc-800 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#FF9933]/10 rounded-lg">
            <Sparkles className="h-6 w-6 text-[#FF9933]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Yi Assistant</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Ask me anything about members, events, or the community
            </p>
          </div>
        </div>
      </div>

      {/* Chat Area - Scrollable */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Start a conversation by typing a message below
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] ${
                  message.role === "user"
                    ? "bg-[#FF9933] text-white rounded-lg rounded-tr-none"
                    : "bg-zinc-900 border border-zinc-800 text-foreground rounded-lg rounded-tl-none"
                } p-4`}
              >
                <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                {message.data && message.data.length > 0 && message.category && message.category !== "general" && (
                  <div className="mt-4">
                    <ChatCards data={message.data} category={message.category} />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-zinc-900 border border-zinc-800 text-foreground rounded-lg rounded-tl-none p-4">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="text-sm text-zinc-400">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area - Sticky Bottom */}
      <div className="flex-shrink-0 flex gap-3">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about members, events, or anything..."
          className="min-h-[60px] max-h-[200px] resize-none bg-zinc-900 border-zinc-800 text-foreground focus-visible:ring-[#FF9933]"
          disabled={isLoading}
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="bg-[#FF9933] hover:bg-[#FF9933]/90 text-white h-[60px] px-6"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
