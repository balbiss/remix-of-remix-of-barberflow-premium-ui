import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useServices } from '@/hooks/useServices';
import { useClients } from '@/hooks/useClients';
import { useAddCompletedService } from '@/hooks/useCompletedServices';
import PinValidation from '@/components/PinValidation';
import { Check, ChevronDown, Loader2 } from 'lucide-react';
import { usePopup } from '@/contexts/PopupContext';
import { whatsappService } from '@/lib/whatsappService';

const generatePin = () => Math.floor(100000 + Math.random() * 900000).toString();

const formatCurrency = (value: string | number) => {
  if (typeof value === 'number') {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  const numbers = value.replace(/\D/g, '');
  const amount = parseInt(numbers || '0', 10) / 100;
  return amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const parseCurrency = (value: string) => {
  const numbers = value.replace(/\D/g, '');
  return parseInt(numbers || '0', 10) / 100;
};

const RegisterPage = () => {
  const { user } = useAuth();
  const popup = usePopup();
  const { data: clients = [], isLoading: loadingClients } = useClients();
  const { data: services = [], isLoading: loadingServices } = useServices();
  const addCompletedService = useAddCompletedService();

  const [selectedClient, setSelectedClient] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [serviceValue, setServiceValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [wasSentViaWhatsApp, setWasSentViaWhatsApp] = useState(false);
  const [completedList, setCompletedList] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredSuggestions = services.filter(s =>
    s.name.toLowerCase().includes(serviceName.toLowerCase()) && serviceName.length > 0
  );

  const handleFinalize = async () => {
    if (!selectedClient || !serviceName || parseCurrency(serviceValue) <= 0) {
      popup.error('Preencha cliente, serviço e valor');
      return;
    }

    if (!user?.barbershopId) {
      popup.error('Barbearia não identificada');
      return;
    }

    setIsSendingCode(true);
    const newPin = generatePin();
    setPin(newPin);

    // Try to send via WhatsApp
    const result = await whatsappService.sendValidationCode(
      user.barbershopId,
      selectedClient,
      newPin
    );

    if (result.success) {
      setWasSentViaWhatsApp(true);
      popup.success('Código enviado para o WhatsApp do cliente!');
    } else {
      setWasSentViaWhatsApp(false);
      popup.info(result.error || 'Não foi possível enviar via WhatsApp. Use o código da tela.');
    }

    setShowPin(true);
    setIsSendingCode(false);
  };

  const handleValidated = async () => {
    const client = clients.find(c => c.id === selectedClient)!;
    const price = parseCurrency(serviceValue);
    
    try {
      const result = await addCompletedService.mutateAsync({
        client_id: selectedClient,
        service_name: serviceName,
        service_price: price,
        barber_id: user?.barberId || null,
        loyalty_points: 1,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        validated: true,
      });

      const newEntry = {
        id: result.id,
        clientName: client.name,
        serviceName,
        servicePrice: price,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };

      setCompletedList(prev => [newEntry, ...prev]);
      setShowPin(false);
      setSelectedClient('');
      setServiceName('');
      setServiceValue('');
      popup.success('Atendimento validado com sucesso!');
    } catch (err: any) {
      popup.error(err.message || 'Erro ao salvar atendimento');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6">
        <h1 className="text-2xl font-bold tracking-display text-foreground mb-1">
          Registrar Atendimento
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Informe o cliente, serviço e valor cobrado
        </p>

        <div className="space-y-4 mb-6">
          {/* Client Select */}
          <div className="space-y-2">
            <label className="text-sm uppercase tracking-ultra text-muted-foreground">Cliente</label>
            <div className="relative">
              <select
                disabled={loadingClients}
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full h-12 px-4 pr-10 rounded-xl glass-input text-base text-foreground appearance-none focus:outline-none bg-secondary disabled:opacity-50"
              >
                <option value="" className="bg-background text-muted-foreground">
                  {loadingClients ? 'Carregando clientes...' : 'Selecione um cliente...'}
                </option>
                {clients.map(c => (
                  <option key={c.id} value={c.id} className="bg-background text-foreground">{c.name}</option>
                ))}
              </select>
              {loadingClients ? (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
              ) : (
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" strokeWidth={1.5} />
              )}
            </div>
          </div>

          {/* Service Name (free text + autocomplete) */}
          <div className="space-y-2 relative">
            <label className="text-sm uppercase tracking-ultra text-muted-foreground">Serviço</label>
            <input
              ref={inputRef}
              type="text"
              value={serviceName}
              onChange={(e) => {
                setServiceName(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Ex: Corte, Barba, Pigmentação..."
              className="w-full h-12 px-4 rounded-xl glass-input text-base text-foreground focus:outline-none bg-secondary"
            />
            <AnimatePresence>
              {showSuggestions && filteredSuggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute z-10 left-0 right-0 top-full mt-1 rounded-xl border border-border bg-card overflow-hidden shadow-xl"
                >
                  {filteredSuggestions.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setServiceName(s.name);
                        if (s.default_price) {
                          setServiceValue(formatCurrency(s.default_price));
                        }
                        setShowSuggestions(false);
                      }}
                      className="w-full px-4 py-3 text-left text-base text-foreground hover:bg-secondary transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <span>{s.name}</span>
                        {s.default_price && (
                          <span className="text-xs text-muted-foreground group-hover:gold-text transition-colors">
                            Sugestão: R$ {formatCurrency(s.default_price)}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Service Value (manual currency input) */}
          <div className="space-y-2">
            <label className="text-sm uppercase tracking-ultra text-muted-foreground">Valor (R$)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-base">R$</span>
              <input
                type="text"
                inputMode="numeric"
                value={serviceValue}
                onChange={(e) => setServiceValue(formatCurrency(e.target.value))}
                placeholder="0,00"
                className="w-full h-12 pl-12 pr-4 rounded-xl glass-input text-base text-foreground font-mono-tabular focus:outline-none bg-secondary"
              />
            </div>
          </div>
        </div>

        {/* Finalize Button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleFinalize}
          disabled={isSendingCode}
          className="w-full h-14 rounded-xl gold-gradient-btn text-base flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSendingCode ? (
             <>
               <Loader2 className="w-5 h-5 animate-spin" />
               Aguarde...
             </>
          ) : (
            'Finalizar Atendimento'
          )}
        </motion.button>

        {/* Completed Today */}
        {completedList.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <p className="text-sm uppercase tracking-ultra text-muted-foreground mb-3">
              Concluídos Hoje ({completedList.length})
            </p>
            <div className="space-y-2">
              {completedList.map(s => (
                <div key={s.id} className="obsidian-card flex items-center justify-between">
                  <div>
                    <p className="text-base font-medium text-foreground">{s.clientName}</p>
                    <p className="text-sm text-muted-foreground">{s.serviceName} • {s.time}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-mono-tabular gold-text font-bold">
                      R$ {s.servicePrice.toFixed(2)}
                    </span>
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={2.5} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <PinValidation
        open={showPin}
        pin={pin}
        clientName={clients.find(c => c.id === selectedClient)?.name}
        wasSentViaWhatsApp={wasSentViaWhatsApp}
        onSuccess={handleValidated}
        onClose={() => setShowPin(false)}
      />
    </div>
  );
};

export default RegisterPage;
