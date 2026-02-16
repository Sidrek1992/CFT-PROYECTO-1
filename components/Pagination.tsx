import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Activity } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = React.memo(({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange
}) => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 640);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    const pageNumbers = useMemo(() => {
        const pages: (number | string)[] = [];
        const maxVisible = isMobile ? 3 : 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);

            if (currentPage > 3) pages.push('...');

            for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                pages.push(i);
            }

            if (currentPage < totalPages - 2) pages.push('...');

            pages.push(totalPages);
        }

        return pages;
    }, [currentPage, totalPages, isMobile]);

    const goToFirst = useCallback(() => onPageChange(1), [onPageChange]);
    const goToPrev = useCallback(() => onPageChange(currentPage - 1), [onPageChange, currentPage]);
    const goToNext = useCallback(() => onPageChange(currentPage + 1), [onPageChange, currentPage]);
    const goToLast = useCallback(() => onPageChange(totalPages), [onPageChange, totalPages]);

    if (totalPages <= 1) return null;

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-8 py-10 px-8 border-t border-slate-50 dark:border-slate-800/60 mt-6 bg-slate-50/20">
            {/* Info Metrics Section */}
            <div className="flex items-center gap-5 group">
                <div className="w-12 h-12 rounded-[18px] bg-white dark:bg-slate-900 flex items-center justify-center text-[#2F4DAA] shadow-sm border border-slate-100 dark:border-slate-800 transition-all group-hover:scale-110 group-hover:rotate-3">
                    <Activity size={20} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                    <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.25em] mb-1">
                        Métrica de Visualización
                    </p>
                    <p className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em]">
                        Registros <span className="text-[#2F4DAA] dark:text-blue-400 px-1">{startItem}-{endItem}</span> de <span className="text-slate-800 dark:text-slate-200">{totalItems}</span>
                    </p>
                </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                    <button
                        onClick={goToFirst}
                        disabled={currentPage === 1}
                        className="hidden sm:flex p-3 rounded-[16px] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-lg hover:text-[#2F4DAA] active:scale-90"
                        title="Ir al inicio"
                    >
                        <ChevronsLeft size={18} strokeWidth={2.5} />
                    </button>

                    <button
                        onClick={goToPrev}
                        disabled={currentPage === 1}
                        className="flex p-3 rounded-[16px] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-lg hover:text-[#2F4DAA] active:scale-95"
                        title="Anterior"
                    >
                        <ChevronLeft size={18} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Page Selection Matrix */}
                <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 shadow-sm">
                    {pageNumbers.map((page, index) => (
                        typeof page === 'number' ? (
                            <button
                                key={index}
                                onClick={() => onPageChange(page)}
                                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-[14px] text-xs font-black transition-all duration-500 ${currentPage === page
                                    ? 'bg-gradient-to-br from-[#2F4DAA] to-[#1A2B56] text-white shadow-xl shadow-blue-500/30 ring-4 ring-blue-50 dark:ring-blue-900/20'
                                    : 'bg-transparent text-slate-400 dark:text-slate-600 hover:text-[#2F4DAA] hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                {page}
                            </button>
                        ) : (
                            <span key={index} className="px-3 text-slate-200 dark:text-slate-800 font-black tracking-widest text-lg">
                                ···
                            </span>
                        )
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={goToNext}
                        disabled={currentPage === totalPages}
                        className="flex p-3 rounded-[16px] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-lg hover:text-[#2F4DAA] active:scale-95"
                        title="Siguiente"
                    >
                        <ChevronRight size={18} strokeWidth={2.5} />
                    </button>

                    <button
                        onClick={goToLast}
                        disabled={currentPage === totalPages}
                        className="hidden sm:flex p-3 rounded-[16px] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-lg hover:text-[#2F4DAA] active:scale-90"
                        title="Ir al final"
                    >
                        <ChevronsRight size={18} strokeWidth={2.5} />
                    </button>
                </div>
            </div>
        </div>
    );
});

Pagination.displayName = 'Pagination';

export default Pagination;

