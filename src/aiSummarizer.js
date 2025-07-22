const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class AISummarizer {
  constructor() {
    this.qConfigPath = path.join(process.cwd(), 'q-agent-config.json');
  }

  async generateSummary(commits, files, events, appCategories, streakData, targetDate) {
    // Create Q Developer agent config if it doesn't exist
    await this.ensureQConfig();
    
    const prompt = this.buildPrompt(commits, files, events, appCategories, streakData, targetDate);
    
    try {
      // Try Q Developer CLI first
      const summary = await this.callQDeveloper(prompt);
      return summary;
    } catch (error) {
      console.warn('Q Developer failed, using fallback summary:', error.message);
      // Generate a simple fallback summary
      return this.generateFallbackSummary(commits, files, events, appCategories, streakData, targetDate);
    }
  }

  async generateStandupSummary(commits, files, events, appCategories, streakData, targetDate) {
    // Create Q Developer agent config if it doesn't exist
    await this.ensureQConfig();
    
    const prompt = this.buildStandupPrompt(commits, files, events, appCategories, streakData, targetDate);
    
    try {
      // Try Q Developer CLI first
      const summary = await this.callQDeveloper(prompt);
      return summary;
    } catch (error) {
      console.warn('Q Developer failed, using fallback standup summary:', error.message);
      // Generate a simple fallback standup summary
      return this.generateFallbackStandupSummary(commits, files, events, appCategories, streakData, targetDate);
    }
  }

  buildPrompt(commits, files, events, appCategories, streakData, targetDate) {
    const dateStr = targetDate.toLocaleDateString();
    const fileStats = this.getFileStats(files);
    const calendarStats = this.formatCalendarEvents(events);
    const appStats = this.formatAppsForPrompt(appCategories);
    const streakStats = this.formatStreakData(streakData);
    
    return `You're a witty but professional productivity assistant. Given the user's commits, files, calendar events, productivity streak, and activities, summarize their day in a fun and human way.

Be encouraging and slightly sarcastic if needed. Use relatable developer language. Include bullets and short paragraphs. Acknowledge their productivity streak if it's impressive. End with a fun line like "Now go eat. You earned it." or "Well played, Code Wizard."

Date: ${dateStr}

Git Commits (${commits.length} total):
${commits.map(c => `- ${c.hash}: "${c.message}" by ${c.author}`).join('\n')}

Files Modified (${files.length} total):
${fileStats}

Recent Files:
${files.slice(0, 10).map(f => `- ${f.path} (${f.extension})`).join('\n')}

Calendar Events:
${calendarStats}

Applications Used:
${appStats}

Productivity Streak:
${streakStats}

Generate a fun, encouraging daily summary that makes the developer feel good about their work, acknowledges their streak, and celebrates their coding, meetings, AND the tools they used to get stuff done!`;
  }

  async callQDeveloper(prompt) {
    return new Promise((resolve, reject) => {
      // Use Q Developer CLI with correct syntax: --model claude-3.5-sonnet --no-interactive
      const qProcess = spawn('q', ['chat', '--model', 'claude-3.5-sonnet', '--no-interactive', prompt], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let error = '';

      qProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      qProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      qProcess.on('close', (code) => {
        if (code === 0 && output.trim()) {
          // Clean up the output - extract just the AI response
          const cleanOutput = this.extractQResponse(output);
          resolve(cleanOutput);
        } else {
          reject(new Error(`Q Developer CLI failed (exit code ${code}): ${error || 'Unknown error'}`));
        }
      });

      qProcess.on('error', (err) => {
        reject(new Error(`Failed to start Q Developer CLI: ${err.message}`));
      });

      // Increase timeout to 30 seconds for Q Developer
      const timeout = setTimeout(() => {
        qProcess.kill('SIGTERM');
        reject(new Error('Q Developer CLI timeout - response took too long (30s limit)'));
      }, 30000);

      // Clear timeout if process completes normally
      qProcess.on('close', () => {
        clearTimeout(timeout);
      });
    });
  }

  extractQResponse(rawOutput) {
    // Remove ANSI color codes and escape sequences
    let cleaned = rawOutput.replace(/\x1b\[[0-9;]*[mGKH]/g, '');
    
    // Find the actual AI response after the ">" prompt indicator
    const responseMatch = cleaned.match(/>\s*(.*?)$/s);
    if (responseMatch) {
      return responseMatch[1].trim();
    }
    
    // Look for content after the model indicator line
    const modelMatch = cleaned.match(/🤖.*?claude-3\.5-sonnet\s*\n\n(.*?)$/s);
    if (modelMatch) {
      return modelMatch[1].trim();
    }
    
    // Try to find content after the separator line
    const separatorMatch = cleaned.match(/━+\s*\n🤖.*?\n\n(.*?)$/s);
    if (separatorMatch) {
      return separatorMatch[1].trim();
    }
    
    // Split by lines and find the response content
    const lines = cleaned.split('\n');
    let responseStarted = false;
    let responseLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip ASCII art, headers, and UI elements
      if (line.includes('⢠⣶⣶⣦') || line.includes('╭─') || line.includes('│') || 
          line.includes('/help') || line.includes('━━━') || 
          line.includes('Did you know?') || line.trim() === '') {
        continue;
      }
      
      // Start collecting response after model indicator
      if (line.includes('🤖') && line.includes('claude-3.5-sonnet')) {
        responseStarted = true;
        continue;
      }
      
      // Collect response lines
      if (responseStarted && line.trim() !== '') {
        // Skip the ">" prompt line
        if (line.trim() === '>') {
          continue;
        }
        responseLines.push(line);
      }
    }
    
    if (responseLines.length > 0) {
      return responseLines.join('\n').trim();
    }
    
    // Last resort: return cleaned output
    return cleaned.trim();
  }

  async ensureQConfig() {
    try {
      await fs.access(this.qConfigPath);
    } catch {
      // Create basic Q agent config
      const config = {
        "name": "wtfdid-summarizer",
        "description": "Daily productivity summary agent for AWS Q Developer Challenge",
        "instructions": "You are a witty productivity assistant that helps developers understand what they accomplished each day. Be encouraging, slightly sarcastic, and use developer-friendly language. Always end with an encouraging line like 'Now go eat. You earned it!' or 'Well played, Code Wizard!'",
        "model": "claude-3.5-sonnet"
      };
      
      await fs.writeFile(this.qConfigPath, JSON.stringify(config, null, 2));
    }
  }

  async testQDeveloper(testPrompt) {
    try {
      const result = await this.callQDeveloper(testPrompt);
      return {
        success: true,
        output: result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  formatCalendarEvents(events) {
    if (!events || events.length === 0) {
      return 'No calendar events today (or calendar not connected).';
    }

    let formatted = `${events.length} calendar events:\n`;
    
    events.forEach(event => {
      const time = event.isAllDay ? 'All day' : 
        new Date(event.start).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
      
      formatted += `  • ${time}: "${event.title}" (${event.duration})`;
      if (event.attendees > 0) {
        formatted += ` - ${event.attendees} attendees`;
      }
      formatted += '\n';
    });

    return formatted;
  }

  formatAppsForPrompt(appCategories) {
    if (!appCategories || Object.keys(appCategories).length === 0) {
      return 'No app usage data available.';
    }

    const totalApps = Object.values(appCategories).flat().length;
    if (totalApps === 0) {
      return 'No applications tracked today.';
    }

    let formatted = `${totalApps} applications used across categories:\n`;
    
    Object.entries(appCategories).forEach(([category, apps]) => {
      if (apps.length > 0) {
        formatted += `\n${category.charAt(0).toUpperCase() + category.slice(1)} (${apps.length}):\n`;
        apps.slice(0, 5).forEach(app => {
          formatted += `  • ${app.name}`;
          if (app.windowTitle && app.windowTitle !== app.name) {
            formatted += ` (${app.windowTitle})`;
          }
          formatted += '\n';
        });
        
        if (apps.length > 5) {
          formatted += `  • ...and ${apps.length - 5} more ${category} apps\n`;
        }
      }
    });

    return formatted;
  }

  generateFallbackSummary(commits, files, events, appCategories, streakData, targetDate) {
    const dateStr = targetDate.toLocaleDateString();
    const fileStats = this.getFileStats(files);
    
    let summary = `🗓️ **Daily Summary for ${dateStr}**\n\n`;
    
    // Git activity
    if (commits.length > 0) {
      summary += `📝 **Git Activity** (${commits.length} commit${commits.length > 1 ? 's' : ''})\n`;
      commits.slice(0, 5).forEach(commit => {
        summary += `  • ${commit.hash}: "${commit.message}"\n`;
      });
      if (commits.length > 5) {
        summary += `  • ...and ${commits.length - 5} more commits\n`;
      }
      summary += '\n';
    }
    
    // File changes
    if (files.length > 0) {
      summary += `📁 **File Changes** (${files.length} file${files.length > 1 ? 's' : ''} modified)\n`;
      summary += fileStats + '\n\n';
      
      summary += '**Recent files you touched:**\n';
      files.slice(0, 8).forEach(file => {
        summary += `  • ${file.path}\n`;
      });
      if (files.length > 8) {
        summary += `  • ...and ${files.length - 8} more files\n`;
      }
      summary += '\n';
    }
    
    // Calendar events
    if (events && events.length > 0) {
      summary += `🗓️ **Calendar Events** (${events.length} event${events.length > 1 ? 's' : ''})\n`;
      events.slice(0, 5).forEach(event => {
        const time = event.isAllDay ? 'All day' : 
          new Date(event.start).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          });
        summary += `  • ${time}: "${event.title}" (${event.duration})\n`;
      });
      if (events.length > 5) {
        summary += `  • ...and ${events.length - 5} more events\n`;
      }
      summary += '\n';
    }
    
    // App usage
    if (appCategories && Object.keys(appCategories).length > 0) {
      const totalApps = Object.values(appCategories).flat().length;
      if (totalApps > 0) {
        summary += `💻 **Applications Used** (${totalApps} app${totalApps > 1 ? 's' : ''} across categories)\n`;
        Object.entries(appCategories).forEach(([category, apps]) => {
          if (apps.length > 0) {
            summary += `  • ${category.charAt(0).toUpperCase() + category.slice(1)}: ${apps.slice(0, 3).map(app => app.name).join(', ')}`;
            if (apps.length > 3) {
              summary += ` (+${apps.length - 3} more)`;
            }
            summary += '\n';
          }
        });
        summary += '\n';
      }
    }
    
    // Productivity streak
    if (streakData && streakData.currentStreak > 0) {
      const streakEmoji = streakData.currentStreak >= 7 ? '🔥' : 
                         streakData.currentStreak >= 3 ? '⭐' : '💪';
      summary += `${streakEmoji} **Productivity Streak**: ${streakData.currentStreak} day${streakData.currentStreak > 1 ? 's' : ''}!\n\n`;
    }
    
    // Encouraging message
    const encouragements = [
      "Well played today, boss. Time to celebrate with your favorite beverage! 🍺",
      "Solid work today! You're making progress, one commit at a time. 🚀",
      "Another productive day in the books. You're building something great! ⭐",
      "Nice hustle today! Your future self will thank you. 💪",
      "Good stuff today! Keep the momentum going, Code Wizard! ✨"
    ];
    
    const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
    summary += randomEncouragement;
    
    return summary;
  }

  formatStreakData(streakData) {
    if (!streakData || streakData.currentStreak === 0) {
      return 'No current productivity streak. Today could be the start of something great!';
    }

    let formatted = `Current streak: ${streakData.currentStreak} day${streakData.currentStreak > 1 ? 's' : ''}! `;
    
    if (streakData.currentStreak >= 7) {
      formatted += '🔥 On fire!';
    } else if (streakData.currentStreak >= 3) {
      formatted += '⭐ Great momentum!';
    } else {
      formatted += '💪 Building habits!';
    }

    if (streakData.longestStreak > streakData.currentStreak) {
      formatted += ` (Personal best: ${streakData.longestStreak} days)`;
    }

    formatted += `\nTotal productive days: ${streakData.totalActiveDays}`;

    return formatted;
  }

  buildStandupPrompt(commits, files, events, appCategories, streakData, targetDate) {
    const dateStr = targetDate.toLocaleDateString();
    const fileStats = this.getFileStats(files);
    const calendarStats = this.formatCalendarEvents(events);
    const appStats = this.formatAppsForPrompt(appCategories);
    const streakStats = this.formatStreakData(streakData);
    
    return `You're a professional standup assistant. Generate a concise, professional daily standup summary that a developer can use in their team meeting.

Format it as a proper standup with these sections:
1. What I accomplished yesterday/today
2. What I'm working on next
3. Any blockers or challenges

Be professional but personable. Focus on concrete accomplishments and technical work. Keep it concise but informative.

Date: ${dateStr}

Git Commits (${commits.length} total):
${commits.map(c => `- ${c.hash}: "${c.message}" by ${c.author}`).join('\n')}

Files Modified (${files.length} total):
${fileStats}

Recent Files:
${files.slice(0, 10).map(f => `- ${f.path} (${f.extension})`).join('\n')}

Calendar Events:
${calendarStats}

Applications Used:
${appStats}

Productivity Streak:
${streakStats}

Generate a professional standup summary that highlights key accomplishments, technical work, and sets up what's coming next. Make it something a developer would be proud to share with their team!`;
  }

  generateFallbackStandupSummary(commits, files, events, appCategories, streakData, targetDate) {
    const dateStr = targetDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    let summary = `## 📅 Daily Standup - ${dateStr}\n\n`;
    
    // What I accomplished
    summary += `### 🎯 What I Accomplished:\n\n`;
    
    if (commits.length > 0) {
      summary += `**Development Work:**\n`;
      commits.slice(0, 5).forEach(commit => {
        const cleanMessage = commit.message
          .replace(/^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?:\s*/i, '')
          .replace(/^\w+\s*[-:]\s*/, '')
          .trim();
        summary += `• ${cleanMessage}\n`;
      });
      if (commits.length > 5) {
        summary += `• ...and ${commits.length - 5} more commits\n`;
      }
      summary += '\n';
    }
    
    if (files.length > 0) {
      const fileStats = this.getFileStats(files);
      summary += `**Files Modified:** ${files.length} files\n`;
      summary += fileStats.replace(/  • /g, '• ') + '\n\n';
    }
    
    if (events && events.length > 0) {
      summary += `**Meetings & Collaboration:**\n`;
      events.slice(0, 3).forEach(event => {
        const time = event.isAllDay ? 'All day' : 
          new Date(event.start).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          });
        summary += `• ${time}: ${event.title}\n`;
      });
      summary += '\n';
    }
    
    // What's next
    summary += `### 🎯 What I'm Working On Next:\n`;
    summary += `• Continue current development tasks\n`;
    summary += `• Address any code review feedback\n`;
    summary += `• Focus on upcoming sprint goals\n\n`;
    
    // Blockers
    summary += `### 🚧 Blockers/Challenges:\n`;
    summary += `• None at the moment\n\n`;
    
    // Productivity note
    if (streakData && streakData.currentStreak >= 3) {
      const streakEmoji = streakData.currentStreak >= 7 ? '🔥' : '⭐';
      summary += `### ${streakEmoji} Productivity Update:\n`;
      summary += `• Maintaining ${streakData.currentStreak}-day productivity streak\n\n`;
    }
    
    summary += `---\n*Generated by wtfdid CLI*`;
    
    return summary;
  }

  getFileStats(files) {
    const stats = {};
    files.forEach(file => {
      const ext = file.extension || 'no extension';
      stats[ext] = (stats[ext] || 0) + 1;
    });
    
    return Object.entries(stats)
      .map(([ext, count]) => `  • ${ext}: ${count} file${count > 1 ? 's' : ''}`)
      .join('\n');
  }
}

module.exports = new AISummarizer();