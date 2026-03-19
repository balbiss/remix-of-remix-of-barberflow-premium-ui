import { motion } from 'framer-motion';
import { DollarSign, Target, Clock, TrendingUp } from 'lucide-react';
import { mockCompletedServices } from '@/data/mockData';

const BarberDashboard = () => {
  const myServices = mockCompletedServices.filter(s => s.barberId === '2');
  const totalRevenue = myServices.reduce((sum, s) => sum + s.servicePrice, 0);
  const commission = totalRevenue * 0.45;
  const dailyGoal = 500;
  const progress = Math.min((commission / dailyGoal) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Commission Progress */}
      <div className="obsidian-card text-center">
        <p className="text-sm uppercase tracking-ultra text-muted-foreground mb-4">
          Minha Comissão Hoje
        </p>
        <div className="relative w-32 h-32 mx-auto mb-4">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50" cy="50" r="42"
              fill="none"
              stroke="hsl(0 0% 15%)"
              strokeWidth="8"
            />
            <motion.circle
              cx="50" cy="50" r="42"
              fill="none"
              stroke="hsl(38 92% 50%)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 42}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - progress / 100) }}
              transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold font-mono-tabular text-foreground">
              R$ {commission.toFixed(0)}
            </span>
            <span className="text-xs text-muted-foreground">
              de R$ {dailyGoal}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-center gap-1 text-sm">
          <Target className="w-4 h-4 gold-text" strokeWidth={1.5} />
          <span className="text-muted-foreground">Meta diária: </span>
          <span className="gold-text font-bold">{progress.toFixed(0)}%</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Receita', value: `R$ ${totalRevenue}`, icon: DollarSign },
          { label: 'Serviços', value: String(myServices.length), icon: Clock },
          { label: 'Comissão', value: '45%', icon: TrendingUp },
        ].map((stat) => (
          <div key={stat.label} className="obsidian-card text-center">
            <stat.icon className="w-5 h-5 gold-text mx-auto mb-1" strokeWidth={1.5} />
            <p className="text-lg font-bold font-mono-tabular text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-ultra">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* My History */}
      <div className="obsidian-card">
        <p className="text-sm uppercase tracking-ultra text-muted-foreground mb-4">
          Meu Histórico Hoje
        </p>
        <div className="space-y-3">
          {myServices.map((s) => (
            <div key={s.id} className="flex items-center justify-between border-b border-border/30 pb-3 last:border-0 last:pb-0">
              <div>
                <p className="text-base font-medium text-foreground">{s.clientName}</p>
                <p className="text-sm text-muted-foreground">{s.serviceName} • {s.time}</p>
              </div>
              <div className="text-right">
                <p className="text-base font-mono-tabular gold-text font-bold">
                  R$ {(s.servicePrice * 0.45).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">comissão</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default BarberDashboard;
