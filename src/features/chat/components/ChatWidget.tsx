import React, { useState, useEffect, useRef } from 'react';
import { ChatInput } from './ChatInput';
import { AIOrchestrator } from '@core/ai/orchestrator';
import { OllamaAdapter } from '@core/ai/providers/ollama';
import { config } from '@/config';
import { marked } from 'marked';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    html?: string;
    citations?: any[];
    isLoading?: boolean;
}

export const ChatWidget: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [orchestrator, setOrchestrator] = useState<AIOrchestrator | null>(null);
    const [showChat, setShowChat] = useState(false);
    const [indexing, setIndexing] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, indexing]);

    // Listen for data
    useEffect(() => {
        const handleDataReady = async (event: CustomEvent) => {
            const { messages: chatMessages } = event.detail;
            if (chatMessages && chatMessages.length > 0) {
                // Initialize Orchestrator
                const adapter = new OllamaAdapter(config.ai.ollama.baseUrl, config.ai.ollama.model);
                const orch = new AIOrchestrator(adapter);
                setOrchestrator(orch);

                setIndexing(true);
                setShowChat(true);
                try {
                    await orch.indexChat(chatMessages);
                    console.log('Chat indexed successfully');
                } catch (err) {
                    console.error('Indexing failed', err);
                } finally {
                    setIndexing(false);
                }
            }
        };

        window.addEventListener('chat-data-ready' as any, handleDataReady as any);
        return () => {
            window.removeEventListener('chat-data-ready' as any, handleDataReady as any);
        };
    }, []);

    const handleAsk = async (question: string) => {
        if (!orchestrator) return;

        // Add user message
        const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: question };

        // Add temporary loading message
        const loadingMsgId = crypto.randomUUID();
        const loadingMsg: Message = {
            id: loadingMsgId,
            role: 'assistant',
            content: '...',
            isLoading: true
        };

        setMessages((prev: Message[]) => [...prev, userMsg, loadingMsg]);

        try {
            const { answer, citations } = await orchestrator.answerQuestion(question);
            const html = await marked.parse(answer);

            const aiMsg: Message = {
                id: loadingMsgId, // Reuse ID to replace
                role: 'assistant',
                content: answer,
                html,
                citations
            };

            // Replace loading message with actual response
            setMessages((prev: Message[]) => prev.map(m => m.id === loadingMsgId ? aiMsg : m));
        } catch (err) {
            console.error(err);
            const errorMsg: Message = {
                id: loadingMsgId,
                role: 'assistant',
                content: 'Error generating answer.'
            };
            setMessages((prev: Message[]) => prev.map(m => m.id === loadingMsgId ? errorMsg : m));
        }
    };

    return (
        <>
            {/* Floating Action Button */}
            {!showChat && (
                <button
                    onClick={() => setShowChat(true)}
                    className={`fixed bottom-6 right-6 p-4 bg-primary text-white rounded-full shadow-lg transition-all duration-300 z-[2000] group flex items-center gap-2 shadow-[0_8px_24px_-6px_var(--color-primary)] hover:bg-primary-hover hover:-translate-y-1 hover:scale-105 ${indexing ? 'animate-pulse' : ''}`}
                    aria-label="Open Chat"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    {indexing && <span className="text-sm font-bold pr-1">Indexing...</span>}
                </button>
            )}

            {/* Chat Window */}
            <div className={`fixed bottom-6 right-6 w-[450px] h-[650px] max-w-[calc(100vw-3rem)] max-h-[calc(100vh-6rem)] bg-card border border-card-border shadow-2xl rounded-2xl flex flex-col z-[2000] overflow-hidden transition-all duration-300 origin-bottom-right ${showChat ? 'scale-100 opacity-100' : 'scale-90 opacity-0 pointer-events-none'}`}>

                {/* Header */}
                <div className="p-5 border-b border-card-border shrink-0 bg-white/[0.02]">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="bg-primary/10 p-2 rounded-lg leading-none">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-black bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent">Chat Assistant</h3>
                                <p className="text-[0.65rem] font-bold text-text-muted tracking-widest uppercase mt-0.5">{indexing ? 'Indexing history...' : 'Ask about your conversation'}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowChat(false)}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors text-text-muted hover:text-text"
                            aria-label="Close Chat"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col scroll-smooth [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
                    {messages.length === 0 && !indexing && !orchestrator && (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-70">
                            <h4 className="font-bold text-lg text-text mb-2 tracking-tight">Waiting for data...</h4>
                            <p className="text-sm text-text-muted">Upload a chat to start asking questions.</p>
                        </div>
                    )}

                    {messages.length === 0 && !indexing && orchestrator && (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-white/[0.01] rounded-xl border border-white/[0.03]">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                </svg>
                            </div>
                            <h4 className="font-black text-xl text-text mb-2 tracking-tight">Ready to help!</h4>
                            <p className="text-[0.95rem] text-text-muted max-w-[240px] leading-relaxed">Ask me anything about this chat export.</p>
                            <div className="mt-8 space-y-3 w-full max-w-xs">
                                <button onClick={() => handleAsk("What is the main topic?")} className="w-full text-xs p-3 bg-white/[0.03] border border-white/[0.05] rounded-xl hover:border-primary/40 hover:bg-white/[0.06] transition-all text-left font-medium text-text group flex justify-between items-center">
                                    <span>"What is the main topic?"</span>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" className="opacity-0 group-hover:opacity-100 transition-opacity"><path d="m9 18 6-6-6-6" /></svg>
                                </button>
                                <button onClick={() => handleAsk("Summarize the key decisions")} className="w-full text-xs p-3 bg-white/[0.03] border border-white/[0.05] rounded-xl hover:border-primary/40 hover:bg-white/[0.06] transition-all text-left font-medium text-text group flex justify-between items-center">
                                    <span>"Summarize key decisions"</span>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" className="opacity-0 group-hover:opacity-100 transition-opacity"><path d="m9 18 6-6-6-6" /></svg>
                                </button>
                            </div>
                        </div>
                    )}

                    {messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                            <div className={`max-w-[85%] rounded-2xl p-4 text-[0.9rem] leading-relaxed relative ${msg.role === 'user'
                                ? 'bg-primary text-white rounded-br-none shadow-[0_4px_12px_rgba(59,130,246,0.2)]'
                                : 'bg-white/[0.03] border border-white/[0.05] rounded-bl-none text-text'
                                }`}>
                                {msg.isLoading ? (
                                    <div className="flex gap-1.5 items-center py-2 px-1">
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                    </div>
                                ) : (
                                    <>
                                        {msg.html ? (
                                            <div className="prose prose-invert prose-sm max-w-none text-left" dangerouslySetInnerHTML={{ __html: msg.html }} />
                                        ) : (
                                            msg.content
                                        )}
                                        {msg.citations && msg.citations.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-white/[0.05] text-[0.7rem]">
                                                <p className="font-bold mb-3 text-text-muted flex items-center gap-2 tracking-widest uppercase">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                                                    Sources
                                                </p>
                                                <ul className="space-y-2">
                                                    {msg.citations.map((c, i) => (
                                                        <li key={i} className="bg-white/5 rounded-lg p-2.5 flex flex-col gap-1 border border-white/[0.02]">
                                                            <div className="flex justify-between items-center">
                                                                <span className="font-bold text-text">{c.sender}</span>
                                                                <span className="font-mono text-[10px] opacity-40">{new Date(c.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })} {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                    {indexing && messages.length > 0 && (
                        <div className="flex justify-center py-4">
                            <div className="text-[0.65rem] font-bold text-text-muted flex items-center gap-3 tracking-widest uppercase bg-white/5 py-2 px-4 rounded-full border border-white/[0.05]">
                                <div className="flex gap-1">
                                    <div className="w-1 h-1 bg-primary rounded-full animate-pulse"></div>
                                    <div className="w-1 h-1 bg-primary rounded-full animate-pulse [animation-delay:0.2s]"></div>
                                    <div className="w-1 h-1 bg-primary rounded-full animate-pulse [animation-delay:0.4s]"></div>
                                </div>
                                Indexing Data
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-5 border-t border-card-border bg-bg/50 shrink-0">
                    <ChatInput onAsk={handleAsk} disabled={indexing || !orchestrator} />
                    <p className="text-[0.65rem] text-text-muted text-center mt-3 opacity-40">AI can make mistakes. Verify important info.</p>
                </div>
            </div>
        </>
    );
};
