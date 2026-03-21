import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useServices } from '@/hooks/useServices';
import { useClients, useAddClient } from '@/hooks/useClients';
import { useAddCompletedService } from '@/hooks/useCompletedServices';
import { useBarbershop } from '@/hooks/useBarbershop';
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
  const addClient = useAddClient();
  const { data: services = [], isLoading: loadingServices } = useServices();
  const addCompletedService = useAddCompletedService();
  const { data: barbershop } = useBarbershop();

  const [clientPhone, setClientPhone] = useState('');
  const [clientName, setClientName] = useState('');
  const [selectedClient, setSelectedClient] = useState(''); // Holds ID if existing client matches
  const [serviceName, setServiceName] = useState('');
  const [serviceValue, setServiceValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [wasSentViaWhatsApp, setWasSentViaWhatsApp] = useState(false);
  const [completedList, setCompletedList] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatPhone = (val: string) => {
    let numbers = val.replace(/\D/g, '');
    if (numbers.length > 11) numbers = numbers.slice(0, 11);
    
    if (numbers.length === 0) return '';
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setClientPhone(formatted);
    
    // Check if this phone belongs to a registered client
    const existing = clients.find(c => c.phone === formatted);
    if (existing) {
      setClientName(existing.name);
      setSelectedClient(existing.id);
    } else {
      setClientName('');
      setSelectedClient('');
    }
  };

  const filteredSuggestions = services.filter(s =>
    s.name.toLowerCase().includes(serviceName.toLowerCase()) && serviceName.length > 0
  );

  const handleFinalize = async () => {
    if (!clientPhone || !clientName || !serviceName || parseCurrency(serviceValue) <= 0) {
      popup.error('Preencha os dados do cliente, serviço e valor');
      return;
    }

    if (!user?.barbershopId) {
      popup.error('Barbearia não identificada');
      return;
    }

    setIsSendingCode(true);
    let currentClientId = selectedClient;

    try {
      if (!currentClientId) {
        // Automatically create client
        const newClient = await addClient.mutateAsync({
          name: clientName.trim(),
          phone: clientPhone,
          loyalty_stamps: 0,
          total_spent: 0,
          last_visit: new Date().toISOString()
        });
        currentClientId = newClient.id;
        setSelectedClient(currentClientId); // Sync state forward
      }
    } catch (err: any) {
      popup.error(err.message || 'Erro ao cadastrar novo cliente automaticamente.');
      setIsSendingCode(false);
      return;
    }

    const newPin = generatePin();
    setPin(newPin);

    // Try to send via WhatsApp
    const result = await whatsappService.sendValidationCode(
      user.barbershopId,
      currentClientId,
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
    // If the client was newly created during Finalize, selectedClient now has their ID!
    const client = clients.find(c => c.id === selectedClient) || { name: clientName };
    const price = parseCurrency(serviceValue);
    const minVal = barbershop?.loyalty_min_value || 0;
    const points = price >= minVal ? 1 : 0;
    
    try {
      const result = await addCompletedService.mutateAsync({
        client_id: selectedClient,
        service_name: serviceName,
        service_price: price,
        barber_id: user?.barberId || null,
        loyalty_points: points,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        validated: true,
      });

      const newEntry = {
        id: result.id,
        clientName: clientName,
        serviceName,
        servicePrice: price,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };

      setCompletedList(prev => [newEntry, ...prev]);
      setShowPin(false);
      setClientPhone('');
      setClientName('');
      setSelectedClient('');
      setServiceName('');
      setServiceValue('');
      popup.success('Atendimento validado com sucesso!');
    } catch (err: any) {
      popup.error(err.message || 'Erro ao salvar atendimento');
    }
  };

  const handleRegisterWithoutPoints = async () => {
    if (!clientPhone || !clientName || !serviceName || parseCurrency(serviceValue) <= 0) {
      popup.error('Preencha os dados do cliente, serviço e valor');
      return;
    }

    setIsSendingCode(true);
    let currentClientId = selectedClient;

    try {
      if (!currentClientId) {
        // Automatically create client
        const newClient = await addClient.mutateAsync({
          name: clientName.trim(),
          phone: clientPhone,
          loyalty_stamps: 0,
          total_spent: 0,
          last_visit: new Date().toISOString()
        });
        currentClientId = newClient.id;
        setSelectedClient(currentClientId);
      }
    } catch (err: any) {
      popup.error(err.message || 'Erro ao cadastrar novo cliente automaticamente.');
      setIsSendingCode(false);
      return;
    }

    const price = parseCurrency(serviceValue);
    
    try {
      const result = await addCompletedService.mutateAsync({
        client_id: currentClientId,
        service_name: serviceName,
        service_price: price,
        barber_id: user?.barberId || null,
        loyalty_points: 0,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        validated: false,
      });

      const newEntry = {
        id: result.id,
        clientName: clientName,
        serviceName,
        servicePrice: price,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };

      setCompletedList(prev => [newEntry, ...prev]);
      setShowPin(false);
      setClientPhone('');
      setClientName('');
      setSelectedClient('');
      setServiceName('');
      setServiceValue('');
      setIsSendingCode(false);
      popup.success('Atendimento registrado sem pontos.');
    } catch (err: any) {
      setIsSendingCode(false);
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
          {/* Client Inputs (Phone + Name) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm uppercase tracking-ultra text-muted-foreground">Telefone (WhatsApp)</label>
              <input
                type="tel"
                value={clientPhone}
                onChange={handlePhoneChange}
                disabled={loadingClients}
                placeholder="(11) 99999-9999"
                className="w-full h-12 px-4 rounded-xl glass-input text-base text-foreground font-mono-tabular focus:outline-none bg-secondary disabled:opacity-50"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm uppercase tracking-ultra text-muted-foreground">Nome (Busca Automática)</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                disabled={!!selectedClient} // If a client matched the phone, name cannot be edited manually
                placeholder={!!selectedClient ? "Cliente encontrado" : "Nome do novo cliente"}
                className={`w-full h-12 px-4 rounded-xl glass-input text-base text-foreground focus:outline-none disabled:opacity-50 transition-colors ${!!selectedClient ? 'bg-primary/10 border-primary/20 text-primary font-medium' : 'bg-secondary'}`}
              />
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
            {barbershop?.loyalty_min_value > 0 && parseCurrency(serviceValue) > 0 && parseCurrency(serviceValue) < barbershop.loyalty_min_value && (
              <p className="text-[10px] text-orange-500 font-bold uppercase tracking-wider mt-1 ml-1 animate-pulse">
                ⚠️ Valor abaixo do mínimo (R$ {barbershop.loyalty_min_value.toFixed(2)}) para ganhar selo
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {/* Finalize Button (With PIN & Points) */}
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
              'Finalizar e Validar Pontos'
            )}
          </motion.button>
          
          {/* Register without Points Button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleRegisterWithoutPoints}
            disabled={isSendingCode}
            className="w-full h-14 rounded-xl border border-primary/20 text-primary text-base flex items-center justify-center hover:bg-primary/5 transition-colors disabled:opacity-50"
          >
            Registrar Sem Pontos
          </motion.button>
        </div>

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
        clientName={clientName}
        wasSentViaWhatsApp={wasSentViaWhatsApp}
        onSuccess={handleValidated}
        onClose={() => setShowPin(false)}
      />
    </div>
  );
};

export default RegisterPage;
