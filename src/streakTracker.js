const fs = require('fs').promises;
const path = require('path');

class StreakTracker {
  constructor() {
    this.streakFile = path.join(process.cwd(), '.wtfdid-streaks.json');
  }

  async updateStreak(commits, files, events, targetDate) {
    try {
      const streakData = await this.loadStreakData();
      const dateStr = targetDate.toISOString().split('T')[0];
      
      // Check if today was productive
      const isProductiveDay = commits.length > 0 || files.length > 0 || events.length > 0;
      
      if (isProductiveDay) {
        streakData.activeDays.add(dateStr);
        streakData.totalActiveDays = streakData.activeDays.size;
        
        // Update current streak
        const yesterday = new Date(targetDate);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (streakData.activeDays.has(yesterdayStr) || streakData.currentStreak === 0) {
          streakData.currentStreak++;
        } else {
          streakData.currentStreak = 1;
        }
        
        // Update longest streak
        if (streakData.currentStreak > streakData.longestStreak) {
          streakData.longestStreak = streakData.currentStreak;
        }
        
        streakData.lastActiveDate = dateStr;
      }
      
      await this.saveStreakData(streakData);
      return streakData;
      
    } catch (error) {
      console.warn('Streak tracking failed:', error.message);
      return this.getDefaultStreakData();
    }
  }

  async getStreakInfo() {
    try {
      const streakData = await this.loadStreakData();
      
      // Check if streak is broken
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const todayStr = today.toISOString().split('T')[0];
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (!streakData.activeDays.has(todayStr) && 
          !streakData.activeDays.has(yesterdayStr) && 
          streakData.lastActiveDate !== todayStr) {
        // Streak might be broken, but let's be forgiving for weekends
        const daysSinceLastActive = this.daysBetween(new Date(streakData.lastActiveDate), today);
        if (daysSinceLastActive > 3) {
          streakData.currentStreak = 0;
        }
      }
      
      return streakData;
    } catch (error) {
      return this.getDefaultStreakData();
    }
  }

  async loadStreakData() {
    try {
      const data = await fs.readFile(this.streakFile, 'utf8');
      const parsed = JSON.parse(data);
      
      // Convert activeDays array back to Set
      parsed.activeDays = new Set(parsed.activeDays || []);
      
      return {
        currentStreak: parsed.currentStreak || 0,
        longestStreak: parsed.longestStreak || 0,
        totalActiveDays: parsed.totalActiveDays || 0,
        activeDays: parsed.activeDays,
        lastActiveDate: parsed.lastActiveDate || null
      };
    } catch (error) {
      return this.getDefaultStreakData();
    }
  }

  async saveStreakData(streakData) {
    const dataToSave = {
      ...streakData,
      activeDays: Array.from(streakData.activeDays) // Convert Set to Array for JSON
    };
    
    await fs.writeFile(this.streakFile, JSON.stringify(dataToSave, null, 2));
  }

  getDefaultStreakData() {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalActiveDays: 0,
      activeDays: new Set(),
      lastActiveDate: null
    };
  }

  daysBetween(date1, date2) {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round(Math.abs((date1 - date2) / oneDay));
  }

  formatStreakForPrompt(streakData) {
    if (streakData.currentStreak === 0) {
      return 'No current productivity streak. Time to start a new one!';
    }

    let message = `Current productivity streak: ${streakData.currentStreak} day${streakData.currentStreak > 1 ? 's' : ''}! `;
    
    if (streakData.currentStreak >= 7) {
      message += '🔥 You\'re on fire!';
    } else if (streakData.currentStreak >= 3) {
      message += '⭐ Great momentum!';
    } else {
      message += '💪 Keep it up!';
    }

    if (streakData.longestStreak > streakData.currentStreak) {
      message += ` (Personal best: ${streakData.longestStreak} days)`;
    }

    return message;
  }

  getStreakEmoji(streak) {
    if (streak >= 30) return '🏆';
    if (streak >= 14) return '🔥';
    if (streak >= 7) return '⭐';
    if (streak >= 3) return '💪';
    if (streak >= 1) return '✅';
    return '💤';
  }
}

module.exports = new StreakTracker();