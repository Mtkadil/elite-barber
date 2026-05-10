import { Shop, Barber, Service } from './types';

export const SHOPS: Shop[] = [
  {
    id: 'shop-1',
    name: 'Elite Barber - Milano Centro',
    address: 'Via Montenapoleone, 15, Milano',
    image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'shop-2',
    name: 'Elite Barber - Isola District',
    address: 'Via Gaetano de Castillia, 20, Milano',
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'shop-3',
    name: 'Elite Barber - Navigli',
    address: 'Alzaia Naviglio Grande, 4, Milano',
    image: 'https://images.unsplash.com/photo-1621605815841-aa33c5ee7b2c?q=80&w=800&auto=format&fit=crop'
  }
];

export const SERVICES: Service[] = [
  { id: 's1', name: 'Taglio Classico', price: 30, duration: 30, category: 'hair' },
  { id: 's2', name: 'Rasatura Completa', price: 25, duration: 40, category: 'beard' },
  { id: 's3', name: 'Taglio & Barba Premium', price: 50, duration: 60, category: 'combo' },
  { id: 's4', name: 'Trattamento Viso Relax', price: 20, duration: 15, category: 'beard' }
];

export const BARBERS: Barber[] = [
  // Shop 1
  { id: 'b1', shopId: 'shop-1', name: 'Marco (Master)', specialty: 'Tagli Classici', avatar: 'https://i.pravatar.cc/150?u=b1', calendarId: 'barber1_shop1@gmail.com' },
  { id: 'b2', shopId: 'shop-1', name: 'Luca', specialty: 'Fade & Styles', avatar: 'https://i.pravatar.cc/150?u=b2', calendarId: 'barber2_shop1@gmail.com' },
  // Shop 2
  { id: 'b3', shopId: 'shop-2', name: 'Matteo', specialty: 'Barba & Grooming', avatar: 'https://i.pravatar.cc/150?u=b3', calendarId: 'barber1_shop2@gmail.com' },
  { id: 'b4', shopId: 'shop-2', name: 'Giovanni', specialty: 'Modern Haircuts', avatar: 'https://i.pravatar.cc/150?u=b4', calendarId: 'barber2_shop2@gmail.com' },
  // Shop 3
  { id: 'b5', shopId: 'shop-3', name: 'Alessandro', specialty: 'Old School', avatar: 'https://i.pravatar.cc/150?u=b5', calendarId: 'barber1_shop3@gmail.com' }
];
