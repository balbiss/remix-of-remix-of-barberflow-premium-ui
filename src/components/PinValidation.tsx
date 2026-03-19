import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Delete, X } from 'lucide-react';
import { Drawer, DrawerContent } from '@/components/ui/drawer';

interface PinValidationProps {
  open: boolean;
  pin: string;
  onSuccess: () => void;
  onClose: () => void;
}

const PinValidation = ({ open, pin, onSuccess, onClose }: PinValidationProps) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePress = useCallback((digit: string) => {
    if (input.length >= 4) return;
    const next = input + digit;
    setInput(next);
    setError(false);

    if (next.length === 4) {
      if (next === pin) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          setInput('');
          setSuccess(false);
        }, 1500);
      } else {
        setError(true);
        setTimeout(() => {
          setInput('');
          setError(false);
        }, 800);
      }
    }
  }, [input, pin, onSuccess]);

  const handleDelete = () => {
    setInput(prev => prev.slice(0, -1));
    setError(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
      setInput('');
      setError(false);
      setSuccess(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="bg-background border-t border-primary/30">
        <div className="flex flex-col items-center px-6 pt-6 pb-10">
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-4 py-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ background: 'hsl(38 92% 50%)' }}
                >
                  <Check className="w-10 h-10 text-primary-foreground" strokeWidth={2.5} />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-center"
                >
                  <p className="text-lg font-bold text-foreground">Atendimento Validado!</p>
                  <p className="text-sm text-muted-foreground mt-1">+1 ponto de fidelidade</p>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div key="input" className="w-full flex flex-col items-center">
                {/* Header */}
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="text-xs uppercase tracking-ultra text-primary/60">
                    Código de Validação
                  </span>
                  <button onClick={onClose} className="text-muted-foreground">
                    <X className="w-5 h-5" strokeWidth={1.5} />
                  </button>
                </div>

                {/* Show PIN */}
                <div className="text-4xl font-mono-tabular font-bold tracking-widest text-foreground mb-2">
                  {pin.split('').join(' ')}
                </div>
                <p className="text-xs text-muted-foreground mb-6">
                  Mostre ao cliente e confirme abaixo
                </p>

                {/* Input dots */}
                <div className="flex gap-4 mb-8">
                  {[0, 1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      animate={error ? { x: [0, -8, 8, -4, 4, 0] } : {}}
                      transition={{ duration: 0.4 }}
                      className={`w-4 h-4 rounded-full transition-all ${
                        i < input.length
                          ? error
                            ? 'bg-destructive scale-110'
                            : 'bg-primary scale-110 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                          : 'border-2 border-muted-foreground/30'
                      }`}
                    />
                  ))}
                </div>

                {/* Numpad */}
                <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                    <motion.button
                      key={n}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handlePress(String(n))}
                      className="h-16 rounded-xl border text-2xl font-medium text-foreground transition-colors"
                      style={{
                        background: 'var(--surface-glass)',
                        borderColor: 'var(--surface-glass-border)',
                      }}
                    >
                      {n}
                    </motion.button>
                  ))}
                  <div />
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handlePress('0')}
                    className="h-16 rounded-xl border text-2xl font-medium text-foreground transition-colors"
                    style={{
                      background: 'var(--surface-glass)',
                      borderColor: 'var(--surface-glass-border)',
                    }}
                  >
                    0
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleDelete}
                    className="h-16 rounded-xl border flex items-center justify-center text-muted-foreground transition-colors"
                    style={{
                      background: 'var(--surface-glass)',
                      borderColor: 'var(--surface-glass-border)',
                    }}
                  >
                    <Delete className="w-6 h-6" strokeWidth={1.5} />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default PinValidation;
