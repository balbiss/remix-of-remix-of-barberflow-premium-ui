import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

type PopupType = 'success' | 'error' | 'info';

interface PopupData {
  id: number;
  type: PopupType;
  message: string;
}

interface PopupContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const PopupContext = createContext<PopupContextValue | null>(null);

export const usePopup = () => {
  const ctx = useContext(PopupContext);
  if (!ctx) throw new Error('usePopup must be used within PopupProvider');
  return ctx;
};

let popupId = 0;

export const PopupProvider = ({ children }: { children: ReactNode }) => {
  const [popups, setPopups] = useState<PopupData[]>([]);

  const show = useCallback((type: PopupType, message: string) => {
    const id = ++popupId;
    setPopups(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setPopups(prev => prev.filter(p => p.id !== id));
    }, 2200);
  }, []);

  const success = useCallback((msg: string) => show('success', msg), [show]);
  const error = useCallback((msg: string) => show('error', msg), [show]);
  const info = useCallback((msg: string) => show('info', msg), [show]);

  const iconMap = {
    success: <CheckCircle2 className="w-10 h-10 text-primary" strokeWidth={1.5} />,
    error: <XCircle className="w-10 h-10 text-destructive" strokeWidth={1.5} />,
    info: <AlertCircle className="w-10 h-10 text-primary" strokeWidth={1.5} />,
  };

  return (
    <PopupContext.Provider value={{ success, error, info }}>
      {children}
      <AnimatePresence>
        {popups.map(popup => (
          <motion.div
            key={popup.id}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
          >
            <div className="pointer-events-auto glass-surface px-8 py-6 flex flex-col items-center gap-3 max-w-[280px] shadow-2xl"
              style={{ boxShadow: popup.type === 'success' ? 'var(--gold-glow)' : undefined }}
            >
              {iconMap[popup.type]}
              <p className="text-base font-medium text-foreground text-center leading-snug">
                {popup.message}
              </p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </PopupContext.Provider>
  );
};
