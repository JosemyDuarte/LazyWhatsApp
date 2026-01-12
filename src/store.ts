import { atom } from 'nanostores';
import type { ChatMessage, InsightReport } from './types/chat';

export const chatMessagesStore = atom<ChatMessage[]>([]);
export const insightsStore = atom<InsightReport | null>(null);
export const isAnalyzingStore = atom<boolean>(false);
