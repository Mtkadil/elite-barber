/**
 * Represents a barber shop location
 */
export interface Shop {
  id: string;
  name: string;
  address: string;
  image: string;
}

/**
 * Represents a barber working at a shop
 */
export interface Barber {
  id: string;
  shopId: string;
  name: string;
  specialty: string;
  avatar: string;
  calendarId: string;
}

/**
 * Represents a service offered by the barber shop
 */
export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number; // in minutes
  category: 'hair' | 'beard' | 'combo';
}

/**
 * Represents a customer booking
 */
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
  createdAt?: string; // Optional timestamp
}
