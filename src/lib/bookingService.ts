import { doc, getDocFromServer, collection, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firestore';
import { Booking } from '../types';

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test-connection', 'status'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

export const bookingService = {
  async createBooking(bookingData: Omit<Booking, 'id' | 'status' | 'createdAt' | 'startTime' | 'endTime'> & { startTime: Date, endTime: Date }) {
    const bookingRef = doc(collection(db, 'bookings'));
    const path = `bookings/${bookingRef.id}`;
    
    try {
      const payload = {
        ...bookingData,
        status: 'pending',
        startTime: Timestamp.fromDate(bookingData.startTime),
        endTime: Timestamp.fromDate(bookingData.endTime),
        createdAt: serverTimestamp(),
      };
      
      console.log('Sending Booking Payload:', payload);
      await setDoc(bookingRef, payload);
      return bookingRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }
};
