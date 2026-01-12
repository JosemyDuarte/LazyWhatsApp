import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { chatMessagesStore } from '@/store';
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
}

export const ChatSidebar: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [orchestrator, setOrchestrator] = useState<AIOrchestrator | null>(null);
    const [indexing, setIndexing] = useState(false);

    const chatMessages = useStore(chatMessagesStore);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, indexing]);

    useEffect(() => {
        const initOrchestrator = async () => {
            if (chatMessages && chatMessages.length > 0) {
                const adapter = new OllamaAdapter(config.ai.ollama.baseUrl, config.ai.ollama.model);
                const orch = new AIOrchestrator(adapter);
                setOrchestrator(orch);
                setIndexing(true);
                try {
                    await orch.indexChat(chatMessages);
                } catch (err) {
                    console.error('Indexing failed', err);
                } finally {
                    setIndexing(false);
                }
            }
        };
        initOrchestrator();
    }, [chatMessages]);

    const handleAsk = async (question: string) => {
        if (!orchestrator) return;
        const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: question };
        setMessages(prev => [...prev, userMsg]);

        try {
            const { answer } = await orchestrator.answerQuestion(question);
            const html = await marked.parse(answer);
            const aiMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: answer, html };
            setMessages(prev => [...prev, aiMsg]);
        } catch (err) {
            setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: 'Error generating answer.' }]);
        }
    };

    return (
        <div className="flex flex-col h-full bg-card border border-card-border rounded-lg overflow-hidden animate-fade-in shadow-xl">
            <div className="p-5 border-b border-card-border shrink-0">
                <div className="flex items-center gap-4">
                    <span className="text-[1.25rem] bg-primary/10 p-2 rounded-lg leading-none">🤖</span>
                    <div>
                        <h3 className="text-xl font-black bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent">Chat Assistant</h3>
                        <p className="text-[0.65rem] font-bold text-text-muted tracking-widest uppercase mt-0.5">{indexing ? 'Indexing Data...' : 'RAG POWERED INSIGHTS'}</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col scroll-smooth [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
                <div className="flex flex-col gap-4 min-h-min">
                    {messages.length === 0 && !indexing && (
                        <div className="text-left opacity-70 text-[0.9rem] leading-relaxed pb-4 text-text-muted">
                            <p>I've analyzed the chat history. Ask me anything about sentiments, key topics, or contributor patterns.</p>
                        </div>
                    )}
                    {messages.map(msg => (
                        <div key={msg.id} className={`max-w-[90%] ${msg.role === 'user' ? 'self-end' : 'self-start'}`}>
                            <div className={`p-4 rounded-2xl text-[0.9rem] leading-relaxed relative ${msg.role === 'assistant'
                                ? 'bg-white/[0.03] border border-white/[0.05] rounded-bl-none text-text'
                                : 'bg-primary text-white rounded-br-none shadow-[0_4px_12px_rgba(59,130,246,0.2)]'
                                }`}>
                                {msg.html ? <div className="prose prose-invert prose-sm max-w-none text-left" dangerouslySetInnerHTML={{ __html: msg.html }} /> : msg.content}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <div className="p-5 border-t border-card-border bg-bg/50 shrink-0">
                {messages.length === 0 && !indexing && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        <button className="bg-white/5 border border-white/10 text-white px-3 py-1.5 rounded-full text-[0.75rem] cursor-pointer transition-all hover:bg-white/10 hover:border-white/20 whitespace-nowrap" onClick={() => handleAsk("Who are the most influential speakers?")}>Influential speakers?</button>
                        <button className="bg-white/5 border border-white/10 text-white px-3 py-1.5 rounded-full text-[0.75rem] cursor-pointer transition-all hover:bg-white/10 hover:border-white/20 whitespace-nowrap" onClick={() => handleAsk("Summarize key topics")}>Summarize topics</button>
                    </div>
                )}
                <ChatInput onAsk={handleAsk} disabled={indexing || !orchestrator} />
                <p className="text-[0.65rem] text-text-muted text-center mt-3 opacity-40">AI can make mistakes. Verify important info.</p>
            </div>
        </div>
    );
};
