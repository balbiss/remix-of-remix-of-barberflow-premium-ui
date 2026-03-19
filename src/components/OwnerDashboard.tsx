import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, TrendingUp, Users, Scissors, Loader2, Pencil, Trash2, Check, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { useDashboardStats, useCompletedServices, useUpdateCompletedService, useDeleteCompletedService } from '@/hooks/useCompletedServices';
import { usePopup } from '@/contexts/PopupContext';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

const OwnerDashboard = () => {
  const popup = usePopup();
  const { data: stats, isLoading: loadingStats } = useDashboardStats();
  const today = new Date().toISOString().split('T')[0];
  const { data: recentServices = [], isLoading: loadingServices } = useCompletedServices(today);
  
  const updateService = useUpdateCompletedService();
  const deleteService = useDeleteCompletedService();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const handleStartEdit = (s: any) => {
    setEditingId(s.id);
    setEditName(s.service_name);
    setEditPrice(String(s.service_price));
  };

  const handleSaveEdit = async (id: string) => {
    try {
      // Limpa o valor para garantir que seja um número válido (remove R$, espaços, etc e troca vírgula por ponto)
      const cleanPrice = parseFloat(editPrice.replace(/[^\d,.-]/g, '').replace(',', '.'));
      
      if (isNaN(cleanPrice)) {
        popup.error('Por favor, informe um valor válido');
        return;
      }

      await updateService.mutateAsync({ 
        id, 
        service_name: editName, 
        service_price: cleanPrice
      });
      setEditingId(null);
      popup.success('Serviço atualizado!');
    } catch (err: any) {
      popup.error(err.message || 'Erro ao atualizar');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteService.mutateAsync(id);
      setDeleteTargetId(null);
      popup.success('Serviço removido!');
    } catch (err: any) {
      popup.error(err.message || 'Erro ao remover');
    }
  };

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
            <div key={s.id} className="border-b border-border/30 last:border-0">
              <AnimatePresence mode="wait">
                {editingId === s.id ? (
                  <motion.div
                    key="edit"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-3 space-y-2"
                  >
                    <div className="flex gap-2">
                      <input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        placeholder="Serviço"
                        className="flex-1 h-9 px-3 rounded-lg bg-secondary text-sm text-foreground focus:outline-none"
                      />
                      <input
                        value={editPrice}
                        onChange={e => setEditPrice(e.target.value)}
                        placeholder="R$"
                        className="w-20 h-9 px-3 rounded-lg bg-secondary text-sm text-foreground focus:outline-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSaveEdit(s.id)}
                        disabled={updateService.isPending}
                        className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-1"
                      >
                        {updateService.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Salvar
                      </motion.button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="h-9 px-4 rounded-lg bg-secondary text-sm text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ) : deleteTargetId === s.id ? (
                  <motion.div
                    key="delete"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-3 space-y-2"
                  >
                    <p className="text-xs text-foreground text-center">Excluir <strong>{s.service_name}</strong> de <strong>{s.client?.name}</strong>?</p>
                    <div className="flex gap-2">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDelete(s.id)}
                        disabled={deleteService.isPending}
                        className="flex-1 h-9 rounded-lg bg-destructive text-destructive-foreground text-sm font-bold flex items-center justify-center gap-1"
                      >
                        {deleteService.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        Confirmar
                      </motion.button>
                      <button
                        onClick={() => setDeleteTargetId(null)}
                        className="h-9 px-4 rounded-lg bg-secondary text-sm text-muted-foreground hover:text-foreground"
                      >
                        Cancelar
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-3 flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-medium text-foreground truncate">{s.client?.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{s.service_name} • {s.time}</p>
                    </div>
                    <div className="flex items-center gap-3 ml-3">
                      <p className="text-base font-mono-tabular gold-text font-bold">
                        R$ {s.service_price.toFixed(2)}
                      </p>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleStartEdit(s)}
                          className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Pencil className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                        <button 
                          onClick={() => setDeleteTargetId(s.id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default OwnerDashboard;
