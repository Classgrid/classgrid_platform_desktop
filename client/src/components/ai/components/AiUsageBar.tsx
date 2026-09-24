import React, { useEffect, useState, useMemo } from 'react';
import { Sparkles, Zap, AlertTriangle } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { getSocket } from '@/lib/socketClient';

export const AiUsageBar = () => {
    const [usageData, setUsageData] = useState({
        type: 'free',
        used: 0,
        limit: 100000,
        remaining: 100000,
        resetDate: null
    });
    const [loading, setLoading] = useState(true);

    const fetchUsage = async () => {
        try {
            const res = await apiClient.get('/api/ai/my-usage');
            if (res.data) {
                setUsageData(res.data);
            }
        } catch (e) {
            console.error("Failed to fetch AI usage:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsage();
    }, []);

    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;

        const handleTokenUpdate = (data) => {
            setUsageData(prev => ({
                ...prev,
                type: data.type || prev.type,
                used: prev.used + (data.used || 0),
                remaining: data.remaining
            }));
        };

        socket.on('ai_token_update', handleTokenUpdate);
        return () => {
            socket.off('ai_token_update', handleTokenUpdate);
        };
    }, []);

    const percentUsed = useMemo(() => {
        if (!usageData.limit) return 0;
        return Math.min(100, Math.max(0, (usageData.used / usageData.limit) * 100));
    }, [usageData]);

    const barColor = useMemo(() => {
        if (percentUsed < 70) return 'bg-emerald-500';
        if (percentUsed < 90) return 'bg-amber-500';
        return 'bg-rose-500';
    }, [percentUsed]);

    if (loading) return null;

    return (
        <div className="w-full flex flex-col gap-1.5 px-4 py-2 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
            <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-medium">
                    {usageData.type === 'pro' ? (
                        <><Zap size={14} className="text-amber-500" /> Org Pro Pool</>
                    ) : (
                        <><Sparkles size={14} className="text-indigo-500" /> Free Weekly Limits</>
                    )}
                </div>
                <div className="text-gray-500 dark:text-gray-500 font-medium flex items-center gap-1">
                    {percentUsed >= 95 && <AlertTriangle size={12} className="text-rose-500" />}
                    {usageData.remaining.toLocaleString()} tokens left
                </div>
            </div>
            <div className="w-full h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div 
                    className={`h-full transition-all duration-500 ease-out rounded-full ${barColor}`} 
                    style={{ width: `${percentUsed}%` }}
                />
            </div>
        </div>
    );
};
