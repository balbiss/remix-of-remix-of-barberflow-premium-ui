import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Crown, 
  Search, 
  Filter, 
  ShieldAlert, 
  Calendar, 
  ExternalLink,
  ChevronRight,
  Monitor,
  CheckCircle2,
  XCircle,
  Plus,
  BarChart3,
  LogOut,
  ArrowLeft,
  Mail,
  ShieldCheck,
  Ban,
  Clock,
  MoreVertical,
  Zap
} from 'lucide-react';
import { useSaaSAdmin, AdminBarbershop } from '@/hooks/useSaaSAdmin';
import { Button } from '@/components/ui/button';
import { usePopup } from '@/contexts/PopupContext';
import { format, addDays, parseISO, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const SaaSAdminDashboard = () => {
  const navigate = useNavigate();
  const popup = usePopup();
  const { user } = useAuth();
  const { shops, isLoading, updateStatus } = useSaaSAdmin();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'blocked' | 'expired'>('all');
  const [selectedShop, setSelectedShop] = useState<AdminBarbershop | null>(null);
  const [showActionModal, setShowActionModal] = useState<boolean>(false);

  // Statistics - Exclude SuperAdmin's own shop to avoid confusion
  const statsShops = shops.filter(s => s.owner_email !== user?.email);
  const stats = {
    total: statsShops.length,
    active: statsShops.filter(s => s.subscription_status === 'active' || s.subscription_status === 'premium').length,
    blocked: statsShops.filter(s => s.subscription_status === 'blocked').length,
    expired: statsShops.filter(s => s.subscription_expiry && !isAfter(parseISO(s.subscription_expiry), new Date())).length,
    mrr: statsShops.reduce((acc, s) => {
        // Updated MRR estimate: R$ 67,90 per active shop
        return (s.subscription_status === 'active' || s.subscription_status === 'premium') ? acc + 67.9 : acc;
    }, 0)
  };

  const filteredShops = shops.filter(s => {
    // 1. Exclude superadmin's own shop from the list
    if (s.owner_email === user?.email) return false;

    // 2. Search filter
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                          s.owner_email?.toLowerCase().includes(search.toLowerCase());
    
    if (!matchesSearch) return false;
    
    // 3. Status filters
    if (filter === 'all') return true;
    if (filter === 'active') return (s.subscription_status === 'active' || s.subscription_status === 'premium');
    if (filter === 'blocked') return s.subscription_status === 'blocked';
    if (filter === 'expired') return s.subscription_expiry && !isAfter(parseISO(s.subscription_expiry), new Date());
    
    return true;
  });

  const handleAction = async (id: string, action: 'activate' | 'block' | 'unblock') => {
    try {
      if (action === 'activate') {
        const newExpiry = addDays(new Date(), 30).toISOString();
        await updateStatus({ id, status: 'active', expiry: newExpiry });
        popup.success('Plano ativado por 30 dias!');
      } else if (action === 'block') {
        await updateStatus({ id, status: 'blocked' });
        popup.success('Barbearia bloqueada com sucesso!');
      } else if (action === 'unblock') {
        await updateStatus({ id, status: 'active' });
        popup.success('Acesso restaurado com sucesso!');
      }
      setShowActionModal(false);
      setSelectedShop(null);
    } catch (err) {
      popup.error('Erro ao processar ação');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full glass-header px-4 py-4 border-b border-border/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
                onClick={() => navigate('/dashboard')}
                className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                SaaS Admin <ShieldCheck className="w-5 h-5 gold-text" />
              </h1>
              <p className="text-xs text-muted-foreground">Painel de Gerenciamento Geral</p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full gold-gradient-btn flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary-foreground" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 text-left">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="obsidian-card p-4 space-y-2 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <Users className="w-10 h-10" />
            </div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total de Lojas</p>
            <h3 className="text-3xl font-bold tracking-display">{stats.total}</h3>
            <div className="flex items-center gap-1.5 text-[10px] text-green-500 font-medium">
              <Plus className="w-3 h-3" /> Crescendo
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="obsidian-card p-4 space-y-2 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <Zap className="w-10 h-10" />
            </div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Ativos / Premium</p>
            <h3 className="text-3xl font-bold text-primary tracking-display">{stats.active}</h3>
            <div className="flex items-center gap-1.5 text-[10px] text-primary font-medium">
              {((stats.active / stats.total) * 100).toFixed(1)}% de conversão
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="obsidian-card p-4 space-y-2 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-3 opacity-10 text-red-500">
              <ShieldAlert className="w-10 h-10" />
            </div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Bloqueados / Vencidos</p>
            <h3 className="text-3xl font-bold text-red-500 tracking-display">{stats.blocked + stats.expired}</h3>
            <div className="flex items-center gap-1.5 text-[10px] text-red-500/70 font-medium">
              Atenção necessária
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="obsidian-card p-4 space-y-2 relative overflow-hidden border-primary/20"
          >
            <div className="absolute top-0 right-0 p-3 opacity-10 text-primary">
              <Crown className="w-10 h-10" />
            </div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">MRR Estimado</p>
            <h3 className="text-3xl font-bold gold-text tracking-display">R$ {stats.mrr.toLocaleString('pt-BR')}</h3>
            <div className="flex items-center gap-1.5 text-[10px] text-gold-text font-medium">
              Baseado em R$ 67,90/loja
            </div>
          </motion.div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 pl-10 pr-4 rounded-xl bg-secondary border-none focus:ring-1 focus:ring-primary text-foreground"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {(['all', 'active', 'blocked', 'expired'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 h-12 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  filter === f 
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                    : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                }`}
              >
                {f === 'all' && 'Todos'}
                {f === 'active' && 'Ativos'}
                {f === 'blocked' && 'Bloqueados'}
                {f === 'expired' && 'Vencidos'}
              </button>
            ))}
          </div>
        </div>

        {/* Barbershop List */}
        <div className="space-y-3 pb-8">
          {filteredShops.length === 0 ? (
            <div className="text-center py-20 obsidian-card">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground">Nenhuma barbearia encontrada.</p>
            </div>
          ) : (
            filteredShops.map((shop, i) => {
              const isActive = shop.subscription_status === 'active' || shop.subscription_status === 'premium';
              const isBlocked = shop.subscription_status === 'blocked';
              const isExpired = shop.subscription_expiry && !isAfter(parseISO(shop.subscription_expiry), new Date());
              
              return (
                <motion.div
                  key={shop.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`obsidian-card overflow-hidden transition-all text-left ${
                    selectedShop?.id === shop.id ? 'border-primary' : ''
                  }`}
                >
                  <div className="flex items-center justify-between p-4 group">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                        isBlocked ? 'bg-red-500/10' : isActive ? 'bg-primary/10' : 'bg-secondary'
                      }`}>
                         <Monitor className={`w-6 h-6 ${
                           isBlocked ? 'text-red-500' : isActive ? 'text-primary' : 'text-muted-foreground'
                         }`} />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground text-lg group-hover:text-primary transition-colors">
                          {shop.name}
                        </h4>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Mail className="w-3 h-3" /> {shop.owner_email || 'E-mail não disponível'}
                          </div>
                          <div className="flex items-center gap-3 mt-1.5">
                             <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                               isBlocked ? 'bg-red-500/10 text-red-500' : isActive ? 'bg-green-500/10 text-green-500' : 'bg-secondary text-muted-foreground'
                             }`}>
                                {isBlocked ? 'Bloqueado' : isActive ? 'Ativo' : 'Trial/Pendente'}
                             </div>
                             {shop.subscription_expiry && (
                               <div className={`flex items-center gap-1 text-[10px] font-medium ${isExpired && !isBlocked ? 'text-orange-500' : 'text-muted-foreground'}`}>
                                 <Clock className="w-3 h-3" /> 
                                 Até {format(parseISO(shop.subscription_expiry), "dd/MM/yyyy", { locale: ptBR })}
                               </div>
                             )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                         variant="ghost"
                         size="icon"
                         className="h-10 w-10 text-muted-foreground hover:text-primary"
                         onClick={() => {
                           setSelectedShop(shop);
                           setShowActionModal(true);
                         }}
                      >
                         <MoreVertical className="w-5 h-5" />
                      </Button>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </main>

      {/* Action Modal */}
      <AnimatePresence>
        {showActionModal && selectedShop && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowActionModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm obsidian-card p-6 overflow-hidden border-border/50"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Monitor className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedShop.name}</h3>
                  <p className="text-sm text-muted-foreground">Gerenciar Conta</p>
                </div>
              </div>

              <div className="space-y-3">
                <Button 
                   className="w-full h-12 gold-gradient-btn gap-2"
                   onClick={() => handleAction(selectedShop.id, 'activate')}
                >
                  <Zap className="w-5 h-5" /> Ativar Plano (+30 dias)
                </Button>
                
                {selectedShop.subscription_status === 'blocked' ? (
                  <Button 
                    variant="outline"
                    className="w-full h-12 border-green-500/50 text-green-500 hover:bg-green-500/10 gap-2"
                    onClick={() => handleAction(selectedShop.id, 'unblock')}
                  >
                    <CheckCircle2 className="w-5 h-5" /> Desbloquear Acesso
                  </Button>
                ) : (
                  <Button 
                    variant="outline"
                    className="w-full h-12 border-red-500/50 text-red-500 hover:bg-red-500/10 gap-2"
                    onClick={() => handleAction(selectedShop.id, 'block')}
                  >
                    <Ban className="w-5 h-5" /> Bloquear Barbearia
                  </Button>
                )}

                <Button 
                  variant="ghost" 
                  className="w-full h-12"
                  onClick={() => setShowActionModal(false)}
                >
                  Cancelar
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SaaSAdminDashboard;
