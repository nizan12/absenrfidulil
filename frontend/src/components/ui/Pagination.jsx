import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import CustomSelect from './CustomSelect';

export default function Pagination({
    currentPage = 1,
    totalItems = 0,
    perPage = 10,
    onPageChange,
    onPerPageChange,
    perPageOptions = [10, 25, 50, 100],
}) {
    const totalPages = Math.ceil(totalItems / perPage);
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * perPage + 1;
    const endItem = Math.min(currentPage * perPage, totalItems);

    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            // Always show first page
            pages.push(1);

            if (currentPage > 3) pages.push('...');

            // Pages around current
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                if (!pages.includes(i)) pages.push(i);
            }

            if (currentPage < totalPages - 2) pages.push('...');

            // Always show last page
            if (!pages.includes(totalPages)) pages.push(totalPages);
        }

        return pages;
    };

    if (totalItems === 0) return null;

    // Convert perPageOptions to CustomSelect format
    const perPageSelectOptions = perPageOptions.map(opt => ({ value: opt, label: String(opt) }));

    return (
        <div className="flex flex-col items-center gap-3 px-4 py-3 border-t sm:flex-row sm:justify-between sm:gap-4" style={{ borderColor: 'var(--border-color)' }}>
            {/* Per-page selector + Info (combined on mobile) */}
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <div className="flex items-center gap-2">
                    <span className="whitespace-nowrap">Tampilkan</span>
                    <CustomSelect
                        options={perPageSelectOptions}
                        value={perPage}
                        onChange={(value) => {
                            onPerPageChange(value);
                            onPageChange(1);
                        }}
                        className="w-20"
                    />
                    <span className="whitespace-nowrap">data</span>
                </div>
                <span className="hidden sm:inline px-1">•</span>
                <span className="whitespace-nowrap">
                    Menampilkan <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{startItem}-{endItem}</span> dari <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{totalItems}</span>
                </span>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-1">
                {/* First page */}
                <button
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
                    title="Halaman pertama"
                >
                    <ChevronsLeft size={18} style={{ color: 'var(--text-secondary)' }} />
                </button>

                {/* Previous */}
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
                    title="Sebelumnya"
                >
                    <ChevronLeft size={18} style={{ color: 'var(--text-secondary)' }} />
                </button>

                {/* Page numbers */}
                <div className="hidden sm:flex items-center gap-1">
                    {getPageNumbers().map((page, index) => (
                        page === '...' ? (
                            <span key={`ellipsis-${index}`} className="px-2 text-sm" style={{ color: 'var(--text-muted)' }}>...</span>
                        ) : (
                            <button
                                key={page}
                                onClick={() => onPageChange(page)}
                                className={`min-w-[32px] h-8 px-2 text-sm font-medium rounded-lg transition-colors ${currentPage === page
                                    ? 'text-white'
                                    : 'hover:bg-gray-100'
                                    }`}
                                style={currentPage === page ? {
                                    background: 'var(--accent-color)'
                                } : {
                                    color: 'var(--text-secondary)'
                                }}
                            >
                                {page}
                            </button>
                        )
                    ))}
                </div>

                {/* Mobile: Page indicator */}
                <span className="sm:hidden text-sm px-2 font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {currentPage} / {totalPages}
                </span>

                {/* Next */}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
                    title="Selanjutnya"
                >
                    <ChevronRight size={18} style={{ color: 'var(--text-secondary)' }} />
                </button>

                {/* Last page */}
                <button
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
                    title="Halaman terakhir"
                >
                    <ChevronsRight size={18} style={{ color: 'var(--text-secondary)' }} />
                </button>
            </div>
        </div>
    );
}
