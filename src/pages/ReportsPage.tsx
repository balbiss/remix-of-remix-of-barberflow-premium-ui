import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { weeklyRevenue, teamMembers, mockCompletedServices, mockBarbers } from '@/data/mockData';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Calendar, TrendingUp, Users, DollarSign, FileDown, ChevronDown } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const serviceBreakdown = [
  { name: 'Corte + Barba', value: 45, color: 'hsl(38 92% 50%)' },
  { name: 'Corte', value: 30, color: 'hsl(38 60% 40%)' },
  { name: 'Barba', value: 15, color: 'hsl(38 40% 30%)' },
  { name: 'Outros', value: 10, color: 'hsl(0 0% 25%)' },
];

const ReportsPage = () => {
  const { role, user } = useAuth();
  
  // Filter data based on role
  const filteredServices = role === 'barber' && user
    ? mockCompletedServices.filter(s => s.barberId === user.id)
    : mockCompletedServices;
  const filteredRevenue = role === 'barber' && user
    ? filteredServices.reduce((s, srv) => s + srv.servicePrice, 0)
    : weeklyRevenue.reduce((s, d) => s + d.value, 0);
  
  const totalWeekly = filteredRevenue;
  const totalServices = filteredServices.length;
  const [pdfFilter, setPdfFilter] = useState('all');
  const [showPdfOptions, setShowPdfOptions] = useState(false);

  const exportPDF = () => {
    const doc = new jsPDF();
    const barberName = pdfFilter === 'all'
      ? 'Todos os Barbeiros'
      : mockBarbers.find(b => b.id === pdfFilter)?.name || '';

    const filtered = pdfFilter === 'all'
      ? mockCompletedServices
      : mockCompletedServices.filter(s => s.barberId === pdfFilter);

    // Header
    doc.setFontSize(20);
    doc.text("THE GENTLEMAN'S CLUB", 14, 22);
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
        s.clientName,
        s.serviceName,
        `R$ ${s.servicePrice.toFixed(2)}`,
        s.barberName,
        s.date,
        s.time,
      ]),
      theme: 'grid',
      headStyles: { fillColor: [212, 175, 55] },
    });

    // Summary
    const totalRevenue = filtered.reduce((sum, s) => sum + s.servicePrice, 0);
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text(`Total de atendimentos: ${filtered.length}`, 14, finalY);
    doc.text(`Faturamento: R$ ${totalRevenue.toFixed(2)}`, 14, finalY + 7);

    if (pdfFilter !== 'all') {
      const barber = mockBarbers.find(b => b.id === pdfFilter);
      if (barber) {
        const commission = totalRevenue * (barber.commission / 100);
        doc.text(`Comissão (${barber.commission}%): R$ ${commission.toFixed(2)}`, 14, finalY + 14);
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
                      value={pdfFilter}
                      onChange={e => setPdfFilter(e.target.value)}
                      className="w-full h-9 px-2 rounded-lg text-sm text-foreground bg-secondary border-none focus:outline-none"
                    >
                      <option value="all">Todos os Barbeiros</option>
                      {mockBarbers.map(b => (
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
              R$ {totalWeekly.toLocaleString('pt-BR')}
            </p>
            <p className="text-xs uppercase tracking-ultra text-muted-foreground">Receita Semanal</p>
          </div>
          <div className="obsidian-card">
            <TrendingUp className="w-5 h-5 gold-text mb-2" strokeWidth={1.5} />
            <p className="text-2xl font-bold font-mono-tabular text-foreground">
              R$ {Math.round(totalWeekly / 6)}
            </p>
            <p className="text-xs uppercase tracking-ultra text-muted-foreground">Média Diária</p>
          </div>
          <div className="obsidian-card">
            <Users className="w-5 h-5 gold-text mb-2" strokeWidth={1.5} />
            <p className="text-2xl font-bold font-mono-tabular text-foreground">{totalServices}</p>
            <p className="text-xs uppercase tracking-ultra text-muted-foreground">Atendimentos</p>
          </div>
          <div className="obsidian-card">
            <DollarSign className="w-5 h-5 gold-text mb-2" strokeWidth={1.5} />
            <p className="text-2xl font-bold font-mono-tabular text-foreground">
              R$ {Math.round(totalWeekly * 0.45)}
            </p>
            <p className="text-xs uppercase tracking-ultra text-muted-foreground">Comissões</p>
          </div>
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
            <BarChart data={weeklyRevenue}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'hsl(0 0% 50%)', fontSize: 12 }} />
              <YAxis hide />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {weeklyRevenue.map((entry, i) => (
                  <Cell key={i} fill={entry.day === 'Sáb' ? 'hsl(38 92% 50%)' : 'hsl(0 0% 20%)'} />
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
            {teamMembers
              .sort((a, b) => b.todayRevenue - a.todayRevenue)
              .map((member, i) => (
                <div key={member.id} className="flex items-center gap-3">
                  <span className={`text-lg font-bold font-mono-tabular ${i === 0 ? 'gold-text' : 'text-muted-foreground'}`}>
                    {i + 1}º
                  </span>
                  <div className="flex-1">
                    <p className="text-base font-medium text-foreground">{member.name}</p>
                    <div className="w-full h-1.5 bg-secondary rounded-full mt-1 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(member.todayRevenue / teamMembers[0].todayRevenue) * 100}%` }}
                        transition={{ duration: 1, delay: 0.3 + i * 0.1 }}
                        className="h-full rounded-full"
                        style={{ background: i === 0 ? 'hsl(38 92% 50%)' : 'hsl(0 0% 30%)' }}
                      />
                    </div>
                  </div>
                  <span className="text-base font-mono-tabular font-bold text-foreground">
                    R$ {member.todayRevenue}
                  </span>
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
