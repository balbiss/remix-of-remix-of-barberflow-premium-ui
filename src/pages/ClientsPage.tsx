import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { mockClients, Client } from '@/data/mockData';
import LoyaltyCard from '@/components/LoyaltyCard';
import { Search, Phone, Star, Plus, X, UserPlus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { usePopup } from '@/contexts/PopupContext';

const ClientsPage = () => {
  const popup = usePopup();
  const [search, setSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchByPhone, setSearchByPhone] = useState(false);

  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);

  const filtered = clients.filter(c => {
    const term = search.toLowerCase();
    if (searchByPhone) {
      return c.phone.replace(/\D/g, '').includes(term.replace(/\D/g, ''));
    }
    return c.name.toLowerCase().includes(term);
  });

  const selectedClient = clients.find(c => c.id === selectedClientId);

  const openAddDrawer = () => {
    setEditingClient(null);
    setFormName('');
    setFormPhone('');
    setDrawerOpen(true);
  };

  const openEditDrawer = (client: Client) => {
    setEditingClient(client);
    setFormName(client.name);
    setFormPhone(client.phone);
    setDrawerOpen(true);
  };

  const handleSave = () => {
    if (!formName.trim() || !formPhone.trim()) {
      popup.error('Preencha nome e WhatsApp do cliente.');
      return;
    }

    if (editingClient) {
      setClients(prev =>
        prev.map(c =>
          c.id === editingClient.id
            ? { ...c, name: formName.trim(), phone: formPhone.trim() }
            : c
        )
      );
      popup.success(`${formName.trim()} atualizado com sucesso!`);
    } else {
      const newClient: Client = {
        id: `c${Date.now()}`,
        name: formName.trim(),
        phone: formPhone.trim(),
        loyaltyStamps: 0,
        totalSpent: 0,
        lastVisit: new Date().toISOString().split('T')[0],
      };
      setClients(prev => [newClient, ...prev]);
      popup.success(`${newClient.name} cadastrado com sucesso!`);
    }

    setFormName('');
    setFormPhone('');
    setEditingClient(null);
    setDrawerOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setClients(prev => prev.filter(c => c.id !== deleteTarget.id));
    if (selectedClientId === deleteTarget.id) setSelectedClientId(null);
    popup.success(`${deleteTarget.name} removido.`);
    setDeleteTarget(null);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold tracking-display text-foreground">
            Clientes
          </h1>
          <Button
            size="default"
            className="gold-gradient-btn gap-1.5 h-12 text-base"
            onClick={openAddDrawer}
          >
            <Plus className="w-5 h-5" />
            Novo
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Gerencie sua base de clientes
        </p>

        {/* Search */}
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchByPhone ? 'Buscar por WhatsApp...' : 'Buscar por nome...'}
            className="w-full h-12 pl-10 pr-12 rounded-xl glass-input text-base text-foreground placeholder:text-muted-foreground focus:outline-none bg-secondary"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Search toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => { setSearchByPhone(false); setSearch(''); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              !searchByPhone ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
            }`}
          >
            Por nome
          </button>
          <button
            onClick={() => { setSearchByPhone(true); setSearch(''); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              searchByPhone ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
            }`}
          >
            <Phone className="w-4 h-4" /> WhatsApp
          </button>
        </div>

        {/* Loyalty Card */}
        <AnimatePresence>
          {selectedClient && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <LoyaltyCard stamps={selectedClient.loyaltyStamps} clientName={selectedClient.name} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Client List */}
        <div className="space-y-2">
          {filtered.length === 0 && (
            <div className="text-center py-10">
              <p className="text-sm text-muted-foreground">Nenhum cliente encontrado</p>
              <Button
                variant="ghost"
                size="default"
                className="mt-2 text-primary text-base"
                onClick={openAddDrawer}
              >
                <UserPlus className="w-5 h-5 mr-1.5" /> Cadastrar novo cliente
              </Button>
            </div>
          )}
          {filtered.map((client, i) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`w-full obsidian-card text-left transition-all ${
                selectedClientId === client.id ? 'border-primary/50' : ''
              }`}
            >
              <button
                className="w-full text-left"
                onClick={() => setSelectedClientId(
                  selectedClientId === client.id ? null : client.id
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center">
                      <span className="text-sm font-bold gold-text">
                        {client.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="text-base font-medium text-foreground">{client.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Phone className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
                        <span className="text-sm text-muted-foreground">{client.phone}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 gold-text" strokeWidth={1.5} fill="hsl(38 92% 50%)" />
                      <span className="text-sm font-mono-tabular gold-text">{client.loyaltyStamps}/10</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      R$ {client.totalSpent.toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </button>

              <AnimatePresence>
                {selectedClientId === client.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex gap-2 mt-3 pt-3 border-t border-border"
                  >
                    <Button
                      variant="secondary"
                      size="default"
                      className="flex-1 gap-1.5 text-sm h-11"
                      onClick={(e) => { e.stopPropagation(); openEditDrawer(client); }}
                    >
                      <Pencil className="w-4 h-4" /> Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="default"
                      className="flex-1 gap-1.5 text-sm h-11"
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(client); }}
                    >
                      <Trash2 className="w-4 h-4" /> Excluir
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Add/Edit Client Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="bg-card border-border">
          <DrawerHeader>
            <DrawerTitle className="text-foreground text-xl">
              {editingClient ? 'Editar Cliente' : 'Cadastrar Cliente'}
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Nome completo</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: João Pedro"
                className="w-full h-12 px-4 rounded-xl bg-secondary text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">WhatsApp</label>
              <input
                type="tel"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full h-12 px-4 rounded-xl bg-secondary text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <DrawerFooter>
            <Button className="gold-gradient-btn w-full h-14 text-base" onClick={handleSave}>
              <UserPlus className="w-5 h-5 mr-2" />
              {editingClient ? 'Salvar Alterações' : 'Cadastrar Cliente'}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-card border-border max-w-[340px] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground text-xl">Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              <span className="font-medium text-foreground">{deleteTarget?.name}</span> será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-secondary text-foreground border-border h-12 text-base">Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground h-12 text-base" onClick={handleDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ClientsPage;
