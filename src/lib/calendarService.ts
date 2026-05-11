export interface CalendarEvent {
  start: string;
  end: string;
}

export const calendarService = {
  /**
   * Fetches busy time slots from Google Calendar for a specific date
   * @param calendarId - The Google Calendar ID to query
   * @param date - The date to check for availability
   * @returns Array of busy time slots
   */
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

  /**
   * Creates a booking event in Google Calendar
   * @param params - Event creation parameters
   * @returns The created event data
   */
  async createBookingEvent(params: {
    calendarId: string;
    summary: string;
    description: string;
    start: Date;
    end: Date;
  }): Promise<void> {
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
  },

  /**
   * Retrieves the Google OAuth authorization URL
   * @returns The authorization URL
   */
  async getAuthUrl(): Promise<string> {
    const response = await fetch('/api/auth/google/url');
    const data = await response.json();
    return data.url;
  }
};
