import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { CreditCard, Rocket, CheckCircle2, Loader2 } from 'lucide-react';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({ children }) => {
  const { user, subscriptionStatus, isLoading } = useAuth();

  // If still loading auth/profile, show loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Barbers and SuperAdmins are exempt from subscription check (only owners pay)
  if (user?.role === 'barber' || user?.role === 'superadmin') {
    return <>{children}</>;
  }

  // If status is not 'active', show the paywall
  if (subscriptionStatus !== 'active') {
    return (
      <div className="min-h-screen bg-background relative flex items-center justify-center overflow-hidden px-4 py-12">
        {/* Background elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-lg glass-surface p-8 text-center"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 mb-6">
            <Rocket className="w-10 h-10 gold-text" strokeWidth={1.5} />
          </div>

          <h2 className="text-3xl font-bold tracking-display text-foreground mb-4">
            Ative seu Plano <span className="gold-text">Flow</span>
          </h2>
          
          <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
            Sua barbearia está quase pronta! Para liberar todas as funcionalidades premium e começar a gerenciar seus clientes, ative sua assinatura.
          </p>

          <div className="obsidian-card text-left p-6 mb-8 border-primary/20 bg-primary/5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm uppercase tracking-ultra text-muted-foreground font-bold">Plano Profissional</span>
              <span className="text-2xl font-bold text-foreground">R$ 59,90<span className="text-sm font-normal text-muted-foreground">/mês</span></span>
            </div>
            
            <ul className="space-y-3">
              {[
                'Gestão completa de clientes',
                'Painel individual para barbeiros',
                'Relatórios financeiros e comissões',
                'Pontos de fidelidade automáticos',
                'Suporte prioritário'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <motion.a
               href={`https://pay.cakto.com.br/b5xqqtr_811619?email=${encodeURIComponent(user?.email || '')}`}
               target="_blank"
               rel="noopener noreferrer"
               whileTap={{ scale: 0.97 }}
               className="w-full h-14 rounded-xl gold-gradient-btn text-base font-bold flex items-center justify-center gap-2"
             >
               <CreditCard className="w-5 h-5" />
               Assinar Agora (R$ 59,90)
             </motion.a>
             
             <button 
               onClick={() => {
                 // Force reload to check new status from Supabase
                 window.location.reload();
               }}
               className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2 flex items-center justify-center gap-2"
             >
               <CheckCircle2 className="w-4 h-4 text-primary" />
               Já assinei? Clique aqui para atualizar
             </button>
          </div>

          <p className="mt-6 text-xs text-muted-foreground italic">
            * Pagamento processado de forma segura via Cakto.
          </p>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
};

export default SubscriptionGuard;
