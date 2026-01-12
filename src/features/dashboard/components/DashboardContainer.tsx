import { useStore } from '@nanostores/react';
import { insightsStore } from '@/store';
import { ResultsDashboard } from './ResultsDashboard';
import type { InsightReport } from '@features/chat/types';

export const DashboardContainer: React.FC = () => {
    const insights = useStore(insightsStore);

    if (!insights) return null;

    return <ResultsDashboard insights={insights} />;
};
