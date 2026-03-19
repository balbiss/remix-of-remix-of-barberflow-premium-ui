export interface Service {
  id: string;
  name: string;
  price: number;
}

export interface CompletedService {
  id: string;
  clientName: string;
  serviceName: string;
  servicePrice: number;
  barberId: string;
  barberName: string;
  date: string;
  time: string;
  validated: boolean;
  loyaltyPoints: number;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  loyaltyStamps: number;
  totalSpent: number;
  lastVisit: string;
}

export interface Barber {
  id: string;
  name: string;
  phone: string;
  email: string;
  commission: number;
  active: boolean;
}

// Sugestões de serviços mais comuns (sem preço fixo)
export const serviceSuggestions: string[] = [
  'Corte',
  'Corte + Barba',
  'Barba',
  'Pigmentação',
  'Hidratação',
  'Sobrancelha',
  'Platinado',
  'Relaxamento',
];

export const mockClients: Client[] = [
  { id: 'c1', name: 'João Pedro', phone: '(11) 99999-1234', loyaltyStamps: 7, totalSpent: 1250, lastVisit: '2026-03-15' },
  { id: 'c2', name: 'Felipe Santos', phone: '(11) 98888-5678', loyaltyStamps: 3, totalSpent: 680, lastVisit: '2026-03-14' },
  { id: 'c3', name: 'André Costa', phone: '(11) 97777-9012', loyaltyStamps: 10, totalSpent: 2100, lastVisit: '2026-03-12' },
  { id: 'c4', name: 'Bruno Oliveira', phone: '(11) 96666-3456', loyaltyStamps: 1, totalSpent: 170, lastVisit: '2026-03-10' },
  { id: 'c5', name: 'Lucas Mendes', phone: '(11) 95555-7890', loyaltyStamps: 5, totalSpent: 950, lastVisit: '2026-03-16' },
];

export const mockBarbers: Barber[] = [
  { id: '2', name: 'Carlos Silva', phone: '(11) 91111-1111', email: 'carlos@email.com', commission: 45, active: true },
  { id: '3', name: 'Pedro Lima', phone: '(11) 92222-2222', email: 'pedro@email.com', commission: 45, active: true },
  { id: '4', name: 'Rafael Souza', phone: '(11) 93333-3333', email: 'rafael@email.com', commission: 40, active: true },
];

export const mockCompletedServices: CompletedService[] = [
  { id: 'cs1', clientName: 'João Pedro', serviceName: 'Corte + Barba', servicePrice: 85, barberId: '2', barberName: 'Carlos Silva', date: '2026-03-17', time: '09:30', validated: true, loyaltyPoints: 1 },
  { id: 'cs2', clientName: 'Felipe Santos', serviceName: 'Corte', servicePrice: 55, barberId: '2', barberName: 'Carlos Silva', date: '2026-03-17', time: '10:15', validated: true, loyaltyPoints: 1 },
  { id: 'cs3', clientName: 'André Costa', serviceName: 'Pigmentação', servicePrice: 130, barberId: '3', barberName: 'Pedro Lima', date: '2026-03-17', time: '11:00', validated: true, loyaltyPoints: 1 },
  { id: 'cs4', clientName: 'Lucas Mendes', serviceName: 'Corte + Barba', servicePrice: 90, barberId: '2', barberName: 'Carlos Silva', date: '2026-03-17', time: '14:00', validated: true, loyaltyPoints: 1 },
];

export const teamMembers = [
  { id: '2', name: 'Carlos Silva', commission: 45, todayRevenue: 395, todayServices: 3 },
  { id: '3', name: 'Pedro Lima', commission: 45, todayRevenue: 240, todayServices: 2 },
  { id: '4', name: 'Rafael Souza', commission: 40, todayRevenue: 165, todayServices: 2 },
];

export const weeklyRevenue = [
  { day: 'Seg', value: 1200 },
  { day: 'Ter', value: 980 },
  { day: 'Qua', value: 1450 },
  { day: 'Qui', value: 1100 },
  { day: 'Sex', value: 1800 },
  { day: 'Sáb', value: 2200 },
  { day: 'Dom', value: 0 },
];
