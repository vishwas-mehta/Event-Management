import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Chatbot.css';

interface Action {
    type: 'navigate' | 'link';
    label: string;
    target: string;
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    suggestions?: string[];
    actions?: Action[];
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

// Simple markdown-like text formatter
const formatMessage = (text: string): React.ReactNode[] => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];

    lines.forEach((line, lineIndex) => {
        if (lineIndex > 0) {
            elements.push(<br key={`br-${lineIndex}`} />);
        }

        // Process each line for inline formatting
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        parts.forEach((part, partIndex) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                // Bold text
                elements.push(
                    <strong key={`${lineIndex}-${partIndex}`}>
                        {part.slice(2, -2)}
                    </strong>
                );
            } else {
                elements.push(<span key={`${lineIndex}-${partIndex}`}>{part}</span>);
            }
        });
    });

    return elements;
};

export const Chatbot: React.FC = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: '👋 Hello! I\'m your event assistant.\n\nI can help you:\n• 🎫 Book tickets for events\n• 🔍 Search for upcoming events\n• ❓ Answer your questions\n\nWhat would you like to do?',
            timestamp: new Date(),
            suggestions: ['Show me events', 'Book tickets', 'Help'],
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

    const handleAction = (action: Action) => {
        if (action.type === 'navigate') {
            setIsOpen(false);
            navigate(action.target);
        } else if (action.type === 'link') {
            window.open(action.target, '_blank');
        }
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

        const newHistory = [...conversationHistory, { role: 'user', message: msgToSend }];
        setConversationHistory(newHistory);

        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

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

            if (data.conversationState) {
                setConversationState(data.conversationState);
            } else if (!data.conversationState && conversationState) {
                // Clear state if not in a flow
                setConversationState(null);
            }

            const assistantMessage: Message = {
                role: 'assistant',
                content: data.message,
                timestamp: new Date(),
                suggestions: data.suggestions,
                actions: data.actions,
            };

            setMessages((prev) => [...prev, assistantMessage]);
            setConversationHistory([...newHistory, { role: 'assistant', message: data.message }]);

        } catch (error) {
            const errorMessage: Message = {
                role: 'assistant',
                content: '😔 Sorry, I encountered an error. Please try again.',
                timestamp: new Date(),
                suggestions: ['Try again', 'Help'],
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

    const resetConversation = () => {
        setMessages([
            {
                role: 'assistant',
                content: '👋 Hello! I\'m your event assistant.\n\nI can help you:\n• 🎫 Book tickets for events\n• 🔍 Search for upcoming events\n• ❓ Answer your questions\n\nWhat would you like to do?',
                timestamp: new Date(),
                suggestions: ['Show me events', 'Book tickets', 'Help'],
            },
        ]);
        setConversationState(null);
        setConversationHistory([]);
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
                <div className="chatbot-header-actions">
                    <button
                        type="button"
                        className="chatbot-reset"
                        onClick={resetConversation}
                        aria-label="Reset conversation"
                        title="Start over"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                            <path d="M3 3v5h5" />
                        </svg>
                    </button>
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
            </div>

            <div className="chatbot-messages">
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`message ${message.role === 'user' ? 'message-user' : 'message-assistant'}`}
                    >
                        <div className="message-content">
                            {formatMessage(message.content)}
                        </div>
                        <div className="message-timestamp">{formatTime(message.timestamp)}</div>

                        {/* Action buttons (like "Go to Sign In") */}
                        {message.actions && message.actions.length > 0 && (
                            <div className="message-actions">
                                {message.actions.map((action, idx) => (
                                    <button
                                        key={idx}
                                        className="action-btn"
                                        onClick={() => handleAction(action)}
                                    >
                                        {action.type === 'navigate' && (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M5 12h14M12 5l7 7-7 7" />
                                            </svg>
                                        )}
                                        {action.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Suggestion chips */}
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
                        <div className="message-content typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
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