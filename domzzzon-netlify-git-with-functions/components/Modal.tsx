
import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300">
      <div className="relative bg-slate-900 w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-white/10 shadow-2xl p-6 md:p-8">
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-slate-900 py-2">
          <h2 className="text-xl md:text-2xl font-bold text-white">{title}</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2"
            aria-label="Закрыть"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="text-slate-300 space-y-4 leading-relaxed text-sm md:text-base">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
