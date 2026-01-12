import React, { useState } from 'react';

interface ChatInputProps {
    onAsk: (question: string) => Promise<void>;
    disabled: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onAsk, disabled }) => {
    const [question, setQuestion] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!question.trim() || disabled || loading) return;

        setLoading(true);
        setQuestion('');
        try {
            await onAsk(question);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full">
            <div className="relative flex items-center bg-white/5 border border-white/10 rounded-[14px] transition-all duration-200 pr-2 focus-within:bg-white/10 focus-within:border-primary focus-within:shadow-[0_0_0_4px_rgba(99,102,241,0.1)]">
                <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask a question..."
                    disabled={disabled || loading}
                    className="flex-1 bg-transparent border-none text-white px-4 py-3 text-[0.95rem] outline-none font-sans placeholder:text-white/30"
                />
                <button
                    type="submit"
                    disabled={disabled || loading || !question.trim()}
                    className="bg-primary text-white w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200 ease-bounce shrink-0 hover:enabled:scale-105 hover:enabled:bg-accent active:enabled:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Send"
                >
                    {loading ? (
                        <div className="w-[18px] h-[18px] border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    )}
                </button>
            </div>
        </form>
    );
};
