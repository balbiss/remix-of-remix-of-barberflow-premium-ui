import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Users, Scissors, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { useDashboardStats, useCompletedServices } from '@/hooks/useCompletedServices';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

const OwnerDashboard = () => {
  const { data: stats, isLoading: loadingStats } = useDashboardStats();
  const today = new Date().toISOString().split('T')[0];
  const { data: recentServices = [], isLoading: loadingServices } = useCompletedServices(today);

  if (loadingStats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground uppercase tracking-widest">Carregando painel...</p>
      </div>
    );
  }

  const statCards = [
    { label: 'Faturamento Hoje', value: `R$ ${stats?.revenue_today || 0}`, icon: DollarSign, trend: '+0%' },
    { label: 'Atendimentos', value: String(stats?.services_today || 0), icon: Scissors, trend: '+0' },
    { label: 'Clientes Novos', value: String(stats?.clients_today || 0), icon: Users, trend: '+0' },
    { label: 'Ticket Médio', value: `R$ ${stats?.avg_ticket || 0}`, icon: TrendingUp, trend: '+0%' },
  ];

  const weeklyData = stats?.revenue_week || [];
  const teamPerf = stats?.team_performance || [];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {statCards.map((stat) => (
          <motion.div key={stat.label} variants={item} className="obsidian-card">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className="w-5 h-5 gold-text" strokeWidth={1.5} />
              <span className="text-xs uppercase tracking-ultra text-muted-foreground">
                {stat.label}
              </span>
            </div>
            <p className="text-2xl font-bold font-mono-tabular text-foreground tracking-display">
              {stat.value}
            </p>
            <span className="text-sm gold-text font-medium">{stat.trend}</span>
          </motion.div>
        ))}
      </div>

      {/* Revenue Chart */}
      <motion.div variants={item} className="obsidian-card">
        <p className="text-sm uppercase tracking-ultra text-muted-foreground mb-4">
          Faturamento Semanal
        </p>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={weeklyData}>
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(0 0% 50%)', fontSize: 12 }}
            />
            <YAxis hide />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {weeklyData.map((entry: any, i: number) => (
                <Cell
                  key={i}
                  fill={i === weeklyData.length - 1 ? 'hsl(38 92% 50%)' : 'hsl(0 0% 20%)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Team Performance */}
      <motion.div variants={item} className="obsidian-card">
        <p className="text-sm uppercase tracking-ultra text-muted-foreground mb-4">
          Desempenho da Equipe
        </p>
        <div className="space-y-3">
          {teamPerf.map((member: any) => (
            <div key={member.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <span className="text-sm font-bold gold-text">
                    {member.name.split(' ').map((n: string) => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <p className="text-base font-medium text-foreground">{member.name}</p>
                  <p className="text-sm text-muted-foreground">{member.services_count} atendimentos</p>
                </div>
              </div>
              <p className="text-base font-mono-tabular font-bold text-foreground">
                R$ {member.revenue}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Recent Services */}
      <motion.div variants={item} className="obsidian-card">
        <p className="text-sm uppercase tracking-ultra text-muted-foreground mb-4">
          Últimos Atendimentos
        </p>
        <div className="space-y-3">
          {loadingServices ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            </div>
          ) : recentServices.length === 0 ? (
            <p className="text-sm text-center text-muted-foreground py-4">Nenhum atendimento hoje</p>
          ) : recentServices.slice(0, 5).map((s) => (
            <div key={s.id} className="flex items-center justify-between border-b border-border/30 pb-3 last:border-0 last:pb-0">
              <div>
                <p className="text-base font-medium text-foreground">{s.client?.name}</p>
                <p className="text-sm text-muted-foreground">{s.service_name} • {s.time}</p>
              </div>
              <p className="text-base font-mono-tabular gold-text font-bold">
                R$ {s.service_price.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default OwnerDashboard;
