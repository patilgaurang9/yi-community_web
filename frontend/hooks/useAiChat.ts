"use client"

import { useState, useCallback } from "react"
import type { ChatMessage, ChatResponse } from "@/types/chat"

export function useAiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content: text.trim(),
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMessage])
      setInput("")
      setIsLoading(true)

      try {
        // Check for mock mode
        const useMock = process.env.NEXT_PUBLIC_USE_MOCK_AI === "true"

        let response: ChatResponse

        if (useMock) {
          // Mock mode - return fake data after 1 second
          await new Promise((resolve) => setTimeout(resolve, 1000))

          // Generate mock response based on query
          const query = text.toLowerCase()
          if (query.includes("member") || query.includes("person") || query.includes("who")) {
            response = {
              answer: "Here are some members that match your query:",
              category: "members",
              data: [
                {
                  id: "1",
                  full_name: "John Doe",
                  job_title: "Software Engineer",
                  company: "Tech Corp",
                  match_reason: "Matches your search criteria",
                },
                {
                  id: "2",
                  full_name: "Jane Smith",
                  job_title: "Product Manager",
                  company: "Startup Inc",
                  match_reason: "Relevant to your query",
                },
              ],
            }
          } else if (query.includes("event") || query.includes("meeting") || query.includes("mumbai")) {
            response = {
              answer: "Here are some events that match your query:",
              category: "events",
              data: [
                {
                  id: "1",
                  title: "Networking Event in Mumbai",
                  start_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                  location_name: "Mumbai, India",
                  category: "Networking",
                },
                {
                  id: "2",
                  title: "Workshop: Building Startups",
                  start_time: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                  location_name: "Online",
                  category: "Workshop",
                },
              ],
            }
          } else {
            response = {
              answer: "I can help you find members, events, or offers. Try asking about events in Mumbai, or members in a specific industry.",
              category: "general",
            }
          }
        } else {
          // Real mode - POST to Python backend
          const apiUrl = process.env.NEXT_PUBLIC_AI_API_URL || "/api/ai/chat"

          const res = await fetch(apiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ query: text.trim() }),
          })

          if (!res.ok) {
            throw new Error(`API error: ${res.statusText}`)
          }

          response = await res.json()
        }

        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: response.answer,
          category: response.category || "general",
          data: response.data,
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, assistantMessage])
      } catch (error) {
        console.error("Chat error:", error)
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again later.",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading]
  )

  return {
    messages,
    input,
    setInput,
    isLoading,
    sendMessage,
  }
}
