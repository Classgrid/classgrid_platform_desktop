import React, { useEffect, useState, useMemo } from 'react';
import { Sparkles, Zap, AlertTriangle } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { getSocket } from '@/lib/socketClient';

export const AiUsageBar = () => {
    const [usageData, setUsageData] = useState<any>({
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

        const handleTokenUpdate = (data: any) => {
            setUsageData((prev: any) => {
                if (data.type === 'pro' && prev.type === 'pro') {
                    return {
                        ...prev,
                        used: prev.used + (data.used || 0),
                        remaining: data.remaining
                    };
                } else if (data.type === 'free') {
                    if (prev.type === 'pro' && prev.freeData) {
                        return {
                            ...prev,
                            freeData: {
                                ...prev.freeData,
                                used: prev.freeData.used + (data.used || 0),
                                remaining: data.remaining
                            }
                        };
                    } else {
                        return {
                            ...prev,
                            used: prev.used + (data.used || 0),
                            remaining: data.remaining
                        };
                    }
                }
                return prev;
            });
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

    const percentUsedFree = useMemo(() => {
        if (!usageData.freeData || !usageData.freeData.limit) return 0;
        return Math.min(100, Math.max(0, (usageData.freeData.used / usageData.freeData.limit) * 100));
    }, [usageData]);

    if (loading) return null;

    return (
        <div className="w-full flex flex-col gap-4 py-4">
            {/* Free Tier Bar (Always show) */}
            <div className="w-full flex items-start justify-between">
                <div className="flex flex-col gap-1 pr-6 min-w-[150px]">
                    <span className="text-sm font-medium text-foreground">
                        {usageData.type === 'pro' ? "Personal Limits" : "Monthly"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        Resets in 7 days
                    </span>
                </div>
                
                <div className="flex-1 flex items-center gap-4 mt-1">
                    <div className="flex-1 h-1.5 bg-muted-foreground/20 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-blue-500 rounded-full transition-all duration-500"
                            style={{ width: `${usageData.type === 'pro' ? percentUsedFree : percentUsed}%` }}
                        />
                    </div>
                    <span className="text-xs text-muted-foreground w-[60px] text-right">
                        {Math.round(usageData.type === 'pro' ? percentUsedFree : percentUsed)}% used
                    </span>
                </div>
            </div>

            {/* Pro Tier Bar (Only if they have Pro enabled) */}
            {usageData.type === 'pro' && (
                <div className="w-full flex items-start justify-between mt-2">
                    <div className="flex flex-col gap-1 pr-6 min-w-[150px]">
                        <span className="text-sm font-medium text-foreground">
                            Org Pool
                        </span>
                        <span className="text-xs text-muted-foreground">
                            Shared Pro pool
                        </span>
                    </div>
                    
                    <div className="flex-1 flex items-center gap-4 mt-1">
                        <div className="flex-1 h-1.5 bg-muted-foreground/20 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-purple-500 rounded-full transition-all duration-500"
                                style={{ width: `${percentUsed}%` }}
                            />
                        </div>
                        <span className="text-xs text-muted-foreground w-[60px] text-right">
                            {Math.round(percentUsed)}% used
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};
