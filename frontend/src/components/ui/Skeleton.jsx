import React from 'react';

export function Skeleton({ className, ...props }) {
    return (
        <div
            className={`animate-pulse rounded-md ${className}`}
            style={{ backgroundColor: 'var(--skeleton-bg, #e5e7eb)' }}
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
        <div className="card">
            <div className="table-container">
                <table className="table w-full">
                    <thead>
                        <tr>
                            {Array(columns).fill(0).map((_, i) => (
                                <th key={i}><Skeleton className="h-4 w-24" /></th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Array(rows).fill(0).map((_, i) => (
                            <tr key={i}>
                                {Array(columns).fill(0).map((_, j) => (
                                    <td key={j}><Skeleton className="h-4 w-full" /></td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
