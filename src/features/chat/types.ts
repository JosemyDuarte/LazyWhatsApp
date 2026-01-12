export interface ChatLine {
    date: string;
    time: string;
    sender: string | null; // null for system/admin messages
    content: string;
}

export interface ChatMessage extends ChatLine {
    id: string;
    timestamp: number; // For sorting and density calculation
    reactions?: string[];
    replyToId?: string; // ID of the message being replied to
}

export interface ParseResult {
    messages: ChatMessage[];
    stats: {
        totalLines: number;
        parsedMessages: number;
        failedLines: number;
    };
}

export type AnalysisStrategy = 'hybrid' | 'multi-pass' | 'truncation';

export interface AnalysisConfiguration {
    strategy: AnalysisStrategy;
    dateRange?: {
        start: number; // UTC timestamp
        end: number;   // UTC timestamp
    };
    chunkSize?: number; // For multi-pass (default: 50)
    recentCount?: number; // For truncation (default: 100)
}

export interface AnalysisChunk {
    index: number;
    messageCount: number;
    startTime: number;
    endTime: number;
    messages: ChatMessage[];
    summary?: string;
}

export interface VolumeStats {
    messageCountPerUser: Record<string, number>;
    averageMessageLengthPerUser: Record<string, { characters: number; words: number }>;
    mediaCountPerUser: Record<string, number>;
    totalMessages: number;
    totalMedia: number;
}

export interface TimingStats {
    activityHeatmap: {
        hour: number[]; // Aggregated counts per hour (0-23)
        day: number[];  // Aggregated counts per day (0-6)
    };
    timeline: Record<string, number>; // YYYY-MM-DD -> count
    conversationStarters: Record<string, number>;
    averageResponseTimePerUser: Record<string, number>; // in seconds
}

export interface ContentStats {
    topEmojisPerUser: Record<string, Array<{ emoji: string; count: number }>>;
    topReactionEmojis: Array<{ emoji: string; count: number }>;
    linkSharingCountPerUser: Record<string, number>;
    vocabularyRichnessPerUser: Record<string, number>; // unique tokens
    topDomains: Array<{ domain: string; count: number }>;
}

export interface NetworkStats {
    replyRatePerUser: Record<string, number>;
    mentionMatrix: Record<string, Record<string, number>>; // sender -> mentioned -> count
}

export interface ChatMetrics {
    volume: VolumeStats;
    timing: TimingStats;
    content: ContentStats;
    network: NetworkStats;
}

export interface InsightReport {
    stats: any; // Legacy stats
    engagement: any;
    peaks: any[];
    strategy: AnalysisStrategy;
    metrics?: ChatMetrics; // New programmatic metrics
    summary?: {
        content: string; // Markdown
        isSynthesized: boolean;
        chunksProcessed?: number;
    };
}
