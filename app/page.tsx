"use client"

import { useState, useEffect, useRef } from "react"
import { RoomEvent, Track } from "livekit-client"
import {
  LiveKitRoom,
  useRoomContext,
  useTracks,
  RoomAudioRenderer,
  useLocalParticipant
} from "@livekit/components-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mic, MicOff, Phone, PhoneOff } from "lucide-react"

interface TranscriptEntry {
  participant: string
  text: string
  timestamp: Date
  isFinal: boolean
}

interface ChatMessage {
  id: string
  participant: string
  text: string
  timestamp: Date
  isFinal: boolean
  isTyping?: boolean
}

function TypingIndicator() {
  return (
    <div className="flex items-center space-x-1 p-2">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
      <span className="text-sm text-gray-500 ml-2">Sunny is typing...</span>
    </div>
  )
}

function VoiceChatRoom() {
  const [token, setToken] = useState<string>("")
  const [isConnected, setIsConnected] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [isAgentTyping, setIsAgentTyping] = useState(false)
  const room = useRoomContext()
  const { localParticipant } = useLocalParticipant()
  const transcriptRef = useRef<HTMLDivElement>(null)

  // Get audio tracks for rendering
  const tracks = useTracks([Track.Source.Microphone], { onlySubscribed: false })

  // Get the current microphone state from the local participant
  const isMicrophoneEnabled = localParticipant?.isMicrophoneEnabled ?? false

  useEffect(() => {
    if (!room) return

    // Register handler for transcription stream
    const handleTranscriptionStream = async (reader: any, participantInfo: any) => {
      try {
        const transcriptionText = await reader.readAll()

        // Check if this is a real-time agent transcription
        const isAgentTranscription = reader.info.attributes['lk.transcribed_track_id']
        const speakerIdentity = participantInfo.identity

        const messageId = `${speakerIdentity}-${Date.now()}-${Math.random()}`
        const message: ChatMessage = {
          id: messageId,
          participant: speakerIdentity.includes('agent') ? 'Agent' : 'You',
          text: transcriptionText,
          timestamp: new Date(),
          isFinal: true, // Transcription stream provides final text
        }

        setChatMessages((prev) => {
          const newMessages = [...prev]
          newMessages.push(message)
          return newMessages.slice(-50) // Keep last 50 messages
        })

        // Handle typing indicator for agent
        if (message.participant === 'Agent') {
          setIsAgentTyping(false)
        }
      } catch (error) {
        console.error('Error handling transcription stream:', error)
      }
    }

    // Handle track events to show typing indicator
    const handleTrackPublished = (track: any, participant: any) => {
      if (participant !== room.localParticipant && track.kind === 'audio') {
        setIsAgentTyping(true)
      }
    }

    const handleTrackUnpublished = (track: any, participant: any) => {
      if (participant !== room.localParticipant && track.kind === 'audio') {
        setIsAgentTyping(false)
      }
    }

    // Register the transcription stream handler (only if not already registered)
    try {
      room.registerTextStreamHandler('lk.transcription', handleTranscriptionStream)
    } catch (error) {
      console.warn('Transcription handler already registered:', error)
    }

    // Handle connection states and track events
    room.on(RoomEvent.Connected, () => setIsConnected(true))
    room.on(RoomEvent.Disconnected, () => setIsConnected(false))
    room.on(RoomEvent.TrackPublished, handleTrackPublished)
    room.on(RoomEvent.TrackUnpublished, handleTrackUnpublished)

    return () => {
      // Unregister the transcription stream handler
      try {
        room.unregisterTextStreamHandler('lk.transcription')
      } catch (error) {
        console.warn('Error unregistering transcription handler:', error)
      }

      room.off(RoomEvent.Connected, () => setIsConnected(true))
      room.off(RoomEvent.Disconnected, () => setIsConnected(false))
      room.off(RoomEvent.TrackPublished, handleTrackPublished)
      room.off(RoomEvent.TrackUnpublished, handleTrackUnpublished)
    }
  }, [room])

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
  }, [chatMessages, isAgentTyping])

  const toggleMute = async () => {
    if (localParticipant) {
      await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)
    }
  }

  const disconnect = () => {
    room?.disconnect()
    setChatMessages([])
    setIsAgentTyping(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Weather Wizard Voice Chat</h1>
          <p className="text-lg text-gray-600">Chat with Sunny, your friendly San Ramon weather expert!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Control Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Voice Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Connection Status:</span>
                <Badge variant={isConnected ? "default" : "secondary"}>
                  {isConnected ? "Connected" : "Disconnected"}
                </Badge>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={toggleMute}
                  variant={!isMicrophoneEnabled ? "destructive" : "default"}
                  disabled={!isConnected}
                  className="flex-1"
                >
                  {!isMicrophoneEnabled ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                  {!isMicrophoneEnabled ? "Unmute" : "Mute"}
                </Button>

                <Button onClick={disconnect} variant="destructive" disabled={!isConnected} className="flex-1">
                  <PhoneOff className="w-4 h-4 mr-2" />
                  End Call
                </Button>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Meet Sunny! 🌞</h3>
                <p className="text-sm text-blue-800">
                  Your friendly neighborhood weather expert from San Ramon, CA. Ask me about the current weather, and
                  I'll give you all the details with local insights!
                </p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">Try asking:</h3>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• "What's the weather like in San Ramon?"</li>
                  <li>• "Should I bring a jacket today?"</li>
                  <li>• "Tell me about the local weather patterns"</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Chat Messages */}
          <Card>
            <CardHeader>
              <CardTitle>Chat with Sunny 🌞</CardTitle>
            </CardHeader>
            <CardContent>
              <div ref={transcriptRef} className="h-96 overflow-y-auto bg-gray-50 rounded-lg p-4 space-y-3">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <p>Start talking to chat with Sunny!</p>
                    <p className="text-sm mt-2">Your voice will appear here as you speak.</p>
                  </div>
                ) : (
                  <>
                    {chatMessages.map((message, index) => (
                      <div key={message.id} className="flex w-full">
                        {message.participant === "Agent" ? (
                          // Agent message (left side)
                          <div className="flex items-start max-w-[80%]">
                            <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                              🌞
                            </div>
                            <div className="bg-blue-100 rounded-lg rounded-tl-none px-4 py-2 shadow-sm">
                              <div className="text-sm font-medium text-blue-800 mb-1">Sunny</div>
                              <p className={`text-sm text-blue-900 ${!message.isFinal ? 'italic opacity-75' : ''}`}>
                                {message.text}
                              </p>
                              <div className="text-xs text-blue-600 mt-1">
                                {message.timestamp.toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        ) : (
                          // User message (right side)
                          <div className="flex items-start max-w-[80%] ml-auto">
                            <div className="bg-gray-100 rounded-lg rounded-tr-none px-4 py-2 shadow-sm mr-3">
                              <div className="text-sm font-medium text-gray-800 mb-1">You</div>
                              <p className={`text-sm text-gray-900 ${!message.isFinal ? 'italic opacity-75' : ''}`}>
                                {message.text}
                              </p>
                              <div className="text-xs text-gray-600 mt-1">
                                {message.timestamp.toLocaleTimeString()}
                              </div>
                            </div>
                            <div className="flex-shrink-0 w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                              👤
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Typing indicator */}
                    {isAgentTyping && (
                      <div className="flex items-start max-w-[80%]">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                          🌞
                        </div>
                        <div className="bg-blue-100 rounded-lg rounded-tl-none px-4 py-2 shadow-sm">
                          <TypingIndicator />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Audio Renderer */}
        <RoomAudioRenderer />
      </div>
    </div>
  )
}

export default function Home() {
  const [token, setToken] = useState<string>("")
  const [roomName] = useState("weather-chat-room")
  const [isJoining, setIsJoining] = useState(false)

  const joinRoom = async () => {
    setIsJoining(true)
    try {
      const response = await fetch("/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          room: roomName,
          username: `user-${Date.now()}`,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get token")
      }

      const data = await response.json()
      setToken(data.token)
    } catch (error) {
      console.error("Error joining room:", error)
      alert("Failed to join room. Please try again.")
    } finally {
      setIsJoining(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Weather Wizard Voice Chat</CardTitle>
            <p className="text-gray-600">Ready to chat with Sunny about the weather?</p>
          </CardHeader>
          <CardContent>
            <Button onClick={joinRoom} disabled={isJoining} className="w-full" size="lg">
              {isJoining ? "Connecting..." : "Start Call"}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={process.env.LIVEKIT_URL}
      connect={true}
      audio={true}
      video={false}
    >
      <VoiceChatRoom />
    </LiveKitRoom>
  )
}
