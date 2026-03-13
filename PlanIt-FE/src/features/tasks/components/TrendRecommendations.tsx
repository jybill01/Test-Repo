/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { useTrends } from '../hooks/useTrends';
import { TrendCard } from './TrendCard';

interface TrendRecommendationsProps {
    setAiPrompt: (prompt: string) => void;
}

/**
 * TrendRecommendations container component
 * Manages trend fetching and renders TrendCard components as a horizontal swipeable carousel
 */
export const TrendRecommendations: React.FC<TrendRecommendationsProps> = ({ setAiPrompt }) => {
    const { trends, loading, error } = useTrends();
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Update current index based on scroll position
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const scrollLeft = container.scrollLeft;
            const cardWidth = container.offsetWidth;
            const newIndex = Math.round(scrollLeft / cardWidth);
            setCurrentIndex(newIndex);
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [trends.length]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                <span className="ml-2 text-sm text-gray-500">트렌드 불러오는 중...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <p className="text-xs text-red-500 font-medium">{error}</p>
            </div>
        );
    }

    if (trends.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-xs text-gray-500">현재 추천할 트렌드가 없습니다</p>
            </div>
        );
    }

    // Sort trends by score in descending order (highest first)
    const sortedTrends = [...trends].sort((a, b) => b.score - a.score);

    return (
        <div className="mb-6">
            {/* Horizontal Swipeable Carousel */}
            <div
                ref={scrollContainerRef}
                className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {sortedTrends.map((trend) => (
                    <div key={trend.trendId} className="flex-shrink-0 w-full snap-center">
                        <TrendCard
                            trend={trend}
                            onGoalClick={setAiPrompt}
                        />
                    </div>
                ))}
            </div>

            {/* Page Indicators - Numeric */}
            {sortedTrends.length > 1 && (
                <div className="text-xs text-gray-500 text-center mt-3">
                    {currentIndex + 1} / {sortedTrends.length}
                </div>
            )}
        </div>
    );
};
