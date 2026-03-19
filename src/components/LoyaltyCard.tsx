import { motion } from 'framer-motion';
import { Star, Gift } from 'lucide-react';

interface LoyaltyCardProps {
  stamps: number;
  clientName: string;
}

const LoyaltyCard = ({ stamps, clientName }: LoyaltyCardProps) => {
  const total = 10;
  const isComplete = stamps >= total;

  return (
    <div className="obsidian-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm uppercase tracking-ultra text-muted-foreground">Cartão Fidelidade</p>
          <p className="text-base font-medium text-foreground mt-0.5">{clientName}</p>
        </div>
        <Gift className="w-6 h-6 gold-text" strokeWidth={1.5} />
      </div>

      <div className="grid grid-cols-5 gap-3">
        {Array.from({ length: total }).map((_, i) => (
          <motion.div
            key={i}
            initial={i < stamps ? { scale: 0 } : {}}
            animate={i < stamps ? { scale: 1.1 } : {}}
            transition={{ delay: i * 0.05, type: 'spring', damping: 15, stiffness: 200 }}
            className={i < stamps ? 'stamp-filled' : 'stamp-empty'}
          >
            {i < stamps ? (
              <Star className="w-5 h-5 text-primary-foreground" strokeWidth={1.5} fill="currentColor" />
            ) : (
              <span className="text-sm text-muted-foreground">{i + 1}</span>
            )}
          </motion.div>
        ))}
      </div>

      <div className="mt-3 text-center">
        {isComplete ? (
          <motion.p
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-sm font-bold gold-text uppercase tracking-ultra"
          >
            🎉 Corte Grátis Disponível!
          </motion.p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {stamps} de {total} — faltam {total - stamps} para o corte grátis
          </p>
        )}
      </div>
    </div>
  );
};

export default LoyaltyCard;
