import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Save, Edit2, Check, Smartphone, Loader2, Plus, Trash2, DollarSign, TrendingUp } from 'lucide-react';
import { usePopup } from '@/contexts/PopupContext';
import { useMessageTemplates, useUpdateMessageTemplate, MessageTemplate } from '@/hooks/useMessageTemplates';
import { useBarbershop, useUpdateBarbershop } from '@/hooks/useBarbershop';
import { useServices, useAddService, useDeleteService } from '@/hooks/useServices';
import { useWhatsApp } from '@/hooks/useWhatsApp';
import { QrCode, Wifi, WifiOff, RefreshCw, Key } from 'lucide-react';

const SettingsPage = () => {
  const popup = usePopup();
  const { data: templates = [], isLoading: loadingTemplates } = useMessageTemplates();
  const updateTemplateMut = useUpdateMessageTemplate();
  const { data: barbershop, isLoading: loadingBarbershop } = useBarbershop();
  const updateBarbershopMut = useUpdateBarbershop();
  const { data: services = [], isLoading: loadingServices } = useServices();
  const addServiceMut = useAddService();
  const deleteServiceMut = useDeleteService();

  const { status, loadingStatus, createInstance, getPairingCode, isConfigured } = useWhatsApp();
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairingPhone, setPairingPhone] = useState('');
  const [isPairing, setIsPairing] = useState(false);
  const [instanceNameInput, setInstanceNameInput] = useState('');
  const [showPhoneForm, setShowPhoneForm] = useState(false);

  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Service Form State
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');

  // Fidelity Rules State
  const [loyaltyStampsLimit, setLoyaltyStampsLimit] = useState(10);
  const [loyaltyRewardName, setLoyaltyRewardName] = useState('Corte Grátis');

  useEffect(() => {
    if (barbershop) {
      setWhatsappNumber(barbershop.whatsapp_number || '');
      setLoyaltyStampsLimit(barbershop.loyalty_stamps_limit || 10);
      setLoyaltyRewardName(barbershop.loyalty_reward_name || 'Corte Grátis');
      if (!instanceNameInput && barbershop.name) {
        setInstanceNameInput(barbershop.name.replace(/\s+/g, '_'));
      }
    }
  }, [barbershop]);

  // Auto-clear pairing state when WhatsApp connects
  useEffect(() => {
    if (status?.connected && (pairingCode || showPhoneForm)) {
      setPairingCode(null);
      setShowPhoneForm(false);
      setPairingPhone('');
    }
  }, [status?.connected]);

  const handleCreateInstance = async () => {
    if (!instanceNameInput.trim()) {
      popup.error('Informe um nome para a instância');
      return;
    }
    try {
      await createInstance.mutateAsync(instanceNameInput);
      popup.success('Instância criada! Agora você pode conectar seu WhatsApp.');
    } catch (err: any) {
      popup.error(err.message || 'Erro ao criar instância');
    }
  };

  const handleGetPairingCode = async () => {
    if (!pairingPhone.trim()) {
      popup.error('Informe o número do celular');
      return;
    }
    setIsPairing(true);
    try {
      const code = await getPairingCode.mutateAsync(pairingPhone);
      setPairingCode(code);
      popup.success('Código gerado! Digite no seu WhatsApp.');
    } catch (err: any) {
      popup.error(err.message || 'Erro ao gerar código');
    } finally {
      setIsPairing(false);
    }
  };

  const handleSaveNumber = async () => {
    if (!whatsappNumber.trim()) {
      popup.error('Informe o número do WhatsApp');
      return;
    }
    try {
      await updateBarbershopMut.mutateAsync({ whatsapp_number: whatsappNumber });
      popup.success('Número do WhatsApp salvo!');
    } catch (err: any) {
      popup.error(err.message || 'Erro ao salvar número');
    }
  };

  const handleSaveLoyalty = async () => {
    try {
      await updateBarbershopMut.mutateAsync({ 
        loyalty_stamps_limit: loyaltyStampsLimit,
        loyalty_reward_name: loyaltyRewardName
      });
      popup.success('Regras de fidelidade salvas!');
    } catch (err: any) {
      popup.error(err.message || 'Erro ao salvar regras');
    }
  };

  const handleAddService = async () => {
    if (!newServiceName.trim()) {
      popup.error('Informe o nome do serviço');
      return;
    }
    try {
      const price = newServicePrice ? parseFloat(newServicePrice.replace(',', '.')) : 0;
      await addServiceMut.mutateAsync({
        name: newServiceName,
        default_price: price,
        active: true
      });
      setNewServiceName('');
      setNewServicePrice('');
      popup.success('Serviço adicionado!');
    } catch (err: any) {
      popup.error(err.message || 'Erro ao adicionar serviço');
    }
  };

  const handleDeleteService = async (id: string) => {
    try {
      await deleteServiceMut.mutateAsync(id);
      popup.success('Serviço removido');
    } catch (err: any) {
      popup.error(err.message || 'Erro ao remover serviço');
    }
  };

  const startEditTemplate = (t: MessageTemplate) => {
    setEditingTemplate(t.id);
    setEditText(t.template);
  };

  const saveTemplate = async (id: string) => {
    try {
      await updateTemplateMut.mutateAsync({ id, template: editText });
      setEditingTemplate(null);
      popup.success('Template atualizado!');
    } catch (err: any) {
      popup.error(err.message || 'Erro ao salvar template');
    }
  };

  const toggleTemplate = async (id: string, active: boolean) => {
    try {
      await updateTemplateMut.mutateAsync({ id, active: !active });
      popup.success(active ? 'Desativado' : 'Ativado');
    } catch (err: any) {
      popup.error(err.message || 'Erro ao alterar status');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6">
        <h1 className="text-2xl font-bold tracking-display text-foreground mb-1">Configurações</h1>
        <p className="text-sm text-muted-foreground mb-6">Barbearia, WhatsApp e Mensagens</p>

        {/* WhatsApp Connection Status */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="obsidian-card mb-6 overflow-hidden relative"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                status?.connected ? 'bg-green-500/20' : 'bg-red-500/20'
              }`}>
                {status?.connected ? (
                  <Wifi className="w-5 h-5 text-green-500" strokeWidth={1.5} />
                ) : (
                  <WifiOff className="w-5 h-5 text-red-500" strokeWidth={1.5} />
                )}
              </div>
              <div>
                <p className="text-base font-bold text-foreground">Status do WhatsApp</p>
                <p className="text-xs text-muted-foreground">
                  {status?.connected ? 'Conectado e pronto' : 'Configuração pendente'}
                </p>
              </div>
            </div>
            {loadingStatus && (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {!isConfigured ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-secondary/50 border border-border/50">
                <p className="text-xs font-medium text-muted-foreground mb-3">
                  Passo 1: Nomeie sua instância
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={instanceNameInput}
                    onChange={e => setInstanceNameInput(e.target.value)}
                    placeholder="Ex: Minha_Barbearia"
                    className="flex-1 h-11 px-4 rounded-lg glass-input text-sm text-foreground bg-background focus:outline-none"
                  />
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCreateInstance}
                    disabled={createInstance.isPending}
                    className="h-11 px-4 rounded-lg bg-primary text-primary-foreground flex items-center gap-2 text-sm font-bold shadow-lg shadow-primary/20"
                  >
                    {createInstance.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Criar'
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          ) : !status?.connected ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-secondary/50 border border-border/50">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-ultra text-muted-foreground font-bold">Instância Ativa</p>
                    <p className="text-sm font-bold text-foreground">{barbershop?.whatsapp_instance_name}</p>
                  </div>
                  {!showPhoneForm && (
                     <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowPhoneForm(true)}
                      className="h-9 px-4 rounded-lg bg-primary text-primary-foreground flex items-center gap-2 text-xs font-bold"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      Conectar WhatsApp
                    </motion.button>
                  )}
                </div>
                
                {showPhoneForm && (
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
                      <Key className="w-3 h-3" />
                      Passo 2: Gerar Código de Pareamento
                    </p>
                    
                    {pairingCode ? (
                      <div className="flex flex-col items-center gap-3 py-2">
                        <div className="grid grid-cols-8 gap-1.5">
                          {pairingCode.replace('-', '').split('').map((char, i) => (
                            <div key={i} className="w-8 h-10 rounded-lg bg-background border border-primary/30 flex items-center justify-center text-xl font-bold text-primary">
                              {char}
                            </div>
                          ))}
                        </div>
                        <p className="text-[10px] text-center text-muted-foreground px-4 leading-relaxed mt-2">
                          No seu WhatsApp: <span className="text-foreground font-bold">Aparelhos Conectados</span> &gt; <span className="text-foreground font-bold">Conectar um aparelho</span> &gt; <span className="text-foreground font-bold">Conectar com número de telefone</span>.
                        </p>
                        {/* Live polling indicator */}
                        <div className="flex items-center gap-2 mt-1">
                          <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">Verificando conexão automaticamente...</span>
                        </div>
                        <button 
                          onClick={() => setPairingCode(null)}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
                        >
                          Tentar outro número
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="tel"
                          value={pairingPhone}
                          onChange={e => setPairingPhone(e.target.value)}
                          placeholder="Ex: 5511999999999"
                          className="flex-1 h-11 px-4 rounded-lg glass-input text-sm text-foreground bg-background focus:outline-none"
                        />
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={handleGetPairingCode}
                          disabled={isPairing}
                          className="h-11 px-4 rounded-lg bg-primary text-primary-foreground flex items-center gap-2 text-sm font-bold"
                        >
                          {isPairing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Parear'
                          )}
                        </motion.button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 rounded-xl bg-green-500/5 border border-green-500/20">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  {barbershop?.whatsapp_instance_name} (Ativo)
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                Online
              </p>
            </div>
          )}
        </motion.div>

        {/* Fidelity Rules */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.02 }}
          className="obsidian-card mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-orange-500" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-base font-bold text-foreground">Programa de Fidelidade</p>
              <p className="text-xs text-muted-foreground">Configurações de selos e prêmios</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-ultra text-muted-foreground font-bold ml-1">Selos para ganhar</label>
                <input
                  type="number"
                  value={loyaltyStampsLimit}
                  onChange={e => setLoyaltyStampsLimit(parseInt(e.target.value) || 0)}
                  className="w-full h-11 px-4 rounded-lg glass-input text-sm text-foreground bg-secondary focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-ultra text-muted-foreground font-bold ml-1">Nome do Prêmio</label>
                <input
                  type="text"
                  value={loyaltyRewardName}
                  onChange={e => setLoyaltyRewardName(e.target.value)}
                  placeholder="Ex: Corte Grátis"
                  className="w-full h-11 px-4 rounded-lg glass-input text-sm text-foreground bg-secondary focus:outline-none"
                />
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSaveLoyalty}
              disabled={updateBarbershopMut.isPending}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center gap-2 text-sm font-bold shadow-lg shadow-primary/20"
            >
              {updateBarbershopMut.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Salvar Regras de Fidelidade
            </motion.button>
          </div>
        </motion.div>

        {/* Services Management */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6"
        >
          <p className="text-sm uppercase tracking-ultra text-muted-foreground mb-3 font-bold">
            Serviços Prestados
          </p>
          <div className="obsidian-card space-y-4">
            <div className="flex flex-wrap gap-2">
              <div className="flex-1 min-w-[150px]">
                <input
                  value={newServiceName}
                  onChange={e => setNewServiceName(e.target.value)}
                  placeholder="Nome do serviço (ex: Corte)"
                  className="w-full h-11 px-3 rounded-lg glass-input text-sm text-foreground bg-secondary focus:outline-none"
                />
              </div>
              <div className="w-24">
                <div className="relative">
                  <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    value={newServicePrice}
                    onChange={e => setNewServicePrice(e.target.value)}
                    placeholder="0,00"
                    className="w-full h-11 pl-6 pr-2 rounded-lg glass-input text-sm text-foreground bg-secondary focus:outline-none"
                  />
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleAddService}
                className="h-11 px-4 rounded-lg bg-primary text-primary-foreground flex items-center gap-1 text-sm font-bold shadow-md shadow-primary/20 hover:brightness-110"
              >
                <Plus className="w-4 h-4" />
                Add
              </motion.button>
            </div>

            <div className="pt-2 divide-y divide-border/50">
              {loadingServices ? (
                 <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
              ) : services.length === 0 ? (
                <p className="text-xs text-center text-muted-foreground py-2 italic">Nenhum serviço cadastrado.</p>
              ) : services.map(s => (
                <div key={s.id} className="flex items-center justify-between py-2 first:pt-0">
                  <span className="text-sm font-medium text-foreground">{s.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono-tabular text-muted-foreground">R$ {s.default_price?.toFixed(2)}</span>
                    <button onClick={() => handleDeleteService(s.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Message Templates */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-sm uppercase tracking-ultra text-muted-foreground mb-3 font-bold">
            Templates de Mensagens
          </p>

          <div className="space-y-3">
            {loadingTemplates ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Carregando templates...</p>
              </div>
            ) : templates.map(t => (
              <div key={t.id} className="obsidian-card">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-base font-bold text-foreground">{t.label}</p>
                    <p className="text-xs text-muted-foreground">{t.description}</p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => toggleTemplate(t.id, t.active)}
                    className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${
                      t.active ? 'bg-primary' : 'bg-secondary'
                    }`}
                  >
                    <motion.div
                      animate={{ x: t.active ? 16 : 0 }}
                      className="w-5 h-5 rounded-full bg-foreground"
                      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    />
                  </motion.button>
                </div>

                {editingTemplate === t.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg glass-input text-sm text-foreground bg-secondary focus:outline-none resize-none"
                    />
                    <div className="flex gap-2">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => saveTemplate(t.id)}
                        className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" strokeWidth={2} />
                        Salvar
                      </motion.button>
                      <button
                        onClick={() => setEditingTemplate(null)}
                        className="h-9 px-4 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Variáveis: {'{nome}'}, {'{barbearia}'}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <p className="flex-1 text-sm text-muted-foreground leading-relaxed">{t.template}</p>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => startEditTemplate(t)}
                      className="mt-0.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Edit2 className="w-4 h-4" strokeWidth={1.5} />
                    </motion.button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsPage;
