
import React, { useState, useMemo, useCallback, memo } from 'react';
import { PermitRecord, SolicitudType } from '../types';
import { Search, ArrowUpDown, ChevronUp, ChevronDown, UserCircle, LayoutGrid, CheckSquare, Square, FileDown, Loader2, X, Archive, Download, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { formatNumericDate } from '../utils/formatters';
import { compareRecordsByDateDesc } from '../utils/recordDates';
import { getFLSaldoFinal } from '../utils/flBalance';
import { generateBatchPDFs, BatchMode, BatchProgressInfo } from '../services/batchPdfGenerator';
import Pagination from './Pagination';
import ActionMenu from './ActionMenu';
import AdvancedFilters, { FilterState } from './AdvancedFilters';
import DecreePreviewModal from './DecreePreviewModal';
import { CONFIG } from '../config';

interface PermitTableProps {
  data: PermitRecord[];
  activeTab: SolicitudType | 'ALL';
  onDelete: (id: string) => void;
  onEdit: (record: PermitRecord) => void;
  searchTerm?: string;
  onSearchTermChange?: (value: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

type SortField = 'acto' | 'funcionario' | 'solicitudType' | 'fechaInicio' | 'cantidadDias' | 'saldo' | 'fechaDecreto';
type SortOrder = 'asc' | 'desc';

const emptyFilters: FilterState = { dateFrom: '', dateTo: '', minDays: '', maxDays: '', materia: '' };

/** Saldo after the decree: PA uses diasHaber - cantidadDias; FL uses P1/P2 according to available periods. */
const getSaldo = (r: PermitRecord): number => {
  if (r.solicitudType !== 'FL') return r.diasHaber - r.cantidadDias;
  return getFLSaldoFinal(r, 0);
};

const PermitTable: React.FC<PermitTableProps> = ({
  data,
  activeTab,
  onDelete,
  onEdit,
  searchTerm,
  onSearchTermChange,
  canEdit = true,
  canDelete = true
}) => {
  const [search, setSearch] = useState(searchTerm || '');
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [advFilters, setAdvFilters] = useState<FilterState>(emptyFilters);
  const [previewRecord, setPreviewRecord] = useState<PermitRecord | null>(null);

  // ★ Estado para selección múltiple
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchProgressInfo, setBatchProgressInfo] = useState<BatchProgressInfo | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const filtered = useMemo(() => {
    return data.filter(r => {
      const term = search.toLowerCase();
      const matchesSearch =
        r.funcionario.toLowerCase().includes(term) ||
        r.acto.toLowerCase().includes(term) ||
        r.rut.includes(term);
      const matchesTab = activeTab === 'ALL' || r.solicitudType === activeTab;

      let matchesAdvanced = true;
      if (advFilters.dateFrom && r.fechaInicio < advFilters.dateFrom) matchesAdvanced = false;
      if (advFilters.dateTo && r.fechaInicio > advFilters.dateTo) matchesAdvanced = false;
      if (advFilters.minDays && r.cantidadDias < Number(advFilters.minDays)) matchesAdvanced = false;
      if (advFilters.maxDays && r.cantidadDias > Number(advFilters.maxDays)) matchesAdvanced = false;
      if (advFilters.materia && r.materia !== advFilters.materia) matchesAdvanced = false;

      return matchesSearch && matchesTab && matchesAdvanced;
    }).sort((a, b) => {
      if (!sortField) return compareRecordsByDateDesc(a, b);

      let valA: string | number | Date;
      let valB: string | number | Date;

      switch (sortField) {
        case 'acto': valA = a.acto; valB = b.acto; break;
        case 'funcionario': valA = a.funcionario.toLowerCase(); valB = b.funcionario.toLowerCase(); break;
        case 'solicitudType': valA = a.solicitudType; valB = b.solicitudType; break;
        case 'fechaInicio': valA = new Date(a.fechaInicio).getTime(); valB = new Date(b.fechaInicio).getTime(); break;
        case 'cantidadDias': valA = a.cantidadDias; valB = b.cantidadDias; break;
        case 'saldo': valA = getSaldo(a); valB = getSaldo(b); break;
        case 'fechaDecreto': valA = new Date(a.fechaDecreto || '').getTime() || 0; valB = new Date(b.fechaDecreto || '').getTime() || 0; break;
        default: return 0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, search, activeTab, sortField, sortOrder, advFilters]);

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / CONFIG.ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * CONFIG.ITEMS_PER_PAGE;
    return filtered.slice(start, start + CONFIG.ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  React.useEffect(() => {
    if (searchTerm !== undefined && searchTerm !== search) {
      setSearch(searchTerm);
    }
  }, [searchTerm, search]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, activeTab, advFilters]);

  // ★ Funciones de selección múltiple
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(r => r.id)));
    }
  }, [filtered, selectedIds.size]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // ★ Generación masiva de PDFs
  const handleBatchGenerate = useCallback(async (mode: BatchMode) => {
    const selectedRecords = filtered.filter(r => selectedIds.has(r.id));
    if (selectedRecords.length === 0) return;

    setIsBatchGenerating(true);
    setBatchProgressInfo({ current: 0, total: selectedRecords.length, currentFile: '', status: 'generating' });

    try {
      await generateBatchPDFs(selectedRecords, mode, (info) => {
        setBatchProgressInfo(info);
      });
    } finally {
      // Mantener el modal abierto un momento para mostrar el resultado
      setTimeout(() => {
        setIsBatchGenerating(false);
        setBatchProgressInfo(null);
        clearSelection();
      }, 2500);
    }
  }, [filtered, selectedIds, clearSelection]);

  const SortIcon = useCallback(({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown size={10} className="opacity-20 ml-auto group-hover:opacity-100 transition-opacity" />;
    return sortOrder === 'asc'
      ? <ChevronUp size={12} className="ml-auto text-[#2F4DAA]" />
      : <ChevronDown size={12} className="ml-auto text-[#2F4DAA]" />;
  }, [sortField, sortOrder]);

  const handleGeneratePDF = useCallback(async (record: PermitRecord, _forcePdf: boolean) => {
    if (isBatchGenerating) return;

    setIsBatchGenerating(true);
    setBatchProgressInfo({ current: 0, total: 1, currentFile: '', status: 'generating' });

    try {
      await generateBatchPDFs([record], 'individual', (info) => {
        setBatchProgressInfo(info);
      });
    } finally {
      setTimeout(() => {
        setIsBatchGenerating(false);
        setBatchProgressInfo(null);
      }, 2500);
    }
  }, [isBatchGenerating]);

  const handlePreview = useCallback((record: PermitRecord) => {
    setPreviewRecord(record);
  }, []);

  const handleClosePreview = useCallback(() => {
    setPreviewRecord(null);
  }, []);

  const handleConfirmPreview = useCallback(() => {
    if (previewRecord) {
      handleGeneratePDF(previewRecord, true);
      setPreviewRecord(null);
    }
  }, [previewRecord, handleGeneratePDF]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ★ Toolbar de Selección Múltiple */}
      {selectedIds.size > 0 && (
        <div className="bg-[#2F4DAA] text-white px-6 py-4.5 rounded-[24px] flex items-center justify-between shadow-[0px_20px_50px_rgba(47,77,170,0.2)] page-fade-in border border-white/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent pointer-none" />
          <div className="flex items-center gap-5 relative z-10">
            <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl ring-1 ring-white/20">
              <CheckSquare size={16} className="text-emerald-300" />
              <span className="text-sm font-black tracking-tight">{selectedIds.size}</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-[11px] font-black text-white/90 uppercase tracking-[0.1em]">
                Registro{selectedIds.size > 1 ? 's' : ''} seleccionado{selectedIds.size > 1 ? 's' : ''}
              </span>
              <p className="text-[9px] font-bold text-white/50 uppercase tracking-wider mt-0.5">Acciones masivas disponibles</p>
            </div>
            <button
              onClick={clearSelection}
              className="p-2 hover:bg-white/20 rounded-xl transition-all active:scale-90"
              title="Deseleccionar"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex items-center gap-3 relative z-10">
            {!isBatchGenerating && (
              <>
                <button
                  onClick={() => handleBatchGenerate('individual')}
                  className="flex items-center gap-2.5 px-5 py-2.5 bg-white text-[#2F4DAA] rounded-xl text-[11px] font-black hover:shadow-lg transition-all active:scale-95 uppercase tracking-widest shadow-sm"
                >
                  <Download size={16} />
                  <span className="hidden sm:inline">Descargar uno a uno</span>
                </button>
                <button
                  onClick={() => handleBatchGenerate('zip')}
                  className="flex items-center gap-2.5 px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-[11px] font-black hover:bg-emerald-400 hover:shadow-lg transition-all active:scale-95 uppercase tracking-widest shadow-sm border border-emerald-400/50"
                >
                  <Archive size={16} />
                  <span className="hidden sm:inline">Descargar ZIP</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ★ Modal de Progreso de Generación */}
      {isBatchGenerating && batchProgressInfo && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1A2B56]/40 backdrop-blur-sm animate-in fade-in duration-500" />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-[32px] shadow-[0px_40px_100px_rgba(0,0,0,0.15)] overflow-hidden animate-in zoom-in-95 duration-500 border border-slate-100 dark:border-slate-700">
            {/* Header Moderno */}
            <div className="relative h-48 overflow-hidden bg-[#2F4DAA]">
              <div className="absolute inset-0 bg-gradient-to-br from-[#2F4DAA] via-[#2F4DAA] to-[#1A2B56]" />
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
              <div className="relative p-10 flex flex-col h-full justify-between items-center text-center">
                <div className="p-4 bg-white/10 backdrop-blur-xl rounded-[24px] ring-1 ring-white/20 shadow-2xl">
                  {batchProgressInfo.status === 'done'
                    ? <CheckCircle className="w-8 h-8 text-emerald-300" />
                    : batchProgressInfo.status === 'zipping'
                      ? <Archive className="w-8 h-8 text-white animate-bounce" />
                      : <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full" />
                  }
                </div>
                <div>
                  <h3 className="text-white text-lg font-black tracking-tight uppercase">
                    {batchProgressInfo.status === 'done' ? 'Proceso Completado' : 'Generando Documentos'}
                  </h3>
                  <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-1">GDP Cloud - Sistema de Gestión</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8">
              {/* Progress counter circular-like info */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Progreso Actual</p>
                  <div className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter">
                    {Math.round((batchProgressInfo.current / batchProgressInfo.total) * 100)}<span className="text-xl text-slate-300 ml-1">%</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Procesado</p>
                  <div className="text-xl font-black text-[#2F4DAA] dark:text-blue-400">
                    {batchProgressInfo.current} <span className="text-slate-300 mx-1">/</span> {batchProgressInfo.total}
                  </div>
                </div>
              </div>

              {/* Progress bar Premium */}
              <div className="h-3 bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden p-0.5 border border-slate-50 dark:border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-[#2F4DAA] to-[#F59121] rounded-full transition-all duration-700 ease-out shadow-[0px_0px_10px_rgba(47,77,170,0.3)]"
                  style={{ width: `${(batchProgressInfo.current / batchProgressInfo.total) * 100}%` }}
                />
              </div>

              {/* Current file / Status */}
              {batchProgressInfo.status !== 'done' && (
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 text-center">
                  <p className="text-[10px] font-black text-[#F59121] uppercase tracking-[0.2em] mb-2 animate-pulse">
                    {batchProgressInfo.status === 'downloading' ? 'Descargando Archivos' : batchProgressInfo.status === 'zipping' ? 'Comprimiendo Paquete' : 'Preparando Motor PDF'}
                  </p>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate px-4">
                    {batchProgressInfo.currentFile || 'Inicializando componentes...'}
                  </p>
                </div>
              )}

              {/* Final Results */}
              {batchProgressInfo.status === 'done' && batchProgressInfo.result && (
                <div className="animate-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-800/50 text-center">
                      <p className="text-2xl font-black text-emerald-600">{batchProgressInfo.result.success}</p>
                      <p className="text-[9px] font-black text-emerald-500/70 uppercase tracking-widest mt-1">Exitosos</p>
                    </div>
                    <div className={`rounded-2xl p-4 border text-center ${batchProgressInfo.result.failed > 0 ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-800/50' : 'bg-slate-50 dark:bg-slate-900/10 border-slate-100 dark:border-slate-800'}`}>
                      <p className={`text-2xl font-black ${batchProgressInfo.result.failed > 0 ? 'text-red-500' : 'text-slate-300'}`}>{batchProgressInfo.result.failed}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Errores</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 text-center font-bold uppercase tracking-widest animate-pulse">
                    Cerrando en un momento...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search Bar Premium Buk */}
      <div className="relative group max-w-4xl mx-auto transition-all duration-700">
        <div className="absolute -inset-1 bg-gradient-to-r from-[#2F4DAA]/5 to-[#F59121]/5 rounded-[30px] blur-xl opacity-0 group-focus-within:opacity-100 transition duration-1000" />
        <div className="relative">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-gradient-to-br from-[#2F4DAA] to-[#1A2B56] rounded-2xl text-white shadow-xl shadow-blue-500/20 group-focus-within:scale-110 transition-all duration-500 z-10">
            <Search size={22} strokeWidth={2.5} />
          </div>
          <input
            placeholder="Buscar por decreto, funcionario o RUT..."
            className="w-full pl-22 pr-12 py-6 bg-white dark:bg-slate-800 border-2 border-slate-50 dark:border-slate-700 rounded-[28px] shadow-[0px_15px_50px_rgba(26,43,86,0.04)] outline-none focus:bg-white focus:border-[#2F4DAA] focus:ring-[12px] focus:ring-blue-100 dark:focus:ring-blue-900/10 transition-all font-bold text-[15px] text-slate-800 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600 group-hover:border-slate-100 dark:group-hover:border-slate-600"
            value={search}
            onChange={(e) => {
              const value = e.target.value;
              setSearch(value);
              onSearchTermChange?.(value);
            }}
          />
          {search && (
            <button
              onClick={() => { setSearch(''); onSearchTermChange?.(''); }}
              className="absolute right-6 top-1/2 -translate-y-1/2 p-2.5 bg-slate-50 dark:bg-slate-700 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all active:scale-90"
            >
              <X size={16} strokeWidth={3} />
            </button>
          )}
        </div>
      </div>

      {/* Filtros Avanzados */}
      <AdvancedFilters
        filters={advFilters}
        onFiltersChange={setAdvFilters}
        onReset={() => setAdvFilters(emptyFilters)}
      />

      {/* Table Container Premium Buk */}
      <div className="bg-white dark:bg-slate-800 rounded-[32px] shadow-[0px_20px_60px_rgba(26,43,86,0.05)] border border-slate-100 dark:border-slate-700/50 overflow-hidden transition-all duration-500 hover:shadow-[0px_25px_70px_rgba(26,43,86,0.08)]">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/40">
                {/* ★ Checkbox superior */}
                <th className="pl-8 py-7 w-16 border-b border-slate-100 dark:border-slate-700/50">
                  <button
                    onClick={selectAll}
                    className={`w-11 h-11 rounded-[14px] transition-all duration-500 shadow-sm flex items-center justify-center border-2 ${selectedIds.size > 0 && selectedIds.size === filtered.length
                      ? 'bg-gradient-to-br from-[#2F4DAA] to-[#1A2B56] text-white border-transparent shadow-blue-500/20'
                      : 'bg-white dark:bg-slate-800 text-slate-200 dark:text-slate-700 border-slate-100 dark:border-slate-700 hover:border-blue-200 hover:text-blue-400'}`}
                  >
                    {selectedIds.size > 0 && selectedIds.size === filtered.length ? (
                      <CheckSquare size={20} strokeWidth={2.5} />
                    ) : (
                      <Square size={20} strokeWidth={2} />
                    )}
                  </button>
                </th>
                <th
                  onClick={() => handleSort('acto')}
                  className="px-4 py-7 border-b border-slate-100 dark:border-slate-700/50 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all select-none group"
                >
                  <div className="flex items-center gap-2.5">
                    Decreto
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <SortIcon field="acto" />
                    </div>
                  </div>
                </th>
                <th
                  onClick={() => handleSort('funcionario')}
                  className="px-6 py-7 border-b border-slate-100 dark:border-slate-700/50 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all select-none group"
                >
                  <div className="flex items-center gap-2.5">
                    Funcionario
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <SortIcon field="funcionario" />
                    </div>
                  </div>
                </th>
                <th
                  onClick={() => handleSort('solicitudType')}
                  className="px-6 py-7 border-b border-slate-100 dark:border-slate-700/50 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all select-none group hidden sm:table-cell"
                >
                  <div className="flex items-center gap-2.5">
                    Tipo
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <SortIcon field="solicitudType" />
                    </div>
                  </div>
                </th>
                {(activeTab === 'FL' || activeTab === 'ALL') && (
                  <th className="px-6 py-7 border-b border-slate-100 dark:border-slate-700/50 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500 hidden md:table-cell">
                    Período
                  </th>
                )}
                <th
                  onClick={() => handleSort('cantidadDias')}
                  className="px-6 py-7 border-b border-slate-100 dark:border-slate-700/50 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all select-none group"
                >
                  <div className="flex items-center gap-2.5">
                    Días
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <SortIcon field="cantidadDias" />
                    </div>
                  </div>
                </th>
                <th
                  onClick={() => handleSort('saldo')}
                  className="px-6 py-7 border-b border-slate-100 dark:border-slate-700/50 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all select-none group hidden sm:table-cell"
                >
                  <div className="flex items-center gap-2.5">
                    Saldo
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <SortIcon field="saldo" />
                    </div>
                  </div>
                </th>
                <th
                  onClick={() => handleSort('fechaInicio')}
                  className="px-6 py-7 border-b border-slate-100 dark:border-slate-700/50 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all select-none group hidden sm:table-cell"
                >
                  <div className="flex items-center gap-2.5">
                    Inicio
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <SortIcon field="fechaInicio" />
                    </div>
                  </div>
                </th>
                {(activeTab === 'FL' || activeTab === 'ALL') && (
                  <th className="px-6 py-7 border-b border-slate-100 dark:border-slate-700/50 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500 hidden lg:table-cell">
                    Término
                  </th>
                )}
                <th
                  onClick={() => handleSort('fechaDecreto')}
                  className="px-6 py-7 border-b border-slate-100 dark:border-slate-700/50 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all select-none group hidden lg:table-cell"
                >
                  <div className="flex items-center gap-2.5">
                    Emisión
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <SortIcon field="fechaDecreto" />
                    </div>
                  </div>
                </th>
                <th className="pr-10 py-7 border-b border-slate-100 dark:border-slate-700/50 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500 text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
              {paginatedData.map((record, index) => {
                const isSelected = selectedIds.has(record.id);
                const isPA = record.solicitudType === 'PA';
                return (
                  <tr
                    key={record.id}
                    className={`group/row transition-all duration-300 ${isSelected ? 'bg-blue-50/40 dark:bg-blue-900/10' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'}`}
                  >
                    <td className="pl-8 py-5">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleSelect(record.id); }}
                        className={`w-11 h-11 rounded-[14px] transition-all duration-500 shadow-sm flex items-center justify-center border-2 ${isSelected
                          ? 'bg-gradient-to-br from-[#F59121] to-[#d4791a] text-white border-transparent shadow-orange-500/25'
                          : 'bg-white dark:bg-slate-800 text-slate-200 dark:text-slate-700 border-slate-50 dark:border-slate-700 group-hover/row:border-orange-100 group-hover/row:text-orange-200'}`}
                      >
                        {isSelected ? <CheckSquare size={20} strokeWidth={2.5} /> : <Square size={20} strokeWidth={2} />}
                      </button>
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex flex-col">
                        <span className={`font-black text-sm tracking-tight transition-colors ${isPA ? 'text-[#2F4DAA] dark:text-blue-400' : 'text-[#F59121] dark:text-orange-400'}`}>{record.acto}</span>
                        <span className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest truncate max-w-[120px] mt-1">{record.materia || 'S/M'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-300 dark:text-slate-700 group-hover/row:bg-gradient-to-br from-[#2F4DAA] to-[#1A2B56] group-hover/row:text-white group-hover/row:shadow-xl group-hover/row:shadow-blue-500/20 transition-all duration-500">
                          <UserCircle size={26} strokeWidth={1.5} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <p className="text-[14px] font-black text-slate-800 dark:text-white uppercase tracking-tight truncate max-w-[180px] lg:max-w-xs transition-colors group-hover/row:text-[#2F4DAA] dark:group-hover/row:text-blue-400">
                            {record.funcionario}
                          </p>
                          <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 mt-0.5 tracking-[0.1em]">
                            {record.rut}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 hidden sm:table-cell">
                      <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm transition-all duration-500 ${isPA
                        ? 'bg-blue-50/50 dark:bg-blue-900/20 text-[#2F4DAA] border-blue-100 dark:border-blue-900/50'
                        : 'bg-orange-50/50 dark:bg-orange-900/20 text-[#F59121] border-orange-100 dark:border-orange-900/50'}`}>
                        {isPA ? 'PA - Permiso' : 'FL - Feriado'}
                      </span>
                    </td>
                    {(activeTab === 'FL' || activeTab === 'ALL') && (
                      <td className="px-6 py-5 hidden md:table-cell">
                        {record.solicitudType === 'FL' ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            {record.periodo1 && (
                              <span className="px-3 py-1 rounded-lg text-[9px] font-black bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 border border-sky-100/50 dark:border-sky-800/50 uppercase">
                                {record.periodo1}
                              </span>
                            )}
                            {record.periodo2 && (
                              <span className="px-3 py-1 rounded-lg text-[9px] font-black bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border border-purple-100/50 dark:border-purple-800/50 uppercase">
                                {record.periodo2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="w-6 h-1 bg-slate-100 dark:bg-slate-800 rounded-full block" />
                        )}
                      </td>
                    )}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <span className={`font-black text-[16px] tracking-tight ${isPA ? 'text-slate-800 dark:text-slate-200' : 'text-orange-700 dark:text-orange-400'}`}>{record.cantidadDias}</span>
                        <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">Días</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 hidden sm:table-cell">
                      <div className={`flex flex-col ${getSaldo(record) < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-[16px] tracking-tight">{getSaldo(record).toFixed(1)}</span>
                          {getSaldo(record) < 1 && <AlertCircle size={12} className="opacity-60" />}
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-40">Saldo Final</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 hidden sm:table-cell">
                      <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300">{formatNumericDate(record.fechaInicio)}</span>
                        <span className="text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] mt-1">Inicio Vigencia</span>
                      </div>
                    </td>
                    {(activeTab === 'FL' || activeTab === 'ALL') && (
                      <td className="px-6 py-5 hidden lg:table-cell">
                        <div className="flex flex-col">
                          <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300">
                            {record.fechaTermino ? formatNumericDate(record.fechaTermino) : '-'}
                          </span>
                          {record.fechaTermino && <span className="text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] mt-1">Término</span>}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-5 hidden lg:table-cell">
                      <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-[#2F4DAA] dark:text-blue-400">
                          {record.fechaDecreto ? formatNumericDate(record.fechaDecreto) : '-'}
                        </span>
                        <span className="text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] mt-1">F. Emisión</span>
                      </div>
                    </td>
                    <td className="pr-10 py-5 text-right">
                      <div className="flex justify-end opacity-40 group-hover/row:opacity-100 transition-all duration-300">
                        <ActionMenu
                          record={record}
                          onEdit={canEdit ? onEdit : undefined}
                          onDelete={canDelete ? onDelete : undefined}
                          onGeneratePDF={handleGeneratePDF}
                          onPreview={handlePreview}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-10 py-40 text-center bg-slate-50/10 dark:bg-slate-900/10">
                    <div className="flex flex-col items-center gap-8">
                      <div className="relative">
                        <div className="absolute -inset-10 bg-gradient-to-r from-[#2F4DAA]/10 to-[#F59121]/10 rounded-full blur-3xl opacity-50" />
                        <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-[32px] shadow-2xl flex items-center justify-center text-slate-100 dark:text-slate-700 ring-1 ring-slate-100 dark:ring-slate-700/50 relative">
                          <Archive size={48} strokeWidth={1} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[15px] font-black text-slate-800 dark:text-white uppercase tracking-[0.4em]">
                          Base de Datos Vacía
                        </p>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">No se encontraron decretos para los criterios seleccionados</p>
                      </div>
                      <button
                        onClick={() => { setSearch(''); setAdvFilters(emptyFilters); }}
                        className="px-8 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all"
                      >
                        Limpiar todos los filtros
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación Premium */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={CONFIG.ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Footer Info */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
        <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.2em]">
          GDP Cloud v4.2 — Institutional Portal
        </p>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800/40 rounded-full border border-slate-100 dark:border-slate-700">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none">
            {totalItems} Decreto{totalItems !== 1 ? 's' : ''} en sistema
          </p>
        </div>
      </div>

      {/* Modal de Previsualización */}
      <DecreePreviewModal
        isOpen={previewRecord !== null}
        onClose={handleClosePreview}
        record={previewRecord}
        onConfirm={handleConfirmPreview}
      />
    </div>
  );
};

export default memo(PermitTable);
