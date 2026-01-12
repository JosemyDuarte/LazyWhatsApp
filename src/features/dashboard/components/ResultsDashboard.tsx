import React from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

interface Stats {
    totalMessages: number;
    uniqueSenders: number;
    topSpeakers: { name: string; count: number }[];
    firstMessageDate: string;
    lastMessageDate: string;
}

interface Engagement {
    averageResponseTime: number;
    topRepliedTo: { name: string; count: number }[];
}

interface Props {
    insights: {
        stats: Stats;
        engagement: Engagement;
        metrics?: any; // We'll keep it as any or import ChatMetrics if possible
    };
}

const cardClass = "p-6 rounded-lg bg-card border border-card-border shadow-[0_4px_24px_rgba(0,0,0,0.2)] transition-all duration-200 ease-bounce hover:-translate-y-1 hover:border-primary/30 backdrop-blur-md";
const labelClass = "block text-[0.75rem] font-bold uppercase tracking-[0.15em] text-text-muted";
const textGradientClass = "bg-gradient-to-br from-white to-indigo-300 bg-clip-text text-transparent";

export const ResultsDashboard: React.FC<Props> = ({ insights }) => {
    const { stats, engagement, metrics } = insights;

    const renderActivityGraph = (timeline: Record<string, number>) => {
        if (!timeline || Object.keys(timeline).length === 0) return null;

        const dataPoints = Object.entries(timeline)
            .map(([date, count]) => ({
                dateStr: date,
                date: new Date(date),
                count
            }))
            .sort((a, b) => a.date.getTime() - b.date.getTime());

        if (dataPoints.length === 0) return null;

        const formatDate = (dateStr: string) => {
            const d = new Date(dateStr);
            return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        };

        return (
            <div className={`${cardClass} animate-fade-in`}>
                <div className="mb-4">
                    <span className={`${labelClass} ${textGradientClass}`}>Activity Graph</span>
                </div>
                <div className="w-full h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={dataPoints}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.6} />
                                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" vertical={false} />
                            <XAxis
                                dataKey="dateStr"
                                tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                stroke="var(--color-text-muted)"
                                fontSize={12}
                                minTickGap={30}
                            />
                            <YAxis
                                stroke="var(--color-text-muted)"
                                fontSize={12}
                                width={40}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(20, 20, 30, 0.9)',
                                    border: '1px solid var(--color-primary)',
                                    borderRadius: '8px',
                                    color: '#fff'
                                }}
                                itemStyle={{ color: '#fff' }}
                                labelStyle={{ color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}
                                labelFormatter={formatDate}
                            />
                            <Area
                                type="monotone"
                                dataKey="count"
                                stroke="var(--color-primary)"
                                fill="url(#colorCount)"
                                strokeWidth={2}
                                animationDuration={1500}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
    };

    const renderMetricGrid = (title: string, data: Record<string, any>, unit: string = '') => {
        if (!data || Object.keys(data).length === 0) return null;

        const entries = Object.entries(data)
            .sort(([, a], [, b]) => {
                const valA = typeof a === 'object' ? a.characters : a;
                const valB = typeof b === 'object' ? b.characters : b;
                return valB - valA;
            })
            .slice(0, 5);

        return (
            <div className={`${cardClass} animate-fade-in`}>
                <div className="mb-4">
                    <span className={`${labelClass} ${textGradientClass}`}>{title}</span>
                </div>
                <div className="flex flex-col gap-3">
                    {entries.map(([name, value]) => (
                        <div key={name} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                            <span className="text-[0.85rem] text-text-muted">{name}</span>
                            <span className="font-bold text-white text-[0.9rem]">
                                {typeof value === 'object'
                                    ? `${value.characters}ch / ${value.words}w`
                                    : value.toLocaleString()} {unit}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderEmojiStats = (reactionEmojis: any[], messageEmojis: any) => {
        let emojis = reactionEmojis;
        let title = "Top Reaction Emojis";

        if (!emojis || emojis.length === 0) {
            if (messageEmojis && Object.keys(messageEmojis).length > 0) {
                const aggregated = Object.values(messageEmojis).flat() as { emoji: string; count: number }[];
                const counts: Record<string, number> = {};
                aggregated.forEach(e => { counts[e.emoji] = (counts[e.emoji] || 0) + e.count; });
                emojis = Object.entries(counts)
                    .map(([emoji, count]) => ({ emoji, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5);
                title = "Top Emojis (Messages)";
            }
        }

        if (!emojis || emojis.length === 0) return null;

        return (
            <div className={`${cardClass} animate-fade-in`}>
                <div className="mb-4">
                    <span className={`${labelClass} ${textGradientClass}`}>{title}</span>
                </div>
                <div className="flex justify-center gap-6 flex-wrap py-4">
                    {emojis.map((e, i) => (
                        <div key={i} className="flex flex-col items-center gap-1 transition-transform hover:scale-110" title={`${e.count} uses`}>
                            <span className="text-[2.5rem] filter drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]">{e.emoji}</span>
                            <span className="text-[0.9rem] font-bold text-primary">{e.count}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderTopList = (items: { name: string; count: number }[], title: string, unit: string) => {
        const maxCount = items.length > 0 ? items[0].count : 1;
        return (
            <div className={`${cardClass} animate-fade-in`}>
                <div className="mb-4">
                    <span className={`${labelClass} ${textGradientClass}`}>{title}</span>
                </div>
                <div className="flex flex-col gap-5 mt-6">
                    {items.map((item, i) => (
                        <div key={item.name} className="flex flex-col gap-2">
                            <div className="flex justify-between items-center gap-4">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <span className={`font-mono text-[0.8rem] font-extrabold ${i === 0 ? 'text-primary' : 'text-text-muted opacity-40'}`}>#{i + 1}</span>
                                    <span className={`font-semibold text-[0.95rem] truncate ${i === 0 ? 'text-primary text-[1.05rem]' : 'text-white'}`}>{item.name}</span>
                                </div>
                                <span className="text-[0.9rem] text-text-muted shrink-0 flex items-center gap-1">
                                    <strong className={`${textGradientClass} font-bold`}>{item.count.toLocaleString()}</strong>
                                    <small className="text-[0.75rem] opacity-50">{unit}</small>
                                </span>
                            </div>
                            <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-1000 ease-bounce"
                                    style={{
                                        width: `${(item.count / maxCount) * 100}%`,
                                        background: i === 0
                                            ? 'linear-gradient(90deg, var(--color-primary), var(--color-accent))'
                                            : 'rgba(255, 255, 255, 0.1)'
                                    }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="grid gap-8 w-full">
            {metrics && (
                <div className="flex items-center gap-5 mt-4 mb-2 animate-fade-in">
                    <span className="text-[1.8rem] filter drop-shadow-[0_0_8px_rgba(99,102,241,0.3)]">📊</span>
                    <div>
                        <h3 className={`text-xl font-black ${textGradientClass}`}>Programmatic Insights</h3>
                        <p className="text-[0.9rem] text-text-muted mt-1">Deterministic metrics calculated without LLM</p>
                    </div>
                </div>
            )}

            {/* 1. Core Summary Row (Lifespan + Big Stats) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <div className={`${cardClass} md:col-span-2 flex flex-col justify-center py-5 px-6 animate-fade-in`}>
                    <span className={`${labelClass} ${textGradientClass} mb-4`}>Chat Lifespan</span>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-8">
                        <div className="flex flex-col min-w-0">
                            <span className="text-[0.6rem] text-text-muted uppercase tracking-wider font-bold mb-1">Started</span>
                            <span className="font-bold text-[1.1rem] text-white whitespace-nowrap">{stats.firstMessageDate}</span>
                        </div>
                        <div className="hidden sm:block opacity-20 text-xl font-light shrink-0">→</div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[0.6rem] text-text-muted uppercase tracking-wider font-bold mb-1">Ended</span>
                            <span className="font-bold text-[1.1rem] text-white whitespace-nowrap">{stats.lastMessageDate}</span>
                        </div>
                    </div>
                </div>

                <div className={`${cardClass} text-center py-6 px-4 animate-fade-in`}>
                    <span className={`${labelClass} ${textGradientClass} mb-1`}>Messages</span>
                    <div className={`text-3xl font-black ${textGradientClass}`}>{stats.totalMessages.toLocaleString()}</div>
                </div>

                <div className={`${cardClass} text-center py-6 px-4 animate-fade-in`}>
                    <span className={`${labelClass} ${textGradientClass} mb-1`}>Senders</span>
                    <div className={`text-3xl font-black ${textGradientClass}`}>{stats.uniqueSenders.toLocaleString()}</div>
                </div>
            </div>

            {/* 2. Activity Graph */}
            {metrics?.timing?.timeline && renderActivityGraph(metrics.timing.timeline)}

            {/* 3. Top Lists (Moved below Activity Graph) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderTopList(stats.topSpeakers.slice(0, 5), 'Top 5 Speakers', 'msgs')}
                {renderTopList(engagement.topRepliedTo.slice(0, 5), 'Top 5 Engagement Stars', 'replies')}
            </div>

            {/* 4. Detailed Metrics */}
            {metrics ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {renderMetricGrid('Media Shared', metrics.volume?.mediaCountPerUser, 'files')}
                        {metrics.content?.topDomains && metrics.content.topDomains.length > 0 && (
                            <div className={`${cardClass} animate-fade-in`}>
                                <div className="mb-4">
                                    <span className={`${labelClass} ${textGradientClass}`}>Top 5 Domains Shared</span>
                                </div>
                                <div className="flex flex-col gap-3">
                                    {metrics.content.topDomains.map((d: { domain: string; count: number }, i: number) => (
                                        <div key={d.domain} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                                            <span className="text-[0.85rem] text-text-muted truncate max-w-[70%]">{d.domain}</span>
                                            <span className="font-bold text-white text-[0.9rem]">{d.count.toLocaleString()} links</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {renderMetricGrid('Top Link Sharers', metrics.content?.linkSharingCountPerUser, 'links')}
                        {renderEmojiStats(metrics.content?.topReactionEmojis, metrics.content?.topEmojisPerUser)}
                    </div>
                </>
            ) : (
                <div className={`${cardClass} animate-fade-in py-4 mb-8 border-dashed border-primary`}>
                    <span className={`${labelClass} text-primary`}>⏳ Basic stats only. Deep analysis metrics pending...</span>
                </div>
            )}
        </div>
    );
};
