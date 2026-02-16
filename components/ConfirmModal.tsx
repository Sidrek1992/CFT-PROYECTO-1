import React, { useEffect, useRef, useCallback } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar acción',
  message = '¿Estás seguro de que deseas continuar?',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Focus trap y restauración de foco
  useEffect(() => {
    if (isOpen) {
      // Guardar el elemento que tenía el foco
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Enfocar el botón de confirmar después de que se monte
      setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 50);

      // Prevenir scroll del body
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = '';
      // Restaurar foco al cerrar
      if (previousFocusRef.current && !isOpen) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen]);

  // Manejar tecla Escape y Tab para focus trap
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }

    // Focus trap
    if (e.key === 'Tab' && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  }, [onClose]);

  const handleConfirm = useCallback(() => {
    onConfirm();
    onClose();
  }, [onConfirm, onClose]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: Trash2,
      iconBg: 'bg-red-50 dark:bg-red-900/30',
      iconColor: 'text-red-500 dark:text-red-400',
      confirmBg: 'bg-red-500 hover:bg-red-600 focus:ring-red-400',
    },
    warning: {
      icon: AlertTriangle,
      iconBg: 'bg-orange-50 dark:bg-orange-900/30',
      iconColor: 'text-[#F59121] dark:text-orange-400',
      confirmBg: 'bg-[#F59121] hover:bg-orange-600 focus:ring-orange-400',
    },
    info: {
      icon: AlertTriangle,
      iconBg: 'bg-blue-50 dark:bg-blue-900/30',
      iconColor: 'text-[#2F4DAA] dark:text-blue-400',
      confirmBg: 'bg-[#2F4DAA] hover:bg-[#253D88] focus:ring-blue-400',
    },
  };

  const styles = variantStyles[variant];
  const Icon = styles.icon;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-description"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#1A2B56]/40 backdrop-blur-[2px]" />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative w-full max-w-sm bg-white dark:bg-slate-800 rounded-[32px] shadow-[0px_20px_60px_rgba(26,43,86,0.15)] overflow-hidden animate-scale-in border border-slate-50 dark:border-slate-700"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-500 dark:hover:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-8 pt-10">
          <div className="flex flex-col items-center text-center">
            {/* Icon */}
            <div className={`w-20 h-20 ${styles.iconBg} rounded-[24px] flex items-center justify-center mb-6`}>
              <Icon className={`w-10 h-10 ${styles.iconColor}`} />
            </div>

            {/* Title */}
            <h2
              id="confirm-modal-title"
              className="text-2xl font-bold text-slate-800 dark:text-white mb-3"
            >
              {title}
            </h2>

            {/* Message */}
            <p
              id="confirm-modal-description"
              className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8 leading-relaxed"
            >
              {message}
            </p>

            {/* Actions */}
            <div className="flex flex-col gap-3 w-full">
              <button
                ref={confirmButtonRef}
                onClick={handleConfirm}
                className={`w-full py-4 ${styles.confirmBg} text-white font-bold rounded-2xl shadow-lg shadow-blue-900/10 transition-all active:scale-95 text-xs uppercase tracking-widest`}
              >
                {confirmText}
              </button>
              <button
                onClick={onClose}
                className="w-full py-4 bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-600 transition-all text-xs uppercase tracking-widest"
              >
                {cancelText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ConfirmModal);
