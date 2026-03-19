import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { mockBarbers, Barber } from '@/data/mockData';
import { Plus, Edit2, Trash2, Phone, Mail, Percent, UserCheck, UserX } from 'lucide-react';
import { usePopup } from '@/contexts/PopupContext';
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose,
} from '@/components/ui/drawer';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const BarbersPage = () => {
  const popup = usePopup();
  const [barbers, setBarbers] = useState<Barber[]>(mockBarbers);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Barber | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCommission, setFormCommission] = useState('45');

  const openAdd = () => {
    setEditingBarber(null);
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormCommission('45');
    setDrawerOpen(true);
  };

  const openEdit = (b: Barber) => {
    setEditingBarber(b);
    setFormName(b.name);
    setFormPhone(b.phone);
    setFormEmail(b.email);
    setFormCommission(String(b.commission));
    setDrawerOpen(true);
  };

  const handleSave = () => {
    if (!formName.trim() || !formPhone.trim()) {
      popup.error('Nome e telefone são obrigatórios');
      return;
    }
    if (editingBarber) {
      setBarbers(prev => prev.map(b =>
        b.id === editingBarber.id
          ? { ...b, name: formName, phone: formPhone, email: formEmail, commission: Number(formCommission) }
          : b
      ));
      popup.success('Barbeiro atualizado!');
    } else {
      const newBarber: Barber = {
        id: `b-${Date.now()}`,
        name: formName,
        phone: formPhone,
        email: formEmail,
        commission: Number(formCommission),
        active: true,
      };
      setBarbers(prev => [...prev, newBarber]);
      popup.success('Barbeiro cadastrado!');
    }
    setDrawerOpen(false);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      setBarbers(prev => prev.filter(b => b.id !== deleteTarget.id));
      popup.success('Barbeiro removido');
      setDeleteTarget(null);
    }
  };

  const toggleActive = (id: string) => {
    setBarbers(prev => prev.map(b =>
      b.id === id ? { ...b, active: !b.active } : b
    ));
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-display text-foreground">Equipe</h1>
            <p className="text-sm text-muted-foreground">Gerencie seus barbeiros e comissões</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={openAdd}
            className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center"
          >
            <Plus className="w-5 h-5 text-primary-foreground" strokeWidth={2} />
          </motion.button>
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {barbers.map((barber) => (
              <motion.div
                key={barber.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className={`obsidian-card ${!barber.active ? 'opacity-50' : ''}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-bold text-foreground">{barber.name}</p>
                      {barber.active ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">Ativo</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/20 text-destructive">Inativo</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" strokeWidth={1.5} />{barber.phone}</span>
                    </div>
                    {barber.email && (
                      <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                        <Mail className="w-3.5 h-3.5" strokeWidth={1.5} />{barber.email}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 gold-text">
                      <Percent className="w-4 h-4" strokeWidth={1.5} />
                      <span className="text-2xl font-bold font-mono-tabular">{barber.commission}</span>
                    </div>
                    <p className="text-xs uppercase tracking-ultra text-muted-foreground">Comissão</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-border">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleActive(barber.id)}
                    className="flex-1 h-9 rounded-lg flex items-center justify-center gap-1.5 text-sm bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {barber.active ? <UserX className="w-4 h-4" strokeWidth={1.5} /> : <UserCheck className="w-4 h-4" strokeWidth={1.5} />}
                    {barber.active ? 'Desativar' : 'Ativar'}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => openEdit(barber)}
                    className="flex-1 h-9 rounded-lg flex items-center justify-center gap-1.5 text-sm bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Edit2 className="w-4 h-4" strokeWidth={1.5} />
                    Editar
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setDeleteTarget(barber)}
                    className="h-9 w-9 rounded-lg flex items-center justify-center bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Add/Edit Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{editingBarber ? 'Editar Barbeiro' : 'Novo Barbeiro'}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm uppercase tracking-ultra text-muted-foreground">Nome *</label>
              <input
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="Nome do barbeiro"
                className="w-full h-12 px-4 rounded-xl glass-input text-base text-foreground bg-secondary focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm uppercase tracking-ultra text-muted-foreground">Telefone *</label>
              <input
                value={formPhone}
                onChange={e => setFormPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full h-12 px-4 rounded-xl glass-input text-base text-foreground bg-secondary focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm uppercase tracking-ultra text-muted-foreground">Email</label>
              <input
                value={formEmail}
                onChange={e => setFormEmail(e.target.value)}
                placeholder="email@exemplo.com"
                className="w-full h-12 px-4 rounded-xl glass-input text-base text-foreground bg-secondary focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm uppercase tracking-ultra text-muted-foreground">Comissão (%)</label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={formCommission}
                  onChange={e => setFormCommission(e.target.value)}
                  className="w-full h-12 px-4 pr-10 rounded-xl glass-input text-base text-foreground font-mono-tabular bg-secondary focus:outline-none"
                />
                <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
              </div>
            </div>
          </div>
          <DrawerFooter>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              className="w-full h-14 rounded-xl gold-gradient-btn text-base"
            >
              {editingBarber ? 'Salvar Alterações' : 'Cadastrar Barbeiro'}
            </motion.button>
            <DrawerClose asChild>
              <button className="w-full h-12 rounded-xl text-base text-muted-foreground hover:text-foreground transition-colors">
                Cancelar
              </button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover barbeiro?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{deleteTarget?.name}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BarbersPage;
