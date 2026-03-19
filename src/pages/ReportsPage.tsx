import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useCompletedServices, useUpdateCompletedService, useDeleteCompletedService } from '@/hooks/useCompletedServices';
import { useBarbers } from '@/hooks/useBarbers';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Calendar, TrendingUp, Users, DollarSign, FileDown, Loader2, Pencil, Trash2, Check, X } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { usePopup } from '@/contexts/PopupContext';

const ReportsPage = () => {
  const { role, user } = useAuth();
  const popup = usePopup();
  const { data: allServices = [], isLoading: loadingServices } = useCompletedServices();
  const { data: barbers = [], isLoading: loadingBarbers } = useBarbers();
  const updateService = useUpdateCompletedService();
  const deleteService = useDeleteCompletedService();
  
  const [pdfFilter, setPdfFilter] = useState('all');
  const [showPdfOptions, setShowPdfOptions] = useState(false);
  const [barberFilter, setBarberFilter] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Filter data based on role
  const services = role === 'barber' && user?.barberId
    ? allServices.filter(s => s.barber_id === user.barberId)
    : barberFilter === 'all' ? allServices : allServices.filter(s => s.barber_id === barberFilter);

  const handleStartEdit = (s: any) => {
    setEditingId(s.id);
    setEditName(s.service_name);
    setEditPrice(String(s.service_price));
  };

  const handleSaveEdit = async (id: string) => {
    try {
      await updateService.mutateAsync({ 
        id, 
        service_name: editName, 
        service_price: parseFloat(editPrice.replace(',', '.')) 
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

  const totalRevenue = services.reduce((sum, s) => sum + s.service_price, 0);
  const totalAtendimentos = services.length;
  const avgDaily = totalAtendimentos > 0 ? totalRevenue / 7 : 0; // Simple weekly average

  // Group by day for chart
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const dailyData = days.map(day => {
    const value = services
      .filter(s => {
        const date = new Date(s.date);
        return days[date.getUTCDay()] === day;
      })
      .reduce((sum, s) => sum + s.service_price, 0);
    return { day, value };
  });

  // Simple service breakdown (top 4)
  const serviceCounts = services.reduce((acc: any, s) => {
    acc[s.service_name] = (acc[s.service_name] || 0) + 1;
    return acc;
  }, {});

  const serviceBreakdown = Object.entries(serviceCounts)
    .map(([name, count]: [string, any]) => ({
      name,
      value: Math.round((count / totalAtendimentos) * 100),
      color: `hsl(38 92% ${Math.max(20, 50 - (Object.keys(serviceCounts).indexOf(name) * 10))}%)`
    }))
    .slice(0, 4);

  const exportPDF = () => {
    const doc = new jsPDF();
    const barberName = pdfFilter === 'all'
      ? 'Todos os Barbeiros'
      : barbers.find(b => b.id === pdfFilter)?.name || '';

    const filtered = pdfFilter === 'all'
      ? allServices
      : allServices.filter(s => s.barber_id === pdfFilter);

    // Header
    doc.setFontSize(20);
    doc.text(user?.barbershopName?.toUpperCase() || "BARBEARIA", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Relatório — ${barberName}`, 14, 30);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 36);

    // Services table
    doc.setFontSize(13);
    doc.setTextColor(0);
    doc.text('Atendimentos', 14, 48);

    autoTable(doc, {
      startY: 52,
      head: [['Cliente', 'Serviço', 'Valor', 'Barbeiro', 'Data', 'Hora']],
      body: filtered.map(s => [
        s.client?.name || 'N/A',
        s.service_name,
        `R$ ${s.service_price.toFixed(2)}`,
        s.barber?.name || 'N/A',
        s.date,
        s.time,
      ]),
      theme: 'grid',
      headStyles: { fillColor: [212, 175, 55] },
    });

    // Summary
    const rev = filtered.reduce((sum, s) => sum + s.service_price, 0);
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text(`Total de atendimentos: ${filtered.length}`, 14, finalY);
    doc.text(`Faturamento: R$ ${rev.toFixed(2)}`, 14, finalY + 7);

    if (pdfFilter !== 'all') {
      const barber = barbers.find(b => b.id === pdfFilter);
      if (barber) {
        const commissionVal = rev * (barber.commission || 0.45);
        doc.text(`Comissão (${((barber.commission || 0.45) * 100).toFixed(0)}%): R$ ${commissionVal.toFixed(2)}`, 14, finalY + 14);
      }
    }

    doc.save(`relatorio-${pdfFilter === 'all' ? 'geral' : barberName.toLowerCase().replace(/\s/g, '-')}.pdf`);
    setShowPdfOptions(false);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold tracking-display text-foreground">Relatórios</h1>
              <p className="text-sm text-muted-foreground">Visão geral do desempenho</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground">
              <Calendar className="w-4 h-4" strokeWidth={1.5} />
              Esta Semana
            </div>
            {role === 'owner' && (
            <div className="relative">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowPdfOptions(!showPdfOptions)}
                className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center"
              >
                <FileDown className="w-5 h-5 text-primary-foreground" strokeWidth={1.5} />
              </motion.button>

              {showPdfOptions && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-card shadow-xl overflow-hidden z-20"
                >
                  <div className="p-3 border-b border-border">
                    <p className="text-xs uppercase tracking-ultra text-muted-foreground mb-2">Filtrar por</p>
                    <select
                      disabled={loadingBarbers}
                      value={pdfFilter}
                      onChange={e => setPdfFilter(e.target.value)}
                      className="w-full h-9 px-2 rounded-lg text-sm text-foreground bg-secondary border-none focus:outline-none"
                    >
                      <option value="all">Todos os Barbeiros</option>
                      {barbers.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={exportPDF}
                    className="w-full px-4 py-3 text-left text-sm text-foreground hover:bg-secondary transition-colors flex items-center gap-2"
                  >
                    <FileDown className="w-4 h-4 gold-text" strokeWidth={1.5} />
                    Exportar PDF
                  </button>
                  <button
                    onClick={() => setShowPdfOptions(false)}
                    className="w-full px-4 py-2 text-left text-xs text-muted-foreground hover:bg-secondary transition-colors"
                  >
                    Cancelar
                  </button>
                </motion.div>
              )}
            </div>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-3 mb-6"
        >
          <div className="obsidian-card">
            <DollarSign className="w-5 h-5 gold-text mb-2" strokeWidth={1.5} />
            <p className="text-2xl font-bold font-mono-tabular text-foreground">
              R$ {totalRevenue.toLocaleString('pt-BR')}
            </p>
            <p className="text-xs uppercase tracking-ultra text-muted-foreground">Receita Total</p>
          </div>
          <div className="obsidian-card">
            <TrendingUp className="w-5 h-5 gold-text mb-2" strokeWidth={1.5} />
            <p className="text-2xl font-bold font-mono-tabular text-foreground">
              R$ {Math.round(avgDaily)}
            </p>
            <p className="text-xs uppercase tracking-ultra text-muted-foreground">Média Diária</p>
          </div>
          <div className="obsidian-card">
            <Users className="w-5 h-5 gold-text mb-2" strokeWidth={1.5} />
            <p className="text-2xl font-bold font-mono-tabular text-foreground">{totalAtendimentos}</p>
            <p className="text-xs uppercase tracking-ultra text-muted-foreground">Atendimentos</p>
          </div>
          {role === 'owner' && (
          <div className="obsidian-card">
            <DollarSign className="w-5 h-5 gold-text mb-2" strokeWidth={1.5} />
            <p className="text-2xl font-bold font-mono-tabular text-foreground">
              R$ {Math.round(totalRevenue * 0.45)}
            </p>
            <p className="text-xs uppercase tracking-ultra text-muted-foreground">Estimativa Comissões</p>
          </div>
          )}
        </motion.div>

        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="obsidian-card mb-6"
        >
          <p className="text-sm uppercase tracking-ultra text-muted-foreground mb-4">
            Faturamento por Dia
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={dailyData}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'hsl(0 0% 50%)', fontSize: 12 }} />
              <YAxis hide />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {dailyData.map((entry, i) => (
                  <Cell key={i} fill={i === new Date().getUTCDay() ? 'hsl(38 92% 50%)' : 'hsl(0 0% 20%)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Service Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="obsidian-card mb-6"
        >
          <p className="text-sm uppercase tracking-ultra text-muted-foreground mb-4">
            Serviços Mais Realizados
          </p>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={100} height={100}>
              <PieChart>
                <Pie
                  data={serviceBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={45}
                  dataKey="value"
                  stroke="none"
                >
                  {serviceBreakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {serviceBreakdown.map((s) => (
                <div key={s.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                    <span className="text-sm text-foreground">{s.name}</span>
                  </div>
                  <span className="text-sm font-mono-tabular text-muted-foreground">{s.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Team Ranking */}
        {role === 'owner' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="obsidian-card"
        >
          <p className="text-sm uppercase tracking-ultra text-muted-foreground mb-4">
            Ranking da Equipe
          </p>
          <div className="space-y-3">
            {loadingBarbers || loadingServices ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : barbers
              .map(b => ({
                ...b,
                revenue: allServices
                  .filter(s => s.barber_id === b.id)
                  .reduce((sum, s) => sum + s.service_price, 0)
              }))
              .sort((a, b) => b.revenue - a.revenue)
              .map((member, i, arr) => (
                <div key={member.id} className="flex items-center gap-3">
                  <span className={`text-lg font-bold font-mono-tabular ${i === 0 ? 'gold-text' : 'text-muted-foreground'}`}>
                    {i + 1}º
                  </span>
                  <div className="flex-1">
                    <p className="text-base font-medium text-foreground">{member.name}</p>
                    <div className="w-full h-1.5 bg-secondary rounded-full mt-1 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${arr[0].revenue > 0 ? (member.revenue / arr[0].revenue) * 100 : 0}%` }}
                        transition={{ duration: 1, delay: 0.3 + i * 0.1 }}
                        className="h-full rounded-full"
                        style={{ background: i === 0 ? 'hsl(38 92% 50%)' : 'hsl(0 0% 30%)' }}
                      />
                    </div>
                  </div>
                  <span className="text-base font-mono-tabular font-bold text-foreground">
                    R$ {member.revenue.toFixed(2)}
                  </span>
                </div>
              ))}
          </div>
        </motion.div>
        )}

        {/* Services List - Owner only */}
        {role === 'owner' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="obsidian-card mt-6"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm uppercase tracking-ultra text-muted-foreground font-bold">Atendimentos</p>
            <select
              value={barberFilter}
              onChange={e => setBarberFilter(e.target.value)}
              className="h-8 px-2 rounded-lg text-xs text-foreground bg-secondary border-none focus:outline-none"
            >
              <option value="all">Todos</option>
              {barbers.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-0 divide-y divide-border/40">
            {loadingServices ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : services.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum atendimento encontrado</p>
            ) : services.map(s => (
              <div key={s.id}>
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
                          placeholder="Nome do serviço"
                          className="flex-1 h-9 px-3 rounded-lg bg-secondary text-sm text-foreground focus:outline-none"
                        />
                        <input
                          value={editPrice}
                          onChange={e => setEditPrice(e.target.value)}
                          placeholder="Preço"
                          className="w-24 h-9 px-3 rounded-lg bg-secondary text-sm text-foreground focus:outline-none"
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
                          Cancelar
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
                      <p className="text-sm text-foreground">Excluir <strong>{s.service_name}</strong> de <strong>{s.client?.name}</strong>?</p>
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
                        <p className="text-sm font-medium text-foreground truncate">{s.service_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.client?.name || 'Cliente'} · {s.barber?.name || 'Barbeiro'} · {s.date}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 ml-3">
                        <span className="text-sm font-mono-tabular font-bold gold-text">R$ {Number(s.service_price).toFixed(2)}</span>
                        <button onClick={() => handleStartEdit(s)} className="text-muted-foreground hover:text-foreground transition-colors">
                          <Pencil className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                        <button onClick={() => setDeleteTargetId(s.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </motion.div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
