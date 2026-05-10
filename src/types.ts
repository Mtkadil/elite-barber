export interface Shop {
  id: string;
  name: string;
  address: string;
  image: string;
}

export interface Barber {
  id: string;
  shopId: string;
  name: string;
  specialty: string;
  avatar: string;
  calendarId: string;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number; // in minutes
  category: 'hair' | 'beard' | 'combo';
}

export interface Booking {
  id: string;
  shopId: string;
  barberId: string;
  serviceId: string;
  customerName: string;
  customerPhone: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  status: 'pending' | 'confirmed' | 'cancelled';
}
