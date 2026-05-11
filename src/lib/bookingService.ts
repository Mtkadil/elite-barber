import { doc, getDocFromServer, collection, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firestore';
import type { Booking } from '../types';

/**
 * Tests Firebase connection on module load
 */
async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test-connection', 'status'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

// Initialize connection test
void testConnection();

export const bookingService = {
  /**
   * Creates a new booking in Firestore
   * @param bookingData - Booking information without auto-generated fields
   * @returns The ID of the created booking
   */
  async createBooking(
    bookingData: Omit<Booking, 'id' | 'status' | 'createdAt' | 'startTime' | 'endTime'> & { 
      startTime: Date; 
      endTime: Date;
    }
  ): Promise<string> {
    const bookingRef = doc(collection(db, 'bookings'));
    const path = `bookings/${bookingRef.id}`;
    
    try {
      const payload = {
        ...bookingData,
        status: 'pending' as const,
        startTime: Timestamp.fromDate(bookingData.startTime),
        endTime: Timestamp.fromDate(bookingData.endTime),
        createdAt: serverTimestamp(),
      };
      
      console.log('Sending Booking Payload:', payload);
      await setDoc(bookingRef, payload);
      return bookingRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      // This line is never reached due to handleFirestoreError throwing, 
      // but added for type safety
      throw error;
    }
  }
};
