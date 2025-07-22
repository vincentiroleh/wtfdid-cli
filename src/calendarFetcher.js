// Load environment variables from .env file
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const os = require('os');
const chalk = require('chalk');

class CalendarFetcher {
  constructor() {
    // Load configuration from multiple sources (priority order)
    const config = this.loadConfiguration();
    this.apiKey = config.googleApiKey;
    this.calendarId = config.googleCalendarId;
  }

  loadConfiguration() {
    // Priority order: env vars > global config > built-in shared key
    let config = {
      // Built-in shared API key for public calendars (limited usage, rate-limited)
      googleApiKey: 'AIzaSyDjgMwGILlFrHpDARQyBl-mHLUh0X9Jv7Y',
      googleCalendarId: 'primary' // Default to user's primary calendar
    };
    
    // 1. Try global config file first
    try {
      const globalConfigPath = path.join(os.homedir(), '.wtfdid-config.json');
      if (fs.existsSync(globalConfigPath)) {
        const globalConfig = JSON.parse(fs.readFileSync(globalConfigPath, 'utf8'));
        config = { ...config, ...globalConfig };
      }
    } catch (error) {
      // Ignore global config errors
    }
    
    // 2. Environment variables override global config
    if (process.env.GOOGLE_API_KEY) {
      config.googleApiKey = process.env.GOOGLE_API_KEY;
    }
    if (process.env.GOOGLE_CALENDAR_ID) {
      config.googleCalendarId = process.env.GOOGLE_CALENDAR_ID;
    }
    
    return config;
  }

  async getTodaysEvents(targetDate = new Date()) {
    try {
      if (!this.apiKey) {
        if (this.isFirstRun()) {
          console.log(chalk.yellow('📅 Google Calendar API key not found. Run: wtfdid --setup-google'));
        }
        return [];
      }
      
      // If no calendar ID is provided, try to detect the user's email
      if (!this.calendarId) {
        this.calendarId = await this.detectUserEmail() || 'primary';
      }
      
      return await this.getEventsWithApiKey(targetDate, this.apiKey, this.calendarId);

    } catch (error) {
      console.warn('Calendar fetch failed:', error.message);
      return [];
    }
  }
  
  async detectUserEmail() {
    try {
      // Try to detect user's email from git config
      const { execSync } = require('child_process');
      const email = execSync('git config --get user.email', { encoding: 'utf8' }).trim();
      return email || null;
    } catch (error) {
      return null;
    }
  }

  isFirstRun() {
    // Only show setup message once per session
    if (!this._hasShownSetupMessage) {
      this._hasShownSetupMessage = true;
      return true;
    }
    return false;
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
      if (!this.apiKey || !this.calendarId) {
        return { 
          success: false, 
          error: 'Google Calendar not configured. Run: wtfdid --setup-google' 
        };
      }

      // Test by fetching today's events
      const events = await this.getTodaysEvents();
      
      return { 
        success: true, 
        calendars: 1,
        events: events.length,
        calendarId: this.calendarId
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getConfigStatus() {
    const globalConfigPath = path.join(os.homedir(), '.wtfdid-config.json');
    const hasGlobalConfig = fs.existsSync(globalConfigPath);
    const hasEnvVars = !!(process.env.GOOGLE_API_KEY && process.env.GOOGLE_CALENDAR_ID);
    
    return {
      configured: !!(this.apiKey && this.calendarId),
      globalConfig: hasGlobalConfig,
      envVars: hasEnvVars,
      configPath: globalConfigPath
    };
  }
}

module.exports = new CalendarFetcher();