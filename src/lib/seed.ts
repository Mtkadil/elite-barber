import { doc, writeBatch } from 'firebase/firestore';
import { db } from './firestore';
import type { Shop, Barber, Service } from '../types';
import { SHOPS, BARBERS, SERVICES } from '../constants';

/**
 * Seeds the database with initial shop, barber, and service data
 */
export async function seedDatabase(): Promise<void> {
  const batch = writeBatch(db);

  // Seed Shops
  SHOPS.forEach(shop => {
    const ref = doc(db, 'shops', shop.id);
    batch.set(ref, {
      name: shop.name,
      address: shop.address,
      image: shop.image
    });
  });

  // Seed Barbers
  BARBERS.forEach(barber => {
    const ref = doc(db, `shops/${barber.shopId}/barbers`, barber.id);
    batch.set(ref, {
      name: barber.name,
      specialty: barber.specialty,
      avatar: barber.avatar,
      calendarId: barber.calendarId
    });
  });

  // Seed Services
  SERVICES.forEach(service => {
    const ref = doc(db, 'services', service.id);
    batch.set(ref, {
      name: service.name,
      price: service.price,
      duration: service.duration,
      category: service.category
    });
  });

  await batch.commit();
  console.log('Database seeded successfully');
}
