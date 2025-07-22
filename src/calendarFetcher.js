// Load environment variables from .env file
require('dotenv').config();

class CalendarFetcher {
  constructor() {
    // Simple API key configuration
    this.apiKey = process.env.GOOGLE_API_KEY;
    this.calendarId = process.env.GOOGLE_CALENDAR_ID;
  }

  async getTodaysEvents(targetDate = new Date()) {
    try {
      const apiKey = process.env.GOOGLE_API_KEY;
      const calendarId = process.env.GOOGLE_CALENDAR_ID;
      
      if (!apiKey || !calendarId) {
        console.log('📅 Google Calendar: Set GOOGLE_API_KEY and GOOGLE_CALENDAR_ID in .env file.');
        return [];
      }
      
      return await this.getEventsWithApiKey(targetDate, apiKey, calendarId);

    } catch (error) {
      console.warn('Calendar fetch failed:', error.message);
      return [];
    }
  }



  async getEventsWithApiKey(targetDate, apiKey, calendarId) {
    try {
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Use direct HTTP request with API key
      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?` +
        `key=${apiKey}&` +
        `timeMin=${startOfDay.toISOString()}&` +
        `timeMax=${endOfDay.toISOString()}&` +
        `singleEvents=true&` +
        `orderBy=startTime&` +
        `maxResults=50`;

      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`📋 Calendar API Debug Info:`);
        console.log(`   URL: ${url.replace(apiKey, 'API_KEY_HIDDEN')}`);
        console.log(`   Status: ${response.status} ${response.statusText}`);
        console.log(`   Error: ${errorText}`);
        throw new Error(`Calendar API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const events = data.items || [];
      
      return events.map(event => ({
        title: event.summary || 'Untitled Event',
        start: event.start?.dateTime || event.start?.date,
        end: event.end?.dateTime || event.end?.date,
        duration: this.calculateDuration(event.start, event.end),
        location: event.location,
        attendees: event.attendees?.length || 0,
        isAllDay: !event.start?.dateTime
      }));

    } catch (error) {
      console.warn('API key calendar fetch failed:', error.message);
      return [];
    }
  }





  calculateDuration(start, end) {
    if (!start || !end) return 'Unknown duration';
    
    const startTime = new Date(start.dateTime || start.date);
    const endTime = new Date(end.dateTime || end.date);
    
    const diffMs = endTime - startTime;
    const diffMins = Math.round(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return `${diffMins}m`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
  }

  formatEventsForPrompt(events) {
    if (events.length === 0) {
      return 'No calendar events today.';
    }

    let formatted = `Calendar Events (${events.length} total):\n`;
    
    events.forEach(event => {
      const time = event.isAllDay ? 'All day' : 
        new Date(event.start).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
      
      formatted += `- ${time}: "${event.title}" (${event.duration})`;
      if (event.attendees > 0) {
        formatted += ` - ${event.attendees} attendees`;
      }
      formatted += '\n';
    });

    return formatted;
  }

  async testConnection() {
    try {
      const apiKey = process.env.GOOGLE_API_KEY;
      const calendarId = process.env.GOOGLE_CALENDAR_ID;
      
      if (!apiKey || !calendarId) {
        return { success: false, error: 'API key or calendar ID not configured' };
      }

      // Test by fetching today's events
      const events = await this.getTodaysEvents();
      
      return { 
        success: true, 
        calendars: 1,
        events: events.length
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = new CalendarFetcher();