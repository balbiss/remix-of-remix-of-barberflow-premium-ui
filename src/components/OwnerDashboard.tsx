import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Users, Scissors } from 'lucide-react';
import { weeklyRevenue, teamMembers, mockCompletedServices } from '@/data/mockData';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';

const statCards = [
  { label: 'Faturamento Hoje', value: 'R$ 2.340', icon: DollarSign, trend: '+12%' },
  { label: 'Atendimentos', value: '14', icon: Scissors, trend: '+3' },
  { label: 'Clientes Novos', value: '4', icon: Users, trend: '+2' },
  { label: 'Ticket Médio', value: 'R$ 167', icon: TrendingUp, trend: '+8%' },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

const OwnerDashboard = () => {
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
          <BarChart data={weeklyRevenue}>
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(0 0% 50%)', fontSize: 12 }}
            />
            <YAxis hide />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {weeklyRevenue.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.day === 'Sáb' ? 'hsl(38 92% 50%)' : 'hsl(0 0% 20%)'}
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
          {teamMembers.map((member) => (
            <div key={member.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <span className="text-sm font-bold gold-text">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <p className="text-base font-medium text-foreground">{member.name}</p>
                  <p className="text-sm text-muted-foreground">{member.todayServices} atendimentos</p>
                </div>
              </div>
              <p className="text-base font-mono-tabular font-bold text-foreground">
                R$ {member.todayRevenue}
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
          {mockCompletedServices.map((s) => (
            <div key={s.id} className="flex items-center justify-between border-b border-border/30 pb-3 last:border-0 last:pb-0">
              <div>
                <p className="text-base font-medium text-foreground">{s.clientName}</p>
                <p className="text-sm text-muted-foreground">{s.serviceName} • {s.time}</p>
              </div>
              <p className="text-base font-mono-tabular gold-text font-bold">
                R$ {s.servicePrice.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default OwnerDashboard;
