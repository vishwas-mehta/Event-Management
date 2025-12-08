import React, { useState, useRef, useEffect } from 'react';
import './Chatbot.css';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    suggestions?: string[];
}

interface ConversationState {
    intent?: 'booking' | 'search' | 'cancel' | 'info';
    step?: string;
    eventId?: string;
    eventName?: string;
    ticketTypeId?: string;
    ticketTypeName?: string;
    quantity?: number;
    searchResults?: any[];
}

export const Chatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: 'Hello! I\'m your event assistant. I can help you book tickets, search for events, and answer questions. What would you like to do?',
            timestamp: new Date(),
            suggestions: ['Show me upcoming events', 'I want to book tickets', 'How do I cancel a booking?'],
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [conversationState, setConversationState] = useState<ConversationState | null>(null);
    const [conversationHistory, setConversationHistory] = useState<{ role: string; message: string }[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const getAuthToken = (): string | null => {
        return localStorage.getItem('token');
    };

    const sendMessage = async (messageText?: string) => {
        const msgToSend = messageText || input;
        if (!msgToSend.trim() || isLoading) return;

        const userMessage: Message = {
            role: 'user',
            content: msgToSend,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        // Update conversation history
        const newHistory = [...conversationHistory, { role: 'user', message: msgToSend }];
        setConversationHistory(newHistory);

        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            // Add auth token if available
            const token = getAuthToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch('/api/chatbot/chat', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    message: msgToSend,
                    conversationHistory: newHistory,
                    conversationState,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to get response');
            }

            const data = await response.json();

            // Update conversation state if provided
            if (data.conversationState) {
                setConversationState(data.conversationState);
            }

            const assistantMessage: Message = {
                role: 'assistant',
                content: data.message,
                timestamp: new Date(),
                suggestions: data.suggestions,
            };

            setMessages((prev) => [...prev, assistantMessage]);

            // Update conversation history with assistant response
            setConversationHistory([...newHistory, { role: 'assistant', message: data.message }]);

        } catch (error) {
            const errorMessage: Message = {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again later.',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        sendMessage(suggestion);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    if (!isOpen) {
        return (
            <button
                className="chatbot-fab"
                onClick={() => setIsOpen(true)}
                aria-label="Open chatbot"
            >
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
            </button>
        );
    }

    return (
        <div className="chatbot-container">
            <div className="chatbot-header">
                <div className="chatbot-header-content">
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    Event Assistant
                </div>
                <button
                    className="chatbot-close"
                    onClick={() => setIsOpen(false)}
                    aria-label="Close chatbot"
                >
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>

            <div className="chatbot-messages">
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`message ${message.role === 'user' ? 'message-user' : 'message-assistant'
                            }`}
                    >
                        <div className="message-content">
                            {message.content}
                        </div>
                        <div className="message-timestamp">{formatTime(message.timestamp)}</div>
                        {message.suggestions && message.suggestions.length > 0 && (
                            <div className="message-suggestions">
                                {message.suggestions.map((suggestion, idx) => (
                                    <button
                                        key={idx}
                                        className="suggestion-btn"
                                        onClick={() => handleSuggestionClick(suggestion)}
                                        disabled={isLoading}
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div className="message message-assistant">
                        <div className="message-content">
                            <svg
                                className="spinner"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <circle cx="12" cy="12" r="10" opacity="0.25" />
                                <path d="M12 2a10 10 0 0 1 10 10" opacity="0.75" />
                            </svg>
                            Thinking...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="chatbot-input-container">
                <input
                    type="text"
                    className="chatbot-input"
                    placeholder="Type your message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading}
                />
                <button
                    className="chatbot-send-btn"
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || isLoading}
                    aria-label="Send message"
                >
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                </button>
            </div>
        </div>
    );
};