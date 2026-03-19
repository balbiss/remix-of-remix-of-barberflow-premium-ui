import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Save, Edit2, Check, Smartphone, Loader2 } from 'lucide-react';
import { usePopup } from '@/contexts/PopupContext';
import { useMessageTemplates, useUpdateMessageTemplate, MessageTemplate } from '@/hooks/useMessageTemplates';
import { useBarbershop, useUpdateBarbershop } from '@/hooks/useBarbershop';

const SettingsPage = () => {
  const popup = usePopup();
  const { data: templates = [], isLoading: loadingTemplates } = useMessageTemplates();
  const updateTemplateMut = useUpdateMessageTemplate();
  const { data: barbershop, isLoading: loadingBarbershop } = useBarbershop();
  const updateBarbershopMut = useUpdateBarbershop();

  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    if (barbershop?.whatsapp_number) {
      setWhatsappNumber(barbershop.whatsapp_number);
    }
  }, [barbershop]);

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
        <p className="text-sm text-muted-foreground mb-6">WhatsApp e mensagens automáticas</p>

        {/* WhatsApp Number */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="obsidian-card mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#25D366]/20 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-[#25D366]" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-base font-bold text-foreground">WhatsApp Business</p>
              <p className="text-xs text-muted-foreground">Número para envio de mensagens</p>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
              <input
                type="tel"
                value={whatsappNumber}
                onChange={e => setWhatsappNumber(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full h-12 pl-10 pr-4 rounded-xl glass-input text-base text-foreground bg-secondary focus:outline-none"
              />
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSaveNumber}
              className="h-12 px-4 rounded-xl bg-primary text-primary-foreground flex items-center gap-1.5 text-sm font-bold"
            >
              <Save className="w-4 h-4" strokeWidth={1.5} />
              Salvar
            </motion.button>
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-muted-foreground" />
            <span>Integração real requer configuração de API (em breve)</span>
          </div>
        </motion.div>

        {/* Message Templates */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-sm uppercase tracking-ultra text-muted-foreground mb-3">
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
