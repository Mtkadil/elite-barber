
import { format } from 'date-fns';

export interface CalendarEvent {
  start: string;
  end: string;
}

export const calendarService = {
  async getBusySlots(calendarId: string, date: Date): Promise<CalendarEvent[]> {
    try {
      const timeMin = new Date(date);
      timeMin.setHours(0, 0, 0, 0);
      const timeMax = new Date(date);
      timeMax.setHours(23, 59, 59, 999);

      const params = new URLSearchParams({
        calendarId,
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
      });

      const response = await fetch(`/api/calendar/busy?${params}`);
      if (!response.ok) throw new Error('Failed to fetch busy slots');
      
      const data = await response.json();
      return data.busySlots || [];
    } catch (error) {
      console.error('Calendar Fetch Error:', error);
      return [];
    }
  },

  async createBookingEvent(params: {
    calendarId: string;
    summary: string;
    description: string;
    start: Date;
    end: Date;
  }) {
    try {
      const response = await fetch('/api/calendar/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calendarId: params.calendarId,
          summary: params.summary,
          description: params.description,
          start: params.start.toISOString(),
          end: params.end.toISOString(),
        }),
      });

      if (!response.ok) throw new Error('Failed to create calendar event');
      return await response.json();
    } catch (error) {
      console.error('Calendar Create Error:', error);
      throw error;
    }
  }
};
