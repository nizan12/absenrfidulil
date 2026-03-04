import React from 'react';

export function Skeleton({ className, ...props }) {
    return (
        <div
            className={`animate-pulse rounded-xl ${className}`}
            style={{
                backgroundColor: 'color-mix(in srgb, var(--text-secondary) 15%, transparent)',
            }}
            {...props}
        />
    );
}

export function CardSkeleton({ count = 8 }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array(count).fill(0).map((_, i) => (
                <div key={i} className="card p-4 space-y-4">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-xl" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                    </div>
                    <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-2/3" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function TableSkeleton({ columns = 5, rows = 5 }) {
    return (
        <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--bg-card)' }}>
            {/* Header skeleton */}
            <div className="flex gap-4 pb-4 mb-4" style={{ borderBottom: '1px solid color-mix(in srgb, var(--text-secondary) 15%, transparent)' }}>
                {Array(columns).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-4 flex-1" style={{ maxWidth: i === 0 ? '40px' : '120px' }} />
                ))}
            </div>
            {/* Rows skeleton */}
            <div className="space-y-3">
                {Array(rows).fill(0).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 py-3 rounded-xl" style={{ backgroundColor: 'color-mix(in srgb, var(--text-secondary) 5%, transparent)' }}>
                        <Skeleton className="h-10 w-10 rounded-xl ml-3" />
                        <div className="flex-1 flex gap-4">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-20" />
                        </div>
                        <Skeleton className="h-6 w-16 mr-3" />
                    </div>
                ))}
            </div>
        </div>
    );
}
